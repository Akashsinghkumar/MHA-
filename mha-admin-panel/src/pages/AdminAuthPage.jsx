import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setAdminToken, setAdminUser } from '../api.js';

export default function AdminAuthPage({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const payload = requiresOtp
        ? { username: username.trim(), password, otp: otp.trim() }
        : { username: username.trim(), password };
      const data = await apiFetch('/admin/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.requiresOtp) {
        setRequiresOtp(true);
        const devNote = data.devOtp ? ` (Test OTP: ${data.devOtp})` : '';
        setInfo(`${data.message}${devNote}`);
        return;
      }

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

          <h1>Admin Sign In</h1>
          <p className="admin-form-subtitle">
            {requiresOtp
              ? 'Enter the 6-digit verification OTP sent to your admin email.'
              : 'Sign in with your authorized admin username and password.'}
          </p>

          <label>
            Username
            <input
              className="admin-pill-input"
              value={username}
              disabled={requiresOtp}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter admin username"
            />
          </label>

          <label>
            Password
            <input
              className="admin-pill-input"
              type="password"
              value={password}
              disabled={requiresOtp}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          {requiresOtp && (
            <label>
              Admin Email OTP (6 digits)
              <input
                className="admin-pill-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                placeholder="Enter 6-digit OTP"
              />
            </label>
          )}

          <button className="admin-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : requiresOtp ? 'Verify OTP & Sign In →' : 'Sign In to Dashboard →'}
          </button>

          {info && <div style={{ color: '#15803d', fontSize: '13px', fontWeight: 600 }}>{info}</div>}
          {error && <div className="admin-error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}
