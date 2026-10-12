import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building,
  MapPin,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Send,
  ExternalLink,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Check
} from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Role } from '../../types';
import { clsx } from 'clsx';

const UZBEKISTAN_DISTRICTS: Record<string, string[]> = {
  'Toshkent shahri': [
    'Yunusobod tumani',
    'Chilonzor tumani',
    'Mirzo Ulug‘bek tumani',
    'Yakkasaroy tumani',
    'Shayxontohur tumani',
    'Olmazor tumani',
    'Mirobod tumani',
    'Sergeli tumani',
    'Uchtepa tumani',
    'Bektemir tumani',
    'Yangihayot tumani',
    'Yashnobod tumani',
  ],
  'Toshkent viloyati': [
    'Chirchiq shahri',
    'Olmaliq shahri',
    'Angren shahri',
    'Bekobod shahri',
    'Yangiyo‘l shahri',
    'Oqqo‘rg‘on tumani',
    'Ohangaron tumani',
    'Bekobod tumani',
    'Bo‘stonliq tumani',
    'Bo‘ka tumani',
    'Zangiota tumani',
    'Qibray tumani',
    'Parkent tumani',
    'Piskent tumani',
    'O‘rtachirchiq tumani',
    'Chinoz tumani',
    'Yuqorichirchiq tumani',
    'Yangiyo‘l tumani',
  ],
  'Samarqand viloyati': [
    'Samarqand shahri',
    'Kattaqo‘rg‘on shahri',
    'Bulung‘ur tumani',
    'Jomboy tumani',
    'Ishtixon tumani',
    'Kattaqo‘rg‘on tumani',
    'Narpay tumani',
    'Nurobod tumani',
    'Oqdaryo tumani',
    'Paxtachi tumani',
    'Payariq tumani',
    'Pastdarg‘om tumani',
    'Samarqand tumani',
    'Toyloq tumani',
    'Urgut tumani',
    'Qo‘shrabot tumani',
  ],
  'Farg\'ona viloyati': [
    'Farg‘ona shahri',
    'Marg‘ilon shahri',
    'Qo‘qon shahri',
    'Quvasoy shahri',
    'Beshariq tumani',
    'Bog‘dod tumani',
    'Buvayda tumani',
    'Dang‘ara tumani',
    'Yozyovon tumani',
    'Quva tumani',
    'Oltiariq tumani',
    'Rishton tumani',
    'So‘x tumani',
    'Toshloq tumani',
    'Uchko‘prik tumani',
    'O‘zbekiston tumani',
    'Farg‘ona tumani',
  ],
  'Andijon viloyati': [
    'Andijon shahri',
    'Xonobod shahri',
    'Andijon tumani',
    'Asaka tumani',
    'Baliqchi tumani',
    'Bo‘ston tumani',
    'Buloqboshi tumani',
    'Izboskan tumani',
    'Jalaquduq tumani',
    'Marhamat tumani',
    'Oltinko‘l tumani',
    'Paxtaobod tumani',
    'Ulug‘nor tumani',
    'Xo‘jaobod tumani',
    'Shahrixon tumani',
    'Qo‘rg‘ontepa tumani',
  ],
  'Namangan viloyati': [
    'Namangan shahri',
    'Davlatobod tumani',
    'Yangi Namangan tumani',
    'Kosonsoy tumani',
    'Mingbuloq tumani',
    'Namangan tumani',
    'Norin tumani',
    'Pop tumani',
    'To‘raqo‘rg‘on tumani',
    'Uychi tumani',
    'Uchqo‘rg‘on tumani',
    'Chortoq tumani',
    'Chust tumani',
    'Yangiqo‘rg‘on tumani',
  ],
  'Buxoro viloyati': [
    'Buxoro shahri',
    'Kogon shahri',
    'Buxoro tumani',
    'Vobkent tumani',
    'G‘ijduvon tumani',
    'Jondor tumani',
    'Kogon tumani',
    'Olot tumani',
    'Peshku tumani',
    'Romitan tumani',
    'Shofirkon tumani',
    'Qorako‘l tumani',
    'Qorovulbozor tumani',
  ],
  'Qashqadaryo viloyati': [
    'Qarshi shahri',
    'Shahrisabz shahri',
    'Dehqonobod tumani',
    'Kasbi tumani',
    'Kitob tumani',
    'Koson tumani',
    'Mirishkor tumani',
    'Muborak tumani',
    'Nishon tumani',
    'Qamashi tumani',
    'Qarshi tumani',
    'Yakkabog‘ tumani',
    'G‘uzor tumani',
    'Chiroqchi tumani',
    'Ko‘kdala tumani',
  ],
  'Surxondaryo viloyati': [
    'Termiz shahri',
    'Angor tumani',
    'Bandixon tumani',
    'Boysun tumani',
    'Denov tumani',
    'Jarqo‘rg‘on tumani',
    'Muzrabot tumani',
    'Oltinsoy tumani',
    'Sariosiyo tumani',
    'Termiz tumani',
    'Uzun tumani',
    'Sherobod tumani',
    'Sho‘rchi tumani',
    'Qiziriq tumani',
    'Qumqo‘rg‘on tumani',
  ],
  'Jizzax viloyati': [
    'Jizzax shahri',
    'Arnasoy tumani',
    'Baxmal tumani',
    'G‘allaorol tumani',
    'Do‘stlik tumani',
    'Zomin tumani',
    'Zarbdor tumani',
    'Zafarobod tumani',
    'Mirzacho‘l tumani',
    'Paxtakor tumani',
    'Forish tumani',
    'Sharof Rashidov tumani',
    'Yangiobod tumani',
  ],
  'Sirdaryo viloyati': [
    'Guliston shahri',
    'Shirin shahri',
    'Yangiyer shahri',
    'Boyovut tumani',
    'Guliston tumani',
    'Mirzaobod tumani',
    'Oqoltin tumani',
    'Sardoba tumani',
    'Sayxunobod tumani',
    'Sirdaryo tumani',
    'Xovos tumani',
  ],
  'Xorazm viloyati': [
    'Urganch shahri',
    'Xiva shahri',
    'Bog‘ot tumani',
    'Gurlan tumani',
    'Qo‘shko‘pir tumani',
    'Urganch tumani',
    'Xiva tumani',
    'Xonqa tumani',
    'Hazorasp tumani',
    'Shovot tumani',
    'Yangiariq tumani',
    'Yangibozor tumani',
    'Tuproqqal‘a tumani',
  ],
  'Navoiy viloyati': [
    'Navoiy shahri',
    'Zarafshon shahri',
    'Karmana tumani',
    'Konimex tumani',
    'Navbahor tumani',
    'Nurota tumani',
    'Tomdi tumani',
    'Uchquduq tumani',
    'Xatirchi tumani',
    'Qiziltepa tumani',
  ],
  'Qoraqalpog\'iston Respublikasi': [
    'Nukus shahri',
    'Amudaryo tumani',
    'Beruniy tumani',
    'Bo‘zatov tumani',
    'Kegeyli tumani',
    'Mo‘ynoq tumani',
    'Nukus tumani',
    'Qanliko‘l tumani',
    'Qo‘ng‘irot tumani',
    'Qorao‘zak tumani',
    'Taxtako‘pir tumani',
    'To‘rtko‘l tumani',
    'Xo‘jayli tumani',
    'Chimboy tumani',
    'Sho‘manay tumani',
    'Ellikqala tumani',
    'Taxiatosh tumani',
  ],
};

const UZBEKISTAN_REGIONS = Object.keys(UZBEKISTAN_DISTRICTS);

interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  region?: string;
  district?: string;
  school?: string;
}

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { registerVerify, isLoading } = useAuth();

  const [step, setStep] = useState<'form' | 'telegram_verify'>('form');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [telegramBotUsername, setTelegramBotUsername] = useState('IbnsinoschoolBot');
  const [verificationCode, setVerificationCode] = useState('');
  const [debugCodeHint, setDebugCodeHint] = useState<string | undefined>();
  const [isInitLoading, setIsInitLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [connectedUsername, setConnectedUsername] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [password, setPassword] = useState('');
  const [role] = useState<Role>('student');
  const [grade, setGrade] = useState<number>(9);
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [school, setSchool] = useState('');
  const [parentConsent, setParentConsent] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Poll Telegram status while on verification step
  useEffect(() => {
    if (step !== 'telegram_verify' || !telegramToken || telegramConnected) return;

    const interval = setInterval(async () => {
      try {
        const status = await authService.registerStatus(telegramToken);
        if (status.hasTelegram || status.verified) {
          setTelegramConnected(true);
          if (status.telegramUsername) {
            setConnectedUsername(status.telegramUsername);
          }
        }
      } catch {
        // Continue polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, telegramToken, telegramConnected]);

  
  const formatPhoneNumber = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 9);

    let formatted = '+998';
    if (digits.length > 0) {
      formatted += ' ' + digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.slice(2, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.slice(5, 7);
    }
    if (digits.length > 7) {
      formatted += ' ' + digits.slice(7, 9);
    }
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (submitted) {
      const digits = formatted.replace(/\D/g, '').replace(/^998/, '');
      if (digits.length === 9) {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "Telefon raqamni to'liq kiriting (+998 XX XXX XX XX)" }));
      }
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRegion = e.target.value;
    setRegion(selectedRegion);
    setDistrict(''); 
    if (submitted) {
      if (selectedRegion) {
        setErrors((prev) => ({ ...prev, region: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, region: "Viloyatni tanlang" }));
      }
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistrict = e.target.value;
    setDistrict(selectedDistrict);
    if (submitted) {
      if (selectedDistrict) {
        setErrors((prev) => ({ ...prev, district: undefined }));
      } else {
        setErrors((prev) => ({ ...prev, district: "Tumanni tanlang" }));
      }
    }
  };

  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    
    const trimmedName = fullName.trim();
    const words = trimmedName.split(/\s+/).filter(Boolean);
    if (!trimmedName) {
      newErrors.fullName = "To'liq ism va familiyangizni kiriting";
    } else if (words.length < 2) {
      newErrors.fullName = "F.I.SH kamida 2 ta so'zdan iborat bo'lishi shart (Ism va Familiya)";
    }

    
    const digits = phone.replace(/\D/g, '').replace(/^998/, '');
    if (!digits) {
      newErrors.phone = "Telefon raqamingizni kiriting";
    } else if (digits.length < 9) {
      newErrors.phone = "Telefon raqamni to'liq kiriting (+998 XX XXX XX XX)";
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Elektron pochta manzilingizni kiriting";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Haqiqiy elektron pochta manzilini kiriting (masalan: user@example.com)";
    }

    
    if (!password) {
      newErrors.password = "Parolni kiriting";
    } else if (password.length < 8) {
      newErrors.password = "Parol kamida 8 ta belgidan iborat bo'lishi shart";
    }

    
    if (!region) {
      newErrors.region = "Viloyatni tanlang";
    }
    if (!district) {
      newErrors.district = "Tumanni tanlang";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsInitLoading(true);
    setVerifyError('');
    try {
      const res = await authService.registerInit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        password,
        role: (role === 'admin' ? 'student' : role) as 'student' | 'teacher',
        grade,
        region,
        district,
        school: school.trim(),
        parentConsent,
      });

      setTelegramToken(res.token);
      setTelegramDeepLink(res.deepLink);
      setTelegramBotUsername(res.botUsername || 'IbnsinoschoolBot');
      setDebugCodeHint(res.debugCode);
      setStep('telegram_verify');
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, email: err?.message || "Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring." }));
    } finally {
      setIsInitLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setVerifyError("Iltimos, Telegram bot yuborgan 6 xonali tasdiqlash kodini kiriting.");
      return;
    }

    setIsVerifyLoading(true);
    try {
      await registerVerify(telegramToken, cleanCode);
      navigate('/dashboard');
    } catch (err: any) {
      setVerifyError(err?.message || "Tasdiqlash kodi noto'g'ri yoki eskirgan. Iltimos, qaytadan tekshirib ko'ring.");
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const availableDistricts = region ? UZBEKISTAN_DISTRICTS[region] || [] : [];

  return (
    <div className="py-12 flex items-center justify-center p-4 font-sans bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-xl bg-zinc-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40 space-y-6">
        {step === 'telegram_verify' ? (
          <div className="space-y-6">
            <div className="text-center space-y-2 border-b border-white/10 pb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 mb-1 shadow-lg shadow-sky-500/10">
                <Send className="w-7 h-7 -translate-x-0.5 translate-y-0.5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
                Telegram Orqali Tasdiqlash
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Hurmatli <span className="text-emerald-400 font-semibold">{fullName}</span>, hisobingizni faollashtirish hamda olimpiada natijalari va eslatmalarini Telegram orqali olish uchun rasmiy botimizga kiring.
              </p>
            </div>

            {verifyError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{verifyError}</span>
              </div>
            )}

            {/* Telegram Bot Action Box */}
            <div className="p-5 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">@{telegramBotUsername}</h4>
                    <p className="text-[11px] text-zinc-400">Ibn Sino Maktabi Rasmiy Boti</p>
                  </div>
                </div>

                {telegramConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Bot ulandi {connectedUsername ? `(@${connectedUsername})` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> Bot ulanishi kutilmoqda...
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-300 space-y-2 bg-zinc-900/60 p-3.5 rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Quyidagi ko'k tugmani bosing va <b>Telegram</b> ilovasini oching.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Botda <b>Start (Boshlash)</b> tugmasini bosing.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Bot sizga <b>6 xonali tasdiqlash kodi</b>ni yuboradi, uni quyidagi maydonga kiriting.</span>
                </div>
              </div>

              <a
                href={telegramDeepLink || `https://t.me/${telegramBotUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 transition-all shadow-lg shadow-sky-500/25 active:scale-[0.99]"
              >
                <Send className="w-4 h-4" />
                Telegram Botni ochish (@{telegramBotUsername})
                <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
              </a>
            </div>

            {/* Code Verification Form */}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span>6 xonali tasdiqlash kodi *</span>
                  <span className="text-[11px] text-zinc-400 font-normal">Botdan olingan kod</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full py-3.5 px-4 text-center tracking-[10px] text-2xl font-mono font-black border rounded-xl bg-zinc-950/80 text-white placeholder:text-zinc-700 border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                  autoFocus
                />
              </div>

              {debugCodeHint && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-300">
                  <span>Mahalliy test kodi: </span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(debugCodeHint)}
                    className="tracking-widest font-mono text-sm font-black text-white underline hover:text-emerald-300 cursor-pointer ml-1"
                  >
                    {debugCodeHint} (bosing)
                  </button>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isVerifyLoading}
                className="w-full text-white font-bold py-3.5 text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Tasdiqlash va Ro'yxatdan o'tish
              </Button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ma'lumotlarni o'zgartirish
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2 border-b border-white/10 pb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-1 shadow-sm">
                <GraduationCap className="w-7 h-7" />
              </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
            {t('auth.registerTitle') || "Ro'yxatdan o'tish"}
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            Ibn Sino akademik musobaqalariga a'zo bo'ling va o'z bilimingizni sinang
          </p>
        </div>

        {errors.email && (
          <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-start gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errors.email}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          <div>
            <Input
              label="F.I.SH (To'liq ism-familiya) *"
              placeholder="Masalan: Sardor Rustamov"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (submitted) {
                  const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                  if (words.length >= 2) {
                    setErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }
              }}
              leftIcon={<User className="w-4 h-4" />}
              error={errors.fullName}
              required
            />
          </div>

          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#F1F5F9] block">
              Jinsi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={clsx(
                  "py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none",
                  gender === 'male'
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500"
                    : "bg-zinc-950/70 border-white/10 text-zinc-400 hover:border-white/20"
                )}
              >
                <span className="text-base">👦</span>
                <span>O'g'il bola</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={clsx(
                  "py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none",
                  gender === 'female'
                    ? "bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm shadow-pink-500/20 ring-1 ring-pink-500"
                    : "bg-zinc-950/70 border-white/10 text-zinc-400 hover:border-white/20"
                )}
              >
                <span className="text-base">👧</span>
                <span>Qiz bola</span>
              </button>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Elektron pochta (Email) *"
                type="email"
                placeholder="sardor@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitted) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(e.target.value.trim())) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email}
                required
              />
            </div>

            <div>
              <Input
                label="Telefon raqam *"
                type="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={handlePhoneChange}
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone}
                required
              />
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Parol (kamida 8 ta belgi) *"
                type="password"
                placeholder="Kamida 8 ta belgi"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitted) {
                    if (e.target.value.length >= 8) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
                required
              />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Sinfingiz *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 text-sm border border-white/10 rounded-xl bg-zinc-950/70 text-zinc-100 font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200"
              >
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g} className="bg-zinc-900 text-zinc-100">{g}-sinf</option>
                ))}
              </select>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Viloyat / Shahar *</span>
              </label>
              <select
                value={region}
                onChange={handleRegionChange}
                className={clsx(
                  "w-full py-2.5 px-3.5 text-sm border rounded-xl bg-zinc-950/70 text-zinc-100 font-medium outline-none transition-all duration-200",
                  errors.region
                    ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/30"
                    : "border-white/10 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                )}
              >
                <option value="" className="bg-zinc-900 text-zinc-400">-- Viloyatni tanlang --</option>
                {UZBEKISTAN_REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-zinc-900 text-zinc-100">{r}</option>
                ))}
              </select>
              {errors.region && (
                <span className="text-xs text-rose-400 font-medium">{errors.region}</span>
              )}
            </div>

            
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tuman / Shahar *</span>
              </label>
              <select
                value={district}
                onChange={handleDistrictChange}
                disabled={!region}
                className={clsx(
                  "w-full py-2.5 px-3.5 text-sm border rounded-xl bg-zinc-950/70 text-zinc-100 font-medium outline-none transition-all duration-200 disabled:bg-zinc-950/40 disabled:text-zinc-600 disabled:cursor-not-allowed",
                  errors.district
                    ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/30"
                    : "border-white/10 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                )}
              >
                <option value="" className="bg-zinc-900 text-zinc-400">
                  {region ? "-- Tumanni tanlang --" : "-- Avval viloyatni tanlang --"}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d} className="bg-zinc-900 text-zinc-100">{d}</option>
                ))}
              </select>
              {errors.district && (
                <span className="text-xs text-rose-400 font-medium">{errors.district}</span>
              )}
            </div>
          </div>

          
          <div>
            <Input
              label="Maktab / Muassasa nomi *"
              placeholder="Masalan: 14-sonli ixtisoslashtirilgan umumta'lim maktabi"
              value={school}
              onChange={(e) => {
                setSchool(e.target.value);
                if (submitted && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, school: undefined }));
                }
              }}
              leftIcon={<Building className="w-4 h-4" />}
              error={errors.school}
              required
            />
          </div>

          
          <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-white/10 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-400 font-medium">
              <input
                type="checkbox"
                checked={parentConsent}
                onChange={(e) => setParentConsent(e.target.checked)}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
              />
              <span>{t('auth.parentConsentLabel') || "Ota-onam / vasiyim testda ishtirok etishimdan xabardor va rozilik beradi"}</span>
            </label>
          </div>

          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
            Ro'yxatdan o'tish orqali siz platformaning{' '}
            <Link to="/terms" target="_blank" className="font-semibold text-emerald-400 hover:underline">Foydalanish shartlari</Link>,{' '}
            <Link to="/privacy" target="_blank" className="font-semibold text-emerald-400 hover:underline">Maxfiylik siyosati</Link> hamda{' '}
            <Link to="/rules" target="_blank" className="font-semibold text-emerald-400 hover:underline">Nizom va qoidalari</Link>ga rozilik bildirasiz.
          </p>

          <Button
            type="submit"
            isLoading={isInitLoading || isLoading}
            className="w-full text-white font-bold py-3.5 text-sm rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all"
          >
            Davom etish (Telegram orqali tasdiqlash)
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400 border-t border-white/10 pt-4">
          Allaqachon hisobingiz bormi?{' '}
          <Link to="/auth/login" className="font-bold text-emerald-400 hover:underline">
            {t('auth.loginBtn') || "Kirish"}
          </Link>
        </p>
      </>
    )}
      </div>
    </div>
  );
};
