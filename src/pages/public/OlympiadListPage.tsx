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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#0B1120] text-[#F1F5F9]">
      
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#F1F5F9] tracking-tight">{t('olympiads.title') || "Akademik Olimpiadalar"}</h1>
        <p className="text-[#94A3B8] text-sm">{t('olympiads.subtitle') || "Bilimingizni sinang, bellashing va nufuzli sovrinlarni qo'lga kiriting"}</p>
      </div>

      
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Musobaqa nomidan izlash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#1E293B] bg-[#0B1120] text-[#F1F5F9] placeholder-[#64748B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject | 'all')}
            className="w-full p-2 text-sm border border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-[#0B1120] text-[#F1F5F9]"
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
            className="w-full p-2 text-sm border border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-[#0B1120] text-[#F1F5F9]"
          >
            <option value="all">{t('olympiads.allGrades') || "Barcha sinflar"}</option>
            {[5, 6, 7, 8, 9, 10, 11].map((g) => (
              <option key={g} value={g}>{g}-sinf</option>
            ))}
          </select>

          
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OlympiadStatus | 'all')}
            className="w-full p-2 text-sm border border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-[#0B1120] text-[#F1F5F9]"
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
            <div key={i} className="h-80 bg-[#111827] border border-[#1E293B] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !olympiads || olympiads.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-[#1E293B] rounded-xl space-y-3">
          <p className="text-base font-semibold text-[#F1F5F9]">Musobaqalar topilmadi</p>
          <p className="text-xs text-[#94A3B8]">Filtr parametrlarini o'zgartirib ko'ring.</p>
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
