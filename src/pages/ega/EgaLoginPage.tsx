import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { adminAuthService } from '../../services/adminAuthService';

export const EgaLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, user, isAuthenticated } = useAuth();

  
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/ega" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedPass) {
      setError("Iltimos, Admin Email va Parolni to'liq to'ldiring.");
      return;
    }

    try {
      const adminRes = await adminAuthService.createAdminSession(trimmedEmail, trimmedPass);
      if (!adminRes.success) {
        setError(adminRes.error || "Noto'g'ri Admin Email yoki Parol kiritildi.");
        return;
      }

      await login({
        email: trimmedEmail,
        password: trimmedPass,
        role: 'admin'
      });
      
      navigate('/ega', { replace: true });
    } catch (err: any) {
      const msg = err?.message || "Noto'g'ri Admin Email yoki Parol kiritildi.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0B132B] border border-blue-900/60 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-0.5 mx-auto shadow-lg shadow-blue-600/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-white">NEXT OLYMP</h1>
            <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
              EGA • Admin Control Center
            </p>
          </div>
          <p className="text-xs text-slate-400">Tizim administratorlari uchun maxsus himoyalangan portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-xs font-bold uppercase tracking-wider text-cyan-300">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-cyan-400/80">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="admin@ibnsino.uz"
                required
                autoComplete="email"
                style={{
                  colorScheme: 'dark',
                  WebkitBoxShadow: '0 0 0 1000px #060D1F inset',
                  WebkitTextFillColor: '#ffffff'
                }}
                className="dark-autofill w-full rounded-xl border border-blue-800/80 bg-[#060D1F] text-white text-sm pl-10 pr-4 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-medium"
              />
            </div>
          </div>

          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="admin-master-key" className="block text-xs font-bold uppercase tracking-wider text-cyan-300">
                Parol / Master Key
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-cyan-400/80">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-master-key"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Master Key kiritish"
                required
                autoComplete="current-password"
                style={{
                  colorScheme: 'dark',
                  WebkitBoxShadow: '0 0 0 1000px #060D1F inset',
                  WebkitTextFillColor: '#ffffff'
                }}
                className="dark-autofill w-full rounded-xl border border-blue-800/80 bg-[#060D1F] text-white text-sm pl-10 pr-10 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-medium font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer"
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200 font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 shadow-lg shadow-blue-600/30 cursor-pointer"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Admin Panelga Kirish
          </Button>
        </form>

        <div className="text-center pt-3 border-t border-blue-900/60 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <KeyRound className="w-3 h-3 text-cyan-400" />
            <span>Xavfsiz Master Key avtorizatsiyasi</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase font-mono block">
            Rate Limiting Himoyasi Faol • Har bir urinish qayd etiladi
          </span>
        </div>
      </div>
    </div>
  );
};
