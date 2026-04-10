import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const gateText = {
  it: {
    title: 'Accesso Riservato',
    subtitle: 'Inserisci il codice di accesso per continuare',
    placeholder: 'Inserisci codice',
    button: 'Continua',
    loading: 'Verifica...',
    error: 'Codice di accesso non valido',
    footer: 'Zenthos Piattaforma Sicura',
  },
  en: {
    title: 'Restricted Access',
    subtitle: 'Enter your access code to continue',
    placeholder: 'Enter code',
    button: 'Continue',
    loading: 'Verifying...',
    error: 'Invalid access code',
    footer: 'Zenthos Secure Platform',
  },
};

const AccessGate = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState('it');

  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('z_access') === '1') {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  const t = gateText[lang];

  const toggleLang = () => {
    const next = lang === 'it' ? 'en' : 'it';
    setLang(next);
    setError('');
  };

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
      setError(t.error);
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
      {/* Language toggle */}
      <div style={{
        position: 'absolute', top: 20, right: 24,
        display: 'flex', gap: 4,
      }}>
        <button
          onClick={toggleLang}
          data-testid="gate-lang-toggle"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px',
            color: '#94a3b8', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ color: lang === 'it' ? '#4a9eff' : '#64748b' }}>IT</span>
          <span style={{ color: '#334155', margin: '0 4px' }}>|</span>
          <span style={{ color: lang === 'en' ? '#4a9eff' : '#64748b' }}>EN</span>
        </button>
      </div>

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
          {t.title}
        </h1>
        <p style={{
          color: '#64748b', fontSize: 13, margin: '0 0 28px',
          lineHeight: 1.5,
        }}>
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.placeholder}
              autoFocus
              autoComplete="off"
              data-testid="access-code-input"
              style={{
                width: '100%', padding: '12px 44px 12px 16px',
                background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#e2e8f0', fontSize: 15,
                textAlign: 'center', letterSpacing: '0.15em', fontWeight: 600,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4a9eff'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              data-testid="toggle-code-visibility"
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              }}
            >
              {showCode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>
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
            {loading ? t.loading : t.button}
          </button>
        </form>

        <p style={{
          color: '#334155', fontSize: 11, marginTop: 32,
        }}>
          {t.footer}
        </p>
      </div>
    </div>
  );
};

export default AccessGate;
