import React from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { useUserStore } from '../../store/useUserStore';
import { usePackageStore } from '../../store/usePackageStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { useSupportStore } from '../../store/useSupportStore';
import { useSecurityStore } from '../../store/useSecurityStore';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  DollarSign,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Plus,
  Radio,
  Award,
  TrendingUp,
  MapPin,
  MessageSquare,
  Eye,
  Gift,
  Building2,
  Sparkles,
  Clock,
  Zap,
  BarChart3,
  Bell,
  Sliders,
  ChevronRight,
  Server,
  HardDrive,
  MemoryStick,
  Flame
} from 'lucide-react';

export const EgaDashboardPage: React.FC = () => {
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();
  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  const { olympiads } = useOlympiadStore();
  const { users } = useUserStore();
  const { packages } = usePackageStore();
  const { payments } = usePaymentStore();
  const { tickets } = useSupportStore();
  const securityStore = useSecurityStore();

  
  const totalCompetitions = olympiads.length;
  const activeCompetitions = olympiads.filter((o) => o.status === 'ochiq').length;
  const totalRegisteredParticipants = olympiads.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
  const totalRevenue = payments
    .filter((p) => p.status === 'muvaffaqiyatli')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPaidCount = payments.filter((p) => p.status === 'muvaffaqiyatli').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'yangi' || t.status === 'jarayonda').length;

  
  const standardSubjects = ['Matematika', 'Informatika', 'Fizika', 'Kimyo', 'Biologiya'];
  const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-teal-600', 'bg-emerald-600'];
  const maxRegistered = Math.max(...olympiads.map((o) => o.registeredCount || 0), 1);
  const subjectStats = standardSubjects.map((subName, idx) => {
    const matched = olympiads.filter((o) => o.subject?.toLowerCase().includes(subName.toLowerCase()));
    const count = matched.reduce((sum, o) => sum + (o.registeredCount || 0), 0);
    const percentage = count > 0 ? Math.min(100, Math.round((count / maxRegistered) * 100)) : 0;
    return {
      name: subName,
      count,
      percentage,
      color: colors[idx % colors.length]
    };
  });

  
  const successfulPayments = payments.filter((p) => p.status === 'muvaffaqiyatli');
  const cardCount = successfulPayments.filter((p) => p.method === 'karta').length;
  const pkgCount = payments.filter((p) => p.method === 'paket').length;
  const cashCount = successfulPayments.filter((p) => p.method === 'naqd').length;
  const totalPayTransactions = successfulPayments.length || 1;

  const cardSharePercent = successfulPayments.length > 0 ? Math.round((cardCount / totalPayTransactions) * 100) : 0;
  const pkgSharePercent = payments.length > 0 ? Math.round((pkgCount / payments.length) * 100) : 0;
  const cashSharePercent = successfulPayments.length > 0 ? Math.round((cashCount / totalPayTransactions) * 100) : 0;

  
  const studentCount = users.filter((u) => u.role === 'student').length;
  const teacherCount = users.filter((u) => u.role === 'teacher').length;
  const totalUsersNum = users.length;
  const studentSharePercent = totalUsersNum > 0 ? Math.round((studentCount / totalUsersNum) * 100) : 0;
  const teacherSharePercent = totalUsersNum > 0 ? Math.round((teacherCount / totalUsersNum) * 100) : 0;

  
  const weeklyTrendData = React.useMemo(() => {
    const days = [
      { id: 0, label: 'Dush', full: 'Dushanba' },
      { id: 1, label: 'Sesh', full: 'Seshanba' },
      { id: 2, label: 'Chor', full: 'Chorshanba' },
      { id: 3, label: 'Pay', full: 'Payshanba' },
      { id: 4, label: 'Jum', full: 'Juma' },
      { id: 5, label: 'Shan', full: 'Shanba' },
      { id: 6, label: 'Yak', full: 'Yakshanba' }
    ];

    const regCounts = [0, 0, 0, 0, 0, 0, 0];
    const testCounts = [0, 0, 0, 0, 0, 0, 0];

    
    (users || []).forEach((u) => {
      if (u.createdAt) {
        const d = new Date(u.createdAt);
        const dayIdx = (d.getDay() + 6) % 7;
        regCounts[dayIdx] = (regCounts[dayIdx] || 0) + 1;
      }
    });

    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('submission_completed_') && !key.includes('_att_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const sub = JSON.parse(val);
            if (sub && sub.completedAt) {
              const d = new Date(sub.completedAt);
              const dayIdx = (d.getDay() + 6) % 7;
              testCounts[dayIdx] = (testCounts[dayIdx] || 0) + 1;
            }
          }
        }
      }
    } catch {}

    const totalReg = regCounts.reduce((a, b) => a + b, 0);
    const totalTests = testCounts.reduce((a, b) => a + b, 0);
    const maxVal = Math.max(8, ...regCounts, ...testCounts);

    return {
      days,
      regCounts,
      testCounts,
      maxVal,
      totalReg,
      totalTests
    };
  }, [users]);

  return (
    <EgaLayout>
      <div className="space-y-6 font-sans text-xs pb-8">
        
        <div
          className={clsx(
            "p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-md shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={clsx("text-base font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                  {t("Boshqaruv Markazi (Dashboard)")}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {t("Tizim Barqaror")}
                </span>
              </div>
              <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Barcha bo'limlardan eng muhim ko'rsatkichlar, moliya, olimpiadalar va anti-cheat nazorati bir joyda")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/ega/competitions"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("Yangi Olimpiada Yaratish")}</span>
            </Link>
          </div>
        </div>

        
        <div
          className={clsx(
            "p-3.5 rounded-2xl border shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors",
            isDark ? "bg-[#091124] border-[#182A4D]" : "bg-slate-50 border-slate-200"
          )}
        >
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={clsx("font-extrabold text-xs", isDark ? "text-white" : "text-slate-900")}>
                  Uzcloud Server & Xavfsizlik Holati
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                1 vCPU @ 2.40GHz · Uptime: {securityStore.serverMetrics.uptime}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto text-[10px]">
            
            <div className={clsx("px-3 py-1.5 rounded-xl border flex items-center gap-2", isDark ? "bg-[#0D1832] border-[#1E335E]" : "bg-white border-slate-200")}>
              <MemoryStick className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">RAM (1024 MiB)</span>
                <span className="font-bold text-cyan-300 font-mono">{securityStore.serverMetrics.ramUsedMb || 418}MB ({securityStore.serverMetrics.ram}%)</span>
              </div>
            </div>

            
            <div className={clsx("px-3 py-1.5 rounded-xl border flex items-center gap-2", isDark ? "bg-[#0D1832] border-[#1E335E]" : "bg-white border-slate-200")}>
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">SSD (25 GB)</span>
                <span className="font-bold text-indigo-300 font-mono">{securityStore.serverMetrics.diskUsedGb || 8.4}GB ({securityStore.serverMetrics.disk}%)</span>
              </div>
            </div>

            
            <div className={clsx("px-3 py-1.5 rounded-xl border flex items-center gap-2", isDark ? "bg-[#0D1832] border-[#1E335E]" : "bg-white border-slate-200")}>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[9px]">DDoS / WAF</span>
                <span className="font-bold text-emerald-400 font-mono">Faol & Himoyalangan</span>
              </div>
            </div>

            
            <Link
              to="/ega/security"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-all text-[10px] cursor-pointer shadow-xs"
            >
              <span>Monitoring</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          <div
            className={clsx(
              "p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs hover:border-amber-500/50",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={clsx("text-[10px] font-extrabold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Fan Olimpiadalari")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={clsx("text-xl font-black font-mono", isDark ? "text-white" : "text-slate-900")}>
                {totalCompetitions} ta
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>{activeCompetitions} ta faol musobaqa</span>
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs hover:border-blue-500/50",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={clsx("text-[10px] font-extrabold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Jami Qatnashuvchilar")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={clsx("text-xl font-black font-mono", isDark ? "text-white" : "text-slate-900")}>
                {totalRegisteredParticipants.toLocaleString()} ta
              </div>
              <div className="text-[11px] font-semibold text-blue-400 mt-0.5">
                {users.length} ta ro'yxatdan o'tgan foydalanuvchi
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs hover:border-emerald-500/50",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={clsx("text-[10px] font-extrabold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Jami Moliya Tushumi")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black font-mono text-emerald-400">
                {totalRevenue.toLocaleString()} UZS
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                {totalPaidCount} ta to'lov muvaffaqiyatli
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs hover:border-rose-500/50",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={clsx("text-[10px] font-extrabold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Anti-Cheat Xavfsizlik")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black font-mono text-emerald-400">
                100% Xavfsiz
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>0 ta shubhali holat</span>
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border transition-all space-y-2.5 shadow-xs hover:border-purple-500/50",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={clsx("text-[10px] font-extrabold uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Qo'llab-quvvatlash")}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className={clsx("text-xl font-black font-mono", isDark ? "text-white" : "text-slate-900")}>
                {openTicketsCount} ochiq
              </div>
              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                {openTicketsCount === 0 ? t("Barcha murojaatlar yopilgan") : `${openTicketsCount} ta faol murojaat`}
              </div>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div
            className={clsx(
              "lg:col-span-2 p-5 rounded-2xl border space-y-4 transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-700/40">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
                  {t("Tizim Dinamikasi")}
                </span>
                <h3 className={clsx("text-sm font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                  {t("Haftalik Ro'yxatdan O'tish va Qatnashuv Grafigi")}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Jami: <strong className="text-blue-400 font-mono">{weeklyTrendData.totalReg} ta</strong> registratsiya • <strong className="text-cyan-400 font-mono">{weeklyTrendData.totalTests} ta</strong> test topshirilgan
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>Registratsiyalar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
                  <span className={isDark ? "text-slate-300" : "text-slate-700"}>Test Yechganlar</span>
                </div>
              </div>
            </div>

            
            <div className="h-56 w-full relative pt-1">
              {(() => {
                const { days, regCounts, testCounts, maxVal } = weeklyTrendData;
                const pointsX = [55, 125, 195, 265, 335, 405, 475];

                
                const getRegY = (val: number) => 145 - (val / maxVal) * 110;
                const getTestY = (val: number) => 145 - (val / maxVal) * 110;

                
                const regPointsStr = regCounts.map((v, i) => `${pointsX[i]},${getRegY(v)}`).join(' ');
                const testPointsStr = testCounts.map((v, i) => `${pointsX[i]},${getTestY(v)}`).join(' ');

                const regAreaPath = `M${pointsX[0]},145 L${pointsX.map((x, i) => `${x},${getRegY(regCounts[i])}`).join(' L')} L${pointsX[6]},145 Z`;
                const testAreaPath = `M${pointsX[0]},145 L${pointsX.map((x, i) => `${x},${getTestY(testCounts[i])}`).join(' L')} L${pointsX[6]},145 Z`;

                return (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 175" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradBlueDynamic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradCyanDynamic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    
                    <g className="opacity-70">
                      <line x1="38" y1="35" x2="490" y2="35" stroke={isDark ? "#1E3666" : "#E2E8F0"} strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y="38" textAnchor="end" fill={isDark ? "#94A3B8" : "#64748B"} fontSize="9" fontWeight="bold">
                        {maxVal}
                      </text>

                      <line x1="38" y1="72" x2="490" y2="72" stroke={isDark ? "#1E3666" : "#E2E8F0"} strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y="75" textAnchor="end" fill={isDark ? "#94A3B8" : "#64748B"} fontSize="9" fontWeight="bold">
                        {Math.round(maxVal * 0.66)}
                      </text>

                      <line x1="38" y1="108" x2="490" y2="108" stroke={isDark ? "#1E3666" : "#E2E8F0"} strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y="111" textAnchor="end" fill={isDark ? "#94A3B8" : "#64748B"} fontSize="9" fontWeight="bold">
                        {Math.round(maxVal * 0.33)}
                      </text>

                      <line x1="38" y1="145" x2="490" y2="145" stroke={isDark ? "#2A4374" : "#CBD5E1"} strokeWidth="1.5" />
                      <text x="32" y="148" textAnchor="end" fill={isDark ? "#94A3B8" : "#64748B"} fontSize="9" fontWeight="bold">
                        0
                      </text>
                    </g>

                    
                    <path d={regAreaPath} fill="url(#gradBlueDynamic)" />
                    <polyline points={regPointsStr} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    
                    <path d={testAreaPath} fill="url(#gradCyanDynamic)" />
                    <polyline points={testPointsStr} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />

                    
                    {days.map((d, idx) => {
                      const cx = pointsX[idx];
                      const cyReg = getRegY(regCounts[idx]);
                      const cyTest = getTestY(testCounts[idx]);

                      return (
                        <g key={d.id}>
                          
                          <circle cx={cx} cy={cyReg} r="4.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" className="cursor-pointer transition-transform hover:scale-125">
                            <title>{`${d.full}: ${regCounts[idx]} ta yangi ro'yxatdan o'tgan`}</title>
                          </circle>

                          
                          <circle cx={cx} cy={cyTest} r="4" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="1.5" className="cursor-pointer transition-transform hover:scale-125">
                            <title>{`${d.full}: ${testCounts[idx]} ta test topshirgan`}</title>
                          </circle>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

              
              <div className={clsx("grid grid-cols-7 text-center text-[10px] font-bold pt-2 border-t", isDark ? "border-[#182A4D] text-slate-400" : "border-slate-200 text-slate-500")}>
                {weeklyTrendData.days.map((d, idx) => (
                  <div key={d.id} className="space-y-0.5">
                    <span className="block text-slate-200 font-extrabold">{d.label}</span>
                    <span className="block text-[9px] font-mono text-slate-500">
                      {weeklyTrendData.regCounts[idx] > 0 || weeklyTrendData.testCounts[idx] > 0
                        ? `${weeklyTrendData.regCounts[idx]} / ${weeklyTrendData.testCounts[idx]}`
                        : '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-5 rounded-2xl border space-y-4 transition-colors flex flex-col justify-between",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-3">
              <div className="border-b pb-2.5 border-slate-700/40 flex items-center justify-between">
                <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
                  {t("Fanlar Kesimida Ishtirok")}
                </h3>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>

              <div className="space-y-3 pt-1">
                {subjectStats.map((sub, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className={isDark ? "text-slate-200" : "text-slate-800"}>{sub.name}</span>
                      <span className="font-mono text-amber-400">{sub.count.toLocaleString()} ta</span>
                    </div>
                    <div className={clsx("w-full h-2 rounded-full overflow-hidden", isDark ? "bg-[#142347]" : "bg-slate-100")}>
                      <div className={`h-full ${sub.color} rounded-full transition-all duration-500`} style={{ width: `${sub.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Eng faol hudud: <strong className="text-white">Toshkent sh.</strong></span>
              </div>
              <Link to="/ega/locations" className="text-amber-400 hover:underline font-bold">
                Batafsil →
              </Link>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            className={clsx(
              "p-4 rounded-2xl border space-y-3 transition-colors flex flex-col justify-between",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
                    {t("Olimpiadalar")}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                  {totalCompetitions} ta
                </span>
              </div>

              <div className="space-y-2">
                {olympiads.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={clsx(
                      "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2",
                      isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="truncate space-y-0.5">
                      <div className={clsx("font-bold text-xs truncate", isDark ? "text-white" : "text-slate-900")}>
                        {item.title}
                      </div>
                      <div className="text-[10px] text-amber-400 font-semibold">
                        {item.subject} • {item.registeredCount || 0} ishtirokchi
                      </div>
                    </div>
                    <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0", item.status === 'ochiq' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400")}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/ega/competitions"
              className="flex items-center justify-center gap-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs transition-all mt-2"
            >
              <span>{t("Musobaqalarga O'tish")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border space-y-3 transition-colors flex flex-col justify-between",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
                    {t("Moliya & To'lovlar")}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  {totalRevenue.toLocaleString()} UZS
                </span>
              </div>

              <div className="space-y-2">
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className={isDark ? "text-slate-300" : "text-slate-700"}>Karta Orqali:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{cardSharePercent}%</span>
                </div>
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-400" />
                    <span className={isDark ? "text-slate-300" : "text-slate-700"}>VIP Paket (Bepul):</span>
                  </div>
                  <span className="font-mono font-bold text-purple-400">{pkgSharePercent}%</span>
                </div>
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className={isDark ? "text-slate-300" : "text-slate-700"}>Naqd Pul (Kassa):</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{cashSharePercent}%</span>
                </div>
              </div>
            </div>

            <Link
              to="/ega/finance"
              className="flex items-center justify-center gap-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs transition-all mt-2"
            >
              <span>{t("Moliyaviy Hisobotlar")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border space-y-3 transition-colors flex flex-col justify-between",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
                    {t("Foydalanuvchilar")}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
                  {users.length} ta
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <span>O'quvchilar ulushi:</span>
                  <span className="font-bold text-blue-400 font-mono">{studentSharePercent}% ({studentCount} ta)</span>
                </div>
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <span>O'qituvchi & Maktablar:</span>
                  <span className="font-bold text-amber-400 font-mono">{teacherSharePercent}% ({teacherCount} ta)</span>
                </div>
                <div className={clsx("p-2.5 rounded-xl border flex justify-between items-center", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                  <span>Faol Paket Obunalari:</span>
                  <span className="font-bold text-emerald-400 font-mono">{packages.length} turdagi tarif</span>
                </div>
              </div>
            </div>

            <Link
              to="/ega/users"
              className="flex items-center justify-center gap-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl font-bold text-xs transition-all mt-2"
            >
              <span>{t("Barcha Foydalanuvchilar")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-2xl border space-y-3 transition-colors flex flex-col justify-between",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
                    {t("Anti-Cheat Hubi")}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                  Faol
                </span>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="font-bold text-emerald-400 text-xs">Anti-Cheat Tizimi Faol</div>
                <p className="text-[10px] text-slate-400">Tab almashish, klaviatura va ekran himoyasi orqali nojo'ya harakatlar cheklangan.</p>
              </div>
            </div>

            <Link
              to="/ega/security"
              className="flex items-center justify-center gap-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition-all mt-2"
            >
              <span>{t("Xavfsizlik Markaziga O'tish")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        
        <div
          className={clsx(
            "p-4 rounded-2xl border transition-colors space-y-3",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
            <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{t("Bo'limlarga Tezkor O'tish va Boshqaruv Navigation")}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">NextOlymp Admin Module v2.5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <Link
              to="/ega/competitions"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-amber-400" : "bg-slate-50 border-slate-200 hover:border-amber-500"
              )}
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Olimpiadalar</span>
            </Link>

            <Link
              to="/ega/finance"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-emerald-400" : "bg-slate-50 border-slate-200 hover:border-emerald-500"
              )}
            >
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Moliya Hisob</span>
            </Link>

            <Link
              to="/ega/users"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-blue-400" : "bg-slate-50 border-slate-200 hover:border-blue-500"
              )}
            >
              <Users className="w-5 h-5 text-blue-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Foydalanuvchilar</span>
            </Link>

            <Link
              to="/ega/baholash"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-blue-400" : "bg-slate-50 border-slate-200 hover:border-blue-500"
              )}
            >
              <Award className="w-5 h-5 text-blue-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Baholash Moduli</span>
            </Link>

            <Link
              to="/ega/packages"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-purple-400" : "bg-slate-50 border-slate-200 hover:border-purple-500"
              )}
            >
              <Gift className="w-5 h-5 text-purple-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Paket Tariflar</span>
            </Link>

            <Link
              to="/ega/notifications"
              className={clsx(
                "p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-102 cursor-pointer",
                isDark ? "bg-[#091024] border-[#182A4D] hover:border-indigo-400" : "bg-slate-50 border-slate-200 hover:border-indigo-500"
              )}
            >
              <Bell className="w-5 h-5 text-indigo-400" />
              <span className={clsx("font-bold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>Xabarnomalar</span>
            </Link>
          </div>
        </div>
      </div>
    </EgaLayout>
  );
};
