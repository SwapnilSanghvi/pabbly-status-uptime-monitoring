#!/bin/bash

# Pabbly Status Monitor - Automated Deployment Script
# Usage: ./deploy.sh [server-ip] [ssh-user]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-"your-server-ip"}
SSH_USER=${2:-"root"}
APP_DIR="/root/pabbly-status-uptime-monitoring"
DOMAIN="monitor.pabbly.com"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Pabbly Status Monitor Deployment${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Validate inputs
if [ "$SERVER_IP" = "your-server-ip" ]; then
    echo -e "${RED}Error: Please provide server IP${NC}"
    echo "Usage: ./deploy.sh <server-ip> [ssh-user]"
    echo "Example: ./deploy.sh 123.45.67.89 root"
    exit 1
fi

echo -e "${YELLOW}Deploying to: $SSH_USER@$SERVER_IP${NC}"
echo -e "${YELLOW}Application directory: $APP_DIR${NC}"
echo ""

# Function to execute commands on remote server
remote_exec() {
    ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

# Step 1: Check if repository exists, clone or pull
echo -e "${GREEN}[1/8] Syncing code from GitHub...${NC}"
if remote_exec "[ -d $APP_DIR ]"; then
    echo "Repository exists, pulling latest changes..."
    remote_exec "cd $APP_DIR && git pull origin main"
else
    echo "Cloning repository..."
    remote_exec "git clone https://github.com/pabbly-apps/pabbly-status-uptime-monitoring.git $APP_DIR"
fi

# Step 2: Install backend dependencies
echo -e "${GREEN}[2/8] Installing backend dependencies...${NC}"
remote_exec "cd $APP_DIR/backend && npm install --production"

# Step 3: Install frontend dependencies and build
echo -e "${GREEN}[3/8] Building frontend...${NC}"
remote_exec "cd $APP_DIR/frontend && npm install && npm run build"

# Step 4: Run database migrations
echo -e "${GREEN}[4/8] Running database migrations...${NC}"
echo "Checking for pending migrations..."
remote_exec "cd $APP_DIR && for file in database/migrations/*.sql; do echo \"Running \$file...\"; psql -U pabbly_user -d status_monitor -f \"\$file\" 2>&1 | grep -v 'already exists' || true; done"

# Step 5: Restart backend with PM2
echo -e "${GREEN}[5/8] Restarting backend service...${NC}"
if remote_exec "pm2 describe pabbly-status-backend > /dev/null 2>&1"; then
    echo "Restarting existing PM2 process..."
    remote_exec "pm2 restart pabbly-status-backend"
else
    echo "Starting new PM2 process..."
    remote_exec "cd $APP_DIR/backend && pm2 start src/server.js --name pabbly-status-backend --max-memory-restart 1G"
    remote_exec "pm2 save"
fi

# Step 6: Reload Nginx
echo -e "${GREEN}[6/8] Reloading Nginx...${NC}"
remote_exec "sudo systemctl reload nginx"

# Step 7: Check service health
echo -e "${GREEN}[7/8] Checking service health...${NC}"
sleep 3
if remote_exec "pm2 status | grep pabbly-status-backend | grep online"; then
    echo -e "${GREEN}✓ Backend service is running${NC}"
else
    echo -e "${RED}✗ Backend service failed to start${NC}"
    remote_exec "pm2 logs pabbly-status-backend --lines 50"
    exit 1
fi

# Step 8: Display deployment info
echo -e "${GREEN}[8/8] Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "Public Status Page: ${YELLOW}https://$DOMAIN${NC}"
echo -e "Admin Dashboard:    ${YELLOW}https://$DOMAIN/admin/login${NC}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:     ssh $SSH_USER@$SERVER_IP 'pm2 logs pabbly-status-backend'"
echo -e "  Check status:  ssh $SSH_USER@$SERVER_IP 'pm2 status'"
echo -e "  Restart app:   ssh $SSH_USER@$SERVER_IP 'pm2 restart pabbly-status-backend'"
echo ""
echo -e "${GREEN}Done!${NC}"
