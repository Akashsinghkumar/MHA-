import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../neonAuth.js';
import { useStore } from '../context/StoreContext.jsx';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, toast } = useStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!authClient) {
      setError('Neon Auth URL (VITE_NEON_AUTH_URL) is not configured.');
      return;
    }

    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result =
        tab === 'register'
          ? await authClient.signUp.email({
              email: email.trim(),
              password,
              name: name.trim(),
            })
          : await authClient.signIn.email({
              email: email.trim(),
              password,
            });

      if (result.error) {
        setError(result.error.message || 'Authentication failed');
        return;
      }

      const sessionRes = await authClient.getSession();
      const authUser = sessionRes?.data?.user || result.data?.user;
      if (authUser) {
        setUser({
          id: authUser.id,
          name: authUser.name || email.split('@')[0],
          email: authUser.email,
          kycStatus: 'Pending',
          referralCode: 'MHA-MEMBER',
        });
        toast(`Welcome, ${(authUser.name || authUser.email).split(' ')[0]}`);
        navigate('/member');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <span className="admin-login-icon">🛍️</span>
        <small>MHA CUSTOMER ACCOUNT · NEON AUTH</small>
        <h1>{tab === 'login' ? 'Sign In' : 'Create Account'}</h1>
        <p>
          {tab === 'login'
            ? 'Sign in with your email and password.'
            : 'Register a new MHA account with email and password.'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button type="button" className={`mb ${tab === 'login' ? '' : 'o'}`} onClick={() => { setTab('login'); setError(''); }}>
            Sign In
          </button>
          <button type="button" className={`mb ${tab === 'register' ? '' : 'o'}`} onClick={() => { setTab('register'); setError(''); }}>
            Register
          </button>
        </div>

        {tab === 'register' && (
          <label>Full Name
            <input className="f" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
          </label>
        )}

        <label>Email Address
          <input
            className="f"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </label>

        <label>Password
          <input
            className="f"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimum 8 characters"
          />
        </label>

        {tab === 'register' && (
          <label>Confirm Password
            <input
              className="f"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter password"
            />
          </label>
        )}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        {error && <p className="admin-login-error">{error}</p>}
        <button className="admin-back" type="button" onClick={() => navigate('/')}>Back to store</button>
      </form>
    </section>
  );
}
