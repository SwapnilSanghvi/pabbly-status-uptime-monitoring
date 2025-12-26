# Frontend Implementation Guide

## ✅ What's Already Done

1. **Vite + React Project Created** ✅
2. **Dependencies Installed** ✅
   - react-router-dom (routing)
   - axios (API calls)
   - date-fns (date formatting)
   - react-hot-toast (notifications)
   - recharts (charts)
   - tailwindcss (styling)

3. **Tailwind Configured** ✅
   - tailwind.config.js created
   - postcss.config.js created

---

## 📋 Frontend Structure to Build

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── QuickStats.jsx          # Dashboard stat cards
│   │   │   ├── APITable.jsx            # API management table
│   │   │   ├── AddAPIModal.jsx         # Add/Edit API modal
│   │   │   └── Analytics.jsx           # Charts & analytics
│   │   ├── public/
│   │   │   ├── StatusHeader.jsx        # Overall status banner
│   │   │   ├── ServiceCard.jsx         # Service status card
│   │   │   ├── StatusTimeline.jsx      # 90-day timeline grid
│   │   │   ├── ResponseChart.jsx       # Response time chart
│   │   │   └── IncidentList.jsx        # Incident history
│   │   └── shared/
│   │       ├── Navbar.jsx              # Navigation bar
│   │       ├── Loading.jsx             # Loading spinner
│   │       └── ErrorMessage.jsx        # Error display
│   ├── pages/
│   │   ├── PublicStatus.jsx            # Public status page (/)
│   │   ├── Login.jsx                   # Admin login (/admin/login)
│   │   ├── AdminDashboard.jsx          # Admin dashboard (/admin/dashboard)
│   │   └── Settings.jsx                # Settings page (/admin/settings)
│   ├── services/
│   │   ├── api.js                      # Axios instance
│   │   ├── authService.js              # Auth API calls
│   │   ├── adminService.js             # Admin API calls
│   │   └── publicService.js            # Public API calls
│   ├── context/
│   │   └── AuthContext.jsx             # Auth state management
│   ├── utils/
│   │   ├── ProtectedRoute.jsx          # Auth route wrapper
│   │   └── helpers.js                  # Utility functions
│   ├── App.jsx                         # Main app with routes
│   ├── main.jsx                        # Entry point
│   └── index.css                       # Tailwind CSS
├── .env                                # Environment variables
└── index.html                          # HTML template
```

---

## 🔧 Key Files to Create

### 1. Environment Configuration (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. API Service (src/services/api.js)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Main App (src/App.jsx)
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Pages
import PublicStatus from './pages/PublicStatus';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import ProtectedRoute from './utils/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicStatus />} />
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 🎨 Page Designs

### 1. Public Status Page (/)
**Layout:**
- Header with branding
- Overall status banner (green/yellow/red)
- Grid of service cards
- 90-day timeline visualization
- Response time chart
- Recent incidents list
- Auto-refresh every 30s

**API Calls:**
- `GET /api/public/status` - Overall status + services
- `GET /api/public/uptime` - Uptime stats
- `GET /api/public/incidents` - Recent incidents
- `GET /api/public/timeline` - Timeline data

### 2. Login Page (/admin/login)
**Layout:**
- Centered login card
- Email + password fields
- Login button
- Error messages

**API Call:**
- `POST /api/auth/login`

### 3. Admin Dashboard (/admin/dashboard)
**Layout:**
- Navbar with logout
- Quick stats cards (4 cards)
  - Total APIs
  - Down APIs
  - Avg Uptime
  - Total Pings Today
- API management table
  - Name, URL, Status, Uptime, Actions
  - Add API button
  - Edit/Delete per row
- Add/Edit API Modal

**API Calls:**
- `GET /api/admin/dashboard-stats`
- `GET /api/admin/apis`
- `POST /api/admin/apis`
- `PUT /api/admin/apis/:id`
- `DELETE /api/admin/apis/:id`

### 4. Settings Page (/admin/settings)
**Layout:**
- Navbar
- Tabs:
  - Account Settings (email, password)
  - Status Page Customization (title, logo, colors)
  - Notifications (email alerts)

**API Calls:**
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

---

## 🎯 Implementation Priority

### Phase 1: Core Setup (CURRENT)
1. ✅ Initialize Vite + React
2. ✅ Install dependencies
3. ✅ Configure Tailwind
4. ⏳ Create API service layer
5. ⏳ Set up routing
6. ⏳ Create AuthContext

### Phase 2: Authentication
1. Login page UI
2. Auth service functions
3. Protected route wrapper
4. Token management

### Phase 3: Public Status Page
1. Fetch and display overall status
2. Service cards with uptime
3. Timeline visualization
4. Charts (response times)
5. Incident list
6. Auto-refresh

### Phase 4: Admin Dashboard
1. Dashboard stats
2. API table
3. Add/Edit/Delete modals
4. Real-time updates

### Phase 5: Polish
1. Loading states
2. Error handling
3. Responsive design
4. Animations

---

## 🚀 Quick Start Commands

### Development
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

### Build for Production
```bash
npm run build
```

---

## 📊 Sample Component: Service Card

```javascript
function ServiceCard({ service }) {
  const isOnline = service.current_status === 'success';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{service.name}</h3>
        <span className={`px-3 py-1 rounded-full text-sm ${
          isOnline
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? 'Operational' : 'Down'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-500">24h Uptime</div>
          <div className="font-semibold">{service.uptime_24h || '—'}%</div>
        </div>
        <div>
          <div className="text-gray-500">7d Uptime</div>
          <div className="font-semibold">{service.uptime_7d || '—'}%</div>
        </div>
        <div>
          <div className="text-gray-500">30d Uptime</div>
          <div className="font-semibold">{service.uptime_30d || '—'}%</div>
        </div>
      </div>

      {service.response_time && (
        <div className="mt-4 text-sm text-gray-600">
          Response time: {service.response_time}ms
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Color Scheme

### Status Colors
- **Operational**: Green (#10b981)
- **Degraded**: Yellow (#f59e0b)
- **Down**: Red (#ef4444)
- **Primary**: Blue (#3b82f6)

### Background
- Main: Gray 50 (#f9fafb)
- Cards: White (#ffffff)

---

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
```

---

## Next Steps

Would you like me to:
1. **Create all frontend files now** (complete implementation)
2. **Build page by page** (start with Public Status Page)
3. **Focus on specific feature** (e.g., just login + dashboard)

Let me know and I'll continue building!
