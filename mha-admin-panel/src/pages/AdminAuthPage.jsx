import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setAdminToken, setAdminUser } from '../api.js';

export default function AdminAuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/admin/login' : '/admin/register';
      const payload =
        mode === 'login'
          ? { username, password }
          : { username, email, role, inviteCode, password };
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAdminToken(data.token);
      setAdminUser(data.admin);
      if (onAuth) onAuth(data.admin);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-split-wrap">
      <div className="admin-split-card">
        <aside className="admin-split-brand">
          <div>
            <div className="admin-brand-title">MHA</div>
            <div className="admin-brand-sub">ADMIN CONTROL CENTER</div>
          </div>

          <div className="admin-brand-panel">
            <div className="admin-panel-pill">LIVE STORE OPERATIONS</div>
            <div className="admin-panel-stats">
              <div>
                <strong>Catalog</strong>
                <span>Products &amp; CMS</span>
              </div>
              <div>
                <strong>Orders</strong>
                <span>Tracking &amp; Payouts</span>
              </div>
            </div>
          </div>

          <div className="admin-brand-copy">
            <h2>Manage your store.<br />Control every detail.</h2>
            <p>Products, banners, orders, users &amp; payouts in one place.</p>
          </div>

          <div className="admin-brand-badges">
            <span>🛡️ Role-Based Access Control</span>
            <span>⚡ Real-Time Database Sync</span>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="admin-split-form">
          <div className="admin-form-top">
            <small>MHA RESTRICTED PORTAL</small>
            <span className="admin-secure-tag">🔒 Staff Only</span>
          </div>

          <h1>{mode === 'login' ? 'Admin Sign In' : 'Register Staff Admin'}</h1>
          <p className="admin-form-subtitle">
            {mode === 'login'
              ? 'Sign in with your admin username and password.'
              : 'Create a new admin staff account using an invite code.'}
          </p>

          <div className="admin-mode-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register Admin
            </button>
          </div>

          <label>
            Username
            <input
              className="admin-pill-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter admin username"
            />
          </label>

          {mode === 'register' && (
            <>
              <div className="admin-row-2">
                <label>
                  Email Address
                  <input
                    className="admin-pill-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="staff@mha-shop.com"
                  />
                </label>
                <label>
                  Staff Role
                  <select className="admin-pill-input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPPORT_STAFF">Support Staff</option>
                    <option value="FINANCE">Finance</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </label>
              </div>

              <div className="admin-invite-box">
                <div className="admin-invite-head">
                  <span>🔑 Admin Invite Code</span>
                  <small>Required</small>
                </div>
                <input
                  className="admin-pill-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  placeholder="Enter invite code"
                />
              </div>
            </>
          )}

          <label>
            Password
            <input
              className="admin-pill-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          <button className="admin-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In to Dashboard →' : 'Create Admin Account →'}
          </button>

          {error && <div className="admin-error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}
