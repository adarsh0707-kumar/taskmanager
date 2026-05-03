<div align="center">

# ⚡ TaskFlow

### Full-Stack Team Task Manager with Role-Based Access Control

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-6366f1?style=for-the-badge&logo=vercel)](https://taskmanager-frontend-dusky.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Live%20on%20Render-10b981?style=for-the-badge&logo=render)](https://taskmanager-3egl.onrender.com)
[![GitHub Release](https://img.shields.io/github/v/release/yourusername/taskflow?style=for-the-badge)](https://github.com/yourusername/taskflow/releases)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

A production-ready full-stack web application where teams can create projects, assign tasks, track progress, and manage members — all with strict role-based access control and multi-organization isolation.

![TaskFlow Dashboard Preview](https://via.placeholder.com/900x450/0d1117/6366f1?text=TaskFlow+Dashboard)

</div>

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Backend Docs](#-backend-documentation)
- [Frontend Docs](#-frontend-documentation)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Changelog](#-changelog)

---

## 🚀 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | [https://taskmanager-frontend-dusky.vercel.app](https://taskmanager-frontend-dusky.vercel.app) | ✅ Live |
| **Backend API** | [taskmanager-3egl.onrender.com](https://taskmanager-3egl.onrender.com) | ✅ Live |

> ⚠️ **Note:** The backend runs on Render's free tier and may take 30–60 seconds to wake up after inactivity. Please be patient on first load.

### Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo1234 |
| Member | member@demo.com | demo1234 |

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login and signup
- Show/hide password toggle on all password fields
- Change password from Settings with current password verification
- Auto-logout after password change
- Protected routes — unauthenticated users redirected to login
- Role-based route guards (admin-only pages)

### 👥 Multi-Organization Team Management
- **Complete org isolation** — each admin manages their own team independently
- Admin creates members and receives **auto-generated credentials** to share
- Credentials modal with one-click copy button
- Admin can reset any member's password and get new credentials
- Admin can remove members from their organization
- Members from one org **cannot be seen or added** by another org's admin

### 📁 Project Management
- Create, edit, delete projects
- Visual **progress bars** showing task completion percentage
- Project status: Active / Completed / Archived
- Add your org's members to projects
- Each admin sees only their own projects

### ✅ Task Management
- **Kanban Board** view with To Do / In Progress / Done columns
- **List / Table** view toggle
- Create, edit, delete tasks
- Assign tasks to team members
- Priority levels: Low / Medium / High
- Due dates with **overdue detection** (highlighted in red)
- Quick status change buttons directly on Kanban cards

### 📊 Dashboard
- Stats: Total tasks, completed, overdue, active projects, team size
- Task breakdown with animated progress bars
- Recent activity feed with project context
- Quick action buttons

### ⚙️ Settings
- Profile info display (name, email, role, account ID, join date)
- Change password with show/hide toggle and confirm match validation
- Logout button with confirmation step

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 | UI framework |
| **Routing** | React Router v6 | Client-side routing |
| **HTTP Client** | Axios | API requests |
| **Notifications** | React Hot Toast | Toast messages |
| **Dates** | date-fns | Date formatting & comparison |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | JSON file (via Node fs) | Zero-dependency data storage |
| **Auth** | JWT + Node crypto | Token-based authentication |
| **Frontend Deploy** | Vercel | Static site hosting |
| **Backend Deploy** | Render | Node.js server hosting |

---

## 📁 Project Structure

```
taskflow/
├── 📄 README.md                    ← You are here
│
├── 📁 backend/
│   ├── 📄 server.js                ← Express API (all routes)
│   ├── 📄 package.json             ← Backend dependencies
│   ├── 📄 db.json                  ← Auto-generated JSON database
│   └── 📄 README.md                ← Backend-specific docs
│
└── 📁 frontend/
    ├── 📁 public/
    │   └── 📄 index.html
    ├── 📁 src/
    │   ├── 📁 pages/
    │   │   ├── 📄 Login.js         ← Login with show/hide password
    │   │   ├── 📄 Signup.js        ← Registration page
    │   │   ├── 📄 Dashboard.js     ← Stats + recent activity
    │   │   ├── 📄 Projects.js      ← Project list + create
    │   │   ├── 📄 ProjectDetail.js ← Kanban board + task list
    │   │   ├── 📄 Team.js          ← Admin member management
    │   │   └── 📄 Settings.js      ← Profile + change password
    │   ├── 📁 components/
    │   │   └── 📄 Sidebar.js       ← Navigation + logout
    │   ├── 📄 AuthContext.js       ← Auth state (login/logout/signup)
    │   ├── 📄 api.js               ← Axios instance + interceptors
    │   ├── 📄 App.js               ← Routes + providers
    │   ├── 📄 App.css              ← Full design system (CSS vars)
    │   └── 📄 index.js             ← React entry point
    ├── 📄 package.json
    ├── 📄 .env                     ← REACT_APP_API_URL
    └── 📄 README.md                ← Frontend-specific docs
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Start the Backend
```bash
cd backend
npm install
node server.js
# Server running at http://localhost:5000
```

### 3. Start the Frontend
```bash
# New terminal
cd frontend
npm install
npm start
# App running at http://localhost:3000
```

### 4. Open the app
Visit [http://localhost:3000](http://localhost:3000) and create an **Admin** account to get started.

---

## 🔧 Backend Documentation

See [`backend/README.md`](backend/README.md) for full backend docs including:
- All API endpoints
- Request/response formats
- Environment variables
- Database schema

---

## 🎨 Frontend Documentation

See [`frontend/README.md`](frontend/README.md) for full frontend docs including:
- Component overview
- Environment setup
- Build and deploy steps
- Design system tokens

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login and get JWT |
| GET | `/api/auth/me` | ✅ | Get current user profile |
| PUT | `/api/auth/change-password` | ✅ | Change password |

### Admin — Team Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/create-member` | ✅ Admin | Create member + get credentials |
| POST | `/api/admin/reset-member-password/:id` | ✅ Admin | Reset member password |
| DELETE | `/api/admin/members/:id` | ✅ Admin | Remove member from org |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | ✅ | List user's projects |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Get project + members |
| PUT | `/api/projects/:id` | ✅ | Update project |
| DELETE | `/api/projects/:id` | ✅ | Delete project |
| POST | `/api/projects/:id/members` | ✅ Admin | Add member to project |
| DELETE | `/api/projects/:id/members/:uid` | ✅ Admin | Remove member from project |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/:id/tasks` | ✅ | List project tasks |
| POST | `/api/projects/:id/tasks` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | ✅ | Dashboard stats |
| GET | `/api/users` | ✅ | List org's users |

---

## 🚢 Deployment

### Backend → Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect repo → Set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add env variable: `JWT_SECRET=your_secret_here`
7. Deploy ✅

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo → Set **Root Directory** to `frontend`
3. Add env variable: `REACT_APP_API_URL=https://your-backend.onrender.com/api`
4. Deploy ✅

---

## 📝 Changelog

### v2.0.0 — Multi-Org + Security Update
- ✅ Multi-organization isolation (each admin manages own team)
- ✅ Admin creates members with auto-generated credentials
- ✅ Credential sharing modal with copy button
- ✅ Password reset for members
- ✅ Change password feature with current password verification
- ✅ Show/hide password toggle on all password fields
- ✅ Logout with confirmation step in sidebar
- ✅ Settings page with profile info
- ✅ Team management page (admin only)
- ✅ Dashboard team member count stat

### v1.0.0 — Initial Release
- ✅ JWT Authentication (Signup / Login)
- ✅ Role-based access control (Admin / Member)
- ✅ Project CRUD with progress tracking
- ✅ Task management with Kanban board
- ✅ List/Table view toggle
- ✅ Priority levels and due dates
- ✅ Overdue detection
- ✅ Dashboard with stats and recent activity
- ✅ Dark theme UI with Syne + DM Sans fonts

---

## 📄 License

MIT © 2024 — Feel free to use, modify and distribute.

---

<div align="center">
  Built with ❤️ using React + Node.js
  <br/>
  <a href="https://your-app.vercel.app">Live Demo</a> · <a href="https://github.com/yourusername/taskflow/issues">Report Bug</a> · <a href="https://github.com/yourusername/taskflow/issues">Request Feature</a>
</div>
