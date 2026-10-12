import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Lock, ShieldCheck, KeyRound, AlertCircle, Send, ExternalLink } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'verify' | 'success'>('email');
  const [identifier, setIdentifier] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('IbnsinoschoolBot');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = identifier.trim();
    if (!clean) {
      setError("Elektron pochta manzilingiz yoki telefon raqamingizni kiriting.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(clean);
      if (res.debugCode) {
        setGeneratedCode(res.debugCode);
      }
      if (res.deepLink) {
        setTelegramDeepLink(res.deepLink);
      }
      if (res.botUsername) {
        setTelegramBotUsername(res.botUsername);
      }
      setEnteredCode('');
      setStep('verify');
    } catch (err: any) {
      setError(err?.message || "Bunday foydalanuvchi topilmadi.");
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
      await authService.resetPassword(identifier.trim(), enteredCode.trim(), newPassword);
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center font-bold shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Parolni Tiklash</h2>
              <p className="text-xs text-zinc-400">
                Ro'yxatdan o'tgan email yoki telefon raqamingizni kiriting, Telegram botimiz orqali tasdiqlash kodini yuboramiz.
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
                label="Email yoki Telefon raqami"
                type="text"
                placeholder="student@ibnsino.uz yoki +998 90 123 45 67"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-3 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/20"
              >
                Tiklash Kodini Olish
              </Button>
            </form>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mx-auto flex items-center justify-center font-bold shadow-sm">
                <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Kodni Tasdiqlash</h2>
              <p className="text-xs text-zinc-400">
                <strong className="text-zinc-100">{identifier}</strong> uchun Telegram botimiz (<span className="text-sky-400">@{telegramBotUsername}</span>) orqali yuborilgan 6 xonali kodni kiriting.
              </p>
            </div>

            {telegramDeepLink && (
              <a
                href={telegramDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 transition-all shadow-lg shadow-sky-500/20"
              >
                <Send className="w-4 h-4" />
                Telegram Botni ochish (@{telegramBotUsername})
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            {generatedCode && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-300">
                <span>Mahalliy test kodi: </span>
                <strong className="tracking-widest font-mono text-sm font-black text-white ml-1">
                  {generatedCode}
                </strong>
              </div>
            )}

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
                onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                className="w-full py-3 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/20"
              >
                Parolni Saqlash
              </Button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-5 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-zinc-100">Parol Yangilandi!</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hisobingiz paroli muvaffaqiyatli o'zgartirildi. Yangi parol orqali tizimga kirishingiz mumkin.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => navigate('/auth/login')}
              variant="primary"
              className="w-full py-3 text-sm font-bold shadow-lg shadow-emerald-500/20"
            >
              Kirish sahifasiga o'tish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
