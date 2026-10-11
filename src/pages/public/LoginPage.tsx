import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck, Sparkles, Award } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'admin') navigate('/ega');
      else if (currentUser?.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || "Login yoki parol xato! Iltimos, ma'lumotlarni qayta tekshiring.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#070b14] text-slate-100 font-sans">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl bg-[#0d1832]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Left Side: Educational Brand Showcase (Desktop Split) */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-emerald-950/40 via-[#091124] to-[#070b14] border-r border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                Abu Ali ibn Sino Ta’lim Tizimi
              </span>
              <h2 className="text-2xl font-black text-white leading-tight">
                Ilm yo‘lida bir qadam oldinda bo‘ling
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Shaffof AI proktoring, adolatli reyting va davlat hamda xalqaro standartlarga mos rasmiy elektron sertifikatlar.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Bepul akademik olimpiadalar</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <Award className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>QR-kod bilan verifikatsiyalangan sertifikatlar</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Sun’iy intellekt asosida xolis baholash</span>
            </div>
          </div>
        </div>

        {/* Right Side: Sleek Login Form */}
        <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-center">
          <div className="text-center sm:text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold sm:hidden mx-auto">
              <LogIn className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {t('auth.loginTitle') || 'Tizimga kirish'}
            </h1>
            <p className="text-xs text-slate-400">
              Profil va olimpiadalarga kirish uchun elektron pochta va parolingizni kiriting
            </p>
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
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label={t('auth.passwordLabel') || 'Parol'}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              variant="primary"
              className="w-full font-extrabold py-3 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {t('auth.loginBtn') || 'Kirish'}
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 space-y-2 pt-3 border-t border-white/10">
            <p>
              {t('auth.noAccount') || "Akkauntingiz yo‘qmi?"}{' '}
              <Link to="/auth/register" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                {t('auth.registerBtn') || "Ro‘yxatdan o‘ting"}
              </Link>
            </p>
            <p>
              <Link to="/auth/forgot-password" className="text-slate-500 hover:text-slate-300 hover:underline transition-colors">
                {t('auth.forgotPassword') || 'Parolni unutdingizmi?'}
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
