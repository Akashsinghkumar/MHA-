import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setAdminToken, setAdminUser } from '../api.js';

export default function AdminAuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);

  const [resetId, setResetId] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
      if (mode === 'forgot') {
        if (!resetOtpSent) {
          const res = await apiFetch('/admin/forgot-password/send-otp', {
            method: 'POST',
            body: JSON.stringify({ identifier: resetId.trim() }),
          });
          setResetOtpSent(true);
          const devNote = res.devOtp ? ` (Test OTP: ${res.devOtp})` : '';
          setInfo(`${res.message}${devNote}`);
          return;
        }
        const res = await apiFetch('/admin/forgot-password/reset', {
          method: 'POST',
          body: JSON.stringify({
            identifier: resetId.trim(),
            otp: resetOtp.trim(),
            newPassword,
          }),
        });
        setMode('login');
        setUsername(resetId.trim());
        setPassword('');
        setResetOtpSent(false);
        setResetOtp('');
        setNewPassword('');
        setInfo(res.message);
        return;
      }

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
      navigate(data.admin?.mustChangePassword ? '/settings?setup=1' : '/dashboard');
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
            <div className="admin-panel-pill">OWNER &amp; STAFF ACCESS</div>
            <div className="admin-panel-stats">
              <div>
                <strong>2FA OTP</strong>
                <span>Email Verified</span>
              </div>
              <div>
                <strong>Audit</strong>
                <span>Login Tracking</span>
              </div>
            </div>
          </div>

          <div className="admin-brand-copy">
            <h2>Manage your store.<br />Control every detail.</h2>
            <p>Products, banners, orders, users &amp; payouts in one place.</p>
          </div>

          <div className="admin-brand-badges">
            <span>🛡️ Super Admin Only Staff Creation</span>
            <span>🔒 Email OTP 2FA &amp; Recovery</span>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="admin-split-form">
          <div className="admin-form-top">
            <small>MHA RESTRICTED PORTAL</small>
            <span className="admin-secure-tag">🔒 Owner / Staff Only</span>
          </div>

          <h1>{mode === 'forgot' ? 'Reset Admin Password' : 'Admin Sign In'}</h1>
          <p className="admin-form-subtitle">
            {mode === 'forgot'
              ? 'Verify with the OTP sent to your registered admin email.'
              : requiresOtp
                ? 'Enter the 6-digit verification OTP sent to your admin email.'
                : 'Sign in with your authorized admin username or email.'}
          </p>

          {mode === 'login' ? (
            <>
              <label>
                Username or Email
                <input
                  className="admin-pill-input"
                  value={username}
                  disabled={requiresOtp}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin or owner@gmail.com"
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

              {!requiresOtp && (
                <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#064896', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => { setMode('forgot'); setResetId(username); setError(''); setInfo(''); }}
                  >
                    Forgot admin password?
                  </button>
                </div>
              )}

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
            </>
          ) : (
            <>
              <label>
                Admin Username or Registered Email
                <input
                  className="admin-pill-input"
                  value={resetId}
                  disabled={resetOtpSent}
                  onChange={(e) => setResetId(e.target.value)}
                  required
                  placeholder="admin or yourname@gmail.com"
                />
              </label>

              {resetOtpSent && (
                <>
                  <label>
                    6-Digit Email OTP
                    <input
                      className="admin-pill-input"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                    />
                  </label>
                  <label>
                    New Password (min 8 chars)
                    <input
                      className="admin-pill-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Enter strong new password"
                    />
                  </label>
                </>
              )}

              <button className="admin-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Please wait…' : resetOtpSent ? 'Reset Password →' : 'Send Admin Reset OTP →'}
              </button>

              <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: '13px', color: '#475569' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#064896', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => { setMode('login'); setResetOtpSent(false); setError(''); setInfo(''); }}
                >
                  ← Back to Admin Sign In
                </button>
              </p>
            </>
          )}

          {info && <div style={{ color: '#15803d', fontSize: '13px', fontWeight: 600 }}>{info}</div>}
          {error && <div className="admin-error-msg">{error}</div>}
        </form>
      </div>
    </div>
  );
}
