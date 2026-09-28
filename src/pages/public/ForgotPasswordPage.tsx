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

    
    const registered = authService.getRegisteredUsers();
    const user = registered.find((u) => u.email.toLowerCase().trim() === trimmedEmail);

    if (!user) {
      setError("Bunday email bilan akkaunt topilmadi. Iltimos, pochtangizni tekshiring yoki ro'yxatdan o'ting.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setLoading(false);

    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setEnteredCode(code); 
    setStep('verify');
  };

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (enteredCode.trim() !== generatedCode.trim()) {
      setError("Tasdiqlash kodi noto'g'ri. Qaytadan tekshirib kiriting.");
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
      await authService.resetPassword(email, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err?.message || "Parolni yangilashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-[#0B1120] text-[#F1F5F9]">
      <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl p-8 shadow-xl space-y-6">
        
        
        <div>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B82F6] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Kirishga qaytish
          </Link>
        </div>

        
        {step === 'email' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center font-bold">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-[#F1F5F9] tracking-tight">Parolni Tiklash</h2>
              <p className="text-xs text-[#94A3B8]">
                Ro'yxatdan o'tgan email manzilingizni kiriting, tiklash kodini yuboramiz.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#EF4444]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                label="Elektron pochta (Email)"
                type="email"
                placeholder="masalan: student@nextolymp.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2.5"
              >
                Tiklash Kodini Yuborish
              </Button>
            </form>
          </div>
        )}

        
        {step === 'verify' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 mx-auto flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-[#F1F5F9] tracking-tight">Kodni Tasdiqlash</h2>
              <p className="text-xs text-[#94A3B8]">
                <strong className="text-[#F1F5F9]">{email}</strong> manziliga yuborilgan 6 xonali kod va yangi parolni kiriting.
              </p>
            </div>

            
            <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg text-center text-xs text-[#3B82F6]">
              <span>Tasdiqlash kodi: </span>
              <strong className="tracking-widest font-mono text-sm font-black text-white ml-1">
                {generatedCode}
              </strong>
            </div>

            {error && (
              <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#EF4444]">
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
                isLoading={loading}
                className="w-full font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2.5"
              >
                Parolni Saqlash
              </Button>
            </form>
          </div>
        )}

        
        {step === 'success' && (
          <div className="text-center space-y-5 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-[#F1F5F9]">Parol muvaffaqiyatli yangilandi!</h3>
              <p className="text-xs text-[#94A3B8]">
                Endi yangi parolingiz orqali platformaga bemalol kirishingiz mumkin.
              </p>
            </div>
            <Button
              onClick={() => navigate('/auth/login')}
              className="w-full font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white py-2.5"
            >
              Tizimga Kirish
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-[#94A3B8] border-t border-[#1E293B] pt-4">
          <p>
            Akkauntingiz yo'qmi?{' '}
            <Link to="/auth/register" className="font-bold text-[#3B82F6] hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
