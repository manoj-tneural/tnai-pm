# EC2 DEPLOYMENT — QUICK START GUIDE

## 🚀 FASTEST DEPLOYMENT (Copy & Paste)

### Prerequisites
- ✅ AWS EC2 instance (t3.small or larger, Ubuntu 22.04 LTS)
- ✅ PostgreSQL database (RDS or EC2)
- ✅ SSH access to EC2
- ✅ Security group allows ports 22, 80, 443

---

## STEP 1: SSH to EC2 Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

Or use AWS Console → **EC2 Instance → Connect → EC2 Instance Connect**

---

## STEP 2: Run Automated Deployment (Single Command)

```bash
curl -O https://raw.githubusercontent.com/your-github/tnai-pm/main/deploy_ec2.sh && chmod +x deploy_ec2.sh && ./deploy_ec2.sh
```

The script will ask you for:
- GitHub repository URL
- PostgreSQL host (RDS endpoint or EC2 IP)
- Database credentials

⏱️ **Takes ~5-10 minutes** to download, build, and start the app

---

## STEP 3: Configure Nginx & SSL (Once)

After deployment completes:

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/tnai-pm
```

Copy the config from [DEPLOY.md](DEPLOY.md) **Step 3**, paste it, save (Ctrl+X → Y → Enter)

```bash
# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Set up free SSL certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

Then update Nginx config with SSL directives (from **DEPLOY.md Step 5**)

---

## STEP 4: Point Your Domain

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Update DNS A record → your EC2 Elastic IP
3. Wait 5-10 minutes for DNS propagation
4. Visit `https://your-domain.com` 🎉

---

## 📊 MONITOR YOUR APP

### View Live Logs
```bash
pm2 logs tnai-pm
```

### Check App Status
```bash
pm2 status
```

### Real-time Monitoring
```bash
pm2 monit
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 UPDATE & REDEPLOY

When you push code changes to GitHub:

```bash
cd ~/tnai-pm
git pull origin main
npm install
npm run build
pm2 reload tnai-pm
```

Or wrap it in a script:
```bash
#!/bin/bash
cd ~/tnai-pm
git pull origin main
npm install
npm run build
pm2 reload tnai-pm
echo "✅ Deployed!"
```

---

## 🆘 TROUBLESHOOTING

### App not running?
```bash
pm2 status
pm2 logs tnai-pm
pm2 restart tnai-pm
```

### 502 Bad Gateway?
```bash
# Check if app is running
pm2 status
# Restart app and Nginx
pm2 reload tnai-pm
sudo systemctl restart nginx
```

### Can't connect to database?
```bash
# Test connection directly
psql -h your-rds-endpoint -U tnai_user -d tnai_pm -c "SELECT 1"

# Check DATABASE_URL env var
cat ~/tnai-pm/.env.production | grep DATABASE_URL
```

### SSL certificate expired?
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## 💡 USEFUL COMMANDS

```bash
# SSH into server
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_IP

# View app logs
pm2 logs tnai-pm

# Restart app (no downtime)
pm2 reload tnai-pm

# Stop/start/restart
pm2 stop tnai-pm
pm2 start tnai-pm
pm2 restart tnai-pm

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t  # Test config

# Database backup
pg_dump -h RDS_ENDPOINT -U tnai_user tnai_pm > tnai-pm-backup.sql

# Check disk space
df -h

# Check memory/CPU
free -h
top
```

---

## 📋 QUICK CHECKLIST

- [ ] EC2 instance created (t3.small+)
- [ ] Security group allows 22, 80, 443
- [ ] PostgreSQL database created
- [ ] GitHub repo with `.env.production` added to `.gitignore`
- [ ] Deployment script ran successfully
- [ ] App accessible at EC2 IP:3000
- [ ] Nginx configured with SSL
- [ ] Domain DNS points to EC2 IP
- [ ] Access `https://your-domain.com` ✅

