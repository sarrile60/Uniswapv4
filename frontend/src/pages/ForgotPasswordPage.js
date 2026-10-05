import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import axios from 'axios';
import './AuthPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const { t, lang, toggleLang } = useLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.body.classList.add('is_dark');
    return () => document.body.classList.remove('is_dark');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      toast.success(t.resetLinkSent || 'Reset link sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🦄</span> Uniswap V4
          </Link>
          <button data-testid="forgot-language-toggle" className="auth-lang-toggle" onClick={toggleLang}>
            <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
            <span className="lang-sep">|</span>
            <span className={lang === 'it' ? 'lang-active' : ''}>IT</span>
          </button>
        </header>
        <div className="auth-main">
          <div className="auth-card">
            <div className="auth-success">
              <div className="success-icon">✓</div>
              <h2>{t.resetLinkSent || 'Reset Link Sent'}</h2>
              <p>Check your email inbox for the reset link.</p>
              <Link to="/login">
                <button className="auth-submit" data-testid="forgot-back-to-login-btn">{t.backToLogin || 'Back to Login'}</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/login" className="back-link">
          ← {t.backToLogin || 'Back to Login'}
        </Link>
        <button data-testid="forgot-language-toggle-form" className="auth-lang-toggle" onClick={toggleLang}>
          <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
          <span className="lang-sep">|</span>
          <span className={lang === 'it' ? 'lang-active' : ''}>IT</span>
        </button>
      </header>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-lock-icon" style={{background: '#f7931a'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 7l-10 6L2 7"/>
            </svg>
          </div>

          <h2 className="auth-title">{t.forgotPasswordTitle || 'Forgot Password'}</h2>
          <p className="auth-subtitle">{t.forgotPasswordDesc || 'Enter your email and we\'ll send you a reset link'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">{t.loginEmail || 'Email'}</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" data-testid="forgot-email-input" />
            </div>

            <button type="submit" className="auth-submit" disabled={loading} data-testid="forgot-submit-btn">
              {loading ? (t.sendingResetLink || 'Sending...') : (t.sendResetLink || 'Send Reset Link')}
            </button>
          </form>

          <div className="auth-bottom">
            <Link to="/login">{t.backToLogin || 'Back to Login'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
