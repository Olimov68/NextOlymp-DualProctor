import React, { useState, useMemo, useEffect, useRef } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useProctoringStore } from '../../store/useProctoringStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ProctorStudentSession, ProctorAlert, ViolationType } from '../../data/initialProctoring';
import { clsx } from 'clsx';
import {
  Video, Eye, Mic, MicOff, Volume2, VolumeX, ShieldAlert, ShieldCheck, ShieldX,
  AlertTriangle, CheckCircle2, XCircle, Search, Filter, Ban, RefreshCw, X, Play,
  Pause, Sparkles, UserX, UserCheck, Monitor, Laptop, ExternalLink, Settings2,
  Sliders, Camera, Radio, Terminal, Flame, Zap, Clock, Maximize2, AlertOctagon,
  Volume1, Activity, Flag, Award, ChevronRight, Layers, FileText, Smartphone,
  Copy, EyeOff, Users, ScreenShare, Shield, Send, Cpu, KeyRound, Network, BarChart3
} from 'lucide-react';

import { EdgeAudioMonitor, handleTriggeredIncident } from '../../services/edgeProctoringService';
import {
  DEMO_SUBMISSION_RECORDS,
  analyzeStudentRecord,
  generateAiForensicReport,
  StatisticalAnomalyResult,
  AiForensicReport,
  StudentSubmissionRecord
} from '../../services/statisticalAnalysisService';
import { MultiMonitorDetector } from '../../services/networkSecurityService';

type Tab = 'grid' | 'alerts' | 'inspect' | 'rules' | 'forensics';
type GridCols = '2x2' | '3x3' | '4x4';

export const EgaProctoringPage: React.FC = () => {
  const store = useProctoringStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<Tab>('grid');
  const [gridSize, setGridSize] = useState<GridCols>('3x3');
  const [selectedOlympiad, setSelectedOlympiad] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');

  
  const [warningModalSession, setWarningModalSession] = useState<ProctorStudentSession | null>(null);
  const [warningMessage, setWarningMessage] = useState('Iltimos, diqqat bilan kameraga qarang va begona oynalarga o\'tmang!');
  const [penaltyModalSession, setPenaltyModalSession] = useState<ProctorStudentSession | null>(null);
  const [penaltyAmount, setPenaltyAmount] = useState(50);
  const [penaltyReason, setPenaltyReason] = useState('Tab almashtirish va shubhali harakat');
  
  
  const [isRealCamModalOpen, setIsRealCamModalOpen] = useState(false);
  const [realCamStream, setRealCamStream] = useState<MediaStream | null>(null);
  const [realCamError, setRealCamError] = useState<string | null>(null);
  const [realCamVolume, setRealCamVolume] = useState<number>(0);
  const [realCamStatus, setRealCamStatus] = useState<string>('Holat: Normal (Yuz aniqlandi)');
  const [realCamWarning, setRealCamWarning] = useState<boolean>(false);
  const realVideoRef = useRef<HTMLVideoElement>(null);
  const audioMonitorRef = useRef<EdgeAudioMonitor | null>(null);

  
  const [selectedForensicUser, setSelectedForensicUser] = useState<string>(DEMO_SUBMISSION_RECORDS[0]?.userId || '');
  const [aiForensicLoading, setAiForensicLoading] = useState<boolean>(false);
  const [aiForensicReport, setAiForensicReport] = useState<AiForensicReport | null>(null);
  const [multiMonitorStatus, setMultiMonitorStatus] = useState<string>('Tekshirilmoqda...');

  useEffect(() => {
    const isMulti = MultiMonitorDetector.isMultiMonitor();
    setMultiMonitorStatus(isMulti ? 'Ikkinchi monitor (isExtended) aniqlangan' : 'Yagona monitor (Oddiy rejim)');
  }, []);

  const activeForensicRecord = useMemo(() => {
    return DEMO_SUBMISSION_RECORDS.find((r) => r.userId === selectedForensicUser) || DEMO_SUBMISSION_RECORDS[0];
  }, [selectedForensicUser]);

  const activeAnomalyResult = useMemo(() => {
    if (!activeForensicRecord) return null;
    return analyzeStudentRecord(activeForensicRecord, DEMO_SUBMISSION_RECORDS);
  }, [activeForensicRecord]);

  const handleRunAiForensic = async () => {
    if (!activeForensicRecord || !activeAnomalyResult) return;
    setAiForensicLoading(true);
    try {
      const report = await generateAiForensicReport(activeForensicRecord, activeAnomalyResult);
      setAiForensicReport(report);
    } catch {
      
    } finally {
      setAiForensicLoading(false);
    }
  };

  
  useEffect(() => {
    if (!store.isLiveProctoringActive) return;

    const interval = setInterval(() => {
      
      if (store.listeningStudentId) {
        store.setAudioVolumeMeter(Math.max(5, Math.min(95, Math.floor(Math.random() * 60) + 15)));
      }

      
      if (store.autoProctorAi && Math.random() < 0.07) {
        const activeSessions = store.sessions.filter((s) => s.status === 'active' || s.status === 'warning');
        if (activeSessions.length > 0) {
          const target = activeSessions[Math.floor(Math.random() * activeSessions.length)];
          const eventTypes: { type: ViolationType; title: string; desc: string; sev: 'past' | 'orta' | 'yuqori' | 'kritik' }[] = [
            { type: 'looking_away', title: 'Ko\'z uzilishi / Chetdan qarash', desc: 'O\'quvchi 8 soniya davomida ekranga qaramadi (TensorFlow Eye-Gaze score: 48%).', sev: 'past' },
            { type: 'tab_switch', title: 'Brauzer tabini almashtirish urinishi', desc: 'O\'quvchi boshqa ilovaga o\'tishga urindi (Alt+Tab aniqlandi).', sev: 'orta' },
            { type: 'audio_anomaly', title: 'Ovoz va shivirlash anomaliyasi', desc: 'Mikrofonda 45dB dan yuqori shivirlash va tashqi ovoz qayd etildi.', sev: 'orta' },
            { type: 'copy_paste', title: 'Matn nusxalash (Copy) urinishi', desc: 'Test savoli matnini clipboard ga nusxalashga urinish bloklandi.', sev: 'orta' },
          ];
          const ev = eventTypes[Math.floor(Math.random() * eventTypes.length)];
          store.addLiveAlert({
            sessionId: target.id,
            userId: target.userId,
            studentName: target.name,
            olympiadTitle: target.olympiadTitle,
            type: ev.type,
            title: ev.title,
            description: ev.desc,
            severity: ev.sev,
            snapshotUrl: target.avatarUrl,
            status: 'yangi',
          });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [store.isLiveProctoringActive, store.listeningStudentId, store.autoProctorAi]);

  
  const handleOpenRealCam = async () => {
    setIsRealCamModalOpen(true);
    setRealCamError(null);
    setRealCamStatus('Holat: Normal (Yuz aniqlandi)');
    setRealCamWarning(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      setRealCamStream(stream);
      if (realVideoRef.current) {
        realVideoRef.current.srcObject = stream;
      }

      const audioMonitor = new EdgeAudioMonitor();
      audioMonitorRef.current = audioMonitor;
      audioMonitor.start(
        stream,
        (vol) => setRealCamVolume(vol),
        (reason) => {
          setRealCamStatus(`Ogohlantirish: ${reason}`);
          setRealCamWarning(true);
          if (realVideoRef.current) {
            handleTriggeredIncident(reason, realVideoRef.current);
          }
        }
      );
    } catch (err: any) {
      console.warn('Real webcam error:', err);
      setRealCamError(err.message || 'Kamera yoki mikrofonga ruxsat berilmadi');
    }
  };

  const handleCloseRealCam = () => {
    if (audioMonitorRef.current) {
      audioMonitorRef.current.stop();
      audioMonitorRef.current = null;
    }
    if (realCamStream) {
      realCamStream.getTracks().forEach((t) => t.stop());
      setRealCamStream(null);
    }
    setIsRealCamModalOpen(false);
  };

  
  const filteredSessions = useMemo(() => {
    return store.sessions.filter((s) => {
      const matchOlymp = selectedOlympiad === 'all' || s.olympiadTitle.toLowerCase().includes(selectedOlympiad.toLowerCase());
      const matchSearch = s.name.toLowerCase().includes(searchStudent.toLowerCase()) || s.school.toLowerCase().includes(searchStudent.toLowerCase()) || s.region.toLowerCase().includes(searchStudent.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchOlymp && matchSearch && matchStatus;
    });
  }, [store.sessions, selectedOlympiad, searchStudent, statusFilter]);

  
  const activeCount = useMemo(() => store.sessions.filter((s) => s.status === 'active').length, [store.sessions]);
  const warningCount = useMemo(() => store.sessions.filter((s) => s.status === 'warning').length, [store.sessions]);
  const pausedCount = useMemo(() => store.sessions.filter((s) => s.status === 'paused').length, [store.sessions]);
  const disqualifiedCount = useMemo(() => store.sessions.filter((s) => s.status === 'disqualified').length, [store.sessions]);
  const avgFocus = useMemo(() => Math.round(store.sessions.reduce((sum, s) => sum + s.eyeGazeScore, 0) / (store.sessions.length || 1)), [store.sessions]);

  
  const inspectingSession = useMemo(() => {
    return store.sessions.find((s) => s.id === store.selectedSessionId) || store.sessions[0];
  }, [store.sessions, store.selectedSessionId]);

  
  const olympiadOptions = useMemo(() => {
    const set = new Set(store.sessions.map((s) => s.olympiadTitle));
    return Array.from(set);
  }, [store.sessions]);

  return (
    <EgaLayout>
      <div className="space-y-3 font-sans text-xs">
        
        <div className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border shadow-sm', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/40">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h1 className={clsx('text-base font-bold flex items-center gap-2', isDark ? 'text-white' : 'text-slate-900')}>
                  Jonli Proktoring & Anti-Cheating Markazi
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 text-emerald-300 border border-emerald-500/30">
                    TENSORFLOW AI ACTIVE
                  </span>
                </h1>
                <p className={clsx('text-[11px]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  O'quvchilar test jarayonini real vaqtda videokamera, ovoz va sun'iy intellekt orqali nazorat qilish
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            <button
              onClick={handleOpenRealCam}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shadow-sm',
                isDark ? 'bg-[#112144] border-[#1E365E] text-slate-200 hover:bg-[#182F5E]' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              )}
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              Kameramni Sinash
            </button>

            
            <button
              onClick={() => store.setAutoProctorAi(!store.autoProctorAi)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                store.autoProctorAi
                  ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                  : 'bg-slate-600/20 border-slate-500/40 text-slate-400'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Detektor: {store.autoProctorAi ? 'ON' : 'OFF'}
            </button>

            
            <button
              onClick={() => store.setLiveProctoring(!store.isLiveProctoringActive)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer',
                store.isLiveProctoringActive
                  ? 'bg-emerald-600/90 border-emerald-500 text-white'
                  : isDark ? 'bg-[#112144] border-[#1E365E] text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
              )}
            >
              {store.isLiveProctoringActive ? <Radio className="w-3.5 h-3.5 animate-pulse text-rose-300" /> : <EyeOff className="w-3.5 h-3.5" />}
              {store.isLiveProctoringActive ? 'JONLI EFIR' : 'To\'xtatilgan'}
              {store.isLiveProctoringActive && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className={clsx('p-3 rounded-xl border flex items-center gap-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-400">{activeCount} nafar</div>
              <div className="text-[10px] text-slate-400">Faol Testda</div>
            </div>
          </div>

          <div className={clsx('p-3 rounded-xl border flex items-center gap-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-amber-400">{warningCount} ta</div>
              <div className="text-[10px] text-slate-400">Ogohlantirilgan</div>
            </div>
          </div>

          <div className={clsx('p-3 rounded-xl border flex items-center gap-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
              <Pause className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-blue-400">{pausedCount} ta</div>
              <div className="text-[10px] text-slate-400">Muzlatilgan</div>
            </div>
          </div>

          <div className={clsx('p-3 rounded-xl border flex items-center gap-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-rose-400">{disqualifiedCount} ta</div>
              <div className="text-[10px] text-slate-400">Diskvalifikatsiya</div>
            </div>
          </div>

          <div className={clsx('p-3 rounded-xl border flex items-center gap-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-indigo-300">{avgFocus}%</div>
              <div className="text-[10px] text-slate-400">O'rtacha Diqqat (AI)</div>
            </div>
          </div>
        </div>

        
        {store.listeningStudentId && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-900/50 via-purple-900/40 to-indigo-950/60 border border-indigo-500/50 animate-pulse">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-indigo-400 animate-bounce" />
              <div>
                <span className="text-indigo-200 font-bold text-xs">
                  🎧 Jonli Ovoz Eshitilmoqda:{' '}
                  <span className="text-amber-300 font-black">
                    {store.sessions.find((s) => s.id === store.listeningStudentId)?.name || 'O\'quvchi'}
                  </span>
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-300"
                      style={{ width: `${store.audioVolumeMeter}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">{store.audioVolumeMeter} dB</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => store.stopListeningAudio()}
              className="px-3 py-1 bg-rose-600/80 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-md"
            >
              <VolumeX className="w-3.5 h-3.5" /> Eshitishni To'xtatish
            </button>
          </div>
        )}

        
        <div className={clsx('flex items-center gap-1 overflow-x-auto p-1 rounded-xl border', isDark ? 'bg-[#0A1526] border-[#182A4D]' : 'bg-slate-50 border-slate-200')}>
          {[
            { id: 'grid', label: 'Jonli Kamera Zali (Grid)', icon: <Video className="w-3.5 h-3.5" />, badge: filteredSessions.length },
            { id: 'alerts', label: 'Anti-Cheating Xabarnomalar', icon: <ShieldAlert className="w-3.5 h-3.5" />, badge: store.alerts.filter((a) => a.status === 'yangi').length || undefined },
            { id: 'inspect', label: 'Batafsil O\'quvchi Nazorati', icon: <Eye className="w-3.5 h-3.5" /> },
            { id: 'rules', label: 'Anti-Cheating Qoidalari & AI', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 'forensics', label: 'Statistik Tahlil & Tarmoq Himoyasi', icon: <BarChart3 className="w-3.5 h-3.5" />, badge: 'AI LAB' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap',
                activeTab === tab.id
                  ? isDark ? 'bg-[#1B3260] text-amber-400 font-bold shadow-md' : 'bg-white text-amber-600 font-bold shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-[#11203E]' : 'text-slate-500 hover:text-slate-900 hover:bg-white'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-black', tab.id === 'alerts' ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-500/20 text-slate-400')}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        
        {activeTab === 'grid' && (
          <div className="space-y-3">
            
            <div className={clsx('p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="flex items-center gap-2 flex-1 min-w-64">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="O'quvchi ismi, maktab, tuman..."
                    className={clsx(
                      'w-full rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none border',
                      isDark ? 'bg-[#050B18] border-[#1A2F57] text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                    )}
                  />
                </div>
                <select
                  value={selectedOlympiad}
                  onChange={(e) => setSelectedOlympiad(e.target.value)}
                  className={clsx(
                    'rounded-lg px-2.5 py-1.5 text-xs outline-none border font-semibold max-w-[200px] truncate',
                    isDark ? 'bg-[#050B18] border-[#1A2F57] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                  )}
                >
                  <option value="all">Barcha Olimpiadalar</option>
                  {olympiadOptions.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              
              <div className="flex items-center gap-1.5">
                <div className={clsx('flex items-center p-0.5 rounded-lg border', isDark ? 'bg-[#050B18] border-[#1A2F57]' : 'bg-slate-100 border-slate-300')}>
                  {(['2x2', '3x3', '4x4'] as GridCols[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGridSize(g)}
                      className={clsx(
                        'px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all',
                        gridSize === g ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-[10px]">
                  {['all', 'active', 'warning', 'paused'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={clsx(
                        'px-2 py-1 rounded font-bold uppercase transition-all cursor-pointer',
                        statusFilter === st
                          ? 'bg-amber-500 text-slate-950'
                          : isDark ? 'text-slate-400 hover:bg-[#11203E]' : 'text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {st === 'all' ? 'Barchasi' : st === 'active' ? 'Faol' : st === 'warning' ? 'Shubhali' : 'Muzlatilgan'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            
            <div className={clsx(
              'grid gap-3',
              gridSize === '2x2' ? 'grid-cols-1 sm:grid-cols-2' :
              gridSize === '3x3' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}>
              {filteredSessions.map((student) => {
                const isListeningThis = store.listeningStudentId === student.id;
                const hasWarning = student.warningCount > 0 || student.status === 'warning';
                const isPaused = student.status === 'paused';
                const isDisqualified = student.status === 'disqualified';

                return (
                  <div
                    key={student.id}
                    className={clsx(
                      'rounded-2xl border overflow-hidden transition-all relative flex flex-col group shadow-sm',
                      isDisqualified ? 'bg-rose-950/20 border-rose-600/50 opacity-60' :
                      isPaused ? 'bg-blue-950/20 border-blue-500/50' :
                      hasWarning ? 'bg-amber-950/15 border-amber-500/60 shadow-amber-900/20' :
                      isDark ? 'bg-[#0D1832] border-[#182A4D] hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:shadow-md'
                    )}
                  >
                    
                    <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                      
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className={clsx(
                          'w-full h-full object-cover transition-transform duration-700',
                          student.faceDetected ? 'scale-105' : 'grayscale opacity-30'
                        )}
                      />

                      
                      {student.faceDetected && (
                        <div
                          className={clsx(
                            'absolute border-2 rounded-lg transition-all pointer-events-none flex flex-col justify-between p-1',
                            student.multipleFaces ? 'border-rose-500 bg-rose-500/10 animate-pulse' :
                            student.eyeGazeScore < 60 ? 'border-amber-400 bg-amber-400/10' :
                            'border-emerald-400 bg-emerald-400/5'
                          )}
                          style={{ top: '15%', left: '25%', width: '50%', height: '65%' }}
                        >
                          <div className="flex items-center justify-between text-[8px] font-mono text-white bg-black/80 px-1 py-0.5 rounded w-fit">
                            <span>{student.multipleFaces ? '⚠ MULTI-FACE' : 'FACE: 98.4%'}</span>
                          </div>
                          <div className="text-[8px] font-mono text-white bg-black/80 px-1 py-0.5 rounded w-fit self-end">
                            Gaze: {student.eyeGazeScore}%
                          </div>
                        </div>
                      )}

                      
                      {!student.faceDetected && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-rose-400 gap-1">
                          <EyeOff className="w-8 h-8 animate-pulse" />
                          <span className="text-[10px] font-bold">KADRDA SHAXS YO'Q!</span>
                        </div>
                      )}

                      {student.phoneDetected && (
                        <div className="absolute bottom-2 right-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg animate-bounce">
                          <Smartphone className="w-3 h-3" /> TELEFON!
                        </div>
                      )}

                      
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className={clsx(
                          'px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-md flex items-center gap-1',
                          isDisqualified ? 'bg-rose-600 text-white' :
                          isPaused ? 'bg-blue-600 text-white' :
                          hasWarning ? 'bg-amber-500 text-slate-950 animate-pulse' :
                          'bg-emerald-600 text-white'
                        )}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          {isDisqualified ? 'CHIQARILDI' : isPaused ? 'TO\'XTATILGAN' : hasWarning ? 'OGOHLANTIRISH' : 'FAOL'}
                        </span>
                      </div>

                      
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={() => store.toggleListenAudio(student.id)}
                          title={isListeningThis ? "Ovoz eshitishni to'xtatish" : "O'quvchi ovozini eshitish"}
                          className={clsx(
                            'p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md flex items-center gap-1',
                            isListeningThis
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-black/60 hover:bg-black/90 text-slate-200'
                          )}
                        >
                          {isListeningThis ? <Volume2 className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        </button>
                      </div>

                      
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 flex items-center justify-between text-white text-[10px]">
                        <span className="font-bold font-mono">Savol {student.currentQuestion}/{student.totalQuestions}</span>
                        <span className="font-mono text-amber-300">⏱ {Math.floor(student.timeRemainingSec / 60)} daq</span>
                      </div>
                    </div>

                    
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className={clsx('font-bold text-xs truncate', isDark ? 'text-white' : 'text-slate-900')}>
                            {student.name}
                          </h3>
                          <span className="text-[10px] text-amber-400 font-black">{student.scoreXP} XP</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {student.school} · {student.district}
                        </p>
                      </div>

                      
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                        <div className={clsx('p-1 rounded text-center', student.tabSwitchesCount > 0 ? 'bg-amber-500/20 text-amber-300 font-bold' : isDark ? 'bg-[#091024] text-slate-400' : 'bg-slate-100 text-slate-600')}>
                          Tab: {student.tabSwitchesCount}
                        </div>
                        <div className={clsx('p-1 rounded text-center', student.copyPasteAttempts > 0 ? 'bg-rose-500/20 text-rose-300 font-bold' : isDark ? 'bg-[#091024] text-slate-400' : 'bg-slate-100 text-slate-600')}>
                          Copy: {student.copyPasteAttempts}
                        </div>
                        <div className={clsx('p-1 rounded text-center', student.eyeGazeScore < 70 ? 'bg-amber-500/20 text-amber-300 font-bold' : isDark ? 'bg-[#091024] text-emerald-400' : 'bg-slate-100 text-emerald-600')}>
                          Fokus: {student.eyeGazeScore}%
                        </div>
                      </div>

                      
                      {student.latestViolation && (
                        <div className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{student.latestViolation}</span>
                        </div>
                      )}

                      
                      <div className="pt-2 border-t border-[#182A4D] flex items-center justify-between gap-1">
                        <button
                          onClick={() => {
                            store.setSelectedSessionId(student.id);
                            setActiveTab('inspect');
                          }}
                          className={clsx(
                            'px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1',
                            isDark ? 'bg-[#162748] text-slate-200 hover:bg-indigo-600 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white'
                          )}
                        >
                          <Eye className="w-3 h-3" /> Nazorat
                        </button>

                        <button
                          onClick={() => {
                            setWarningModalSession(student);
                          }}
                          className="p-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded text-[10px] font-bold cursor-pointer transition-all"
                          title="Ogohlantirish yuborish"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setPenaltyModalSession(student);
                          }}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                          title="Jarima ball ayirish"
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>

                        {student.status === 'paused' ? (
                          <button
                            onClick={() => store.resumeExam(student.id)}
                            className="p-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Testni davom ettirish"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => store.pauseExam(student.id)}
                            className="p-1.5 bg-blue-600/80 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                            title="Testni vaqtinchalik muzlatish"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`${student.name} ni olimpiadadan diskvalifikatsiya qilmoqchimisiz?`)) {
                              store.disqualifyStudent(student.id, 'Proktor tomonidan to\'g\'ridan-to\'g\'ri diskvalifikatsiya');
                            }
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                          title="Diskvalifikatsiya qilish"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {['all', 'multiple_faces', 'phone_detected', 'no_face', 'tab_switch', 'copy_paste', 'devtools_open'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAlertTypeFilter(type)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all',
                      alertTypeFilter === type
                        ? 'bg-amber-500 text-slate-950'
                        : isDark ? 'bg-[#0D1832] border border-[#182A4D] text-slate-400' : 'bg-white border border-slate-200 text-slate-600'
                    )}
                  >
                    {type === 'all' ? 'Barchasi' :
                     type === 'multiple_faces' ? '👥 Ko\'p shaxs' :
                     type === 'phone_detected' ? '📱 Telefon' :
                     type === 'no_face' ? '👤 Kadrda yo\'q' :
                     type === 'tab_switch' ? '📑 Tab switch' :
                     type === 'copy_paste' ? '📋 Copy/Paste' : '🛠️ DevTools'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => store.clearAlerts()}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                Tarixni tozalash
              </button>
            </div>

            <div className="space-y-2.5">
              {store.alerts
                .filter((a) => alertTypeFilter === 'all' || a.type === alertTypeFilter)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={clsx(
                      'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all',
                      alert.severity === 'kritik' ? 'bg-rose-950/20 border-rose-500/40' :
                      alert.severity === 'yuqori' ? 'bg-orange-950/20 border-orange-500/40' :
                      isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <img
                        src={alert.snapshotUrl}
                        alt={alert.studentName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-rose-500/50 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">{alert.studentName}</span>
                          <span className={clsx(
                            'px-1.5 py-0.5 rounded text-[9px] font-black uppercase border',
                            alert.severity === 'kritik' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                            alert.severity === 'yuqori' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                            'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          )}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                        </div>
                        <h4 className="text-xs font-bold text-amber-300">{alert.title}</h4>
                        <p className={clsx('text-[11px] leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-600')}>
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {alert.status === 'yangi' && (
                        <>
                          <button
                            onClick={() => store.sendWarning(alert.sessionId, alert.title)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow"
                          >
                            ⚠️ Ogohlantirish
                          </button>
                          <button
                            onClick={() => store.applyPenalty(alert.sessionId, 100, alert.title)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
                          >
                            -100 XP Jarima
                          </button>
                          <button
                            onClick={() => store.resolveAlert(alert.id, 'korildi')}
                            className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer', isDark ? 'bg-[#162748] text-slate-300' : 'bg-slate-100 text-slate-700')}
                          >
                            ✓ Ko'rildi
                          </button>
                        </>
                      )}
                      {alert.status !== 'yangi' && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ✓ Hal etilgan ({alert.status})
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              {store.alerts.length === 0 && (
                <div className={clsx('text-center py-12 rounded-xl border', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400">Hozircha hech qanday qoidabuzarlik aniqlanmadi.</p>
                </div>
              )}
            </div>
          </div>
        )}

        
        {activeTab === 'inspect' && inspectingSession && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            <div className="lg:col-span-8 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className={clsx('rounded-xl border overflow-hidden', isDark ? 'bg-[#050B18] border-[#182A4D]' : 'bg-black')}>
                  <div className="p-2.5 bg-black/60 border-b border-[#182A4D] flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-indigo-400" /> Web Kamera (Jonli)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">1080p · 30 FPS</span>
                  </div>
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    <img src={inspectingSession.avatarUrl} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute border-2 border-emerald-400 rounded-lg pointer-events-none p-1"
                      style={{ top: '15%', left: '25%', width: '50%', height: '65%' }}
                    >
                      <span className="bg-black/80 text-emerald-300 font-mono text-[9px] px-1 rounded">Face Landmark Tracked</span>
                    </div>
                  </div>
                </div>

                
                <div className={clsx('rounded-xl border overflow-hidden', isDark ? 'bg-[#050B18] border-[#182A4D]' : 'bg-slate-900')}>
                  <div className="p-2.5 bg-black/60 border-b border-[#182A4D] flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1.5"><ScreenShare className="w-3.5 h-3.5 text-blue-400" /> Ekran Oqimi (Test Oynasi)</span>
                    <span className="text-[10px] text-blue-300 font-mono">Full Screen Active</span>
                  </div>
                  <div className="relative aspect-video bg-slate-900 p-3 flex flex-col justify-between font-mono text-[10px] text-slate-300">
                    <div className="p-2 rounded bg-slate-800 border border-slate-700">
                      <div className="text-amber-300 font-bold">Savol #{inspectingSession.currentQuestion}:</div>
                      <div className="text-[9px] mt-1 text-slate-400">Agar f(x) = 2x^2 + 5x bo'lsa, f'(3) ni hisoblang...</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[8px]">
                      <div className="p-1 rounded bg-slate-800/80">A) 17</div>
                      <div className="p-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500">B) 17 [Tanlandi]</div>
                      <div className="p-1 rounded bg-slate-800/80">C) 12</div>
                      <div className="p-1 rounded bg-slate-800/80">D) 21</div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className={clsx('p-4 rounded-xl border space-y-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <h3 className="text-xs font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Jonli Harakatlar Logi (Keylog & Browser Events)
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                  <div className="p-1.5 rounded bg-emerald-950/20 text-emerald-300 flex items-center justify-between">
                    <span>[23:04:12] Savol #18 javobi belgilandi (Option B).</span>
                    <span className="text-slate-500">OK</span>
                  </div>
                  <div className="p-1.5 rounded bg-amber-950/20 text-amber-300 flex items-center justify-between">
                    <span>[23:02:40] Ko'z qarashi ekrandan chetga uzildi (TensorFlow Yaw: +34°).</span>
                    <span className="text-amber-400">Warning</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/40 text-slate-400 flex items-center justify-between">
                    <span>[23:01:05] Savol #17 ochildi.</span>
                    <span className="text-slate-500">Normal</span>
                  </div>
                </div>
              </div>
            </div>

            
            <div className={clsx('lg:col-span-4 p-4 rounded-xl border space-y-4', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="flex items-center gap-3 pb-3 border-b border-[#182A4D]">
                <img src={inspectingSession.avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                <div>
                  <h3 className="font-bold text-sm text-white">{inspectingSession.name}</h3>
                  <p className="text-[10px] text-slate-400">{inspectingSession.school}</p>
                  <p className="text-[10px] text-amber-400 font-bold">{inspectingSession.olympiadTitle}</p>
                </div>
              </div>

              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Olimpiada Balli:</span>
                  <span className="font-bold text-amber-300">{inspectingSession.scoreXP} XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jarima Ballari:</span>
                  <span className="font-bold text-rose-400">-{inspectingSession.penaltyXP} XP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ogohlantirishlar:</span>
                  <span className="font-bold text-amber-400">{inspectingSession.warningCount} / 3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Diqqat Darajasi (AI):</span>
                  <span className="font-bold text-emerald-400">{inspectingSession.eyeGazeScore}%</span>
                </div>
              </div>

              
              <button
                onClick={() => store.toggleListenAudio(inspectingSession.id)}
                className={clsx(
                  'w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md',
                  store.listeningStudentId === inspectingSession.id
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                )}
              >
                {store.listeningStudentId === inspectingSession.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {store.listeningStudentId === inspectingSession.id ? 'Ovozni To\'xtatish' : 'Ovozini Tinglash (Jonli)'}
              </button>

              
              <div className="space-y-1.5 pt-2 border-t border-[#182A4D]">
                <button
                  onClick={() => setWarningModalSession(inspectingSession)}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Ekranga Ogohlantirish Yuborish
                </button>
                <button
                  onClick={() => setPenaltyModalSession(inspectingSession)}
                  className="w-full py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" /> Ball Ayirish (Jarima)
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`${inspectingSession.name} ni diskvalifikatsiya qilmoqchimisiz?`)) {
                      store.disqualifyStudent(inspectingSession.id, 'Proktor buyrug\'i');
                    }
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" /> Diskvalifikatsiya Qilish
                </button>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'rules' && (
          <div className={clsx('p-5 rounded-xl border space-y-5', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Anti-Cheating Qoidalari va AI Qat'iylik Dvigateli
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Olimpiada davomida avtomatik ishlaydigan barcha xavfsizlik cheklovlari va sun'iy intellekt qoidalarini boshqarish
              </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'webcamRequired', title: 'Web Kamera Majburiyligi', desc: 'O\'quvchi kamerasini o\'chirsa, test avtomatik to\'xtatiladi.', icon: <Camera className="w-4 h-4 text-indigo-400" /> },
                { key: 'micRequired', title: 'Mikrofon Majburiyligi', desc: 'Mikrofon doimiy faol bo\'lishi va fon shovqini tahlil qilinishi shart.', icon: <Mic className="w-4 h-4 text-blue-400" /> },
                { key: 'blockTabSwitch', title: 'Tab Almashtirishni Bloklash (Alt+Tab)', desc: 'Boshqa oynaga yoki dasturga o\'tilsa, zudlik bilan ogohlantiriladi.', icon: <Copy className="w-4 h-4 text-amber-400" /> },
                { key: 'blockCopyPaste', title: 'Nusxalash va Joylashni Taqiqlash (Copy/Paste)', desc: 'Ctrl+C / Ctrl+V / Right Click butunlay bloklanadi.', icon: <FileText className="w-4 h-4 text-rose-400" /> },
                { key: 'forceFullscreen', title: 'To\'liq Ekran Majburiyligi (Fullscreen)', desc: 'Test faqat to\'liq ekranda ishlaydi, chiqib ketilsa vaqt muzlatiladi.', icon: <Maximize2 className="w-4 h-4 text-emerald-400" /> },
                { key: 'blockSecondMonitor', title: 'Ikkinchi Monitor Taqiqlash', desc: 'HDMI yoki qo\'shimcha displey ulangani aniqlansa, test bloklanadi.', icon: <Monitor className="w-4 h-4 text-purple-400" /> },
                { key: 'detectMultipleFaces', title: 'TensorFlow: Ko\'p Shaxsni Aniqlash', desc: 'Kadrda ikkinchi odam ko\'ringan zahoti AI xavf alertini beradi.', icon: <Users className="w-4 h-4 text-rose-400" /> },
                { key: 'detectObjectsPhone', title: 'YOLO: Telefon va Kitobni Aniqlash', desc: 'Qo\'lda smartfon yoki qo\'shimcha buyumlar ko\'rinsa, qat\'iy chora ko\'riladi.', icon: <Smartphone className="w-4 h-4 text-amber-400" /> },
              ].map((rule) => {
                const isActive = (store.rules as any)[rule.key];
                return (
                  <div
                    key={rule.key}
                    onClick={() => store.updateRules({ [rule.key]: !isActive })}
                    className={clsx(
                      'p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all',
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                        : isDark ? 'bg-[#081024] border-[#162748] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-black/40 shrink-0">{rule.icon}</div>
                      <div>
                        <div className="font-bold text-xs">{rule.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{rule.desc}</div>
                      </div>
                    </div>
                    <div className={clsx('w-9 h-5 rounded-full p-0.5 transition-all', isActive ? 'bg-emerald-500' : 'bg-slate-600')}>
                      <div className={clsx('w-4 h-4 rounded-full bg-white transition-all', isActive ? 'translate-x-4' : 'translate-x-0')} />
                    </div>
                  </div>
                );
              })}
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#182A4D]">
              <div>
                <label className="block text-xs font-bold mb-1.5">AI Qat'iylik Darajasi:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['yumshoq', 'standart', 'qattiq', 'paranoid'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => store.updateRules({ strictnessLevel: lvl })}
                      className={clsx(
                        'py-2 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border',
                        store.rules.strictnessLevel === lvl
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                          : isDark ? 'bg-[#091024] border-[#162748] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Avto-Diskvalifikatsiya uchun Max Ogohlantirishlar:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={store.rules.maxWarningsBeforeDisqualify}
                    onChange={(e) => store.updateRules({ maxWarningsBeforeDisqualify: Number(e.target.value) })}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="font-bold font-mono text-sm text-amber-300 w-8">{store.rules.maxWarningsBeforeDisqualify} ta</span>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'forensics' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={clsx('p-3.5 rounded-xl border space-y-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-indigo-400">
                    <KeyRound className="w-4 h-4 text-indigo-400" /> HMAC Imzolash
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300">SHA-256 ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Har bir javob yuborilganda sessiyaga xos kalit bilan imzolanadi. Skript va Postman botlar rad etiladi.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded">
                  Status: 100% Imzolangan (Replay Guard ON)
                </div>
              </div>

              <div className={clsx('p-3.5 rounded-xl border space-y-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                    <Zap className="w-4 h-4 text-amber-400" /> Rate Limiting
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">SLIDING WINDOW</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  1 soniyada 2 tadan ortiq so'rovlar bloklanadi. Botlar va avtomatik skriptlar 429 xatosi bilan to'xtatiladi.
                </p>
                <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded">
                  Chegara: Max 2 req / 2.5 sek
                </div>
              </div>

              <div className={clsx('p-3.5 rounded-xl border space-y-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-blue-400">
                    <Monitor className="w-4 h-4 text-blue-400" /> Monitor Muhiti
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-300">SCREEN API</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Brauzerning <code className="text-blue-300">screen.isExtended</code> API orqali 2-monitor ulanishi aniqlanadi.
                </p>
                <div className="text-[10px] font-mono text-blue-300 bg-blue-950/40 border border-blue-800/40 px-2 py-1 rounded">
                  Joriy holat: {multiMonitorStatus}
                </div>
              </div>

              <div className={clsx('p-3.5 rounded-xl border space-y-2', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-purple-400">
                    <Activity className="w-4 h-4 text-purple-400" /> Heartbeat Ping
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300">6s TOKEN PING</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Har 6 soniyada faollik tasdig'i keladi. Sessiya uzilsa yoki to'xtatilsa, test avtomatik muzlatiladi.
                </p>
                <div className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded">
                  Keep-Alive: 100% Sinxron (0 uzilish)
                </div>
              </div>
            </div>

            
            <div className={clsx('p-4 rounded-xl border space-y-3', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs flex items-center gap-2 text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Next Olymp 6-Qatlamli To'liq Xavfsizlik Ekotizimi Matritsasi
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">STANDART: ISO/IEC 27001 PROCTORING</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={clsx('border-b text-[10px] font-black uppercase', isDark ? 'bg-[#081024] border-[#162748] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600')}>
                    <tr>
                      <th className="p-2.5">Qatlam</th>
                      <th className="p-2.5">Qo'llanadigan Choralar & Texnologiyalar</th>
                      <th className="p-2.5">Himoya Maqsadi</th>
                      <th className="p-2.5 text-right">Holat</th>
                    </tr>
                  </thead>
                  <tbody className={clsx('divide-y', isDark ? 'divide-[#162748]' : 'divide-slate-200')}>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-indigo-400 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Frontend (Kamera/Ovoz)</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">MediaPipe FaceLandmarker, Web Audio API Analyser</td>
                      <td className="p-2.5 text-slate-400">Boshning chetga burilishi, xonada 2-odam borligi, shivirlash va begona shovqin</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-amber-400 flex items-center gap-1.5"><Laptop className="w-3.5 h-3.5" /> Frontend (Brauzer)</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">ExamGuard (Tab switch, Blur, Fullscreen, ContextMenu & Shortcut Block)</td>
                      <td className="p-2.5 text-slate-400">Google'dan qidirish, matndan nusxa olish, vkladka almashtirish, F12 / DevTools ochish</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-blue-400 flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Brauzer Muhiti</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">screen.isExtended, Screen Details & MediaStream Tracking</td>
                      <td className="p-2.5 text-slate-400">Ikkinchi monitor ulanishini va yashirin ekranlarni aniqlash</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-purple-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Backend (Mantiq)</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">Server-Side Timer, Zero Correct Answers in Payload</td>
                      <td className="p-2.5 text-slate-400">Dastur kodini (Inspect) o'zgartirish orqali to'g'ri javoblarni ko'rib olishni 100% imkonsiz qilish</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-rose-400 flex items-center gap-1.5"><Network className="w-3.5 h-3.5" /> API & Tarmoq</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">HMAC-SHA256 Request Signing, Sliding Window Rate Limit, Heartbeat Ping</td>
                      <td className="p-2.5 text-slate-400">Postman / Python skriptlari orqali testlarni avtomatlashtirish va spam so'rovlarni to'sish</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                    <tr className={isDark ? 'hover:bg-[#11203E]/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5 font-bold text-emerald-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Post-Analiz (AI)</td>
                      <td className="p-2.5 text-slate-300 font-mono text-[11px]">Google Gemini 3.7 Flash Forensics, Response Time & Collusion Clustering</td>
                      <td className="p-2.5 text-slate-400">Aqlli yashiringan shpargalkalar, tayyor javoblar va jamoaviy yechish (collusion)ni fosh qilish</td>
                      <td className="p-2.5 text-right"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">FAOL</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            
            <div className={clsx('p-4 rounded-xl border space-y-4', isDark ? 'bg-[#0D1832] border-[#182A4D]' : 'bg-white border-slate-200')}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182A4D] pb-3">
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-2 text-white">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Statistik Anomaliyalarni Tahlil Qilish Laboratoriyasi (AI Forensics Lab)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Javob berish vaqti (Response Time), klasterli bir xil xatolar va jamoaviy yechishni aniqlash
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Tekshiriluvchi:</span>
                  <select
                    value={selectedForensicUser}
                    onChange={(e) => {
                      setSelectedForensicUser(e.target.value);
                      setAiForensicReport(null);
                    }}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer', isDark ? 'bg-[#081024] border-[#1E365E] text-amber-300' : 'bg-slate-100 border-slate-300 text-slate-900')}
                  >
                    {DEMO_SUBMISSION_RECORDS.map((r) => (
                      <option key={r.userId} value={r.userId}>
                        {r.studentName} ({r.totalScore} XP - {r.school})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeForensicRecord && activeAnomalyResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Savollarga Javob Berish Vaqti Tahlili:
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Jami vaqt: {Math.floor(activeForensicRecord.totalTimeSec / 60)} daq {activeForensicRecord.totalTimeSec % 60} sek
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeForensicRecord.answers.map((ans, idx) => {
                        const isSuperfast = ans.timeSpentSec < 5 && ans.isCorrect;
                        return (
                          <div
                            key={ans.questionId}
                            className={clsx(
                              'p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs',
                              isSuperfast
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : isDark ? 'bg-[#081024] border-[#162748]' : 'bg-slate-50 border-slate-200'
                            )}
                          >
                            <div className="space-y-0.5 max-w-md">
                              <span className="font-bold text-white flex items-center gap-2">
                                <span>{idx + 1}-Savol ({ans.points} ball)</span>
                                {isSuperfast && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500 text-white animate-pulse">
                                    SUPERHUMAN SPEED!
                                  </span>
                                )}
                              </span>
                              <p className="text-[11px] text-slate-400 truncate">{ans.questionText}</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <span className={clsx('font-black font-mono text-xs', isSuperfast ? 'text-rose-400' : 'text-emerald-400')}>
                                  {ans.timeSpentSec} soniya
                                </span>
                                <div className="text-[9px] text-slate-500 font-mono">Kutilgan: ~{ans.points >= 20 ? '15s' : '8s'}</div>
                              </div>
                              <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold font-mono', ans.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                                {ans.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    
                    {activeAnomalyResult.collusionMatches.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                          <Users className="w-4 h-4 text-amber-400" />
                          Klasterli Jamoaviy Yechish (Collusion) Aniqlangan:
                        </div>
                        {activeAnomalyResult.collusionMatches.map((c, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-center justify-between bg-black/30 p-2 rounded-lg">
                            <span>
                              <strong>{c.targetName}</strong> bilan {c.similarityPercent}% bir xil javoblar ({c.identicalMistakesCount} ta bir xil xato javob)
                            </span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/30 text-amber-200 uppercase font-mono">
                              {c.relation.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  
                  <div className={clsx('p-4 rounded-xl border flex flex-col justify-between space-y-4', isDark ? 'bg-[#081024] border-[#162748]' : 'bg-slate-50 border-slate-200')}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-300">Anomaliya Darajasi:</span>
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 rounded-full text-xs font-black uppercase font-mono',
                            activeAnomalyResult.riskLevel === 'kritik' ? 'bg-rose-500 text-white animate-pulse' :
                            activeAnomalyResult.riskLevel === 'yuqori' ? 'bg-amber-500 text-slate-950' :
                            activeAnomalyResult.riskLevel === 'orta' ? 'bg-yellow-500 text-slate-950' : 'bg-emerald-500 text-white'
                          )}
                        >
                          {activeAnomalyResult.riskLevel} ({activeAnomalyResult.anomalyScore}%)
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full transition-all duration-500',
                            activeAnomalyResult.anomalyScore >= 75 ? 'bg-rose-500' :
                            activeAnomalyResult.anomalyScore >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          )}
                          style={{ width: `${activeAnomalyResult.anomalyScore}%` }}
                        />
                      </div>

                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-slate-400 text-[11px]">Shubhali Ko'rsatkichlar:</span>
                        {activeAnomalyResult.suspiciousReasons.length > 0 ? (
                          activeAnomalyResult.suspiciousReasons.map((r, i) => (
                            <div key={i} className="text-[11px] text-rose-300 flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Shubhali omillar topilmadi.
                          </div>
                        )}
                      </div>
                    </div>

                    
                    <div className="pt-3 border-t border-[#182A4D] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1 text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Sud-Ekspertiza
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">Gemini 3.7 Flash</span>
                      </div>

                      {aiForensicReport ? (
                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">Xulosa:</span>
                            <span className={clsx('px-2 py-0.5 rounded text-[10px] font-black', aiForensicReport.overallVerdict.includes('Cheat') ? 'bg-rose-500 text-white' : aiForensicReport.overallVerdict.includes('Shubhali') ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white')}>
                              {aiForensicReport.overallVerdict}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{aiForensicReport.summary}</p>
                          <div className="text-[10px] text-indigo-300 font-bold bg-indigo-900/30 p-2 rounded-lg">
                            Tavsiya: {aiForensicReport.recommendation}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleRunAiForensic}
                          disabled={aiForensicLoading}
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          {aiForensicLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Ekspertiza Yaratilmoqda...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              AI Sud-Ekspertiza Hisobotini Yaratish
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        
        {warningModalSession && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={clsx('rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border', isDark ? 'bg-[#0D1832] border-[#1E3563]' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between border-b border-[#182A4D] pb-3">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> O'quvchiga Jonli Ogohlantirish Yuborish
                </h3>
                <button onClick={() => setWarningModalSession(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div>
                <p className="text-xs text-slate-300 mb-2">
                  Qabul qiluvchi: <strong className="text-white">{warningModalSession.name}</strong> ({warningModalSession.school})
                </p>
                <textarea
                  rows={3}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className={clsx(
                    'w-full rounded-xl p-3 text-xs outline-none border transition-all',
                    isDark ? 'bg-[#050B18] border-[#1A2F57] text-white focus:border-amber-400' : 'bg-slate-50 border-slate-300 text-slate-900'
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#182A4D]">
                <button
                  onClick={() => setWarningModalSession(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-600 text-slate-300"
                >
                  Bekor
                </button>
                <button
                  onClick={() => {
                    store.sendWarning(warningModalSession.id, warningMessage);
                    setWarningModalSession(null);
                  }}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Yuborish
                </button>
              </div>
            </div>
          </div>
        )}

        
        {penaltyModalSession && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={clsx('rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border', isDark ? 'bg-[#0D1832] border-[#1E3563]' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between border-b border-[#182A4D] pb-3">
                <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                  <Flame className="w-4 h-4" /> Jarima Balli Ayirish
                </h3>
                <button onClick={() => setPenaltyModalSession(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  O'quvchi: <strong className="text-white">{penaltyModalSession.name}</strong>
                </p>

                <div>
                  <label className="block text-xs font-bold mb-1">Ayiriladigan XP miqdori:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 200].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setPenaltyAmount(pts)}
                        className={clsx(
                          'py-2 rounded-lg font-bold text-xs border cursor-pointer transition-all',
                          penaltyAmount === pts ? 'bg-rose-600 text-white border-rose-500' : isDark ? 'bg-[#081024] border-[#162748] text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-700'
                        )}
                      >
                        -{pts} XP
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Jarima sababi:</label>
                  <input
                    type="text"
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    className={clsx('w-full rounded-xl px-3 py-2 text-xs outline-none border', isDark ? 'bg-[#050B18] border-[#1A2F57] text-white' : 'bg-slate-50 border-slate-300 text-slate-900')}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#182A4D]">
                <button
                  onClick={() => setPenaltyModalSession(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-600 text-slate-300"
                >
                  Bekor
                </button>
                <button
                  onClick={() => {
                    store.applyPenalty(penaltyModalSession.id, penaltyAmount, penaltyReason);
                    setPenaltyModalSession(null);
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5" /> -{penaltyAmount} XP Qo'llash
                </button>
              </div>
            </div>
          </div>
        )}

        
        {isRealCamModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={clsx('rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 border', isDark ? 'bg-[#0D1832] border-[#1E3563]' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between border-b border-[#182A4D] pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Haqiqiy Web Kamera & Edge AI Sinovi</h3>
                    <p className="text-[10px] text-slate-400">MediaPipe Face Mesh + Web Audio API Analyser</p>
                  </div>
                </div>
                <button onClick={handleCloseRealCam} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              
              <div className={clsx('p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between', realCamWarning ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')}>
                <span className="flex items-center gap-2">
                  {realCamWarning ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {realCamStatus}
                </span>
                <span className="text-[9px] font-mono opacity-80">Edge Detection Active</span>
              </div>

              
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                {realCamError ? (
                  <div className="text-center p-4 text-rose-400 text-xs">
                    <XCircle className="w-8 h-8 mx-auto mb-2" />
                    {realCamError}
                  </div>
                ) : (
                  <>
                    <video ref={realVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute border-2 border-emerald-400 rounded-lg pointer-events-none p-1.5 flex flex-col justify-between" style={{ top: '15%', left: '25%', width: '50%', height: '70%' }}>
                      <span className="bg-black/80 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded w-fit">MediaPipe: Face Mesh (100% Focus)</span>
                      <span className="bg-black/80 text-amber-300 font-mono text-[9px] px-1.5 py-0.5 rounded w-fit self-end">Gaze: Center</span>
                    </div>
                  </>
                )}
              </div>

              
              <div className={clsx('p-3 rounded-xl border space-y-1.5', isDark ? 'bg-[#081024] border-[#162748]' : 'bg-slate-50 border-slate-200')}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-slate-300">
                    <Mic className="w-3.5 h-3.5 text-blue-400" />
                    Mikrofon Shovqin Darajasi (Web Audio API):
                  </span>
                  <span className={clsx('font-bold font-mono', realCamVolume > 45 ? 'text-rose-400' : 'text-emerald-400')}>
                    {realCamVolume} dB {realCamVolume > 45 && '(Shovqin!)'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className={clsx('h-full transition-all duration-200', realCamVolume > 45 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500')}
                    style={{ width: `${Math.min(100, realCamVolume * 1.5)}%` }}
                  />
                  
                  <div className="absolute top-0 bottom-0 left-[67%] w-0.5 bg-rose-400 opacity-70" title="45dB Threshold" />
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>0 dB (Jimlik)</span>
                  <span className="text-rose-400">45 dB (Chegara)</span>
                  <span>70+ dB</span>
                </div>
              </div>

              
              <div className="flex items-center justify-between pt-2 border-t border-[#182A4D]">
                <button
                  onClick={() => {
                    if (realVideoRef.current) {
                      setRealCamStatus('⚠️ Shubhali holat: Monitordan chetga qaraldi');
                      setRealCamWarning(true);
                      handleTriggeredIncident('O\'quvchi monitordan chetga qaradi', realVideoRef.current);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Tekshiruvni Sinash
                </button>

                <button
                  onClick={handleCloseRealCam}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
