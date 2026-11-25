import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setToken } from '../api.js';
import { useStore } from '../context/StoreContext.jsx';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, toast } = useStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (tab === 'register') {
      if (!/^\d{10}$/.test(identifier.trim())) {
        setError('Enter a valid 10-digit mobile number.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const res =
        tab === 'register'
          ? await apiFetch('/auth/register', {
              method: 'POST',
              body: JSON.stringify({
                name: name.trim(),
                email: email.trim(),
                phone: identifier.trim(),
                password,
                referralCode: referralCode.trim(),
              }),
            })
          : await apiFetch('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ identifier: identifier.trim(), password }),
            });

      setToken(res.token);
      setUser(res.user);
      toast(`Welcome, ${res.user.name.split(' ')[0]}`);
      navigate('/member');
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
        <small>MHA CUSTOMER ACCOUNT</small>
        <h1>{tab === 'login' ? 'Sign In' : 'Create Account'}</h1>
        <p>
          {tab === 'login'
            ? 'Sign in with your mobile number or email.'
            : 'Register a new MHA customer & member account.'}
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
          <>
            <label>Full Name
              <input className="f" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" />
            </label>
            <label>Email (optional)
              <input className="f" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
          </>
        )}

        <label>{tab === 'register' ? 'Mobile Number (10 digits)' : 'Mobile Number or Email'}
          <input
            className="f"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder={tab === 'register' ? '10-digit mobile number' : 'Mobile or email'}
          />
        </label>

        <label>Password
          <input
            className="f"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
        </label>

        {tab === 'register' && (
          <>
            <label>Confirm Password
              <input
                className="f"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter password"
              />
            </label>
            <label>Referral Code (optional)
              <input className="f" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="e.g. MHA1234" />
            </label>
          </>
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
