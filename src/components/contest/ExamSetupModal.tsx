

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Play,
  Copy,
  ExternalLink,
  Laptop,
  Maximize2,
  Lock,
  Loader2,
  Eye,
  Check,
  Video,
  X,
  Zap,
  Wifi,
  Globe
} from 'lucide-react';
import {
  AIPlacementEvaluation,
  CalibrationElement,
  PROCTOR_SOCKET_EVENTS,
  SetupStep,
} from '../../types/dualDeviceProctor';
import {
  DualDeviceProctorGateway,
  createDualDeviceSession,
  validatePlacementSnapshot,
} from '../../services/setupProctor.service';
import QRCode from 'qrcode';

interface ExamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExam: () => void;
  examId: string;
  examTitle: string;
  examStartTime?: string | number | null;
  examEndTime?: string | number | null;
  studentId?: string;
  studentName?: string;
}

export const ExamSetupModal: React.FC<ExamSetupModalProps> = ({
  isOpen,
  onClose,
  onStartExam,
  examId,
  examTitle,
  examStartTime,
  examEndTime,
  studentId = 'std-' + Date.now().toString().slice(-4),
  studentName = "O'quvchi",
}) => {
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('pairing');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [mobileStreamUrl, setMobileStreamUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  
  const detectedLanIp = '192.168.0.102:3000';
  const [useLanIp, setUseLanIp] = useState(false);

  
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [connectedDeviceBattery, setConnectedDeviceBattery] = useState<number | null>(null);
  const [isCalibratingAI, setIsCalibratingAI] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<AIPlacementEvaluation | null>(null);
  const [isStartPermitted, setIsStartPermitted] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [liveFramePreview, setLiveFramePreview] = useState<string | null>(null);

  
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const gatewayRef = useRef<DualDeviceProctorGateway | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  
  useEffect(() => {
    if (!isOpen) return;

    
    const session = createDualDeviceSession(examId, studentId);
    setSessionId(session.sessionId);
    setSessionToken(session.token);

    
    const protocol = window.location.protocol;
    const currentHost = window.location.host;
    const targetHost = useLanIp ? detectedLanIp : currentHost;
    const url = `${protocol}//${targetHost}/proctor/stream?sessionId=${encodeURIComponent(session.sessionId)}&token=${encodeURIComponent(session.token)}`;
    setMobileStreamUrl(url);

    // SECURED: Generate QR code in-memory on the client, never leaking proctoring token to third-party services
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        setQrCodeUrl(dataUrl);
      })
      .catch((err) => {
        console.error('[ExamSetupModal] QR generation error:', err);
      });

    
    const gateway = new DualDeviceProctorGateway();
    gatewayRef.current = gateway;
    gateway.connect({
      sessionId: session.sessionId,
      token: session.token,
      role: 'primary',
    });

    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        gateway.emit(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, {
          candidate: event.candidate,
        });
      }
    };

    
    const unsubConnected = gateway.on(PROCTOR_SOCKET_EVENTS.DEVICE_CONNECTED, (data) => {
      setIsDeviceConnected(true);
      if (data?.batteryLevel) setConnectedDeviceBattery(data.batteryLevel);
      
      setCurrentStep((prev) => (prev === 'pairing' ? 'placement' : prev));
    });

    const unsubDisconnected = gateway.on(PROCTOR_SOCKET_EVENTS.DEVICE_DISCONNECTED, () => {
      setIsDeviceConnected(false);
    });

    const unsubBattery = gateway.on(PROCTOR_SOCKET_EVENTS.BATTERY_STATUS, (data) => {
      if (typeof data?.level === 'number') {
        setConnectedDeviceBattery(Math.round(data.level * 100));
      }
    });

    
    const unsubPreview = gateway.on(PROCTOR_SOCKET_EVENTS.FRAME_PREVIEW, (data) => {
      if (data?.frame) {
        setLiveFramePreview(data.frame);
        setIsDeviceConnected(true);
      }
    });

    const unsubSignal = gateway.on(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, async (data) => {
      try {
        if (data?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          gateway.emit(PROCTOR_SOCKET_EVENTS.WEBRTC_SIGNAL, { answer });
        } else if (data?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data?.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn('WebRTC signal handling:', err);
      }
    });

    const unsubSnapshotReady = gateway.on(PROCTOR_SOCKET_EVENTS.SNAPSHOT_READY, async (data) => {
      if (data?.imageBase64) {
        setIsCalibratingAI(true);
        try {
          const evalResult = await validatePlacementSnapshot(data.imageBase64, {
            examId,
            studentId,
          });
          setAiEvaluation(evalResult);
          gateway.emit(PROCTOR_SOCKET_EVENTS.AI_CALIBRATION_RESULT, evalResult);

          if (evalResult.valid_placement) {
            setCurrentStep('gatekeeper');
          }
        } finally {
          setIsCalibratingAI(false);
        }
      }
    });

    const unsubAiResult = gateway.on(PROCTOR_SOCKET_EVENTS.AI_CALIBRATION_RESULT, (evalResult) => {
      setAiEvaluation(evalResult);
      setIsCalibratingAI(false);
      if (evalResult?.valid_placement) {
        setCurrentStep('gatekeeper');
      }
    });

    const unsubStartPermitted = gateway.on(PROCTOR_SOCKET_EVENTS.START_PERMITTED, () => {
      setIsStartPermitted(true);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubBattery();
      unsubPreview();
      unsubSignal();
      unsubSnapshotReady();
      unsubAiResult();
      unsubStartPermitted();
      pc.close();
      gateway.disconnect();
    };
  }, [isOpen, examId, studentId, useLanIp]);

  
  const startTimestamp = useMemo(() => {
    if (!examStartTime) return Date.now();
    if (typeof examStartTime === 'number') return examStartTime;
    const parsed = new Date(String(examStartTime).replace(' ', 'T')).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
  }, [examStartTime]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remainingMs = startTimestamp - now;
      if (remainingMs <= 0) {
        setTimeRemainingSeconds(0);
        setIsStartPermitted(true);
      } else {
        setTimeRemainingSeconds(Math.ceil(remainingMs / 1000));
        setIsStartPermitted(false);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTimestamp]);

  
  const handleTriggerAICheck = () => {
    setIsCalibratingAI(true);
    setAiEvaluation(null);
    setCurrentStep('ai_calibration');

    
    if (gatewayRef.current) {
      gatewayRef.current.emit(PROCTOR_SOCKET_EVENTS.REQUEST_SNAPSHOT);
    }

    
    setTimeout(async () => {
      if (!aiEvaluation) {
        const frameBase64 = liveFramePreview || 'data:image/jpeg;base64,sample';
        const result = await validatePlacementSnapshot(frameBase64, {
          examId,
          studentId,
        });
        setAiEvaluation(result);
        setIsCalibratingAI(false);
        if (result.valid_placement) {
          setCurrentStep('gatekeeper');
        }
      }
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileStreamUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  
  const handleInstantSimulatePairing = () => {
    setIsDeviceConnected(true);
    setConnectedDeviceBattery(96);
    setCurrentStep('placement');
    if (gatewayRef.current) {
      gatewayRef.current.emit(PROCTOR_SOCKET_EVENTS.DEVICE_CONNECTED, {
        sessionId,
        role: 'secondary',
        batteryLevel: 96,
      });
    }
  };

  
  const handleOpenPopupWindow = () => {
    const popup = window.open(
      mobileStreamUrl,
      'ProctorStreamPopup',
      'width=420,height=760,menubar=no,toolbar=no,location=no,status=no'
    );
    if (popup) {
      popup.focus();
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] backdrop-blur-xl">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                  Pre-Exam Calibration & Dual-Device Setup
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Proctoring 2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-md">
                {examTitle} • {studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isDeviceConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isDeviceConnected ? '2-Telefon Ulandi' : '2-Telefon Kutilmoqda'}</span>
              {connectedDeviceBattery !== null && (
                <span className="text-[10px] opacity-75 font-mono">({connectedDeviceBattery}%)</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator Header */}
        <div className="grid grid-cols-4 border-b border-white/10 bg-zinc-950/40 px-4 py-3">
          {[
            { id: 'pairing', num: 1, title: 'QR Ulanish', icon: QrCode },
            { id: 'placement', num: 2, title: 'Joylashtirish', icon: Video },
            { id: 'ai_calibration', num: 3, title: 'AI Tekshiruv', icon: Sparkles },
            { id: 'gatekeeper', num: 4, title: 'Testga Ruxsat', icon: Clock },
          ].map((step, idx) => {
            const stepOrder: SetupStep[] = ['pairing', 'placement', 'ai_calibration', 'gatekeeper', 'ready'];
            const currentIndex = stepOrder.indexOf(currentStep);
            const isCompleted = currentIndex > idx;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (idx <= currentIndex) setCurrentStep(step.id as SetupStep);
                }}
                className={`flex items-center gap-2 cursor-pointer transition-all ${
                  isCurrent
                    ? 'text-emerald-400 font-semibold'
                    : isCompleted
                    ? 'text-teal-400'
                    : 'text-zinc-500'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <span className="block leading-tight">{step.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: PAIRING */}
          {currentStep === 'pairing' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative p-4 bg-white rounded-2xl shadow-xl shadow-emerald-500/5 border-4 border-zinc-700/50">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Proctor QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                  )}

                  {isDeviceConnected && (
                    <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <span className="text-white font-bold text-sm">2-Telefon Ulandi!</span>
                      <span className="text-emerald-300 text-xs mt-1">2-bosqichga o'tilmoqda...</span>
                    </div>
                  )}
                </div>

                {/* Local Network / Wi-Fi IP switcher */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setUseLanIp(!useLanIp)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1 transition-all border cursor-pointer ${
                      useLanIp
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-white/10'
                    }`}
                  >
                    <Wifi className="w-3 h-3" />
                    <span>{useLanIp ? `Wi-Fi IP (${detectedLanIp})` : 'Localhost (Kompyuter)'}</span>
                  </button>
                  <span className="text-[10px] text-zinc-500">Telefondan skanerlash uchun Wi-Fi IP ni yoqing</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer active:scale-95"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Nusxalandi' : 'Havolani nusxalash'}</span>
                  </button>

                  <button
                    onClick={handleOpenPopupWindow}
                    className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-500/20 cursor-pointer active:scale-95"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>2-Telefon oynasini ochish (Popup)</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-3.5 h-3.5" />
                  1-Bosqich: Kuzatuv kamerasini ulash
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                  2-Telefoningiz orqali QR-kodni skanerlang
                </h3>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  Imtihon shaffofligi uchun ish stolingizni yon/orqa burchakdan kuzatib turuvchi ikkinchi kamera kerak.
                  Lokal rejimda <strong>"2-Telefon oynasini ochish"</strong> yoki <strong>"Tezkor simulyatsiya"</strong> tugmasi orqali ham darhol sinab ko'rishingiz mumkin!
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-800/40 border border-white/10">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Telefonda kamerani ochib QR-kodni skanerlang yoki shu kompyuterda <strong>"2-Telefon oynasini ochish"</strong> tugmasini bosing.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-800/40 border border-white/10">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Kameraga ruxsat bering (yoki Virtual Nazorat Kamerasi avtomatik ishga tushadi).
                    </p>
                  </div>
                </div>

                {/* Simulation Button */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleInstantSimulatePairing}
                    className="px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Tezkor Sinov Rejimi (Darhol Ulash)</span>
                  </button>

                  <button
                    disabled={!isDeviceConnected}
                    onClick={() => setCurrentStep('placement')}
                    className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                      isDeviceConnected
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    <span>Keyingi bosqich</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PLACEMENT & AI CHECK */}
          {currentStep === 'placement' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Graphic Schema */}
              <div className="md:col-span-6 space-y-4">
                <div className="relative rounded-2xl bg-zinc-900/80 border border-white/10 p-5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-400" />
                      Ideal Kamera Rakursi
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      45° Burchak • 1.5 metr
                    </span>
                  </div>

                  {/* SVG graphic of the desk & angle */}
                  <div className="h-52 w-full rounded-2xl bg-zinc-950/60 border border-white/10 flex items-center justify-center p-4 relative overflow-hidden">
                    <svg viewBox="0 0 400 220" className="w-full h-full">
                      <rect x="110" y="110" width="220" height="70" rx="8" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                      <polygon points="170,120 230,120 240,140 160,140" fill="#10b981" opacity="0.8" />
                      <rect x="175" y="85" width="50" height="35" rx="3" fill="#34d399" opacity="0.9" stroke="#6ee7b7" strokeWidth="1" />
                      <text x="200" y="107" fill="#09090b" fontSize="8" fontWeight="bold" textAnchor="middle">Test Ekran</text>
                      <circle cx="200" cy="165" r="16" fill="#f87171" opacity="0.9" />
                      <path d="M165,195 Q200,180 235,195 Z" fill="#ef4444" opacity="0.8" />
                      <circle cx="160" cy="132" r="5" fill="#fca5a5" />
                      <circle cx="240" cy="132" r="5" fill="#fca5a5" />
                      <text x="200" y="148" fill="#cbd5e1" fontSize="7" textAnchor="middle">Qo'llar va Klaviatura</text>
                      <rect x="40" y="45" width="28" height="48" rx="4" fill="#10b981" stroke="#34d399" strokeWidth="2" />
                      <circle cx="54" cy="55" r="3" fill="#09090b" />
                      <text x="54" y="105" fill="#34d399" fontSize="8" fontWeight="bold" textAnchor="middle">2-Telefon (1.5m)</text>
                      <line x1="54" y1="65" x2="165" y2="90" stroke="#34d399" strokeDasharray="3,3" strokeWidth="1.5" />
                      <line x1="54" y1="65" x2="250" y2="180" stroke="#34d399" strokeDasharray="3,3" strokeWidth="1.5" />
                      <path d="M54,65 L170,90 L250,180 Z" fill="#10b981" opacity="0.08" />
                    </svg>

                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/90 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
                      <span>✓ Ishchi stol</span>
                      <span>✓ Ikkala qo'l</span>
                      <span>✓ O'quvchi</span>
                      <span>✓ Noutbuk ekrani</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Telefonni stolning o'ng yoki chap tomoniga qo'yib, o'quvchining ikkala qo'li, ish stoli va noutbuk ekrani kadrga tushganiga ishonch hosil qiling.
                  </span>
                </div>
              </div>

              {/* Video Stream Preview */}
              <div className="md:col-span-6 space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    2-Bosqich: Rakursni o'rnatish
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                    2-Telefon Kamerasining Jonli Tasviri
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Quyida 2-telefoningiz uzatayotgan real-vaqt tasviri ko'rinadi. Stolni to'g'ri joylashtirib,
                    quyidagi tugmani bosing.
                  </p>
                </div>

                <div className="relative aspect-video w-full rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl flex items-center justify-center">
                  {liveFramePreview ? (
                    <img
                      src={liveFramePreview}
                      alt="Live 2nd Phone Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 backdrop-blur border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        LIVE STREAM (720p)
                      </span>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-zinc-900/80 text-zinc-300 backdrop-blur border border-white/10">
                        {isDeviceConnected ? 'Ulandi ✓' : 'Kutilmoqda'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 grid-rows-3 h-full w-full border border-white/10 rounded-lg">
                      <div className="border-r border-b border-white/5" />
                      <div className="border-r border-b border-white/5" />
                      <div className="border-b border-white/5" />
                      <div className="border-r border-b border-white/5" />
                      <div className="border-r border-b border-white/5" />
                      <div className="border-b border-white/5" />
                      <div className="border-r border-white/5" />
                      <div className="border-r border-white/5" />
                      <div className="" />
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] text-white/90 bg-zinc-950/80 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                        Qo'llar, ishchi hudud va ekran kadrga to'liq tushgan bo'lishi kerak
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTriggerAICheck}
                  className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>Joylashtirdim, tekshirish (AI Calibration)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI EVALUATION REPORT */}
          {currentStep === 'ai_calibration' && (
            <div className="max-w-2xl mx-auto space-y-6 text-center py-4">
              {isCalibratingAI ? (
                <div className="space-y-4 py-8">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="w-10 h-10 animate-pulse" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-100">
                    Vision AI kadrni tahlil qilmoqda...
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Kadr o'quvchi gavdasi, ish stoli, ikkala qo'l va ekran joylashuvi bo'yicha baholanmoqda.
                  </p>
                </div>
              ) : aiEvaluation ? (
                <div className="space-y-5 text-left">
                  <div
                    className={`p-5 rounded-2xl border ${
                      aiEvaluation.valid_placement
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          aiEvaluation.valid_placement ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                        }`}
                      >
                        {aiEvaluation.valid_placement ? (
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-7 h-7 text-rose-400" />
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-zinc-100">
                            {aiEvaluation.valid_placement
                              ? "Joylashuv ideal! AI tomonidan tasdiqlandi"
                              : "Joylashuv talablarga mos emas"}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              aiEvaluation.valid_placement
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {aiEvaluation.valid_placement ? "O'TDINGIZ" : "RAD ETILDI"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {aiEvaluation.guidance_message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Checklist of elements */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'student', title: "O'quvchi gavdasi", detected: !aiEvaluation.missing_elements.includes('student') },
                      { key: 'hands', title: "Ikkala qo'l", detected: !aiEvaluation.missing_elements.includes('hands') },
                      { key: 'desk', title: "Ish stoli", detected: !aiEvaluation.missing_elements.includes('desk') },
                      { key: 'screen', title: "Noutbuk ekrani", detected: !aiEvaluation.missing_elements.includes('screen') },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                          item.detected
                            ? 'bg-zinc-900/60 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-zinc-300">{item.title}</span>
                          {item.detected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                          )}
                        </div>
                        <span className="text-[10px] mt-2 font-mono">
                          {item.detected ? "Ko'rinmoqda" : "Topilmadi"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <button
                      onClick={handleTriggerAICheck}
                      className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Qayta tekshirish
                    </button>

                    {aiEvaluation.valid_placement ? (
                      <button
                        onClick={() => setCurrentStep('gatekeeper')}
                        className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Vaqtni tekshirishga o'tish</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentStep('placement')}
                        className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Kamerani qayta to'g'rilash</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 4: GATEKEEPER & COUNTDOWN */}
          {currentStep === 'gatekeeper' && (
            <div className="max-w-2xl mx-auto space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tayyorgarlik va Rakurs Tasdiqlandi
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">
                  Imtihon Darvozasi (Gatekeeper)
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                  Ikki qurilmali monitoring tizimi to'liq sozlangan va AI tomonidan tekshirildi.
                </p>
              </div>

              {!isStartPermitted && timeRemainingSeconds > 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 shadow-xl space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    <Clock className="w-4 h-4 animate-spin" />
                    Imtihon boshlanishiga qoldi:
                  </div>

                  <div className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight drop-shadow-md">
                    {formatCountdown(timeRemainingSeconds)}
                  </div>

                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Imtihon vaqti kelgan zahoti "Imtihonni boshlash" tugmasi avtomatik ravishda yashil bo'lib ochiladi.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 shadow-xl space-y-2 animate-in fade-in">
                  <div className="text-sm font-bold text-zinc-100 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    Imtihon vaqti keldi! Kirish ruxsat etildi
                  </div>
                  <p className="text-xs text-emerald-300">
                    Siz barcha xavfsizlik va joylashuv talablaridan muvaffaqiyatli o'tdingiz.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  disabled={!isStartPermitted}
                  onClick={onStartExam}
                  className={`w-full max-w-md mx-auto py-4 px-8 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                    isStartPermitted
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/10'
                  }`}
                >
                  {isStartPermitted ? (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Imtihonni Boshlash</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Vaqt yetib kelishini kuting</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500">
          <span className="font-mono text-[11px]">
            Session: {sessionId ? sessionId.slice(0, 16) + '...' : 'Generating...'}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDeviceConnected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              2-Device Sync
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${aiEvaluation?.valid_placement ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              AI Verified
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
