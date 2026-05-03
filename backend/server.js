const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_taskflow_2024";
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || "./db.json";

app.use(cors());
app.use(express.json());

const bcrypt = {
  hash: (pwd) =>
    crypto
      .createHash("sha256")
      .update(pwd + "_taskflow_s4lt_")
      .digest("hex"),
  compare: (pwd, hash) =>
    crypto
      .createHash("sha256")
      .update(pwd + "_taskflow_s4lt_")
      .digest("hex") === hash,
};

const initDB = () => ({
  users: [],
  projects: [],
  project_members: [],
  tasks: [],
  organizations: [],
});
const loadDB = () => {
  try {
    if (fs.existsSync(DB_PATH))
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (e) {}
  return initDB();
};
const saveDB = (db) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {}
};
let db = loadDB();
if (!db.organizations) {
  db.organizations = [];
  saveDB(db);
}
const nextId = (arr) =>
  arr.length === 0 ? 1 : Math.max(...arr.map((x) => x.id)) + 1;
const now = () => new Date().toISOString();
const genPassword = () => crypto.randomBytes(4).toString("hex"); // 8 char random password

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admins only" });
  next();
};

// ─── AUTH ──────────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, role = "member" } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password required" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  db = loadDB();
  if (db.users.find((u) => u.email === email))
    return res.status(409).json({ error: "Email already exists" });
  const user = {
    id: nextId(db.users),
    name,
    email,
    password: bcrypt.hash(password),
    role: role === "admin" ? "admin" : "member",
    created_by_admin: null,
    org_id: null,
    created_at: now(),
  };
  db.users.push(user);
  saveDB(db);
  const { password: _, ...safeUser } = user;
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.status(201).json({ token, user: safeUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  db = loadDB();
  const user = db.users.find((u) => u.email === email);
  if (!user || !bcrypt.compare(password, user.password))
    return res.status(401).json({ error: "Invalid credentials" });
  const { password: _, ...safeUser } = user;
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  res.json({ token, user: safeUser });
});

app.get("/api/auth/me", auth, (req, res) => {
  db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// Change password
app.put("/api/auth/change-password", auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ error: "Both fields required" });
  if (new_password.length < 6)
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  db = loadDB();
  const idx = db.users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  if (!bcrypt.compare(current_password, db.users[idx].password))
    return res.status(401).json({ error: "Current password is incorrect" });
  db.users[idx].password = bcrypt.hash(new_password);
  saveDB(db);
  res.json({ message: "Password changed successfully" });
});

// ─── USERS ─────────────────────────────────────────────────────────────────────
// Admin gets only their own members; superadmin sees all
app.get("/api/users", auth, (req, res) => {
  db = loadDB();
  if (req.user.role === "admin") {
    // Admin sees only members they created
    const myMembers = db.users.filter(
      (u) => u.created_by_admin === req.user.id || u.id === req.user.id,
    );
    res.json(myMembers.map(({ password: _, ...u }) => u));
  } else {
    res.json(
      db.users
        .filter((u) => u.id === req.user.id)
        .map(({ password: _, ...u }) => u),
    );
  }
});

// Admin creates a member with generated credentials
app.post("/api/admin/create-member", auth, adminOnly, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email)
    return res.status(400).json({ error: "Name and email required" });
  db = loadDB();
  if (db.users.find((u) => u.email === email))
    return res.status(409).json({ error: "Email already exists" });
  const plainPassword = genPassword();
  const user = {
    id: nextId(db.users),
    name,
    email,
    password: bcrypt.hash(plainPassword),
    role: "member",
    created_by_admin: req.user.id,
    org_id: req.user.id, // org = admin who created them
    created_at: now(),
  };
  db.users.push(user);
  saveDB(db);
  const { password: _, ...safeUser } = user;
  // Return plain password so admin can share it
  res
    .status(201)
    .json({ user: safeUser, credentials: { email, password: plainPassword } });
});

// Admin resets a member's password
app.post(
  "/api/admin/reset-member-password/:id",
  auth,
  adminOnly,
  (req, res) => {
    db = loadDB();
    const idx = db.users.findIndex((u) => u.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    if (db.users[idx].created_by_admin !== req.user.id)
      return res.status(403).json({ error: "Not your member" });
    const plainPassword = genPassword();
    db.users[idx].password = bcrypt.hash(plainPassword);
    saveDB(db);
    res.json({
      credentials: { email: db.users[idx].email, password: plainPassword },
    });
  },
);

// Admin removes a member
app.delete("/api/admin/members/:id", auth, adminOnly, (req, res) => {
  db = loadDB();
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "Not found" });
  if (user.created_by_admin !== req.user.id)
    return res.status(403).json({ error: "Not your member" });
  db.users = db.users.filter((u) => u.id !== user.id);
  db.project_members = db.project_members.filter((m) => m.user_id !== user.id);
  saveDB(db);
  res.json({ message: "Member removed" });
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
const enrichProject = (p, db) => {
  const owner = db.users.find((u) => u.id === p.owner_id);
  const tasks = db.tasks.filter((t) => t.project_id === p.id);
  return {
    ...p,
    owner_name: owner?.name || "Unknown",
    task_count: tasks.length,
    done_count: tasks.filter((t) => t.status === "done").length,
  };
};

app.get("/api/projects", auth, (req, res) => {
  db = loadDB();
  let projects = db.projects;
  if (req.user.role !== "admin") {
    const memberOf = db.project_members
      .filter((m) => m.user_id === req.user.id)
      .map((m) => m.project_id);
    projects = projects.filter(
      (p) => p.owner_id === req.user.id || memberOf.includes(p.id),
    );
  } else {
    // Admin sees only their own projects
    projects = projects.filter((p) => p.owner_id === req.user.id);
  }
  res.json(projects.map((p) => enrichProject(p, db)).reverse());
});

app.post("/api/projects", auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  db = loadDB();
  const project = {
    id: nextId(db.projects),
    name,
    description: description || "",
    owner_id: req.user.id,
    status: "active",
    created_at: now(),
  };
  db.projects.push(project);
  db.project_members.push({
    project_id: project.id,
    user_id: req.user.id,
    role: "admin",
  });
  saveDB(db);
  res.status(201).json(enrichProject(project, db));
});

app.get("/api/projects/:id", auth, (req, res) => {
  db = loadDB();
  const project = db.projects.find((p) => p.id === parseInt(req.params.id));
  if (!project) return res.status(404).json({ error: "Not found" });
  const members = db.project_members
    .filter((m) => m.project_id === project.id)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.user_id);
      return user
        ? { id: user.id, name: user.name, email: user.email, role: m.role }
        : null;
    })
    .filter(Boolean);
  res.json({ ...enrichProject(project, db), members });
});

app.put("/api/projects/:id", auth, (req, res) => {
  db = loadDB();
  const idx = db.projects.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const project = db.projects[idx];
  if (project.owner_id !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { name, description, status } = req.body;
  db.projects[idx] = {
    ...project,
    name: name || project.name,
    description: description ?? project.description,
    status: status || project.status,
  };
  saveDB(db);
  res.json(enrichProject(db.projects[idx], db));
});

app.delete("/api/projects/:id", auth, (req, res) => {
  db = loadDB();
  const project = db.projects.find((p) => p.id === parseInt(req.params.id));
  if (!project) return res.status(404).json({ error: "Not found" });
  if (project.owner_id !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  db.projects = db.projects.filter((p) => p.id !== project.id);
  db.tasks = db.tasks.filter((t) => t.project_id !== project.id);
  db.project_members = db.project_members.filter(
    (m) => m.project_id !== project.id,
  );
  saveDB(db);
  res.json({ message: "Deleted" });
});

// Add member to project — admin can only add their own members
app.post("/api/projects/:id/members", auth, (req, res) => {
  const { user_id, role = "member" } = req.body;
  db = loadDB();
  const project = db.projects.find((p) => p.id === parseInt(req.params.id));
  if (!project) return res.status(404).json({ error: "Not found" });
  if (project.owner_id !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  // Check member belongs to this admin
  const targetUser = db.users.find((u) => u.id === parseInt(user_id));
  if (!targetUser) return res.status(404).json({ error: "User not found" });
  if (
    req.user.role === "admin" &&
    targetUser.created_by_admin !== req.user.id &&
    targetUser.id !== req.user.id
  ) {
    return res.status(403).json({ error: "You can only add your own members" });
  }
  db.project_members = db.project_members.filter(
    (m) => !(m.project_id === project.id && m.user_id === parseInt(user_id)),
  );
  db.project_members.push({
    project_id: project.id,
    user_id: parseInt(user_id),
    role,
  });
  saveDB(db);
  res.json({ message: "Member added" });
});

app.delete("/api/projects/:id/members/:uid", auth, (req, res) => {
  db = loadDB();
  const project = db.projects.find((p) => p.id === parseInt(req.params.id));
  if (!project) return res.status(404).json({ error: "Not found" });
  if (project.owner_id !== req.user.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  db.project_members = db.project_members.filter(
    (m) =>
      !(m.project_id === project.id && m.user_id === parseInt(req.params.uid)),
  );
  saveDB(db);
  res.json({ message: "Member removed" });
});

// ─── TASKS ─────────────────────────────────────────────────────────────────────
const enrichTask = (t, db) => {
  const assignee = db.users.find((u) => u.id === t.assigned_to);
  const creator = db.users.find((u) => u.id === t.created_by);
  return {
    ...t,
    assignee_name: assignee?.name || null,
    creator_name: creator?.name || "Unknown",
  };
};

app.get("/api/projects/:id/tasks", auth, (req, res) => {
  db = loadDB();
  res.json(
    db.tasks
      .filter((t) => t.project_id === parseInt(req.params.id))
      .map((t) => enrichTask(t, db))
      .reverse(),
  );
});

app.post("/api/projects/:id/tasks", auth, (req, res) => {
  const {
    title,
    description,
    assigned_to,
    priority = "medium",
    due_date,
    status = "todo",
  } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  db = loadDB();
  const task = {
    id: nextId(db.tasks),
    title,
    description: description || "",
    project_id: parseInt(req.params.id),
    assigned_to: assigned_to ? parseInt(assigned_to) : null,
    created_by: req.user.id,
    priority,
    due_date: due_date || null,
    status,
    created_at: now(),
    updated_at: now(),
  };
  db.tasks.push(task);
  saveDB(db);
  res.status(201).json(enrichTask(task, db));
});

app.put("/api/tasks/:id", auth, (req, res) => {
  db = loadDB();
  const idx = db.tasks.findIndex((t) => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const task = db.tasks[idx];
  const { title, description, assigned_to, priority, due_date, status } =
    req.body;
  db.tasks[idx] = {
    ...task,
    title: title ?? task.title,
    description: description ?? task.description,
    assigned_to:
      assigned_to !== undefined
        ? assigned_to
          ? parseInt(assigned_to)
          : null
        : task.assigned_to,
    priority: priority ?? task.priority,
    due_date: due_date !== undefined ? due_date : task.due_date,
    status: status ?? task.status,
    updated_at: now(),
  };
  saveDB(db);
  res.json(enrichTask(db.tasks[idx], db));
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  db = loadDB();
  const task = db.tasks.find((t) => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: "Not found" });
  db.tasks = db.tasks.filter((t) => t.id !== task.id);
  saveDB(db);
  res.json({ message: "Deleted" });
});

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
app.get("/api/dashboard", auth, (req, res) => {
  db = loadDB();
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const myTasks = isAdmin
    ? db.tasks.filter((t) => {
        const proj = db.projects.find((p) => p.id === t.project_id);
        return proj && proj.owner_id === userId;
      })
    : db.tasks.filter(
        (t) => t.assigned_to === userId || t.created_by === userId,
      );
  const overdue = myTasks.filter(
    (t) =>
      t.due_date && new Date(t.due_date) < new Date() && t.status !== "done",
  ).length;
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  myTasks.forEach((t) => {
    if (byStatus[t.status] !== undefined) byStatus[t.status]++;
  });
  const memberOf = db.project_members
    .filter((m) => m.user_id === userId)
    .map((m) => m.project_id);
  const projects = isAdmin
    ? db.projects.filter((p) => p.owner_id === userId).length
    : db.projects.filter(
        (p) => p.owner_id === userId || memberOf.includes(p.id),
      ).length;
  const myMembers = isAdmin
    ? db.users.filter((u) => u.created_by_admin === userId).length
    : 0;
  const recentTasks = [...myTasks]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)
    .map((t) => {
      const project = db.projects.find((p) => p.id === t.project_id);
      return { ...enrichTask(t, db), project_name: project?.name || "Unknown" };
    });
  res.json({
    myTasks: myTasks.length,
    overdue,
    byStatus,
    projects,
    recentTasks,
    myMembers,
  });
});

app.get("/", (req, res) =>
  res.json({ status: "TaskFlow API running", version: "2.0.0" }),
);
app.listen(PORT, () => console.log("TaskFlow server on port " + PORT));
