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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-[#0B1120]">
      <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center font-bold">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-[#F1F5F9] tracking-tight">{t('auth.loginTitle') || 'Tizimga kirish'}</h2>
          <p className="text-xs text-[#94A3B8]">Profil va olimpiadalarga kirish uchun hisobingiz</p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#EF4444]">
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

        <div className="text-center text-xs text-[#94A3B8] space-y-2 pt-2 border-t border-[#1E293B]">
          <p>
            {t('auth.noAccount') || "Akkauntingiz yo'qmi?"}{' '}
            <Link to="/auth/register" className="font-bold text-[#3B82F6] hover:underline">
              {t('auth.registerBtn') || "Ro'yxatdan o'ting"}
            </Link>
          </p>
          <p>
            <Link to="/auth/forgot-password" className="text-[#64748B] hover:text-[#94A3B8] hover:underline">
              {t('auth.forgotPassword') || 'Parolni unutdingizmi?'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
