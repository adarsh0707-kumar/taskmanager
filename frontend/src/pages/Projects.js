import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API from '../api';
import toast from 'react-hot-toast';

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/projects', form);
      onCreate(data);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" placeholder="e.g. E-commerce Redesign" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : '＋ Create Project'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const statusColors = { active: 'var(--green)', completed: 'var(--accent)', archived: 'var(--text3)' };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Project</button>
        </div>

        <div className="mb-4">
          <div className="search-bar">
            <span>🔍</span>
            <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div style={{textAlign:'center',padding:'60px'}}><div className="spinner" style={{margin:'auto'}} /></div> :
          filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}>＋ New Project</button>
            </div>
          ) : (
            <div className="projects-grid">
              {filtered.map(p => {
                const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                      <span className={`badge badge-${p.status}`}><span className="dot" />{p.status}</span>
                      <span style={{fontSize:11, color:'var(--text3)'}}>by {p.owner_name}</span>
                    </div>
                    <div className="project-name">{p.name}</div>
                    <div className="project-desc">{p.description || 'No description provided.'}</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width:`${pct}%`}} />
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text3)', marginBottom:4}}>
                      <span>{pct}% complete</span>
                      <span>{p.done_count}/{p.task_count} tasks</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        {showModal && <CreateModal onClose={() => setShowModal(false)} onCreate={p => setProjects(prev => [p, ...prev])} />}
      </main>
    </div>
  );
}
