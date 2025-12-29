# Status Monitor - Real-time Uptime Monitoring

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D14.0-blue.svg)

A comprehensive, self-hosted status monitoring system for tracking API uptime, incidents, and service health with automated alerts and beautiful visualizations.

[Features](#features) • [Screenshots](#screenshots) • [Quick Start](#quick-start) • [Deployment](#deployment)

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
- 🔍 **Detailed Drill-Down** - View any specific day's ping data
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
- 🎨 **Modern Stack** - React 18, Node.js, PostgreSQL, TailwindCSS
- 🐳 **Easy Deployment** - Simple setup on any Ubuntu server

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
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
     - Password: \`251251\`
     - **⚠️ Change this password immediately after first login!**

---

## 📖 Configuration

### Backend Environment (.env)

Copy \`.env.example\` to \`.env\` and configure:

\`\`\`env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/status_monitor

# JWT Authentication (Generate using: openssl rand -base64 32)
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET
JWT_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=development
PING_INTERVAL_MINUTES=1
LOG_RETENTION_DAYS=90
FRONTEND_URL=http://localhost:5173

# Email Notifications (Optional)
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

1. **Change Default Credentials** - After installation, immediately log in and change the admin password from \`251251\`

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
- React 18, Vite, TailwindCSS
- React Router, Recharts, React Hot Toast
- Date-fns, Axios, Lucide Icons

### Backend
- Node.js, Express.js, PostgreSQL
- JWT, Bcrypt, node-cron
- Nodemailer, node-fetch

---

## 📸 Screenshots

### Public Status Page

<div align="center">

![Public Status Page](.github/images/public-status-page.jpg)
*Main public status page showing overall system health and monitored services*

</div>

### Detailed Views

<table>
  <tr>
    <td width="50%">
      <img src=".github/images/status-page-detailed.jpg" alt="Detailed Status View"/>
      <p align="center"><em>Detailed service view with 24h, 7d, and 90d uptime stats</em></p>
    </td>
    <td width="50%">
      <img src=".github/images/90-day-calendar.jpg" alt="90-Day Calendar"/>
      <p align="center"><em>90-day calendar heatmap visualization</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src=".github/images/daily-breakdown.jpg" alt="Daily Breakdown"/>
      <p align="center"><em>Detailed breakdown for any specific day</em></p>
    </td>
    <td width="50%">
      <img src=".github/images/error-response-details.jpg" alt="Error Details"/>
      <p align="center"><em>Full error response data for troubleshooting</em></p>
    </td>
  </tr>
</table>

### Admin Dashboard

<div align="center">

![Admin Dashboard](.github/images/admin-dashboard.jpg)
*Admin dashboard with real-time statistics and API management*

</div>

### Private Services & Incident Management

<table>
  <tr>
    <td width="50%">
      <img src=".github/images/private-services.jpg" alt="Private Services"/>
      <p align="center"><em>Private services monitoring (admin-only view)</em></p>
    </td>
    <td width="50%">
      <img src=".github/images/incident-reporting.jpg" alt="Incident Reporting"/>
      <p align="center"><em>Comprehensive incident tracking and reporting</em></p>
    </td>
  </tr>
</table>

### Settings & Configuration

<table>
  <tr>
    <td width="50%">
      <img src=".github/images/webhook-settings.jpg" alt="Webhook Settings"/>
      <p align="center"><em>Webhook configuration for real-time alerts</em></p>
    </td>
    <td width="50%">
      <img src=".github/images/system-settings.jpg" alt="System Settings"/>
      <p align="center"><em>System settings for branding and customization</em></p>
    </td>
  </tr>
</table>

### Mobile Responsive

<table>
  <tr>
    <td width="50%">
      <img src=".github/images/mobile-public.jpg" alt="Mobile Public View"/>
      <p align="center"><em>Mobile-optimized public status page</em></p>
    </td>
    <td width="50%">
      <img src=".github/images/mobile-admin.jpg" alt="Mobile Admin View"/>
      <p align="center"><em>Mobile-friendly admin dashboard</em></p>
    </td>
  </tr>
</table>

---

## 🌐 Deployment

For production deployment on cloud servers, see our deployment guide:

📘 **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete production deployment walkthrough

**Features:**
- Ubuntu 22.04 LTS setup
- Nginx reverse proxy
- SSL with Let's Encrypt
- PM2 process management
- Automated deployment scripts

**Deployment time:** ~15 minutes

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
