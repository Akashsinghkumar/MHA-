import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, setToken } from '../api.js';
import { siteImg, useStore } from '../context/StoreContext.jsx';

const VERIFY_METHODS = [
  { id: 'email', label: 'Email', icon: '✉️' },
  { id: 'phone', label: 'SMS', icon: '📱' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
];

function cleanPhoneInput(val) {
  const digits = String(val || '').replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => (searchParams.get('ref') ? 'register' : 'register'));
  const [loginMode, setLoginMode] = useState('password');
  const [loginChannel, setLoginChannel] = useState('email');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => (searchParams.get('ref') || '').toUpperCase());
  const [referralStatus, setReferralStatus] = useState(null);

  const [verifyMethod, setVerifyMethod] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, toast } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setReferralStatus(null);
      return;
    }
    if (code.length < 4) return;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(`/auth/referral/${encodeURIComponent(code)}`);
        setReferralStatus(res);
      } catch {
        setReferralStatus(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [referralCode]);

  function getRegisterTarget(channel) {
    return channel === 'email' ? email.trim().toLowerCase() : cleanPhoneInput(phone);
  }

  async function handleSendRegisterOtp() {
    setError('');
    setInfo('');
    const target = getRegisterTarget(verifyMethod);
    if (verifyMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Please enter a valid email address first.');
      return false;
    }
    if ((verifyMethod === 'phone' || verifyMethod === 'whatsapp') && !/^\d{10}$/.test(target)) {
      setError('Please enter a valid 10-digit mobile number first.');
      return false;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ channel: verifyMethod, target, purpose: 'register' }),
      });
      setOtpSent(true);
      const devNote = res.devOtp ? ` (Test OTP: ${res.devOtp})` : '';
      setInfo(`${res.message}${devNote}`);
      toast(res.message);
      return true;
    } catch (err) {
      setError(err.message || 'Could not send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyRegisterOtp() {
    setError('');
    setInfo('');
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Enter the 6-digit OTP code.');
      return;
    }
    const target = getRegisterTarget(verifyMethod);
    setLoading(true);
    try {
      await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          channel: verifyMethod,
          target,
          code: otpCode.trim(),
          purpose: 'register',
        }),
      });
      setOtpVerified(true);
      setInfo('Verification successful! Click Create Account to finish.');
      toast('Verified!');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendLoginOtp() {
    setError('');
    setInfo('');
    const target = loginChannel === 'email' ? identifier.trim().toLowerCase() : cleanPhoneInput(identifier);
    if (loginChannel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Enter a valid email address.');
      return;
    }
    if ((loginChannel === 'phone' || loginChannel === 'whatsapp') && !/^\d{10}$/.test(target)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ channel: loginChannel, target, purpose: 'login' }),
      });
      setLoginOtpSent(true);
      const devNote = res.devOtp ? ` (Test OTP: ${res.devOtp})` : '';
      setInfo(`${res.message}${devNote}`);
      toast(res.message);
    } catch (err) {
      setError(err.message || 'Could not send login OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (tab === 'register') {
      const cleanPhone = cleanPhoneInput(phone);
      if (!/^\d{10}$/.test(cleanPhone)) {
        setError('Enter a valid 10-digit mobile number.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreedTerms) {
        setError('Please accept the Terms & Conditions and Privacy Policy.');
        return;
      }
      if (!otpVerified) {
        if (!otpSent) {
          await handleSendRegisterOtp();
        } else {
          setError('Please enter and verify the 6-digit OTP first.');
        }
        return;
      }

      setLoading(true);
      try {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            phone: cleanPhone,
            email: email.trim().toLowerCase(),
            password,
            referralCode: referralCode.trim().toUpperCase() || undefined,
            verificationChannel: verifyMethod,
          }),
        });
        setToken(data.token);
        setUser(data.user);
        toast(`Welcome, ${(data.user.name || 'Member').split(' ')[0]}`);
        navigate('/member');
      } catch (err) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login flow
    if (loginMode === 'otp') {
      if (!loginOtpSent) {
        await handleSendLoginOtp();
        return;
      }
      const target = loginChannel === 'email' ? identifier.trim().toLowerCase() : cleanPhoneInput(identifier);
      setLoading(true);
      try {
        const data = await apiFetch('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({
            channel: loginChannel,
            target,
            code: loginOtp.trim(),
            purpose: 'login',
          }),
        });
        setToken(data.token);
        setUser(data.user);
        toast(`Welcome back, ${(data.user.name || 'Member').split(' ')[0]}`);
        navigate('/member');
      } catch (err) {
        setError(err.message || 'Invalid OTP');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      setToken(data.token);
      setUser(data.user);
      toast(`Welcome back, ${(data.user.name || 'Member').split(' ')[0]}`);
      navigate('/member');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-split-wrap">
      <div className="auth-split-card">
        <aside className="auth-split-brand">
          <div>
            <div className="auth-brand-title">MHA</div>
            <div className="auth-brand-sub">ONLINE SHOPPING</div>
          </div>

          <div className="auth-brand-visual">
            <img src={siteImg('Electronics-Appliance.webp')} alt="MHA Home & Electronics" />
          </div>

          <div className="auth-brand-copy">
            <h2>Upgrade your home.<br />Elevate your lifestyle.</h2>
            <p>Bringing quality to better life.</p>
          </div>

          <div className="auth-brand-badges">
            <span>🛡️ Secure Shopping</span>
            <span>📦 Quality Products</span>
          </div>
        </aside>

        <form className="auth-split-form" onSubmit={handleSubmit}>
          <div className="auth-form-top">
            <small>{tab === 'register' ? 'NEW CUSTOMER' : 'WELCOME BACK'}</small>
            <button type="button" className="auth-home-link" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          </div>

          <h1>{tab === 'register' ? 'Create your account' : 'Sign in to your account'}</h1>
          <p className="auth-form-subtitle">
            {tab === 'register'
              ? 'Start your shopping journey with MHA.'
              : 'Access your orders, referral network, and rewards.'}
          </p>

          {tab === 'register' ? (
            <>
              <div className="auth-row-2">
                <label>
                  Full Name
                  <input
                    className="auth-pill-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Full name"
                  />
                </label>
                <label>
                  Mobile Number
                  <input
                    className="auth-pill-input"
                    type="tel"
                    value={phone}
                    disabled={otpVerified && verifyMethod !== 'email'}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (verifyMethod !== 'email') {
                        setOtpSent(false);
                        setOtpVerified(false);
                      }
                    }}
                    required
                    placeholder="+91 Mobile number"
                  />
                </label>
              </div>

              <label>
                Email Address
                <input
                  className="auth-pill-input"
                  type="email"
                  value={email}
                  disabled={otpVerified && verifyMethod === 'email'}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (verifyMethod === 'email') {
                      setOtpSent(false);
                      setOtpVerified(false);
                    }
                  }}
                  required
                  placeholder="Enter email address"
                />
              </label>

              <div className="auth-row-2">
                <label>
                  Password
                  <input
                    className="auth-pill-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Password"
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    className="auth-pill-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm password"
                  />
                </label>
              </div>

              <div className="auth-referral-box">
                <div className="auth-referral-head">
                  <span>🎁 Referral Code</span>
                  <small>Optional</small>
                </div>
                <input
                  className="auth-pill-input"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                />
                {referralStatus?.valid && (
                  <span className="auth-ref-ok">✓ Connected to {referralStatus.referrerName} ({referralStatus.referralCode})</span>
                )}
                {referralStatus && !referralStatus.valid && referralCode.trim().length >= 4 && (
                  <span className="auth-ref-warn">Referral code not found (leave blank if none)</span>
                )}
              </div>

              <div className="auth-verify-section">
                <div className="auth-verify-head">
                  <span>Choose verification method</span>
                  {otpVerified ? (
                    <span className="auth-verified-pill">✓ Verified</span>
                  ) : (
                    <button
                      type="button"
                      className="auth-send-otp-btn"
                      disabled={loading}
                      onClick={handleSendRegisterOtp}
                    >
                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>

                <div className="auth-method-grid">
                  {VERIFY_METHODS.map((m) => {
                    const active = verifyMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={otpVerified}
                        className={`auth-method-card ${active ? 'active' : ''}`}
                        onClick={() => {
                          setVerifyMethod(m.id);
                          setOtpSent(false);
                          setOtpCode('');
                          setError('');
                          setInfo('');
                        }}
                      >
                        <span className="auth-method-icon">{m.icon}</span>
                        <b>{m.label}</b>
                        <span className="auth-method-dot">{active ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>

                {otpSent && !otpVerified && (
                  <div className="auth-otp-inline">
                    <input
                      className="auth-pill-input"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      placeholder={`Enter 6-digit ${verifyMethod === 'email' ? 'Email' : verifyMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP`}
                    />
                    <button
                      type="button"
                      className="auth-verify-btn"
                      disabled={loading}
                      onClick={handleVerifyRegisterOtp}
                    >
                      Verify OTP
                    </button>
                  </div>
                )}
              </div>

              <label className="auth-terms-row">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                />
                <span>I agree to the Terms &amp; Conditions and Privacy Policy.</span>
              </label>

              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading ? 'Please wait…' : otpVerified ? 'Create Account →' : otpSent ? 'Verify OTP above to Continue' : 'Send OTP & Create Account →'}
              </button>

              <p className="auth-switch-text">
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab('login'); setError(''); setInfo(''); }}>
                  Sign In
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-login-tabs">
                <button
                  type="button"
                  className={loginMode === 'password' ? 'active' : ''}
                  onClick={() => { setLoginMode('password'); setError(''); setInfo(''); }}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  className={loginMode === 'otp' ? 'active' : ''}
                  onClick={() => { setLoginMode('otp'); setLoginOtpSent(false); setError(''); setInfo(''); }}
                >
                  Login via OTP
                </button>
              </div>

              {loginMode === 'otp' && (
                <div className="auth-method-grid" style={{ marginBottom: '12px' }}>
                  {VERIFY_METHODS.map((m) => {
                    const active = loginChannel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`auth-method-card ${active ? 'active' : ''}`}
                        onClick={() => { setLoginChannel(m.id); setLoginOtpSent(false); setError(''); setInfo(''); }}
                      >
                        <span className="auth-method-icon">{m.icon}</span>
                        <b>{m.label}</b>
                        <span className="auth-method-dot">{active ? '✓' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <label>
                {loginMode === 'otp' && loginChannel !== 'email' ? '10-Digit Mobile Number' : 'Email or Mobile Number'}
                <input
                  className="auth-pill-input"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setLoginOtpSent(false); }}
                  required
                  placeholder={loginMode === 'otp' && loginChannel !== 'email' ? '+91 Mobile number' : 'you@gmail.com or 9876543210'}
                />
              </label>

              {loginMode === 'password' ? (
                <label>
                  Password
                  <input
                    className="auth-pill-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </label>
              ) : (
                loginOtpSent && (
                  <label>
                    6-Digit OTP
                    <input
                      className="auth-pill-input"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                    />
                  </label>
                )
              )}

              <button className="auth-submit-btn" type="submit" disabled={loading}>
                {loading
                  ? 'Please wait…'
                  : loginMode === 'otp' && !loginOtpSent
                    ? `Send ${loginChannel === 'email' ? 'Email' : loginChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP →`
                    : 'Sign In →'}
              </button>

              <p className="auth-switch-text">
                New to MHA?{' '}
                <button type="button" onClick={() => { setTab('register'); setError(''); setInfo(''); }}>
                  Create Account
                </button>
              </p>
            </>
          )}

          {info && <p className="auth-info-msg">{info}</p>}
          {error && <p className="auth-error-msg">{error}</p>}
        </form>
      </div>
    </section>
  );
}
