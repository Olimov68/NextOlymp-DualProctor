import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CreditCard,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { OlympiadCard } from '../../components/olympiad/OlympiadCard';
import { MentorsSection } from '../../components/home/MentorsSection';
import { useOlympiadList } from '../../hooks/useOlympiad';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { authService } from '../../services/authService';
import { useUserStore } from '../../store/useUserStore';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { data: olympiads, isLoading } = useOlympiadList({ status: 'active' });
  const { olympiads: allStoreOlympiads } = useOlympiadStore();
  const { users } = useUserStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  
  const registeredStudentsCount = React.useMemo(() => {
    return users.length;
  }, [users]);

  
  const completedOlympiadsCount = React.useMemo(() => {
    return allStoreOlympiads.length;
  }, [allStoreOlympiads]);

  
  const totalPrizeFundFormatted = React.useMemo(() => {
    const sum = allStoreOlympiads.reduce((acc, curr) => acc + (Number(curr.price || 0) * 100), 0);
    if (sum >= 1_000_000) {
      return `${(sum / 1_000_000).toFixed(0)}M+ UZS`;
    } else if (sum > 0) {
      return `${sum.toLocaleString()} UZS`;
    }
    return '0 UZS';
  }, [allStoreOlympiads]);

  const activeRegionsCount = React.useMemo(() => {
    const regionSet = new Set<string>();
    users.forEach((u) => u.region && regionSet.add(u.region));
    return regionSet.size > 0 ? `${regionSet.size} Viloyat` : '14 Viloyat';
  }, [users]);

  const subjects = [
    { name: 'Matematika va Algebra', icon: '∑', desc: 'Algebra, geometriya, kombinatorika va sonlar nazariyasi', color: 'bg-[#3B82F6] text-white' },
    { name: 'Informatika va Dasturlash', icon: '</>', desc: 'C++, Python va Java tillarida ICPC formatdagi algoritmlar', color: 'bg-indigo-600 text-white' },
    { name: 'Fizika va Mexanika', icon: '⚛', desc: 'Mexanika, elektrodinamika, termodinamika va optika', color: 'bg-cyan-600 text-white' },
    { name: 'Kimyo va Biologiya', icon: '🧪', desc: 'Molekulyar biologiya, organika va stexiometriya', color: 'bg-purple-600 text-white' },
  ];

  const steps = [
    { step: '01', title: "Ro'yxatdan O'ting", desc: "Ismingiz, sinfingiz va hududingizni kiritib bepul akkaunt yarating." },
    { step: '02', title: "Musobaqani Tanlang", desc: "Matematika, Fizika yoki Dasturlash yo'nalishidagi olimpiadaga a'zo bo'ling." },
    { step: '03', title: "PayX Bilan To'lov Qiling", desc: "Payme, Click, Uzum Pay yoki Uzcard orqali 1 soniyada xavfsiz to'lov qiling." },
    { step: '04', title: "Sertifikat va Sovrin", desc: "Anti-cheat vaqtida test yechib, rasmiy verifikatsiyalangan sertifikat oling." },
  ];

  const faqs = [
    {
      q: "Ibn Sino platformasida kimlar ishtirok eta oladi?",
      a: "O'zbekiston Respublikasi hamda xalqaro miqyosdagi 5-11 sinf maktab o'quvchilari, akademik litsey talabalari va tibbiyot yo'nalishiga qiziquvchi yoshlar qatnashishlari mumkin."
    },
    {
      q: "To'lovlar qanday amalga oshiriladi va PayX nima?",
      a: "Ibn Sino platformasi rasmiy PayX merchant to'lov agregatori (https://payx.uz/docs) bilan integratsiya qilingan. Siz Payme, Click, Uzum Bank hamda Uzcard/Humo kartalaringiz orqali 0% komissiya bilan to'lov qilishingiz mumkin."
    },
    {
      q: "Anti-Cheat va Proctoring tizimi qanday ishlaydi?",
      a: "Test topshirish jarayonida sahifadan chiqish (tab switching), brauzer konsolini ochish hamda nusxalash harakatlari server darajasida qayd etiladi va audio-video AI tahlil markaziga uzatiladi."
    },
    {
      q: "Sertifikatlarning haqiqiyligi qanday tekshiriladi?",
      a: "Har bir berilgan sertifikat unikal QR-kod hamda verifikatsiya kodiga ega. 'Sertifikatni tekshirish' bo'limida kodni kiritish orqali haqiqiyligini 100% rasmiy tasdiqlash mumkin."
    }
  ];

  return (
    <div className="space-y-20 pb-20 bg-zinc-950 text-zinc-100 font-sans">
      
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/70 to-zinc-950 text-zinc-100 pt-20 pb-24 border-b border-white/10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Ibn Sino 2026 Akademik Mavsumi</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-zinc-100">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Abu Ali ibn Sino</span> Nomidagi Akademik Mock va Olimpiadalar
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Tibbiyot, biologiya, kimyo va aniq fanlar bo'yicha nufuzli onlayn olimpiada, shaffof AI proktorlik va rasmiy verifikatsiyalangan sertifikatlar tizimi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/olympiads">
              <Button size="lg" variant="primary" className="font-bold px-8 shadow-lg shadow-emerald-500/20" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Imtihonlarga qo'shilish
              </Button>
            </Link>
            <Link
              to="/rules"
              className="px-6 py-3 text-base font-semibold rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span>Olimpiadalar tartibi</span>
            </Link>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-left space-y-1 hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-black/20">
              <div className="text-3xl font-black text-zinc-100 font-mono">
                {registeredStudentsCount > 0 ? `${registeredStudentsCount.toLocaleString()}+` : '0'}
              </div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{t('hero.statStudents') || "O'quvchilar"}</div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-left space-y-1 hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-black/20">
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {completedOlympiadsCount > 0 ? `${completedOlympiadsCount}+` : '0'}
              </div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{t('hero.statOlympiads') || "Musobaqalar"}</div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-left space-y-1 hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-black/20">
              <div className="text-3xl font-black text-amber-400 font-mono">{totalPrizeFundFormatted}</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{t('hero.statPrizes') || "Mukofot Jamg'armasi"}</div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-left space-y-1 hover:-translate-y-0.5 transition-all duration-200 shadow-xl shadow-black/20">
              <div className="text-3xl font-black text-teal-400 font-mono">{activeRegionsCount}</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">{t('hero.statRegions') || "Hududlar"}</div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Jonli musobaqalar</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Davom etayotgan Akademik Musobaqalar
            </h2>
          </div>
          <Link to="/olympiads" className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
            Barchasini ko'rish <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-zinc-900/60 border border-white/10 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {olympiads?.slice(0, 3).map((o) => (
              <OlympiadCard key={o.id} olympiad={o} />
            ))}
          </div>
        )}
      </section>

      {/* Bizning Ustozlar / Kursga Yozilish (Mentors & Course Showcase) */}
      <MentorsSection />

      {/* PayX Gateway Integration Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950 text-zinc-100 rounded-2xl p-8 sm:p-12 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Rasmiy PayX Gateway Integratsiyasi (https://payx.uz/docs)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Xavfsiz va Instant To'lov Tizimlari
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Ibn Sino Platformasi barcha turdagi to'lov tizimlarini qo'llab-quvvatlaydi. PayX merchant agregatori orqali 0% komissiya bilan to'lov qiling.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-bold text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-200 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-black text-xs">P</span>
              <span>Payme</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-200 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-black text-xs">C</span>
              <span>Click Pass</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-200 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">U</span>
              <span>Uzum Pay</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-200 flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">💳</span>
              <span>Uzcard/Humo</span>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Bosqichma-bosqich</span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-100">Musobaqada Qatnashish Qoidalari</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-white/10 space-y-4 relative overflow-hidden group hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200">
              <div className="text-4xl font-black text-zinc-800 group-hover:text-emerald-400 transition-colors font-mono">
                {st.step}
              </div>
              <h3 className="font-bold text-lg text-zinc-100">{st.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-100">Musobaqa Yo'nalishlari</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Xalqaro standartlar asosida tuzilgan akademik olimpiadalarda o'z bilimingizni sinab ko'ring.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((sub, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md hover:border-emerald-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 space-y-4 group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${sub.color} font-mono text-xl font-bold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                {sub.icon}
              </div>
              <h3 className="font-bold text-lg text-zinc-100 group-hover:text-emerald-400 transition-colors">
                {sub.name}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {sub.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center font-bold border border-emerald-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-100">Tez-tez Beriladigan Savollar</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:border-emerald-500/40 space-y-2"
            >
              <div className="flex items-center justify-between font-bold text-sm text-zinc-100">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-400' : ''}`} />
              </div>
              {openFaq === idx && (
                <p className="text-xs text-zinc-400 pt-3 border-t border-white/10 leading-relaxed font-medium">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-teal-950/40 text-zinc-100 rounded-2xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border border-emerald-500/20">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Bugun A'zo Bo'ling va Akademik Marralarni Zabt Eting!
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto font-medium leading-relaxed">
            Respublika va xalqaro miqyosdagi akademik musobaqalar ishtirokchisiga aylaning.
          </p>
          <div className="pt-2">
            <Link to="/auth/register">
              <Button size="lg" variant="primary" className="font-black px-8 py-3.5 shadow-xl shadow-emerald-500/20">
                Ro'yxatdan O'tish
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
