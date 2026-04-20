# TNAI Project Hub — Deployment Guide

## Overview
This is a Next.js 14 app using Supabase for auth + database. Choose one:
- **Vercel + Supabase** → Takes ~10 minutes, serverless (easier)
- **AWS EC2 + PostgreSQL** → Self-hosted, more control, ~30 minutes setup

---

## Step 1 — Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. Name it `tnai-pm`, pick a strong DB password, choose a region close to India (Singapore)
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_init.sql` → Run
   - This creates all tables and seeds Sakshi, SpaceZap, and DataDime product data
5. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Deploy to Vercel (free)

1. Push this folder to a GitHub repository:
   ```bash
   cd tnai-pm
   git init
   git add .
   git commit -m "Initial commit — TNAI Project Hub"
   gh repo create tnai-pm --private --push --source=.
   ```
   (or use the GitHub desktop app)

2. Go to [vercel.com](https://vercel.com) → Sign up with GitHub → **New Project**
3. Import your `tnai-pm` repository
4. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = <from Step 1>
   NEXT_PUBLIC_SUPABASE_ANON_KEY = <from Step 1>
   SUPABASE_SERVICE_ROLE_KEY    = <from Step 1>
   ```
5. Click **Deploy** — takes ~2 minutes
6. Your app is live at `https://tnai-pm.vercel.app` (or custom domain)

---

## Step 3 — First Login

1. Go to your Vercel URL
2. Click **Create account**
3. Use your `@tneuralai.com` email
4. Pick role **Management**
5. You're in! Go to Admin → set roles for team members

---

## Adding Team Members

Each team member:
1. Goes to `your-vercel-url/auth/signup`
2. Enters their `@tneuralai.com` email + name + role
3. Vercel/Supabase sends a confirmation email (optional — can disable in Supabase Auth settings)
4. Management can change roles in the Admin panel

---

## Supabase Auth Settings (Recommended)

In Supabase Dashboard → **Authentication → Settings**:
- Disable email confirmations (for faster onboarding): turn off "Enable email confirmations"
- Set Site URL to your Vercel URL

---

## Local Development

```bash
cd tnai-pm
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
# Open http://localhost:3000
```

---

## What's Included

| Page | URL | Access |
|------|-----|--------|
| Dashboard (Confluence) | `/dashboard` | All roles |
| Sakshi Features | `/products/sakshi/features` | All roles |
| SpaceZap Features | `/products/spacezap/features` | All roles |
| DataDime Features | `/products/datadime/features` | All roles |
| Customer Deployments | `/products/[slug]/deployments` | All roles |
| Deployment 15-day Plan | `/products/[slug]/deployments/[id]` | All roles |
| Backend Dev Tasks | `/products/[slug]/dev-tasks` | All roles |
| Daily Standup Log | `/products/[slug]/daily` | All roles |
| Global Daily Hub | `/daily` | All roles |
| Tickets | `/tickets` | All roles |
| Ticket Detail + Comments | `/tickets/[id]` | All roles |
| Admin — User Management | `/admin` | Management only |

## Roles

| Role | Can Do |
|------|--------|
| Management | Everything + Admin panel + role changes |
| Project Manager | Manage tickets, update deployments, view all |
| Engineer | Update tasks, post daily logs, update assigned tickets |
| Testing | Raise tickets, add comments, view all |
| Sales | View all, raise tickets |

---

# 🚀 ALTERNATIVE: Deploy to AWS EC2 + PostgreSQL (Self-Hosted)

If you want to avoid Supabase/Vercel costs and run on your own infrastructure, follow these steps.

## Prerequisites
- AWS account with EC2 access
- EC2 instance: **t3.small** or larger (Ubuntu 22.04 LTS recommended)
- ~10GB disk space minimum
- Security group allows ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## Step 1 — Set Up PostgreSQL Database

### Option A: Using RDS (Managed Database — Recommended)

1. Go to **AWS RDS → Databases → Create database**
2. Choose **PostgreSQL** → Free tier eligible (if available)
3. DB instance identifier: `tnai-pm-db`
4. Username: `tnai_user` | Password: (strong password)
5. Availability: Single AZ | Storage: 20GB
6. VPC security: Allow inbound on port 5432 from your EC2 instance
7. Click **Create Database** — takes ~5 minutes

Once created, copy the **RDS Endpoint** (e.g., `tnai-pm-db.cxxxxxxxxx.ap-southeast-1.rds.amazonaws.com`)

### Option B: Using PostgreSQL on EC2 (Cheaper but More Maintenance)

SSH to your EC2, then:

```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql << 'EOF'
CREATE USER tnai_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE tnai_pm OWNER tnai_user;
ALTER USER tnai_user CREATEDB;
EOF

# Allow local connections
sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host  tnai_pm  tnai_user  0.0.0.0/0  md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

# Get local IP (remember this)
hostname -I
```

---

## Step 2 — Deploy Next.js to EC2

### Add .env.production File

Create a `.env.production` file in your `tnai-pm` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=http://your-ec2-public-ip
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dummy-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dummy-service-key

# PostgreSQL connection (replace with your RDS endpoint or EC2 IP)
DATABASE_URL=postgresql://tnai_user:your-strong-password@tnai-pm-db.cxxxxxxxxx.ap-southeast-1.rds.amazonaws.com:5432/tnai_pm

# Next.js settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### SSH to Your EC2 Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### Run Automated Deployment Script

```bash
# Create and run deployment script
curl -O https://raw.githubusercontent.com/your-github/tnai-pm/main/deploy_ec2.sh
chmod +x deploy_ec2.sh
./deploy_ec2.sh
```

Or, run manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx and PM2
sudo apt install -y nginx
sudo npm install -g pm2

# Clone repository
cd ~
git clone https://github.com/your-github/tnai-pm.git
cd tnai-pm

# Install dependencies
npm install

# Create .env.production with your database credentials
nano .env.production
# Paste the content from above, save (Ctrl+X → Y → Enter)

# Build Next.js app
npm run build

# Start app with PM2
pm2 start npm --name "tnai-pm" -- start
pm2 startup
pm2 save

# Verify app is running
pm2 logs tnai-pm
```

---

## Step 3 — Configure Nginx Reverse Proxy

```bash
# Create nginx config
sudo tee /etc/nginx/sites-available/tnai-pm > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/tnai-pm /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 4 — Set Up PostgreSQL & Run Migrations

```bash
# Connect to database
psql -h your-rds-endpoint -U tnai_user -d tnai_pm

# Paste and run SQL from supabase/migrations/001_init.sql
```

Or, use a migration tool:

```bash
# Install node-postgres migration tool
npm install --save-dev migrate-db pg

# Run migrations
npx migrate-db up
```

---

## Step 5 — Set Up SSL Certificate (Free with Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

# Update nginx to auto-redirect HTTP → HTTPS
sudo tee /etc/nginx/sites-available/tnai-pm > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo systemctl restart nginx

# Auto-renew certificate (runs daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Step 6 — Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check nginx status
sudo systemctl status nginx

# View logs
pm2 logs tnai-pm
sudo tail -f /var/log/nginx/access.log

# Test the app
curl http://localhost:3000
# Should see HTML response

# Visit https://your-domain.com in browser
```

---

## Quick Commands Reference

```bash
# SSH to server
ssh -i /path/to/key.pem ubuntu@your-ec2-ip

# Restart app
pm2 restart tnai-pm
pm2 reload tnai-pm  # Zero-downtime restart

# View logs
pm2 logs tnai-pm
pm2 logs tnai-pm --lines 100

# Update code
cd ~/tnai-pm
git pull origin main
npm install
npm run build
pm2 reload tnai-pm

# Database backup
pg_dump -h your-rds-endpoint -U tnai_user tnai_pm > backup.sql

# Monitor in real-time
pm2 monit
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App crashes on startup | Check `pm2 logs tnai-pm`, verify `.env.production` has correct `DATABASE_URL` |
| "Connection refused" | Verify RDS security group allows EC2 instance | Check PostgreSQL port 5432 |
| 502 Bad Gateway | Restart nginx & app: `sudo systemctl restart nginx && pm2 reload tnai-pm` |
| SSL certificate error | Check domain DNS points to EC2 IP, run `sudo certbot renew --force-renewal` |
| Database connection fails | Test connection: `psql -h endpoint -U user -d tnai_pm -c "SELECT 1"` |

---

## Cost Estimate (AWS)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| EC2 (t3.small, 730 hrs) | On-demand | ~$20 |
| RDS PostgreSQL (20GB, multi-AZ optional) | Free tier / ~$25 | ~$0-25 |
| Data transfer | USA | ~$0 (minimal) |
| **Total** | - | **~$20-45/month** |

Vercel + Supabase: $0 (free tier) → $20+/month (pro)


