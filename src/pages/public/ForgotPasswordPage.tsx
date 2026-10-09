import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Elektron pochta manzilingizni kiriting.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(trimmedEmail);
      if (res.debugCode) {
        // In local development environment only, show debug code hint if returned
        setGeneratedCode(res.debugCode);
      }
      setEnteredCode(''); 
      setStep('verify');
    } catch (err: any) {
      setError(err?.message || "Bunday email bilan akkaunt topilmadi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!enteredCode.trim()) {
      setError("Tasdiqlash kodini kiriting.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Yangi parol kamida 8 ta belgidan iborat bo'lishi shart.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Kiritilgan parollar bir-biriga mos kelmadi.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), enteredCode.trim(), newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err?.message || "Parolni yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md bg-zinc-900/60 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kirishga qaytish
          </Link>
        </div>

        {step === 'email' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center font-bold">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Parolni Tiklash</h2>
              <p className="text-xs text-zinc-400">
                Ro'yxatdan o'tgan email manzilingizni kiriting, tiklash kodini yuboramiz.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                label="Elektron pochta (Email)"
                type="email"
                placeholder="masalan: student@ibnsino.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-2.5 shadow-lg shadow-emerald-500/20"
              >
                Tiklash Kodini Yuborish
              </Button>
            </form>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Kodni Tasdiqlash</h2>
              <p className="text-xs text-zinc-400">
                <strong className="text-zinc-100">{email}</strong> manziliga yuborilgan 6 xonali kod va yangi parolni kiriting.
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-300">
              <span>Tasdiqlash kodi: </span>
              <strong className="tracking-widest font-mono text-sm font-black text-white ml-1">
                {generatedCode}
              </strong>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="6 xonali tasdiqlash kodi"
                type="text"
                placeholder="123456"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                required
              />

              <Input
                label="Yangi parol (kamida 8 ta belgi)"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Yangi parolni tasdiqlang"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-2.5 shadow-lg shadow-emerald-500/20"
              >
                Parolni Saqlash
              </Button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-5 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-100">Parol muvaffaqiyatli yangilandi!</h3>
              <p className="text-xs text-zinc-400">
                Endi yangi parolingiz orqali platformaga bemalol kirishingiz mumkin.
              </p>
            </div>
            <Button
              onClick={() => navigate('/auth/login')}
              variant="primary"
              className="w-full py-2.5 shadow-lg shadow-emerald-500/20"
            >
              Tizimga Kirish
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-zinc-400 border-t border-white/10 pt-4">
          <p>
            Akkauntingiz yo'qmi?{' '}
            <Link to="/auth/register" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
