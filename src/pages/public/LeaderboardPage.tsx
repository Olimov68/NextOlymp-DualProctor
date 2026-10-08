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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-zinc-950 text-zinc-100">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2 shadow-sm">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Milliy Natijalar va Jonli Reyting</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              {t('leaderboard.title') || "Umummilliy Reyting"}
            </span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">{t('leaderboard.subtitle') || "O'zbekiston bo'ylab eng faol va iqtidorli o'quvchilar ro'yxati"}</p>
        </div>
      </div>

      
      {user && (
        <div className="p-6 sm:p-8 bg-zinc-900/60 backdrop-blur-md text-zinc-100 rounded-2xl shadow-xl shadow-black/20 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="lg" className="border-2 border-emerald-500 shadow-md shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-100">{user.fullName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-black uppercase shadow-xs">
                  Siz
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {user.school || 'Maktab kiritilmagan'} • {user.region || 'Toshkent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">O'rningiz</div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {userEntry ? `#${userEntry.rank}` : 'Top 100+'}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Jami Ball</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {userEntry ? `${userEntry.score} XP` : '0 XP'}
              </div>
            </div>
          </div>
        </div>
      )}

      
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Ism-familiya yoki maktab bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-white/10 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full p-2.5 text-sm border border-white/10 bg-zinc-950/70 text-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200"
          >
            <option value="all">Barcha viloyatlar</option>
            {UZBEKISTAN_REGIONS.map((r) => (
              <option key={r} value={r} className="bg-zinc-900 text-zinc-100">{r}</option>
            ))}
          </select>
        </div>
      </div>

      
      <LeaderboardTable entries={filteredEntries} isLoading={isLoading} />
    </div>
  );
};
