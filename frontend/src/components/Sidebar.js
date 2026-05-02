import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const nav = [
    { path: '/', icon: '⚡', label: 'Dashboard' },
    { path: '/projects', icon: '📁', label: 'Projects' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <span>TaskFlow</span>
      </div>
      <nav className="sidebar-nav">
        {nav.map(n => (
          <Link key={n.path} to={n.path} className={`nav-item ${pathname === n.path ? 'active' : ''}`}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">⎋</button>
        </div>
      </div>
    </aside>
  );
}
