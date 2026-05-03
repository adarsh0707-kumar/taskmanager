import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const nav = [
    { path: "/", icon: "⚡", label: "Dashboard" },
    { path: "/projects", icon: "📁", label: "Projects" },
    ...(user?.role === "admin"
      ? [{ path: "/team", icon: "👥", label: "My Team" }]
      : []),
    { path: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <span>TaskFlow</span>
      </div>
      <nav className="sidebar-nav">
        {nav.map((n) => (
          <Link
            key={n.path}
            to={n.path}
            className={`nav-item ${pathname === n.path ? "active" : ""}`}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-card" style={{ marginBottom: 8 }}>
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <span className={`role-badge role-${user?.role}`}>
              {user?.role}
            </span>
          </div>
        </div>
        {confirmLogout ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-danger btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={logout}
            >
              Yes, logout
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: 12 }}
              onClick={() => setConfirmLogout(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            style={{
              width: "100%",
              justifyContent: "center",
              color: "var(--text3)",
            }}
            onClick={() => setConfirmLogout(true)}
          >
            ⎋ Logout
          </button>
        )}
      </div>
    </aside>
  );
}
