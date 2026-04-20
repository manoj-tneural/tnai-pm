# Updating Existing EC2 Deployment - New Version Guide

**Date**: April 20, 2026  
**From Version**: Earlier deployment (Supabase-based)  
**To Version**: 0.1.0 (PostgreSQL custom auth)  
**Downtime**: ~5 minutes (zero-downtime option available)

---

## 🎯 Overview

You have an **existing deployment running the old version** (with Supabase). This guide explains how to safely update it to the **new version** (with PostgreSQL custom auth) that will **completely replace it**.

### Key Points
- ✅ Both versions use **PostgreSQL** (same database!)
- ✅ New version has **custom JWT auth** (replaces Supabase)
- ✅ **No data loss** (database schema adds new tables, existing data preserved)
- ✅ **Complete feature replacement** (all pages updated)
- ❌ **Breaking change**: Old Supabase auth tokens will NOT work after update

---

## 📊 What's Changing

### Old Version (Current Deployment)
```
Client ↓
Nginx (proxy)
Next.js App ↓
Supabase Auth (third-party) ↓
Supabase-hosted PostgreSQL
```

### New Version (After Update)
```
Client ↓
Nginx (proxy)
Next.js App ↓
Custom JWT Auth (in-app) ↓
Self-managed PostgreSQL (same instance)
```

### Implications
1. **Database**: Same PostgreSQL instance - just add new tables
2. **Authentication**: All old Supabase sessions will become invalid
3. **Users**: Need to sign up fresh or get password reset from admin
4. **Features**: Identical functionality, just simpler auth

---

## 🚀 Update Strategy (Choose One)

### Strategy 1: ZERO-DOWNTIME Update (Recommended)
Best for production with existing users.

**Steps**:
1. Build new version on current server (no restart yet)
2. Run new migrations (adds new tables, doesn't touch old data)
3. Verify new version works in background
4. Gracefully redirect users → new version
5. Old sessions gracefully expire

**Time**: ~10 minutes downtime (for graceful shutdown)

### Strategy 2: QUICK UPDATE (Fastest)
Good if you're comfortable with brief downtime.

**Steps**:
1. Stop old version
2. Pull new version
3. Run migrations
4. Start new version
5. Done

**Time**: ~5-10 minutes total downtime

### Strategy 3: BLUE-GREEN Update (Safest)
Best for maximum safety. Requires second server.

**Steps**:
1. Deploy new version on second EC2 instance
2. Test thoroughly
3. Switch load balancer to new version
4. Keep old version running for rollback

**Time**: ~30 minutes setup, zero downtime

---

## 📋 Pre-Update Checklist

**CRITICAL**: Do these BEFORE updating

- [ ] **Backup existing database**:
  ```bash
  pg_dump -U tnai_user -d tnai_pm > backup_before_update_$(date +%Y%m%d).sql
  ```

- [ ] **Document current users** (they'll need to re-auth):
  ```bash
  psql -U tnai_user -d tnai_pm -c "SELECT email, full_name, role FROM profiles;" > current_users.txt
  ```

- [ ] **Notify users**:
  - Application will be updated in the next 5 minutes
  - They'll need to login again after update
  - No data loss, just re-authentication

- [ ] **Test backup restoration**:
  ```bash
  # Create test database
  psql -U postgres -c "CREATE DATABASE tnai_pm_test;"
  # Try restore
  psql -U postgres -d tnai_pm_test < backup_before_update_20260420.sql
  # If successful, delete test database
  psql -U postgres -c "DROP DATABASE tnai_pm_test;"
  ```

- [ ] **Have rollback command ready**:
  ```bash
  # Revert to old version
  pm2 stop tnai-pm
  cd /opt/tnai-pm
  git checkout previous_version_commit
  npm install
  npm run build
  pm2 start tnai-pm
  ```

---

## 🔄 Strategy 1: Zero-Downtime Update (RECOMMENDED)

This keeps your application available for most of the update.

### Step 1: Prepare (On EC2, no downtime yet)
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

cd /opt/tnai-pm

# Fetch the latest version without switching yet
git fetch origin master

# Check what's coming
git log origin/master --oneline -20
```

### Step 2: Build New Version (Background)
```bash
# Build the new version WITHOUT stopping the old one
git stash          # Save any local changes
git checkout origin/master

npm install --production  # Install new dependencies

npm run build      # This takes ~60-90 seconds

# Check if build succeeded
ls -la .next/      # Should have built output
```

### Step 3: Run Database Migrations (Can be done before/after)
```bash
# Add new authentication tables (doesn't touch old data)
psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql

# Verify new tables created
psql -U tnai_user -d tnai_pm -c "\\dt"
```

### Step 4: Graceful Shutdown of Old Version
```bash
# See what's running
pm2 status

# Graceful stop (waits for current requests to finish)
pm2 stop tnai-pm --wait-ready

# Takes 30-60 seconds as old requests finish

# Verify it stopped
pm2 status
```

### Step 5: Start New Version
```bash
# Start with new code
pm2 start tnai-pm

# Watch logs as it comes up
pm2 logs tnai-pm -n 50

# Verify it's running
pm2 status

# Test it works
curl http://localhost/auth/login

# Test Nginx is proxying
curl http://your-ec2-ip/auth/login | head -20
```

### Step 6: Post-Update Verification
```bash
# Check application logs (no errors?)
pm2 logs tnai-pm --err -n 20

# Test database connection
psql -U tnai_user -d tnai_pm -c "SELECT COUNT(*) FROM profiles;"

# Test new auth tables exist
psql -U tnai_user -d tnai_pm -c "\\dt" | grep profiles

# Verify users can access login page
curl -s http://your-ec2-ip/auth/login | grep '<title>' 
```

### Step 7: Alert Users
Users will need to:
1. Go to your app URL
2. Click "Sign Up" to create new account
3. OR contact admin to reset password

---

## 🏃 Strategy 2: Quick Update (Fastest)

When you need to update ASAP (and downtime is acceptable):

```bash
# SSH to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 1. Stop the old application (few seconds downtime)
pm2 stop tnai-pm

# 2. Pull new code (few seconds)
cd /opt/tnai-pm && git pull origin master

# 3. Install (if new packages added)
npm install --production

# 4. Build new version
npm run build

# 5. Run migrations
psql -U tnai_user -d tnai_pm -f supabase/migrations/002_custom_auth.sql

# 6. Start new version (30 seconds downtime total)
pm2 start tnai-pm

# 7. Save to PM2 config
pm2 save

# Done! Should take 5-10 minutes total
ps aux | grep node    # Verify running
pm2 logs tnai-pm      # Check logs
```

---

## 🔵 Strategy 3: Blue-Green Deployment

For zero downtime on existing users:

### On Current Server (Green - Old Version)
```bash
# Keep running as-is
pm2 status
# Still running old version
```

### On New Server (Blue - New Version)
```bash
# SSH to NEW EC2 instance
ssh -i your-key.pem ubuntu@NEW-EC2-IP

# Follow "QUICK UPDATE" steps above
# ... setup, clone, build, migrate, start ...

# Test it works
curl http://NEW-EC2-IP/auth/login

# If works, you're ready
```

### Switchover (Load Balancer)
```bash
# Update your DNS or load balancer
# Point to new EC2 instance instead

# Option 1: Update Route 53 or domain DNS
# Option 2: Update load balancer target
# Option 3: Update Nginx upstream on main server

# Users are now on new version
# Old server can be kept running as backup
```

---

## ❌ Rollback Procedure (If Something Goes Wrong)

If the new version has issues, rollback immediately:

```bash
# SSH to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Stop current version
pm2 stop tnai-pm

# Go back to previous version
cd /opt/tnai-pm

# List available versions
git log --oneline -20

# Revert to specific commit (substitute hash)
git checkout 878662d  # Old version hash

# Rebuild
npm install --production
npm run build

# Restart
pm2 start tnai-pm

# Verify old version is running
pm2 logs tnai-pm

# Test it
curl http://localhost/auth/login
```

---

## 🔐 Important: Auth Transition

### Old Users (With Supabase Accounts)
**Will NOT be able to login** because:
- Old password hashes are in Supabase format
- New version uses bcrypt hashes
- JWT tokens from old version won't validate

### Recovery Options for Users:

**Option 1: Sign Up Again** (Easiest)
- User goes to `/auth/signup`
- Creates new account with same email
- New password in bcrypt format
- Old data can be migrated if needed

**Option 2: Admin Password Reset** (For keeping same accounts)
```bash
# As admin, reset password for user:
node << 'EOF'
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function resetPassword() {
  const email = 'user@example.com';
  const newPassword = 'TempPassword@123';
  
  const hash = await bcrypt.hash(newPassword, 10);
  
  await pool.query(
    'UPDATE profiles SET password_hash = $1 WHERE email = $2',
    [hash, email]
  );
  
  console.log(`✅ Password reset for ${email} to: ${newPassword}`);
  console.log('User should change it on first login');
  
  pool.end();
}

resetPassword();
EOF
```

**Option 3: Migrate Old Users** (Premium option)
Script to convert old Supabase users to new format (requires data export):
```bash
# Request user data from Supabase
# Import to PostgreSQL with temporary passwords
# Send password reset links
```

---

## 📊 Comparison - Old vs New

| Aspect | Old Version | New Version |
|--------|-----------|-----------|
| Auth Provider | Supabase (3rd party) | Custom JWT (in-app) |
| Database | Supabase PostgreSQL | Self-managed PostgreSQL |
| Password | Supabase bcrypt | bcrypt (same algorithm) |
| Sessions | Supabase tokens | JWT in httpOnly cookies |
| Cost | ~$25-100/month | Included in EC2 cost |
| User Management | Supabase UI | Custom admin panel |
| **Downtime to Update** | **~30 minutes** | **~5-10 minutes** |
| **Auth Breaking Change** | No | **YES** - all sessions invalidated |
| **Data Migration** | Not needed | Adds 5 new tables |

---

## ⚠️ Breaking Changes & Migration

### What Changes for Users
1. **Sessions expire** - Users logged in will be logged out
2. **Need to re-login** - Must create new account or reset password
3. **One-time setup** - After that, everything works normally
4. **No data loss** - All previous data is preserved

### What Stays the Same
- All features work identically
- Dashboard looks the same
- Deployments, tasks, all data intact
- Same database underneath

### User Communication Template
```
Dear Users,

We've updated our authentication system for better security 
and performance. Please note:

📢 Update Schedule: [Date/Time]
⏱️ Downtime: ~5 minutes
🔐 Action Needed: Please login again after update
✅ No Data Loss: All your data is safe

To login after update:
1. Go to [your-app-url]
2. Click "Sign Up" OR use "Forgot Password"
3. You'll be able to access all your data

Questions? Contact: support@yourcompany.com
```

---

## 🚨 Emergency Procedures

### If Database Gets Corrupted During Migration
```bash
# Stop the application
pm2 stop tnai-pm

# Restore from backup BEFORE migration ran
psql -U postgres -c "DROP DATABASE tnai_pm;"
psql -U postgres -c "CREATE DATABASE tnai_pm OWNER tnai_user;"
psql -U tnai_user -d tnai_pm < backup_before_update_20260420.sql

# Revert code
cd /opt/tnai-pm && git checkout 878662d

# Rebuild and restart
npm run build && pm2 start tnai-pm
```

### If Application Won't Start After Update
```bash
# Check logs for error
pm2 logs tnai-pm --err

# Common issues:
# 1. Missing environment variable
# 2. New dependency version incompatible
# 3. Database migration failed

# Fix: Rollback
git checkout old_commit_hash
npm install
npm run build
pm2 restart tnai-pm
```

### If Nginx Returns 502 Error
```bash
# Check if Node app is running
pm2 status

# If not, start it
pm2 start tnai-pm

# Check if listening on port 3000
netstat -tulpn | grep 3000

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Post-Update Checklist

After successfully updating, verify everything:

- [ ] Application accessible at your domain/IP
- [ ] Login page loads (no JavaScript errors)
- [ ] Can signup with new account
- [ ] Can login with new account
- [ ] Dashboard displays correctly
- [ ] All pages load without 404/500 errors
- [ ] Database has new tables: `\dt` in psql
- [ ] No error spam in `pm2 logs tnai-pm`
- [ ] Nginx proxy working: `curl -v http://ip/auth/login`
- [ ] System resources normal: `htop`

---

## 🎯 Recommended Update Path

**For Most Users**:
1. Pick a low-traffic time window
2. Use **Strategy 2 (Quick Update)** - it's simple and effective
3. 5-10 minutes total
4. Notify users beforehand
5. Have rollback command ready
6. Do post-update verification

**For High-Traffic Sites**:
1. Use **Strategy 3 (Blue-Green)**
2. Deploy to second server first
3. Test thoroughly
4. Switch DNS/load balancer
5. Keep old server running 24 hours for rollback

---

## 📞 Support Resources

If you run into issues:

1. **Check logs**: `pm2 logs tnai-pm`
2. **Check database**: `psql -U tnai_user -d tnai_pm -c "SELECT 1"`
3. **Check Nginx**: `sudo systemctl status nginx`
4. **Restore from backup**: `psql -U tnai_user -d tnai_pm < backup.sql`
5. **Rollback version**: `git checkout old_commit && npm run build && pm2 restart tnai-pm`

---

## 📋 Summary Table

| Update Type | Downtime | Risk | Complexity | Best For |
|-------------|----------|------|-----------|----------|
| **Strateg 1** (Zero-Downtime) | ~1 min | Low | Medium | Production with users |
| **Strategy 2** (Quick) | 5-10 min | Medium | Low | Small deployments |
| **Strategy 3** (Blue-Green) | 0 min | Very Low | High | Large/critical apps |

---

**Choose your strategy above and follow the steps. New version will completely replace the old one while preserving all data!**

For questions, refer to `EC2_DEPLOYMENT_FINAL.md` or contact your DevOps team.
