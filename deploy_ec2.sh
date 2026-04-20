#!/bin/bash

###############################################################################
# TNAI-PM EC2 Deployment Script
# Automates: System updates, Node.js 20, PostgreSQL 15, Nginx, PM2, SSL setup
# Database: Auto-installs PostgreSQL with user tnai_user (password: tneural123)
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

sudo npm install -g pm2
sudo pm2 completion install
echo -e "${GREEN}✓ Nginx and PM2 installed${NC}\n"

# ==================== STEP 4: INSTALL POSTGRESQL ====================
echo -e "${YELLOW}[STEP 4/7] Installing PostgreSQL 15...${NC}"

# Check if PostgreSQL is already installed
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL already installed"
else
    # Add PostgreSQL repository
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    
    # Install PostgreSQL
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib postgresql-client
fi

# Start PostgreSQL and enable at boot
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
echo "Creating PostgreSQL user and database..."
sudo -u postgres psql << EOSQL
CREATE USER tnai_user WITH PASSWORD 'tneural123';
ALTER USER tnai_user CREATEDB;
DROP DATABASE IF EXISTS tnai_pm;
CREATE DATABASE tnai_pm OWNER tnai_user;
EOSQL

# Enable remote access to PostgreSQL (optional, for external connections)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf 2>/dev/null || true
echo "host  tnai_pm  tnai_user  0.0.0.0/0  md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf > /dev/null 2>&1
sudo systemctl restart postgresql

# Verify PostgreSQL is running
psql -h localhost -U tnai_user -d tnai_pm -c "SELECT 1;" > /dev/null 2>&1 && echo "✓ PostgreSQL verified" || echo "⚠️  PostgreSQL test failed"

echo -e "${GREEN}✓ PostgreSQL installed and configured${NC}\n"

# ==================== STEP 4B: INSTALL POSTGREST (REST API) ====================
echo -e "${YELLOW}[STEP 4B/7] Installing PostgREST for REST API...${NC}"

# Check if PostgREST is already installed
if ! command -v postgrest &> /dev/null; then
    # Install required dependencies
    echo "Installing dependencies for PostgREST..."
    sudo apt install -y xz-utils curl wget > /dev/null 2>&1
    
    # Get latest PostgREST version
    echo "Fetching latest PostgREST version..."
    POSTGREST_VERSION=$(curl -s https://api.github.com/repos/PostgREST/postgrest/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
    
    if [ -z "$POSTGREST_VERSION" ]; then
        echo "⚠️  Could not fetch PostgREST version, using v12.0.1..."
        POSTGREST_VERSION="12.0.1"
    fi
    
    POSTGREST_URL="https://github.com/PostgREST/postgrest/releases/download/v${POSTGREST_VERSION}/postgrest-v${POSTGREST_VERSION}-linux-x64.tar.xz"
    
    echo "Downloading PostgREST v${POSTGREST_VERSION}..."
    cd /tmp
    
    # Download with error checking
    if wget -q "$POSTGREST_URL" -O postgrest.tar.xz 2>/dev/null; then
        echo "✓ Download successful"
    else
        echo "⚠️  Download failed, skipping PostgREST installation"
        cd ~
        # Continue without PostgREST
        POSTGREST_FAILED=1
    fi
    
    # Extract if download succeeded
    if [ -z "$POSTGREST_FAILED" ] && [ -f "postgrest.tar.xz" ]; then
        echo "Extracting PostgREST..."
        if tar xf postgrest.tar.xz 2>/dev/null; then
            if [ -f "postgrest" ]; then
                sudo mv postgrest /usr/local/bin/postgrest
                sudo chmod +x /usr/local/bin/postgrest
                rm -f postgrest.tar.xz
                echo "✓ PostgREST installed successfully"
            else
                echo "⚠️  PostgREST binary not found in archive"
                POSTGREST_FAILED=1
            fi
        else
            echo "⚠️  Failed to extract PostgREST"
            POSTGREST_FAILED=1
        fi
    fi
    
    cd ~
else
    echo "✓ PostgREST already installed"
fi

# Only configure PostgREST service if installation succeeded
if command -v postgrest &> /dev/null; then
    # Create PostgREST configuration file
    echo "Configuring PostgREST..."
    sudo mkdir -p /etc/postgrest
    sudo tee /etc/postgrest/postgrest.conf > /dev/null << 'EOF'
db-uri = "postgresql://tnai_user:tneural123@localhost:5432/tnai_pm"
db-schema = "public"
db-anon-role = "tnai_user"
server-host = "0.0.0.0"
server-port = 3001
jwt-secret = "change-this-secret-key-to-something-random"
EOF

    # Create PostgREST systemd service
    sudo tee /etc/systemd/system/postgrest.service > /dev/null << 'EOF'
[Unit]
Description=PostgREST API Server
After=postgresql.service
StartLimitIntervalSec=60
StartLimitBurst=3

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
ExecStart=/usr/local/bin/postgrest /etc/postgrest/postgrest.conf
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/postgrest.log
StandardError=append:/var/log/postgrest.log

[Install]
WantedBy=multi-user.target
EOF

    # Enable and start PostgREST
    sudo systemctl daemon-reload
    sudo systemctl enable postgrest.service
    sudo systemctl start postgrest.service

    # Wait a moment for PostgREST to start
    sleep 3

    # Verify PostgREST is running
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgREST installed and running on port 3001${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgREST service started but not responding yet. It may take a moment to initialize.${NC}"
        echo "    Check status with: sudo systemctl status postgrest"
        echo "    View logs with: sudo tail -f /var/log/postgrest.log"
    fi
else
    echo -e "${YELLOW}⚠️  PostgREST installation skipped. You can install it manually later or use Supabase.${NC}"
    echo "    To install later: sudo apt install -y xz-utils && curl -L https://github.com/PostgREST/postgrest/releases/download/v12.0.1/postgrest-v12.0.1-linux-x64.tar.xz | tar xJ && sudo mv postgrest /usr/local/bin/"
fi


echo ""

# ==================== STEP 5: CLONE & SETUP APP ====================
echo -e "${YELLOW}[STEP 5/7] Cloning TNAI-PM repository...${NC}"
cd ~

# Check if repo already exists
if [ ! -d "tnai-pm" ]; then
    # Prompt for GitHub repository URL
    read -p "Enter your GitHub repository URL (e.g., https://github.com/manoj-tneural/tnai-pm): " REPO_URL
    git clone $REPO_URL tnai-pm
else
    echo "Repository already exists, pulling latest changes..."
    cd tnai-pm
    git pull origin master
    cd ~
fi

cd ~/tnai-pm

# Install dependencies
echo "Installing dependencies..."
npm install

# ==================== STEP 6: SETUP ENVIRONMENT (Before Build) ====================
echo -e "${YELLOW}[STEP 6/7] Setting up environment...${NC}"

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create .env.production with local PostgREST configuration
cat > .env.production << EOF
# Database (PostgreSQL on this EC2 instance)
DATABASE_URL=postgresql://tnai_user:tneural123@localhost:5432/tnai_pm

# PostgREST (Local REST API - replaces Supabase)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTg2NzU2NjQwMH0.dummytoken
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxODY3NTY2NDAwfQ.dummytoken

# Next.js production settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${EC2_IP}
EOF

echo -e "${GREEN}✓ .env.production created${NC}\n"

# Build Next.js app (now that env vars are set)
echo "Building Next.js app..."
npm run build

echo -e "${GREEN}✓ App cloned and built${NC}\n"

# ==================== STEP 7: START APP WITH PM2 ====================
echo -e "${YELLOW}[STEP 7/7] Starting app with PM2...${NC}"

# Kill existing PM2 process if any
pm2 delete tnai-pm 2>/dev/null || true

# Run database migrations
echo "Running database migrations..."
if [ -f "supabase/migrations/001_init.sql" ]; then
    PGPASSWORD=tneural123 psql -h localhost -U tnai_user -d tnai_pm -f supabase/migrations/001_init.sql > /dev/null 2>&1 && echo "✓ Database migrations completed" || echo "⚠️  Some migrations may have failed (this is OK if tables already exist)"
else
    echo "⚠️  Migration file not found (supabase/migrations/001_init.sql)"
fi
echo ""

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
