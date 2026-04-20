# EC2 DEPLOYMENT GUIDE — TNAI PROJECT HUB (Next.js)

## 📋 Prerequisites Checklist

- ✅ AWS Account with EC2 access
- ✅ EC2 Instance: **t3.small** or larger (Ubuntu 22.04 LTS)
- ✅ PostgreSQL 13+ (either RDS or EC2)
- ✅ Security group configured for ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- ✅ ~10GB free disk space
- ✅ Domain name (optional but recommended for SSL)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────┐
│           Internet / DNS                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Nginx (443)   │  ← Reverse proxy, SSL termination
        │  Reverse Proxy │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ Next.js (3000) │  ← Node.js app via PM2
        │  Application   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────┐
        │ PostgreSQL DB  │  ← Supabase-compatible database
        │   (RDS/EC2)    │
        └────────────────┘
```

---

## 📦 DEPLOYMENT METHODS

Choose one:

### Method 1: Automated Script (Recommended) ⭐
Fastest way to get running in production. Handles all steps automatically.

```bash
./deploy_ec2.sh
```

**Time:** ~10 minutes | **Difficulty:** Easy ✅

### Method 2: Manual Step-by-Step
Full control, easier to debug. Follow sections below.

**Time:** ~30 minutes | **Difficulty:** Intermediate

### Method 3: Docker Container
For advanced users with container experience.

**Time:** ~15 minutes | **Difficulty:** Advanced

---

## 🔌 DATABASE SETUP

### Option A: AWS RDS (Managed, Recommended)

**Pros:** Managed backups, automated failover, monitoring built-in
**Cons:** Extra cost (~$25/month), network latency

Steps:
1. AWS Console → **RDS → Create Database**
2. **Engine:** PostgreSQL 15
3. **Instance class:** db.t3.micro (free tier if eligible)
4. **Username:** `tnai_user`
5. **Password:** (strong password, save it)
6. **DB name:** `tnai_pm`
7. **Storage:** 20GB, autoscaling enabled
8. **Backup:** 7 days retention
9. **Security group:** Allow inbound 5432 from your EC2 instance
10. Click **Create** — wait 5-10 minutes

Once created, note the **RDS Endpoint** (e.g., `tnai-pm-db.xxxxx.ap-southeast-1.rds.amazonaws.com`)

### Option B: PostgreSQL on EC2 (Cheaper, Self-Managed)

**Pros:** Cheaper (~$5/month for compute only), low latency
**Cons:** Manual backups, more maintenance

```bash
# SSH to EC2
ssh -i key.pem ubuntu@your-ec2-ip

# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres createuser --createdb --superuser tnai_user
sudo -u postgres psql -c "ALTER USER tnai_user WITH PASSWORD 'your-strong-password';"
sudo -u postgres createdb -O tnai_user tnai_pm

# Enable remote access
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host  tnai_pm  tnai_user  0.0.0.0/0  md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

sudo systemctl restart postgresql

# Verify
psql -h localhost -U tnai_user -d tnai_pm -c "SELECT 1;"
```

---

## 🚀 FULL DEPLOYMENT WALKTHROUGH

### Step 1: Connect to EC2 Instance

```bash
# Using SSH key
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip

# Or use AWS EC2 Instance Connect (browser-based)
```

Verify you're logged in:
```bash
ubuntu@ip-172-31-xyz:~$ 
```

### Step 2: Update System & Install Dependencies

```bash
# Update package manager
sudo apt update
sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
node --version    # Should be v20.x
npm --version     # Should be 10.x
```

### Step 3: Install Web Server & Process Manager

```bash
# Install Nginx (web server + reverse proxy)
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx
sudo systemctl status nginx

# Install PM2 (Node.js process manager)
sudo npm install -g pm2

# Enable PM2 auto-restart on system reboot
pm2 startup -u ubuntu --hp /home/ubuntu
pm2 save
```

### Step 4: Clone Repository & Build App

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR-USERNAME/tnai-pm.git
cd tnai-pm

# Install dependencies
npm install

# Build Next.js for production
npm run build

# Verify build succeeded
ls -la .next
```

### Step 5: Configure Environment Variables

Create `.env.production` with your database credentials:

```bash
nano .env.production
```

Paste this template (update with YOUR values):

```env
# PostgreSQL Connection String
DATABASE_URL=postgresql://tnai_user:YOUR-DB-PASSWORD@your-rds-endpoint:5432/tnai_pm

# Supabase compatibility layer (required by Next.js app)
# For self-hosted, use your EC2 IP or domain
NEXT_PUBLIC_SUPABASE_URL=http://your-ec2-ip-or-domain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key

# Next.js settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-ec2-ip-or-domain.com
```

Get your EC2 public IP:
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

Save file: `Ctrl+X → Y → Enter`

### Step 6: Start Application with PM2

```bash
# Start the application
pm2 start npm --name "tnai-pm" -- start

# Check status
pm2 status

# View logs
pm2 logs tnai-pm

# Expected output:
# ▌ tnai-pm  │ running │ 0      │ 0s     │ 16 MB  │ enabled
```

### Step 7: Configure Nginx as Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/tnai-pm
```

Paste this configuration (update domain if you have one):

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS (add after you get SSL certificate)
# server {
#     listen 80;
#     server_name your-domain.com www.your-domain.com;
#     return 301 https://$server_name$request_uri;
# }

# HTTP server (temporary, until SSL is set up)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com your-ec2-ip;

    # Proxy Next.js requests
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        
        # Upgrade headers for WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Pass original request info
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/tnai-pm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 8: Set Up Free SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain pointing to this EC2 IP)
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Update Nginx config with SSL
sudo nano /etc/nginx/sites-available/tnai-pm
```

Replace the entire file with this (including HTTP→HTTPS redirect):

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates from Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy Next.js
    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /_next/static {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 9: Run Database Migrations

```bash
# Connect to database and run migrations
psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm << 'EOF'
-- Run your SQL migrations from supabase/migrations/001_init.sql
-- Example:
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
EOF
```

Or upload the SQL file:
```bash
psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm < supabase/migrations/001_init.sql
```

---

## 🧪 VERIFICATION & TESTING

After all steps above:

### 1. Verify App is Running
```bash
pm2 status
pm2 logs tnai-pm --lines 20
```

### 2. Test Locally on EC2
```bash
curl http://localhost:3000
# Should return HTML
```

### 3. Test Nginx Reverse Proxy
```bash
# Get your EC2 public IP
EC2_IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
curl http://$EC2_IP
# Should return HTML
```

### 4. Visit in Browser
- **Before SSL:** `http://your-ec2-ip`
- **After SSL:** `https://your-domain.com`

### 5. Test Database Connection
```bash
# From EC2
psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm -c "SELECT version();"

# Should show PostgreSQL version
```

---

## 📊 MONITORING & MAINTENANCE

### View Real-time Logs

```bash
# Application logs (Last 50 lines)
pm2 logs tnai-pm
pm2 logs tnai-pm --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor Resources

```bash
# Real-time dashboard
pm2 monit

# Memory and CPU
free -h
top

# Disk space
df -h
du -sh ~

# Network
netstat -an | grep ESTABLISHED | wc -l
```

### Process Management

```bash
# Restart app (zero-downtime)
pm2 reload tnai-pm

# Hard restart
pm2 restart tnai-pm

# Stop/Start
pm2 stop tnai-pm
pm2 start tnai-pm

# View all PM2 processes
pm2 list
pm2 status
```

---

## 🔄 UPDATES & REDEPLOYMENT

When you push code changes to GitHub:

```bash
cd ~/tnai-pm

# Pull latest code
git pull origin main

# Reinstall (if dependencies changed)
npm install

# Rebuild (if code changed)
npm run build

# Reload app (zero-downtime)
pm2 reload tnai-pm

# Verify
pm2 logs tnai-pm
```

Or create an auto-update script:

```bash
#!/bin/bash
# ~/auto-update.sh

cd ~/tnai-pm
git pull origin main || { echo "Pull failed"; exit 1; }
npm install
npm run build
pm2 reload tnai-pm
echo "✅ Updated!"
```

Then schedule with crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/ubuntu/auto-update.sh >> /tmp/auto-update.log 2>&1
```

---

## 🆘 TROUBLESHOOTING

### Issue: "502 Bad Gateway"

**Check Nginx is running:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Check Next.js app is running:**
```bash
pm2 status
ps aux | grep node
lsof -i :3000
```

**Restart both:**
```bash
pm2 reload tnai-pm
sudo systemctl reload nginx
```

---

### Issue: App Crashes on Startup

**View error logs:**
```bash
pm2 logs tnai-pm
```

**Common causes:**
- Missing `DATABASE_URL` in `.env.production`
- Database connection fails
- Out of memory

**Fix:**
```bash
# Check environment
cat ~/.env.production | grep DATABASE_URL

# Test DB connection
psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm -c "SELECT 1;"

# Restart app
pm2 restart tnai-pm
```

---

### Issue: Cannot Connect to Database

**Test connection manually:**
```bash
psql -h your-rds-endpoint -U tnai_user -d tnai_pm -c "SELECT VERSION();"

# Error? Check:
# 1. RDS security group allows 5432
# 2. EC2 security group allows outbound
# 3. Database credentials are correct
```

**From EC2 app:**
```bash
cd ~/tnai-pm
node -e "const db = require('pg'); const pool = new db.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1;', (err) => console.log(err ? 'ERROR: ' + err : 'OK'));"
```

---

### Issue: SSL Certificate Renewal Failed

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# If issues, reinstall
sudo apt remove certbot python3-certbot-nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

---

### Issue: High Disk Usage

```bash
# Find large files
du -sh /* | sort -rh | head -10

# Clean old logs
sudo journalctl --vacuum=10d

# Clean PM2 logs
pm2 flush
```

---

## 💾 BACKUP & RESTORE

### Database Backup

```bash
# Backup to file
pg_dump -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm > tnai-pm-backup.sql

# Backup with compression
pg_dump -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm | gzip > tnai-pm-$(date +%Y%m%d).sql.gz

# Download to local machine
scp -i key.pem ubuntu@your-ec2-ip:~/tnai-pm-backup.sql ~/Downloads/
```

### Database Restore

```bash
# From file
psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm < tnai-pm-backup.sql

# From compressed file
gunzip -c tnai-pm-20240101.sql.gz | psql -h YOUR-RDS-ENDPOINT -U tnai_user -d tnai_pm
```

### Application Backup

```bash
# Backup entire app
tar -czf ~/tnai-pm-backup.tar.gz ~/tnai-pm/

# Download
scp -i key.pem ubuntu@your-ec2-ip:~/tnai-pm-backup.tar.gz ~/Downloads/
```

---

## 📈 SCALING UP

If you need more performance:

1. **Upgrade EC2 instance:** t3.medium → t3.large
2. **Use RDS multi-AZ** for high availability
3. **Add CloudFront CDN** for static content distribution
4. **Use ElastiCache** for session/data caching
5. **Set up auto-scaling** with load balancer

---

## 💰 COST ESTIMATE

| Service | Tier | Cost/Month |
|---------|------|-----------|
| EC2 (t3.small, 730 hrs) | On-demand | $20 |
| RDS PostgreSQL 20GB | Multi-AZ | $25 |
| Data transfer | Minimal | $0-2 |
| **TOTAL** | | **$45-47** |

**Free tier eligible:**
- RDS: $0 for 12 months (12GB storage, db.t3.micro)
- EC2: $0 for 12 months (750 hrs/month, t2.micro) — but t3.small recommended

---

## 📚 ADDITIONAL RESOURCES

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

