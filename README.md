# Pabbly Status - Uptime Monitoring

A comprehensive real-time status monitoring system for tracking API uptime, incidents, and service health.

## Features

- **Real-time API Monitoring** - Automated ping checks every minute
- **Incident Management** - Automatic incident creation and resolution
- **Webhook Notifications** - Send alerts when APIs go down or come back up
- **Email Alerts** - Optional email notifications for downtime events
- **Public Status Page** - Clean, responsive status page for end users
- **Admin Dashboard** - Comprehensive admin panel for managing APIs and incidents
- **Historical Data** - 24h, 7d, 30d, and 90d uptime tracking with drill-down capability
- **Visual Charts** - Bar charts showing uptime/downtime at minute-level granularity

## Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router
- Recharts
- React Hot Toast
- Date-fns

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pabbly-apps/pabbly-status-uptime-monitoring.git
   cd pabbly-status-uptime-monitoring
   ```

2. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb status_monitor

   # Run schema
   psql -U postgres -d status_monitor -f database/schema.sql

   # Run migrations
   for file in database/migrations/*.sql; do
     psql -U postgres -d status_monitor -f "$file"
   done

   # Seed data
   psql -U postgres -d status_monitor -f database/seeds/001_default_admin.sql
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install

   # Create .env file (see Environment Variables section below)
   npm run dev
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the Application**
   - Public Status Page: http://localhost:5173
   - Admin Login: http://localhost:5173/admin/login
     - Email: `development@pabbly.com`
     - Password: `251251`

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/status_monitor
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development
PING_INTERVAL_MINUTES=1
LOG_RETENTION_DAYS=90
FRONTEND_URL=http://localhost:5173
```

## Deployment to Hetzner

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

## License

MIT
