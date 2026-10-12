# Work Log & Timesheet System — Frontend Application

Modern, responsive Single Page Application (SPA) built with React 19, Vite, and Tailwind CSS for the Work Log & Timesheet System. Provides an intuitive interface for employee time recording, weekly timesheet reviews, time-off requests, capability grants, and analytics.

---

## Table of Contents
- [User Experience & Core Features](#user-experience--core-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Available Scripts](#available-scripts)
- [Page & Feature Breakdown](#page--feature-breakdown)
- [Security & Dynamic Capability UI](#security--dynamic-capability-ui)
- [Client Caching & Session Storage Strategy](#client-caching--session-storage-strategy)
- [Demo Login Accounts](#demo-login-accounts)
- [Deployment (Netlify & Vercel)](#deployment-netlify--vercel)

---

## User Experience & Core Features

1. **Interactive Weekly Timesheet Grid**:
   - 7-day grid view with 15-minute increment support (e.g. `0.25`, `1.5`, `8.0` hours).
   - Instant total calculations across days, weeks, and projects.
   - Project-level tracking with assignment filtering.
   - Quick "Copy Last Week's Entries" button for recurring workloads.
   - Full revision history diff viewer for edited submissions.
2. **Review & Approval Queue**:
   - Real-time queue displaying pending submitted timesheets and time-off requests.
   - Scoped access: managers only see entries matching their granted project/user scopes.
   - Bulk approval actions and returning entries with mandatory reviewer feedback.
3. **Time-Off Request Management**:
   - Booking interface with date-range selection and time-off type classification (Annual, Sick, Unpaid).
   - Collision detection preventing overlapping leave requests.
4. **Reports & Financial Aggregations**:
   - Total hours and billable value calculations grouped by project, client, or employee.
   - Missing-timesheet chaser view highlighting employees who forgot to submit entries.
   - One-click CSV report export.
5. **Business Intelligence & Analytics**:
   - Visual trend charts powered by Recharts (Weekly hours, utilization rate, billable vs non-billable splits).
6. **Capability-Based Access Control (CBAC) Administration**:
   - Dynamic grant issuance with scope restrictions (Global, Project-Scoped, User-Scoped) and expiration dates (TTL).
   - Immediate grant revocation.
   - Immutable security audit logs viewer.

---

## Technology Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool & Bundler**: Vite 8 with Hot Module Replacement (HMR)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom glassmorphism and modern UI tokens
- **Routing**: React Router v7 (`react-router-dom`)
- **Data Visualization**: Recharts 3.x
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors for automatic JWT Bearer token attachment and error handling
- **Schema Validation**: Zod 4.x for client-side form validation
- **Linter**: Oxlint for high-speed static code analysis

---

## Project Structure

```
client/
├── public/                    # Static assets and favicon
├── src/
│   ├── api/
│   │   └── client.js          # Axios instance, baseURL configuration, and JWT interceptors
│   ├── assets/                # Images, illustrations, and brand assets
│   ├── components/            # Reusable UI component library
│   │   ├── Button.jsx         # Accessible buttons with variants and loading spinners
│   │   ├── Card.jsx           # Surface card containers
│   │   ├── Modal.jsx          # Accessible dialog modals
│   │   ├── Navbar.jsx         # Dynamic navigation bar reacting to user capabilities
│   │   ├── Table.jsx          # Paginated data table with sorting and empty states
│   │   └── Notification.jsx   # Toast notification provider
│   ├── context/
│   │   ├── AuthContext.jsx    # Session state, login/logout methods, and capability map
│   │   └── NotificationContext.jsx # Global alert & toast notifications
│   ├── hooks/
│   │   ├── useAuth.js         # Quick hook for session data and permission checks
│   │   └── useNotification.js # Quick hook for triggering success/error toasts
│   ├── pages/
│   │   ├── access/
│   │   │   └── CapabilityGrantsPage.jsx # Permission grant management & scoping UI
│   │   ├── AnalyticsPage.jsx  # Trend charts and utilization graphs
│   │   ├── AuditLogsPage.jsx  # Immutable access audit logs viewer
│   │   ├── ClientsProjectsPage.jsx # Clients, projects, and billing rates management
│   │   ├── DashboardPage.jsx  # Overview metrics, pending tasks, and recent activity
│   │   ├── EmailLogPage.jsx   # Outbound email delivery logs & retry monitor
│   │   ├── LandingPage.jsx    # Public product landing page
│   │   ├── LoginPage.jsx      # Authentication screen with demo account quick-fill
│   │   ├── NotAuthorisedPage.jsx # 403 Forbidden feedback screen
│   │   ├── ProfilePage.jsx    # User details and password change
│   │   ├── RegisterPage.jsx   # Registration screen with password strength feedback
│   │   ├── ReportsPage.jsx    # Hours breakdown, billable revenue, and CSV export
│   │   ├── ReviewPage.jsx     # Timesheet & leave review queue
│   │   ├── TimeOffPage.jsx    # Leave booking & personal calendar
│   │   ├── TimesheetsPage.jsx # Weekly interactive timesheet grid
│   │   └── UsersPage.jsx      # Employee roster & project assignment
│   ├── validation/            # Zod schemas for timesheet forms, leave requests, and logins
│   ├── App.jsx                # Route definitions & capability-protected route guards
│   ├── index.css              # Global styles, fonts, and Tailwind utilities
│   └── main.jsx               # Application entry point
├── .env.example               # Frontend environment variable template
├── netlify.toml               # Netlify SPA routing configuration
├── vercel.json                # Vercel SPA rewrites configuration
├── vite.config.js             # Vite configuration with Tailwind CSS plugin
└── package.json               # Scripts and dependencies
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **Backend API**: The [server application](file:///c:/Users/hamza/OneDrive/Desktop/Interview%20Toolshed/training-20260824/Work%20Log%20&%20Timesheet%20System/server) running on port `5000` (or configured via `VITE_API_URL`)

---

## Environment Variables

Create `.env` in the `client` directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

| Variable | Description | Local Development | Production Example |
|---|---|---|---|
| `VITE_API_URL` | Base URL of the backend REST API | `http://localhost:5000` | `https://your-api.onrender.com` |

---

## Installation & Setup

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

The application will be accessible at: **`http://localhost:5173`**

---

## Available Scripts

- `npm run dev`: Starts the Vite development server with hot-reload enabled.
- `npm run build`: Compiles production assets into the `dist/` directory.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs high-speed linting via Oxlint.

---

## Page & Feature Breakdown

| Page | URL Path | Minimum Access Required | Core Capabilities |
|---|---|---|---|
| **Landing** | `/` | Public | Product introduction, login & registration links |
| **Login** | `/login` | Public | Email/password login with demo user quick-fill buttons |
| **Register** | `/register` | Public (if enabled) | Self-registration with domain whitelist check |
| **Dashboard** | `/dashboard` | Authenticated | KPI metric cards, quick-log widget, pending approvals |
| **Timesheets** | `/timesheet` | Authenticated | Weekly 15-min grid, revision diffs, copy-previous-week |
| **Reviews** | `/review` | `REVIEW_TIME` / Admin | Review queue, bulk approve, return with reviewer comments |
| **Time Off** | `/time-off` | Authenticated | Book leave, check balances, decide requests (`DECIDE_TIME_OFF`) |
| **Clients & Projects** | `/clients-projects` | `MANAGE_CLIENTS_PROJECTS` | Manage clients, projects, and effective date billing rates |
| **Reports** | `/reports` | `VIEW_REPORTS` / Admin | Summary tables, revenue totals (`VIEW_BILLING`), CSV export |
| **Analytics** | `/analytics` | `VIEW_ANALYTICS` / Admin | Utilization rate charts, project distribution, overtime stats |
| **Users** | `/users` | `MANAGE_USERS` / Admin | User directory, project assignments, account activation toggle |
| **Capabilities** | `/access` | Admin | Issue dynamic grants with TTL expiry and project/user scoping |
| **Audit Logs** | `/audit-logs` | Admin | Security audit trail of all access control events |
| **Email Logs** | `/email-logs` | Admin | Outbound email delivery status and retry logs |
| **Profile** | `/profile` | Authenticated | Account info, password update, active capability grants overview |

---

## Security & Dynamic Capability UI

Rather than relying on static client-side roles, the application uses **Dynamic Capability-Based Access Control (CBAC)**:

1. **Session Hydration**: On login, the backend returns the user profile along with an active capability map (e.g. `capabilities['REVIEW_TIME']`, `capabilities['VIEW_BILLING']`).
2. **Scoped Rendering**: Components check both global capability flags and scoped IDs (e.g., hiding billing rates if the user lacks `VIEW_BILLING`, or restricting project dropdowns to assigned projects).
3. **Route Guards**: `App.jsx` wraps routes in `<ProtectedRoute requiredCapability="..." />`. Unauthorized users are gracefully redirected to the `/not-authorised` page.
4. **Token Handling**: JWT tokens are stored securely in browser storage and automatically attached via Axios interceptors. Any `401 Unauthorized` response triggers an automatic session purge and redirects to login.

---

## Client Caching & Session Storage Strategy

To ensure snappy page transitions without serving stale data across different employee accounts:
- Cache keys in `sessionStorage` are strictly isolated by user ID and parameter scope:
  - `timesheet:${user.id}:${startDate}:${endDate}`
  - `review-queue:${user.id}`
- Mutating actions (such as saving a timesheet entry or approving a review) immediately invalidate the corresponding cache key and force a fresh background reload.

---

## Demo Login Accounts

On the `/login` page, convenient quick-fill buttons are provided during development to log in as any test persona with a single click. Standard password for all demo accounts: **`Password123!`**

| Persona | Email | Accessible Sections |
|---|---|---|
| **Alice (Administrator)** | `admin@worklog.local` | Full access across all 14 pages and admin tools |
| **Bob (Project Reviewer)** | `bob@worklog.local` | Timesheets, Time Off, and Review Queue for Acme Core Platform |
| **Carol (Finance Specialist)**| `carol@worklog.local` | Timesheets, Time Off, Financial Reports & Revenue Analytics |
| **Dan (Team Manager)** | `dan@worklog.local` | Timesheets, Time Off booking, and Leave Decision approvals |
| **Eva (Standard Employee)** | `eva@worklog.local` | Timesheet entry grid and personal Time Off booking |

---

## Deployment (Netlify & Vercel)

The client is configured for zero-configuration SPA deployments:

### Netlify
Includes [netlify.toml](file:///c:/Users/hamza/OneDrive/Desktop/Interview%20Toolshed/training-20260824/Work%20Log%20&%20Timesheet%20System/client/netlify.toml) with build command `npm run build`, publish directory `dist`, and SPA fallback:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel
Includes [vercel.json](file:///c:/Users/hamza/OneDrive/Desktop/Interview%20Toolshed/training-20260824/Work%20Log%20&%20Timesheet%20System/client/vercel.json) specifying clean URL rewrites to `/index.html`.
