# EC2 Deployment Checklist - TNAI-PM

Date: __________ | Deployed By: ______________ | Version: ______________

## Pre-Deployment Phase

### 1. Code Preparation
- [ ] All local changes committed to git
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `tsc --noEmit`
- [ ] `.env` is in `.gitignore` (secrets not in repo)
- [ ] Dependencies installed: `npm install`
- [ ] `.next/` directory exists and is built

### 2. Database Preparation
- [ ] Database backup created (if upgrading)
- [ ] Migration scripts reviewed (001_init.sql, 002_custom_auth.sql)
- [ ] Database size estimated (should be < 1GB initially)
- [ ] PostgreSQL version verified (15+)

### 3. Infrastructure Preparation
- [ ] EC2 instance launched (t2.medium or larger)
- [ ] Security groups configured (ports 80, 443, 22 open)
- [ ] Key pair downloaded and stored securely
- [ ] Elastic IP assigned (optional, for consistency)
- [ ] VPC and subnet configured
- [ ] Storage volume allocated (20GB+)

## EC2 Setup Phase

### 4. System Installation
- [ ] SSH into instance
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Node.js installed (v18+): `node --version`
- [ ] NPM installed: `npm --version`
- [ ] PostgreSQL installed: `psql --version`
- [ ] Nginx installed: `nginx -v`
- [ ] PM2 installed globally: `pm2 --version`

### 5. PostgreSQL Setup
- [ ] PostgreSQL service running: `sudo systemctl status postgresql`
- [ ] PostgreSQL enabled on boot: `sudo systemctl enable postgresql`
- [ ] Database user created: `tnai_user`
- [ ] Database created: `tnai_pm`
- [ ] Permissions granted: `GRANT ALL ON DATABASE tnai_pm TO tnai_user;`
- [ ] Test connection successful: `psql -U tnai_user -d tnai_pm -c "SELECT 1"`

### 6. Application Deployment
- [ ] Application directory created: `/opt/tnai-pm`
- [ ] Repository cloned: `cd /opt && git clone ...`
- [ ] Ownership set correctly: `sudo chown ubuntu:ubuntu /opt/tnai-pm`
- [ ] Dependencies installed: `cd /opt/tnai-pm && npm install`
- [ ] `.env` file created with production values
- [ ] JWT secret generated and configured
- [ ] Database password configured
- [ ] Application built: `npm run build`
- [ ] Build completed without errors

### 7. Database Migrations
- [ ] Initial schema loaded: `psql -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql`
- [ ] Auth schema loaded: `psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql`
- [ ] Tables verified: `psql -U tnai_user -d tnai_pm -c "\\dt"`
  - [ ] `profiles` table exists
  - [ ] `products` table exists
  - [ ] `deployments` table exists
  - [ ] `deployment_tasks` table exists
  - [ ] All required tables present
- [ ] Initial admin user created
- [ ] Test user created for testing

## PM2 Configuration Phase

### 8. Application Start
- [ ] PM2 started application: `pm2 start npm --name "tnai-pm" -- start`
- [ ] Application running: `pm2 status` shows "online"
- [ ] PM2 startup configured: `pm2 startup` and `pm2 save`
- [ ] Logs checked: `pm2 logs tnai-pm` shows no errors
- [ ] Application accessible locally: `curl http://localhost:3000`

### 9. PM2 Monitoring
- [ ] PM2 process saved: `pm2 save`
- [ ] Startup script enabled: `sudo systemctl status pm2-ubuntu`
- [ ] Process restarts on crash: `pm2 show tnai-pm` shows restart count
- [ ] Memory limit reasonable: `pm2 monit`
- [ ] CPU usage normal: `pm2 monit`

## Nginx Configuration Phase

### 10. Reverse Proxy Setup
- [ ] Nginx config created: `/etc/nginx/sites-available/tnai-pm`
- [ ] Site enabled: `/etc/nginx/sites-enabled/tnai-pm` symlink exists
- [ ] Default site disabled: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Nginx config valid: `sudo nginx -t` returns "OK"
- [ ] Nginx restarted: `sudo systemctl restart nginx`
- [ ] Nginx enabled on boot: `sudo systemctl enable nginx`

### 11. Public Access Testing
- [ ] Application accessible via public IP: `http://your-ec2-ip`
- [ ] Nginx proxying correctly: `curl -v http://your-ec2-ip` shows 200
- [ ] Login page loads: `http://your-ec2-ip/auth/login`
- [ ] API endpoints accessible: `curl http://your-ec2-ip/api/deployments`

## SSL/TLS Configuration Phase (Optional)

### 12. HTTPS Setup
- [ ] Domain name pointing to EC2 public IP (for production)
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx`
- [ ] SSL certificate obtained: `sudo certbot --nginx -d yourdomain.com`
- [ ] Certificate renewal configured: `sudo systemctl status certbot.timer`
- [ ] Dry run successful: `sudo certbot renew --dry-run`
- [ ] HTTP redirects to HTTPS in Nginx config
- [ ] HTTPS working: `https://yourdomain.com` loads correctly

## Testing Phase

### 13. Functional Testing
- [ ] Login page accessible
- [ ] Signup functionality works
- [ ] Can login with admin user
- [ ] Dashboard loads and displays data
- [ ] Create deployment form works
- [ ] Update deployment works
- [ ] Task status cycling works
- [ ] Daily log creation works
- [ ] All pages load without 404/500 errors

### 14. API Testing
- [ ] GET /api/deployments returns 200 (with auth)
- [ ] POST /api/deployments returns 201 (creates deployment)
- [ ] PATCH /api/deployments/[id] returns 200 (updates task)
- [ ] Invalid auth returns 401
- [ ] Expired token returns 401
- [ ] Missing headers return 400

### 15. Database Testing
- [ ] Data persists after restart: `pm2 restart tnai-pm`
- [ ] New users can be created
- [ ] User passwords hash correctly
- [ ] JWT tokens generate properly
- [ ] Database queries run efficiently
- [ ] No N+1 query issues observed

### 16. Performance Testing
- [ ] Application loads in < 2 seconds
- [ ] Dashboard responsive with 1000+ records
- [ ] No memory leaks: `pm2 monit` stable over time
- [ ] CPU usage < 20% idle
- [ ] Database connections stable: `SELECT COUNT(*) FROM pg_stat_activity;`

## Security Phase

### 17. Access Control
- [ ] SSH key pair stored securely
- [ ] Password-based SSH disabled
- [ ] Security group restricted appropriately
- [ ] Database user password is strong and stored securely
- [ ] JWT secret is strong and unique
- [ ] No hardcoded secrets in source code

### 18. Data Protection
- [ ] Database backups enabled
- [ ] Backup tested: `pg_dump > backup.sql && psql < backup.sql`
- [ ] Backups stored securely (AWS S3, encrypted)
- [ ] Backup retention policy defined
- [ ] Disaster recovery plan documented

### 19. Monitoring & Logging
- [ ] Application logs accessible: `pm2 logs`
- [ ] Error logs monitored: `/var/log/nginx/error.log`
- [ ] Database logs accessible
- [ ] CloudWatch or monitoring tool configured
- [ ] Alerts configured for CPU > 80%
- [ ] Alerts configured for disk > 80%
- [ ] Alerts configured for application crash

## Deployment Phase

### 20. Pre-Go-Live
- [ ] All test cases passed
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Stakeholders notified of go-live time
- [ ] Rollback plan documented
- [ ] Break glass procedure documented

### 21. Go-Live
- [ ] DNS updated to point to EC2 (if applicable)
- [ ] Application accessed from external network
- [ ] All pages load correctly
- [ ] Users can login from external network
- [ ] Functionality verified end-to-end
- [ ] Performance acceptable under load

### 22. Post-Deployment
- [ ] Health check endpoint responds: `curl http://your-ec2-ip/api/health`
- [ ] Logs monitored for errors
- [ ] Database connections stable
- [ ] No unexpected restarts: `pm2 show tnai-pm`
- [ ] Users can create/update data
- [ ] Email notifications working (if applicable)
- [ ] Backups running successfully

## Post-Deployment Phase

### 23. Documentation
- [ ] Deployment process documented
- [ ] Configuration documented
- [ ] Rollback procedure documented
- [ ] Emergency contact list created
- [ ] Troubleshooting guide updated
- [ ] Team trained on monitoring/maintenance

### 24. Handover
- [ ] Documentation shared with ops team
- [ ] Access credentials shared securely
- [ ] Support procedures documented
- [ ] On-call rotation established
- [ ] Incident response plan created

### 25. Monitoring Setup (First Week)
- [ ] Application performance metrics baseline established
- [ ] Database performance metrics baseline established
- [ ] Disk usage trending
- [ ] Memory trends normal
- [ ] Error rate acceptable (< 0.1%)
- [ ] Response time acceptable (< 500ms p95)

## Rollback Checklist (If Needed)

- [ ] Last known good commit identified
- [ ] Database backup restored: `psql -U tnai_user -d tnai_pm < backup.sql`
- [ ] Application rolled back: `cd /opt/tnai-pm && git checkout <commit>`
- [ ] Dependencies reinstalled: `npm install`
- [ ] Application rebuilt: `npm run build`
- [ ] PM2 restarted: `pm2 restart tnai-pm`
- [ ] Functionality verified
- [ ] Root cause analysis started
- [ ] Communication sent to stakeholders

## Sign-Off

**Deployment Completed**: ______________ (Date/Time)

**Deployed By**: _________________ (Name/Signature)

**Verified By**: _________________ (Name/Signature)

**Any Issues Encountered**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Post-Deployment Notes**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Quick Reference Commands

```bash
# Get SSH access
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check application status
pm2 status
pm2 logs tnai-pm
pm2 monit

# Restart application
pm2 restart tnai-pm

# Rebuild and restart
cd /opt/tnai-pm && npm run build && pm2 restart tnai-pm

# Check database
psql -U tnai_user -d tnai_pm -c "SELECT COUNT(*) FROM profiles;"

# View system resources
htop

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Backup database
pg_dump -U tnai_user -d tnai_pm > backup.sql

# View application size
du -sh /opt/tnai-pm
du -sh /opt/tnai-pm/node_modules
du -sh /opt/tnai-pm/.next
```

---

**Remember**: Always test in staging before deploying to production!
