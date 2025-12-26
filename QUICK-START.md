# Quick Start Guide - Deploy to Hetzner in 15 Minutes

This guide will get your Pabbly Status Monitor up and running on a fresh Hetzner server quickly.

## Prerequisites

- Hetzner server with Ubuntu 22.04 (4GB RAM)
- Root SSH access to your server
- Domain pointing to your server IP (monitor.pabbly.com → your-server-ip)

## Step 1: Initial Server Setup (5 minutes)

SSH into your server:

```bash
ssh root@your-server-ip
```

Run the quick setup script:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL, Nginx, Git
apt install -y postgresql postgresql-contrib nginx git

# Install PM2
npm install -g pm2

# Start services
systemctl start postgresql nginx
systemctl enable postgresql nginx
```

## Step 2: Database Setup (2 minutes)

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE status_monitor;
CREATE USER status_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE status_monitor TO status_user;
\q
EOF

# Configure PostgreSQL
nano /etc/postgresql/14/main/pg_hba.conf
```

Add this line before other entries:
```
local   status_monitor   status_user   md5
```

Restart PostgreSQL:
```bash
systemctl restart postgresql
```

## Step 3: Clone and Setup Application (3 minutes)

```bash
# Clone repository
cd /root
git clone https://github.com/pabbly-apps/pabbly-status-uptime-monitoring.git
cd pabbly-status-uptime-monitoring

# Run database migrations
for file in database/migrations/*.sql; do
  psql -U status_user -d status_monitor -f "$file"
done

# Seed initial admin user
psql -U status_user -d status_monitor -f database/seeds/001_default_admin.sql
```

## Step 4: Configure Application (2 minutes)

### Backend .env

```bash
cd backend
nano .env
```

Add:
```env
DATABASE_URL=postgresql://status_user:your_secure_password_here@localhost:5432/status_monitor
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=production
PING_INTERVAL_MINUTES=1
LOG_RETENTION_DAYS=90
FRONTEND_URL=https://monitor.pabbly.com
```

Install dependencies:
```bash
npm install --production
```

### Frontend .env

```bash
cd ../frontend
nano .env
```

Add:
```env
VITE_API_URL=https://monitor.pabbly.com/api
```

Build frontend:
```bash
npm install
npm run build
```

## Step 5: Start Backend with PM2 (1 minute)

```bash
cd /root/pabbly-status-uptime-monitoring/backend
pm2 start src/server.js --name pabbly-status-backend --max-memory-restart 1G
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs.

## Step 6: Configure Nginx (2 minutes)

```bash
nano /etc/nginx/sites-available/pabbly-status
```

Add:
```nginx
server {
    listen 80;
    server_name monitor.pabbly.com;

    root /root/pabbly-status-uptime-monitoring/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:5000/health;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/pabbly-status /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 7: Setup SSL (1 minute)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d monitor.pabbly.com
```

Follow the prompts. Certbot will automatically configure HTTPS.

## Step 8: Configure Firewall (1 minute)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## Step 9: Verify Everything Works

Visit: https://monitor.pabbly.com

You should see the public status page.

### Login to Admin Dashboard

1. Go to: https://monitor.pabbly.com/admin/login
2. Email: `development@pabbly.com`
3. Password: See `database/seeds/001_default_admin.sql`

**IMPORTANT:** Change your password immediately in Settings!

## Step 10: Add Your APIs

1. Go to Admin Dashboard → APIs
2. Click "Add New API"
3. Enter API details (name, URL, expected status code)
4. Save

The system will start monitoring immediately!

## Automated Future Deployments

After initial setup, deploy updates automatically:

### Option 1: One-Command Deployment

From your local machine:

```bash
# Make script executable
chmod +x deploy.sh

# Deploy
./deploy.sh your-server-ip root
```

### Option 2: GitHub Actions (Auto-deploy on push)

1. Go to GitHub repository settings → Secrets
2. Add these secrets:
   - `SSH_PRIVATE_KEY`: Your private SSH key
   - `SSH_HOST`: Your server IP
   - `SSH_USER`: `root`
3. Push to main branch - auto deploys!

See [AUTOMATED-DEPLOYMENT.md](AUTOMATED-DEPLOYMENT.md) for complete automation guide.

## Troubleshooting

### Backend not starting
```bash
pm2 logs pabbly-status-backend
```

### Check services
```bash
pm2 status                    # Backend
systemctl status nginx        # Nginx
systemctl status postgresql   # Database
```

### Test health endpoint
```bash
curl http://localhost:5000/health
```

## Next Steps

1. **Configure Webhooks** - Go to Settings → Webhook Configuration
2. **Setup Email Notifications** - Add SMTP settings in backend/.env
3. **Create Database Backups** - See [DEPLOYMENT.md](DEPLOYMENT.md#database-backup)
4. **Monitor Logs** - `pm2 logs pabbly-status-backend`

## Support

For detailed deployment info, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete manual deployment guide
- [AUTOMATED-DEPLOYMENT.md](AUTOMATED-DEPLOYMENT.md) - CI/CD and automation

For issues: https://github.com/pabbly-apps/pabbly-status-uptime-monitoring/issues

---

**Deployed successfully?** You now have a production-ready uptime monitoring system running at https://monitor.pabbly.com!
