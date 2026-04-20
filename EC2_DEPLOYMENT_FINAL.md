# EC2 Deployment Guide - TNAI-PM

## ✅ Pre-Deployment Checklist

### Application Status
- ✅ Build: Successful with zero errors
- ✅ Migration: 100% complete (Supabase → PostgreSQL)
- ✅ Database: Custom JWT authentication + PostgreSQL
- ✅ Type Safety: All TypeScript errors resolved
- ✅ API Endpoints: Created (deployment CRUD operations)

### System Requirements
Before deploying to EC2, you'll need:
- **EC2 Instance**: Ubuntu 22.04 LTS or later (t2.medium recommended)
- **Storage**: 20GB minimum (root volume)
- **Memory**: 2GB minimum RAM
- **Security Group**: Allow ports 80, 443, and 22 (SSH)

## 📋 Quick Start (5 Commands)

```bash
# 1. SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Clone and setup (automated)
cd /opt && \
git clone https://github.com/yourusername/tnai-pm.git && \
cd tnai-pm && \
chmod +x scripts/deploy_ec2.sh && \
./scripts/deploy_ec2.sh --env production

# 3. Application will be live at http://your-ec2-ip
```

## 🚀 Detailed Setup (Step-by-Step)

### Step 1: Launch EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click "Launch Instances"
3. Select **Ubuntu 22.04 LTS** (ami-0c55b159cbfafe1f0 or equivalent)
4. Choose **t2.medium** (or larger)
5. Configure Security Group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from 0.0.0.0/0
   - Allow HTTPS (port 443) from 0.0.0.0/0
   - Allow PostgreSQL (port 5432) from 0.0.0.0/0 (optional, for local connections)
6. Create/select existing key pair, download the .pem file
7. Launch the instance and wait for "running" status

### Step 2: Connect to Your Instance

```bash
# Make the key executable
chmod 400 your-key.pem

# SSH into the instance
ssh -i your-key.pem ubuntu@your-instance-public-ip
```

### Step 3: Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib postgresql-server-dev-15

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install SSL certificates tool (optional, for HTTPS)
sudo apt install -y certbot python3-certbot-nginx

# Verify installations
node --version    # v18.x or later
npm --version     # 9.x or later
psql --version    # PostgreSQL 15.x
nginx -v          # nginx/1.x
pm2 --version     # 5.x or later
```

### Step 4: Setup PostgreSQL Database

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Connect as postgres user
sudo -u postgres psql

# In psql prompt:
```

```sql
-- Create application user
CREATE USER tnai_user WITH PASSWORD 'strong_password_here';

-- Create database
CREATE DATABASE tnai_pm OWNER tnai_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tnai_pm TO tnai_user;

-- Exit psql
\q
```

### Step 5: Setup Application Code

```bash
# Create application directory
sudo mkdir -p /opt/tnai-pm
sudo chown ubuntu:ubuntu /opt/tnai-pm

# Clone the repository
cd /opt
git clone https://github.com/yourusername/tnai-pm.git
cd tnai-pm

# Install dependencies
npm install

# Create .env file with production variables (see below)
nano .env

# Build application
npm run build

# Test build worked
ls -la .next/
```

### Step 6: Configure Environment Variables

Create `.env` file in application root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm
DB_USER=tnai_user
DB_PASSWORD=strong_password_here

# JWT Configuration (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_secret_here

# Node Environment
NODE_ENV=production

# Application URL (for CORS and redirects)
NEXT_PUBLIC_APP_URL=http://your-ec2-public-ip

# Email (optional, for future use)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
# Copy the output to JWT_SECRET in .env
```

### Step 7: Run Database Migrations

```bash
# Navigate to app directory
cd /opt/tnai-pm

# Run initial schema migration
psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql

# Run custom auth migration
psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql

# Verify tables were created
psql -U tnai_user -d tnai_pm -c "\dt"
```

### Step 8: Create Initial Admin User

```bash
# Generate password hash (bcrypt)
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('initial_password_123', 10, (err, hash) => {
  console.log('Password hash:', hash);
});
"
```

```bash
# Connect to database
psql -U tnai_user -d tnai_pm

# Insert admin user (paste the hash from above)
```

```sql
INSERT INTO profiles (id, email, full_name, role, password_hash, created_at)
VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin@example.com',
  'Administrator',
  'management',
  'paste_bcrypt_hash_here',
  NOW()
);

-- Verify
SELECT id, email, full_name, role FROM profiles LIMIT 5;
```

### Step 9: Start Application with PM2

```bash
# Navigate to app directory
cd /opt/tnai-pm

# Start application
pm2 start npm --name "tnai-pm" -- start

# Save PM2 configuration to restart on reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Verify it's running
pm2 status
pm2 logs tnai-pm
```

### Step 10: Configure Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/tnai-pm`:

```bash
sudo nano /etc/nginx/sites-available/tnai-pm
```

Paste this configuration:

```nginx
upstream tnai_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-ec2-public-ip;
    client_max_body_size 10M;

    location / {
        proxy_pass http://tnai_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/tnai-pm /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify it's running
sudo systemctl status nginx
```

### Step 11: Test the Application

```bash
# Test Nginx is proxying correctly
curl http://localhost/auth/login

# Check application logs
pm2 logs tnai-pm

# View PM2 monitoring
pm2 monit
```

Your application should now be accessible at: **http://your-ec2-public-ip**

### Step 12: Setup HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name pointing to your EC2 IP)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal check
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

Update Nginx to redirect HTTP → HTTPS:

```bash
sudo nano /etc/nginx/sites-available/tnai-pm
```

Add before the `server` block:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🔐 Security Recommendations

### 1. Firewall (Security Groups)
```
Inbound Rules:
- SSH (22): Your IP only
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
```

### 2. SSH Key Management
```bash
# Never commit the .pem file
# Store securely (encrypted drive)
# Rotate keys periodically
# One key per environment
```

### 3. Database Security
```bash
# Change default passwords
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'strong_password';"

# Backup your database regularly
pg_dump -U tnai_user -d tnai_pm > backup.sql

# Test restoration
psql -U tnai_user -d tnai_pm < backup.sql
```

### 4. Keep System Updated
```bash
# Set up unattended upgrades
sudo apt install -y unattended-upgrades

# Check for updates
sudo apt list --upgradable

# Install updates
sudo apt upgrade -y
```

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
# View all processes
pm2 status

# View detailed logs
pm2 logs tnai-pm --lines 100

# Real-time monitoring
pm2 monit

# Memory/CPU usage
pm2 show tnai-pm
```

### Check Database Status
```bash
# Connect to database
psql -U tnai_user -d tnai_pm

# Check connection count
SELECT datname, usename, client_addr, state FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('tnai_pm'));

# Exit
\q
```

### Check Nginx Status
```bash
# View active connections
sudo netstat -tulpn | grep nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### View System Resources
```bash
# CPU and Memory
htop

# Disk usage
df -h

# Running processes
ps aux | grep node
```

## 🔄 Deployment Updates

When you push updates to your repository:

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to app directory
cd /opt/tnai-pm

# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart tnai-pm

# View logs to confirm
pm2 logs tnai-pm
```

Or use a single command:

```bash
pm2 restart tnai-pm; cd /opt/tnai-pm && git pull && npm install && npm run build && pm2 restart tnai-pm
```

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs tnai-pm --err

# Rebuild from scratch
cd /opt/tnai-pm
rm -rf .next node_modules
npm install
npm run build
pm2 restart tnai-pm
```

### Database Connection Error
```bash
# Test connection
psql -U tnai_user -h localhost -d tnai_pm -c "SELECT 1"

# Check .env variables
cat .env | grep DB_

# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx 502 Bad Gateway
```bash
# Check if Node app is running
pm2 status

# Check if listening on 3000
sudo netstat -tulpn | grep 3000

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in PM2 (requires code change)
```

### High Memory Usage
```bash
# Clear PM2 logs
pm2 flush

# Restart application
pm2 restart tnai-pm

# Monitor memory
pm2 monit
```

## 📈 Performance Optimization

### 1. Enable Gzip Compression
```bash
sudo nano /etc/nginx/nginx.conf

# Add inside http block:
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;

sudo systemctl restart nginx
```

### 2. Add Caching Headers
```bash
# Ensure .env has compression settings
# Add to Nginx config above
```

### 3. Database Query Optimization
```bash
# Check slow queries
psql -U tnai_user -d tnai_pm

SET log_min_duration_statement = 1000;  -- Log queries > 1s
```

## 🔗 Important URLs & Paths

| Item | Location |
|------|----------|
| Application | `/opt/tnai-pm` |
| Nginx Config | `/etc/nginx/sites-available/tnai-pm` |
| PM2 Logs | `/home/ubuntu/.pm2/logs/` |
| PostgreSQL | `localhost:5432` |
| Application | `http://your-ec2-ip:3000` (internal) |
| Public Access | `http://your-ec2-ip` (via Nginx) |
| Database User | `tnai_user` |
| Database Name | `tnai_pm` |

## ✅ Post-Deployment Verification

```bash
# 1. Test application is accessible
curl http://your-ec2-ip/auth/login

# 2. Test API endpoint
curl http://your-ec2-ip/api/deployments

# 3. Check SSL (if using HTTPS)
curl --insecure https://your-ec2-ip

# 4. View application logs
pm2 logs tnai-pm

# 5. Check database connection
psql -U tnai_user -d tnai_pm -c "SELECT COUNT(*) FROM profiles"

# 6. Monitor resources
htop
```

## 📞 Support & Emergency Procedures

### Application Crash Recovery
```bash
# Restart immediately
pm2 restart tnai-pm

# If that fails, full restart
pm2 delete tnai-pm
pm2 start npm --name "tnai-pm" -- start

# Manually restart without PM2
cd /opt/tnai-pm
npm start
```

### Database Corruption Recovery
```bash
# Restore from backup
psql -U tnai_user -d tnai_pm < /path/to/backup.sql

# Or manual table recreation
psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql
```

### Emergency Rollback
```bash
# Go to last known good version
cd /opt/tnai-pm
git log --oneline | head -20
git checkout <commit_hash>
npm install
npm run build
pm2 restart tnai-pm
```

---

**Created**: 2024
**Status**: Production Ready
**Application Type**: Next.js 14 with PostgreSQL
**Authentication**: Custom JWT + bcrypt
**Deployment**: PM2 + Nginx + PostgreSQL
