import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_ICONS = { todo: '⭕', in_progress: '🔄', done: '✅' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

function TaskModal({ task, members, projectId, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState(task ? {
    title: task.title, description: task.description || '', assigned_to: task.assigned_to || '',
    priority: task.priority, due_date: task.due_date ? task.due_date.split('T')[0] : '', status: task.status
  } : { title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'todo' });
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault(); setLoading(true);
    try {
      let data;
      if (task) {
        const r = await API.put(`/tasks/${task.id}`, { ...form, assigned_to: form.assigned_to || null });
        data = r.data;
        toast.success('Task updated!');
      } else {
        const r = await API.post(`/projects/${projectId}/tasks`, { ...form, assigned_to: form.assigned_to || null });
        data = r.data;
        toast.success('Task created!');
      }
      onSave(data, !!task);
      onClose();
    } catch (err) { toast.error('Failed to save task'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Task title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What needs to be done?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => { API.get('/users').then(r => setUsers(r.data)); }, []);

  const handle = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await API.post(`/projects/${projectId}/members`, { user_id: selected, role });
      toast.success('Member added!');
      onAdd();
      onClose();
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Choose user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={loading || !selected}>Add Member</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const loadProject = useCallback(() => {
    API.get(`/projects/${id}`).then(r => setProject(r.data));
  }, [id]);

  const loadTasks = useCallback(() => {
    API.get(`/projects/${id}/tasks`).then(r => setTasks(r.data));
  }, [id]);

  useEffect(() => {
    Promise.all([loadProject(), loadTasks()]).finally(() => setLoading(false));
  }, [loadProject, loadTasks]);

  const deleteTask = async taskId => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Task deleted');
  };

  const quickStatus = async (task, status) => {
    const { data } = await API.put(`/tasks/${task.id}`, { status });
    setTasks(prev => prev.map(t => t.id === task.id ? data : t));
  };

  const deleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await API.delete(`/projects/${id}`);
    toast.success('Project deleted');
    navigate('/projects');
  };

  const onSaveTask = (data, isEdit) => {
    if (isEdit) setTasks(prev => prev.map(t => t.id === data.id ? data : t));
    else setTasks(prev => [data, ...prev]);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return <div className="app-layout"><Sidebar /><main className="main-content"><p>Project not found</p></main></div>;

  const isOwnerOrAdmin = project.owner_id === user?.id || user?.role === 'admin';
  const pct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{marginBottom:8}}>
          <Link to="/projects" style={{color:'var(--text3)', fontSize:13, textDecoration:'none'}}>← Projects</Link>
        </div>
        <div className="page-header">
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
              <h1 className="page-title">{project.name}</h1>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </div>
            {project.description && <p className="page-subtitle">{project.description}</p>}
            <div style={{marginTop:12}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:5}}>
                <span>{pct}% complete</span>
                <span>{tasks.filter(t=>t.status==='done').length}/{tasks.length} tasks done</span>
              </div>
              <div className="progress-bar" style={{maxWidth:400}}>
                <div className="progress-fill" style={{width:`${pct}%`}} />
              </div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>＋ Add Task</button>
            {isOwnerOrAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>👥 Members</button>}
            {isOwnerOrAdmin && <button className="btn btn-danger btn-sm" onClick={deleteProject}>🗑</button>}
          </div>
        </div>

        {/* Members strip */}
        {project.members?.length > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:20}}>
            <span style={{fontSize:12, color:'var(--text3)'}}>Team:</span>
            {project.members.map(m => (
              <div key={m.id} title={`${m.name} (${m.role})`} style={{display:'flex', alignItems:'center', gap:5, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'3px 10px', fontSize:12}}>
                <div style={{width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700}}>{m.name[0]}</div>
                <span>{m.name}</span>
                <span className={`role-badge role-${m.role}`}>{m.role}</span>
              </div>
            ))}
          </div>
        )}

        {/* View Tabs */}
        <div className="tabs">
          <button className={`tab ${view==='kanban'?'active':''}`} onClick={() => setView('kanban')}>🗂 Kanban</button>
          <button className={`tab ${view==='list'?'active':''}`} onClick={() => setView('list')}>☰ List</button>
        </div>

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <div className="kanban-board">
            {STATUSES.map(status => {
              const colTasks = tasks.filter(t => t.status === status);
              return (
                <div key={status} className="kanban-col">
                  <div className="kanban-header">
                    <span className="kanban-title">{STATUS_ICONS[status]} {STATUS_LABELS[status]}</span>
                    <span className="kanban-count">{colTasks.length}</span>
                  </div>
                  <div className="kanban-tasks">
                    {colTasks.map(task => (
                      <div key={task.id} className="kanban-card" onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>
                        <div className="kanban-card-title">{task.title}</div>
                        {task.description && <div style={{fontSize:12, color:'var(--text2)', marginBottom:8, lineHeight:1.4}}>{task.description.slice(0,80)}{task.description.length > 80 ? '...' : ''}</div>}
                        <div className="kanban-card-footer">
                          <span className={`badge badge-${task.priority}`}>▲ {task.priority}</span>
                          {task.assignee_name && <span style={{fontSize:11, color:'var(--text3)'}}>👤 {task.assignee_name.split(' ')[0]}</span>}
                        </div>
                        {task.due_date && (
                          <div style={{marginTop:8, fontSize:11, color: isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'var(--text3)'}}>
                            📅 {format(parseISO(task.due_date), 'MMM d')}
                            {isPast(parseISO(task.due_date)) && task.status !== 'done' && ' ⚠ Overdue'}
                          </div>
                        )}
                        <div style={{display:'flex', gap:4, marginTop:8}} onClick={e => e.stopPropagation()}>
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button key={s} className="btn btn-ghost btn-sm" style={{fontSize:10, padding:'3px 7px'}}
                              onClick={() => quickStatus(task, s)}>{STATUS_ICONS[s]}</button>
                          ))}
                          <button className="btn btn-danger btn-sm" style={{fontSize:10, padding:'3px 7px', marginLeft:'auto'}}
                            onClick={() => deleteTask(task.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div style={{textAlign:'center', padding:'30px 0', color:'var(--text3)', fontSize:13}}>Drop tasks here</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          tasks.length === 0 ? (
            <div className="empty"><div className="empty-icon">📋</div><h3>No tasks yet</h3><p>Add your first task above</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <div style={{fontWeight:600, fontSize:14}}>{task.title}</div>
                        {task.description && <div style={{fontSize:12, color:'var(--text3)', marginTop:2}}>{task.description.slice(0,60)}...</div>}
                      </td>
                      <td><span className={`badge badge-${task.status}`}><span className="dot" />{STATUS_LABELS[task.status]}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td style={{fontSize:13}}>{task.assignee_name || <span style={{color:'var(--text3)'}}>—</span>}</td>
                      <td style={{fontSize:13}}>
                        {task.due_date ? (
                          <span style={{color: isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'var(--red)' : 'inherit'}}>
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          </span>
                        ) : <span style={{color:'var(--text3)'}}>—</span>}
                      </td>
                      <td>
                        <div style={{display:'flex', gap:6}}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingTask(task); setShowTaskModal(true); }}>✏</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {showTaskModal && (
          <TaskModal
            task={editingTask}
            members={project.members || []}
            projectId={id}
            onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
            onSave={onSaveTask}
          />
        )}
        {showMemberModal && (
          <AddMemberModal projectId={id} onClose={() => setShowMemberModal(false)} onAdd={loadProject} />
        )}
      </main>
    </div>
  );
}
