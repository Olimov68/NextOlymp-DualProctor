import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useSecurityStore, DefenseStatus } from '../../store/useSecurityStore';
import { SecurityAlert, AccessLog } from '../../data/initialSecurityLogs';
import { useThemeStore } from '../../store/useThemeStore';
import { clsx } from 'clsx';
import {
  ShieldAlert, ShieldCheck, ShieldX, Activity, Globe, Search, Ban, Unlock, Eye,
  AlertTriangle, CheckCircle2, XCircle, Clock, Zap, BarChart2, List, Terminal,
  Wifi, WifiOff, X, Lock, Database, Cpu, Flame, Network, Radio, MonitorDot, CircleAlert,
  Power, ToggleLeft, ToggleRight, Server, HardDrive, MemoryStick, Users, GraduationCap, UserCheck,
  Gauge, ArrowDown, ArrowUp, RefreshCw, ChevronRight, Settings2, FileWarning, Fingerprint, Shield
} from 'lucide-react';
import { adminMonitoringService } from '../../services/adminMonitoringService';

const getFlagEmoji = (cc: string) => {
  if (!cc || cc.length !== 2) return '🌐';
  return cc.toUpperCase().split('').map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
};

const statusBadge = (st: SecurityAlert['status']) => {
  switch (st) {
    case 'active': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    case 'blocked': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    case 'investigating': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'resolved': return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  }
};

const statusLabel = (st: SecurityAlert['status']) => {
  switch (st) {
    case 'active': return 'Faol';
    case 'blocked': return 'Bloklangan';
    case 'investigating': return 'Tekshirilmoqda';
    case 'resolved': return 'Hal etildi';
  }
};

const severityBadge = (sv: SecurityAlert['severity']) => {
  switch (sv) {
    case 'critical': return 'bg-rose-600/30 text-rose-300 border-rose-500/50';
    case 'high': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  }
};

const severityLabel = (sv: SecurityAlert['severity']) => {
  switch (sv) {
    case 'critical': return 'Kritik';
    case 'high': return 'Yuqori';
    case 'medium': return "O'rta";
    case 'low': return 'Past';
  }
};

const alertTypeLabel = (type: SecurityAlert['type']) => {
  switch (type) {
    case 'ddos': return 'DDoS';
    case 'brute_force': return 'Brute Force';
    case 'sql_injection': return 'SQL Injection';
    case 'xss': return 'XSS';
    case 'suspicious_scan': return 'Vuln Scan';
    case 'rate_limit': return 'Rate Limit';
    case 'geo_block': return 'Geo Block';
    case 'bot': return 'Bot';
  }
};

const httpStatusColor = (code: number) => code < 300 ? 'text-emerald-400' : code < 400 ? 'text-blue-400' : code < 500 ? 'text-amber-400' : 'text-rose-400';

const methodColor = (m: string) => {
  switch (m) {
    case 'GET': return 'bg-blue-500/15 text-blue-300';
    case 'POST': return 'bg-emerald-500/15 text-emerald-300';
    case 'PUT': return 'bg-amber-500/15 text-amber-300';
    case 'DELETE': return 'bg-rose-500/15 text-rose-300';
    default: return 'bg-slate-500/15 text-slate-300';
  }
};

const logLevelDot = (level: string) => {
  switch (level) {
    case 'info': return 'bg-emerald-400';
    case 'warning': return 'bg-amber-400';
    case 'error': return 'bg-orange-500';
    case 'critical': return 'bg-rose-500 animate-pulse';
    default: return 'bg-slate-400';
  }
};

const CircularGauge: React.FC<{ value: number; label: string; color: string; size?: number; isDark: boolean }> = ({ value, label, color, size = 56, isDark }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={isDark ? '#162748' : '#e2e8f0'} strokeWidth={5} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono" style={{ color }}>
          {Math.round(value)}%
        </span>
      </div>
      <span className={clsx('text-[9px] uppercase font-bold tracking-wider', isDark ? 'text-slate-400' : 'text-slate-500')}>{label}</span>
    </div>
  );
};

const TrafficSparkline: React.FC<{ data: { time: string; requests: number; errors: number }[] }> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.requests), 1);
  return (
    <div className="flex items-end gap-px h-12 w-full">
      {data.map((d, i) => {
        const h = (d.requests / maxVal) * 100;
        const spike = d.requests > 500;
        return (
          <div key={i} className="flex-1 group relative flex flex-col items-center">
            <div className={clsx('w-full rounded-t-sm transition-all', spike ? 'bg-rose-500 animate-pulse' : d.errors > 20 ? 'bg-amber-500' : 'bg-indigo-500/80')} style={{ height: `${h}%`, minHeight: 1 }} />
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-[8px] text-white rounded px-1.5 py-0.5 whitespace-nowrap z-10 font-mono">
              {d.time}: {d.requests}req {d.errors > 0 && `${d.errors}err`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DefenseToggle: React.FC<{ label: string; active: boolean; onToggle: () => void; icon: React.ReactNode; isDark: boolean; danger?: boolean }> = ({ label, active, onToggle, icon, isDark, danger }) => (
  <button onClick={onToggle} className={clsx('flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border w-full text-left', active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : danger ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : isDark ? 'bg-[#091024] border-[#162748] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500')}>
    <span className={clsx('shrink-0', active ? 'text-emerald-400' : danger ? 'text-rose-400' : 'text-slate-500')}>{icon}</span>
    <span className="flex-1 truncate">{label}</span>
    {active ? <ToggleRight className="w-4 h-4 text-emerald-400 shrink-0" /> : <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />}
  </button>
);

type Tab = 'monitor' | 'logs' | 'alerts' | 'blocked';

export const EgaSecurityPage: React.FC = () => {
  const store = useSecurityStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<Tab>('monitor');
  const [searchAccess, setSearchAccess] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState<'all' | 'failed_logins' | 'success_logins' | 'rate_limits'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockModalIP, setBlockModalIP] = useState('');
  const [blockModalReason, setBlockModalReason] = useState('');
  const [blockModalPermanent, setBlockModalPermanent] = useState(false);

  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    totalOlympiads: 0,
    totalSubmissions: 0
  });

  const [serverHostStats, setServerHostStats] = useState({
    hostingAccountsCount: 1,
    currentAccount: 'root (ibnsinoschool.uz)',
    accountRamLimit: 'Yuklanmoqda...',
    accountDiskQuota: 'NVMe SSD',
    serverNode: 'Ibn Sino VPS Server'
  });

  const [diagnostics, setDiagnostics] = useState<any>({
    osName: 'Aniqlanmoqda...',
    platformName: 'Linux',
    kernel: 'Aniqlanmoqda...',
    hostname: 'server.ibnsinoschool.uz',
    arch: 'x64',
    loadAvg: [0.00, 0.00, 0.00],
    ports: [] as Array<{ port: number; name: string; protocol: string; status: string; color: string }>,
    runtime: 'Node.js Engine',
    nodeVersion: 'v20.x',
    v8Version: '12.0',
    memoryRss: '...',
    heapUsed: '...',
    databaseName: 'JSON Store & Prisma DB',
    dbStatus: 'Faol',
    totalModulesCount: 48,
    keyModules: ['Express.js', 'Socket.IO', 'TypeScript', 'Prisma', 'JWT Guard', 'RateLimiter', 'Bcrypt', 'SystemInfo'],
  });

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const adminRaw = localStorage.getItem('ibn_sino_admin_session_v2');
      if (adminRaw) {
        try {
          const parsed = JSON.parse(adminRaw);
          if (parsed?.token) return parsed.token;
        } catch {}
      }
      return localStorage.getItem('next_olymp_jwt') || localStorage.getItem('ibn_sino_token') || '';
    }
    return '';
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRealLogs = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch('/api/admin/system-metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.status === 'success') {
            if (json.metrics) {
              store.updateServerMetrics({
                ram: json.metrics.ram?.usagePercent ?? 0,
                ramTotalMb: json.metrics.ram?.totalMb ?? 0,
                ramUsedMb: json.metrics.ram?.usedMb ?? 0,
                ramFreeMb: json.metrics.ram?.freeMb ?? 0,
                disk: json.metrics.disk?.usagePercent ?? 0,
                diskTotalGb: json.metrics.disk?.totalGb ?? 0,
                diskUsedGb: json.metrics.disk?.usedGb ?? 0,
                diskFreeGb: json.metrics.disk?.freeGb ?? 0,
                cpu: json.metrics.cpu?.usagePercent ?? 0,
                network: json.metrics.network ?? { in: 0, out: 0 },
                uptime: json.metrics.uptime ?? 'Aniqlanmoqda...',
                activeConnections: json.metrics.activeConnections ?? 1,
                requestsPerSec: json.metrics.requestsPerSec ?? 0,
                responseTimeAvg: json.metrics.responseTimeAvg ?? 0,
                threatLevel: json.metrics.threatLevel ?? 'low'
              });

              if (Array.isArray(json.metrics.traffic) && json.metrics.traffic.length > 0) {
                store.setTrafficData(json.metrics.traffic);
              }
            }

            if (Array.isArray(json.data)) {
              useSecurityStore.setState({ accessLogs: json.data });
            }

            if (Array.isArray(json.alerts)) {
              useSecurityStore.setState({ alerts: json.alerts });
            }

            if (Array.isArray(json.blockedIPs)) {
              store.setBlockedIPs(json.blockedIPs);
            }

            if (json.platformStats) {
              setPlatformStats(json.platformStats);
            }
            if (json.serverHostStats) {
              setServerHostStats(json.serverHostStats);
            }

            if (json.diagnostics) {
              setDiagnostics(json.diagnostics);
            }
          }
        }
      } catch (err) {
        console.warn('Real server logs fetch warning:', err);
      }
    };

    fetchRealLogs();
    const logInterval = setInterval(fetchRealLogs, 3000);
    return () => {
      isMounted = false;
      clearInterval(logInterval);
    };
  }, []);

  
  const criticalAlerts = useMemo(() => store.alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length, [store.alerts]);
  const activeAlerts = useMemo(() => store.alerts.filter((a) => a.status === 'active' || a.status === 'investigating').length, [store.alerts]);
  const totalRequests = useMemo(() => {
    const fromSpark = store.trafficData.reduce((s, d) => s + d.requests, 0);
    return Math.max(store.serverMetrics.requestsPerSec ? store.serverMetrics.requestsPerSec * 1800 : 0, fromSpark, store.accessLogs.length);
  }, [store.trafficData, store.serverMetrics.requestsPerSec, store.accessLogs.length]);

  const handleBlockIP = async (ip: string, reason: string, permanent: boolean) => {
    store.blockIP(ip, 'Qo\'lda qo\'shilgan', 'UZ', reason, permanent);
    try {
      const token = (typeof window !== 'undefined' ? (localStorage.getItem('next_olymp_jwt') || localStorage.getItem('ibn_sino_token')) : '') || '';
      await fetch('/api/admin/block-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip, reason, permanent })
      });
    } catch (e) {}
  };

  const handleUnblockIP = async (ip: string) => {
    store.unblockIP(ip);
    try {
      const token = (typeof window !== 'undefined' ? (localStorage.getItem('next_olymp_jwt') || localStorage.getItem('ibn_sino_token')) : '') || '';
      await fetch('/api/admin/unblock-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip })
      });
    } catch (e) {}
  };

  const handleClearLogs = async () => {
    store.clearLogs();
    try {
      const token = (typeof window !== 'undefined' ? (localStorage.getItem('next_olymp_jwt') || localStorage.getItem('ibn_sino_token')) : '') || '';
      await fetch('/api/admin/system-metrics', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  };

  const handleToggleDefense = async (key: keyof DefenseStatus) => {
    store.toggleDefense(key);
    try {
      const token = (typeof window !== 'undefined' ? (localStorage.getItem('next_olymp_jwt') || localStorage.getItem('ibn_sino_token')) : '') || '';
      await fetch('/api/admin/toggle-setting', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, value: !store.defenseStatus[key] })
      });
    } catch (e) {}
  };

  const openBlockModal = (ip = '', reason = '') => {
    setBlockModalIP(ip);
    setBlockModalReason(reason);
    setBlockModalPermanent(false);
    setIsBlockModalOpen(true);
  };

  const filteredAccess = useMemo(() => store.accessLogs.filter((l) => {
    const match = l.ip.includes(searchAccess) || l.path.toLowerCase().includes(searchAccess.toLowerCase()) || (l.userName || '').toLowerCase().includes(searchAccess.toLowerCase()) || String(l.statusCode).includes(searchAccess);
    const lvl = levelFilter === 'all' || l.level === levelFilter;
    let cat = true;
    if (logCategoryFilter === 'failed_logins') {
      cat = l.statusCode === 401 || l.level === 'error' || l.path.includes('login');
    } else if (logCategoryFilter === 'success_logins') {
      cat = l.statusCode === 200 && l.path.includes('login');
    } else if (logCategoryFilter === 'rate_limits') {
      cat = l.statusCode === 429 || l.level === 'warning';
    }
    return match && lvl && cat;
  }), [store.accessLogs, searchAccess, levelFilter, logCategoryFilter]);

  const filteredAlerts = useMemo(() => store.alerts.filter((a) => statusFilter === 'all' || a.status === statusFilter), [store.alerts, statusFilter]);

  const m = store.serverMetrics;
  const def = store.defenseStatus;
  const cpuColor = m.cpu > 80 ? '#ef4444' : m.cpu > 60 ? '#f59e0b' : '#22c55e';
  const ramColor = m.ram > 85 ? '#ef4444' : m.ram > 70 ? '#f59e0b' : '#22c55e';
  const diskColor = m.disk > 80 ? '#ef4444' : '#22c55e';

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'monitor', label: 'Monitoring & Resurslar', icon: <MonitorDot className="w-3.5 h-3.5" /> },
    { id: 'logs', label: 'Access Log (Kirish)', icon: <List className="w-3.5 h-3.5" />, badge: store.accessLogs.length },
    { id: 'alerts', label: 'Xavfsizlik Tahdidlari', icon: <ShieldAlert className="w-3.5 h-3.5" />, badge: activeAlerts || undefined },
    { id: 'blocked', label: 'Bloklangan IP lar', icon: <Ban className="w-3.5 h-3.5" />, badge: store.blockedIPs.length || undefined },
  ];

  return (
    <EgaLayout>
      <div className="space-y-3 font-sans text-xs">
        
        <div className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className={clsx('text-base font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-slate-900')}>
                Kiberxavfsizlik & Tizim Boshqaruvi
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SERVER ONLINE
                </span>
              </h1>
            </div>
            <p className={clsx('text-[11px] mt-0.5', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Server monitoringi, WAF himoyasi, kirish jurnallari va xavfsizlik filtrlari
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            <button
              onClick={() => store.setAutoDefend(!store.autoDefend)}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer', store.autoDefend ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg shadow-emerald-900/30' : 'bg-rose-600/20 border-rose-500/40 text-rose-300')}
            >
              {store.autoDefend ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
              {store.autoDefend ? 'Auto-Himoya: ON' : 'Auto-Himoya: OFF'}
            </button>

            
            <button
              onClick={() => store.setLiveMode(!store.liveMode)}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer', store.liveMode ? 'bg-emerald-600/90 border-emerald-500 text-white' : isDark ? 'bg-[#112144] border-[#1E365E] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600')}
            >
              {store.liveMode ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
              {store.liveMode ? 'LIVE' : 'Offline'}
              {store.liveMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>
          </div>
        </div>

        
        {criticalAlerts > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-600/20 border border-rose-500/50 animate-pulse">
            <Flame className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div className="flex-1">
              <span className="text-rose-300 font-black text-xs uppercase tracking-wider">⚠ {criticalAlerts} ta KRITIK xavf aniqlandi!</span>
              <p className="text-rose-400/80 text-[10px] mt-0.5">{store.autoDefend ? 'Tizim avtomatik himoya qilmoqda.' : 'Auto-himoyani yoqing!'}</p>
            </div>
            <button onClick={() => setActiveTab('alerts')} className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0">Ko'rish</button>
          </div>
        )}

        
        <div className={clsx('flex items-center gap-1 overflow-x-auto p-1 rounded-xl border', isDark ? 'bg-[#0A1526] border-[#182A4D]' : 'bg-slate-50 border-slate-200')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap',
                activeTab === tab.id
                  ? isDark ? 'bg-[#1B3260] text-amber-400 font-bold shadow-md' : 'bg-white text-amber-600 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-[#11203E]' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              )}
            >
              {tab.icon}<span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-black', tab.id === 'alerts' && tab.badge > 0 ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-500/20 text-slate-400')}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        
        {activeTab === 'monitor' && (
          <div className="space-y-3">
            
            <div className={clsx('p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={clsx('text-xs font-black uppercase tracking-wide', isDark ? 'text-white' : 'text-slate-900')}>
                      Ibn Sino Main Server · Toshkent DC
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Faol & Barqaror
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    2 vCPU @ 2.40 GHz · 4096 MiB RAM DDR4 · 50 GB NVMe SSD · Linux x64
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                
                <div className={clsx('px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5',
                  m.threatLevel === 'high'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                    : m.threatLevel === 'medium'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                )}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Xavf Darajasi: {m.threatLevel.toUpperCase()}</span>
                </div>

                
                <div className={clsx('px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5', isDark ? 'bg-[#091024] border-[#182A4D] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700')}>
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rate Limit: {m.rateLimitHits} ta cheklov</span>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-xs">Olimpiada Platformasi Foydalanuvchilari</span>
                      <span className="block text-[9px] text-slate-400 font-mono">Backend Database (ibnsino)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                    {platformStats.totalUsers} ta foydalanuvchi
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">O'quvchilar</span>
                    <span className="font-bold text-emerald-400 font-mono">{platformStats.studentCount}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">O'qituvchilar</span>
                    <span className="font-bold text-cyan-300 font-mono">{platformStats.teacherCount}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Adminlar</span>
                    <span className="font-bold text-amber-300 font-mono">{platformStats.adminCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/20">
                  <span>Jami olimpiadalar: <strong className="text-slate-200 font-mono">{platformStats.totalOlympiads}</strong></span>
                  <span>Topshirilgan testlar: <strong className="text-emerald-400 font-mono">{platformStats.totalSubmissions}</strong></span>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="font-bold text-xs">Serverdagi Linux / Hosting Hisoblari</span>
                      <span className="block text-[9px] text-slate-400 font-mono">Linux System Node (/etc/passwd)</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {serverHostStats.hostingAccountsCount} ta hosting hisobi
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Joriy Hisob</span>
                    <span className="font-bold text-white font-mono truncate block" title={serverHostStats.currentAccount}>root</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">RAM Kvota</span>
                    <span className="font-bold text-cyan-300 font-mono">{serverHostStats.accountRamLimit}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">SSD Kvota</span>
                    <span className="font-bold text-indigo-300 font-mono">{serverHostStats.accountDiskQuota}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/20 font-mono">
                  <span>DC: {serverHostStats.serverNode}</span>
                  <span className="text-emerald-400">Holat: Linux / Systemd</span>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs">RAM Xotirasi (Server)</span>
                  </div>
                  <span className={clsx('font-black text-xs font-mono', m.ram > 80 ? 'text-rose-400' : 'text-cyan-300')}>
                    {m.ram}%
                  </span>
                </div>

                
                <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-700',
                      m.ram > 85 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    )}
                    style={{ width: `${Math.min(100, Math.max(5, m.ram))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Jami RAM</span>
                    <span className="font-bold text-white font-mono">{m.ramTotalMb ? `${m.ramTotalMb} MiB` : '...'}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Band RAM</span>
                    <span className="font-bold text-cyan-300 font-mono">{m.ramUsedMb ? `${m.ramUsedMb} MiB` : '...'}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Bo'sh RAM</span>
                    <span className="font-bold text-emerald-400 font-mono">{m.ramFreeMb ? `${m.ramFreeMb} MiB` : '...'}</span>
                  </div>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs">NVMe SSD Xotirasi (Server)</span>
                  </div>
                  <span className={clsx('font-black text-xs font-mono', m.disk > 80 ? 'text-rose-400' : 'text-indigo-300')}>
                    {m.disk ? `${m.disk}%` : '...'}
                  </span>
                </div>

                
                <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(1, m.disk))}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px]">
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Jami SSD</span>
                    <span className="font-bold text-white font-mono">{m.diskTotalGb ? `${m.diskTotalGb} GB` : '...'}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Band SSD</span>
                    <span className="font-bold text-indigo-300 font-mono">{m.diskUsedGb !== undefined ? `${m.diskUsedGb} GB` : '...'}</span>
                  </div>
                  <div className={clsx('p-2 rounded-lg text-center', isDark ? 'bg-[#091024]' : 'bg-slate-50')}>
                    <span className="text-slate-400 block text-[9px] uppercase">Bo'sh SSD</span>
                    <span className="font-bold text-emerald-400 font-mono">{m.diskFreeGb !== undefined ? `${m.diskFreeGb} GB` : '...'}</span>
                  </div>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm md:col-span-2 lg:col-span-1', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">CPU & Tarmoq Oqimi</span>
                  </div>
                  <span className="font-black text-xs font-mono text-emerald-400">
                    {Math.round(m.cpu)}% CPU
                  </span>
                </div>

                <div className="flex items-center justify-around py-1">
                  <CircularGauge value={m.cpu} label="CPU" color={cpuColor} isDark={isDark} />
                  <CircularGauge value={m.ram} label="RAM" color={ramColor} isDark={isDark} />
                  <CircularGauge value={m.disk} label="SSD" color={diskColor} isDark={isDark} />
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-700/30">
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <ArrowDown className="w-3 h-3 text-emerald-400" /> IN: {m.network.in} MB/s
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <ArrowUp className="w-3 h-3 text-blue-400" /> OUT: {m.network.out} MB/s
                  </span>
                  <span className="text-slate-400 font-mono">
                    {m.activeConnections} ulanish
                  </span>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              <div className={clsx('lg:col-span-2 p-4 rounded-xl border space-y-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs">Haqiqiy Vaqtdagi So'rovlar Dinamikasi (Traffic)</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Jami: {totalRequests.toLocaleString()} req</span>
                </div>
                <TrafficSparkline data={store.trafficData} />
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/20">
                  <span>{store.trafficData[0]?.time}</span>
                  <span className="text-emerald-400 font-bold">{m.requestsPerSec} req/sec · o'rtacha {m.responseTimeAvg}ms</span>
                  <span>{store.trafficData[store.trafficData.length - 1]?.time}</span>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-2.5', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between pb-1 border-b border-slate-700/30">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    WAF & Xavfsizlik Qatlamlari
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <DefenseToggle label="DDoS Himoya" active={def.ddosProtection} onToggle={() => handleToggleDefense('ddosProtection')} icon={<Flame className="w-3.5 h-3.5" />} isDark={isDark} />
                  <DefenseToggle label="Rate Limit" active={def.rateLimit} onToggle={() => handleToggleDefense('rateLimit')} icon={<Gauge className="w-3.5 h-3.5" />} isDark={isDark} />
                  <DefenseToggle label="WAF Filtri" active={def.waf} onToggle={() => handleToggleDefense('waf')} icon={<Shield className="w-3.5 h-3.5" />} isDark={isDark} />
                  <DefenseToggle label="Bot Bloklash" active={def.botDetection} onToggle={() => handleToggleDefense('botDetection')} icon={<Radio className="w-3.5 h-3.5" />} isDark={isDark} />
                  <DefenseToggle label="Brute-Force Lock" active={def.bruteForceProtection} onToggle={() => handleToggleDefense('bruteForceProtection')} icon={<Lock className="w-3.5 h-3.5" />} isDark={isDark} />
                  <DefenseToggle label="Intrusion (IDS)" active={def.intrusionDetection} onToggle={() => handleToggleDefense('intrusionDetection')} icon={<Fingerprint className="w-3.5 h-3.5" />} isDark={isDark} />
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/20">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">Operatsion Tizim & Yadro (Kernel)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {diagnostics.platformName || 'Linux'} {diagnostics.arch || 'x64'}
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">OS (Tizim):</span>
                    <span className="font-bold font-mono text-white text-right truncate max-w-[180px]" title={diagnostics.osName}>{diagnostics.osName || 'Aniqlanmoqda...'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kernel (Yadro):</span>
                    <span className="font-mono text-cyan-300 text-[10px] truncate max-w-[180px]" title={diagnostics.kernel}>{diagnostics.kernel || 'Aniqlanmoqda...'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Uptime (Ishlash vaqti):</span>
                    <span className="font-bold text-emerald-400 font-mono text-[10px]">{m.uptime || 'Aniqlanmoqda...'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/20">
                    <span className="text-slate-400">Load Average (Yuklama):</span>
                    <span className="font-mono text-amber-300 text-[10px]">
                      {diagnostics.loadAvg?.[0] ?? '0.00'} (1m) · {diagnostics.loadAvg?.[1] ?? '0.00'} (5m) · {diagnostics.loadAvg?.[2] ?? '0.00'} (15m)
                    </span>
                  </div>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/20">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs">Ochiq Tarmoq Portlari & Xizmatlar</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    ss -tuln / netstat
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {diagnostics.ports && diagnostics.ports.length > 0 ? (
                    diagnostics.ports.map((p: any) => (
                      <div key={p.port} className={clsx('p-2 rounded-lg border flex flex-col justify-between', isDark ? 'bg-[#091024] border-[#182A4D]' : 'bg-slate-50 border-slate-200')}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-white">Port {p.port}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <span className="text-slate-400 text-[9px] mt-1 truncate" title={p.name}>{p.name}</span>
                        <span className="text-emerald-400 font-bold text-[8px] mt-0.5 uppercase">{p.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center text-slate-500 py-3 text-[10px]">
                      Ochiq portlar tekshirilmoqda...
                    </div>
                  )}
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-3 shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/20">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">Node.js & Backend Muhiti</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Node {diagnostics.nodeVersion || 'v20.x'}
                  </span>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Runtime & Engine:</span>
                    <span className="font-mono text-white">V8 {diagnostics.v8Version || '12.0'} · {diagnostics.arch || 'x64'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Node RSS / Heap:</span>
                    <span className="font-mono text-cyan-300">{diagnostics.memoryRss || '64 MB'} · Heap: {diagnostics.heapUsed || '32 MB'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ma'lumotlar Bazasi:</span>
                    <span className="font-mono text-emerald-400 font-bold">{diagnostics.databaseName || 'JSON / PostgreSQL DB'} ({diagnostics.dbStatus || 'Faol'})</span>
                  </div>
                  <div className="pt-1 border-t border-slate-700/20">
                    <span className="text-slate-400 block mb-1">Faol Xizmatlar & Modullar ({diagnostics.totalModulesCount || 8} ta):</span>
                    <div className="flex flex-wrap gap-1">
                      {(diagnostics.keyModules && diagnostics.keyModules.length > 0 ? diagnostics.keyModules : ['Express.js', 'Socket.IO', 'TypeScript', 'Prisma', 'JWT Guard', 'RateLimiter', 'Bcrypt', 'SystemInfo']).map((mod: string) => (
                        <span key={mod} className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'logs' && (
          <div className="space-y-3">
            
            <div className={clsx('p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2.5 justify-between', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="IP, yo'nalish (/api/...), foydalanuvchi yoki status kod bo'yicha qidirish..."
                  value={searchAccess}
                  onChange={(e) => setSearchAccess(e.target.value)}
                  className={clsx('w-full rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none border', isDark ? 'bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white' : 'bg-slate-50 border-slate-300 text-slate-900')}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select value={logCategoryFilter} onChange={(e: any) => setLogCategoryFilter(e.target.value)} className={clsx('rounded-lg px-2.5 py-1.5 text-xs border outline-none cursor-pointer', isDark ? 'bg-[#091024] border-[#1A2F57] text-white' : 'bg-slate-50 border-slate-300 text-slate-700')}>
                  <option value="all">Barcha hodisalar</option>
                  <option value="failed_logins">Xato kirishlar (401)</option>
                  <option value="success_logins">Muvaffaqiyatli kirishlar</option>
                  <option value="rate_limits">Rate-limit cheklovlari (429)</option>
                </select>
                <button onClick={handleClearLogs} className={clsx('px-2.5 py-1.5 rounded-lg border text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer', isDark ? 'border-[#1A2F57]' : 'border-slate-300')}>
                  Tozalash
                </button>
              </div>
            </div>

            
            <div className={clsx('rounded-xl border overflow-hidden', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className={clsx('text-[10px] uppercase font-black', isDark ? 'bg-[#091024] text-slate-400' : 'bg-slate-50 text-slate-500')}>
                    <th className="px-3 py-2 text-left">Vaqt</th>
                    <th className="px-3 py-2 text-left">IP / Mamlakat</th>
                    <th className="px-3 py-2 text-left">Metod & Endpoint</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">Tezlik</th>
                    <th className="px-3 py-2 text-left">Foydalanuvchi</th>
                    <th className="px-3 py-2 text-center">Daraja</th>
                    <th className="px-3 py-2 text-center">Amal</th>
                  </tr>
                </thead>
                <tbody className={clsx('divide-y', isDark ? 'divide-[#162748]' : 'divide-slate-100')}>
                  {filteredAccess.slice(0, 100).map((log) => (
                    <tr key={log.id} className={clsx('transition-colors', isDark ? 'hover:bg-[#0A1329]' : 'hover:bg-slate-50')}>
                      <td className="px-3 py-2 font-mono text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp.split(' ')[1] || log.timestamp}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span>{getFlagEmoji(log.countryCode)}</span>
                          <span className="font-mono text-cyan-400 font-bold">{log.ip}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono">
                        <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold mr-1.5', methodColor(log.method))}>{log.method}</span>
                        <span className={clsx('text-[11px]', isDark ? 'text-slate-200' : 'text-slate-800')}>{log.path}</span>
                      </td>
                      <td className="px-3 py-2 text-center"><span className={clsx('font-black font-mono', httpStatusColor(log.statusCode))}>{log.statusCode}</span></td>
                      <td className="px-3 py-2 text-center font-mono text-[10px]"><span className={log.responseTimeMs > 1000 ? 'text-amber-400' : 'text-slate-300'}>{log.responseTimeMs}ms</span></td>
                      <td className="px-3 py-2"><span className={clsx('text-[10px]', log.userName ? (isDark ? 'text-slate-200' : 'text-slate-700') : 'text-slate-500')}>{log.userName || 'Mehmon'}</span></td>
                      <td className="px-3 py-2 text-center"><span className={clsx('w-2 h-2 rounded-full inline-block', logLevelDot(log.level))} title={log.level} /></td>
                      <td className="px-3 py-2 text-center"><button onClick={() => openBlockModal(log.ip)} className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer" title="Bloklash"><Ban className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1 flex-wrap">
              {['all', 'active', 'investigating', 'blocked', 'resolved'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all', statusFilter === s ? 'bg-amber-500 text-slate-950' : isDark ? 'bg-[#0D1832] border border-[#182A4D] text-slate-400' : 'bg-white border border-slate-200 text-slate-500')}>
                  {s === 'all' ? 'Barchasi' : s === 'active' ? 'Faol' : s === 'investigating' ? 'Tekshirilmoqda' : s === 'blocked' ? 'Bloklangan' : 'Hal etildi'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-3 space-y-2.5">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={clsx(
                      'rounded-xl border p-3 space-y-2 cursor-pointer transition-all hover:shadow-lg',
                      isDark ? 'bg-[#0D1832] border-[#182A4D] hover:border-indigo-500/40' : 'bg-white border-slate-200',
                      selectedAlert?.id === alert.id && (isDark ? 'border-indigo-500/70 shadow-lg shadow-indigo-900/20' : 'border-indigo-400')
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx('text-xs font-black', isDark ? 'text-white' : 'text-slate-900')}>{alertTypeLabel(alert.type)}</span>
                        <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-black border uppercase', severityBadge(alert.severity))}>{severityLabel(alert.severity)}</span>
                        <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase', statusBadge(alert.status))}>{statusLabel(alert.status)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{alert.timestamp.split(' ')[1] || alert.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-mono text-cyan-400 font-bold">{alert.ip}</span>
                      <span className="text-slate-400">{getFlagEmoji(alert.countryCode)} {alert.country}</span>
                    </div>
                    <p className={clsx('text-[11px] leading-relaxed line-clamp-2', isDark ? 'text-slate-300' : 'text-slate-600')}>{alert.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={clsx('px-2 py-0.5 rounded text-[9px] font-mono', isDark ? 'bg-[#091024]' : 'bg-slate-100')}>{alert.requestCount} req/{alert.timeWindowSec}s</span>
                      {alert.status !== 'blocked' && <button onClick={(e) => { e.stopPropagation(); openBlockModal(alert.ip, alert.description); }} className="px-2 py-0.5 bg-rose-600/80 text-white rounded text-[9px] font-bold cursor-pointer hover:bg-rose-500">IP Bloklash</button>}
                      {alert.status !== 'resolved' && <button onClick={(e) => { e.stopPropagation(); store.resolveAlert(alert.id); }} className={clsx('px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer', isDark ? 'bg-[#162748] text-slate-300' : 'bg-slate-100 text-slate-600')}>✓ Hal etildi</button>}
                    </div>
                  </div>
                ))}
                {filteredAlerts.length === 0 && (
                  <div className={clsx('text-center py-10 rounded-xl border', isDark ? 'border-[#182A4D] bg-[#0D1832]' : 'border-slate-200 bg-white')}>
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400/40" />
                    <p className="text-xs text-slate-500">Ogohlantirish topilmadi</p>
                  </div>
                )}
              </div>

              
              <div className={clsx('lg:col-span-2 rounded-xl border sticky top-4 h-fit', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className={clsx('px-3 py-2.5 border-b flex items-center gap-2', isDark ? 'border-[#182A4D] bg-[#091024]' : 'border-slate-200 bg-slate-50')}>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className={clsx('text-xs font-bold', isDark ? 'text-white' : 'text-slate-900')}>Hodisa Tafsilotlari & Tavsiya</span>
                </div>
                <div className="p-3">
                  {selectedAlert ? (
                    <div className="space-y-3">
                      <div className={clsx('p-2.5 rounded-lg border', isDark ? 'bg-[#091024] border-[#182A4D]' : 'bg-slate-50 border-slate-200')}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">{alertTypeLabel(selectedAlert.type)}</span>
                          <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-black border uppercase', severityBadge(selectedAlert.severity))}>
                            {severityLabel(selectedAlert.severity)}
                          </span>
                        </div>
                        <div className="text-[11px] text-cyan-400 font-mono mt-1 font-bold">{selectedAlert.ip}</div>
                        <div className="text-[10px] text-slate-400">{selectedAlert.country} · {selectedAlert.timestamp}</div>
                      </div>

                      <div className={clsx('p-3 rounded-xl border space-y-2', isDark ? 'bg-[#050A18] border-blue-900/40' : 'bg-blue-50/50 border-blue-200')}>
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Tavsiflangan Sabab:</div>
                        <p className={clsx('text-[11px] leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-800')}>
                          {selectedAlert.description}
                        </p>
                        <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                          Yuklama: {selectedAlert.requestCount} ta so'rov / {selectedAlert.timeWindowSec} sekund
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openBlockModal(selectedAlert.ip, selectedAlert.description)}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          IP Bloklash
                        </button>
                        <button
                          onClick={() => store.resolveAlert(selectedAlert.id)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Hal Qilindi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <p className="text-[11px] text-slate-500">Tafsilotlarni ko'rish uchun ro'yxatdan tahdidni tanlang</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'blocked' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={clsx('text-xs font-bold', isDark ? 'text-white' : 'text-slate-900')}>{store.blockedIPs.length} ta IP bloklangan</span>
              <button onClick={() => openBlockModal()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer"><Ban className="w-3.5 h-3.5" />Yangi IP Bloklash</button>
            </div>
            <div className={clsx('rounded-xl border overflow-hidden', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className={clsx('text-[10px] uppercase font-black', isDark ? 'bg-[#091024] text-slate-400' : 'bg-slate-50 text-slate-500')}>
                    <th className="px-3 py-2 text-left">IP / Mamlakat</th>
                    <th className="px-3 py-2 text-left">Sabab</th>
                    <th className="px-3 py-2 text-left">Vaqt</th>
                    <th className="px-3 py-2 text-center">Turi</th>
                    <th className="px-3 py-2 text-center">Amal</th>
                  </tr>
                </thead>
                <tbody className={clsx('divide-y', isDark ? 'divide-[#162748]' : 'divide-slate-100')}>
                  {store.blockedIPs.map((b) => (
                    <tr key={b.ip} className={clsx('transition-colors', isDark ? 'hover:bg-[#0A1329]' : 'hover:bg-slate-50')}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {getFlagEmoji(b.countryCode)}
                          <div>
                            <div className="font-mono font-black text-rose-400 text-[11px]">{b.ip}</div>
                            <div className="text-[9px] text-slate-400">{b.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-[240px]"><span className={clsx('text-[10px]', isDark ? 'text-slate-300' : 'text-slate-600')}>{b.reason}</span></td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">{b.blockedAt}</td>
                      <td className="px-3 py-2.5 text-center"><span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold border', b.permanent ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')}>{b.permanent ? 'Doimiy' : 'Vaqtinchalik'}</span></td>
                      <td className="px-3 py-2.5 text-center"><button onClick={() => handleUnblockIP(b.ip)} className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"><Unlock className="w-3 h-3 inline mr-0.5" />Ochish</button></td>
                    </tr>
                  ))}
                  {store.blockedIPs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                        <ShieldCheck className="w-6 h-6 mx-auto mb-1 text-emerald-400/30" />
                        Bloklangan IP lar mavjud emas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={clsx('rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border', isDark ? 'bg-[#0D1832] border-[#1E3563]' : 'bg-white border-slate-200')}>
            <div className={clsx('flex items-center justify-between border-b pb-3', isDark ? 'border-[#182A4D]' : 'border-slate-200')}>
              <h3 className={clsx('text-sm font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-slate-900')}><Ban className="w-4 h-4 text-rose-400" />IP Bloklash</h3>
              <button onClick={() => setIsBlockModalOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={clsx('block text-[11px] font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>IP Manzil *</label>
                <input type="text" value={blockModalIP} onChange={(e) => setBlockModalIP(e.target.value)} placeholder="192.168.1.1"
                  className={clsx('w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono', isDark ? 'bg-[#091024] border-[#1A2F57] focus:border-rose-400 text-white' : 'bg-slate-50 border-slate-300 text-slate-900')} />
              </div>
              <div>
                <label className={clsx('block text-[11px] font-semibold mb-1', isDark ? 'text-slate-300' : 'text-slate-700')}>Sabab *</label>
                <input type="text" value={blockModalReason} onChange={(e) => setBlockModalReason(e.target.value)} placeholder="Masalan: DDoS hujumi..."
                  className={clsx('w-full rounded-lg px-3 py-2 text-xs outline-none border', isDark ? 'bg-[#091024] border-[#1A2F57] focus:border-rose-400 text-white' : 'bg-slate-50 border-slate-300 text-slate-900')} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={clsx('relative w-8 h-4 rounded-full transition-all', blockModalPermanent ? 'bg-rose-500' : isDark ? 'bg-[#162748]' : 'bg-slate-300')} onClick={() => setBlockModalPermanent(!blockModalPermanent)}>
                  <div className={clsx('absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all', blockModalPermanent ? 'left-4' : 'left-0.5')} />
                </div>
                <span className={clsx('text-[11px] font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>Doimiy bloklash</span>
              </label>
            </div>
            <div className={clsx('flex justify-end gap-2 pt-2 border-t', isDark ? 'border-[#182A4D]' : 'border-slate-200')}>
              <button onClick={() => setIsBlockModalOpen(false)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border', isDark ? 'bg-[#162748] text-slate-300 border-[#1E365E]' : 'bg-slate-100 text-slate-700 border-slate-300')}>Bekor</button>
              <button onClick={() => { if (blockModalIP && blockModalReason.trim()) { handleBlockIP(blockModalIP, blockModalReason.trim(), blockModalPermanent); setIsBlockModalOpen(false); } }} disabled={!blockModalIP || !blockModalReason.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"><Ban className="w-3.5 h-3.5" />Bloklash</button>
            </div>
          </div>
        </div>
      )}
    </EgaLayout>
  );
};
