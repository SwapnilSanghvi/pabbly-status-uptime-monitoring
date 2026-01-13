# Changelog

All notable changes to Pabbly Status Monitor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2025-01-13

### Added

#### HTTP Status Code in Webhook Notifications

Added `status_code` field to webhook payloads and incident tracking.

**Files Changed:**
- `database/schema.sql` - Added `status_code` column to incidents table
- `database/migrations/003_add_incident_status_code.sql` - Migration for existing databases
- `backend/src/services/monitorService.js` - Pass status code to incident handlers
- `backend/src/services/incidentService.js` - Store and pass status code
- `backend/src/services/webhookService.js` - Include status code in webhook payload

**Before:**
```json
{
  "event_type": "api_down",
  "incident": {
    "id": 1,
    "title": "My API is down",
    "status": "ongoing"
  }
}
```

**After:**
```json
{
  "event_type": "api_down",
  "incident": {
    "id": 1,
    "title": "My API is down",
    "status": "ongoing",
    "status_code": 503
  }
}
```

**Behavior:**
| Event | `status_code` Value |
|-------|---------------------|
| `api_down` | The error code that caused the failure (e.g., 500, 503, 404) |
| `api_up` | The recovery code (e.g., 200) confirming the API is healthy |

**Benefits:**
- Webhook consumers can now identify the exact HTTP error that caused the incident
- Recovery webhooks confirm the API is returning the expected status code
- Better integration with automation tools and alerting systems
- Improved incident reporting and debugging capabilities

**Migration Required:**
```bash
docker exec -i postgres-db psql -U postgres -d status_monitor < database/migrations/003_add_incident_status_code.sql
```

---

#### Enhanced Email Notification Templates

Redesigned email notifications with improved formatting, status code information, and professional layout optimized for email clients.

**Files Changed:**
- `backend/src/services/emailService.js` - Completely redesigned both downtime and recovery email templates
- `backend/src/services/incidentService.js` - Pass status code to email functions

**Before (Downtime Alert):**
```
Subject: 🔴 ALERT: Pabbly Chatflow is DOWN

API Downtime Alert
An API endpoint you're monitoring has gone down:
API Name: Pabbly Chatflow
URL: https://chatflow.pabbly.com/api/status
...
```

**After (Downtime Alert):**
```
Subject: 🔴 ALERT: Pabbly Chatflow is Down

┌────────────────────────────────────────┐
│  🔴 API DOWNTIME ALERT                 │
│  (Light red header with border)        │
└────────────────────────────────────────┘

Service:           Pabbly Chatflow
Status:            [Ongoing]
Incident ID:       #3
Started:           1/13/2025, 4:55:00 PM

─────────────────────────────────────────

ENDPOINT DETAILS
URL:               https://chatflow.pabbly.com/api/status
Status Code:       502
Error:             Unexpected status code: 502 (expected 200)

┌────────────────────────────────────────┐
│ ACTION REQUIRED:                       │
│ Investigate the issue immediately.     │
│ Check server logs, upstream services,  │
│ and infrastructure status.             │
└────────────────────────────────────────┘

[View Status Page]
```

**Before (Recovery Notification):**
```
Subject: 🟢 RESOLVED: Pabbly Chatflow is back online

Good news! The API endpoint has recovered...
```

**After (Recovery Notification):**
```
Subject: 🟢 RESOLVED: Pabbly Chatflow is Back Online

┌────────────────────────────────────────┐
│  🟢 SERVICE RECOVERED                  │
│  (Light green header with border)      │
└────────────────────────────────────────┘

Service:           Pabbly Chatflow
Incident ID:       #3
Started:           1/13/2025, 4:55:00 PM
Resolved:          1/13/2025, 5:00:00 PM
Downtime:          [5 minute(s)]

─────────────────────────────────────────

ENDPOINT DETAILS
URL:               https://chatflow.pabbly.com/api/status
Original Error:    HTTP 502
Current Status:    HTTP 200 (Healthy)

[View Status Page]
```

**Key Improvements:**
- **Email-optimized layout:** Uses HTML tables instead of flexbox for cross-client compatibility
- **Professional subject lines:**
  - Downtime: `🔴 ALERT: [Service Name] is Down`
  - Recovery: `🟢 RESOLVED: [Service Name] is Back Online`
- **Compact headers:** Reduced padding (16px) with lighter background colors for better aesthetics
- **Status code tracking:** Displays both error codes (500, 503, etc.) and recovery codes (200)
- **Clean information hierarchy:** Removed redundant "Status: Resolved" badge in recovery emails
- **Inline styles:** All CSS is inline for maximum email client compatibility
- **Responsive design:** Works on both desktop and mobile email clients
- **Action buttons:** Clear "View Status Page" CTA linking to frontend
- **Visual indicators:** Color-coded headers (red for alerts, green for recovery)

**Email Client Compatibility:**
- Gmail (Web & Mobile)
- Outlook (Desktop & Web)
- Apple Mail
- Yahoo Mail
- Thunderbird
- All major email clients

**Benefits:**
- Clear, grammatically correct subject lines without incident numbers
- Emoji indicators (🔴/🟢) at the start of subject for quick visual recognition
- HTTP status codes included for both downtime and recovery events
- Structured table-based layout that renders consistently across email clients
- Professional appearance with appropriate spacing and color scheme
- Quick access to status page via button link
- Downtime duration prominently displayed in recovery emails

---

### Changed

#### Reduced Console Logging for Better Performance

Removed verbose logging to improve performance and reduce log storage.

**Files Changed:**
- `backend/src/config/database.js` - Removed query execution logs
- `backend/src/server.js` - Removed HTTP request logging middleware

**Before:**
```
Executed query { text: 'SELECT * FROM apis...', duration: 5, rows: 10 }
2026-01-13T11:59:19.515Z - GET /api/admin/dashboard-stats
2026-01-13T11:59:19.524Z - GET /api/public/status
✅ Connected to PostgreSQL database
✅ Connected to PostgreSQL database
✅ Connected to PostgreSQL database
```

**After:**
```
(clean console - only important logs like API UP/DOWN events)
```

**What Was Removed:**
| Log Type | Reason for Removal |
|----------|-------------------|
| `Executed query {...}` | Logged every database query - extremely verbose |
| `GET /api/...` request logs | Logged every HTTP request - noisy |
| `✅ Connected to PostgreSQL` | Logged on every pool connection - repetitive |

**What Was Kept:**
| Log Type | Reason for Keeping |
|----------|-------------------|
| `🔴 API DOWN: ...` | Critical - alerts when API goes down |
| `🟢 API UP: ...` | Critical - confirms API recovery |
| `📋 Created incident #...` | Important - tracks incident creation |
| `❌ Database pool error` | Critical - prevents silent failures |

**Benefits:**
- Reduced log storage consumption
- Easier to find important events in logs
- Minimal performance improvement (reduced I/O operations)
- Cleaner development console output

---

## [1.1.0] - Previous Release

### Features
- API Groups for organizing monitored services
- Drag-and-drop reordering
- Public/Private API visibility toggle
- SMTP email notifications
- Webhook notifications for status changes
- 90-day uptime tracking with drill-down

---

## [1.0.0] - Initial Release

### Features
- Real-time API monitoring (configurable intervals)
- Public status page
- Admin dashboard
- Incident management
- Uptime statistics and charts
- PostgreSQL database backend
