#!/bin/bash

###############################################################################
# TNAI-PM EC2 Deployment Script
# Automates: Node.js, PostgreSQL, Nginx, PM2, SSL setup
# Usage: ./deploy_ec2.sh
###############################################################################

set -e  # Exit on error

echo "🚀 Starting TNAI-PM EC2 Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================== STEP 1: UPDATE SYSTEM ====================
echo -e "${YELLOW}[STEP 1/6] Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}\n"

# ==================== STEP 2: INSTALL NODE.JS ====================
echo -e "${YELLOW}[STEP 2/6] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js installed${NC}\n"

# ==================== STEP 3: INSTALL NGINX & PM2 ====================
echo -e "${YELLOW}[STEP 3/6] Installing Nginx and PM2...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

npm install -g pm2
pm2 completion install
echo -e "${GREEN}✓ Nginx and PM2 installed${NC}\n"

# ==================== STEP 4: CLONE & SETUP APP ====================
echo -e "${YELLOW}[STEP 4/6] Cloning TNAI-PM repository...${NC}"
cd ~

# Check if repo already exists
if [ ! -d "tnai-pm" ]; then
    # Prompt for GitHub repository URL
    read -p "Enter your GitHub repository URL (e.g., https://github.com/yourname/tnai-pm): " REPO_URL
    git clone $REPO_URL tnai-pm
else
    echo "Repository already exists, pulling latest changes..."
    cd tnai-pm
    git pull origin main
    cd ~
fi

cd ~/tnai-pm

# Install dependencies
echo "Installing dependencies..."
npm install

# Build Next.js app
echo "Building Next.js app..."
npm run build

echo -e "${GREEN}✓ App cloned and built${NC}\n"

# ==================== STEP 5: SETUP ENVIRONMENT ====================
echo -e "${YELLOW}[STEP 5/6] Setting up environment...${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Creating .env.production file...${NC}"
    echo ""
    echo "⚠️  You need to provide your database credentials."
    echo ""
    read -p "Enter your PostgreSQL host (RDS endpoint or localhost): " DB_HOST
    read -p "Enter database name [default: tnai_pm]: " DB_NAME
    DB_NAME=${DB_NAME:-tnai_pm}
    read -p "Enter database user [default: tnai_user]: " DB_USER
    DB_USER=${DB_USER:-tnai_user}
    read -sp "Enter database password: " DB_PASS
    echo ""
    
    # Get EC2 public IP
    EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    cat > .env.production << EOF
# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}

# Supabase compatibility (dummy values for auth system)
NEXT_PUBLIC_SUPABASE_URL=http://${EC2_IP}
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-anon-key-for-local-auth
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key-for-local-auth

# Next.js production settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://${EC2_IP}
EOF
    
    echo -e "${GREEN}✓ .env.production created${NC}"
else
    echo "✓ .env.production already exists"
fi
echo ""

# ==================== STEP 6: START APP WITH PM2 ====================
echo -e "${YELLOW}[STEP 6/6] Starting app with PM2...${NC}"

# Kill existing PM2 process if any
pm2 delete tnai-pm 2>/dev/null || true

# Start the app
pm2 start npm --name "tnai-pm" -- start
pm2 startup -u ubuntu --hp /home/ubuntu > /dev/null 2>&1
pm2 save

echo -e "${GREEN}✓ App started with PM2${NC}\n"

# ==================== VERIFY DEPLOYMENT ====================
echo -e "${YELLOW}Verifying deployment...${NC}"
sleep 3

pm2 status
echo ""

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Update your domain's DNS to point to this EC2 instance"
echo "2. Configure Nginx:"
echo "   sudo nano /etc/nginx/sites-available/tnai-pm"
echo "   (Copy config from DEPLOY.md, Step 3)"
echo "   sudo systemctl restart nginx"
echo "3. Set up SSL certificate:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot certonly --nginx -d your-domain.com"
echo ""
echo "📊 App Status:"
pm2 logs tnai-pm --lines 5
echo ""
echo "🌐 Access your app:"
echo "   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo ""
echo "📝 View logs:"
echo "   pm2 logs tnai-pm"
echo ""
echo "🔄 Update & restart:"
echo "   cd ~/tnai-pm && git pull && npm install && npm run build && pm2 reload tnai-pm"
echo ""
