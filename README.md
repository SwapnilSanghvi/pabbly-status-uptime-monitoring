# Status Monitor - Real-time Uptime Monitoring

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D14.0-blue.svg)

A comprehensive, self-hosted status monitoring system for tracking API uptime, incidents, and service health with automated alerts and beautiful visualizations.

<a href="https://monitor.pabbly.com/" target="_blank"><strong>🌐 View Live Demo</strong></a> | [Features](#-features) • [Quick Start](#-quick-start) • [Screenshots](#-screenshots) • [Configuration](#-configuration)

</div>

---

## 🎯 Overview

Status Monitor is a production-ready, open-source uptime monitoring solution that helps you track the health of your APIs and services. It provides:

- **Real-time Monitoring**: Automated health checks every minute
- **Public Status Page**: Clean, responsive page for end users
- **Admin Dashboard**: Comprehensive panel for managing APIs and incidents
- **Automated Alerts**: Webhook and email notifications for downtime
- **Historical Analytics**: 90-day uptime tracking with drill-down capability
- **Incident Management**: Automatic detection and resolution tracking

### 🎯 What Makes It Different?

Unlike traditional status pages that only show *when* downtime occurred, Status Monitor goes further by capturing and displaying **exact API responses** during failures. Click on any downtime event to see the actual error response, status codes, and response times - making debugging and root cause analysis significantly easier.

Perfect for SaaS companies, development teams, and anyone who needs to monitor API uptime and communicate service status to users.

---

## ✨ Features

### Monitoring & Alerts
- ⚡ **Automated API Monitoring** - Ping checks every minute (configurable)
- 📊 **Historical Data** - 24h, 7d, 30d, and 90d uptime tracking
- 🔔 **Webhook Notifications** - Real-time alerts when APIs go down/up
- 📧 **Email Alerts** - Optional email notifications for downtime events
- 🎯 **Smart Incident Detection** - Automatic incident creation and resolution
- 📈 **Response Time Tracking** - Min, max, and average response times

### Public Status Page
- 🌐 **Clean Status Page** - Beautiful, responsive public status display
- 📅 **90-Day Calendar View** - Visual heatmap of service health
- 📉 **Response Time Charts** - Hourly aggregated performance data
- 🔍 **Detailed Drill-Down** - View any specific day's ping data with exact API responses
- 💡 **Error Response Visibility** - See actual error messages, status codes, and responses during downtime
- 🕐 **Timezone Support** - Display times in user's local timezone
- ♻️ **Auto-Refresh** - Real-time updates every 30 seconds

### Admin Dashboard
- 🎛️ **API Management** - Add, edit, delete, and reorder monitored services
- 📊 **Dashboard Stats** - Real-time overview of system health
- 🔐 **Secure Authentication** - JWT-based admin access
- ⚙️ **Customization** - Branding, colors, and messaging
- 🔧 **Flexible Configuration** - Per-API settings (interval, timeout, status code)
- 🔓 **Public/Private APIs** - Hide sensitive services from public view

### Technical Features
- 🏗️ **Self-Hosted** - Complete control over your data
- 🚀 **Production Ready** - Battle-tested with proper error handling
- 🔒 **Secure** - Bcrypt password hashing, JWT authentication
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🎨 **Modern Stack** - React 19, Node.js 22, PostgreSQL, TailwindCSS
- 🐳 **Easy Deployment** - Simple setup on any Ubuntu server

---

## 🚀 Quick Start

### 🎯 One-Command Installation (Recommended for Production)

Deploy Status Monitor to your Ubuntu/Debian server with a single command:

```bash
curl -sSL https://raw.githubusercontent.com/pabbly-apps/pabbly-status-uptime-monitoring/main/install.sh | sudo bash
```

**What it does:**
- ✅ Installs all dependencies (Node.js, PostgreSQL, Nginx, PM2, Certbot)
- ✅ Sets up database with secure auto-generated passwords
- ✅ Configures Nginx reverse proxy
- ✅ Installs SSL certificate with Let's Encrypt
- ✅ Starts application with PM2 process manager
- ✅ Configures firewall (UFW)
- ✅ Sets up auto-start on server reboot

**You'll only be asked:**
- Your domain name (e.g., `status.yourdomain.com`)
- Admin email for login

**Installation time:** ~10 minutes

---

### 🛠️ Manual Local Development Setup

### Prerequisites

- **Node.js** 22+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**

### Installation (5 Minutes)

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/pabbly-apps/pabbly-status-uptime-monitoring.git
   cd pabbly-status-uptime-monitoring
   \`\`\`

2. **Setup Database**
   \`\`\`bash
   # Create PostgreSQL database
   createdb status_monitor

   # Run schema (creates all tables and seed data in one command!)
   psql -U postgres -d status_monitor -f database/schema.sql
   \`\`\`

   That's it! The schema file creates all tables, indexes, and initial data.

3. **Configure Backend**
   \`\`\`bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   npm install
   npm run dev
   \`\`\`

4. **Configure Frontend**
   \`\`\`bash
   cd ../frontend
   npm install
   npm run dev
   \`\`\`

5. **Access the Application**
   - **Public Status Page**: http://localhost:5173
   - **Admin Login**: http://localhost:5173/admin/login
     - Email: \`admin@example.com\`
     - Password: \`admin123\`
     - **⚠️ Change this password immediately after first login!**

---

## 📖 Configuration

### Backend Environment (.env)

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/status_monitor

JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET
JWT_EXPIRY=7d

PORT=5000
NODE_ENV=development
PING_INTERVAL_MINUTES=1
LOG_RETENTION_DAYS=90
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Status Monitor <noreply@example.com>
\`\`\`

### Frontend Environment (.env)

\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

---

## 🔐 Security

### Important Security Steps

1. **Change Default Credentials** - After installation, immediately log in and change the admin password from \`admin123\`

2. **Generate Strong JWT Secret**
   \`\`\`bash
   openssl rand -base64 32
   \`\`\`

3. **Update Database Password** - Change PostgreSQL password from the default

4. **Never Commit .env** - The \`.env\` file is in \`.gitignore\` - never commit it

5. **Production Deployment**
   - Use strong, unique passwords for all services
   - Enable HTTPS/SSL with Let's Encrypt
   - Configure firewall rules
   - Keep system packages updated

---

## 🏗️ Tech Stack

### Frontend
- React 19, Vite, TailwindCSS
- React Router, Recharts, React Hot Toast
- Date-fns, Axios, Lucide Icons

### Backend
- Node.js, Express.js, PostgreSQL
- JWT, Bcrypt, node-cron
- Nodemailer, node-fetch

---

## 📸 Screenshots

### Public Status Page
![Public Status Page](.github/images/public-status-page.jpg)

### Detailed View with Uptime Stats
![Detailed View](.github/images/status-page-detailed.jpg)

### 90-Day Calendar View
![90-Day Calendar](.github/images/90-day-calendar.jpg)

### Daily Breakdown
![Daily Breakdown](.github/images/daily-breakdown.jpg)

### Drill-Down to See Exact Error Response Details
![Error Response Details](.github/images/error-response-drilldown.jpg)

### Private Services (Admin-Only View)
![Private Services](.github/images/private-services-admin.jpg)

### Public Status Page Showing Public Services and Recent Incidents
![Public Services and Incidents](.github/images/public-services-incidents.jpg)

### Admin Dashboard - All Monitored Services
![Admin Dashboard](.github/images/admin-dashboard-services.jpg)

### Webhook Configuration
![Webhook Settings](.github/images/webhook-configuration.jpg)

### System Settings (Logo, Branding, Customization)
![System Settings](.github/images/system-settings-branding.jpg)

### Mobile View - Public Status Page
![Mobile Public Status](.github/images/mobile-public-status.jpg)

### Mobile View - Admin Dashboard
![Mobile Admin Dashboard](.github/images/mobile-admin-dashboard.jpg)

---

## 📘 Advanced Documentation

For manual deployment or advanced configuration options:

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete production deployment walkthrough
- **[Configuration Guide](docs/CONFIGURATION.md)** - Advanced configuration options

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/pabbly-apps/pabbly-status-uptime-monitoring/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pabbly-apps/pabbly-status-uptime-monitoring/discussions)

---

<div align="center">

Made with ❤️ by the Pabbly team

</div>
