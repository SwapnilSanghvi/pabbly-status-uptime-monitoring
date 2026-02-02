# Pabbly Status Monitor - Complete Project Reference

> Self-hosted API uptime monitoring system. Backend v1.3.1, Frontend v1.1.0.

## Tech Stack

- **Backend**: Node.js 22+, Express.js, PostgreSQL 14+, ES Modules
- **Frontend**: React 19, Vite 7, Tailwind CSS 3.4, React Router DOM 7
- **Auth**: JWT (jsonwebtoken) + bcrypt (10 rounds)
- **Scheduling**: node-cron (1-min ping intervals)
- **Email**: nodemailer (SMTP from DB settings)
- **HTTP Agent**: undici (disabled keepalive for Cloudflare compatibility)
- **Charts**: Recharts 3.6
- **Drag-and-Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Date**: date-fns 4
- **HTTP Client**: axios 1.13 (frontend)
- **Icons**: Heroicons (inline SVG, no icon library)
- **Toasts**: react-hot-toast 2.6

## Project Structure

```
backend/
  src/
    config/        database.js, migrate.js, upload.js
    controllers/   authController.js, adminController.js, publicController.js
    middleware/     auth.js
    routes/        auth.js, admin.js, public.js
    services/      monitorService.js, uptimeService.js, emailService.js, incidentService.js, webhookService.js
  server.js
  uploads/         (logo files)
frontend/
  src/
    components/
      admin/       AddAPIModal.jsx, APITable.jsx, GroupManageModal.jsx, QuickStats.jsx
      public/      IncidentList.jsx, ServiceCard.jsx, ServiceDetailsModal.jsx, StatusHeader.jsx, StatusTimeline.jsx, UptimeCalendar.jsx
      shared/      ErrorBoundary.jsx, Loading.jsx, Timestamp.jsx, TimezoneToggle.jsx
    context/       AuthContext.jsx
    contexts/      TimezoneContext.jsx
    pages/         Login.jsx, AdminDashboard.jsx, PublicStatus.jsx, Settings.jsx, NotFound.jsx
    services/      api.js, authService.js, adminService.js, publicService.js
    utils/         ProtectedRoute.jsx, timezone.js
    App.jsx, main.jsx, index.css, App.css
  index.html, tailwind.config.js, vite.config.js, postcss.config.js
database/
  schema.sql
  migrations/      001_add_smtp_settings.sql, 002_add_api_groups.sql, 003_add_incident_status_code.sql
```

## Database: PostgreSQL 14+

Database name: `status_monitor`. 8 tables total.

### Complete Schema (schema.sql)

```sql
-- ============================================================================
-- 1. ADMIN USER TABLE
-- ============================================================================
-- Stores admin user credentials and profile information
CREATE TABLE IF NOT EXISTS admin_user (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_user(email);


-- ============================================================================
-- 2. SYSTEM SETTINGS TABLE
-- ============================================================================
-- Single-row table for global application settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  page_title VARCHAR(255) DEFAULT 'System Status',
  logo_url TEXT,
  brand_color VARCHAR(7) DEFAULT '#3b82f6',
  custom_message TEXT,
  notification_email VARCHAR(255),
  notifications_enabled BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  webhook_enabled BOOLEAN DEFAULT FALSE,
  data_retention_days INTEGER DEFAULT 90,

  -- SMTP Email Settings
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT,
  smtp_pass TEXT,
  smtp_from TEXT,
  smtp_recipients TEXT,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);


-- ============================================================================
-- 3. API GROUPS TABLE
-- ============================================================================
-- Stores API groups for organizing monitored services
CREATE TABLE IF NOT EXISTS api_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_groups_display_order ON api_groups(display_order);
CREATE INDEX IF NOT EXISTS idx_api_groups_name ON api_groups(name);
CREATE INDEX IF NOT EXISTS idx_api_groups_is_default ON api_groups(is_default);


-- ============================================================================
-- 4. APIS TABLE
-- ============================================================================
-- Stores all APIs/services being monitored
CREATE TABLE IF NOT EXISTS apis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  monitoring_interval INTEGER DEFAULT 60,        -- seconds
  expected_status_code INTEGER DEFAULT 200,
  timeout_duration INTEGER DEFAULT 30000,        -- milliseconds
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,                -- visible on public status page
  display_order INTEGER DEFAULT 0,               -- for custom ordering
  group_id INTEGER REFERENCES api_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apis_is_active ON apis(is_active);
CREATE INDEX IF NOT EXISTS idx_apis_name ON apis(name);
CREATE INDEX IF NOT EXISTS idx_apis_display_order ON apis(display_order);
CREATE INDEX IF NOT EXISTS idx_apis_is_public ON apis(is_public);
CREATE INDEX IF NOT EXISTS idx_apis_group_id ON apis(group_id);


-- ============================================================================
-- 5. PING LOGS TABLE
-- ============================================================================
-- Stores all ping/health check results
CREATE TABLE IF NOT EXISTS ping_logs (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,                   -- 'success', 'failure', 'timeout'
  status_code INTEGER,
  response_time INTEGER,                         -- milliseconds
  error_message TEXT,
  response_body TEXT,                            -- truncated to 50KB max
  response_headers JSONB,                        -- HTTP response headers as JSON
  pinged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ping_logs_api_id ON ping_logs(api_id);
CREATE INDEX IF NOT EXISTS idx_ping_logs_pinged_at ON ping_logs(pinged_at);
CREATE INDEX IF NOT EXISTS idx_ping_logs_api_pinged ON ping_logs(api_id, pinged_at DESC);


-- ============================================================================
-- 6. INCIDENTS TABLE
-- ============================================================================
-- Tracks downtime incidents for each API
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'ongoing',          -- 'ongoing', 'identified', 'monitoring', 'resolved'
  status_code INTEGER,                           -- HTTP status code that caused incident
  started_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_api_id ON incidents(api_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at DESC);


-- ============================================================================
-- 7. UPTIME SUMMARIES TABLE
-- ============================================================================
-- Pre-calculated uptime statistics for different time periods
CREATE TABLE IF NOT EXISTS uptime_summaries (
  id SERIAL PRIMARY KEY,
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,                   -- '24h', '7d', '30d', '90d'
  uptime_percentage DECIMAL(5,2),
  total_pings INTEGER,
  successful_pings INTEGER,
  failed_pings INTEGER,
  avg_response_time INTEGER,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(api_id, period)
);

CREATE INDEX IF NOT EXISTS idx_uptime_summaries_api_period ON uptime_summaries(api_id, period);


-- ============================================================================
-- 8. WEBHOOK LOGS TABLE
-- ============================================================================
-- Audit trail for all webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  event_type VARCHAR(50) NOT NULL,               -- 'api_down', 'api_up'
  api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
  incident_id INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time INTEGER,                         -- milliseconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_api_id ON webhook_logs(api_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_success ON webhook_logs(success);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
```

### Seed Data

```sql
-- Default system settings row
INSERT INTO system_settings (id, page_title, brand_color, notifications_enabled, webhook_enabled, data_retention_days, smtp_port)
VALUES (1, 'System Status', '#3b82f6', FALSE, FALSE, 90, 587)
ON CONFLICT (id) DO NOTHING;

-- Default "Ungrouped" group (fixed ID = 1, is_default = true)
INSERT INTO api_groups (id, name, description, display_order, is_collapsed, is_default)
VALUES (1, 'Ungrouped', 'APIs without a specific group', 999, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Set sequence to avoid conflicts with default group
SELECT setval('api_groups_id_seq', (SELECT GREATEST(2, MAX(id) + 1) FROM api_groups), false);

-- Default admin user (Email: admin@example.com, Password: admin123)
INSERT INTO admin_user (email, password_hash, full_name)
VALUES (
  'admin@example.com',
  '$2b$10$VOgA.0dig5CThvoXu3JZteOHp5hVLygMmbF9dOP4rHOvLqHEMLAlK',
  'System Administrator'
)
ON CONFLICT (email) DO NOTHING;

-- Sample APIs for testing
INSERT INTO apis (name, url, expected_status_code, is_active) VALUES
  ('Google Homepage', 'https://www.google.com', 200, TRUE),
  ('GitHub API', 'https://api.github.com', 200, TRUE),
  ('JSONPlaceholder API', 'https://jsonplaceholder.typicode.com/posts/1', 200, TRUE)
ON CONFLICT DO NOTHING;
```

### Migration 001: Add SMTP Settings

```sql
-- Date: 2025-12-30
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
ADD COLUMN IF NOT EXISTS smtp_from TEXT,
ADD COLUMN IF NOT EXISTS smtp_recipients TEXT;

UPDATE system_settings SET smtp_port = 587 WHERE id = 1 AND smtp_port IS NULL;
```

### Migration 002: Add API Groups

```sql
-- Date: 2025-12-30
CREATE TABLE IF NOT EXISTS api_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_groups_display_order ON api_groups(display_order);
CREATE INDEX IF NOT EXISTS idx_api_groups_name ON api_groups(name);
CREATE INDEX IF NOT EXISTS idx_api_groups_is_default ON api_groups(is_default);

ALTER TABLE apis ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES api_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_apis_group_id ON apis(group_id);

INSERT INTO api_groups (id, name, description, display_order, is_collapsed, is_default)
VALUES (1, 'Ungrouped', 'APIs without a specific group', 999, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('api_groups_id_seq', (SELECT GREATEST(2, MAX(id) + 1) FROM api_groups), false);

-- Assign existing APIs to default group
UPDATE apis SET group_id = 1 WHERE group_id IS NULL;
```

### Migration 003: Add Incident Status Code

```sql
-- Date: 2025-01-13
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status_code INTEGER;
```

All migrations are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS). Run in numerical order. Restart backend after applying.

---

## Backend API

### Auth Routes (`/api/auth`)
| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| POST | /login | No | authController.login | Email+password login, returns JWT+user |
| POST | /logout | No | authController.logout | Client-side logout acknowledgment |
| GET | /verify | Yes | authController.verifyToken | Verify JWT validity |
| GET | /profile | Yes | authController.getProfile | Get admin profile |
| PUT | /profile | Yes | authController.updateProfile | Update name/email |
| PUT | /change-password | Yes | authController.changePassword | Change password (requires current) |

### Admin Routes (`/api/admin`) - All require auth
| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | /apis | adminController.getAllAPIs | List all APIs with group info |
| GET | /apis/:id | adminController.getAPIById | Get single API details |
| POST | /apis | adminController.createAPI | Create new monitored API |
| PUT | /apis/:id | adminController.updateAPI | Update API config |
| DELETE | /apis/:id | adminController.deleteAPI | Delete API and its data |
| PUT | /apis/reorder | adminController.reorderAPIs | Reorder APIs by ID array |
| GET | /dashboard-stats | adminController.getDashboardStats | Total/down/uptime/pings stats |
| GET | /ping-logs/:apiId | adminController.getPingLogs | Raw ping history (limit param) |
| GET | /analytics/:apiId | adminController.getAPIAnalytics | Aggregated analytics (days param) |
| GET | /incidents | adminController.getIncidents | All incidents |
| POST | /incidents | adminController.createIncident | Manual incident creation |
| PUT | /incidents/:id | adminController.updateIncident | Update incident status |
| DELETE | /incidents/:id | adminController.deleteIncident | Delete incident |
| GET | /settings | adminController.getSettings | System settings |
| PUT | /settings | adminController.updateSettings | Update settings |
| POST | /settings/logo | adminController.uploadLogo | Upload logo (multer, 2MB, png/jpg/svg) |
| GET | /email-settings | adminController.getEmailSettings | SMTP config |
| PUT | /email-settings | adminController.updateEmailSettings | Update SMTP |
| POST | /email-settings/test | adminController.testEmailSettings | Send test email |
| POST | /webhook/test | adminController.testWebhook | Fire test webhook |
| GET | /webhook-logs | adminController.getWebhookLogs | Webhook delivery history |
| POST | /webhook/test-endpoint | adminController.testWebhookEndpoint | Test specific URL |
| GET | /groups | adminController.getAPIGroups | All groups |
| GET | /groups/:id | adminController.getAPIGroup | Single group |
| POST | /groups | adminController.createAPIGroup | Create group |
| PUT | /groups/:id | adminController.updateAPIGroup | Update group |
| DELETE | /groups/:id | adminController.deleteAPIGroup | Delete group (moves APIs to default) |
| PUT | /groups/reorder | adminController.reorderAPIGroups | Reorder groups |
| GET | /version | adminController.getVersion | Backend version from package.json |

### Public Routes (`/api/public`)
| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| GET | /status | No | publicController.getOverallStatus | Overall system status |
| GET | /services | No | publicController.getServices | Public services with uptime |
| GET | /services/all | Yes | publicController.getAllServicesForAdmin | All services (public+private) |
| GET | /uptime-stats | No | publicController.getUptimeStats | Uptime percentages (24h/7d/30d/90d) |
| GET | /incidents | No | publicController.getRecentIncidents | Public incidents |
| GET | /incidents/private | Yes | publicController.getPrivateIncidents | Private service incidents |
| GET | /timeline | No | publicController.getTimeline | 90-day daily uptime data |
| GET | /response-times/:apiId | No | publicController.getResponseTimes | Hourly response times |
| GET | /ping-logs/:apiId | No | publicController.getPingLogs | Individual ping logs |
| GET | /ping-logs/:apiId/aggregated | No | publicController.getAggregatedPingLogs | Aggregated ping data by period |
| GET | /ping-logs/:apiId/drilldown | No | publicController.getDrillDownPingLogs | Drill-down for specific hour/day |

---

## Backend Services

### monitorService.js
Runs on cron (`PING_INTERVAL_MINUTES`, default 1 min). Uses undici Agent with keepalive disabled.

| Function | Signature | Description |
|----------|-----------|-------------|
| truncateBody | (body, maxLength=500) | Truncates response body for storage |
| pingAPI | (api) | Fetches URL with timeout, returns {statusCode, responseTime, isSuccess, errorMessage, responseBody} |
| savePingResult | (apiId, result) | INSERT into ping_logs + UPDATE apis current_status/last_checked |
| handleStatusChange | (api, result) | Detects UP->DOWN or DOWN->UP transitions, triggers incident creation/resolution |
| monitorAllAPIs | () | Fetches active APIs, pings all concurrently, saves results |
| startMonitoring | () | Schedules cron job |
| triggerManualMonitoring | () | One-off monitoring run |

### uptimeService.js
| Function | Signature | Description |
|----------|-----------|-------------|
| calculateUptimeForPeriod | (apiId, startDate, endDate) | Queries ping_logs, returns {totalPings, successfulPings, uptimePercentage, avgResponseTime, minResponseTime, maxResponseTime} |
| updateUptimeSummaryForAPI | (apiId) | Calculates hourly summaries for current day, upserts into uptime_summaries |
| calculateAllUptimeSummaries | () | Runs updateUptimeSummaryForAPI for all active APIs |
| cleanupOldPingLogs | () | Deletes ping_logs older than LOG_RETENTION_DAYS (default 90) |
| startUptimeCalculations | () | Schedules hourly summary calculation + daily cleanup at 2 AM |

### emailService.js
| Function | Signature | Description |
|----------|-----------|-------------|
| getSMTPSettings | () | Reads SMTP config from system_settings table |
| initializeTransporter | () | Creates nodemailer transporter from DB settings |
| areNotificationsEnabled | () | Checks if email notifications are enabled |
| sendDowntimeAlert | (api, incident, errorMessage, statusCode) | Sends HTML downtime alert email to notification_email list |
| sendRecoveryNotification | (api, incident, statusCode) | Sends HTML recovery email with downtime duration |
| sendEmail | (to, subject, html, text) | Generic email sender |
| testEmailConfiguration | () | Sends test email to verify SMTP config |

Email templates: HTML table-based layout, inline CSS, responsive. Red header for alerts, green for recovery.

### incidentService.js
| Function | Signature | Description |
|----------|-----------|-------------|
| detectAndCreateIncident | (api, errorMessage, statusCode) | Checks for existing open incident, creates new if none, sends email+webhook |
| autoResolveIncident | (api, statusCode) | Resolves open incident, calculates downtime, sends recovery email+webhook |
| getActiveIncidents | () | Returns all non-resolved incidents with API info |
| getIncidentStats | () | Returns {total, ongoing, resolved} counts |

### webhookService.js
| Function | Signature | Description |
|----------|-----------|-------------|
| buildWebhookPayload | (eventType, api, incident, statusCode) | Builds consistent payload: {event_type, timestamp, service:{id,name,url}, incident:{id,title,status,status_code,started_at,resolved_at,duration}} |
| logWebhookDelivery | (apiId, eventType, payload, response) | INSERT into webhook_logs |
| sendWebhook | (eventType, api, incident, statusCode) | Fire-and-forget via setImmediate, 10s timeout, logs delivery |
| testWebhook | () | Sends test payload to configured webhook URL |

---

## Backend Config

### database.js
PostgreSQL pool: max 20 connections, idle timeout 30s, connect timeout 2s. Exports `query(text, params)` and `getClient()`.

### migrate.js
Reads `database/migrations/*.sql` files in order. Functions: `runMigrations()`, `runSeeds()`, `setupDatabase()`.

### upload.js
Multer disk storage to `backend/uploads/`. Accepts PNG/JPG/JPEG/SVG, max 2MB. Exports `upload` middleware.

### auth.js (middleware)
`authenticateToken(req, res, next)` - Extracts JWT from `Authorization: Bearer <token>`, verifies with JWT_SECRET, attaches `req.user`.
`generateAccessToken(user)` - Signs JWT with {id, email, name}, expiry from JWT_EXPIRY env (default 7d).

### server.js
Express app on PORT (default 5000). CORS from FRONTEND_URL. JSON body parser (10mb limit). Mounts routes at `/api/auth`, `/api/admin`, `/api/public`. Serves `backend/uploads/` statically. Health check at `/health`. On startup: runs migrations, starts monitoring service, starts uptime calculations.

---

## Frontend Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| / | PublicStatus | No | Public status page |
| /admin/login | Login | No | Admin login form |
| /admin/dashboard | AdminDashboard | Yes | Admin panel |
| /admin/settings | Settings | Yes | System settings |
| * | NotFound | No | 404 page |

---

## Frontend Pages

### Login.jsx
Email+password form. Calls `authService.login()`, updates AuthContext, redirects to `/admin/dashboard`. Shows toast on error.

### AdminDashboard.jsx
- Fetches dashboard stats + all APIs on mount
- Auto-refreshes every 30s
- Shows QuickStats grid, APITable with drag-and-drop
- AddAPIModal for create/edit APIs
- GroupManageModal for managing groups
- Profile dropdown with logout
- Manual refresh button triggers backend monitoring run

### PublicStatus.jsx
- Fetches overall status, services, uptime stats, incidents, timeline
- Auto-refreshes every 30s
- Public/Private toggle for authenticated admins
- Groups services by api_groups with collapsible sections
- Shows StatusHeader, ServiceCards, StatusTimeline (90-day grid), IncidentList
- ServiceDetailsModal on card click (shows ping history, response times, drill-down)
- Loads site title, description, logo, primary color from settings API

### Settings.jsx
5 tabs:
1. **Account** - Update name/email
2. **Password** - Change password (current + new + confirm)
3. **System** - Site title, description, primary color, logo upload
4. **Webhook** - URL, enable/disable, test, payload documentation, delivery logs
5. **Email** - SMTP host/port/user/pass/from, tag-based recipient management, enable/disable, test

### NotFound.jsx
404 page with links to status page and admin login.

---

## Frontend Components

### Admin Components

**AddAPIModal** `{ isOpen, onClose, onSuccess, editingAPI }` - Modal form for creating/editing APIs. Fields: name, URL, group, interval (30s-300s), expected status code, timeout (5s-60s), public toggle.

**APITable** `{ apis, onEdit, onDelete, onAdd, onReorder }` - Grouped table with drag-and-drop (DnD Kit). Desktop: full table layout. Mobile: card layout. Status badges (Operational/Pending/Down). Collapsible groups. Drag APIs between groups.

**GroupManageModal** `{ isOpen, onClose, onSuccess }` - CRUD + reorder groups. Sortable rows. Cannot delete default group.

**QuickStats** `{ stats }` - 4-column grid: Total APIs, APIs Down, Average Uptime, Pings Today.

### Public Components

**IncidentList** `{ incidents }` - Incident cards with status badge (Resolved/Ongoing/Identified/Monitoring), timeline, duration, affected service.

**ServiceCard** `{ service, onViewDetails }` - Service status card. Shows name, status badge, uptime (24h/7d/30d), response time, last checked. Color-coded border glow by status.

**ServiceDetailsModal** `{ service, isOpen, onClose }` - Full-screen detail view. Time range selector (24h/7d/90d). For 24h: individual pings. For 7d/90d: aggregated hourly/daily data with drill-down. UptimeCalendar (3-month heatmap). Error details sub-modal showing response body.

**StatusHeader** `{ overallStatus, totalServices, servicesDown }` - Banner: green "All Systems Operational" / yellow "Partial Outage" / red "Major Outage". Gradient background.

**StatusTimeline** `{ timelineData, services }` - 90-day grid of colored cells. Service filter dropdown. Tooltip on hover showing date + uptime%. Color: green (>99%) / yellow (95-99%) / orange (90-95%) / red (<90%).

**UptimeCalendar** `{ logs, timezone, onDayHover, onDayClick }` - 3-month calendar grid. Color-coded days by uptime. Click day for drill-down. Hover for tooltip.

### Shared Components

**ErrorBoundary** - React class component. Catches render errors. Shows fallback UI with refresh button.

**Loading** `{ message }` - Centered spinner with text. Default: "Loading...".

**Timestamp** `{ timestamp, format, showTimezone, className }` - Formats dates. Formats: "hybrid" (relative + exact), "relative", "full". Uses TimezoneContext.

**TimezoneToggle** - Dropdown for timezone selection. Searchable. Grouped by region (Americas/Europe/Asia/Pacific/Africa/Special).

---

## Frontend Services

### api.js
Axios instance. Base URL from `VITE_API_URL`. Request interceptor: attaches JWT from localStorage as `Authorization: Bearer`. Response interceptor: redirects to `/admin/login` on 401.

### authService.js
| Function | Description |
|----------|-------------|
| login(email, password) | POST /auth/login, stores token+user in localStorage |
| logout() | Clears localStorage (token, user) |
| verifyToken() | GET /auth/verify |
| getProfile() | GET /auth/profile |
| updateProfile(data) | PUT /auth/profile |
| changePassword(currentPassword, newPassword) | PUT /auth/change-password |
| isAuthenticated() | Returns !!localStorage.token |
| getCurrentUser() | JSON.parse localStorage.user |

### adminService.js (25+ functions)
All use authenticated axios instance.

**API CRUD**: getAllAPIs, getAPIById, createAPI, updateAPI, deleteAPI, reorderAPIs
**Groups**: getAPIGroups, getAPIGroup, createAPIGroup, updateAPIGroup, deleteAPIGroup, reorderAPIGroups
**Dashboard**: getDashboardStats, getPingLogs(apiId, limit), getAPIAnalytics(apiId, days)
**Incidents**: getAllIncidents, createIncident, updateIncident, deleteIncident
**Settings**: getSettings, updateSettings, uploadLogo(file)
**Webhooks/Email**: getWebhookLogs(limit, offset, apiId), testWebhook, getEmailSettings, updateEmailSettings, testEmail, getVersion

### publicService.js
| Function | Description |
|----------|-------------|
| getOverallStatus() | GET /public/status |
| getServices() | GET /public/services |
| getAllServicesForAdmin() | GET /public/services/all (auth required) |
| getUptimeStats() | GET /public/uptime-stats |
| getRecentIncidents(limit) | GET /public/incidents |
| getPrivateIncidents(limit) | GET /public/incidents/private (auth required) |
| getTimeline() | GET /public/timeline |
| getResponseTimes(apiId, period) | GET /public/response-times/:apiId |

---

## Frontend Context

### AuthContext
Provider stores: `user`, `isAuthenticated`, `loading`. On mount: checks localStorage for token, verifies with backend. Exports `login(userData, token)`, `logout()`. Hook: `useAuth()`.

### TimezoneContext
Provider stores selected timezone in localStorage key `preferredTimezone`. Auto-detects from browser on first visit. Exports `timezone`, `setTimezone`. Hook: `useTimezone()`.

---

## Frontend Utils

### ProtectedRoute.jsx
Wraps routes requiring auth. Shows Loading while checking. Redirects to `/admin/login` if not authenticated.

### timezone.js
- `TIMEZONES` - Array of 50+ timezone objects: {value (IANA), label, abbr, region}
- `getUserTimezone()` - Browser timezone via Intl API, fallback UTC
- `getTimezoneAbbreviation(timezone, date)` - Short abbr like "IST", "PST"
- `getTimezoneLabel(timezone)` - Full label from IANA id
- `formatTimestampWithTZ(timestamp, options)` - Configurable format with relative, exact, timezone
- `formatFullTimestamp(timestamp, timezone)` - Full weekday+date+time+long timezone
- `getGroupedTimezones()` - Groups TIMEZONES by region
- `findTimezone(timezoneValue)` - Lookup by IANA value

---

## UI Design System

- **CSS Framework**: Tailwind CSS 3.4 (utility-only, no component library)
- **Colors**: primary #3b82f6, success #10b981, warning #f59e0b, danger #ef4444
- **Fonts**: System stack: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
- **Mode**: Light-only (no dark mode)
- **Layout**: Mobile-first responsive, max-w-7xl centered container
- **Rounded corners**: rounded-lg (8px) standard, rounded-xl (12px) cards
- **Shadows**: shadow-sm default, shadow-lg on hover/modals
- **Borders**: border border-gray-200 on cards
- **Spacing**: p-4/p-6 standard padding, gap-4/gap-6 between sections
- **Transitions**: transition-all duration-200 on interactive elements
- **Background**: bg-gray-50 page, bg-white cards
- **Status colors**: green (#10b981) operational, yellow (#f59e0b) degraded, red (#ef4444) down

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/status_monitor
JWT_SECRET=<random-string>
JWT_EXPIRY=7d
PORT=5000
NODE_ENV=development|production
PING_INTERVAL_MINUTES=1
LOG_RETENTION_DAYS=90
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app-password
SMTP_FROM=Status Monitor <noreply@example.com>
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Key Behaviors

1. **Monitoring Flow**: Cron fires every N minutes -> `monitorAllAPIs()` fetches all active APIs -> pings each concurrently -> saves results -> `handleStatusChange()` detects transitions -> creates/resolves incidents -> sends email+webhook notifications
2. **Incident Auto-Detection**: If API returns non-expected status code -> checks for existing open incident -> creates new if none exists -> logs to console
3. **Incident Auto-Resolution**: If API returns expected status code while incident is open -> resolves incident -> calculates downtime duration -> sends recovery notifications
4. **Uptime Calculation**: Hourly cron aggregates ping_logs into uptime_summaries. Daily cleanup at 2 AM removes pings older than retention period.
5. **Webhook Delivery**: Fire-and-forget via `setImmediate`. 10s timeout. All deliveries logged to webhook_logs table.
6. **Email Delivery**: SMTP settings stored in DB (system_settings). Transporter initialized on-demand from DB settings.
7. **Auth Flow**: Login -> bcrypt compare -> generate JWT -> client stores in localStorage -> axios interceptor attaches to requests -> middleware verifies on protected routes -> 401 triggers redirect to login
8. **Cloudflare Compatibility**: undici Agent with `keepAliveTimeout: 1, keepAliveMaxTimeout: 1` prevents 520/525 errors from stale connections
9. **Public vs Private**: APIs have `is_public` flag. Public page shows only public APIs. Authenticated admins can toggle to see all.
10. **Groups**: APIs belong to groups. Default "Ungrouped" group cannot be deleted. Groups and APIs within groups can be reordered via drag-and-drop.

---

## Migrations

| # | File | Description |
|---|------|-------------|
| 001 | 001_add_smtp_settings.sql | Add SMTP columns to system_settings |
| 002 | 002_add_api_groups.sql | Create api_groups table, add group_id to apis, seed default group |
| 003 | 003_add_incident_status_code.sql | Add status_code column to incidents |

All migrations are idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
