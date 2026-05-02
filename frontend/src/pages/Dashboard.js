import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api';
import { useAuth } from '../AuthContext';
import { format, isPast, parseISO } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  const statusColor = { todo: '#64748b', in_progress: '#f59e0b', done: '#10b981' };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here's what's happening across your projects</p>
          </div>
          <Link to="/projects" className="btn btn-primary">＋ New Project</Link>
        </div>

        {loading ? <div style={{textAlign:'center',padding:'60px'}}><div className="spinner" style={{margin:'auto'}} /></div> : stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-icon">📁</div>
                <div className="stat-value" style={{color:'var(--blue)'}}>{stats.projects}</div>
                <div className="stat-label">Active Projects</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value" style={{color:'var(--accent2)'}}>{stats.myTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon">🎯</div>
                <div className="stat-value" style={{color:'var(--green)'}}>{stats.byStatus.done}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon">🔥</div>
                <div className="stat-value" style={{color:'var(--red)'}}>{stats.overdue}</div>
                <div className="stat-label">Overdue</div>
              </div>
            </div>

            {/* Status Progress */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24}}>
              <div className="card">
                <h3 style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:16}}>Task Breakdown</h3>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} style={{marginBottom:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5}}>
                      <span style={{color:'var(--text2)'}}>{statusLabel[status]}</span>
                      <span style={{fontWeight:700, color:statusColor[status]}}>{count}</span>
                    </div>
                    <div className="progress-bar" style={{height:6}}>
                      <div className="progress-fill" style={{width: stats.myTasks ? `${(count/stats.myTasks)*100}%` : '0%', background: statusColor[status]}} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:16}}>Quick Actions</h3>
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  <Link to="/projects" className="btn btn-secondary" style={{justifyContent:'flex-start'}}>
                    📁 Browse all projects
                  </Link>
                  <Link to="/projects" className="btn btn-secondary" style={{justifyContent:'flex-start'}}>
                    ➕ Create new project
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Tasks */}
            <div className="tasks-section">
              <div className="section-header">
                <h2 className="section-title">Recent Activity</h2>
              </div>
              {stats.recentTasks.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📋</div>
                  <h3>No tasks yet</h3>
                  <p>Create a project and start adding tasks</p>
                </div>
              ) : (
                <div className="task-list">
                  {stats.recentTasks.map(task => (
                    <Link key={task.id} to={`/projects/${task.project_id}`} style={{textDecoration:'none'}}>
                      <div className="task-item" style={{cursor:'pointer'}}>
                        <div className={`task-check ${task.status}`}>
                          {task.status === 'done' && '✓'}
                          {task.status === 'in_progress' && '●'}
                        </div>
                        <div className="task-body">
                          <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                          <div className="task-meta">
                            <span className="task-meta-item">📁 {task.project_name}</span>
                            {task.assignee_name && <span className="task-meta-item">👤 {task.assignee_name}</span>}
                            {task.due_date && (
                              <span className={`task-meta-item ${isPast(parseISO(task.due_date)) && task.status !== 'done' ? 'overdue' : ''}`}>
                                📅 {format(parseISO(task.due_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`badge badge-${task.status}`}><span className="dot" />{statusLabel[task.status]}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
