import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { DateInput } from '@/components/DateInput';
import './AuthPages.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', date_of_birth: '',
  });

  useEffect(() => {
    document.body.classList.add('is_dark');
    return () => document.body.classList.remove('is_dark');
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsMustMatch || 'Passwords must match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error(t.passwordMin8 || 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await register({
        email: formData.email, username: formData.username,
        password: formData.password, first_name: formData.first_name,
        last_name: formData.last_name, date_of_birth: formData.date_of_birth,
      });
      if (result.success) {
        toast.success(t.accountCreated || 'Account created!');
        navigate('/wallet');
      } else {
        toast.error(result.error?.message || t.registrationFailed || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t.registrationFailedRetry || 'Registration failed. Please try again.');
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
        <button data-testid="register-language-toggle" className="auth-lang-toggle" onClick={toggleLang}>
          <span className={lang === 'en' ? 'lang-active' : ''}>EN</span>
          <span className="lang-sep">|</span>
          <span className={lang === 'it' ? 'lang-active' : ''}>IT</span>
        </button>
      </header>

      <div className="auth-main">
        <div className="auth-card auth-card-wide">
          <div className="auth-lock-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7M12 14V16M7.2 21H16.8C17.9201 21 18.4802 21 18.908 20.782C19.2843 20.5903 19.5903 20.2843 19.782 19.908C20 19.4802 20 18.9201 20 17.8V14.2C20 13.0799 20 12.5198 19.782 12.092C19.5903 11.7157 19.2843 11.4097 18.908 11.218C18.4802 11 17.9201 11 16.8 11H7.2C6.07989 11 5.51984 11 5.09202 11.218C4.71569 11.4097 4.40973 11.7157 4.21799 12.092C4 12.5198 4 13.0799 4 14.2V17.8C4 18.9201 4 19.4802 4.21799 19.908C4.40973 20.2843 4.71569 20.5903 5.09202 20.782C5.51984 21 6.0799 21 7.2 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="auth-title">{t.registerTitle || 'Register To Uniswap V4'}</h2>
          <p className="auth-subtitle">{t.registerSubtitle || 'Create your account and start trading'}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-row">
              <div className="auth-field">
                <label htmlFor="first_name">{t.firstName || 'First Name'}</label>
                <input id="first_name" name="first_name" placeholder="John" value={formData.first_name} onChange={handleChange} required data-testid="register-first-name-input" />
              </div>
              <div className="auth-field">
                <label htmlFor="last_name">{t.lastName || 'Last Name'}</label>
                <input id="last_name" name="last_name" placeholder="Doe" value={formData.last_name} onChange={handleChange} required data-testid="register-last-name-input" />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">{t.email || 'Email'}</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required data-testid="register-email-input" />
            </div>

            <div className="auth-field">
              <label htmlFor="username">{t.username || 'Username'}</label>
              <input id="username" name="username" placeholder="johndoe" value={formData.username} onChange={handleChange} required data-testid="register-username-input" />
            </div>

            <div className="auth-field">
              <label htmlFor="date_of_birth">{t.dateOfBirth || 'Date of Birth'}</label>
              <DateInput id="date_of_birth" value={formData.date_of_birth} onChange={(val) => setFormData(prev => ({...prev, date_of_birth: val}))} required data-testid="register-dob-input" />
            </div>

            <div className="auth-field">
              <label htmlFor="password">{t.password || 'Password'}</label>
              <div className="input-wrapper">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder={t.atLeast8Chars || 'At least 8 characters'} value={formData.password} onChange={handleChange} required minLength={8} data-testid="register-password-input" />
                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">{t.confirmPassword || 'Confirm Password'}</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder={t.confirmYourPassword || 'Confirm your password'} value={formData.confirmPassword} onChange={handleChange} required data-testid="register-confirm-password-input" />
            </div>

            <button type="submit" className="auth-submit" disabled={loading} data-testid="register-submit-button">
              {loading ? (t.creatingAccount || 'Creating Account...') : (t.registerButton || 'Register')}
            </button>
          </form>

          <p className="auth-terms">{t.termsAgreement || 'By creating an account, you agree to our Terms of Service and Privacy Policy.'}</p>

          <div className="auth-bottom">
            {t.alreadyHaveAccount || 'Already have an account?'}
            <Link to="/login">{t.signIn || 'Login'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
