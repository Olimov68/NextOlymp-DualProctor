import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const user = JSON.parse(localStorage.getItem('next_olymp_user') || '{}');
      if (user.role === 'admin') navigate('/ega');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || "Login yoki parol xato! Iltimos, ma'lumotlarni qayta tekshiring.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center font-bold shadow-sm">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">{t('auth.loginTitle') || 'Tizimga kirish'}</h2>
          <p className="text-xs text-zinc-400">Profil va olimpiadalarga kirish uchun hisobingiz</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.emailLabel') || 'Elektron pochta'}
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label={t('auth.passwordLabel') || 'Parol'}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" isLoading={isLoading} className="w-full font-bold">
            {t('auth.loginBtn') || 'Kirish'}
          </Button>
        </form>

        <div className="text-center text-xs text-zinc-400 space-y-2 pt-2 border-t border-white/10">
          <p>
            {t('auth.noAccount') || "Akkauntingiz yo'qmi?"}{' '}
            <Link to="/auth/register" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
              {t('auth.registerBtn') || "Ro'yxatdan o'ting"}
            </Link>
          </p>
          <p>
            <Link to="/auth/forgot-password" className="text-zinc-500 hover:text-zinc-300 hover:underline transition-colors">
              {t('auth.forgotPassword') || 'Parolni unutdingizmi?'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
