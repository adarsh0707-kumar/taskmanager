import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";
import toast from "react-hot-toast";

function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">🎉 Member Credentials</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
            Share these login credentials with the member. This password won't
            be shown again.
          </p>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Email
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--accent2)",
                }}
              >
                {credentials.email}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 4,
                }}
              >
                Password
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 20,
                  color: "var(--green)",
                  fontFamily: "monospace",
                  letterSpacing: 2,
                }}
              >
                {credentials.password}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={copy}
            >
              {copied ? "✅ Copied!" : "📋 Copy Credentials"}
            </button>
            <button className="btn btn-secondary" onClick={onClose}>
              Done
            </button>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--text3)",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            ⚠ Member can change their password after logging in
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateMemberModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/admin/create-member", form);
      onCreate(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">➕ Add Team Member</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>
            A secure password will be auto-generated. You'll get credentials to
            share.
          </p>
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                className="form-input"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="form-input"
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Creating..." : "🔑 Create & Get Credentials"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    API.get("/users")
      .then((r) => setMembers(r.data.filter((u) => u.role === "member")))
      .finally(() => setLoading(false));
  }, []);

  const onCreate = (data) => {
    setMembers((prev) => [...prev, data.user]);
    setCredentials(data.credentials);
  };

  const resetPassword = async (member) => {
    setResetting(member.id);
    try {
      const { data } = await API.post(
        `/admin/reset-member-password/${member.id}`,
      );
      setCredentials(data.credentials);
      toast.success("Password reset!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    } finally {
      setResetting(null);
    }
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name}?`)) return;
    try {
      await API.delete(`/admin/members/${member.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Team</h1>
            <p className="page-subtitle">
              {members.length} member{members.length !== 1 ? "s" : ""} in your
              organization
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            ➕ Add Member
          </button>
        </div>

        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: 16,
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--text2)", margin: 0 }}>
            🔒{" "}
            <strong style={{ color: "var(--text)" }}>
              Multi-org isolation:
            </strong>{" "}
            You only see members you created. Members from other admins are
            completely separate.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner" style={{ margin: "auto" }} />
          </div>
        ) : members.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <h3>No team members yet</h3>
            <p>Add members and share their login credentials</p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => setShowCreate(true)}
            >
              ➕ Add First Member
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,var(--accent),#8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {m.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <span className="role-badge role-member">member</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text2)", fontSize: 13 }}>
                      {m.email}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text3)" }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => resetPassword(m)}
                          disabled={resetting === m.id}
                        >
                          {resetting === m.id ? "⏳" : "🔑"} Reset Password
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => removeMember(m)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showCreate && (
          <CreateMemberModal
            onClose={() => setShowCreate(false)}
            onCreate={onCreate}
          />
        )}
        {credentials && (
          <CredentialsModal
            credentials={credentials}
            onClose={() => setCredentials(null)}
          />
        )}
      </main>
    </div>
  );
}
