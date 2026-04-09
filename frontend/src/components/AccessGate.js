import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const AccessGate = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('z_access') === '1') {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/verify-access`, { code: code.trim() });
      if (res.data.ok) {
        sessionStorage.setItem('z_access', '1');
        setUnlocked(true);
      }
    } catch (err) {
      setError('Invalid access code');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;
  if (unlocked) return children;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#0a0e1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px' }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #1a2540 0%, #0d1526 100%)',
          borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h1 style={{
          color: '#e2e8f0', fontSize: 20, fontWeight: 600,
          margin: '0 0 6px', letterSpacing: '-0.02em',
        }}>
          Restricted Access
        </h1>
        <p style={{
          color: '#64748b', fontSize: 13, margin: '0 0 28px',
          lineHeight: 1.5,
        }}>
          Enter your access code to continue
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            autoFocus
            autoComplete="off"
            data-testid="access-code-input"
            style={{
              width: '100%', padding: '12px 16px',
              background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#e2e8f0', fontSize: 15,
              textAlign: 'center', letterSpacing: '0.15em', fontWeight: 600,
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a9eff'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }} data-testid="access-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            data-testid="access-submit-btn"
            style={{
              width: '100%', padding: '12px 0', marginTop: 16,
              background: loading ? '#1e3a5f' : '#1d4ed8',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: (!code.trim() || loading) ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>

        <p style={{
          color: '#334155', fontSize: 11, marginTop: 32,
        }}>
          Zenthos Secure Platform
        </p>
      </div>
    </div>
  );
};

export default AccessGate;
