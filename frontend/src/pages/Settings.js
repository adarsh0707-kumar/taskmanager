import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password)
      return toast.error("New passwords do not match");
    setLoading(true);
    try {
      await API.put("/auth/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success("Password changed! Please login again.");
      setTimeout(() => logout(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const Eye = ({ visible, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "absolute",
        right: 12,
        background: "none",
        border: "none",
        color: "var(--text3)",
        cursor: "pointer",
        fontSize: 16,
        padding: 0,
      }}
    >
      {visible ? "🙈" : "👁"}
    </button>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account</p>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            maxWidth: 900,
          }}
        >
          {/* Profile */}
          <div className="card">
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              👤 Profile
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--accent),#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {user?.name}
                </div>
                <div style={{ color: "var(--text2)", fontSize: 14 }}>
                  {user?.email}
                </div>
                <span
                  className={`role-badge role-${user?.role}`}
                  style={{ marginTop: 6, display: "inline-flex" }}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="divider" />
            <div style={{ fontSize: 13, color: "var(--text2)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>Account ID</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  #{user?.id}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Member since</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
            <div className="divider" />
            <button
              className="btn btn-danger btn-full"
              onClick={() => {
                if (window.confirm("Logout?")) logout();
              }}
            >
              ⎋ Logout
            </button>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 17,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              🔐 Change Password
            </h3>
            <form onSubmit={handleChange}>
              {[
                {
                  key: "current",
                  label: "Current Password",
                  field: "current_password",
                  placeholder: "Enter current password",
                },
                {
                  key: "new",
                  label: "New Password",
                  field: "new_password",
                  placeholder: "Min 6 characters",
                },
                {
                  key: "confirm",
                  label: "Confirm New Password",
                  field: "confirm_password",
                  placeholder: "Repeat new password",
                },
              ].map(({ key, label, field, placeholder }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      className="form-input"
                      type={show[key] ? "text" : "password"}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <Eye
                      visible={show[key]}
                      onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                    />
                  </div>
                </div>
              ))}
              {form.new_password &&
                form.confirm_password &&
                form.new_password !== form.confirm_password && (
                  <div className="error-msg">⚠ Passwords don't match</div>
                )}
              <button
                className="btn btn-primary btn-full mt-4"
                disabled={loading}
              >
                {loading ? "⏳ Changing..." : "🔐 Change Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
