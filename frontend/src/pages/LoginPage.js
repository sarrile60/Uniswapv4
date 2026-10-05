import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock } from 'lucide-react';
import './AuthPages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [lockInfo, setLockInfo] = useState(null);

  useEffect(() => {
    document.body.classList.add('is_dark');
    const reason = sessionStorage.getItem('account_locked_reason');
    if (reason !== null) {
      sessionStorage.removeItem('account_locked_reason');
      setLockInfo({ reason });
    }
    return () => document.body.classList.remove('is_dark');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (lockInfo) setLockInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLockInfo(null);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        if (result.user.role === 'admin' || result.user.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/wallet');
        }
      } else {
        toast.error(result.error?.message || t.invalidCredentials);
      }
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail?.code === 'account_locked') {
        setLockInfo({ reason: detail.reason || '' });
      } else {
        toast.error(t.invalidCredentials);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="logo-link">
          <span className="logo-icon">🦄</span> Uniswap V4
        </Link>
        <button data-testid="login-language-toggle" className="auth-lang-toggle" onClick={toggleLang}>
          <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
          <span className="lang-sep">|</span>
          <span className={lang === 'it' ? 'lang-active' : ''}>IT</span>
        </button>
      </header>

      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-lock-icon">
            <svg width="24" height="24" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 11.76C7.68 11.76 7.41 12.02 7.41 12.34C7.41 12.67 7.68 12.93 8 12.93C8.32 12.93 8.59 12.67 8.59 12.34C8.59 12.02 8.32 11.76 8 11.76Z" fill="white"/>
              <path d="M11.52 8.24H4.22C2.1 8.24 0.38 9.96 0.38 12.08C0.38 15.7 2.78 19.06 6.32 19.82C11.25 20.88 15.62 17.09 15.62 12.34C15.62 10.08 13.78 8.24 11.52 8.24ZM8.59 14V17.07C8.59 17.39 8.32 17.66 8 17.66C7.68 17.66 7.41 17.39 7.41 17.07V14C6.73 13.75 6.24 13.11 6.24 12.34C6.24 11.37 7.03 10.59 8 10.59C8.97 10.59 9.76 11.37 9.76 12.34C9.76 13.11 9.27 13.75 8.59 14Z" fill="white"/>
              <path d="M8 0C5.08 0 2.73 2.36 2.73 5.27V7.32C3.2 7.17 3.7 7.07 4.22 7.07H5.07V5.27C5.07 3.66 6.38 2.34 8 2.34C9.62 2.34 10.93 3.66 10.93 5.27V7.07H11.52C12.14 7.07 12.72 7.2 13.27 7.39V5.27C13.27 2.36 10.91 0 8 0Z" fill="white"/>
            </svg>
          </div>

          <div className="auth-url-bar">
            <span className="url-https">https://</span>
            <span className="url-domain">accounts.uniswapv4.com/login</span>
          </div>

          <h2 className="auth-title">{t.loginTitle || 'Login To Uniswap V4'}</h2>
          <p className="auth-subtitle">{t.loginSubtitle || 'Welcome back! Log in now to start trading'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">{t.loginEmail || 'Email'}</label>
              <input
                id="email" name="email" type="email"
                placeholder="Please fill in the email form."
                value={formData.email} onChange={handleChange}
                required autoComplete="email"
                data-testid="login-email-input"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">{t.loginPassword || 'Password'}</label>
              <div className="input-wrapper">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Please enter a password."
                  value={formData.password} onChange={handleChange}
                  required autoComplete="current-password"
                  data-testid="login-password-input"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-check-row">
              <div className="check-left">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember Me</label>
              </div>
              <Link to="/forgot-password" className="forgot-link" data-testid="forgot-password-link">
                {t.forgotPassword || 'Forgot Password?'}
              </Link>
            </div>

            <button type="submit" className="auth-submit" disabled={loading} data-testid="login-submit-button">
              {loading ? (t.loggingIn || 'Logging in...') : (t.loginButton || 'Login')}
            </button>
          </form>

          {lockInfo && (
            <div className="auth-lock-alert" role="alert" data-testid="account-locked-alert">
              <Lock className="lock-icon" size={20} />
              <div>
                <p className="lock-title" data-testid="account-locked-title">{t.accountLockedTitle || 'Account Locked'}</p>
                <p className="lock-reason" data-testid="account-locked-reason">{lockInfo.reason || t.accountLockedDefault || 'Your account has been locked.'}</p>
              </div>
            </div>
          )}

          <div className="auth-bottom">
            {t.dontHaveAccount || "Not a member?"}
            <Link to="/register">{t.signUp || 'Register'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
