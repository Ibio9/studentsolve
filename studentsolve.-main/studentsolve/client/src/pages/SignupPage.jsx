import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { sendOtp, verifyOtp } from '../services/api.js';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  async function handleRequestCode(e) {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError('');
    setLoading(true);
    try {
      await sendOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    const otpValue = code.join('');
    if (otpValue.length !== 6) return setError('Please enter the full 6-digit code.');
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otpValue);
      await signup(email, password, name);
      navigate('/onboarding');
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'This email is already registered. Try logging in.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await sendOtp(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  function handleCodeChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleCodeKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleCodePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)' }}>
            StudentSolve
          </Link>

          {step === 1 ? (
            <>
              <h1 style={{ fontSize: '1.6rem', marginTop: 22, marginBottom: 8 }}>Create your account</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start studying smarter today</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '1.6rem', marginTop: 22, marginBottom: 8 }}>Check your email</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--text-secondary)' }}>{email}</strong>
              </p>
            </>
          )}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRequestCode}>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="First name"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      padding: '2px 4px',
                      transition: 'color var(--transition)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 8 }}
              >
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <div style={{ marginBottom: 28 }}>
                <label className="form-label" style={{ marginBottom: 16, display: 'block' }}>
                  Verification code
                </label>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }} onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      autoFocus={i === 0}
                      style={{
                        width: 48,
                        height: 56,
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius)',
                        border: `1px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color var(--transition)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || code.join('').length !== 6}
                style={{ width: '100%', justifyContent: 'center', padding: 13 }}
              >
                {loading ? 'Verifying…' : 'Verify and create account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleResend}
                  disabled={resending}
                  style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}
                >
                  {resending ? 'Sending…' : "Didn't get it? Resend code"}
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { setStep(1); setCode(['', '', '', '', '', '']); setError(''); }}
                  style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}
                >
                  ← Change email
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}