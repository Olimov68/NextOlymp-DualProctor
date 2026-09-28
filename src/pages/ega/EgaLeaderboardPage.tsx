import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useLeaderboardStore } from '../../store/useLeaderboardStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { LeaderboardUserEntry } from '../../data/initialLeaderboard';
import { clsx } from 'clsx';
import {
  Trophy,
  ShieldAlert,
  Search,
  FileSpreadsheet,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Building,
  X,
  Users,
  UserSearch
} from 'lucide-react';
import * as XLSX from 'xlsx';

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

export const EgaLeaderboardPage: React.FC = () => {
  const { entries, applyCheatingPenalty, awardBonusPoints } = useLeaderboardStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [scope, setScope] = useState<'national' | 'region' | 'district'>('national');

  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [limitMode, setLimitMode] = useState<'top20' | 'all'>('top20');

  
  const [lookupQuery, setLookupQuery] = useState('');

  
  const [penaltyModalUser, setPenaltyModalUser] = useState<LeaderboardUserEntry | null>(null);
  const [bonusModalUser, setBonusModalUser] = useState<LeaderboardUserEntry | null>(null);

  const [penaltyXP, setPenaltyXP] = useState<number>(300);
  const [penaltyReason, setPenaltyReason] = useState('Proktorining qoida buzilishi (Tab switch / Cheating)');

  const [bonusXP, setBonusXP] = useState<number>(200);
  const [bonusReason, setBonusReason] = useState('Olimpiadada 1-o\'rin va 95%+ yuqori aniqlik ko\'rsatgani uchun');

  
  const districtsList = useMemo(() => {
    if (selectedRegion === 'all') {
      return Array.from(new Set(entries.map((e) => e.district))).sort();
    }
    return Array.from(
      new Set(entries.filter((e) => e.region === selectedRegion).map((e) => e.district))
    ).sort();
  }, [entries, selectedRegion]);

  
  const lookupResult = useMemo(() => {
    if (!lookupQuery.trim()) return null;
    const q = lookupQuery.toLowerCase().trim();
    return entries.find(
      (e) => e.userName.toLowerCase().includes(q) || e.userId.toLowerCase() === q
    );
  }, [entries, lookupQuery]);

  
  const handleScopeChange = (newScope: 'national' | 'region' | 'district') => {
    setScope(newScope);
    if (newScope === 'national') {
      setSelectedRegion('all');
      setSelectedDistrict('all');
    } else if (newScope === 'region') {
      if (selectedRegion === 'all') {
        setSelectedRegion('Toshkent shahri');
      }
      setSelectedDistrict('all');
    } else if (newScope === 'district') {
      if (selectedRegion === 'all') {
        setSelectedRegion('Toshkent shahri');
      }
      if (selectedDistrict === 'all') {
        const available = entries.filter((e) => e.region === 'Toshkent shahri').map((e) => e.district);
        setSelectedDistrict(available[0] || 'Yunusobod tumani');
      }
    }
  };

  
  const filteredEntries = useMemo(() => {
    let list = entries.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        e.userName.toLowerCase().includes(q) ||
        e.school.toLowerCase().includes(q) ||
        e.district.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q);

      const matchesRegion = selectedRegion === 'all' || e.region === selectedRegion;
      const matchesDistrict = selectedDistrict === 'all' || e.district === selectedDistrict;
      const matchesGrade = selectedGrade === 'all' || e.grade === Number(selectedGrade);

      return matchesSearch && matchesRegion && matchesDistrict && matchesGrade;
    });

    
    list.sort((a, b) => b.totalXP - a.totalXP);

    
    if (limitMode === 'top20' && !searchTerm && !lookupQuery) {
      return list.slice(0, 20);
    }

    return list;
  }, [entries, searchTerm, selectedRegion, selectedDistrict, selectedGrade, limitMode, lookupQuery]);

  
  const totalCount = entries.length;
  const topXP = entries[0]?.totalXP || 0;
  const totalBonusSum = entries.reduce((s, e) => s + e.bonusPoints, 0);
  const totalPenaltySum = entries.reduce((s, e) => s + e.cheatingPenalty, 0);

  
  const handleExportExcel = () => {
    const exportData = filteredEntries.map((e, idx) => ({
      '№ (O\'rin)': idx + 1,
      'Respublika O\'rni': e.nationalRank,
      'Viloyat O\'rni': e.regionRank,
      'Tuman O\'rni': e.districtRank,
      'Ishtirokchi (F.I.Sh.)': e.userName,
      'Viloyat': e.region,
      'Tuman': e.district,
      'Maktab': e.school,
      'Sinf': `${e.grade}-sinf`,
      'Asosiy Ball (XP)': e.baseScore,
      'Bonus Ball (+XP)': e.bonusPoints,
      'Cheating Jarimasi (-XP)': e.cheatingPenalty,
      'Jami Umumiy XP': e.totalXP,
      'Aniqlik foizi': `${e.accuracyRate}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'REYTINGLAR');
    XLSX.writeFile(workbook, `Oquvchilar_Reytingi_${scope}.xlsx`);
  };

  
  const handlePenaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyModalUser) return;
    applyCheatingPenalty(penaltyModalUser.id, Number(penaltyXP), penaltyReason);
    setPenaltyModalUser(null);
  };

  
  const handleBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusModalUser) return;
    awardBonusPoints(bonusModalUser.id, Number(bonusXP), bonusReason);
    setBonusModalUser(null);
  };

  return (
    <EgaLayout>
      <div className="space-y-4 font-sans text-xs">
        
        <div
          className={clsx(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border shadow-sm transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h1 className={clsx("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <Trophy className="w-4 h-4 text-amber-400" />
              {t("O'quvchilar Reytingi Boshqaruvi (Top 20+ Natijalar)")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Respublika, viloyat va tumanlar kesimida haqqoniy reyting ballari (XP), bonuslar va jarimalar boshqaruvi")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da reytingni yuklash")}</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={clsx("p-3.5 rounded-xl border shadow-xs flex items-center gap-3", isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200")}>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Reytingdagi O'quvchilar")}</div>
              <div className="text-lg font-black text-white mt-0.5 font-mono">{totalCount} {t("kishi")}</div>
            </div>
          </div>

          <div className={clsx("p-3.5 rounded-xl border shadow-xs flex items-center gap-3", isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200")}>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Lider Ball (Max XP)")}</div>
              <div className="text-lg font-black text-amber-400 mt-0.5 font-mono">{topXP.toLocaleString()} XP</div>
            </div>
          </div>

          <div className={clsx("p-3.5 rounded-xl border shadow-xs flex items-center gap-3", isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200")}>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Jami Berilgan Bonuslar")}</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">+{totalBonusSum.toLocaleString()} XP</div>
            </div>
          </div>

          <div className={clsx("p-3.5 rounded-xl border shadow-xs flex items-center gap-3", isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200")}>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Cheating Jarimalari")}</div>
              <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">-{totalPenaltySum.toLocaleString()} XP</div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "p-4 rounded-2xl border space-y-3 transition-colors bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border-blue-500/40"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <UserSearch className="w-4 h-4 text-cyan-400" />
                <span>{t("🔍 Ishtirokchini Ism-Familiyasi Bo'yicha Qidirish va O'rnini Aniqlash")}</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t("Ism-familiyani yozing — tizim zudlik bilan uning Respublika, Viloyat va Tuman reytingidagi haqiqiy o'rnini ko'rsatadi:")}
              </p>
            </div>
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-cyan-400" />
            <input
              type="text"
              placeholder={t("O'quvchi F.I.Sh. yoki ID raqamini kiriting (masalan: Alimov Sardorbek, Jamila Karimova)...")}
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none border font-bold bg-[#091024] border-cyan-500/50 text-white placeholder:text-slate-400 shadow-md"
            />
          </div>

          
          {lookupResult && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-400/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <img
                  src={lookupResult.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={lookupResult.userName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 shrink-0"
                />
                <div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{lookupResult.userName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-400/40">
                      {lookupResult.grade}-sinf
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-semibold mt-0.5">
                    {lookupResult.school} • {lookupResult.district}, {lookupResult.region}
                  </div>
                </div>
              </div>

              
              <div className="flex items-center gap-4 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 text-center font-mono">
                <div>
                  <div className="text-sm font-black text-amber-400">#{lookupResult.nationalRank}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-sans">Respublika</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div>
                  <div className="text-sm font-black text-blue-400">#{lookupResult.regionRank}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-sans">Viloyat ({lookupResult.region})</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div>
                  <div className="text-sm font-black text-purple-300">#{lookupResult.districtRank}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-sans">Tuman ({lookupResult.district})</div>
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div>
                  <div className="text-sm font-black text-emerald-400">{lookupResult.totalXP.toLocaleString()} XP</div>
                  <div className="text-[9px] text-slate-400 uppercase font-sans">Jami XP</div>
                </div>
              </div>
            </div>
          )}
        </div>

        
        <div
          className={clsx(
            "flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-xl border transition-colors",
            isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-100 border-slate-200"
          )}
        >
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar w-full sm:w-auto">
            <button
              onClick={() => handleScopeChange('national')}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
                scope === 'national'
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>🏛️ {t("Respublika Reytingi")}</span>
            </button>

            <button
              onClick={() => handleScopeChange('region')}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
                scope === 'region'
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>🏙️ {t("Viloyat Kesimidagi Reyting")}</span>
            </button>

            <button
              onClick={() => handleScopeChange('district')}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
                scope === 'district'
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              <Building className="w-4 h-4 text-purple-400" />
              <span>🏫 {t("Tuman Kesimidagi Reyting")}</span>
            </button>
          </div>

          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setLimitMode('top20')}
              className={clsx(
                "px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all border",
                limitMode === 'top20'
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-black/20 text-slate-400 border-transparent"
              )}
            >
              ⚡ Top 20
            </button>
            <button
              onClick={() => setLimitMode('all')}
              className={clsx(
                "px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all border",
                limitMode === 'all'
                  ? "bg-indigo-600 text-white border-indigo-400"
                  : "bg-black/20 text-slate-400 border-transparent"
              )}
            >
              📋 Barchasi ({entries.length})
            </button>
          </div>
        </div>

        
        {scope === 'region' && (
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-bold text-blue-200">
                {t("Tanlangan Viloyat Reytingi")}: <span className="text-white underline">{selectedRegion === 'all' ? 'Toshkent shahri' : selectedRegion}</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {t("Pastroqdagi viloyat menyusidan istalgan viloyatni tanlab ko'rishingiz mumkin")}
            </span>
          </div>
        )}

        {scope === 'district' && (
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-bold text-purple-200">
                {t("Tanlangan Tuman Reytingi")}: <span className="text-white underline">{selectedDistrict === 'all' ? 'Yunusobod tumani' : selectedDistrict}</span> ({selectedRegion})
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {t("Pastroqdagi tuman menyusidan istalgan tumanni tanlang")}
            </span>
          </div>
        )}

        
        <div
          className={clsx(
            "flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDistrict('all');
              }}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs outline-none border font-bold text-blue-300",
                isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{scope === 'region' ? t("⚠️ Viloyatni tanlang...") : t("Barcha viloyatlar")}</option>
              {UZBEKISTAN_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            
            {(scope === 'district' || selectedRegion !== 'all') && (
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-xs outline-none border font-bold text-purple-300",
                  isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              >
                <option value="all">{scope === 'district' ? t("⚠️ Tumanni tanlang...") : t("Barcha tumanlar")}</option>
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs outline-none border font-semibold",
                isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{t("Barcha sinflar")}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>
          </div>

          
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("Jadval bo'yicha tezkor filter...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={clsx(
                "w-full rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none border transition-all",
                isDark
                  ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                  : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
              )}
            />
          </div>
        </div>

        
        <div
          className={clsx(
            "rounded-xl border overflow-hidden shadow-sm transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead
                className={clsx(
                  "text-[11px] uppercase tracking-wider border-b font-semibold whitespace-nowrap",
                  isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                <tr>
                  <th className="py-3 px-3.5 w-16 text-center">
                    {scope === 'national'
                      ? "№ Respublika"
                      : scope === 'region'
                      ? `№ Viloyat (${selectedRegion === 'all' ? 'Toshkent' : selectedRegion})`
                      : `№ Tuman (${selectedDistrict === 'all' ? 'Yunusobod' : selectedDistrict})`}
                  </th>
                  <th className="py-3 px-3.5">{t("Ishtirokchi (F.I.Sh.)")}</th>
                  <th className="py-3 px-3.5">{t("Hudud (Viloyat & Tuman)")}</th>
                  <th className="py-3 px-3.5">{t("Sinf & Maktab")}</th>
                  <th className="py-3 px-3.5 text-right">{t("Asosiy Ball (XP)")}</th>
                  <th className="py-3 px-3.5 text-right">{t("Bonus (+XP)")}</th>
                  <th className="py-3 px-3.5 text-right">{t("Cheating Jarimasi (-XP)")}</th>
                  <th className="py-3 px-3.5 text-right">{t("Jami Umumiy XP")}</th>
                  <th className="py-3 px-3.5 text-right">{t("Amallar")}</th>
                </tr>
              </thead>
              <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div className={clsx("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>
                          {t("Hozircha ishtirokchilar mavjud emas")}
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {t("Olimpiadalar yakunlangach, real natijalar va hisoblangan ballar avtomatik ushbu reyting jadvalida aks etadi.")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => {
                    
                    const scopeRank = idx + 1;
                    const isSearchedTarget = lookupQuery && e.userName.toLowerCase().includes(lookupQuery.toLowerCase());

                    return (
                      <tr
                        key={e.id}
                        className={clsx(
                          "transition-colors",
                          isSearchedTarget
                            ? "bg-amber-900/40 font-extrabold border-2 border-amber-400"
                            : isDark
                            ? "hover:bg-[#132244]"
                            : "hover:bg-slate-50"
                        )}
                      >
                        
                        <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono font-bold">
                          {scopeRank === 1 ? (
                            <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black text-xs shadow-xs">1 🥇</span>
                          ) : scopeRank === 2 ? (
                            <span className="px-2.5 py-1 rounded bg-slate-300 text-slate-950 font-black text-xs shadow-xs">2 🥈</span>
                          ) : scopeRank === 3 ? (
                            <span className="px-2.5 py-1 rounded bg-amber-700 text-white font-black text-xs shadow-xs">3 🥉</span>
                          ) : (
                            <span className="text-slate-400 font-mono">#{scopeRank}</span>
                          )}
                        </td>

                        
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={e.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                              alt={e.userName}
                              className="w-7 h-7 rounded-full object-cover border border-amber-500/40 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>{e.userName}</span>
                                {isSearchedTarget && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">Qidirildi</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{e.userId} · {e.accuracyRate}% aniqlik</div>
                            </div>
                          </div>
                        </td>

                        
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-300">{e.region}</div>
                          <div className="text-[10px] text-slate-400">{e.district}</div>
                        </td>

                        
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {e.grade}-sinf
                            </span>
                            <span className="text-slate-300 truncate max-w-[160px]">{e.school}</span>
                          </div>
                        </td>

                        
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-400 whitespace-nowrap">
                          {e.baseScore.toLocaleString()} XP
                        </td>

                        
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          +{e.bonusPoints.toLocaleString()} XP
                        </td>

                        
                        <td className="py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                          {e.cheatingPenalty > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-black">
                              -{e.cheatingPenalty.toLocaleString()} XP ⚠️
                            </span>
                          ) : (
                            <span className="text-slate-500">0 XP</span>
                          )}
                        </td>

                        
                        <td className="py-3 px-3.5 text-right font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                          {e.totalXP.toLocaleString()} XP
                        </td>

                        
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setBonusModalUser(e)}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Bonus ball berish (+XP)"
                            >
                              <Plus className="w-3 h-3 text-emerald-400" />
                              <span>Bonus (+XP)</span>
                            </button>

                            <button
                              onClick={() => setPenaltyModalUser(e)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Cheating jarimasi ayirish (-XP)"
                            >
                              <Minus className="w-3 h-3 text-rose-400" />
                              <span>Jarima (-XP)</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        
        {penaltyModalUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className={clsx("rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors", isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200")}>
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2 text-rose-400")}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cheating Jarimasi Ayirish (-XP)</span>
                </h3>
                <button onClick={() => setPenaltyModalUser(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePenaltySubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                  <div className="font-bold text-white">{penaltyModalUser.userName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{penaltyModalUser.school} · Hozirgi XP: {penaltyModalUser.totalXP}</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                    Ayiriladigan Jarima Balli (XP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={50}
                    value={penaltyXP}
                    onChange={(e) => setPenaltyXP(Number(e.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-rose-400 bg-[#091024] border-[#1A2F57]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                    Qoida Buzilishi Sababi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none bg-[#091024] border-[#1A2F57] text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#182A4D]">
                  <button type="button" onClick={() => setPenaltyModalUser(null)} className="px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-300">
                    Bekor qilish
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md">
                    Jarimani qo'llash (-{penaltyXP} XP)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {bonusModalUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className={clsx("rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors", isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200")}>
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2 text-emerald-400")}>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Bonus Ball Berish (+XP)</span>
                </h3>
                <button onClick={() => setBonusModalUser(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBonusSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <div className="font-bold text-white">{bonusModalUser.userName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{bonusModalUser.school} · Hozirgi XP: {bonusModalUser.totalXP}</div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                    Beriladigan Bonus Ball (XP) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={50}
                    value={bonusXP}
                    onChange={(e) => setBonusXP(Number(e.target.value))}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-emerald-400 bg-[#091024] border-[#1A2F57]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                    Bonus Berilish Sababi *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={bonusReason}
                    onChange={(e) => setBonusReason(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none bg-[#091024] border-[#1A2F57] text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#182A4D]">
                  <button type="button" onClick={() => setBonusModalUser(null)} className="px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-300">
                    Bekor qilish
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md">
                    Bonusni berish (+{bonusXP} XP)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
