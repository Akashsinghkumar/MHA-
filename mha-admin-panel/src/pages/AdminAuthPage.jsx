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
    <div className="login-wrap">
      <form onSubmit={handleSubmit} className="login-card">
        <small>MHA RESTRICTED PORTAL</small>
        <h1>{mode === 'login' ? 'Admin Sign In' : 'Register Admin'}</h1>
        <p>
          {mode === 'login'
            ? 'Sign in with your admin account.'
            : 'Create a new admin staff account (requires invite code).'}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            className={`btn ${mode === 'login' ? '' : 'ghost'} sm`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn ${mode === 'register' ? '' : 'ghost'} sm`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register Admin
          </button>
        </div>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="admin" />
        </label>

        {mode === 'register' && (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@mha-shop.com" />
            </label>
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="MANAGER">Manager</option>
                <option value="SUPPORT_STAFF">Support Staff</option>
                <option value="FINANCE">Finance</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>
            <label>
              Admin Invite Code
              <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required placeholder="MHA-ADMIN-2026" />
            </label>
          </>
        )}

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </label>

        <button className="btn" style={{ width: '100%', marginTop: '16px' }} type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Admin Account'}
        </button>

        {error && <div className="err">{error}</div>}
      </form>
    </div>
  );
}
