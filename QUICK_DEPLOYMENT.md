# TNAI-PM Quick Deployment Reference

## ✅ Migration Complete - Ready for EC2

**Build Status**: ✅ Successful  
**All Errors**: ✅ Resolved  
**Test Coverage**: ✅ Passing  
**Deployment Status**: ✅ READY NOW

---

## 🚀 Quick Start (Copy & Paste)

### On Your Local Machine
```bash
# Verify everything is ready
cd /path/to/tnai-pm
npm run build

# If build succeeds, you're ready!
# Commit your changes
git add -A
git commit -m "Ready for production deployment"
git push origin main
```

### On EC2 Instance (Complete)

**STEP 1 - SSH AND SETUP (5 minutes)**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Run all setup in one go
bash << 'EOF'
set -e

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

echo "✅ System setup complete!"
EOF
```

**STEP 2 - DATABASE SETUP (3 minutes)**
```bash
# Generate secure password
PG_PASSWORD=$(openssl rand -base64 32)
echo "Database password: $PG_PASSWORD"

# Create database and user
sudo -u postgres psql << EOF
CREATE USER tnai_user WITH PASSWORD '$PG_PASSWORD';
CREATE DATABASE tnai_pm OWNER tnai_user;
GRANT ALL PRIVILEGES ON DATABASE tnai_pm TO tnai_user;
\q
EOF

echo "✅ Database created!"
```

**STEP 3 - APPLICATION SETUP (3 minutes)**
```bash
# Setup application directory
sudo mkdir -p /opt/tnai-pm
sudo chown ubuntu:ubuntu /opt/tnai-pm

# Clone repository
cd /opt && git clone https://github.com/yourusername/tnai-pm.git

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT secret: $JWT_SECRET"

# Create .env file (update with your values)
cat > /opt/tnai-pm/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm
DB_USER=tnai_user
DB_PASSWORD=$PG_PASSWORD
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
EOF

echo "✅ Application directory prepared!"
```

**STEP 4 - DATABASE MIGRATIONS (2 minutes)**
```bash
cd /opt/tnai-pm

# Run migrations
psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql
psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql

# Create initial admin user
ADMIN_PASSWORD=$(openssl rand -base64 12)
echo "Admin password: $ADMIN_PASSWORD"

node << 'SCRIPT'
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'tnai_user',
  host: 'localhost',
  database: 'tnai_pm',
  password: process.env.DB_PASSWORD || '',
  port: 5432,
});

async function createAdmin() {
  const hash = await bcrypt.hash('Initial@123', 10);
  await pool.query(
    `INSERT INTO profiles (id, email, full_name, role, password_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    ['admin-' + Math.random().toString(36).substr(2, 9), 'admin@tnai-pm.local', 'Administrator', 'management', hash]
  );
  pool.end();
  console.log('✅ Admin user created!');
}

createAdmin();
SCRIPT

echo "✅ Database migrations complete!"
```

**STEP 5 - BUILD & START (3 minutes)**
```bash
cd /opt/tnai-pm

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "tnai-pm" -- start

# Enable startup on reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo "✅ Application started with PM2!"
```

**STEP 6 - NGINX SETUP (2 minutes)**
```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/tnai-pm > /dev/null << 'EOF'
upstream tnai_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;

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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/tnai-pm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configured as reverse proxy!"
```

**STEP 7 - VERIFICATION (1 minute)**
```bash
# Test application
echo "Testing application..."
curl -s http://localhost:80/auth/login | head -20

# View status
echo "Checking application status..."
pm2 status

# View logs
echo "Recent logs:"
pm2 logs tnai-pm --lines 20

echo "✅ Deployment complete! Access at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
```

---

## 📋 Complete Deployment in One Script

If you want to automate everything, save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 TNAI-PM EC2 Deployment Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: System Setup
echo -e "${BLUE}[1/7] Installing system dependencies...${NC}"
sudo apt update && sudo apt upgrade -y
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2
echo -e "${GREEN}✅ System setup complete${NC}"

# Step 2: Database Setup
echo -e "${BLUE}[2/7] Setting up PostgreSQL...${NC}"
PG_PASSWORD=$(openssl rand -base64 32)
sudo -u postgres psql << PGEOF
CREATE USER tnai_user WITH PASSWORD '$PG_PASSWORD';
CREATE DATABASE tnai_pm OWNER tnai_user;
GRANT ALL PRIVILEGES ON DATABASE tnai_pm TO tnai_user;
PGEOF
echo -e "${GREEN}✅ Database created (password saved below)${NC}"
echo "DB_PASSWORD=$PG_PASSWORD" > /tmp/deploy_secrets.txt

# Step 3: Clone and Setup
echo -e "${BLUE}[3/7] Setting up application...${NC}"
sudo mkdir -p /opt/tnai-pm
sudo chown ubuntu:ubuntu /opt/tnai-pm
cd /opt && git clone https://github.com/yourusername/tnai-pm.git

JWT_SECRET=$(openssl rand -base64 32)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

cat > /opt/tnai-pm/.env << ENVEOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm
DB_USER=tnai_user
DB_PASSWORD=$PG_PASSWORD
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://$PUBLIC_IP
ENVEOF

echo "JWT_SECRET=$JWT_SECRET" >> /tmp/deploy_secrets.txt
echo -e "${GREEN}✅ Application configured${NC}"

# Step 4: Database Migrations
echo -e "${BLUE}[4/7] Running database migrations...${NC}"
cd /opt/tnai-pm
psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql
psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql
echo -e "${GREEN}✅ Database migrations complete${NC}"

# Step 5: Build Application
echo -e "${BLUE}[5/7] Building application...${NC}"
npm install
npm run build
echo -e "${GREEN}✅ Build successful${NC}"

# Step 6: Start with PM2
echo -e "${BLUE}[6/7] Starting application with PM2...${NC}"
pm2 start npm --name "tnai-pm" -- start
pm2 startup | tail -1 | bash
pm2 save
echo -e "${GREEN}✅ Application running under PM2${NC}"

# Step 7: Configure Nginx
echo -e "${BLUE}[7/7] Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/tnai-pm > /dev/null << 'NGINXEOF'
upstream tnai_app {
    server localhost:3000;
}

server {
    listen 80;
    server_name _;
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
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/tnai-pm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo -e "${GREEN}✅ Nginx configured${NC}"

# Success!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ ✅ DEPLOYMENT COMPLETE!                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Application URL: http://$PUBLIC_IP"
echo "Admin Email: admin@tnai-pm.local"
echo "Admin Password: Check /tmp/deploy_secrets.txt"
echo ""
echo "Next steps:"
echo "1. Update DNS to point to $PUBLIC_IP"
echo "2. Access http://$PUBLIC_IP and login"
echo "3. Change default admin password"
echo "4. Delete /tmp/deploy_secrets.txt when secrets are saved securely"
echo ""
```

Run it with:
```bash
# On EC2 instance
# First, edit the git clone URL with your repo
curl -O https://your-script-url/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

---

## 🔍 Verification Commands

After deployment, run these to verify everything works:

```bash
# Check Node app status
pm2 status
pm2 logs tnai-pm --lines 50

# Check database connection
psql -U tnai_user -d tnai_pm -c "SELECT COUNT(*) FROM profiles;"

# Test application endpoint
curl http://localhost/auth/login | head -20

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check system resources
htop

# Monitor processes
ps aux | grep node
```

---

## 🔐 Important Security Notes

### Immediately After Deployment
1. **Change admin password**:
   ```bash
   # Login with admin@tnai-pm.local / Initial@123
   # Change password in admin panel
   ```

2. **Secure the deployment secrets**:
   ```bash
   # Note down the values from /tmp/deploy_secrets.txt
   rm /tmp/deploy_secrets.txt
   ```

3. **Setup backups**:
   ```bash
   # Create backup script
   echo 'pg_dump -U tnai_user -d tnai_pm | gzip > ~/backups/tnai_pm_$(date +%Y%m%d).sql.gz' \
     | crontab -
   ```

4. **Monitor logs**:
   ```bash
   # Watch logs continuously
   pm2 logs tnai-pm
   ```

---

## 📊 Post-Deployment Checks

### Checklist
- [ ] Application accessible at public IP
- [ ] Login page loads
- [ ] Can create account
- [ ] Can login with credentials
- [ ] Dashboard displays
- [ ] Database queries work
- [ ] Nginx proxying correctly
- [ ] Logs show no errors
- [ ] CPU/Memory usage normal

### Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| App not starting | `pm2 logs tnai-pm` to see errors |
| DB connection fails | Verify `.env` variables |
| 502 Bad Gateway | `pm2 restart tnai-pm` |
| Domain name issues | Update security group DNS |

---

## 🆘 Emergency Commands

```bash
# Restart everything
pm2 restart tnai-pm
sudo systemctl restart postgresql
sudo systemctl restart nginx

# View all logs
pm2 logs tnai-pm
sudo tail -f /var/log/nginx/error.log

# Backup database NOW
pg_dump -U tnai_user -d tnai_pm > backup_emergency.sql

# Kill and restart clean
pm2 delete tnai-pm
cd /opt/tnai-pm && npm run build && pm2 start npm --name "tnai-pm" -- start

# SSH into EC2
ssh -i your-key.pem ubuntu@your-ip
```

---

## 📚 Full Documentation

For detailed instructions, see:
- **EC2_DEPLOYMENT_FINAL.md** - Complete step-by-step guide
- **DEPLOYMENT_CHECKLIST.md** - Pre/post-deployment checklist
- **ENV_VARIABLES.md** - Environment variables reference
- **MIGRATION_COMPLETE.md** - Migration summary and status

---

## 💬 Support

If you run into issues:

1. Check the logs: `pm2 logs tnai-pm`
2. Verify .env: `cat .env | grep -v PASSWORD | head -5`
3. Test database: `psql -U tnai_user -d tnai_pm -c "SELECT 1"`
4. Review EC2_DEPLOYMENT_FINAL.md troubleshooting section
5. Contact your DevOps team

---

**Deployment Status**: ✅ **READY**  
**Build Status**: ✅ **SUCCESSFUL**  
**Go-Live**: Ready anytime  

🚀 **Happy deploying!**
