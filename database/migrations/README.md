# Database Migrations

This folder contains numbered database migration files for updating your Pabbly Status Monitor installation.

## How to Run Migrations on Production Server

```bash
# 1. Navigate to your installation directory
cd /opt/status-monitor  # or /root/status-monitor (depends on your installation)

# 2. Pull the latest code
git pull

# 3. Check for new migration files
ls database/migrations/

# 4. Run any new migrations you haven't run yet
# Option A: Using PGPASSWORD from .env (recommended)
PGPASSWORD=$(grep DATABASE_URL backend/.env | cut -d':' -f3 | cut -d'@' -f1) psql -U statusmonitor -d status_monitor -f database/migrations/001_add_smtp_settings.sql

# Option B: Manual password entry (will prompt for password)
psql -U statusmonitor -d status_monitor -f database/migrations/001_add_smtp_settings.sql

# 5. Restart the backend service
pm2 restart status-monitor
```

## Migration List

| Number | File | Description | Date |
|--------|------|-------------|------|
| 001 | 001_add_smtp_settings.sql | Add SMTP email settings columns to system_settings table | 2025-12-30 |

## Important Notes

- **Migrations are safe to run multiple times** - They use `IF NOT EXISTS` clauses
- **Always backup your database first** - Run `pg_dump` before applying migrations
- **Run migrations in numerical order** - Always run 001 before 002, etc.
