import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setToken } from '../api.js';
import { useStore } from '../context/StoreContext.jsx';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loginMode, setLoginMode] = useState('password');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, toast } = useStore();
  const navigate = useNavigate();

  function inferChannel(val) {
    return /^\d{10}$/.test(val.trim()) ? 'phone' : 'email';
  }

  async function handleSendOtp(channel, target, purpose) {
    setError('');
    setInfo('');
    const clean = target.trim();
    if (channel === 'phone' && !/^\d{10}$/.test(clean)) {
      setError('Enter a valid 10-digit mobile number first.');
      return;
    }
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address first.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ channel, target: clean, purpose }),
      });
      if (purpose === 'login') setLoginOtpSent(true);
      else if (channel === 'phone') setPhoneOtpSent(true);
      else setEmailOtpSent(true);

      const devNote = res.devOtp ? ` (Test OTP: ${res.devOtp})` : '';
      setInfo(`${res.message}${devNote}`);
      toast(`OTP sent to ${channel}`);
    } catch (err) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyRegisterOtp(channel, target, code) {
    setError('');
    setInfo('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ channel, target: target.trim(), code: code.trim(), purpose: 'register' }),
      });
      if (channel === 'phone') setPhoneVerified(true);
      else setEmailVerified(true);
      toast(`${channel === 'phone' ? 'Mobile number' : 'Email'} verified`);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (tab === 'register') {
      if (!phoneVerified) {
        setError('Please verify your 10-digit mobile number with OTP.');
        return;
      }
      if (!emailVerified) {
        setError('Please verify your email address with OTP.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      let data;
      if (tab === 'register') {
        data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password,
            referralCode: referralCode.trim() || undefined,
          }),
        });
      } else if (loginMode === 'otp') {
        if (!loginOtpSent) {
          await handleSendOtp(inferChannel(identifier), identifier, 'login');
          setLoading(false);
          return;
        }
        data = await apiFetch('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({
            channel: inferChannel(identifier),
            target: identifier.trim(),
            code: loginOtp.trim(),
            purpose: 'login',
          }),
        });
      } else {
        data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        });
      }

      if (data?.token && data?.user) {
        setToken(data.token);
        setUser(data.user);
        toast(`Welcome, ${(data.user.name || data.user.email || 'Member').split(' ')[0]}`);
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
        <small>MHA CUSTOMER ACCOUNT · VERIFIED AUTH</small>
        <h1>{tab === 'login' ? 'Sign In' : 'Create Account'}</h1>
        <p>
          {tab === 'login'
            ? 'Sign in with your password or one-time OTP.'
            : 'Verify your mobile number and email with OTP to register.'}
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            className={`mb ${tab === 'login' ? '' : 'o'}`}
            onClick={() => { setTab('login'); setError(''); setInfo(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`mb ${tab === 'register' ? '' : 'o'}`}
            onClick={() => { setTab('register'); setError(''); setInfo(''); }}
          >
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                className={`mb ${loginMode === 'password' ? '' : 'o'}`}
                onClick={() => { setLoginMode('password'); setError(''); setInfo(''); }}
              >
                Password
              </button>
              <button
                type="button"
                className={`mb ${loginMode === 'otp' ? '' : 'o'}`}
                onClick={() => { setLoginMode('otp'); setLoginOtpSent(false); setError(''); setInfo(''); }}
              >
                Login via OTP
              </button>
            </div>

            <label>Email or 10-Digit Mobile Number
              <input
                className="f"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setLoginOtpSent(false); }}
                required
                placeholder="you@example.com or 9876543210"
              />
            </label>

            {loginMode === 'password' ? (
              <label>Password
                <input
                  className="f"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </label>
            ) : (
              loginOtpSent && (
                <label>6-Digit OTP
                  <input
                    className="f"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                  />
                </label>
              )
            )}
          </>
        ) : (
          <>
            <label>Full Name
              <input
                className="f"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </label>

            <label>Mobile Number (10 digits) {phoneVerified && <span style={{ color: '#16a34a' }}>✓ Verified</span>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="f"
                  type="tel"
                  value={phone}
                  disabled={phoneVerified}
                  onChange={(e) => { setPhone(e.target.value); setPhoneOtpSent(false); setPhoneVerified(false); }}
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                />
                {!phoneVerified && (
                  <button
                    type="button"
                    className="mb"
                    disabled={loading}
                    onClick={() => handleSendOtp('phone', phone, 'register')}
                  >
                    {phoneOtpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
              </div>
            </label>
            {phoneOtpSent && !phoneVerified && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  className="f"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  maxLength={6}
                  placeholder="Enter Phone OTP"
                />
                <button
                  type="button"
                  className="mb"
                  disabled={loading}
                  onClick={() => handleVerifyRegisterOtp('phone', phone, phoneOtp)}
                >
                  Verify
                </button>
              </div>
            )}

            <label>Email Address {emailVerified && <span style={{ color: '#16a34a' }}>✓ Verified</span>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="f"
                  type="email"
                  value={email}
                  disabled={emailVerified}
                  onChange={(e) => { setEmail(e.target.value); setEmailOtpSent(false); setEmailVerified(false); }}
                  required
                  placeholder="you@example.com"
                />
                {!emailVerified && (
                  <button
                    type="button"
                    className="mb"
                    disabled={loading}
                    onClick={() => handleSendOtp('email', email, 'register')}
                  >
                    {emailOtpSent ? 'Resend' : 'Send OTP'}
                  </button>
                )}
              </div>
            </label>
            {emailOtpSent && !emailVerified && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  className="f"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  maxLength={6}
                  placeholder="Enter Email OTP"
                />
                <button
                  type="button"
                  className="mb"
                  disabled={loading}
                  onClick={() => handleVerifyRegisterOtp('email', email, emailOtp)}
                >
                  Verify
                </button>
              </div>
            )}

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

            <label>Referral Code (Optional)
              <input
                className="f"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="e.g. MHA1234ABC"
              />
            </label>
          </>
        )}

        <button className="btn" type="submit" disabled={loading}>
          {loading
            ? 'Please wait…'
            : tab === 'login'
              ? (loginMode === 'otp' && !loginOtpSent ? 'Send Login OTP' : 'Sign In')
              : 'Create Verified Account'}
        </button>

        {info && <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '8px' }}>{info}</p>}
        {error && <p className="admin-login-error">{error}</p>}
        <button className="admin-back" type="button" onClick={() => navigate('/')}>Back to store</button>
      </form>
    </section>
  );
}
