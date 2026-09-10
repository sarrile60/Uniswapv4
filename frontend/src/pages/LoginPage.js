import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [lockInfo, setLockInfo] = useState(null);

  useEffect(() => {
    const reason = sessionStorage.getItem('account_locked_reason');
    if (reason !== null) {
      sessionStorage.removeItem('account_locked_reason');
      setLockInfo({ reason });
    }
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Link>
        <button
          data-testid="login-language-toggle"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold rounded border border-gray-300 hover:bg-gray-100 transition text-gray-700"
          onClick={toggleLang}
        >
          <span className={lang === 'en' ? 'text-gray-900' : 'text-gray-400'}>EN</span>
          <span className="text-gray-300">|</span>
          <span className={lang === 'it' ? 'text-gray-900' : 'text-gray-400'}>IT</span>
        </button>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">Z</span>
            </div>
            <CardTitle className="text-2xl">{t.loginTitle}</CardTitle>
            <CardDescription>Zenthos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.loginEmail}</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required autoComplete="email" data-testid="login-email-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.loginPassword}</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} required autoComplete="current-password" data-testid="login-password-input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium" data-testid="forgot-password-link">{t.forgotPassword}</Link>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading} data-testid="login-submit-button">
                {loading ? t.loggingIn : t.loginButton}
              </Button>
            </form>
            {lockInfo && (
              <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 flex gap-3" data-testid="account-locked-alert">
                <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-red-800" data-testid="account-locked-title">{t.accountLockedTitle}</p>
                  <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap break-words" data-testid="account-locked-reason">{lockInfo.reason || t.accountLockedDefault}</p>
                </div>
              </div>
            )}
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">{t.dontHaveAccount} </span>
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">{t.signUp}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
