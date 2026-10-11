import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Award,
  Users,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { OlympiadCard } from '../../components/olympiad/OlympiadCard';
import { MentorsSection } from '../../components/home/MentorsSection';
import { useOlympiadList } from '../../hooks/useOlympiad';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { useUserStore } from '../../store/useUserStore';
import { useCountUp } from '../../hooks/useCountUp';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { data: olympiads, isLoading } = useOlympiadList({ status: 'active' });
  const { olympiads: allStoreOlympiads } = useOlympiadStore();
  const { users } = useUserStore();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { data: publicStats } = useQuery({ queryKey: ['public-stats'], queryFn: () =>
    apiClient.get<{ students: number; exams: number; submissions: number; regions: number }>('/public/stats') });
  const rawStudentCount = publicStats?.students ?? 0;
  const rawOlympiadCount = publicStats?.exams ?? 0;
  const rawSubmittedCount = publicStats?.submissions ?? 0;
  const rawRegionCount = publicStats?.regions ?? 0;
  // Animated Count-up values
  const animatedStudents = useCountUp(rawStudentCount);
  const animatedOlympiads = useCountUp(rawOlympiadCount);
  const animatedSubmissions = useCountUp(rawSubmittedCount);
  const animatedRegions = useCountUp(rawRegionCount);

  const subjects = [
    { name: 'Matematika va Mantiq', icon: '∑', desc: 'Algebra, geometriya, kombinatorika va mantiqiy masalalar', color: 'bg-emerald-600 text-white' },
    { name: 'Informatika va Algoritmlar', icon: '</>', desc: 'C++, Python tillarida xalqaro standartdagi algoritmlar', color: 'bg-cyan-600 text-white' },
    { name: 'Biologiya va Anatomiya', icon: '🧬', desc: 'Abu Ali ibn Sino merosi: inson anatomiyasi, genetika va tibbiyot', color: 'bg-teal-600 text-white' },
    { name: 'Kimyo va Molekulyar fanlar', icon: '🧪', desc: 'Organik kimyo, moddalar tuzilishi va laboratoriya asoslari', color: 'bg-indigo-600 text-white' },
  ];

  const steps = [
    { step: '01', title: "Ro'yxatdan O'ting", desc: "Ismingiz, maktabingiz va hududingizni kiritib bepul akkaunt oching." },
    { step: '02', title: "Musobaqani Tanlang", desc: "Matematika, Biologiya yoki Dasturlash yo'nalishidagi olimpiadaga a'zo bo'ling." },
    { step: '03', title: "Proktorlik Nazorati", desc: "Imtihonda yoqilgan kamera va brauzer nazorati qoidalariga amal qiling. Avtomatik aniqlash mutlaq kafolat bermaydi." },
    { step: '04', title: "Sertifikat va Natija", desc: "Sinov yakunlangach, rasmiy QR-kodli verifikatsiyalangan sertifikatni yuklab oling." },
  ];

  const faqs = [
    {
      q: "Ibn Sino platformasida kimlar ishtirok eta oladi?",
      a: "O'zbekiston Respublikasi hamda xalqaro miqyosdagi 5-11 sinf maktab o'quvchilari, akademik litsey talabalari va tibbiyot hamda aniq fanlarga qiziquvchi barcha yoshlar qatnashishlari mumkin."
    },
    {
      q: "Olimpiadalarda qatnashish pullikmi yoki bepul?",
      a: "Ibn Sino nomidagi akademik platformadagi barcha olimpiadalar va saralash sinovlari to'liq bepul (100% Free Open Access) taqdim etiladi. Hech qanday yashirin to'lov talab qilinmaydi."
    },
    {
      q: "Anti-Cheat va Dual Proctoring tizimi qanday ishlaydi?",
      a: "Test topshirish jarayonida sahifadan chiqish (tab switching), brauzer konsolini ochish va nusxalash harakatlari server darajasida qayd etiladi. MediaPipe Face Mesh orqali ko'z va yuz nazorati xolis tekshiriladi."
    },
    {
      q: "Sertifikatlarning haqiqiyligi qanday tekshiriladi?",
      a: "Har bir berilgan sertifikat unikal QR-kod hamda verifikatsiya kodiga ega. 'Sertifikat tekshirish' bo'limida kodni kiritish orqali haqiqiyligini davlat va xalqaro tashkilotlar uchun darhol tasdiqlash mumkin."
    }
  ];

  return (
    <div className="space-y-24 pb-24 bg-[#070b14] text-[#f8fafc] font-sans selection:bg-emerald-500/30">
      
      {/* Cinematic Full-Bleed Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-28 border-b border-white/10">
        {/* Animated Aurora Mesh Backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-emerald-600/18 via-teal-500/12 to-cyan-500/18 blur-[130px] rounded-full animate-aurora" />
          <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-emerald-700/10 blur-[140px] rounded-full animate-float" />
          <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-cyan-700/10 blur-[140px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
          {/* Subtle Cyber / Science Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '48px 48px'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8 animate-fade-in-up">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-xs font-semibold text-emerald-400 backdrop-blur-xl shadow-lg shadow-emerald-500/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>O‘zbekiston bo‘ylab zamonaviy olimpiadalar</span>
          </div>

          {/* Primary H1 */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
              Bilimni sinang.{' '}
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Kelajakni zabt eting.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              IbnSinoSchool — o‘quvchilar, ustozlar va maktablar uchun xavfsiz, shaffof va zamonaviy olimpiada platformasi.
            </p>
          </div>

          {/* Dual Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link to="/olympiads" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto font-extrabold px-8 py-3.5 shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5 transition-all text-sm rounded-xl cursor-pointer"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Olimpiadalarni ko‘rish
              </Button>
            </Link>
            <Link to="/auth/login" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-7 py-3 text-sm font-bold rounded-xl border border-white/12 bg-slate-900/60 hover:bg-slate-800 text-slate-200 transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md backdrop-blur-md"
              >
                <span>Tizimga kirish</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </Link>
          </div>

          {/* Real Statistics Grid with Count-Up Animation */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-12 max-w-5xl mx-auto">
            
            {/* Stat 1: Registered Students */}
            <div className="p-5 rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-white/10 text-left space-y-1 hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-black/20 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">O‘quvchilar</span>
                <Users className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {publicStats ? animatedStudents.toLocaleString() : '—'}
              </div>
              <div className="text-[11px] text-emerald-400/80 font-medium">Faol ro‘yxatdan o‘tgan</div>
            </div>

            {/* Stat 2: Active Competitions */}
            <div className="p-5 rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-white/10 text-left space-y-1 hover:border-teal-500/30 transition-all duration-300 shadow-xl shadow-black/20 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Musobaqalar</span>
                <Trophy className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-teal-300 font-mono">
                {publicStats ? animatedOlympiads : '—'}
              </div>
              <div className="text-[11px] text-teal-400/80 font-medium">Akademik fanlar bo‘yicha</div>
            </div>

            {/* Stat 3: Completed Submissions */}
            <div className="p-5 rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-white/10 text-left space-y-1 hover:border-cyan-500/30 transition-all duration-300 shadow-xl shadow-black/20 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Topshirilgan sinovlar</span>
                <Award className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-cyan-300 font-mono">
                {publicStats ? animatedSubmissions.toLocaleString() : '—'}
              </div>
              <div className="text-[11px] text-cyan-400/80 font-medium">100% Ochiq va bepul</div>
            </div>

            {/* Stat 4: Geographic Coverage */}
            <div className="p-5 rounded-2xl bg-slate-900/65 backdrop-blur-xl border border-white/10 text-left space-y-1 hover:border-indigo-500/30 transition-all duration-300 shadow-xl shadow-black/20 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Qamrov</span>
                <Compass className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-black text-indigo-300 font-mono">
                {rawRegionCount > 0 ? `${animatedRegions} Viloyat` : "Ma'lumot mavjud emas"}
              </div>
              <div className="text-[11px] text-indigo-400/80 font-medium">Respublika miqyosida</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ongoing Competitions Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Jonli musobaqalar</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Faol Akademik Olimpiadalar
            </h2>
          </div>
          <Link to="/olympiads" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
            Barchasini ko‘rish <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-900/60 border border-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {olympiads?.slice(0, 3).map((o) => (
              <OlympiadCard key={o.id} olympiad={o} />
            ))}
          </div>
        )}
      </section>

      {/* Mentors & Academic Faculty Showcase */}
      <MentorsSection />

      {/* Step-by-Step Educational Journey (No payment steps!) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">Qatnashish tartibi</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">4 Oddiy Qadamda Ishtirok Eting</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 space-y-3.5 relative overflow-hidden group hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200"
            >
              <div className="text-3xl font-black text-slate-700 group-hover:text-emerald-400 transition-colors font-mono">
                {st.step}
              </div>
              <h3 className="font-bold text-base text-white">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">{st.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Academic Disciplines / Subjects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Musobaqa Yo‘nalishlari</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium">
            Xalqaro fan standartlari va Abu Ali ibn Sino ilmiy merosiga moslashtirilgan saralash tizimi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subjects.map((sub, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 space-y-3.5 group cursor-pointer"
            >
              <div className={`w-11 h-11 rounded-xl ${sub.color} font-mono text-lg font-bold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                {sub.icon}
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                {sub.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                {sub.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center font-bold border border-emerald-500/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Ko‘p Beriladigan Savollar</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-emerald-500/40 space-y-2 select-none"
            >
              <div className="flex items-center justify-between font-bold text-sm text-white">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-emerald-400' : ''}`} />
              </div>
              {openFaq === idx && (
                <p className="text-xs text-slate-300 pt-3 border-t border-white/10 leading-relaxed font-normal animate-fade-in-up">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-emerald-950/50 via-slate-900/90 to-teal-950/50 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl border border-emerald-500/25 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Bugun Ro‘yxatdan O‘ting va Bilimingizni Namoyon Qiling!
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Respublika va xalqaro miqyosdagi akademik musobaqalar ishtirokchisiga aylaning.
          </p>
          <div className="pt-2">
            <Link to="/auth/register">
              <Button size="lg" variant="primary" className="font-extrabold px-8 py-3.5 shadow-xl shadow-emerald-500/25 hover:-translate-y-0.5 transition-all rounded-xl cursor-pointer">
                Bepul Ro‘yxatdan O‘tish
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
