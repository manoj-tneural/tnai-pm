# Environment Variables Configuration

## Overview
This document describes all environment variables required to run TNAI-PM in different environments.

## Required Variables

### Database Configuration
```
DB_HOST=localhost              # PostgreSQL host (localhost for local dev, EC2 for production)
DB_PORT=5432                   # PostgreSQL port (default 5432)
DB_NAME=tnai_pm                # Database name
DB_USER=tnai_user              # Database user (created during setup)
DB_PASSWORD=strong_password    # Database password (change this!)
```

### Authentication
```
JWT_SECRET=your_secret_key     # JWT signing secret (generate with: openssl rand -base64 32)
```

**How to generate JWT_SECRET:**
```bash
openssl rand -base64 32
# Output example: aBcDeFgHiJkLmNoPqRsTuVwXyZ1A2B3C4D5E6F7G8H9I0=
```

### Application Environment
```
NODE_ENV=production            # production, development, or test
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Public URL for CORS and redirects
```

### Optional Email Configuration (Future)
```
SMTP_HOST=smtp.gmail.com       # Email provider SMTP host
SMTP_PORT=587                  # SMTP port (usually 587 for TLS)
SMTP_USER=your-email@gmail.com # Email account username
SMTP_PASSWORD=app_password     # Email app-specific password (not main password)
SMTP_FROM=noreply@tnai.com     # From address for emails
```

## Environment-Specific Configuration

### Local Development (.env.local)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm_dev
DB_USER=tnai_user
DB_PASSWORD=dev_password_123
JWT_SECRET=dev_secret_not_secure
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging (.env.staging)
```
DB_HOST=staging-postgres.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tnai_pm_staging
DB_USER=tnai_staging_user
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id tnai_staging_db_password)
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id tnai_staging_jwt_secret)
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.tnai-pm.example.com
```

### Production (.env.production)
```
DB_HOST=prod-postgres.rds.amazonaws.com
DB_PORT=5432
DB_NAME=tnai_pm_prod
DB_USER=tnai_prod_user
DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id tnai_prod_db_password)
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id tnai_prod_jwt_secret)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tnai-pm.example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=$(aws secretsmanager get-secret-value --secret-id sendgrid_api_key)
SMTP_FROM=noreply@tnai-pm.example.com
```

## EC2 Deployment Configuration

When deploying on EC2, create `.env` in `/opt/tnai-pm/`:

```bash
cat > /opt/tnai-pm/.env << 'EOF'
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tnai_pm
DB_USER=tnai_user
DB_PASSWORD=your_secure_password_here

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-ec2-ip

# Optional: Email (for future use)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=app_specific_password
# SMTP_FROM=noreply@example.com
EOF
```

## Security Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore (should already be there)
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. Use Secret Management
For production, use AWS Secrets Manager or similar:

```bash
# Retrieve secrets
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id tnai-pm/db-password \
  --query SecretString \
  --output text)

export JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id tnai-pm/jwt-secret \
  --query SecretString \
  --output text)
```

### 3. Rotate Secrets Regularly
```bash
# Change database password
sudo -u postgres psql -c "ALTER USER tnai_user PASSWORD 'new_secure_password';"

# Generate new JWT secret
openssl rand -base64 32

# Update .env file
# Restart application: pm2 restart tnai-pm
```

### 4. Environment-Specific Files
```
.env                  # Local development (in .gitignore)
.env.local            # Local overrides (in .gitignore)
.env.staging          # Staging secrets (in .gitignore, used in CI/CD)
.env.production       # Production secrets (in .gitignore, not in repo)
.env.example          # Template only (safe to commit)
```

## Troubleshooting

### Application Won't Start
**Problem**: `ENOENT: no such file or directory, open '.env'`
**Solution**: Create `.env` with required variables
```bash
cp .env.example .env
# Edit .env with real values
```

### Database Connection Error
**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`
**Check**:
1. PostgreSQL is running: `sudo systemctl status postgresql`
2. Correct host in DB_HOST
3. Correct port in DB_PORT
4. User/password match: `psql -U tnai_user -h localhost -d tnai_pm`

### JWT Token Invalid
**Problem**: `Invalid token` error on protected routes
**Check**:
1. JWT_SECRET matches value used when token was created
2. Test token manually:
```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({userId: 'test'}, process.env.JWT_SECRET);
console.log('Token:', token);
"
```

### Environment Variables Not Loading
**Problem**: `undefined` when accessing `process.env.DB_HOST`
**Check**:
1. Running from correct directory: `pwd`
2. File is .env not .env.txt
3. No extra spaces: `DB_HOST=localhost` (not `DB_HOST = localhost`)
4. Restart app after changing .env: `npm run build && npm start`

## Database Password Generation

Generate a secure password:
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Docker Environment Variables

If deploying with Docker, use:
```dockerfile
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV DB_NAME=${DB_NAME}
ENV DB_USER=${DB_USER}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV JWT_SECRET=${JWT_SECRET}
ENV NODE_ENV=production
```

Pass at runtime:
```bash
docker run \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_PASSWORD=$(cat .env.production | grep DB_PASSWORD) \
  tnai-pm:latest
```

## Verifying Configuration

After setting up .env, verify it works:

```bash
# Check environment variables are loaded
node -e "console.log(require('dotenv').config())"

# Test database connection
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT 1"

# Test application start
npm run build && npm start
```

## Summary

| Variable | Required | Local Dev | Production | Notes |
|----------|----------|-----------|-----------|-------|
| DB_HOST | Yes | localhost | RDS hostname | PostgreSQL server |
| DB_PORT | Yes | 5432 | 5432 | Default PostgreSQL port |
| DB_NAME | Yes | tnai_pm_dev | tnai_pm | Database name |
| DB_USER | Yes | tnai_user | tnai_user | DB user account |
| DB_PASSWORD | Yes | dev_pass | random 32+ chars | Store securely in prod |
| JWT_SECRET | Yes | dev_secret | random 32+ chars | Generate with openssl |
| NODE_ENV | Yes | development | production | Controls app behavior |
| NEXT_PUBLIC_APP_URL | No | http://localhost:3000 | https://yourdomain.com | Public app URL |
| SMTP_* | No | (skip) | yes | For future email feature |

---

**Last Updated**: 2024
**Application**: TNAI-PM v0.1.0
**Framework**: Next.js 14
**Database**: PostgreSQL 15+
