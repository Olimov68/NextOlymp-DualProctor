import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { OlympiadCard } from '../../components/olympiad/OlympiadCard';
import { useOlympiadList } from '../../hooks/useOlympiad';
import { Subject, OlympiadStatus } from '../../types';

export const OlympiadListPage: React.FC = () => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState<Subject | 'all'>('all');
  const [status, setStatus] = useState<OlympiadStatus | 'all'>('all');
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: olympiads, isLoading } = useOlympiadList({
    subject,
    status,
    grade,
    search,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-zinc-950 text-zinc-100">
      
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            {t('olympiads.title') || "Akademik Olimpiadalar"}
          </span>
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">{t('olympiads.subtitle') || "Bilimingizni sinang, bellashing va nufuzli sovrinlarni qo'lga kiriting"}</p>
      </div>

      
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl shadow-black/20 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Musobaqa nomidan izlash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-white/10 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject | 'all')}
            className="w-full p-2.5 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-zinc-950/70 text-zinc-100 transition-all duration-200"
          >
            <option value="all">{t('olympiads.allSubjects') || "Barcha fanlar"}</option>
            <option value="math">Matematika</option>
            <option value="physics">Fizika</option>
            <option value="chemistry">Kimyo</option>
            <option value="biology">Biologiya</option>
            <option value="informatics">Informatika</option>
          </select>

          
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full p-2.5 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-zinc-950/70 text-zinc-100 transition-all duration-200"
          >
            <option value="all">{t('olympiads.allGrades') || "Barcha sinflar"}</option>
            {[5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>{g}-sinf</option>
            ))}
          </select>

          
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OlympiadStatus | 'all')}
            className="w-full p-2.5 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-zinc-950/70 text-zinc-100 transition-all duration-200"
          >
            <option value="all">{t('olympiads.allStatuses') || "Barcha holatlar"}</option>
            <option value="active">🟢 {t('olympiads.active') || "Faol"}</option>
            <option value="upcoming">🟡 {t('olympiads.upcoming') || "Kutilayotgan"}</option>
            <option value="finished">🔴 {t('olympiads.finished') || "Yakunlangan"}</option>
          </select>
        </div>
      </div>

      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-zinc-900/60 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !olympiads || olympiads.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-3">
          <p className="text-base font-semibold text-zinc-100">Musobaqalar topilmadi</p>
          <p className="text-xs text-zinc-400">Filtr parametrlarini o'zgartirib ko'ring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {olympiads.map((o) => (
            <OlympiadCard key={o.id} olympiad={o} />
          ))}
        </div>
      )}
    </div>
  );
};
