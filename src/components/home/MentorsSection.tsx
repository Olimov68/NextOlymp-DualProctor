import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Trophy,
  BookOpen,
  Target,
  Sparkles,
  Phone,
  Send,
  CheckCircle2,
  X,
  ChevronRight,
  Flame,
  ArrowRight,
  Calendar,
  Building2,
  Users,
  Eye,
  Maximize2
} from 'lucide-react';

export interface MentorCredential {
  emoji: string;
  title: string;
  subtitle?: string;
}

export interface Mentor {
  id: string;
  nameFirst: string;
  nameLast: string;
  nameLastBadgeBg?: string;
  subject: string;
  subjectBadge: string;
  center: string;
  imagePoster: string;
  tagline: string;
  description: string;
  experienceYears: number;
  rating: string;
  credentials: MentorCredential[];
  goals: string[];
  targetUniversities: string[];
  telegramUsername: string;
  phone: string;
  status: 'active' | 'upcoming';
}

// 3. Kelgusida boshqa ustozlarni (Biologiya, Tibbiyot, Matematika) osongina qo'shish uchun ma'lumotlar massivi:
export const mentors: Mentor[] = [
  {
    id: 'shahzod-chorshanbiyev',
    nameFirst: 'Shahzod',
    nameLast: 'Chorshanbiyev',
    nameLastBadgeBg: 'bg-[#FACC15] text-zinc-950',
    subject: 'Kimyo fani ustozi',
    subjectBadge: 'KIMYO',
    center: "KVADRAT o'quv markazi",
    imagePoster: '/images/shahzod_chorshanbiyev.png',
    tagline: "Kelajak shifokorlari va olimpiada g'oliblari uchun",
    description: "Tibbiyot institutlariga maqsadli tayyorgarlik, BMBA Milliy sertifikatidan A+ daraja hamda kimyo olimpiadalarida g'oliblikka erishish uchun maxsus ishlab chiqilgan mualliflik metodikasi.",
    experienceYears: 8,
    rating: 'A+ (Maksimal)',
    credentials: [
      {
        emoji: '📚',
        title: 'Kimyo fani o‘qituvchisi',
        subtitle: 'Nazariya, stexiometriya va organik kimyo bo‘yicha fundamental bilimlar'
      },
      {
        emoji: '💪',
        title: '8 yillik tajriba',
        subtitle: 'Yuzlab talabalarni OTM talabasiga aylantirgan amaliy tajriba'
      },
      {
        emoji: '🎯',
        title: 'A+ sertifikat sohibi',
        subtitle: 'BMBA Rasch logit tizimida 75/75 maksimal ko‘rsatkich sohibi'
      },
      {
        emoji: '🏆',
        title: 'Xalqaro olimpiada g‘olibi',
        subtitle: 'Xalqaro va Respublika miqyosidagi nufuzli musobaqalar laureati'
      }
    ],
    goals: [
      "Kimyo fanini 0 dan boshlab mukammal o'rganish",
      "Milliy sertifikatdan A yoki A+ daraja olish",
      "Tibbiyot institutlariga kirish va kelajakda malakali shifokor bo'lish"
    ],
    targetUniversities: [
      'Toshkent Tibbiyot Akademiyasi (TMA)',
      'Pediatriya Tibbiyot Instituti (SAMPI)',
      'Samarqand Davlat Tibbiyot Universiteti (SamDTU)',
      'Akademik Litseylar & Xalqaro Universitetlar'
    ],
    telegramUsername: 'Kvadrat_admin',
    phone: '+998 (90) 123-45-67',
    status: 'active'
  },
  {
    id: 'biologiya-ustoz',
    nameFirst: 'Biologiya',
    nameLast: '& Genetika',
    nameLastBadgeBg: 'bg-emerald-400 text-zinc-950',
    subject: 'Biologiya va Anatomiya ustozi',
    subjectBadge: 'BIOLOGIYA',
    center: "KVADRAT o'quv markazi",
    imagePoster: '/images/shahzod_chorshanbiyev.png',
    tagline: "Genetika, sitologiya va inson anatomiyasi chuqurlashtirilgan kursi",
    description: "Tibbiyot oliygohlari kirish imtihonlari hamda biologiya bo'yicha Milliy sertifikat sinovlariga kompleks tayyorgarlik kursi.",
    experienceYears: 6,
    rating: 'A+ (98% Natija)',
    credentials: [
      {
        emoji: '🧬',
        title: 'Biologiya va Tibbiyot ustozi',
        subtitle: 'Genetika, embriologiya va inson fiziologiyasi bo‘yicha ekspert'
      },
      {
        emoji: '💪',
        title: '6 yillik tajriba',
        subtitle: 'Respublika tibbiyot litseylari va OTMlariga tayyorlash tajribasi'
      },
      {
        emoji: '🎯',
        title: 'A+ sertifikat sohibi',
        subtitle: 'BMBA yangi standartidagi situatsion testlar bo‘yicha mutaxassis'
      },
      {
        emoji: '🏆',
        title: 'Olimpiada murabbiyi',
        subtitle: 'Shahar va Respublika bosqichi g‘oliblari yetishtirgan murabbiy'
      }
    ],
    goals: [
      "Biologiya fanini 0 dan boshlab anatomiya va genetikagacha o'zlashtirish",
      "BMBA Milliy sertifikatidan A yoki A+ darajaga erishish",
      "Tibbiyot oliygohlariga 100% davlat granti asosida qabul qilinish"
    ],
    targetUniversities: [
      'Toshkent Tibbiyot Akademiyasi (TMA)',
      'Pediatriya Tibbiyot Instituti (SAMPI)',
      'Farmatsevtika Instituti (ToshFARMI)',
      'Buxoro Davlat Tibbiyot Instituti'
    ],
    telegramUsername: 'Kvadrat_admin',
    phone: '+998 (90) 123-45-67',
    status: 'upcoming'
  },
  {
    id: 'matematika-ustoz',
    nameFirst: 'Oliy',
    nameLast: 'Matematika',
    nameLastBadgeBg: 'bg-teal-400 text-zinc-950',
    subject: 'Matematika va Algebra ustozi',
    subjectBadge: 'MATEMATIKA',
    center: "KVADRAT o'quv markazi",
    imagePoster: '/images/shahzod_chorshanbiyev.png',
    tagline: "Aniq fanlar, olimpiada masalalari va mantiqiy fikrlash kursi",
    description: "Algebra, geometriya, kombinatorika va xalqaro olimpiada standartidagi nostandart masalalarni tezkor yechish uslublari.",
    experienceYears: 9,
    rating: 'A+ (Olimpiada)',
    credentials: [
      {
        emoji: '📐',
        title: 'Oliy matematika o‘qituvchisi',
        subtitle: 'Murakkab tenglamalar, parametrli masalalar va stereometriya'
      },
      {
        emoji: '💪',
        title: '9 yillik tajriba',
        subtitle: 'O‘zbekiston va xalqaro OTMlar grantiga kirish ko‘rsatkichi'
      },
      {
        emoji: '🎯',
        title: 'A+ sertifikat sohibi',
        subtitle: 'Ochiq va yopiq testlarda 100% to‘g‘ri javob strategiyasi'
      },
      {
        emoji: '🏆',
        title: 'Matematika olimpiadasi g‘olibi',
        subtitle: 'Al-Xorazmiy va Beruniy olimpiadalari sovrindori'
      }
    ],
    goals: [
      "Matematikadan har qanday murakkablikdagi masalalarni erkin yechish",
      "Milliy sertifikatdan eng yuqori A+ darajaga erishish",
      "Nufuzli texnika va xalqaro universitetlar grantini qo'lga kiritish"
    ],
    targetUniversities: [
      'O‘zbekiston Milliy Universiteti (O‘zMU)',
      'INHA, Turin, AKFA & Westminster Universitetlari',
      'Toshkent Axborot Texnologiyalari Universiteti (TATU)'
    ],
    telegramUsername: 'Kvadrat_admin',
    phone: '+998 (90) 123-45-67',
    status: 'upcoming'
  }
];

export const MENTORS_LIST = mentors;

export const MentorsSection: React.FC = () => {
  const [activeMentorId, setActiveMentorId] = useState<string>(mentors[0].id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPosterZoomOpen, setIsPosterZoomOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  // Modal form states
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [targetGoal, setTargetGoal] = useState("Milliy sertifikatdan A yoki A+ daraja olish");
  const [studyFormat, setStudyFormat] = useState<'offline' | 'online'>('offline');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const activeMentor = mentors.find((m) => m.id === activeMentorId) || mentors[0];

  const handleOpenRegistration = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsModalOpen(true);
    setSubmittedSuccess(false);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || phone.trim().length < 9) return;

    try {
      const existing = JSON.parse(localStorage.getItem('ibnsino_course_applications') || '[]');
      existing.push({
        id: 'app-' + Date.now(),
        mentorName: `${selectedMentor?.nameFirst} ${selectedMentor?.nameLast}`,
        mentorSubject: selectedMentor?.subject,
        center: selectedMentor?.center,
        studentName,
        phone,
        targetGoal,
        studyFormat,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('ibnsino_course_applications', JSON.stringify(existing));
    } catch (err) {
      console.warn('Could not save application locally', err);
    }

    setSubmittedSuccess(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative">
      {/* Background ambient gradient */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 backdrop-blur-md">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>Bizning Ustozlar & Kursga Yozilish</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
          Respublika va Xalqaro Marralar Uchun <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Yetakchi Ustozlar</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
          Tibbiyot oliygohlariga kirish, Milliy sertifikatdan A+ olish va nufuzli fan olimpiadalarida g'olib bo'lish uchun KVADRAT o'quv markazi tajribali ustozlari bilan 0 dan boshlang.
        </p>

        {/* Dynamic Mentor Selector Tabs */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md gap-1.5 mt-2">
          {mentors.map((m) => {
            const isActive = m.id === activeMentor.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMentorId(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                <span>{m.subjectBadge === 'KIMYO' ? '🧪' : m.subjectBadge === 'BIOLOGIYA' ? '🧬' : '📐'}</span>
                <span>{m.nameFirst} ({m.subjectBadge})</span>
                {m.status === 'upcoming' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">Yangi</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mentor Card Spotlight (Tailored exactly to user's uploaded banner) */}
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Column: Teacher Banner Card with full real portrait */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="relative group w-full max-w-[480px] rounded-3xl overflow-hidden p-2 bg-gradient-to-b from-emerald-500/30 via-white/10 to-teal-500/20 shadow-2xl shadow-emerald-500/15">
              
              <div className="w-full rounded-2xl overflow-hidden bg-zinc-950 relative">
                {/* Official poster image uploaded by user */}
                <img
                  src={activeMentor.imagePoster}
                  alt={`${activeMentor.nameFirst} ${activeMentor.nameLast} - ${activeMentor.subject}`}
                  className="w-full h-auto object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
                  onClick={() => setIsPosterZoomOpen(true)}
                />

                {/* Bottom Overlay Bar */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-3 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-100">{activeMentor.center}</span>
                  </div>

                  <button
                    onClick={() => setIsPosterZoomOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Plakatni ko'rish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="w-full max-w-[480px] grid grid-cols-2 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-zinc-400 block">Tajriba</span>
                <span className="text-base font-black text-emerald-400 font-mono">{activeMentor.experienceYears} Yil</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 shadow-sm">
                <span className="text-[11px] uppercase font-bold text-zinc-400 block">Sertifikat</span>
                <span className="text-base font-black text-amber-400 font-mono">{activeMentor.rating}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Branded Typography matching the Poster, 4 Achievement Pills, Goals & CTA */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Branded Title matching user's poster */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {/* Green KIMYO badge with yellow rays */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#22c55e] text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30">
                  <span>{activeMentor.subjectBadge}</span>
                  <span className="text-amber-900 text-xs font-bold">✨</span>
                </div>

                <div className="px-3 py-1 rounded-full text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20">
                  {activeMentor.center}
                </div>
              </div>

              {/* Two-tone prominent name matching poster */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {activeMentor.nameFirst}
                </span>
                <span className={`text-2xl sm:text-3xl lg:text-4xl font-black px-4 py-1 rounded-2xl ${activeMentor.nameLastBadgeBg || 'bg-[#FACC15] text-zinc-950'} shadow-md tracking-tight`}>
                  {activeMentor.nameLast}
                </span>
              </div>

              {/* Katta jozibador sarlavha */}
              <h3 className="text-xl sm:text-2xl font-black text-zinc-200 tracking-tight leading-snug pt-1">
                {activeMentor.tagline}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {activeMentor.description}
              </p>
            </div>

            {/* 4 Asosiy Yutuq Kartochkasi (Exactly matching user's image pills) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeMentor.credentials.map((cred, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-3.5 group shadow-md"
                >
                  <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    {cred.emoji}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors leading-snug">
                      {cred.title}
                    </h4>
                    {cred.subtitle && (
                      <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {cred.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Kursning Asosiy Maqsadlari & Da'vat */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-zinc-950/80 border border-emerald-500/20 space-y-2.5">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                Kursning Asosiy Maqsadlari & Da'vat:
              </span>
              <div className="space-y-2">
                {activeMentor.goals.map((goal, gIdx) => (
                  <div key={gIdx} className="flex items-center gap-2.5 text-xs text-zinc-200 font-semibold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Universities Pill List */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Maqsadli Yo'nalishlar & OTMlar:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeMentor.targetUniversities.map((uni, uIdx) => (
                  <span
                    key={uIdx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-white/10 text-[11px] font-semibold text-zinc-300"
                  >
                    {uni}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons: Kursga yozilish */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => handleOpenRegistration(activeMentor)}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Kursga ro'yxatdan o'tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://t.me/${activeMentor.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-teal-400" />
                <span>Telegram orqali bog'lanish (@{activeMentor.telegramUsername})</span>
              </a>
            </div>

            <p className="text-[11px] text-zinc-500 italic">
              * Darslar kichik saralangan guruhlarda va har bir o'quvchiga individual yondashuv asosida KVADRAT o'quv markazida olib boriladi.
            </p>
          </div>
        </div>
      </div>

      {/* Poster Zoom Modal */}
      {isPosterZoomOpen && (
        <div
          onClick={() => setIsPosterZoomOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
            <button
              onClick={() => setIsPosterZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-950/80 text-white hover:bg-zinc-800 z-10 border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeMentor.imagePoster}
              alt={activeMentor.nameFirst}
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Interactive Modal: Kursga Yozilish */}
      {isModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                  {selectedMentor.center}
                </span>
                <h3 className="text-lg font-black text-zinc-100">
                  {selectedMentor.nameFirst} {selectedMentor.nameLast} Kursiga Yozilish
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-100">Arizangiz Muvaffaqiyatli Qabul Qilindi!</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Tez orada <strong>{selectedMentor.center}</strong> ma'murlari siz bilan bog'lanib, test sinovi va dars jadvali haqida batafsil ma'lumot beradi.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`https://t.me/${selectedMentor.telegramUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram orqali ma'lumot olish</span>
                  </a>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-zinc-300 font-bold text-xs cursor-pointer"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
                
                {/* Mentor Quick Banner in Modal */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                    {selectedMentor.subjectBadge}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-zinc-100 block">{selectedMentor.nameFirst} {selectedMentor.nameLast}</span>
                    <span className="text-[11px] text-zinc-400 block">{selectedMentor.subject} • {selectedMentor.center}</span>
                  </div>
                </div>

                {/* Full name input */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                    O'quvchi F.I.Sh (Ism va Familiya) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Azizbek Aliyev"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Phone input */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                    Telefon Raqamingiz *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Target goal select */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                    Asosiy Maqsadingiz
                  </label>
                  <select
                    value={targetGoal}
                    onChange={(e) => setTargetGoal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Milliy sertifikatdan A yoki A+ daraja olish" className="bg-zinc-900">
                      Milliy sertifikatdan A yoki A+ daraja olish
                    </option>
                    <option value="Tibbiyot institutlariga kirish (Davlat granti)" className="bg-zinc-900">
                      Tibbiyot institutlariga kirish (Davlat granti)
                    </option>
                    <option value="Respublika va Xalqaro olimpiadalarga tayyorgarlik" className="bg-zinc-900">
                      Respublika va Xalqaro olimpiadalarga tayyorgarlik
                    </option>
                    <option value="Kimyo fanini 0 dan boshlab mukammal o'rganish" className="bg-zinc-900">
                      Kimyo fanini 0 dan boshlab mukammal o'rganish
                    </option>
                  </select>
                </div>

                {/* Study format toggle */}
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                    Ta'lim Formati
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStudyFormat('offline')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        studyFormat === 'offline'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Oflayn (Markazda)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudyFormat('online')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        studyFormat === 'online'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Onlayn (Masofaviy)
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-zinc-400 hover:text-white font-bold cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    Arizani Yuborish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default MentorsSection;
