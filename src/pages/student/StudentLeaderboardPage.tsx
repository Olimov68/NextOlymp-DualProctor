import React, { useState, useMemo } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { useLeaderboardStore } from '../../store/useLeaderboardStore';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/common/Avatar';
import {
  Trophy,
  Search,
  UserCheck,
  ShieldCheck,
  MapPin,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';
import { INITIAL_LEADERBOARD_ENTRIES, LeaderboardUserEntry } from '../../data/initialLeaderboard';
import { submissionService } from '../../services/submissionService';

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

export const StudentLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { entries } = useLeaderboardStore();

  const [scope, setScope] = useState<'national' | 'region' | 'district'>('national');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | number>('all');
  const [limitMode, setLimitMode] = useState<'top20' | 'top50' | 'all'>('top20');

  
  const userEntry: LeaderboardUserEntry | null = useMemo(() => {
    if (!user) return entries[0] || null;

    const matched = entries.find(
      (e) => e.userId === user.id || e.userName.toLowerCase() === user.fullName.toLowerCase()
    );

    if (matched) {
      return matched;
    }

    
    const realSubs = user.id ? submissionService.getUserSubmissions(user.id) : [];
    const testsCount = realSubs.length;
    const userBaseScore = realSubs.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
    const userXP = realSubs.reduce((sum, s) => sum + (Number(s.score) ? Number(s.score) * 10 : 0), 0);
    const accuracy = testsCount > 0 
      ? Math.round(realSubs.reduce((sum, s: any) => sum + (Number(s.percentage) || (s.maxScore ? Math.round((s.score / s.maxScore) * 100) : 0)), 0) / testsCount)
      : 0;

    const userRegion = user.region || 'Toshkent shahri';
    const userDistrict = user.district || 'Mirzo Ulug\'bek tumani';
    const higherNational = entries.filter((e) => e.totalXP > userXP).length;
    const higherRegion = entries.filter((e) => e.region === userRegion && e.totalXP > userXP).length;
    const higherDistrict = entries.filter((e) => e.district === userDistrict && e.totalXP > userXP).length;

    return {
      id: user.id || 'usr-current',
      userId: user.id || 'usr-current',
      userName: user.fullName || 'Foydalanuvchi',
      avatarUrl: user.avatarUrl || '',
      region: userRegion,
      district: userDistrict,
      school: user.school || 'Maktab',
      grade: user.grade || 9,
      baseScore: userBaseScore,
      bonusPoints: 0,
      cheatingPenalty: 0,
      totalXP: userXP,
      accuracyRate: accuracy,
      nationalRank: userXP > 0 ? higherNational + 1 : entries.length + 1,
      regionRank: userXP > 0 ? higherRegion + 1 : higherRegion + 1,
      districtRank: userXP > 0 ? higherDistrict + 1 : higherDistrict + 1,
      testsCompletedCount: testsCount,
      lastActive: 'Hozir'
    };
  }, [user, entries]);

  
  const allEntriesWithUser = useMemo(() => {
    if (!user || !userEntry) return entries;
    const exists = entries.some((e) => e.userId === user.id || e.userName.toLowerCase() === user.fullName.toLowerCase());
    if (exists) return entries;
    if (userEntry.totalXP > 0 || userEntry.testsCompletedCount > 0) {
      return [userEntry, ...entries].sort((a, b) => b.totalXP - a.totalXP);
    }
    return entries;
  }, [entries, user, userEntry]);

  
  const handleScopeChange = (newScope: 'national' | 'region' | 'district') => {
    setScope(newScope);
    if (newScope === 'national') {
      setRegionFilter('all');
      setDistrictFilter('all');
    } else if (newScope === 'region') {
      if (regionFilter === 'all') {
        setRegionFilter(userEntry?.region || 'Toshkent shahri');
      }
      setDistrictFilter('all');
    } else if (newScope === 'district') {
      if (regionFilter === 'all') {
        setRegionFilter(userEntry?.region || 'Toshkent shahri');
      }
      if (districtFilter === 'all') {
        setDistrictFilter(userEntry?.district || 'Yunusobod tumani');
      }
    }
  };

  
  const districtsList = useMemo(() => {
    if (regionFilter === 'all') {
      return Array.from(new Set(allEntriesWithUser.map((e) => e.district))).sort();
    }
    return Array.from(
      new Set(allEntriesWithUser.filter((e) => e.region === regionFilter).map((e) => e.district))
    ).sort();
  }, [allEntriesWithUser, regionFilter]);

  
  const filteredEntries = useMemo(() => {
    let list = allEntriesWithUser.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        e.userName.toLowerCase().includes(q) ||
        e.school.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        e.district.toLowerCase().includes(q);

      const matchRegion = regionFilter === 'all' || e.region === regionFilter;
      const matchDistrict = districtFilter === 'all' || e.district === districtFilter;
      const matchGrade = gradeFilter === 'all' || e.grade === Number(gradeFilter);

      return matchSearch && matchRegion && matchDistrict && matchGrade;
    });

    
    list.sort((a, b) => b.totalXP - a.totalXP);

    
    if (limitMode === 'top20' && !search) {
      return list.slice(0, 20);
    } else if (limitMode === 'top50' && !search) {
      return list.slice(0, 50);
    }

    return list;
  }, [allEntriesWithUser, search, regionFilter, districtFilter, gradeFilter, limitMode]);

  
  const handleExportExcel = () => {
    const exportData = filteredEntries.map((e, idx) => ({
      'O\'rin': idx + 1,
      'Respublika O\'rni': e.nationalRank,
      'Viloyat O\'rni': e.regionRank,
      'Tuman O\'rni': e.districtRank,
      'Ishtirokchi (F.I.Sh.)': e.userName,
      'Viloyat': e.region,
      'Tuman': e.district,
      'Maktab': e.school,
      'Sinf': `${e.grade}-sinf`,
      'Asosiy Ball': e.baseScore,
      'Bonus Ball': e.bonusPoints,
      'Jarima': e.cheatingPenalty,
      'Jami XP': e.totalXP,
      'Aniqlik': `${e.accuracyRate}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reyting');
    XLSX.writeFile(workbook, `Next_Olymp_Reyting_${scope}.xlsx`);
  };

  return (
    <div className="space-y-6">
        
        {userEntry && (
          <div className="p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white rounded-3xl shadow-xl border border-cyan-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <Avatar name={userEntry.userName} src={userEntry.avatarUrl} size="lg" className="border-2 border-cyan-400 shadow-md shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Sizning Shaxsiy Ko'rsatkichlaringiz
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Anti-Cheat Tasdiqlangan
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{userEntry.userName}</h3>
                <p className="text-xs text-blue-200 font-medium">
                  {userEntry.school} • {userEntry.district}, {userEntry.region} • <span className="text-amber-300 font-bold">{userEntry.grade}-sinf</span>
                </p>
              </div>
            </div>

            
            <div className="flex items-center gap-4 relative z-10 bg-blue-900/60 p-4 rounded-2xl border border-blue-700/60 backdrop-blur-xs shrink-0 w-full md:w-auto justify-around text-center">
              <div>
                <div className="text-xl font-black text-amber-400 font-mono">#{userEntry.nationalRank}</div>
                <div className="text-[9px] text-blue-200 font-extrabold uppercase">Respublika</div>
              </div>
              <div className="w-px h-8 bg-blue-700/80" />
              <div>
                <div className="text-xl font-black text-blue-300 font-mono">#{userEntry.regionRank}</div>
                <div className="text-[9px] text-blue-200 font-extrabold uppercase">Viloyat ({userEntry.region})</div>
              </div>
              <div className="w-px h-8 bg-blue-700/80" />
              <div>
                <div className="text-xl font-black text-purple-300 font-mono">#{userEntry.districtRank}</div>
                <div className="text-[9px] text-blue-200 font-extrabold uppercase">Tuman ({userEntry.district})</div>
              </div>
              <div className="w-px h-8 bg-blue-700/80" />
              <div>
                <div className="text-xl font-black text-emerald-400 font-mono">{userEntry.totalXP.toLocaleString()} XP</div>
                <div className="text-[9px] text-emerald-300 font-extrabold uppercase">Umumiy Ball</div>
              </div>
            </div>
          </div>
        )}

        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Ism-familiyasini yozing (masalan: Jamila Karimova, Bekzod Nazarov, Jasur)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-amber-400 text-white font-medium"
              />
            </div>

            
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setDistrictFilter('all');
              }}
              className="w-full sm:w-52 p-2 text-xs border border-slate-800 rounded-xl bg-slate-950 font-bold text-blue-300 outline-none focus:border-amber-400"
            >
              <option value="all">{scope === 'region' ? "⚠️ Viloyatni tanlang..." : "Barcha viloyatlar"}</option>
              {UZBEKISTAN_REGIONS.map((r: string) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            
            {(scope === 'district' || regionFilter !== 'all') && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full sm:w-48 p-2 text-xs border border-slate-800 rounded-xl bg-slate-950 font-bold text-purple-300 outline-none focus:border-amber-400"
              >
                <option value="all">{scope === 'district' ? "⚠️ Tumanni tanlang..." : "Barcha tumanlar"}</option>
                {districtsList.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full sm:w-36 p-2 text-xs border border-slate-800 rounded-xl bg-slate-950 font-bold text-white outline-none focus:border-amber-400"
            >
              <option value="all">Barcha sinflar</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>

            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
              title="Excel formatda yuklash"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        
        <div className="w-full overflow-x-auto custom-scrollbar rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-extrabold tracking-wider border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-4 py-3.5 text-center w-16">
                  {scope === 'national'
                    ? "№ Respublika"
                    : scope === 'region'
                    ? `№ Viloyat (${regionFilter === 'all' ? 'Toshkent' : regionFilter})`
                    : `№ Tuman (${districtFilter === 'all' ? 'Yunusobod' : districtFilter})`}
                </th>
                <th className="px-4 py-3.5">Ishtirokchi (F.I.Sh.)</th>
                <th className="px-4 py-3.5">Sinf & Maktab</th>
                <th className="px-4 py-3.5">Viloyat va Tuman</th>
                <th className="px-4 py-3.5 text-right">Asosiy Ball</th>
                <th className="px-4 py-3.5 text-right">Bonus (+XP)</th>
                <th className="px-4 py-3.5 text-right">Cheating Jarimasi (-XP)</th>
                <th className="px-4 py-3.5 text-right">Jami XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="text-base font-bold text-white">Hozircha ishtirokchilar mavjud emas</div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Olimpiadalarda ishtirok etib, ball to'plang va birinchilardan bo'lib umummilliy reytingdan joy oling!
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const scopeRank = idx + 1;
                  const isTop1 = scopeRank === 1;
                  const isTop2 = scopeRank === 2;
                  const isTop3 = scopeRank === 3;
                  const isCurrentUser = user && (user.id === entry.userId || user.fullName.toLowerCase().includes(entry.userName.toLowerCase()));
                  const isSearchedTarget = search && entry.userName.toLowerCase().includes(search.toLowerCase());

                  return (
                    <tr
                      key={entry.id}
                      className={clsx(
                        "transition-colors",
                        isSearchedTarget
                          ? "bg-amber-900/40 border-2 border-amber-400 font-extrabold"
                          : isCurrentUser
                          ? "bg-cyan-950/60 border-2 border-cyan-500 font-bold"
                          : isTop1
                          ? "bg-amber-950/20 hover:bg-amber-950/40"
                          : isTop2
                          ? "bg-slate-900 hover:bg-slate-800"
                          : isTop3
                          ? "bg-amber-900/10 hover:bg-amber-900/20"
                          : "hover:bg-slate-800/60"
                      )}
                    >
                      
                      <td className="px-4 py-3 text-center font-bold text-xs whitespace-nowrap">
                        {isTop1 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-xs">1 🥇</span>
                        ) : isTop2 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-300 text-slate-950 font-black text-xs shadow-xs">2 🥈</span>
                        ) : isTop3 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-700 text-white font-black text-xs shadow-xs">3 🥉</span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{scopeRank}</span>
                        )}
                      </td>

                      
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={entry.userName} src={entry.avatarUrl} size="md" className="shrink-0" />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{entry.userName}</span>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded bg-cyan-600 text-white text-[9px] font-black uppercase">Siz</span>
                              )}
                              {isSearchedTarget && (
                                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">Qidirildi</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{entry.accuracyRate}% aniqlik · {entry.testsCompletedCount} ta olimpiada</div>
                          </div>
                        </div>
                      </td>

                      
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {entry.grade}-sinf
                          </span>
                          <span className="text-slate-300 truncate max-w-[160px]">{entry.school}</span>
                        </div>
                      </td>

                      
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-300">{entry.region}</div>
                        <div className="text-[10px] text-slate-400">{entry.district}</div>
                      </td>

                      
                      <td className="px-4 py-3 text-right font-mono font-bold text-blue-400 whitespace-nowrap">
                        {entry.baseScore.toLocaleString()} XP
                      </td>

                      
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        +{entry.bonusPoints.toLocaleString()} XP
                      </td>

                      
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        {entry.cheatingPenalty > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-black">
                            -{entry.cheatingPenalty.toLocaleString()} XP ⚠️
                          </span>
                        ) : (
                          <span className="text-slate-500">0 XP</span>
                        )}
                      </td>

                      
                      <td className="px-4 py-3 text-right font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                        {entry.totalXP.toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
  );
};
