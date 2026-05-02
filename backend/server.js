const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const bcrypt = {
  hashSync: (pwd, _) => crypto.createHash('sha256').update(pwd + 'taskflow_salt').digest('hex'),
  compareSync: (pwd, hash) => crypto.createHash('sha256').update(pwd + 'taskflow_salt').digest('hex') === hash
};
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { body, validationResult } = require('express-validator');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_taskmanager_2024';
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── DB SETUP ─────────────────────────────────────────────────────────────────
const db = new Database(process.env.DB_PATH || './taskmanager.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin','member')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    project_id INTEGER NOT NULL,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
    due_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ─── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/auth/signup',
  [body('email').isEmail(), body('password').isLength({ min: 6 }), body('name').notEmpty()],
  validationMiddleware,
  (req, res) => {
    const { name, email, password, role = 'member' } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    try {
      const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)');
      const result = stmt.run(name, email, hash, role === 'admin' ? 'admin' : 'member');
      const user = db.prepare('SELECT id, name, email, role FROM users WHERE id=?').get(result.lastInsertRowid);
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
      res.status(500).json({ error: e.message });
    }
  }
);

app.post('/api/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validationMiddleware,
  (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  }
);

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// ─── USERS ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users').all();
  res.json(users);
});

// ─── PROJECT ROUTES ────────────────────────────────────────────────────────────
app.get('/api/projects', auth, (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status='done') as done_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status='done') as done_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id=?)
      ORDER BY p.created_at DESC
    `).all(req.user.id, req.user.id);
  }
  res.json(projects);
});

app.post('/api/projects', auth,
  [body('name').notEmpty()],
  validationMiddleware,
  (req, res) => {
    const { name, description } = req.body;
    const result = db.prepare('INSERT INTO projects (name, description, owner_id) VALUES (?,?,?)').run(name, description, req.user.id);
    db.prepare('INSERT OR IGNORE INTO project_members (project_id, user_id, role) VALUES (?,?,?)').run(result.lastInsertRowid, req.user.id, 'admin');
    const project = db.prepare('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id=u.id WHERE p.id=?').get(result.lastInsertRowid);
    res.status(201).json(project);
  }
);

app.get('/api/projects/:id', auth, (req, res) => {
  const project = db.prepare('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id=u.id WHERE p.id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const members = db.prepare('SELECT u.id, u.name, u.email, pm.role FROM project_members pm JOIN users u ON pm.user_id=u.id WHERE pm.project_id=?').all(req.params.id);
  res.json({ ...project, members });
});

app.put('/api/projects/:id', auth, (req, res) => {
  const { name, description, status } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('UPDATE projects SET name=?, description=?, status=? WHERE id=?').run(name || project.name, description ?? project.description, status || project.status, req.params.id);
  res.json(db.prepare('SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id=u.id WHERE p.id=?').get(req.params.id));
});

app.delete('/api/projects/:id', auth, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/projects/:id/members', auth, (req, res) => {
  const { user_id, role = 'member' } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  db.prepare('INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?,?,?)').run(req.params.id, user_id, role);
  res.json({ message: 'Member added' });
});

// ─── TASK ROUTES ───────────────────────────────────────────────────────────────
app.get('/api/projects/:id/tasks', auth, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    JOIN users c ON t.created_by = c.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.id);
  res.json(tasks);
});

app.post('/api/projects/:id/tasks', auth,
  [body('title').notEmpty()],
  validationMiddleware,
  (req, res) => {
    const { title, description, assigned_to, priority = 'medium', due_date, status = 'todo' } = req.body;
    const result = db.prepare('INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date, status) VALUES (?,?,?,?,?,?,?,?)').run(title, description, req.params.id, assigned_to || null, req.user.id, priority, due_date || null, status);
    const task = db.prepare(`SELECT t.*, u.name as assignee_name, c.name as creator_name FROM tasks t LEFT JOIN users u ON t.assigned_to=u.id JOIN users c ON t.created_by=c.id WHERE t.id=?`).get(result.lastInsertRowid);
    res.status(201).json(task);
  }
);

app.put('/api/tasks/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  const { title, description, assigned_to, priority, due_date, status } = req.body;
  db.prepare('UPDATE tasks SET title=?, description=?, assigned_to=?, priority=?, due_date=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(
    title ?? task.title, description ?? task.description, assigned_to ?? task.assigned_to,
    priority ?? task.priority, due_date ?? task.due_date, status ?? task.status, req.params.id
  );
  const updated = db.prepare(`SELECT t.*, u.name as assignee_name, c.name as creator_name FROM tasks t LEFT JOIN users u ON t.assigned_to=u.id JOIN users c ON t.created_by=c.id WHERE t.id=?`).get(req.params.id);
  res.json(updated);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
app.get('/api/dashboard', auth, (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const myTasks = isAdmin
    ? db.prepare('SELECT * FROM tasks').all()
    : db.prepare('SELECT * FROM tasks WHERE assigned_to=? OR created_by=?').all(userId, userId);

  const overdue = myTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  myTasks.forEach(t => byStatus[t.status]++);

  const projects = isAdmin
    ? db.prepare('SELECT COUNT(*) as count FROM projects').get().count
    : db.prepare('SELECT COUNT(DISTINCT p.id) as count FROM projects p WHERE p.owner_id=? OR p.id IN (SELECT project_id FROM project_members WHERE user_id=?)').get(userId, userId).count;

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to=u.id JOIN projects p ON t.project_id=p.id
    ${isAdmin ? '' : 'WHERE t.assigned_to=? OR t.created_by=?'}
    ORDER BY t.updated_at DESC LIMIT 5
  `).all(...(isAdmin ? [] : [userId, userId]));

  res.json({ myTasks: myTasks.length, overdue, byStatus, projects, recentTasks });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
