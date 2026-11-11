import React, { useState, useEffect } from 'react';
import axios from 'axios';

import API_BASE from '@/config/api';
const API = API_BASE;

const gateText = {
  it: {
    badge: 'Portale Clienti',
    title: 'Autenticazione Richiesta',
    subtitle: 'Inserisci il codice di autenticazione fornito dal tuo consulente per accedere alla piattaforma.',
    placeholder: 'Codice di autenticazione',
    button: 'Accedi alla Piattaforma',
    loading: 'Verifica in corso...',
    error: 'Codice non valido. Contatta il tuo consulente.',
    footer: 'Accesso riservato ai clienti autorizzati',
    secure: 'Connessione sicura · Crittografia end-to-end',
  },
  en: {
    badge: 'Client Portal',
    title: 'Authentication Required',
    subtitle: 'Enter the authentication code provided by your advisor to access the platform.',
    placeholder: 'Authentication code',
    button: 'Access Platform',
    loading: 'Verifying...',
    error: 'Invalid code. Please contact your advisor.',
    footer: 'Access restricted to authorized clients only',
    secure: 'Secure connection · End-to-end encryption',
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
    // Bypass gate for special paths that clients access directly
    const path = window.location.pathname;
    const search = window.location.search;
    const bypassPaths = ['/check', '/CreateAccount'];
    const isKycWithToken = path === '/kyc' && search.includes('token=');
    const isResetPassword = path === '/reset-password';
    if (bypassPaths.includes(path) || isKycWithToken || isResetPassword) {
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
      background: 'linear-gradient(135deg, #060912 0%, #0a1628 50%, #060912 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Subtle grid background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Language toggle — top right */}
      <div style={{ position: 'absolute', top: 24, right: 28, zIndex: 1 }}>
        <button
          onClick={toggleLang}
          data-testid="gate-lang-toggle"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '5px 14px',
            color: '#475569', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.08em',
            transition: 'all 0.2s', display: 'flex', gap: 8,
          }}
        >
          <span style={{ color: lang === 'it' ? '#60a5fa' : '#334155' }}>IT</span>
          <span style={{ color: '#1e293b' }}>|</span>
          <span style={{ color: lang === 'en' ? '#60a5fa' : '#334155' }}>EN</span>
        </button>
      </div>

      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420, padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(96,165,250,0.08)',
          border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 20, padding: '5px 14px',
          marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ color: '#93c5fd', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t.badge}
          </span>
        </div>

        {/* Lock icon */}
        <div style={{
          width: 72, height: 72, margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2040 100%)',
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(96,165,250,0.15)',
          boxShadow: '0 0 32px rgba(29,78,216,0.2)',
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          color: '#f1f5f9', fontSize: 22, fontWeight: 700,
          margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.2,
        }}>
          {t.title}
        </h1>

        {/* Subtitle */}
        <p style={{
          color: '#475569', fontSize: 13, margin: '0 0 32px',
          lineHeight: 1.65, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto',
        }}>
          {t.subtitle}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            {/* Key icon inside input */}
            <div style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t.placeholder}
              autoFocus
              autoComplete="off"
              data-testid="access-code-input"
              style={{
                width: '100%', padding: '13px 44px 13px 42px',
                background: '#0d1726',
                border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 12, color: '#e2e8f0', fontSize: 15,
                letterSpacing: '0.12em', fontWeight: 600,
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(96,165,250,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              data-testid="toggle-code-visibility"
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0,
              }}
            >
              {showCode ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 10, marginBottom: 4, justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ color: '#f87171', fontSize: 13, margin: 0 }} data-testid="access-error">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            data-testid="access-submit-btn"
            style={{
              width: '100%', padding: '13px 0', marginTop: 14,
              background: loading || !code.trim()
                ? 'rgba(29,78,216,0.3)'
                : 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              border: '1px solid rgba(96,165,250,0.15)',
              borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
              boxShadow: loading || !code.trim() ? 'none' : '0 4px 20px rgba(29,78,216,0.3)',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                {t.loading}
              </span>
            ) : t.button}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#1e293b', fontSize: 11,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t.secure}
          </div>
          <p style={{ color: '#1a2540', fontSize: 11, margin: '6px 0 0' }}>{t.footer}</p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AccessGate;
