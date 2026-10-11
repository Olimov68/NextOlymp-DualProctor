import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOlympiadDetail, useOlympiadQuestions } from '../../hooks/useOlympiad';
import { useContestStore } from '../../store/useContestStore';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useAudioProctoring } from '../../hooks/useAudioProctoring';
import { useSubmission } from '../../hooks/useSubmission';
import { Timer } from '../../components/contest/Timer';
import { QuestionCard } from '../../components/contest/QuestionCard';
import { QuestionPalette } from '../../components/contest/QuestionPalette';
import { AntiCheatBanner } from '../../components/contest/AntiCheatBanner';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAuthStore } from '../../store/useAuthStore';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { apiClient } from '../../services/api';
import { olympiadService } from '../../services/olympiadService';
import clsx from 'clsx';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Smartphone,
  Trophy,
  AlertTriangle,
  Maximize,
  Shield,
  Clock,
  HelpCircle,
  Award,
  Wifi,
  Camera,
  Lock,
  Eye,
  CheckSquare,
  Square,
  ArrowRight,
  Sparkles,
  Info,
  Radio,
  Flame,
  UserCheck,
  UserPlus,
  RefreshCw,
  CreditCard,
  Mic
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submissionService } from '../../services/submissionService';
import { getMediaPipeFaceLandmarker } from '../../services/mediaPipeVisionService';
import { analyzeFaceLandmarks } from '../../services/edgeProctoringService';

export const ContestParticipatePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: olympiad } = useOlympiadDetail(id || '');
  const [questions, setQuestions] = useState<import('../../types').Question[]>([]);

  
  const allowedLangs = useMemo(() => {
    return (olympiad as any)?.allowedLanguages && (olympiad as any).allowedLanguages.length > 0
      ? (olympiad as any).allowedLanguages
      : ["O'zbek tili", "Rus tili", "Ingliz tili"];
  }, [olympiad]);

  const [selectedExamLang, setSelectedExamLang] = useState<string>("O'zbek tili");

  const handleLanguageChange = (lang: string) => {
    setSelectedExamLang(lang);
    if (lang.toLowerCase().includes('rus')) {
      i18n.changeLanguage('ru');
    } else if (lang.toLowerCase().includes('ingliz') || lang.toLowerCase().includes('eng')) {
      i18n.changeLanguage('en');
    } else {
      i18n.changeLanguage('uz');
    }
  };

  
  const userSubmissions = useMemo(() => {
    if (!user?.id || !id) return [];
    return submissionService.getUserSubmissions(user.id).filter(s => s.olympiadId === id);
  }, [user?.id, id]);

  const targetGrades: number[] = useMemo(() => {
    return (olympiad as any)?.targetGrades || (olympiad as any)?.eligibility?.grades || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, [olympiad]);

  const studentGrade = user?.grade ? Number(user.grade) : null;
  const isGradeEligible = !studentGrade || targetGrades.includes(studentGrade);

  const attemptsUsed = useMemo(() => {
    if (!user?.id || !id) return 0;
    return submissionService.getAttemptCount(user.id, id);
  }, [user?.id, id, userSubmissions]);

  const retakeAllowed = Boolean((olympiad as any)?.retakeAllowed);
  const maxAttempts = retakeAllowed ? Number((olympiad as any)?.maxRetakeAttempts || 2) : 1;
  const canAttempt = isGradeEligible && (attemptsUsed === 0 || (retakeAllowed && attemptsUsed < maxAttempts));
  const isRetake = isGradeEligible && retakeAllowed && attemptsUsed > 0 && attemptsUsed < maxAttempts;

  const isFree = true;

  const [isRegistered, setIsRegistered] = useState(false);
  useEffect(() => {
    let active = true;
    if (id && user?.id) {
      apiClient.get(`/exams/${encodeURIComponent(id)}/registration`)
        .then(response => {
          if (!active) return;
          if (response.registered === true) {
            setIsRegistered(true);
          } else {
            apiClient.post(`/exams/${encodeURIComponent(id)}/registration`)
              .then(() => { if (active) setIsRegistered(true); })
              .catch(() => { if (active) setIsRegistered(true); });
          }
        })
        .catch(() => {
          if (active) {
            apiClient.post(`/exams/${encodeURIComponent(id)}/registration`)
              .then(() => { if (active) setIsRegistered(true); })
              .catch(() => { if (active) setIsRegistered(true); });
          }
        });
    }
    return () => { active = false; };
  }, [id, user?.id]);
  const [examSessionId, setExamSessionId] = useState<string>('');
  const [serverAntiCheatPolicy, setServerAntiCheatPolicy] = useState<any>(null);

  const now = Date.now();
  const startTime = useMemo(() => {
    return olympiad?.startDate ? new Date(olympiad.startDate.replace(' ', 'T')).getTime() : null;
  }, [olympiad?.startDate]);
  const endTime = useMemo(() => {
    return olympiad?.endDate ? new Date(olympiad.endDate.replace(' ', 'T')).getTime() : null;
  }, [olympiad?.endDate]);
  const regEndTime = useMemo(() => {
    return olympiad?.registrationEndDate ? new Date(olympiad.registrationEndDate.replace(' ', 'T')).getTime() : null;
  }, [olympiad?.registrationEndDate]);

  const isAlwaysOpen = Boolean((olympiad as any)?.isAlwaysOpen);
  const isDateFinished = !isAlwaysOpen && ((olympiad?.status === 'yopiq') || (endTime ? now > endTime : false));
  const isRegistrationExpired = !isAlwaysOpen && (regEndTime ? now > regEndTime : false);
  const isUpcoming = !isAlwaysOpen && (startTime ? now < startTime : false);

  const startContest = useContestStore((state) => state.startContest);
  const currentQuestionIndex = useContestStore((state) => state.currentQuestionIndex);
  const nextQuestion = useContestStore((state) => state.nextQuestion);
  const prevQuestion = useContestStore((state) => state.prevQuestion);
  const isSubmitted = useContestStore((state) => state.isSubmitted);
  const tabSwitchCount = useContestStore((state) => state.tabSwitchCount);

  const { submitFinal, isSubmitting } = useSubmission();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    maxScore?: number;
    totalQuestions?: number;
    correctAnswersCount?: number;
  } | null>(null);

  
  const [hasStarted, setHasStarted] = useState(false);
  useEffect(() => {
    if (!isSubmitted || !id || useContestStore.getState().isDisqualified) return;
    void apiClient.get<{ data: { score: number; maxScore: number; analysis?: Array<{ isCorrect: boolean }> } }>(
      '/exams/' + encodeURIComponent(id) + '/result').then(({ data }) => {
      setSubmissionResult({ score: data.score, maxScore: data.maxScore,
        totalQuestions: data.analysis?.length ?? 0,
        correctAnswersCount: data.analysis?.filter(q => q.isCorrect).length ?? 0 });
    }).catch(() => alert('Natijani yuklab bo‘lmadi. Natijalar bo‘limidan qayta tekshiring.'));
  }, [isSubmitted, id]);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [cameraChecked, setCameraChecked] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [micChecked, setMicChecked] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [timeLeftToStart, setTimeLeftToStart] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!startTime) {
      setTimeLeftToStart(null);
      return;
    }
    const updateTimer = () => {
      const diffSec = Math.floor((startTime - Date.now()) / 1000);
      if (diffSec > 0) {
        setTimeLeftToStart(diffSec);
      } else {
        setTimeLeftToStart(0);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleTestCamera = async () => {
    setCameraChecked('checking');
    setMicChecked('checking');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setCameraChecked('ready');
          setMicChecked('ready');
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraChecked('ready');
          try {
            const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            aStream.getTracks().forEach((t) => t.stop());
            setMicChecked('ready');
          } catch {
            setMicChecked('error');
          }
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraChecked('error');
        setMicChecked('error');
      }
    } catch {
      setCameraChecked('error');
      setMicChecked('error');
    }
  };

  
  const captureSnapshot = useCallback((): string => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 480;
    const context = canvas.getContext('2d');
    if (!context) return '';
    context.drawImage(video, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  
  useEffect(() => {
    let interval: any = null;
    let missingFaceConsecutive = 0;
    let multipleFaceConsecutive = 0;
    let lookingAwayConsecutive = 0;
    let faceLandmarker: any = null;
    let isDetecting = false;

    
    getMediaPipeFaceLandmarker().then((landmarker) => {
      faceLandmarker = landmarker;
    });

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Webcam stream error:', e);
      }
    };

    if (hasStarted && !isSubmitted) {
      const config = olympiad?.antiCheatConfig;
      const webcamRequired = config?.enabled !== false && config?.proctoringMode !== 'DISABLED' && config?.requireWebcam !== false;
      if (webcamRequired) {
        startCamera();
      }

      const gracePeriodSec = config?.maxAbsenceGracePeriod ?? (config?.proctoringMode === 'STRICT' ? 1.5 : config?.proctoringMode === 'STANDARD' ? 3.0 : 4.0);
      const graceTicks = Math.max(1, Math.round(gracePeriodSec / 0.5));
      const maxViolations = config?.maxViolationsAllowed ?? 3;

      
      interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || isDetecting) return;

        
        if (config?.proctoringMode === 'DISABLED' || config?.enabled === false) return;

        isDetecting = true;
        try {
          
          if (faceLandmarker) {
            const results = faceLandmarker.detectForVideo(videoRef.current, performance.now());
            const analysis = analyzeFaceLandmarks(results?.faceLandmarks || [], config);

            if (analysis.anomalyDetected) {
              if (analysis.anomalyType === 'no_face') {
                missingFaceConsecutive++;
                
                if (missingFaceConsecutive >= graceTicks) {
                  const snap = captureSnapshot();
                  useContestStore.getState().recordGuardViolation(
                    'NO_FACE_DETECTED',
                    analysis.anomalyReason || 'Kadrda yuz aniqlanmadi yoki yuzingiz qo\'l/to\'siq bilan yopilgan! Iltimos, kamera oldida to\'g\'riga qarab o\'tiring.',
                    maxViolations,
                    snap
                  );
                  missingFaceConsecutive = 0;
                }
              } else if (analysis.anomalyType === 'multiple_faces') {
                multipleFaceConsecutive++;
                if (multipleFaceConsecutive >= graceTicks) {
                  const snap = captureSnapshot();
                  useContestStore.getState().recordGuardViolation(
                    'MULTIPLE_FACES_DETECTED',
                    'Kadrda begona shaxs aniqlandi! Imtihonni faqat yolg\'iz topshirish shart.',
                    maxViolations,
                    snap
                  );
                  multipleFaceConsecutive = 0;
                }
              } else if (analysis.anomalyType === 'looking_away') {
                lookingAwayConsecutive++;
                if (lookingAwayConsecutive >= (graceTicks + 2)) {
                  const snap = captureSnapshot();
                  useContestStore.getState().recordGuardViolation(
                    'LOOKING_AWAY',
                    'Monitordan chetga qarash holati aniqlandi! Iltimos, faqat imtihon savollariga qarang.',
                    maxViolations,
                    snap
                  );
                  lookingAwayConsecutive = 0;
                }
              }
            } else {
              missingFaceConsecutive = 0;
              multipleFaceConsecutive = 0;
              lookingAwayConsecutive = 0;
            }
          } else {
            
            // Model unavailable: do not invent face violations from image brightness.
            missingFaceConsecutive = 0;
            multipleFaceConsecutive = 0;
            lookingAwayConsecutive = 0;
          }
        } catch (err) {
          console.warn('Face detection loop error:', err);
        } finally {
          isDetecting = false;
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [hasStarted, isSubmitted]);

  
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  const proceedToStartExam = async () => {
    if (!olympiad || !id) return;
    try {
      const response = await apiClient.post(`/exams/${encodeURIComponent(id)}/start`);
      if (!response.sessionId) throw new Error('Server sessiyasi olinmadi');
      const loaded = await olympiadService.getQuestionsByOlympiadId(id);
      if (!loaded.length) throw new Error('Bu imtihonga savollar kiritilmagan');
      setQuestions(loaded);
      setExamSessionId(response.sessionId);
      setServerAntiCheatPolicy(response.antiCheatPolicy);
      startContest(id, loaded, response);
      setHasStarted(true);
      if (response.antiCheatPolicy?.enabled && response.antiCheatPolicy?.requireFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen().catch(() => {
          alert('To‘liq ekranga o‘tish uchun brauzer ruxsatini tekshiring.');
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Imtihonni boshlash imkoni bo‘lmadi');
    }
  };

  const handleStartExam = async () => {
    if (!isRegistered && id) {
      try {
        await apiClient.post(`/exams/${encodeURIComponent(id)}/registration`);
        setIsRegistered(true);
      } catch {
        // Proceed even if already registered or network was transient
      }
    }
    if (!rulesAccepted) return;
    if (timeLeftToStart && timeLeftToStart > 0) return;

    await proceedToStartExam();
  };

  const antiCheatPolicy = serverAntiCheatPolicy || olympiad?.antiCheatConfig;
  const antiCheatActive = hasStarted && !isSubmitted && antiCheatPolicy?.enabled !== false;
  useAntiCheat(antiCheatActive, {
    olympiadId: olympiad?.id || id,
    sessionId: examSessionId,
    olympiadTitle: olympiad?.title || 'Onlayn Olimpiada',
    maxViolations: antiCheatPolicy?.maxViolationsAllowed ?? 3,
    requireFullscreen: antiCheatPolicy?.requireFullscreen ?? true,
    blockTabSwitch: antiCheatPolicy?.blockTabSwitch ?? true,
    blockCopyPaste: antiCheatPolicy?.blockCopyPaste ?? true,
    blockDevTools: antiCheatPolicy?.blockDevTools ?? true,
    heartbeatEnabled: antiCheatPolicy?.heartbeatEnabled ?? true,
    heartbeatIntervalSec: antiCheatPolicy?.heartbeatIntervalSec ?? 10,
    onCaptureSnapshot: captureSnapshot,
  });

  const audioConfig = olympiad?.antiCheatConfig;
  const audioProctoringEnabled = hasStarted && !isSubmitted && audioConfig?.enabled !== false && audioConfig?.proctoringMode !== 'DISABLED' && audioConfig?.requireVoiceBiometrics !== false;

  const handleAudioViolation = useCallback((v: { type: string; detail: string; confidence: number }) => {
    const snap = captureSnapshot();
    const maxViolations = audioConfig?.maxViolationsAllowed || 3;
    useContestStore.getState().recordGuardViolation(
      v.type,
      v.detail,
      maxViolations,
      snap
    );
  }, [audioConfig, captureSnapshot]);

  const { startMonitoring: startAudioMonitoring, stopMonitoring: stopAudioMonitoring } = useAudioProctoring({
    enabled: audioProctoringEnabled,
    contestId: id || olympiad?.id,
    olympiadId: id || olympiad?.id,
    similarityThreshold: audioConfig?.voiceSimilarityThreshold || 0.70,
    detectUnknownSpeakers: audioConfig?.detectUnknownSpeakers !== false,
    detectMultipleSpeakers: audioConfig?.detectMultipleSpeakers !== false,
    onViolation: handleAudioViolation
  });

  useEffect(() => {
    if (audioProctoringEnabled) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }
    return () => {
      stopAudioMonitoring();
    };
  }, [audioProctoringEnabled, startAudioMonitoring, stopAudioMonitoring]);

  if (!olympiad || (hasStarted && questions.length === 0)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center p-6">
        <div className="space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-spin">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Musobaqaga tayyorgarlik ko'rilmoqda...</h3>
          <p className="text-xs text-zinc-400">Savollar va xavfsizlik protokollari yuklanmoqda.</p>
        </div>
      </div>
    );
  }

  
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  
  
  
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <Link
              to="/student/olympiads"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Olimpiadalar ro'yxatiga qaytish</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Yuz & Ovoz Himoyasi (Veb-kamera + Mikrofon)</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            {/* Sarlavha, Til tanlash va Holat */}
            <div className="border-b border-white/10 pb-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imtihon Xonasi & Tayyorgarlik</span>
                </div>

                {/* Til tanlash */}
                <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-white/10">
                  <span className="text-[10px] font-bold text-zinc-400 px-2 uppercase">Til:</span>
                  {allowedLangs.map((lang: string) => {
                    const code = lang.includes("O'zbek") ? "UZ" : lang.includes("Rus") ? "RU" : lang.includes("Ingliz") ? "EN" : "UZ";
                    const flag = code === "UZ" ? "🇺🇿" : code === "RU" ? "🇷🇺" : "🇬🇧";
                    const isSelected = selectedExamLang === lang;

                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageChange(lang)}
                        className={clsx(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95",
                          isSelected
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                        )}
                      >
                        <span>{flag}</span>
                        <span>{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                {olympiad.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                {olympiad.description || "Imtihonni boshlashdan oldin quyidagi texnik tekshiruvdan o'ting hamda xavfsizlik qoidalariga rozilik berib testni boshlang."}
              </p>

              {isAlwaysOpen ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-zinc-900/60 border border-emerald-500/40 text-emerald-200 flex items-start gap-3 mt-3 backdrop-blur-xs">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>🟢 24/7 Doimiy Ochiq Test</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                        Cheklovsiz kirish
                      </span>
                    </div>
                    <p className="text-emerald-300/80">
                      Ushbu musobaqa 24/7 doimiy ochiq. Siz istalgan vaqtda kirib, tayyorgarlik ko'rib test topshirishingiz mumkin.
                    </p>
                  </div>
                </div>
              ) : isDateFinished ? (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-3 mt-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white text-sm">🛑 Musobaqa Yakunlangan</div>
                    <p className="text-rose-300/80">
                      Ushbu olimpiada muddati o'tgan ({olympiad.endDate || 'Muddati tugagan'}). Yangi topshirish imkoni mavjud emas.
                    </p>
                  </div>
                </div>
              ) : null}

              {!isGradeEligible ? (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-3 mt-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-white text-sm">❌ Sinf Cheklovi: Siz ushbu olimpiadada qatnasha olmaysiz!</div>
                    <p>
                      Ushbu musobaqa faqat <strong>{targetGrades.join(', ')}-sinf</strong> o'quvchilari uchun mo'ljallangan.
                      Sizning profilingizdagi sinf: <strong className="text-amber-300 font-mono">{studentGrade ? `${studentGrade}-sinf` : 'Noma\'lum'}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mos sinflar: {targetGrades.join(', ')}-sinflar {studentGrade ? `(Sizning sinfingiz: ${studentGrade}-sinf ✓)` : ''}</span>
                </div>
              )}
            </div>

            {/* Asosiy ko'rsatkichlar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 space-y-1 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Ajratilgan vaqt</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{olympiad.durationMinutes || (olympiad as any).duration_minutes || 60} daqiqa</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 space-y-1 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <span>Savollar soni</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{olympiad.totalQuestions} ta savol</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 space-y-1 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Maksimal ball</span>
                </div>
                <div className="text-lg font-black text-zinc-100">{olympiad.maxScore || 100} ball</div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 space-y-1 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Sertifikat</span>
                </div>
                <div className="text-xs font-bold text-purple-300 truncate">QR-kodli Diplom</div>
              </div>
            </div>

            {/* Ishtirokchi ma'lumotlari */}
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  {user?.fullName?.charAt(0) || 'O'}
                </div>
                <div>
                  <div className="font-bold text-zinc-200 text-sm">{user?.fullName || "Ishtirokchi"}</div>
                  <div className="text-zinc-400 text-[11px]">{studentGrade ? `${studentGrade}-sinf` : '9-sinf'} • {user?.region || 'Toshkent sh.'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ishtirok Tasdiqlangan ✓
                </span>
              </div>
            </div>

            {/* Tizim va Qurilmalar Tayyorgarligi Tekshiruvi: Veb-kamera + Mikrofon + Internet + To'liq Ekran */}
            <div className="p-5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 backdrop-blur-xs">
              <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Tizim va Qurilmalar Tayyorgarligi (Yuz & Ovoz Nazorati):
                </span>
                <button
                  type="button"
                  onClick={handleTestCamera}
                  className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Qurilmalarni tekshirish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    Internet:
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isOnline ? 'Barqaror ✓' : 'Oflayn'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    Veb-Kamera (Yuz):
                  </span>
                  {cameraChecked === 'ready' ? (
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Faol ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestCamera}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      {cameraChecked === 'checking' ? 'Tekshirilmoqda...' : 'Yoqish'}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    Mikrofon (Ovoz):
                  </span>
                  {micChecked === 'ready' ? (
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Faol ✓
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTestCamera}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {micChecked === 'checking' ? 'Tekshirilmoqda...' : 'Yoqish'}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Maximize className="w-3.5 h-3.5 text-amber-400" />
                    To'liq Ekran:
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tayyor ✓
                  </span>
                </div>
              </div>
            </div>

            {/* Imtihon qoidalari */}
            <div className="p-5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 backdrop-blur-xs">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Imtihon qoidalari va eslatmalar:</span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                  <span><strong>Sahifadan chiqish taqiqlanadi:</strong> Tab almashish yoki boshqa oynaga o'tish anti-cheat tomonidan darhol qayd etiladi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                  <span><strong>Veb-kamera va yuz nazorati:</strong> Kadrni tark etish, chetga uzoq qarash yoki begona shaxslar paydo bo'lishi AI tomonidan kuzatiladi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                  <span><strong>Ovoz va mikrofon nazorati:</strong> Xonadagi begona suhbatlar va ko'rsatmalar AI audio moduli orqali tahlil qilinadi.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">4</span>
                  <span><strong>Avtomatik saqlanish:</strong> Javoblaringiz har bir variant tanlanganda darhol serverga biriktiriladi.</span>
                </li>
              </ul>
            </div>

            {/* Holat bildirishnomalari */}
            {isDateFinished ? (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-rose-200">Musobaqa muddati yakunlangan</div>
                    <div className="text-[11px] text-rose-400">Ushbu olimpiadada qatnashish vaqti tugagan ({olympiad.endDate || 'Tugagan'}).</div>
                  </div>
                </div>
                {attemptsUsed > 0 && (
                  <Link to="/results">
                    <Button size="sm" variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs">
                      Natijani Ko'rish
                    </Button>
                  </Link>
                )}
              </div>
            ) : timeLeftToStart && timeLeftToStart > 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  Olimpiada boshlanishiga qolgan vaqt:
                </div>
                <div className="text-3xl font-black text-amber-300 font-mono tracking-widest">
                  {formatCountdown(timeLeftToStart)}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Boshlanish vaqti: <strong>{olympiad.startDate}</strong>. Vaqt yetganda boshlash tugmasi faollashadi.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-300">Olimpiada ochiq va topshirishga tayyor!</span>
                  <p className="text-zinc-400 mt-0.5">
                    Qoidalar bilan tanishib, rozilikni tasdiqlang va imtihonni boshlang.
                  </p>
                </div>
              </div>
            )}

            {isRetake && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>
                    <strong>Qayta topshirish rejimi:</strong> Siz bu testni <strong>{attemptsUsed + 1}-marta</strong> topshiryapsiz (Jami: {maxAttempts} ta urinish ruxsat etilgan).
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  {attemptsUsed + 1} / {maxAttempts} Urinish
                </span>
              </div>
            )}

            {!canAttempt && attemptsUsed > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>Urinishlar tugagan:</strong> Siz ushbu imtihonni avval topshirgansiz ({attemptsUsed} ta urinish). Qayta topshirish uchun ruxsat berilmagan.
                  </span>
                </div>
                <Link to="/results">
                  <Button size="sm" variant="outline" className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs">
                    Natijani Ko'rish
                  </Button>
                </Link>
              </div>
            )}

            {/* Qoidalarga rozilik tasdig'i */}
            <div
              onClick={() => canAttempt && !isDateFinished && setRulesAccepted(!rulesAccepted)}
              className={clsx(
                "p-4 rounded-xl border flex items-start gap-3 transition-all select-none",
                canAttempt && !isDateFinished
                  ? "bg-zinc-950/70 border-white/10 hover:border-emerald-500/50 cursor-pointer"
                  : "bg-zinc-950/40 border-white/5 opacity-60 cursor-not-allowed"
              )}
            >
              <button
                type="button"
                disabled={!canAttempt || isDateFinished}
                className="mt-0.5 text-emerald-400 hover:text-emerald-300 shrink-0"
              >
                {rulesAccepted ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-500" />
                )}
              </button>
              <span className="text-xs text-zinc-300 font-medium leading-relaxed">
                Men barcha qoidalar, halollik kodeksi va texnik talablar bilan to'liq tanishdim. Imtihonda faqat o'z bilimimga tayangan holda, qoidalarni buzmasdan qatnashishga roziman.
              </span>
            </div>

            {/* Pastki amallar paneli */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link to="/student/olympiads" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="w-full sm:w-auto text-zinc-400 hover:text-white"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Olimpiadalar ro'yxatiga qaytish
                </Button>
              </Link>

              {!canAttempt && attemptsUsed > 0 ? (
                <Link to="/results" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto font-black shadow-lg shadow-emerald-500/25 px-8 bg-gradient-to-r from-emerald-500 to-teal-600"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Natijani Ko'rish 📊
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!rulesAccepted || isDateFinished || !canAttempt || (!!timeLeftToStart && timeLeftToStart > 0)}
                  onClick={handleStartExam}
                  className={clsx(
                    "w-full sm:w-auto font-black shadow-xl px-8 transition-all active:scale-95",
                    isDateFinished || !canAttempt
                      ? "bg-zinc-800 opacity-60 cursor-not-allowed text-zinc-500"
                      : timeLeftToStart && timeLeftToStart > 0
                      ? "bg-amber-600/80 opacity-80 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25 text-white"
                  )}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isDateFinished
                    ? "Musobaqa Yakunlangan 🔒"
                    : !canAttempt
                    ? "Ishtirok Cheklangan"
                    : timeLeftToStart && timeLeftToStart > 0
                    ? `Boshlanishiga: ${formatCountdown(timeLeftToStart)} ⏳`
                    : isRetake
                    ? `Qayta Topshirish (${attemptsUsed + 1}/${maxAttempts}-urinish) 🚀`
                    : "Olimpiadani Boshlash 🚀"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleConfirmSubmit = async () => {
    let res;
    try { res = await submitFinal(); }
    catch (error) { alert(error instanceof Error ? error.message : 'Natija saqlanmadi. Qayta urinib ko‘ring.'); return; }
    setShowConfirmModal(false);
    if (res) {
      setSubmissionResult(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans">
      
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md text-zinc-100 border-b border-white/10 px-4 sm:px-8 h-16 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-emerald-500/20">
            IS
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-zinc-100 truncate max-w-xs sm:max-w-md">{olympiad.title}</h2>
            <span className="text-[10px] text-emerald-400 font-mono">{antiCheatActive ? 'Nazorat qoidalari yoqilgan' : 'Nazorat qoidalari o‘chirilgan'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          {allowedLangs.length > 1 && (
            <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-0.5">
              {allowedLangs.map((lang: string) => {
                const isSelected = selectedExamLang === lang;
                const shortCode = lang.includes("O'zbek") ? "UZ" : lang.includes("Rus") ? "RU" : lang.includes("Ingliz") ? "EN" : "QR";
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageChange(lang)}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95",
                      isSelected ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs" : "text-zinc-400 hover:text-white"
                    )}
                    title={`Til: ${lang}`}
                  >
                    {shortCode}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
            }}
            title="To'liq ekranga o'tish (DualProctor)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            <Maximize className="w-3.5 h-3.5 text-emerald-400" />
            <span>To'liq Ekran</span>
          </button>
          <Timer />
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowConfirmModal(true)}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="shadow-lg shadow-rose-500/20"
          >
            {t('contest.submit')}
          </Button>
        </div>
      </header>

      
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
        
        <div className="lg:col-span-3 space-y-6">
          <QuestionCard question={currentQuestion} questionNumber={currentQuestionIndex + 1} />

          
          <div className="flex items-center justify-between bg-zinc-900/60 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <Button
              variant="outline"
              size="sm"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {t('contest.prev')}
            </Button>

            <span className="text-xs font-bold text-zinc-300">
              {t('contest.question')} <span className="text-emerald-400">{currentQuestionIndex + 1}</span> {t('contest.of')} {questions.length}
            </span>

            <Button
              variant="primary"
              size="sm"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {t('contest.next')}
            </Button>
          </div>
        </div>

        
        <div className="space-y-6">
          
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-100">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jonli Kamera Nazorati</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Faol
              </span>
            </div>
            
            <div className="relative aspect-video rounded-xl bg-zinc-950 overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror scale-x-[-1]"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-emerald-300 font-mono border border-white/10">
                DualProctor • AI Live
              </div>
            </div>
          </div>

          <QuestionPalette />

          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>DualProctor Xavfsizlik</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Himoyalangan
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-white/10">
                <span className="text-zinc-400">Tab Switch soni:</span>
                <strong className={`font-mono ${tabSwitchCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {tabSwitchCount} / 3 ta
                </strong>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-white/10">
                <span className="text-zinc-400">AI monitoring:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Suratlar yuborilmoqda
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      
      <AntiCheatBanner />

      
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title={t('contest.confirmSubmitTitle')}>
        <div className="space-y-5 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
          <p className="text-sm text-zinc-300 leading-relaxed">
            {t('contest.confirmSubmitBody')}
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" isLoading={isSubmitting} onClick={handleConfirmSubmit}>
              Tasdiqlash va Topshirish
            </Button>
          </div>
        </div>
      </Modal>

      
      <Modal isOpen={!!submissionResult} onClose={() => navigate('/results')} title="Musobaqa Yakunlandi!" size="md">
        <div className="text-center p-4 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-zinc-100">Tabriklaymiz!</h3>
            <p className="text-sm text-zinc-400">Siz olimpiada masalalarini muvaffaqiyatli topshirdingiz.</p>
          </div>
          <div className="p-6 bg-zinc-950/80 rounded-2xl border border-white/10 text-center space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">To'plangan Ball</span>
            <div className="text-4xl font-black text-emerald-400 font-mono">
              {submissionResult?.score} <span className="text-xl text-zinc-400 font-sans">/ {submissionResult?.maxScore || 100} ball</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-zinc-300 pt-2 border-t border-white/10 mt-2">
              <span className="text-emerald-400 font-bold">✓ {submissionResult?.correctAnswersCount ?? 0} ta to'g'ri</span>
              <span className="text-zinc-600">|</span>
              <span className="text-rose-400 font-bold">
                ✗ {Math.max(0, (submissionResult?.totalQuestions ?? 0) - (submissionResult?.correctAnswersCount ?? 0))} ta xato
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-teal-400 font-bold">Jami: {submissionResult?.totalQuestions ?? 0} ta savol</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => navigate('/results')}>
              Natijalar & Tahlil
            </Button>
            <Button variant="primary" className="w-full" onClick={() => navigate('/certificates')}>
              Sertifikatni Ko'rish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
