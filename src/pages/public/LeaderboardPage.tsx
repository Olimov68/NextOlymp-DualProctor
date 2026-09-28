import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Search, ShieldCheck } from 'lucide-react';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';

const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg\'ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Qoraqalpog\'iston Respublikasi',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati'
];

export const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: entries, isLoading } = useLeaderboard();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  const filteredEntries = entries?.filter((e) => {
    const matchSearch = e.userName.toLowerCase().includes(search.toLowerCase()) || e.school.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === 'all' || e.region === regionFilter;
    return matchSearch && matchRegion;
  }) || [];

  const userEntry = entries?.find(
    (e) => user && (e.userId === user.id || e.userName.toLowerCase() === (user.fullName || '').toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#0B1120] text-[#F1F5F9]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-bold mb-2">
            <Trophy className="w-4 h-4 text-[#F59E0B]" />
            <span>Milliy Natijalar va Jonli Reyting</span>
          </div>
          <h1 className="text-3xl font-black text-[#F1F5F9] tracking-tight">{t('leaderboard.title') || "Umummilliy Reyting"}</h1>
          <p className="text-[#94A3B8] text-sm">{t('leaderboard.subtitle') || "O'zbekiston bo'ylab eng faol va iqtidorli o'quvchilar ro'yxati"}</p>
        </div>
      </div>

      
      {user && (
        <div className="p-6 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] text-[#F1F5F9] rounded-xl shadow-xl border border-[#1E293B] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="lg" className="border-2 border-[#3B82F6] shadow-md shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#F1F5F9]">{user.fullName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#3B82F6] text-white font-black uppercase">
                  Siz
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                {user.school || 'Maktab kiritilmagan'} • {user.region || 'Toshkent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 relative z-10 border-t md:border-t-0 md:border-l border-[#1E293B] pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">O'rningiz</div>
              <div className="text-2xl font-black text-[#F59E0B]">
                {userEntry ? `#${userEntry.rank}` : 'Top 100+'}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Jami Ball</div>
              <div className="text-2xl font-black text-[#10B981]">
                {userEntry ? `${userEntry.score} XP` : '0 XP'}
              </div>
            </div>
          </div>
        </div>
      )}

      
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Ism-familiya yoki maktab bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[#1E293B] bg-[#0B1120] text-[#F1F5F9] placeholder-[#64748B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full p-2 text-sm border border-[#1E293B] bg-[#0B1120] text-[#F1F5F9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="all">Barcha viloyatlar</option>
            {UZBEKISTAN_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      
      <LeaderboardTable entries={filteredEntries} isLoading={isLoading} />
    </div>
  );
};
