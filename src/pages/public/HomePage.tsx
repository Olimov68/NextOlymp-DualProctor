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
      q: "Next Olymp platformasida kimlar ishtirok eta oladi?",
      a: "O'zbekiston Respublikasi hamda MDH mamlakatlaridagi 5-11 sinf maktab o'quvchilari va akademik litsey talabalari qatnashishlari mumkin."
    },
    {
      q: "To'lovlar qanday amalga oshiriladi va PayX nima?",
      a: "Next Olymp rasmiy PayX merchant to'lov agregatori (https://payx.uz/docs) bilan integratsiya qilingan. Siz Payme, Click, Uzum Bank, Paynet hamda Uzcard/Humo kartalaringiz orqali 0% komissiya bilan to'lov qilishingiz mumkin."
    },
    {
      q: "Anti-Cheat va Proctoring tizimi qanday ishlaydi?",
      a: "Test topshirish jarayonida sahifadan chiqish (tab switching), brauzer konsolini ochish hamda nusxalash harakatlari avtomatik ravishda qayd etiladi va proctoring markaziga yuboriladi."
    },
    {
      q: "Sertifikatlarning haqiqiyligi qanday tekshiriladi?",
      a: "Har bir berilgan sertifikat unikal QR-kod hamda verifikatsiya kodiga ega. 'Sertifikatni tekshirish' bo'limida kodni kiritish orqali haqiqiyligini 100% tasdiqlash mumkin."
    }
  ];

  return (
    <div className="space-y-20 pb-20 bg-[#0B1120] text-[#F1F5F9] font-sans">
      
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0B1120] via-[#111827] to-[#0B1120] text-[#F1F5F9] pt-20 pb-24 border-b border-[#1E293B]">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B82F6]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-xs font-bold text-[#60A5FA]">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>{t('hero.badge') || "Next Olymp 2026 Mavsumi"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto text-[#F1F5F9]">
            Akademik iste'dodingizni oshiring va cho'qqilarni zabt eting
          </h1>

          <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto font-medium leading-relaxed">
            {t('hero.subtitle') || "O'zbekiston bo'ylab onlayn matematika, fizika, informatika va kimyo fanlaridan akademik olimpiadalar"}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/olympiads">
              <Button size="lg" variant="primary" className="font-bold shadow-lg shadow-[#3B82F6]/30" rightIcon={<ArrowRight className="w-5 h-5" />}>
                {t('hero.ctaExplore') || "Musobaqalarga qo'shilish"}
              </Button>
            </Link>
            <Link
              to="/rules"
              className="px-6 py-3 text-base font-semibold rounded-lg border border-[#1E293B] bg-[#111827] hover:bg-[#1E293B] text-[#F1F5F9] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Olimpiadalar tartibi</span>
            </Link>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 max-w-5xl mx-auto">
            <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] text-left space-y-1">
              <div className="text-3xl font-black text-[#F1F5F9] font-mono">
                {registeredStudentsCount > 0 ? `${registeredStudentsCount.toLocaleString()}+` : '0'}
              </div>
              <div className="text-xs text-[#94A3B8] font-bold uppercase">{t('hero.statStudents') || "O'quvchilar"}</div>
            </div>
            <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] text-left space-y-1">
              <div className="text-3xl font-black text-[#3B82F6] font-mono">
                {completedOlympiadsCount > 0 ? `${completedOlympiadsCount}+` : '0'}
              </div>
              <div className="text-xs text-[#94A3B8] font-bold uppercase">{t('hero.statOlympiads') || "Musobaqalar"}</div>
            </div>
            <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] text-left space-y-1">
              <div className="text-3xl font-black text-[#F59E0B] font-mono">{totalPrizeFundFormatted}</div>
              <div className="text-xs text-[#94A3B8] font-bold uppercase">{t('hero.statPrizes') || "Mukofot Jamg'armasi"}</div>
            </div>
            <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] text-left space-y-1">
              <div className="text-3xl font-black text-[#10B981] font-mono">{activeRegionsCount}</div>
              <div className="text-xs text-[#94A3B8] font-bold uppercase">{t('hero.statRegions') || "Hududlar"}</div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-[#1E293B] pb-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#3B82F6] tracking-wider">Jonli musobaqalar</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9] tracking-tight">
              Davom etayotgan Akademik Musobaqalar
            </h2>
          </div>
          <Link to="/olympiads" className="text-sm font-bold text-[#3B82F6] hover:underline flex items-center gap-1">
            Barchasini ko'rish <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-[#111827] border border-[#1E293B] rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {olympiads?.slice(0, 3).map((o) => (
              <OlympiadCard key={o.id} olympiad={o} />
            ))}
          </div>
        )}
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] text-[#F1F5F9] rounded-xl p-8 sm:p-12 shadow-xl border border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] text-xs font-bold border border-[#3B82F6]/30">
              <CreditCard className="w-4 h-4 text-[#3B82F6]" />
              <span>Rasmiy PayX Gateway Integratsiyasi (https://payx.uz/docs)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9] tracking-tight">
              Xavfsiz va Instant To'lov Tizimlari
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
              Next Olymp barcha turdagi to'lov tizimlarini qo'llab-quvvatlaydi. PayX merchant agregatori orqali 0% komissiya bilan to'lov qiling.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0 font-bold text-xs">
            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#1E293B] text-[#F1F5F9] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#00CCCC] text-white flex items-center justify-center font-black text-xs">P</span>
              <span>Payme</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#1E293B] text-[#F1F5F9] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#0070BA] text-white flex items-center justify-center font-black text-xs">C</span>
              <span>Click Pass</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#1E293B] text-[#F1F5F9] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#7000FF] text-white flex items-center justify-center font-black text-xs">U</span>
              <span>Uzum Pay</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#1E293B] text-[#F1F5F9] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-black text-xs">💳</span>
              <span>Uzcard/Humo</span>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase font-extrabold text-[#3B82F6] tracking-wider">Bosqichma-bosqich</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]">Musobaqada Qatnashish Qoidalari</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-[#111827] border border-[#1E293B] space-y-4 relative overflow-hidden group hover:border-[#3B82F6] transition-all">
              <div className="text-4xl font-black text-[#1E293B] group-hover:text-[#3B82F6] transition-colors font-mono">
                {st.step}
              </div>
              <h3 className="font-bold text-lg text-[#F1F5F9]">{st.title}</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]">Musobaqa Yo'nalishlari</h2>
          <p className="text-[#94A3B8] text-sm max-w-xl mx-auto">
            Xalqaro standartlar asosida tuzilgan akademik olimpiadalarda o'z bilimingizni sinab ko'ring.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((sub, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-[#1E293B] bg-[#111827] hover:border-[#3B82F6] hover:shadow-lg transition-all duration-300 space-y-4 group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-lg ${sub.color} font-mono text-xl font-bold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                {sub.icon}
              </div>
              <h3 className="font-bold text-lg text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors">
                {sub.name}
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {sub.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#F1F5F9]">Tez-tez Beriladigan Savollar</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 cursor-pointer transition-all hover:border-[#3B82F6]/50 space-y-2"
            >
              <div className="flex items-center justify-between font-bold text-sm text-[#F1F5F9]">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${openFaq === idx ? 'rotate-180 text-[#3B82F6]' : ''}`} />
              </div>
              {openFaq === idx && (
                <p className="text-xs text-[#94A3B8] pt-2 border-t border-[#1E293B] leading-relaxed font-medium">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] text-[#F1F5F9] rounded-xl p-8 sm:p-14 text-center space-y-6 shadow-xl border border-[#1E293B]">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto">
            Bugun A'zo Bo'ling va Akademik Marralarni Zabt Eting!
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto font-medium leading-relaxed">
            Respublika va xalqaro miqyosdagi akademik musobaqalar ishtirokchisiga aylaning.
          </p>
          <div className="pt-2">
            <Link to="/auth/register">
              <Button size="lg" variant="primary" className="font-black px-8 py-3.5 shadow-xl">
                Ro'yxatdan O'tish
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
