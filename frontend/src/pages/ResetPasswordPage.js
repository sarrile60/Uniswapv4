import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock } from 'lucide-react';
import axios from 'axios';
import './AuthPages.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useLang();

  // Support both ?email=xxx (new) and ?token=xxx (legacy emails already sent)
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    document.body.classList.add('is_dark');
    if (!email && !token) {
      toast.error(t.invalidResetLink || 'Invalid reset link');
      navigate('/login');
    }
    return () => document.body.classList.remove('is_dark');
  }, [email, token, navigate]);

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
      let response;
      if (email) {
        // New email-based flow — no token needed
        response = await axios.post(`${API}/auth/reset-password`, {
          email: email,
          new_password: formData.password,
        });
      } else {
        // Legacy token-based flow — for old emails already sent
        response = await axios.post(`${API}/auth/reset-password/${token}`, null, {
          params: { new_password: formData.password }
        });
      }
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
            <Lock size={24} color="white" />
          </div>

          <h2 className="auth-title">{t.resetPasswordTitle || 'Reset Your Password'}</h2>
          <p className="auth-subtitle">{t.resetPasswordDesc || 'Create a new secure password for your account'}</p>
          {email && (
            <p style={{fontSize:12,color:'#9ca3b4',textAlign:'center',marginBottom:8}}>{email}</p>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="password">{t.newPassword || 'New Password'}</label>
              <div className="input-wrapper">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.atLeast8Chars || 'At least 8 characters'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required minLength={8}
                  data-testid="reset-password-input"
                />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">{t.confirmPassword || 'Confirm Password'}</label>
              <input
                id="confirmPassword" name="confirmPassword"
                type="password"
                placeholder={t.confirmYourPassword || 'Confirm your password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                data-testid="reset-confirm-password-input"
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              data-testid="reset-submit-btn"
            >
              {loading ? (t.resettingPassword || 'Resetting...') : (t.resetPasswordBtn || 'Reset Password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
