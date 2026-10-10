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
import { PayxPaymentModal } from '../../components/common/PayxPaymentModal';
import { ExamSetupModal } from '../../components/contest/ExamSetupModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { usePaymentStore } from '../../store/usePaymentStore';
import { apiClient } from '../../services/api';
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
  CreditCard
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
  const { data: questions } = useOlympiadQuestions(id || '');

  
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

  const olympiadPrice = (olympiad as any)?.price ? Number((olympiad as any).price) : 0;
  const isFree = Boolean((olympiad as any)?.isFree) || olympiadPrice === 0;

  const [isPaid, setIsPaid] = useState(() => {
    if (!id || !user?.id) return false;
    if (isFree) return true;
    return false; // Server authoritative
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Authoritative server-side payment verification
  useEffect(() => {
    if (!id || !user?.id || isFree) {
      if (isFree) setIsPaid(true);
      return;
    }
    apiClient.get(`/payments/status/${encodeURIComponent(id)}`)
      .then((res: any) => {
        if (res && res.data) {
          setIsPaid(Boolean(res.data.hasPaid));
        }
      })
      .catch(() => {});
  }, [id, user?.id, isFree]);

  const [isRegistered, setIsRegistered] = useState(() => {
    if (!id || !user?.id) return false;
    return localStorage.getItem(`reg_olymp_${user.id}_${id}`) === 'true';
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState<'registration' | 'exam_briefing'>('registration');

  
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

  const handleRegisterOlympiad = () => {
    if (isDateFinished) {
      alert("⚠️ Ushbu musobaqa muddati yakunlangan!");
      return;
    }
    if (isRegistrationExpired && !isRegistered) {
      alert("⚠️ Ushbu musobaqaga ro'yxatdan o'tish muddati tugagan!");
      return;
    }
    if (!isGradeEligible) {
      alert(`⚠️ Ushbu olimpiada faqat ${targetGrades.join(', ')}-sinflar uchun mo'ljallangan! Sizning sinfingiz: ${studentGrade}-sinf.`);
      return;
    }

    
    if (!isFree && !isPaid) {
      setIsPaymentModalOpen(true);
      return;
    }

    setIsRegistering(true);
    setTimeout(() => {
      if (user?.id && id) {
        localStorage.setItem(`reg_olymp_${user.id}_${id}`, 'true');
        useOlympiadStore.getState().updateOlympiad(id, {
          registeredCount: (olympiad?.participantsCount || 0) + 1
        });
      }
      setIsRegistered(true);
      setIsRegistering(false);
      confetti({ particleCount: 50, spread: 60 });
      setCurrentStep('exam_briefing');
    }, 400);
  };

  const handlePaymentSuccess = async (txn?: any) => {
    if (user?.id && id) {
      try {
        await apiClient.post('/payments/verify', {
          examId: id,
          amount: olympiadPrice,
          provider: txn?.paymentMethod || 'payx',
          transactionRef: txn?.id || `PAYX-${Date.now()}`,
        });
      } catch (err) {
        console.warn('Backend payment verification notice:', err);
      }
      setIsPaid(true);
      setIsRegistered(true);
      localStorage.setItem(`reg_olymp_${user.id}_${id}`, 'true');

      usePaymentStore.getState().addPayment({
        userName: user.fullName || "O'quvchi",
        userPhone: user.phone || '+998 90 123 45 67',
        userRole: 'student',
        olympiadOrPackage: olympiad?.title || 'Olimpiada ishtiroki',
        method: txn?.paymentMethod === 'cash' ? 'naqd' : 'karta',
        amount: olympiadPrice,
        status: 'muvaffaqiyatli',
        transactionRef: txn?.id || `PAYX-${Date.now()}`
      });

      useOlympiadStore.getState().updateOlympiad(id, {
        registeredCount: (olympiad?.participantsCount || 0) + 1
      });
    }
    setIsPaymentModalOpen(false);
    confetti({ particleCount: 70, spread: 70 });
    setCurrentStep('exam_briefing');
  };

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
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [cameraChecked, setCameraChecked] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle');
  const [isDualDeviceModalOpen, setIsDualDeviceModalOpen] = useState(false);
  const [isDualDeviceCalibrated, setIsDualDeviceCalibrated] = useState(false);
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
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraChecked('ready');
      } else {
        setCameraChecked('ready');
      }
    } catch {
      setCameraChecked('ready');
    }
  };

  
  const captureSnapshot = (): string => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        } else {
          
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, 320, 240);

          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(160, 100, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(160, 210, 70, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ANTI-CHEAT SNAPSHOT', 160, 30);
        }

        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 205, 320, 35);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`F.I.Sh: ${user?.fullName || 'Ishtirokchi'}`, 8, 218);
        ctx.fillText(`Vaqt: ${new Date().toLocaleString()}`, 8, 232);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(305, 222, 5, 0, Math.PI * 2);
        ctx.fill();

        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.error('Error capturing webcam snapshot:', e);
    }
    return '';
  };

  
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
      startCamera();

      const config = olympiad?.antiCheatConfig;
      const gracePeriodSec = config?.maxAbsenceGracePeriod ?? (config?.proctoringMode === 'STRICT' ? 1.5 : config?.proctoringMode === 'STANDARD' ? 3.0 : 4.0);
      const graceTicks = Math.max(1, Math.round(gracePeriodSec / 0.5));
      const maxViolations = config?.maxViolationsAllowed || 3;

      
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
            
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 160, 120);
              const frameData = ctx.getImageData(0, 0, 160, 120).data;
              let totalLuminance = 0;
              let totalEdgeGradient = 0;

              for (let y = 0; y < 120; y++) {
                for (let x = 0; x < 160; x++) {
                  const i = (y * 160 + x) * 4;
                  const r = frameData[i];
                  const g = frameData[i + 1];
                  const b = frameData[i + 2];
                  const lum = (r + g + b) / 3;
                  totalLuminance += lum;

                  if (x < 159) {
                    const rNext = frameData[i + 4];
                    const gNext = frameData[i + 5];
                    const bNext = frameData[i + 6];
                    const lumNext = (rNext + gNext + bNext) / 3;
                    totalEdgeGradient += Math.abs(lum - lumNext);
                  }
                }
              }

              const avgLuminance = totalLuminance / (160 * 120);
              const avgEdgeGradient = totalEdgeGradient / (160 * 120);

              
              if (avgLuminance < 14 || avgEdgeGradient < 2.2) {
                missingFaceConsecutive++;
                if (missingFaceConsecutive >= graceTicks) {
                  const snap = captureSnapshot();
                  useContestStore.getState().recordGuardViolation(
                    'NO_FACE_DETECTED',
                    'Kamera ob\'ektivi qo\'l yoki boshqa narsa bilan to\'sib qo\'yildi! Kamerani yopmang.',
                    maxViolations,
                    snap
                  );
                  missingFaceConsecutive = 0;
                }
              } else {
                missingFaceConsecutive = 0;
              }
            }
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

    // Strict server-side verification before starting exam
    try {
      await apiClient.post(`/exams/${encodeURIComponent(id)}/start`);
    } catch (err: any) {
      if (err?.response?.status === 402 || err?.response?.data?.code === 'PAYMENT_REQUIRED') {
        alert("⚠️ Ushbu musobaqa uchun to'lov amalga oshirilmagan yoki serverda tasdiqlanmagan. Iltimos, to'lovni bajaring.");
        setIsPaid(false);
        setIsPaymentModalOpen(true);
        return;
      }
      if (err?.response?.data?.error) {
        alert(`⚠️ ${err.response.data.error}`);
        return;
      }
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    if (olympiad && questions && questions.length > 0) {
      startContest(olympiad.id, questions, olympiad.durationMinutes || 60);
    }
    setHasStarted(true);
  };

  const handleStartExam = () => {
    if (!isRegistered) {
      alert("Iltimos, avval ushbu olimpiadaga ro'yxatdan o'ting!");
      return;
    }
    if (!rulesAccepted) return;
    if (timeLeftToStart && timeLeftToStart > 0) return;

    
    if (!isDualDeviceCalibrated) {
      setIsDualDeviceModalOpen(true);
      return;
    }

    proceedToStartExam();
  };

  
  useAntiCheat(hasStarted && !isSubmitted, {
    olympiadId: olympiad?.id || id,
    olympiadTitle: olympiad?.title || 'Onlayn Olimpiada',
    maxViolations: 3,
    requireFullscreen: true,
    onCaptureSnapshot: captureSnapshot,
  });

  
  const audioConfig = olympiad?.antiCheatConfig;
  const audioProctoringEnabled = hasStarted && !isSubmitted && audioConfig?.proctoringMode !== 'DISABLED' && audioConfig?.requireVoiceBiometrics !== false;

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

  if (!olympiad || !questions || questions.length === 0) {
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
              <span>DualProctor AI Himoyasi</span>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-900/60 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setCurrentStep('registration')}
              className={clsx(
                "flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95",
                currentStep === 'registration'
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <span className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                isRegistered ? "bg-emerald-400 text-zinc-950" : "bg-zinc-800 text-white"
              )}>
                {isRegistered ? "✓" : "1"}
              </span>
              <span>1-Qadam: Ro'yxatdan O'tish</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isRegistered && canAttempt) setCurrentStep('exam_briefing');
              }}
              disabled={!isRegistered || !canAttempt}
              className={clsx(
                "flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95",
                currentStep === 'exam_briefing'
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  : !isRegistered || !canAttempt
                  ? "text-zinc-600 opacity-50 cursor-not-allowed"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 cursor-pointer"
              )}
            >
              <span className="w-6 h-6 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-black shrink-0">
                2
              </span>
              <span>2-Qadam: Imtihon va Anti-Cheat</span>
            </button>
          </div>

          
          
          
          {currentStep === 'registration' && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
              
              <div className="border-b border-white/10 pb-6 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Bosqich: Olimpiada Ma'lumotlari va Ro'yxatdan O'tish</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                  {olympiad.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                  {olympiad.description || "Ushbu musobaqada qatnashish uchun avval ro'yxatdan o'ting, so'ngra imtihon xonasiga o'tib testni boshlashingiz mumkin."}
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
                        Ushbu olimpiada muddati o'tgan ({olympiad.endDate || 'Muddati tugagan'}). Yangi ro'yxatdan o'tish yoki topshirish imkoni mavjud emas.
                      </p>
                    </div>
                  </div>
                ) : isRegistrationExpired && !isRegistered ? (
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3 mt-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-white text-sm">⏳ Ro'yxatdan O'tish Muddati Tugagan</div>
                      <p className="text-amber-300/80">
                        Ushbu musobaqaga ro'yxatdan o'tish yopilgan ({olympiad.registrationEndDate || 'Yopilgan'}).
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
                  <div className="text-lg font-black text-zinc-100">{questions.length} ta savol</div>
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

              
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 backdrop-blur-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {isRegistered ? <UserCheck className="w-5 h-5 text-emerald-400" /> : <UserPlus className="w-5 h-5 text-teal-400" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">Ishtirokchi Shaxsiy Ma'lumotlari</h3>
                      <p className="text-[11px] text-zinc-400">Musobaqada qatnashish maqomi va shaxsiy kabinet ma'lumotlari</p>
                    </div>
                  </div>

                  {isRegistered ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ro'yxatdan o'tilgan
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Ro'yxatdan o'tish kutilmoqda
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">F.I.Sh.</div>
                    <div className="font-bold text-zinc-100 text-sm truncate">{user?.fullName || "Ishtirokchi"}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Sinfi & Hudud</div>
                    <div className="font-bold text-zinc-200">{user?.grade ? `${user.grade}-sinf` : '9-sinf'} • {user?.region || 'Toshkent sh.'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Ishtirok Narxi</div>
                    <div className={clsx("font-bold text-sm font-mono", isFree ? "text-emerald-400" : isPaid ? "text-teal-300" : "text-amber-400")}>
                      {isFree ? 'BEPUL (Open Access)' : isPaid ? `${olympiadPrice.toLocaleString()} UZS (To'langan ✓)` : `${olympiadPrice.toLocaleString()} UZS`}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 space-y-1">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Holati</div>
                    <div className={clsx("font-bold text-xs", isRegistered ? "text-emerald-400" : !isFree && !isPaid ? "text-amber-400" : "text-teal-300")}>
                      {isRegistered ? 'Ishtirok Tasdiqlangan ✓' : !isFree && !isPaid ? "To'lov qilinmagan" : 'Ro\'yxatdan o\'tish zarur'}
                    </div>
                  </div>
                </div>

                
                {attemptsUsed > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Siz ushbu testda <strong>{attemptsUsed} marta</strong> qatnashgansiz.
                        {retakeAllowed && attemptsUsed < maxAttempts ? ` Yana ${maxAttempts - attemptsUsed} ta urinish imkoniyati mavjud.` : ' Urinishlar to\'liq tugagan.'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                      {attemptsUsed} / {maxAttempts} Urinish
                    </span>
                  </div>
                )}
              </div>

              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                <Link to="/student/olympiads" className="w-full sm:w-auto">
                  <Button variant="ghost" size="md" className="w-full sm:w-auto text-zinc-400 hover:text-white">
                    Bekor qilish va ro'yxatga qaytish
                  </Button>
                </Link>

                {!isRegistered ? (
                  <Button
                    onClick={handleRegisterOlympiad}
                    isLoading={isRegistering}
                    disabled={!isGradeEligible || isDateFinished || (isRegistrationExpired && !isRegistered) || isRegistering}
                    variant="primary"
                    size="lg"
                    className={clsx(
                      "w-full sm:w-auto text-white font-bold px-8 shadow-xl active:scale-95",
                      !isGradeEligible || isDateFinished || (isRegistrationExpired && !isRegistered)
                        ? "bg-zinc-800 opacity-60 cursor-not-allowed text-zinc-500"
                        : !isFree && !isPaid
                        ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/30 ring-2 ring-emerald-400/30 animate-pulse"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25"
                    )}
                    leftIcon={
                      !isGradeEligible || isDateFinished || (isRegistrationExpired && !isRegistered) ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : !isFree && !isPaid ? (
                        <CreditCard className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )
                    }
                  >
                    {!isGradeEligible
                      ? "Sinfingizga mos emas"
                      : isDateFinished
                      ? "Musobaqa yakunlangan 🔒"
                      : isRegistrationExpired && !isRegistered
                      ? "Ro'yxatdan o'tish yopilgan ⏳"
                      : !isFree && !isPaid
                      ? `PayX Bilan To'lov Qilish (${olympiadPrice.toLocaleString()} UZS) 💳`
                      : "Olimpiadaga Ro'yxatdan O'tish 📝"}
                  </Button>
                ) : !canAttempt && attemptsUsed > 0 ? (
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
                ) : isDateFinished ? (
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled
                    className="w-full sm:w-auto font-black opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-500 border border-white/5"
                  >
                    Musobaqa Yakunlangan 🔒
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setCurrentStep('exam_briefing')}
                    className="w-full sm:w-auto font-black shadow-lg shadow-emerald-500/25 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Keyingi bosqich: Imtihon xonasiga o'tish (2-Qadam) ➡️
                  </Button>
                )}
              </div>
            </div>
          )}

          
          
          
          {currentStep === 'exam_briefing' && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
              
              <div className="border-b border-white/10 pb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>2-Bosqich: Imtihon Xonasi & Tayyorgarlik</span>
                  </div>

                  
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

                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                  {olympiad.title} — Imtihon Xonasi
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
                  Imtihonni boshlashdan oldin texnik tayyorgarlikni tekshiring hamda xavfsizlik qoidalariga rozilik berib testni boshlang.
                </p>
              </div>

              
              <div className="p-5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 backdrop-blur-xs">
                <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Imtihon qoidalari va eslatmalar:</span>
                </div>

                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                    <span><strong>Sahifadan chiqish taqiqlanadi:</strong> Tab almashish yoki boshqa ilovani ochish anti-cheat tomonidan qayd etiladi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                    <span><strong>Avtomatik saqlanish:</strong> Javoblaringiz har bir belgilanganda darhol serverga saqlanadi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                    <span><strong>Veb-kamera nazorati:</strong> Kadrni tark etish yoki begona shaxslar paydo bo'lishi taqiqlanadi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0 text-[11px]">4</span>
                    <span><strong>To'liq ekran rejimi:</strong> Test faqat to'liq ekranda ishlaydi.</span>
                  </li>
                </ul>
              </div>

              
              <div className="p-5 rounded-xl bg-zinc-950/70 border border-white/10 space-y-3 backdrop-blur-xs">
                <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Tizim va Qurilmalar Tayyorgarligi Tekshiruvi:
                  </span>
                  <button
                    onClick={handleTestCamera}
                    className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Qayta tekshirish</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      Internet Aloqasi:
                    </span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isOnline ? 'Barqaror ✓' : 'Oflayn'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-teal-400" />
                      Veb-Kamera:
                    </span>
                    {cameraChecked === 'ready' ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Faol va Ulandi ✓
                      </span>
                    ) : (
                      <button
                        onClick={handleTestCamera}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                      >
                        {cameraChecked === 'checking' ? 'Tekshirilmoqda...' : 'Kamerani yoqish'}
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

                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      Dual-Device (2-Telefon):
                    </span>
                    {isDualDeviceCalibrated ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> AI Tasdiqlangan ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDualDeviceModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:text-white cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Sozlash va Kalibratsiya</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              
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

              
              <div
                onClick={() => isRegistered && canAttempt && !isDateFinished && setRulesAccepted(!rulesAccepted)}
                className={clsx(
                  "p-4 rounded-xl border flex items-start gap-3 transition-all select-none",
                  isRegistered && canAttempt && !isDateFinished
                    ? "bg-zinc-950/70 border-white/10 hover:border-emerald-500/50 cursor-pointer"
                    : "bg-zinc-950/40 border-white/5 opacity-60 cursor-not-allowed"
                )}
              >
                <button
                  type="button"
                  disabled={!isRegistered || !canAttempt || isDateFinished}
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

              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setCurrentStep('registration')}
                  className="w-full sm:w-auto text-zinc-400 hover:text-white"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  1-Qadam (Ma'lumotlar)ga qaytish
                </Button>

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
                    disabled={!isRegistered || !rulesAccepted || isDateFinished || (!!timeLeftToStart && timeLeftToStart > 0)}
                    onClick={handleStartExam}
                    className={clsx(
                      "w-full sm:w-auto font-black shadow-xl px-8 transition-all active:scale-95",
                      isDateFinished
                        ? "bg-zinc-800 opacity-60 cursor-not-allowed text-zinc-500"
                        : timeLeftToStart && timeLeftToStart > 0
                        ? "bg-amber-600/80 opacity-80 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25 text-white"
                    )}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {isDateFinished
                      ? "Musobaqa Yakunlangan 🔒"
                      : timeLeftToStart && timeLeftToStart > 0
                      ? `Boshlanishiga: ${formatCountdown(timeLeftToStart)} ⏳`
                      : isRetake
                      ? `Qayta Topshirish (${attemptsUsed + 1}/${maxAttempts}-urinish) 🚀`
                      : "Olimpiadani Boshlash 🚀"}
                  </Button>
                )}
              </div>
            </div>
          )}

          
          <ExamSetupModal
            isOpen={isDualDeviceModalOpen}
            onClose={() => setIsDualDeviceModalOpen(false)}
            onStartExam={() => {
              setIsDualDeviceCalibrated(true);
              setIsDualDeviceModalOpen(false);
              proceedToStartExam();
            }}
            examId={id || 'exam-demo'}
            examTitle={olympiad?.title || 'Ibn Sino Imtihon'}
            examStartTime={olympiad?.startDate}
            examEndTime={olympiad?.endDate}
            studentId={user?.id || 'student-demo'}
            studentName={user?.fullName || "O'quvchi"}
          />

          
          <PayxPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            amount={olympiadPrice}
            olympiadTitle={olympiad?.title || 'Olimpiada'}
            olympiadId={id}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    );
  }

  
  
  
  const currentQuestion = questions[currentQuestionIndex];

  const handleConfirmSubmit = async () => {
    const res = await submitFinal();
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
            <span className="text-[10px] text-emerald-400 font-mono">Ibn Sino Proctor Active • Server Verified</span>
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

      
      <PayxPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={olympiadPrice}
        olympiadTitle={olympiad?.title || 'Olimpiada'}
        olympiadId={id}
        onSuccess={handlePaymentSuccess}
      />

      
      <ExamSetupModal
        isOpen={isDualDeviceModalOpen}
        onClose={() => setIsDualDeviceModalOpen(false)}
        onStartExam={() => {
          setIsDualDeviceCalibrated(true);
          setIsDualDeviceModalOpen(false);
          proceedToStartExam();
        }}
        examId={id || 'exam-demo'}
        examTitle={olympiad?.title || 'Ibn Sino Imtihon'}
        examStartTime={olympiad?.startDate}
        examEndTime={olympiad?.endDate}
        studentId={user?.id || 'student-demo'}
        studentName={user?.fullName || "O'quvchi"}
      />
    </div>
  );
};
