import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './AuthPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLang();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    document.body.classList.add('is_dark');
    if (!token) {
      toast.error(t.invalidResetLink || 'Invalid reset link');
      navigate('/login');
    }
    return () => document.body.classList.remove('is_dark');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsNoMatch || 'Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error(t.passwordMinLength || 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/reset-password/${token}`, null, {
        params: { new_password: formData.password }
      });
      if (response.data.ok) {
        setSuccess(true);
        toast.success(t.passwordResetSuccess || 'Password reset successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t.failedResetPassword || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <header className="auth-header">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🦄</span> Uniswap V4
          </Link>
          <button data-testid="reset-language-toggle" className="auth-lang-toggle" onClick={toggleLang}>
            <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
            <span className="lang-sep">|</span>
            <span className={lang === 'it' ? 'lang-active' : ''}>IT</span>
          </button>
        </header>
        <div className="auth-main">
          <div className="auth-card">
            <div className="auth-success">
              <div className="success-icon">✓</div>
              <h2>{t.resetPasswordComplete || 'Password Reset Complete'}</h2>
              <p>{t.resetPasswordCompleteDesc || 'You can now log in with your new password.'}</p>
              <Link to="/login">
                <button className="auth-submit">{t.signIn || 'Login'}</button>
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
        <Link to="/" className="back-link">
          ← {t.backToHome || 'Back to Home'}
        </Link>
        <button data-testid="reset-language-toggle" className="auth-lang-toggle" onClick={toggleLang}>
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

          <h2 className="auth-title">{t.resetPasswordTitle || 'Reset Your Password'}</h2>
          <p className="auth-subtitle">{t.resetPasswordDesc || 'Create a new secure password for your account'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="password">{t.newPassword || 'New Password'}</label>
              <div className="input-wrapper">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder={t.atLeast8Chars || 'At least 8 characters'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8} data-testid="reset-password-input" />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">{t.confirmPassword || 'Confirm Password'}</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder={t.confirmYourPassword || 'Confirm your password'} value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required data-testid="reset-confirm-password-input" />
            </div>

            <button type="submit" className="auth-submit" disabled={loading} data-testid="reset-submit-btn">
              {loading ? (t.resettingPassword || 'Resetting...') : (t.resetPasswordBtn || 'Reset Password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
