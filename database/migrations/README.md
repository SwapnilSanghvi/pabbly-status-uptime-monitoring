# Database Migrations

This folder contains numbered database migration files for updating your Pabbly Status Monitor installation.

## How to Run Migrations on Production Server

Follow these steps to apply database migrations after pulling new code:

```bash
# 1. Navigate to your installation directory
cd /opt/status-monitor

# 2. Pull the latest code
git pull

# 3. Check for new migration files
ls database/migrations/

# 4. Run each new migration you haven't applied yet, in numerical order
# Replace XXX with the migration number (001, 002, 003, etc.)

# Option A: Using PGPASSWORD from .env (recommended)
PGPASSWORD=$(grep DATABASE_URL backend/.env | cut -d':' -f3 | cut -d'@' -f1) psql -h localhost -U statusmonitor -d status_monitor -f database/migrations/XXX_migration_name.sql

# Option B: Manual password entry (will prompt for password)
psql -h localhost -U statusmonitor -d status_monitor -f database/migrations/XXX_migration_name.sql

# 5. Restart the backend service after applying all migrations
pm2 restart status-monitor
```

## Example: Running Migration 002

If you already have migration 001 applied and need to run migration 002:

```bash
cd /opt/status-monitor

# Pull latest code
git pull

# Extract database password from .env
PGPASSWORD=$(grep DATABASE_URL backend/.env | cut -d':' -f3 | cut -d'@' -f1)

# Run migration 002 (API Groups Feature)
PGPASSWORD=$PGPASSWORD psql -h localhost -U statusmonitor -d status_monitor -f database/migrations/002_add_api_groups.sql

# Restart backend
pm2 restart status-monitor
```

## Migration List

| Number | File | Description | Date |
|--------|------|-------------|------|
| 001 | 001_add_smtp_settings.sql | Add SMTP email settings columns to system_settings table | 2025-12-30 |
| 002 | 002_add_api_groups.sql | Complete API Groups feature: adds api_groups table, group_id column, is_default flag, and default "Ungrouped" group for organizing monitored services into collapsible groups | 2025-12-30 |

## Important Notes

- **Migrations are safe to run multiple times** - They use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` clauses
- **Always backup your database first** - Run `pg_dump status_monitor > backup_$(date +%Y%m%d).sql` before applying migrations
- **Run migrations in numerical order** - Always run 001 before 002, 002 before 003, etc.
- **Check migration output** - Look for any error messages during execution
- **Restart backend after migrations** - Always run `pm2 restart status-monitor` after applying migrations

## Troubleshooting

**Q: How do I know which migrations I've already run?**
A: Check your database schema or review your deployment logs. You can also run migrations again - they're idempotent (safe to run multiple times).

**Q: Migration failed with "permission denied"**
A: Make sure you're using the correct database user (statusmonitor) and password from your .env file.

**Q: How do I rollback a migration?**
A: Migrations don't have automatic rollback. Restore from your backup using:
```bash
psql -h localhost -U statusmonitor -d status_monitor < backup_YYYYMMDD.sql
```

**Q: Getting "Peer authentication failed" error?**
A: Add `-h localhost` to force TCP connection instead of Unix socket. All commands above include this flag.
