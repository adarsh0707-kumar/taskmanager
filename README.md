# ⚡ TaskFlow — Team Task Manager

A full-stack team task management web app with role-based access control.

## 🚀 Live Demo
> **[Live URL here after deployment]**

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, React Hot Toast |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## ✅ Features

### Authentication
- User Signup / Login with JWT tokens
- Role-based access: **Admin** and **Member**
- Protected routes on frontend

### Projects
- Create, view, update, delete projects
- Progress tracking with visual progress bars
- Project member management (Admin only)
- Project status: Active / Completed / Archived

### Tasks
- Create, assign, update, delete tasks
- **Kanban board** view (To Do / In Progress / Done)
- **List/Table** view with sorting
- Task priority: Low / Medium / High
- Due dates with overdue detection
- Quick status change from Kanban cards

### Dashboard
- Stats overview: projects, total tasks, completed, overdue
- Task breakdown with visual progress bars
- Recent activity feed

### Role-Based Access Control
- **Admin**: Full access to all projects, all tasks, can manage members
- **Member**: Access only to projects they own or are members of

## 🏗 API Endpoints

```
POST   /api/auth/signup       Register user
POST   /api/auth/login        Login
GET    /api/auth/me           Get current user

GET    /api/projects          List projects (filtered by role)
POST   /api/projects          Create project
GET    /api/projects/:id      Get project with members
PUT    /api/projects/:id      Update project
DELETE /api/projects/:id      Delete project
POST   /api/projects/:id/members  Add member to project

GET    /api/projects/:id/tasks    List tasks
POST   /api/projects/:id/tasks    Create task
PUT    /api/tasks/:id             Update task
DELETE /api/tasks/:id             Delete task

GET    /api/dashboard         Dashboard stats
GET    /api/users             All users (for member assignment)
```

## 🚢 Deployment (Railway)

### Backend
1. Push code to GitHub
2. Create new project on [Railway](https://railway.app)
3. Connect GitHub repo → select `backend` folder
4. Add environment variable: `JWT_SECRET=your_secret_key`
5. Deploy!

### Frontend
1. Set `REACT_APP_API_URL=https://your-backend.railway.app/api` in `.env`
2. Build: `npm run build`
3. Deploy `build/` folder on Railway (or Vercel/Netlify)

### One-Click Local Run
```bash
# Backend
cd backend && npm install && node server.js

# Frontend (new terminal)
cd frontend && npm install && npm start
```

## 📁 Project Structure
```
taskmanager/
├── backend/
│   ├── server.js        # Express API + SQLite
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/       # Dashboard, Projects, ProjectDetail, Login, Signup
    │   ├── components/  # Sidebar
    │   ├── AuthContext.js
    │   ├── api.js
    │   └── App.css      # Full design system
    └── package.json
```

## 🎨 Design Highlights
- Dark theme with indigo accent color system
- Syne (display) + DM Sans (body) typography
- Smooth animations and hover transitions
- Kanban board with quick-action buttons
- Responsive layout with sidebar navigation
- Progress bars for project completion tracking
