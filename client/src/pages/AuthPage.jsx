import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function AuthPage({ onAuthSuccess, onBack }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="landing-bg" />
      <div className="landing-grid-overlay" />

      <div style={{
        position: 'relative', zIndex: 1,
        height: '100vh', width: '100vw',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <GlassCard style={{ padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  marginBottom: 16, transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                ← Back to Homepage
              </button>
            )}

            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)',
                borderRadius: 100, padding: '4px 12px',
              }}>
                <Sparkles size={11} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600, letterSpacing: '0.05em' }}>
                  DEVELOPER PLATFORM
                </span>
              </div>
              <h1 style={{
                fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
                fontFamily: 'Outfit,sans-serif', margin: '8px 0 4px 0'
              }}>
                Repo
                <span style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Graph</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                {isRegister ? 'Create an account to start analyzing' : 'Sign in to access your dashboard'}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.18)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 20,
                fontSize: 11.5, color: '#fca5a5'
              }}>
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%', height: 40, paddingLeft: 36, paddingRight: 12,
                      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)',
                      borderRadius: 10, color: 'white', fontSize: 13,
                      fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%', height: 40, paddingLeft: 36, paddingRight: 12,
                      background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)',
                      borderRadius: 10, color: 'white', fontSize: 13,
                      fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              {isRegister && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%', height: 40, paddingLeft: 36, paddingRight: 12,
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)',
                        borderRadius: 10, color: 'white', fontSize: 13,
                        fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{
                  height: 40, width: '100%', borderRadius: 10, marginTop: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {isLoading ? 'Processing...' : (
                  <>
                    {isRegister ? 'Create Account' : 'Sign In'}
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle mode links */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--color-secondary)', fontWeight: 600,
                  cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
