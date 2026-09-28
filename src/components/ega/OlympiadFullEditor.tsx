import React, { useState, useMemo, useEffect } from 'react';
import { OlympiadItem } from '../../data/initialOlympiads';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { usePackageStore } from '../../store/usePackageStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Trophy,
  Globe,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Wallet,
  Coins,
  Percent,
  Gift,
  Languages,
  GraduationCap,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  Users,
  Eye,
  Upload,
  FileSpreadsheet,
  Search,
  Award,
  Download,
  X,
  AlertCircle,
  Check,
  HelpCircle,
  Sliders,
  EyeOff,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Type,
  UserX,
  AlertTriangle,
  QrCode,
  FileCheck,
  Lock,
  SlidersHorizontal,
  RefreshCw,
  Printer,
  Mic,
  Volume2,
  AudioLines
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, CertificateConfig, AntiCheatConfig, Certificate, ProctoringPresetMode } from '../../types';
import { MOCK_QUESTIONS } from '../../services/mockData';
import { parseDocxQuestions } from '../../utils/docxParser';
import { submissionService, ParticipantAdminResult } from '../../services/submissionService';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CertificateCanvas } from '../certificate/CertificateCanvas';

interface OlympiadFullEditorProps {
  olympiad: OlympiadItem;
  onBack: () => void;
}

const ALL_LANGUAGES = [
  "O'zbek tili",
  "Rus tili",
  "Ingliz tili",
  "Qoraqalpoq tili",
  "Tojik tili"
];

const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const OlympiadFullEditor: React.FC<OlympiadFullEditorProps> = ({ olympiad, onBack }) => {
  const { updateOlympiad } = useOlympiadStore();
  const { packages } = usePackageStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [activeTab, setActiveTab] = useState<'main' | 'questions' | 'pricing' | 'schedule' | 'certificate' | 'anticheat' | 'stats'>('main');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  
  const [certFont, setCertFont] = useState<'serif' | 'sans' | 'cinzel' | 'playfair' | 'montserrat' | 'greatvibes'>(
    olympiad.certificateConfig?.fontFamily || 'cinzel'
  );
  const [certSubject, setCertSubject] = useState<string>(
    olympiad.certificateConfig?.subjectName || olympiad.subject || ''
  );
  const [isMultiRound, setIsMultiRound] = useState<boolean>(
    olympiad.certificateConfig?.isMultiRound || false
  );

  
  const [awardCriteria, setAwardCriteria] = useState<'top_rank' | 'min_score' | 'both'>(
    olympiad.certificateConfig?.awardCriteria || 'top_rank'
  );
  const [topRankLimit, setTopRankLimit] = useState<number>(
    olympiad.certificateConfig?.topRankLimit || 10
  );
  const [minScoreLimit, setMinScoreLimit] = useState<number>(
    olympiad.certificateConfig?.minScoreLimit || 70
  );

  const [certWinnerText, setCertWinnerText] = useState<string>(
    olympiad.certificateConfig?.winnerText ||
    '"{olympiad}" fan musobaqasida yuqori intellektual salohiyat namoyon etib, faxrli {rank}-o\'rinni egalladi va g\'oliblik diplomi bilan taqdirlanadi.'
  );
  const [certParticipantText, setCertParticipantText] = useState<string>(
    olympiad.certificateConfig?.participantText ||
    '"{olympiad}" fan musobaqasida faol va munosib ishtirok etgani uchun Next Olymp Kengashi nomidan chuqur minnatdorchilik bildiriladi.'
  );
  const [certRound1PassedText, setCertRound1PassedText] = useState<string>(
    olympiad.certificateConfig?.round1PassedText ||
    'Tabriklaymiz! Siz "{olympiad}" fan olimpiadasining 1-bosqichidan muvaffaqiyatli o\'tdingiz va final (hal qiluvchi) bosqichiga yo\'llanma oldingiz!'
  );
  const [certRound1FailedText, setCertRound1FailedText] = useState<string>(
    olympiad.certificateConfig?.round1FailedText ||
    'Ishtirokingiz va intilishingiz uchun samimiy tashakkur! Sizning bilim va qobiliyatingiz yuqori, kelgusi sinovlarda albatta zafar quchasiz!'
  );
  const [certSignatureName, setCertSignatureName] = useState<string>(
    olympiad.certificateConfig?.signatureName || olympiad.organizer || 'Next Olymp Akademik Kengashi'
  );
  const [certSignatureRole, setCertSignatureRole] = useState<string>(
    olympiad.certificateConfig?.signatureRole || "Tashkiliy Qo'mita Raisi"
  );
  const [certPreviewTab, setCertPreviewTab] = useState<'winner' | 'participant' | 'round_passed' | 'round_failed'>('winner');

  
  const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean>(
    olympiad.antiCheatConfig?.enabled !== false
  );
  const [blockTabSwitch, setBlockTabSwitch] = useState<boolean>(
    olympiad.antiCheatConfig?.blockTabSwitch !== false
  );
  const [blockCopyPaste, setBlockCopyPaste] = useState<boolean>(
    olympiad.antiCheatConfig?.blockCopyPaste !== false
  );
  const [requireFullscreen, setRequireFullscreen] = useState<boolean>(
    olympiad.antiCheatConfig?.requireFullscreen !== false
  );
  const [requireWebcam, setRequireWebcam] = useState<boolean>(
    olympiad.antiCheatConfig?.requireWebcam || true
  );
  const [requireMic, setRequireMic] = useState<boolean>(
    olympiad.antiCheatConfig?.requireMic || false
  );
  const [blockDevTools, setBlockDevTools] = useState<boolean>(
    olympiad.antiCheatConfig?.blockDevTools !== false
  );
  const [maxViolations, setMaxViolations] = useState<number>(
    olympiad.antiCheatConfig?.maxViolationsAllowed || 3
  );

  
  const [blockDuplicateIP, setBlockDuplicateIP] = useState<boolean>(
    olympiad.antiCheatConfig?.blockDuplicateIP !== false
  );
  const [heartbeatIntervalSec, setHeartbeatIntervalSec] = useState<number>(
    olympiad.antiCheatConfig?.heartbeatIntervalSec || 10
  );
  const [cameraFaceSnapshotEnabled, setCameraFaceSnapshotEnabled] = useState<boolean>(
    olympiad.antiCheatConfig?.cameraFaceSnapshotEnabled !== false
  );
  const [snapshotOnMultipleFaces, setSnapshotOnMultipleFaces] = useState<boolean>(
    olympiad.antiCheatConfig?.snapshotOnMultipleFaces !== false
  );
  const [snapshotOnNoFace, setSnapshotOnNoFace] = useState<boolean>(
    olympiad.antiCheatConfig?.snapshotOnNoFace !== false
  );

  
  const [proctoringMode, setProctoringMode] = useState<ProctoringPresetMode>(
    olympiad.antiCheatConfig?.proctoringMode || 'STRICT'
  );
  const [requireBothEyesVisible, setRequireBothEyesVisible] = useState<boolean>(
    olympiad.antiCheatConfig?.requireBothEyesVisible !== false
  );
  const [strictFaceCheck, setStrictFaceCheck] = useState<boolean>(
    olympiad.antiCheatConfig?.strictFaceCheck !== false
  );
  const [minFaceConfidence, setMinFaceConfidence] = useState<number>(
    olympiad.antiCheatConfig?.minFaceConfidence || 0.65
  );
  const [maxAbsenceGracePeriod, setMaxAbsenceGracePeriod] = useState<number>(
    olympiad.antiCheatConfig?.maxAbsenceGracePeriod || 1.5
  );
  const [trackGazeDirection, setTrackGazeDirection] = useState<boolean>(
    olympiad.antiCheatConfig?.trackGazeDirection !== false
  );

  
  const [requireVoiceBiometrics, setRequireVoiceBiometrics] = useState<boolean>(
    olympiad.antiCheatConfig?.requireVoiceBiometrics !== false
  );
  const [detectUnknownSpeakers, setDetectUnknownSpeakers] = useState<boolean>(
    olympiad.antiCheatConfig?.detectUnknownSpeakers !== false
  );
  const [detectMultipleSpeakers, setDetectMultipleSpeakers] = useState<boolean>(
    olympiad.antiCheatConfig?.detectMultipleSpeakers !== false
  );
  const [voiceSimilarityThreshold, setVoiceSimilarityThreshold] = useState<number>(
    olympiad.antiCheatConfig?.voiceSimilarityThreshold || 0.70
  );

  const handlePresetSelect = (preset: ProctoringPresetMode) => {
    setProctoringMode(preset);
    if (preset === 'STRICT') {
      setStrictFaceCheck(true);
      setRequireBothEyesVisible(true);
      setTrackGazeDirection(true);
      setMaxAbsenceGracePeriod(1.5);
      setMinFaceConfidence(0.70);
      setMaxViolations(3);
      setRequireVoiceBiometrics(true);
      setDetectUnknownSpeakers(true);
      setDetectMultipleSpeakers(true);
      setVoiceSimilarityThreshold(0.75);
    } else if (preset === 'STANDARD') {
      setStrictFaceCheck(true);
      setRequireBothEyesVisible(true);
      setTrackGazeDirection(false);
      setMaxAbsenceGracePeriod(3.0);
      setMinFaceConfidence(0.55);
      setMaxViolations(4);
      setRequireVoiceBiometrics(true);
      setDetectUnknownSpeakers(true);
      setDetectMultipleSpeakers(true);
      setVoiceSimilarityThreshold(0.70);
    } else if (preset === 'RELAXED') {
      setStrictFaceCheck(false);
      setRequireBothEyesVisible(false);
      setTrackGazeDirection(false);
      setMaxAbsenceGracePeriod(5.0);
      setMinFaceConfidence(0.45);
      setMaxViolations(5);
      setRequireVoiceBiometrics(false);
      setDetectUnknownSpeakers(false);
      setDetectMultipleSpeakers(false);
      setVoiceSimilarityThreshold(0.65);
    }
  };

  
  const [cheatLogs, setCheatLogs] = useState<any[]>(() => {
    return submissionService.getOlympiadCheatLogs(olympiad.id);
  });
  const [cheatFilter, setCheatFilter] = useState<'all' | 'pending' | 'actioned'>('all');
  const [selectedSnapshotLog, setSelectedSnapshotLog] = useState<any | null>(null);

  
  const [participantFilterTab, setParticipantFilterTab] = useState<'all' | 'registered' | 'submitted' | 'paid'>('all');
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [selectedParticipantDetail, setSelectedParticipantDetail] = useState<any | null>(null);

  
  useEffect(() => {
    const refreshLogs = () => {
      const realLogs = submissionService.getOlympiadCheatLogs(olympiad.id);
      setCheatLogs(realLogs);
    };

    refreshLogs();

    const handleLogUpdate = (e: any) => {
      if (!e.detail?.olympiadId || e.detail?.olympiadId === olympiad.id) {
        refreshLogs();
      }
    };

    window.addEventListener('next_olymp_cheat_log_updated', handleLogUpdate);
    window.addEventListener('storage', refreshLogs);

    return () => {
      window.removeEventListener('next_olymp_cheat_log_updated', handleLogUpdate);
      window.removeEventListener('storage', refreshLogs);
    };
  }, [activeTab, olympiad.id]);

  const handleCheatAction = (logId: string, newStatus: 'warned' | 'penalized' | 'disqualified' | 'dismissed' | 'pending') => {
    submissionService.updateCheatLogStatus(olympiad.id, logId, newStatus);
    setCheatLogs(prev => prev.map(item => item.id === logId ? { ...item, status: newStatus } : item));
    if (newStatus === 'disqualified') {
      const targetLog = cheatLogs.find(l => l.id === logId);
      if (targetLog?.studentId) {
        submissionService.disqualifyParticipant(targetLog.studentId, olympiad.id, targetLog.type);
      }
    }
  };

  
  const [title, setTitle] = useState(olympiad.title);
  const [subject, setSubject] = useState(olympiad.subject);
  const [format, setFormat] = useState<'online' | 'offline'>(olympiad.format);
  const [status, setStatus] = useState<'ochiq' | 'yopiq'>(olympiad.status);
  const [location, setLocation] = useState(olympiad.location || '');
  const [organizer, setOrganizer] = useState(olympiad.organizer || 'NextOlymp Akademik Kengashi');
  const [image, setImage] = useState(olympiad.image);
  const [description, setDescription] = useState(olympiad.description);

  
  const [showResultsToStudent, setShowResultsToStudent] = useState<boolean>(
    olympiad.showResultsToStudent !== false
  );
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState<boolean>(
    olympiad.aiAnalysisEnabled !== false
  );
  const [resultsPublishDate, setResultsPublishDate] = useState<string>(
    olympiad.resultsPublishDate || '2026-09-25 10:00'
  );

  
  const [retakeAllowed, setRetakeAllowed] = useState<boolean>(
    olympiad.retakeAllowed || false
  );
  const [maxRetakeAttempts, setMaxRetakeAttempts] = useState<number>(
    olympiad.maxRetakeAttempts || 2
  );

  
  const [durationMinutes, setDurationMinutes] = useState<number>(
    olympiad.durationMinutes || (olympiad as any).duration_minutes || 60
  );

  
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(
    olympiad.allowedLanguages || ["O'zbek tili", "Rus tili", "Ingliz tili"]
  );

  
  const [targetGrades, setTargetGrades] = useState<number[]>(
    olympiad.targetGrades || [5, 6, 7, 8, 9, 10, 11]
  );

  
  const [paymentMethods, setPaymentMethods] = useState<('naqd' | 'karta' | 'hamyon')[]>(
    olympiad.paymentMethods || ['karta', 'hamyon', 'naqd']
  );

  
  const [price, setPrice] = useState<number>(olympiad.price);
  const [isFreeForAll, setIsFreeForAll] = useState<boolean>(
    olympiad.isFreeForAll || olympiad.price === 0
  );
  const [separatePricesEnabled, setSeparatePricesEnabled] = useState<boolean>(
    olympiad.separatePricesEnabled || false
  );
  const [onlinePrice, setOnlinePrice] = useState<number>(olympiad.onlinePrice || olympiad.price);
  const [offlinePrice, setOfflinePrice] = useState<number>(olympiad.offlinePrice || olympiad.price + 15000);

  
  const [discountPercent, setDiscountPercent] = useState<number>(olympiad.discountPercent || 0);
  const [discountAmount, setDiscountAmount] = useState<number>(olympiad.discountAmount || 0);

  
  const [freeForPackageId, setFreeForPackageId] = useState<string>(
    olympiad.freeForPackageId || 'PKG-003' 
  );

  
  const [isAlwaysOpen, setIsAlwaysOpen] = useState<boolean>(Boolean(olympiad.isAlwaysOpen));

  
  const [registrationStartDate, setRegistrationStartDate] = useState<string>(
    olympiad.registrationStartDate || '2026-09-01 09:00'
  );
  const [registrationEndDate, setRegistrationEndDate] = useState<string>(
    olympiad.registrationEndDate || '2026-09-24 23:59'
  );
  const [startDate, setStartDate] = useState<string>(olympiad.startDate || '2026-09-25 09:00');
  const [endDate, setEndDate] = useState<string>(olympiad.endDate || '2026-09-30 23:59');

  
  const toDatetimeInput = (val?: string) => {
    if (!val) return '';
    return val.trim().replace(' ', 'T').slice(0, 16);
  };

  const fromDatetimeInput = (val: string) => {
    if (!val) return '';
    return val.replace('T', ' ');
  };

  
  const dateValidationErrorMsg = useMemo(() => {
    if (isAlwaysOpen) return null; 
    if (!registrationEndDate || !startDate) return null;
    const rStart = registrationStartDate ? new Date(registrationStartDate.replace(' ', 'T')).getTime() : 0;
    const rEnd = new Date(registrationEndDate.replace(' ', 'T')).getTime();
    const st = new Date(startDate.replace(' ', 'T')).getTime();
    const end = endDate ? new Date(endDate.replace(' ', 'T')).getTime() : Infinity;

    if (rStart && rEnd && rEnd < rStart) {
      return "Ro'yxatdan o'tish yopilish vaqti boshlanish vaqtidan oldin bo'lishi mumkin emas!";
    }
    if (rEnd && st && rEnd > st) {
      return "Ro'yxatdan o'tish yopilish vaqti olimpiada boshlanish vaqtidan keyin bo'lishi mumkin emas! (Ro'yxatdan o'tish yopilishi <= Test boshlanishi)";
    }
    if (st && end && end <= st) {
      return "Testning tugash vaqti boshlanish vaqtidan keyin bo'lishi shart!";
    }
    return null;
  }, [isAlwaysOpen, registrationStartDate, registrationEndDate, startDate, endDate]);

  
  const [questionsList, setQuestionsList] = useState<Question[]>(() => {
    return olympiad.questions && olympiad.questions.length > 0 ? olympiad.questions : [];
  });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qContent, setQContent] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qPoints, setQPoints] = useState<number>(10);
  const [qImageUrl, setQImageUrl] = useState<string>('');
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string>('A');

  
  const [optionsList, setOptionsList] = useState<{ text: string; img?: string }[]>([
    { text: 'Variant A', img: '' },
    { text: 'Variant B', img: '' },
    { text: 'Variant C', img: '' },
    { text: 'Variant D', img: '' }
  ]);

  const totalQuestionsScore = useMemo(() => {
    return questionsList.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [questionsList]);

  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setQContent('');
    setQType('multiple_choice');
    setQPoints(10);
    setQImageUrl('');
    setQCorrectAnswer('A');
    setOptionsList([
      { text: 'Variant 1', img: '' },
      { text: 'Variant 2', img: '' },
      { text: 'Variant 3', img: '' },
      { text: 'Variant 4', img: '' }
    ]);
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setQContent(q.content);
    setQType(q.type);
    setQPoints(q.points || 10);
    setQImageUrl(q.imageUrl || '');
    setQCorrectAnswer(q.correctAnswer || (q.type === 'multiple_choice' ? 'A' : ''));
    if (q.options && q.options.length > 0) {
      setOptionsList(
        q.options.map((optText, idx) => ({
          text: optText,
          img: q.optionImages?.[idx] || ''
        }))
      );
    } else {
      setOptionsList([
        { text: '', img: '' },
        { text: '', img: '' }
      ]);
    }
    setIsQuestionModalOpen(true);
  };

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) setQImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOptionTextChange = (index: number, val: string) => {
    setOptionsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text: val };
      return copy;
    });
  };

  const handleOptionImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const res = reader.result as string;
        setOptionsList((prev) => {
          const copy = [...prev];
          copy[index] = { ...copy[index], img: res };
          return copy;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveOptionImage = (index: number) => {
    setOptionsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], img: '' };
      return copy;
    });
  };

  const handleAddOption = () => {
    setOptionsList((prev) => [...prev, { text: '', img: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    if (optionsList.length <= 1) return;
    setOptionsList((prev) => prev.filter((_, i) => i !== index));
    const removedLetter = String.fromCharCode(65 + index);
    if (qCorrectAnswer === removedLetter) {
      setQCorrectAnswer('A');
    }
  };

  const handleDocxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedQuestions = await parseDocxQuestions(file, olympiad.id);
      if (importedQuestions.length === 0) {
        alert("⚠️ Fayldan savollar topilmadi. Shablon formatiga mosligini tekshiring!\nMasalan:\n1. Savol matni. [10 ball]\nA) Variant 1\nB) Variant 2*");
        return;
      }

      const updated = [...questionsList, ...importedQuestions];
      setQuestionsList(updated);
      MOCK_QUESTIONS[olympiad.id] = updated;

      alert(`✅ Muvaffaqiyatli: Word fayldan ${importedQuestions.length} ta savol ajratib olindi va qo'shildi!`);
    } catch (err) {
      console.error("Docx import error:", err);
      alert("❌ Faylni o'qishda xatolik yuz berdi. Iltimos, standart .docx fayl ekanligiga ishonch hosil qiling.");
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim()) return;

    const options = qType === 'multiple_choice'
      ? optionsList.map((o) => o.text.trim()).filter((o) => o !== '')
      : undefined;

    const optionImages = qType === 'multiple_choice'
      ? optionsList.map((o) => o.img || '')
      : undefined;

    const questionPayload: Partial<Question> = {
      content: qContent.trim(),
      type: qType,
      points: Number(qPoints) || 10,
      imageUrl: qImageUrl || undefined,
      options,
      optionImages,
      correctAnswer: qCorrectAnswer || undefined
    };

    if (editingQuestion) {
      const updated = questionsList.map((item) =>
        item.id === editingQuestion.id ? { ...item, ...questionPayload } : item
      );
      setQuestionsList(updated);
      MOCK_QUESTIONS[olympiad.id] = updated;
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        olympiadId: olympiad.id,
        roundId: 'r1',
        type: qType,
        content: qContent.trim(),
        points: Number(qPoints) || 10,
        order: questionsList.length + 1,
        imageUrl: qImageUrl || undefined,
        options,
        optionImages,
        correctAnswer: qCorrectAnswer || undefined
      };
      const updated = [...questionsList, newQ];
      setQuestionsList(updated);
      MOCK_QUESTIONS[olympiad.id] = updated;
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (qId: string) => {
    const updated = questionsList.filter((q) => q.id !== qId);
    setQuestionsList(updated);
    MOCK_QUESTIONS[olympiad.id] = updated;
  };

  
  const [selectedStudentForAi, setSelectedStudentForAi] = useState<ParticipantAdminResult | null>(null);

  
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  
  const toggleLanguage = (lang: string) => {
    if (allowedLanguages.includes(lang)) {
      if (allowedLanguages.length === 1) return; 
      setAllowedLanguages(allowedLanguages.filter((l) => l !== lang));
    } else {
      setAllowedLanguages([...allowedLanguages, lang]);
    }
  };

  
  const toggleGrade = (grade: number) => {
    if (targetGrades.includes(grade)) {
      if (targetGrades.length === 1) return;
      setTargetGrades(targetGrades.filter((g) => g !== grade));
    } else {
      setTargetGrades([...targetGrades, grade].sort((a, b) => a - b));
    }
  };

  
  const selectGradePreset = (preset: 'all' | 'primary' | 'middle' | 'high') => {
    if (preset === 'all') setTargetGrades(ALL_GRADES);
    else if (preset === 'primary') setTargetGrades([1, 2, 3, 4]);
    else if (preset === 'middle') setTargetGrades([5, 6, 7, 8, 9]);
    else if (preset === 'high') setTargetGrades([10, 11]);
  };

  
  const togglePaymentMethod = (method: 'naqd' | 'karta' | 'hamyon') => {
    if (isFreeForAll) return;
    if (paymentMethods.includes(method)) {
      if (paymentMethods.length === 1) return;
      setPaymentMethods(paymentMethods.filter((m) => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  
  const getCalculatedPrice = (base: number) => {
    let finalP = base;
    if (discountPercent > 0) {
      finalP = Math.max(0, base - (base * discountPercent) / 100);
    } else if (discountAmount > 0) {
      finalP = Math.max(0, base - discountAmount);
    }
    return finalP;
  };

  
  const participantsList = useMemo(() => {
    return submissionService.getOlympiadAllParticipants(olympiad.id);
  }, [olympiad.id]);

  
  const filteredParticipants = useMemo(() => {
    if (!participantSearchTerm.trim()) return participantsList;
    const q = participantSearchTerm.toLowerCase();
    return participantsList.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.school.toLowerCase().includes(q) ||
        (p.certificateType && p.certificateType.toLowerCase().includes(q))
      );
    });
  }, [participantsList, participantSearchTerm]);

  
  const handleExportResultsExcel = () => {
    const exportData = filteredParticipants.map((p, idx) => ({
      'O\'rin': idx + 1,
      'Ishtirokchi ID': p.id,
      'F.I.Sh.': p.name,
      'Telefon': p.phone,
      'Viloyat / Shahar': p.region,
      'Maktab / Maskon': p.school,
      'Sinf': `${p.grade}-sinf`,
      'To\'g\'ri javoblar': `${p.correctAnswers} / ${p.totalQuestions}`,
      'Natija (%)': `${p.percentage}%`,
      'Sarflangan vaqt (daq)': `${p.timeSpentMinutes} min`,
      'Topshirgan vaqti': p.submittedAt,
      'To\'lov turi': p.paymentType,
      'Diplom / Sertifikat': p.certificateType
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ISHTIROKCHILAR_NATIJALARI');
    XLSX.writeFile(workbook, `${olympiad.id}_Natijalar_Ruyhati.xlsx`);
  };

  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (dateValidationErrorMsg) {
      alert(`⚠️ Xatolik: ${dateValidationErrorMsg}`);
      return;
    }

    MOCK_QUESTIONS[olympiad.id] = questionsList;

    updateOlympiad(olympiad.id, {
      title,
      subject,
      format,
      status,
      location: format === 'offline' ? location : undefined,
      organizer,
      image,
      description,
      showResultsToStudent,
      resultsPublishDate,
      aiAnalysisEnabled: false,
      retakeAllowed,
      maxRetakeAttempts: retakeAllowed ? maxRetakeAttempts : 1,
      allowedLanguages,
      targetGrades,
      paymentMethods: isFreeForAll ? [] : paymentMethods,
      isFreeForAll,
      separatePricesEnabled: isFreeForAll ? false : separatePricesEnabled,
      price: isFreeForAll ? 0 : separatePricesEnabled ? (format === 'online' ? onlinePrice : offlinePrice) : price,
      onlinePrice: isFreeForAll ? 0 : onlinePrice,
      offlinePrice: isFreeForAll ? 0 : offlinePrice,
      discountPercent: isFreeForAll ? 0 : discountPercent,
      discountAmount: isFreeForAll ? 0 : discountAmount,
      isAlwaysOpen,
      registrationStartDate,
      registrationEndDate,
      startDate,
      endDate,
      durationMinutes,
      totalQuestions: questionsList.length,
      questions: questionsList,
      certificateConfig: {
        fontFamily: certFont,
        subjectName: certSubject,
        isMultiRound,
        awardCriteria,
        topRankLimit,
        minScoreLimit,
        winnerText: certWinnerText,
        participantText: certParticipantText,
        round1PassedText: certRound1PassedText,
        round1FailedText: certRound1FailedText,
        signatureName: certSignatureName,
        signatureRole: certSignatureRole
      },
      antiCheatConfig: {
        enabled: antiCheatEnabled,
        blockTabSwitch,
        blockCopyPaste,
        requireFullscreen,
        requireWebcam,
        requireMic,
        blockDevTools,
        maxViolationsAllowed: maxViolations,
        blockDuplicateIP,
        heartbeatIntervalSec,
        cameraFaceSnapshotEnabled,
        snapshotOnMultipleFaces,
        snapshotOnNoFace,
        proctoringMode,
        requireBothEyesVisible,
        strictFaceCheck,
        minFaceConfidence,
        maxAbsenceGracePeriod,
        trackGazeDirection,
        requireVoiceBiometrics,
        detectUnknownSpeakers,
        detectMultipleSpeakers,
        voiceSimilarityThreshold
      }
    });

    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-5 font-sans text-xs">
      
      <div
        className={clsx(
          "p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
          isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={clsx(
              "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-bold",
              isDark
                ? "bg-[#142347] border-[#1E3666] text-slate-200 hover:text-white hover:border-amber-400"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400"
            )}
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{t("Ro'yxatga qaytish")}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
                {title || olympiad.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {olympiad.id}
              </span>
            </div>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Olimpiada ma'lumotlari, tasnif, qamrov, sinflar, narxlar va natija sozlamalarini tahrirlash")}
            </p>
          </div>
        </div>

        
        <div className="flex items-center gap-2">
          {savedSuccessMsg && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("O'zgarishlar saqlandi!")}</span>
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t("Saqlash")}</span>
          </button>
        </div>
      </div>

      
      <div
        className={clsx(
          "flex items-center gap-2 p-1.5 rounded-xl border overflow-x-auto custom-scrollbar transition-colors",
          isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-100 border-slate-200"
        )}
      >
        <button
          onClick={() => setActiveTab('main')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'main'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{t("Asosiy")}</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'questions'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t("Savollar")} ({questionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'pricing'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>{t("Narx & To'lov")}</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'schedule'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{t("Vaqt & Natija")}</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'certificate'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{t("Sertifikat")}</span>
        </button>

        <button
          onClick={() => setActiveTab('anticheat')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'anticheat'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>{t("Anti-Cheat")}</span>
          {cheatLogs.filter(l => l.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'stats'
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t("Ishtirokchilar")}</span>
        </button>
      </div>

      
      {activeTab === 'main' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <div
              className={clsx(
                "lg:col-span-2 p-5 rounded-2xl border space-y-4 transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <h2 className={clsx("text-sm font-bold flex items-center gap-2 border-b pb-2.5", isDark ? "text-white border-[#182A4D]" : "text-slate-900 border-slate-200")}>
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{t("Olimpiada Tasnifi va Nomi")}</span>
              </h2>

              
              <div>
                <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Olimpiada Nomi *")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Respublika Fizika Musobaqasi 2025"
                  className={clsx(
                    "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border font-semibold",
                    isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                  )}
                />
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Qatnashish Rejimi *")}
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-xs outline-none border font-bold",
                      format === 'online' ? "text-blue-400" : "text-purple-400",
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                    )}
                  >
                    <option value="online">🌐 Online (Masofaviy)</option>
                    <option value="offline">📍 Offline (Joyida / Bino)</option>
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Fan *")}
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-xs outline-none border font-bold text-amber-300",
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-amber-600"
                    )}
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Ingliz tili">Ingliz tili</option>
                    <option value="Fizika">Fizika</option>
                    <option value="Biologiya">Biologiya</option>
                    <option value="Informatika">Informatika</option>
                    <option value="Kimyo">Kimyo</option>
                    <option value="Ona tili">Ona tili va Adabiyot</option>
                    <option value="Tarix">Tarix</option>
                    <option value="Geografiya">Geografiya</option>
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Holati")}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-xs outline-none border font-bold",
                      status === 'ochiq' ? "text-emerald-400" : "text-rose-400",
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                    )}
                  >
                    <option value="ochiq">🟢 Ochiq (Ro'yxatdan o'tish faol)</option>
                    <option value="yopiq">🔴 Yopiq (Tugagan / Yopilgan)</option>
                  </select>
                </div>
              </div>

              
              {format === 'offline' && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                  <label className="block text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t("Manzil va Joylashuv (Offline o'tkazilish joyi)")} *</span>
                  </label>
                  <input
                    type="text"
                    required={format === 'offline'}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Masalan: Toshkent shahri, Yunusobod tumani, 1-sonli litsey binosi 3-qavat"
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-white border-slate-300 text-slate-900"
                    )}
                  />
                </div>
              )}

              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tashkilotchi / Kengash")}
                  </label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-xs outline-none border",
                      isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    )}
                  />
                </div>

                
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Muqova Rasm (Banner Image URL / Fayl Upload)")} *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Rasm URL havolasi..."
                      className={clsx(
                        "flex-1 rounded-xl px-3 py-2.5 text-xs outline-none border font-mono text-[11px]",
                        isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                    <label className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>{t("Upload")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              
              <div className="pt-3 border-t border-[#182A4D] space-y-2">
                <label className={clsx("block text-xs font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span>{t("Tillar bo'limi (Mavjud bo'lgan javob tillari)")} *</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  {t("Ishtirokchilar olimpiadani qaysi tillarda topshira olishlarini tanlang (galochka orqali):")}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {ALL_LANGUAGES.map((lang) => {
                    const isChecked = allowedLanguages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left",
                          isChecked
                            ? isDark
                              ? "bg-indigo-600/20 border-indigo-500/60 text-indigo-300 shadow-xs"
                              : "bg-indigo-50 border-indigo-400 text-indigo-700"
                            : isDark
                            ? "bg-[#091024] border-[#16284D] text-slate-400 hover:text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              
              <div className="pt-3 border-t border-[#182A4D] space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className={clsx("block text-xs font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>{t("Mavjud Sinflar (Kimlar qatnasha oladi?)")} *</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      {t("Ushbu olimpiadada qatnashishi mumkin bo'lgan sinflarni belgilang:")}
                    </p>
                  </div>

                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => selectGradePreset('all')}
                      className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold"
                    >
                      Barchasi (1-11)
                    </button>
                    <button
                      type="button"
                      onClick={() => selectGradePreset('primary')}
                      className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold"
                    >
                      1-4 sinflar
                    </button>
                    <button
                      type="button"
                      onClick={() => selectGradePreset('middle')}
                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
                    >
                      5-9 sinflar
                    </button>
                    <button
                      type="button"
                      onClick={() => selectGradePreset('high')}
                      className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold"
                    >
                      10-11 sinflar
                    </button>
                  </div>
                </div>

                
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-1.5 pt-1">
                  {ALL_GRADES.map((grade) => {
                    const isChecked = targetGrades.includes(grade);
                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => toggleGrade(grade)}
                        className={clsx(
                          "py-2 px-1.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                          isChecked
                            ? isDark
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm scale-105"
                              : "bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm scale-105"
                            : isDark
                            ? "bg-[#091024] border-[#16284D] text-slate-400 hover:text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        )}
                      >
                        <span>{grade}-{t("sinf")}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-amber-300 font-semibold mt-1">
                  Tanlangan sinflar: {targetGrades.map((g) => `${g}-sinf`).join(', ')}
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
                <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b pb-2", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  {t("Muqova Rasm va Karta Preview")}
                </h3>

                <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-white/10 group">
                  <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white">
                      {format}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white">
                      {status}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-xs font-bold text-white line-clamp-1">{title || 'Olimpiada Nomi'}</div>
                    <div className="text-[10px] text-amber-300 font-semibold">{subject}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{t("Ruxsat etilgan tillar")}:</span>
                    <span className="font-bold text-indigo-300">{allowedLanguages.length} ta til</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{t("Maqsadli sinflar")}:</span>
                    <span className="font-bold text-amber-300">{targetGrades.length} ta sinf</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{t("Qatnashish Rejimi")}:</span>
                    <span className="font-bold uppercase text-blue-300">{format}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                {t("O'zgarishlarni saqlash")}
              </button>
            </div>
          </div>
        </form>
      )}

      
      {activeTab === 'questions' && (
        <div
          className={clsx(
            "p-5 rounded-2xl border space-y-4 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 border-slate-700/50">
            <div>
              <h2 className={clsx("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>{t("Ushbu Musobaqaga Biriktirilgan Savollar va Ballar")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jami {questionsList.length} ta savol kiritilgan • Umumiy ball summasi: <span className="font-extrabold text-amber-400 font-mono">{totalQuestionsScore} ball</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap">
                <FileText className="w-4 h-4" />
                <span>📄 Word'dan import qilish (.docx)</span>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocxImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={openAddQuestionModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{t("Yangi Savol Qo'shish")}</span>
              </button>
            </div>
          </div>

          {questionsList.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-700 rounded-2xl space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">Hali birorta ham savol qo'shilmagan.</p>
              <button
                onClick={openAddQuestionModal}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Savol Qo'shish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questionsList.map((q, idx) => (
                <div
                  key={q.id}
                  className={clsx(
                    "p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    isDark ? "bg-[#091024] border-[#182A4D] hover:border-amber-500/40" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        #{idx + 1}-savol
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {q.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {q.points || 10} ball
                      </span>
                    </div>

                    <p className={clsx("text-xs font-semibold leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
                      {q.content}
                    </p>

                    
                    {q.imageUrl && (
                      <div className="pt-1">
                        <img
                          src={q.imageUrl}
                          alt="Savol rasmi"
                          className="h-28 rounded-lg object-cover border border-slate-700 bg-slate-900"
                        />
                      </div>
                    )}

                    
                    {q.correctAnswer && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>To'g'ri javob: <span className="font-mono underline">{q.correctAnswer}</span></span>
                      </div>
                    )}

                    
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1.5">
                        {q.options.map((opt, oIdx) => {
                          const optionLetter = String.fromCharCode(65 + oIdx);
                          const isCorrect = q.correctAnswer === optionLetter || q.correctAnswer === opt;
                          const optImg = q.optionImages?.[oIdx];

                          return (
                            <div
                              key={oIdx}
                              className={clsx(
                                "p-2 rounded-lg text-[11px] border flex flex-col justify-between gap-1 transition-all",
                                isCorrect
                                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-xs"
                                  : isDark
                                  ? "bg-[#0D1832] border-[#182A4D] text-slate-300"
                                  : "bg-white border-slate-300 text-slate-700"
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="truncate">
                                  <span className="font-black text-amber-400 mr-1">{optionLetter}:</span>
                                  <span>{opt}</span>
                                </div>
                                {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              </div>

                              {optImg && (
                                <img
                                  src={optImg}
                                  alt={`Option ${optionLetter}`}
                                  className="h-16 w-full object-cover rounded border border-white/10"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditQuestionModal(q)}
                      className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                      title="Tahrirlash"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs cursor-pointer transition-all"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {activeTab === 'pricing' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            <div
              className={clsx(
                "p-5 rounded-2xl border space-y-4 transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <h2 className={clsx("text-sm font-bold flex items-center gap-2 border-b pb-2.5", isDark ? "text-white border-[#182A4D]" : "text-slate-900 border-slate-200")}>
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>{t("To'lov Usullari (Galochka orqali belgilash)")} *</span>
              </h2>

              {isFreeForAll ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t("Olimpiada 100% BEPUL (0 UZS) etib belgilangan. To'lov usullari talab etilmaydi.")}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  {t("Ishtirokchilar ushbu olimpiada uchun qaysi usullarda to'lov qila olishlarini belgilang:")}
                </p>
              )}

              <div className={clsx("space-y-2.5 transition-all", isFreeForAll && "opacity-40 pointer-events-none")}>
                
                <button
                  type="button"
                  disabled={isFreeForAll}
                  onClick={() => togglePaymentMethod('karta')}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    isFreeForAll ? "cursor-not-allowed" : "cursor-pointer",
                    paymentMethods.includes('karta')
                      ? isDark
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-blue-50 border-blue-400 text-blue-800"
                      : isDark
                      ? "bg-[#091024] border-[#16284D] text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div>{t("Karta orqali to'lov (Uzcard, Humo, Visa, Payme, Click)")}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t("Avtomatik onlayn to'lov va darhol aktivlashish")}</div>
                    </div>
                  </div>
                  {paymentMethods.includes('karta') ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>

                
                <button
                  type="button"
                  disabled={isFreeForAll}
                  onClick={() => togglePaymentMethod('hamyon')}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    isFreeForAll ? "cursor-not-allowed" : "cursor-pointer",
                    paymentMethods.includes('hamyon')
                      ? isDark
                        ? "bg-purple-600/20 border-purple-500/60 text-purple-300"
                        : "bg-purple-50 border-purple-400 text-purple-800"
                      : isDark
                      ? "bg-[#091024] border-[#16284D] text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div>{t("Hamyon (NextOlymp Shaxsiy Balansi)")}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t("Foydalanuvchining shaxsiy hamyonidagi mablag'dan yechish")}</div>
                    </div>
                  </div>
                  {paymentMethods.includes('hamyon') ? (
                    <CheckSquare className="w-5 h-5 text-purple-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>

                
                <button
                  type="button"
                  disabled={isFreeForAll}
                  onClick={() => togglePaymentMethod('naqd')}
                  className={clsx(
                    "w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all",
                    isFreeForAll ? "cursor-not-allowed" : "cursor-pointer",
                    paymentMethods.includes('naqd')
                      ? isDark
                        ? "bg-amber-600/20 border-amber-500/60 text-amber-300"
                        : "bg-amber-50 border-amber-400 text-amber-800"
                      : isDark
                      ? "bg-[#091024] border-[#16284D] text-slate-400"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div>{t("Naqd pul to'lovi (Joyida / Kassa orqali)")}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{t("Oflayn bino kassisiga yoki maktabda topshirish")}</div>
                    </div>
                  </div>
                  {paymentMethods.includes('naqd') ? (
                    <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </button>
              </div>

              
              <div className={clsx("pt-3 border-t border-[#182A4D] space-y-3 transition-all", isFreeForAll && "opacity-40 pointer-events-none")}>
                <label className={clsx("block text-xs font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>{t("Paket Egalari Uchun Bepul Qatnashish Imtiyozi")} *</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  {t("Paketlar bo'limidagi qaysi paket obunachilariga ushbu olimpiadada bepul qatnashish imkoniyatini berasiz?")}
                </p>

                <select
                  disabled={isFreeForAll}
                  value={freeForPackageId}
                  onChange={(e) => setFreeForPackageId(e.target.value)}
                  className={clsx(
                    "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border font-bold text-emerald-400",
                    isFreeForAll ? "cursor-not-allowed" : "cursor-pointer",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-emerald-700"
                  )}
                >
                  <option value="none">❌ Imtiyozsiz (Barcha ishtirokchilar to'lov qiladi)</option>
                  <option value="all">🌟 Barcha pullik paket egalari (Standard, Pro, VIP) uchun BEPUL</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      🎁 {pkg.nomi} ({pkg.narxi.toLocaleString()} UZS/oy) obunachilari uchun BEPUL
                    </option>
                  ))}
                </select>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Imtiyoz Holati:</span>
                  </div>
                  <div>
                    {isFreeForAll
                      ? "Olimpiada barcha ishtirokchilar uchun mutlaqo BEPUL qilingan (Paket obunasi talab etilmaydi)."
                      : freeForPackageId === 'none'
                      ? "Hech qaysi paket egalariga bepul berilmagan."
                      : freeForPackageId === 'all'
                      ? "Barcha Standard, Pro va VIP paket sotib olgan foydalanuvchilar to'lov qilmasdan qatnashadi."
                      : `Faqat ${packages.find((p) => p.id === freeForPackageId)?.nomi || freeForPackageId} paketi foydalanuvchilari uchun 100% BEPUL.`}
                  </div>
                </div>
              </div>
            </div>

            
            <div
              className={clsx(
                "p-5 rounded-2xl border space-y-4 transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <h2 className={clsx("text-sm font-bold flex items-center gap-2 border-b pb-2.5", isDark ? "text-white border-[#182A4D]" : "text-slate-900 border-slate-200")}>
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>{t("Narx va Chegirma Sozlamalari")}</span>
              </h2>

              
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-emerald-300" />
                    <span>{t("🌟 Hamma Uchun BEPUL (0 UZS)")}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {t("Ushbu olimpiadada barcha ishtirokchilar to'lov qilmasdan 100% BEPUL qatnashadi")}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isFreeForAll}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsFreeForAll(checked);
                    if (checked) {
                      setPrice(0);
                      setOnlinePrice(0);
                      setOfflinePrice(0);
                      setSeparatePricesEnabled(false);
                      setDiscountPercent(0);
                      setDiscountAmount(0);
                      setPaymentMethods([]);
                    } else {
                      setPrice(35000);
                      setOnlinePrice(35000);
                      setOfflinePrice(50000);
                      setPaymentMethods(['karta', 'hamyon']);
                    }
                  }}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              
              <div className={clsx(
                "p-3 rounded-xl border flex items-center justify-between transition-all",
                isFreeForAll ? "opacity-40 cursor-not-allowed bg-black/10 border-white/5 pointer-events-none" : "bg-black/20 border-white/10"
              )}>
                <div>
                  <div className="text-xs font-bold text-white">{t("Online va Offline narxni alohida belgilash")}</div>
                  <div className="text-[10px] text-slate-400">{t("Onlayn va oflayn qatnashish uchun har xil narx belgilash")}</div>
                </div>
                <input
                  type="checkbox"
                  disabled={isFreeForAll}
                  checked={!isFreeForAll && separatePricesEnabled}
                  onChange={(e) => !isFreeForAll && setSeparatePricesEnabled(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              
              {isFreeForAll ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5">
                  <div className="text-xs font-extrabold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t("Ishtirok Narxi: 0 UZS (100% BEPUL)")}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {t("Ushbu olimpiada barcha qatnashuvchilar uchun mutlaqo bepul qilingan. Pullik narx yoki to'lov talab etilmaydi.")}
                  </p>
                </div>
              ) : !separatePricesEnabled ? (
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Asosiy Ishtirok Narxi (UZS) *")}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={clsx(
                      "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border font-mono font-bold text-amber-400 text-sm",
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-amber-600"
                    )}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-xs font-bold mb-1.5 text-blue-300")}>
                      🌐 {t("Online Narxi (UZS) *")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={onlinePrice}
                      onChange={(e) => setOnlinePrice(Number(e.target.value))}
                      className={clsx(
                        "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-blue-400 text-sm",
                        isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-xs font-bold mb-1.5 text-purple-300")}>
                      📍 {t("Offline Narxi (UZS) *")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={offlinePrice}
                      onChange={(e) => setOfflinePrice(Number(e.target.value))}
                      className={clsx(
                        "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-purple-300 text-sm",
                        isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                      )}
                    />
                  </div>
                </div>
              )}

              
              {!isFreeForAll && (
                <div className="pt-3 border-t border-[#182A4D] space-y-3">
                  <label className={clsx("block text-xs font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                    <Percent className="w-4 h-4 text-rose-400" />
                    <span>{t("Chegirma Qo'shish (Aksiya)")}</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                        {t("Chegirma Foizida (%)")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountPercent}
                        onChange={(e) => {
                          setDiscountPercent(Number(e.target.value));
                          setDiscountAmount(0);
                        }}
                        placeholder="Masalan: 15%"
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-rose-400",
                          isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                        )}
                      />
                    </div>

                    <div>
                      <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                        {t("Yoki Chegirma Summasi (UZS)")}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={discountAmount}
                        onChange={(e) => {
                          setDiscountAmount(Number(e.target.value));
                          setDiscountPercent(0);
                        }}
                        placeholder="Masalan: 5000"
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold text-rose-400",
                          isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center text-xs">
                <div>
                  <div className="text-slate-400 font-semibold">{t("Yakuniy To'lov Summasi")}:</div>
                  <div className="text-[10px] text-slate-500">
                    {isFreeForAll
                      ? t("100% BEPUL ishtirok")
                      : discountPercent > 0
                      ? `${discountPercent}% chegirma qo'llanildi`
                      : discountAmount > 0
                      ? `${discountAmount.toLocaleString()} UZS chegirma qo'llanildi`
                      : 'Chegirmasiz standart narx'}
                  </div>
                </div>
                <div className={clsx("text-base font-black font-mono", isFreeForAll ? "text-emerald-400" : "text-amber-300")}>
                  {isFreeForAll
                    ? "0 UZS (BEPUL)"
                    : `${getCalculatedPrice(separatePricesEnabled ? (format === 'online' ? onlinePrice : offlinePrice) : price).toLocaleString()} UZS`}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  {t("Narxlarni saqlash")}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      
      {activeTab === 'schedule' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div
            className={clsx(
              "p-5 rounded-2xl border space-y-5 transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <h2 className={clsx("text-sm font-bold flex items-center gap-2 border-b pb-2.5", isDark ? "text-white border-[#182A4D]" : "text-slate-900 border-slate-200")}>
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{t("Ro'yxatdan o'tish va Testni Boshlash/Tugash Vaqtlari")}</span>
            </h2>

            
            <div className={clsx(
              "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
              isAlwaysOpen
                ? "bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-emerald-900/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30"
                : isDark ? "bg-[#0B1528] border-[#182A4D]" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-start gap-3">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  isAlwaysOpen ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-700/30 text-slate-400 border border-slate-700/50"
                )}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={clsx("text-sm font-extrabold", isAlwaysOpen ? "text-emerald-300" : isDark ? "text-white" : "text-slate-900")}>
                      {t("Doimiy Ochiq Rejim (24/7 Cheklovsiz Test)")}
                    </h3>
                    <span className={clsx(
                      "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                      isAlwaysOpen
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}>
                      {isAlwaysOpen ? t("Faol (24/7 Ochiq)") : t("O'chirilgan")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {isAlwaysOpen
                      ? t("🟢 Ushbu musobaqa 24/7 doimiy ochiq: ishtirokchilar muddat cheklovlarisiz va ro'yxatdan o'tish sanalarisiz istalgan paytda kirib testlarni yechishlari mumkin.")
                      : t("Yoqilsa, ro'yxatdan o'tish va test boshlanish/tugash vaqti bo'yicha qat'iy cheklovlar bekor qilinadi va test doimiy ochiq bo'ladi.")}
                  </p>
                </div>
              </div>

              
              <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
                <input
                  type="checkbox"
                  checked={isAlwaysOpen}
                  onChange={(e) => setIsAlwaysOpen(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
              </label>
            </div>

            
            {dateValidationErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>⚠️ {dateValidationErrorMsg}</span>
              </div>
            )}

            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1. {t("Ro'yxatdan O'tish Boshlanishi")} {!isAlwaysOpen && '*'}</span>
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(registrationStartDate)}
                  onChange={(e) => setRegistrationStartDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono font-bold text-cyan-400 cursor-pointer",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
                <p className="text-[10px] text-slate-400">
                  {isAlwaysOpen ? t("Doimiy ochiq (Ixtiyoriy)") : t("Foydalanuvchilar qabulining boshlanish sanasi va soati")}
                </p>
              </div>

              
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. {t("Ro'yxatdan O'tish Yopilishi")} {!isAlwaysOpen && '*'}</span>
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(registrationEndDate)}
                  onChange={(e) => setRegistrationEndDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono font-bold text-amber-400 cursor-pointer",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
                <p className="text-[10px] text-slate-400">
                  {isAlwaysOpen ? t("Doimiy ochiq (Ixtiyoriy)") : t("Ro'yxatdan o'tish yopilishi")}
                </p>
              </div>

              
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. {t("Testni Boshlash Vaqti")} {!isAlwaysOpen && '*'}</span>
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(startDate)}
                  onChange={(e) => setStartDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono font-bold text-emerald-400 cursor-pointer",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
                <p className="text-[10px] text-slate-400">
                  {isAlwaysOpen ? t("Doimiy ochiq (Ixtiyoriy)") : t("Olimpiada savollari va test sahifasi ochiladigan vaqt")}
                </p>
              </div>

              
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-rose-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>4. {t("Testni Tugash Vaqti")} {!isAlwaysOpen && '*'}</span>
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(endDate)}
                  onChange={(e) => setEndDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono font-bold text-rose-400 cursor-pointer",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
                <p className="text-[10px] text-slate-400">
                  {isAlwaysOpen ? t("Doimiy ochiq (Ixtiyoriy)") : t("Olimpiada savollari yopilishi")}
                </p>
              </div>
            </div>

            
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-indigo-500/40 space-y-4">
              <h3 className="text-xs font-extrabold text-indigo-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-300" />
                <span>{t("Test Natijasini E'lon Qilish Sozlamalari")}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {showResultsToStudent ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{t("Natijani Darhol Ko'rsatish")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {showResultsToStudent
                        ? t("Test yakunlanishi bilan ball va sertifikat darhol o'quvchiga ko'rsatiladi.")
                        : t("Natijalar test yakunlangach yashirin qoladi va belgilangan rasmiy sanada e'lon qilinadi.")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showResultsToStudent}
                    onChange={(e) => setShowResultsToStudent(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer shrink-0 mt-0.5"
                  />
                </div>

                
                <div className={clsx(
                  "p-3 rounded-xl border space-y-1.5 transition-all",
                  showResultsToStudent
                    ? "bg-black/15 border-white/5 opacity-50 cursor-not-allowed"
                    : "bg-black/30 border-purple-500/40"
                )}>
                  <label className="block text-xs font-bold text-purple-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t("Natijalarni E'lon Qilish Sanasi")}</span>
                    </span>
                    {showResultsToStudent && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        Darhol ochiq
                      </span>
                    )}
                  </label>
                  <input
                    type="datetime-local"
                    disabled={showResultsToStudent}
                    value={toDatetimeInput(resultsPublishDate)}
                    onChange={(e) => setResultsPublishDate(fromDatetimeInput(e.target.value))}
                    className={clsx(
                      "w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border font-mono font-bold transition-all",
                      showResultsToStudent
                        ? "bg-[#091024]/60 border-[#1A2F57]/50 text-slate-500 cursor-not-allowed"
                        : "bg-[#091024] border-[#1A2F57] text-purple-300 cursor-pointer"
                    )}
                  />
                  <p className="text-[10px] text-slate-400">
                    {showResultsToStudent
                      ? t("Natijalar darhol ko'rsatiladi, e'lon sanasini belgilash shart emas.")
                      : t("Ushbu sanada barcha ishtirokchilar reytingi va ballari rasman e'lon qilinadi.")}
                  </p>
                </div>
              </div>
            </div>

            
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
                <h3 className="text-xs font-extrabold text-cyan-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-400" />
                  <span>{t("Qayta Topshirish Sozlamalari (Retake Exam)")}</span>
                </h3>
                <span className={clsx(
                  "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border",
                  retakeAllowed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                )}>
                  {retakeAllowed ? t(`Ruxsat berilgan (${maxRetakeAttempts} ta urinish)`) : t("Ruxsat berilmagan (Faqat 1 marta)")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t("Qayta topshirishga ruxsat")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      {retakeAllowed
                        ? t("O'quvchi natijasini yaxshilash uchun qayta topshira oladi.")
                        : t("Olimpiada faqat bir marta topshiriladi.")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRetakeAllowed(false)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        !retakeAllowed ? "bg-rose-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {t("Yo'q")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRetakeAllowed(true)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        retakeAllowed ? "bg-emerald-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {t("Ha")}
                    </button>
                  </div>
                </div>

                
                {retakeAllowed ? (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                    <label className="block text-xs font-bold text-cyan-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t("Maksimal Urinishlar Soni")}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">{t("Jami urinish")}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={maxRetakeAttempts}
                        onChange={(e) => setMaxRetakeAttempts(Math.max(1, Number(e.target.value)))}
                        className={clsx(
                          "w-24 rounded-lg px-2.5 py-1 text-xs outline-none border font-mono font-bold text-cyan-300",
                          isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900"
                        )}
                      />
                      <span className="text-xs text-slate-300 font-semibold">{t("ta urinish beriladi")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{t("O'quvchi bu sondan oshiq qayta topshira olmaydi.")}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center text-slate-400 text-xs italic">
                    {t("Qayta topshirish o'chirilgan (Har bir o'quvchiga faqat 1 ta urinish)")}
                  </div>
                )}
              </div>
            </div>

            
            <div>
              <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                {t("Batafsil Tavsif va Olimpiada Qoidalari")}
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Olimpiada qoidalari, baholash mezonlari va tartibi..."
                className={clsx(
                  "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border resize-none leading-relaxed",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={Boolean(dateValidationErrorMsg)}
                className={clsx(
                  "px-6 py-2.5 font-black rounded-xl text-xs shadow-md transition-all",
                  dateValidationErrorMsg
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer"
                )}
              >
                {t("Vaqt va AI Sozlamalarini Saqlash")}
              </button>
            </div>
          </div>
        </form>
      )}

      
      {activeTab === 'certificate' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <div
              className={clsx(
                "lg:col-span-5 p-5 rounded-2xl border space-y-4 transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <div className="border-b pb-3 flex items-center justify-between">
                <h2 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{t("Sertifikat Dizayni va Matn Sozlamalari")}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  QR-KODLI
                </span>
              </div>

              
              <div className="space-y-1.5">
                <label className={clsx("block text-xs font-bold flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t("Sertifikat Shrifti (Font)")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cinzel', label: 'Cinzel (Klassik)', style: { fontFamily: "'Cinzel', serif" } },
                    { id: 'playfair', label: 'Playfair', style: { fontFamily: "'Playfair Display', serif" } },
                    { id: 'montserrat', label: 'Montserrat', style: { fontFamily: "'Montserrat', sans-serif" } },
                    { id: 'greatvibes', label: 'Kalligrafiya', style: { fontFamily: "'Great Vibes', cursive" } },
                    { id: 'serif', label: 'Georgia Serif', style: { fontFamily: "Georgia, serif" } },
                    { id: 'sans', label: 'Inter Sans', style: { fontFamily: "'Inter', sans-serif" } },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCertFont(f.id as any)}
                      className={clsx(
                        "p-2 rounded-xl text-center border text-[11px] font-bold transition-all cursor-pointer",
                        certFont === f.id
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : isDark
                          ? "bg-[#091024] border-[#182A4D] text-slate-300 hover:border-amber-400/50"
                          : "bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400"
                      )}
                      style={f.style}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              
              <div className="space-y-1.5">
                <label className={clsx("block text-xs font-bold", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Sertifikatda ko'rsatiladigan Fan nomi")}
                </label>
                <input
                  type="text"
                  value={certSubject}
                  onChange={(e) => setCertSubject(e.target.value)}
                  placeholder="Masalan: Matematika, Fizika, Kimyo..."
                  className={clsx(
                    "w-full rounded-xl px-3 py-2 text-xs outline-none border transition-all",
                    isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  )}
                />
              </div>

              
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t("Olimpiada Bosqichliligi")}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsMultiRound(false); setCertPreviewTab('winner'); }}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                        !isMultiRound ? "bg-blue-600 text-white shadow-xs" : "bg-black/30 text-slate-400 hover:text-white"
                      )}
                    >
                      1 Bosqichli
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsMultiRound(true); setCertPreviewTab('round_passed'); }}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                        isMultiRound ? "bg-purple-600 text-white shadow-xs" : "bg-black/30 text-slate-400 hover:text-white"
                      )}
                    >
                      2 Bosqichli
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {isMultiRound
                    ? "2 bosqichli: 1-bosqichdan o'tganlarga yo'llanma diplomi, o'ta olmaganlarga esa samimiy dalda va minnatdorchilik sertifikati beriladi."
                    : "1 bosqichli: O'rin olgan yoki mezonlarga to'g'ri kelganlarga G'oliblik diplomi, qolgan barcha ishtirokchilarga esa Ishtirokchi sertifikati beriladi."}
                </p>
              </div>

              
              {!isMultiRound && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>{t("G'oliblik Diplomi Berish Mezonlari")}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                      {awardCriteria === 'top_rank' ? `Top ${topRankLimit}-o'ringacha` : awardCriteria === 'min_score' ? `${minScoreLimit}+ ball` : `Top ${topRankLimit} & ${minScoreLimit}+ ball`}
                    </span>
                  </div>

                  
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setAwardCriteria('top_rank')}
                      className={clsx(
                        "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                        awardCriteria === 'top_rank'
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-300 hover:text-white"
                      )}
                    >
                      🏆 Top N O'rin
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwardCriteria('min_score')}
                      className={clsx(
                        "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                        awardCriteria === 'min_score'
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-300 hover:text-white"
                      )}
                    >
                      🎯 Belgilangan Ball
                    </button>
                    <button
                      type="button"
                      onClick={() => setAwardCriteria('both')}
                      className={clsx(
                        "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                        awardCriteria === 'both'
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-300 hover:text-white"
                      )}
                    >
                      ✨ Ikkalasi Ham
                    </button>
                  </div>

                  
                  {(awardCriteria === 'top_rank' || awardCriteria === 'both') && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          {t("Diplom beriladigan O'rinlar Chegarasi (Top N):")}
                        </label>
                        <div className="flex items-center gap-1">
                          {[5, 10, 20, 30, 50].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setTopRankLimit(preset)}
                              className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer",
                                topRankLimit === preset
                                  ? "bg-amber-400 text-slate-950 font-black"
                                  : "bg-white/5 text-slate-400 hover:text-white"
                              )}
                            >
                              Top {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={topRankLimit}
                          onChange={(e) => setTopRankLimit(Math.max(1, Number(e.target.value) || 1))}
                          className={clsx(
                            "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold",
                            isDark ? "bg-[#091024] border-[#182A4D] text-amber-300" : "bg-slate-50 border-slate-300 text-slate-900"
                          )}
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">o'ringacha</span>
                      </div>
                    </div>
                  )}

                  
                  {(awardCriteria === 'min_score' || awardCriteria === 'both') && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          {t("Diplom uchun Minimal Talab Qilinadigan Ball:")}
                        </label>
                        <div className="flex items-center gap-1">
                          {[60, 70, 80, 85, 90].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => setMinScoreLimit(score)}
                              className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer",
                                minScoreLimit === score
                                  ? "bg-amber-400 text-slate-950 font-black"
                                  : "bg-white/5 text-slate-400 hover:text-white"
                              )}
                            >
                              {score}+
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={minScoreLimit}
                          onChange={(e) => setMinScoreLimit(Number(e.target.value) || 0)}
                          className={clsx(
                            "w-full rounded-xl px-3 py-2 text-xs outline-none border font-mono font-bold",
                            isDark ? "bg-[#091024] border-[#182A4D] text-amber-300" : "bg-slate-50 border-slate-300 text-slate-900"
                          )}
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap">balldan yuqori</span>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    💡 Qoida: 1-{topRankLimit}-o'rinni olganlarga (yoki {minScoreLimit}+ ball to'plaganlarga) o'rni va natijasi yozilgan maxsus Diplom beriladi. Qolgan barcha qatnashuvchilarga esa "Muvaffaqiyatli ishtirok uchun" sertifikati beriladi.
                  </p>
                </div>
              )}

              
              <div className="space-y-3 pt-1">
                {!isMultiRound ? (
                  <>
                    
                    <div className="space-y-1">
                      <label className={clsx("block text-xs font-bold text-amber-400")}>
                        {t("O'rin olganlar (G'oliblar) uchun matn")}
                      </label>
                      <textarea
                        rows={3}
                        value={certWinnerText}
                        onChange={(e) => setCertWinnerText(e.target.value)}
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none leading-relaxed",
                          isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <p className="text-[9px] text-slate-400">Teglar: <code>{'{name}'}</code>, <code>{'{olympiad}'}</code>, <code>{'{rank}'}</code>, <code>{'{score}'}</code></p>
                    </div>

                    
                    <div className="space-y-1">
                      <label className={clsx("block text-xs font-bold text-blue-400")}>
                        {t("Qolgan ishtirokchilar uchun minnatdorchilik matni")}
                      </label>
                      <textarea
                        rows={3}
                        value={certParticipantText}
                        onChange={(e) => setCertParticipantText(e.target.value)}
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none leading-relaxed",
                          isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <p className="text-[9px] text-slate-400">Teglar: <code>{'{name}'}</code>, <code>{'{olympiad}'}</code>, <code>{'{score}'}</code></p>
                    </div>
                  </>
                ) : (
                  <>
                    
                    <div className="space-y-1">
                      <label className={clsx("block text-xs font-bold text-emerald-400")}>
                        {t("1-bosqichdan o'tgan o'quvchilar uchun matn")}
                      </label>
                      <textarea
                        rows={3}
                        value={certRound1PassedText}
                        onChange={(e) => setCertRound1PassedText(e.target.value)}
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none leading-relaxed",
                          isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <p className="text-[9px] text-slate-400">Teglar: <code>{'{name}'}</code>, <code>{'{olympiad}'}</code>, <code>{'{score}'}</code></p>
                    </div>

                    
                    <div className="space-y-1">
                      <label className={clsx("block text-xs font-bold text-indigo-400")}>
                        {t("1-bosqichdan o'ta olmaganlar uchun samimiy dalda matni")}
                      </label>
                      <textarea
                        rows={3}
                        value={certRound1FailedText}
                        onChange={(e) => setCertRound1FailedText(e.target.value)}
                        className={clsx(
                          "w-full rounded-xl px-3 py-2 text-xs outline-none border resize-none leading-relaxed",
                          isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <p className="text-[9px] text-slate-400">Teglar: <code>{'{name}'}</code>, <code>{'{olympiad}'}</code>, <code>{'{score}'}</code></p>
                    </div>
                  </>
                )}

                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">{t("Imzo Egasi / Kengash")}</label>
                    <input
                      type="text"
                      value={certSignatureName}
                      onChange={(e) => setCertSignatureName(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border",
                        isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">{t("Lavozimi")}</label>
                    <input
                      type="text"
                      value={certSignatureRole}
                      onChange={(e) => setCertSignatureRole(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-2.5 py-1.5 text-xs outline-none border",
                        isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{t("Sertifikat Sozlamalarini Saqlash")}</span>
                  </button>
                </div>
              </div>
            </div>

            
            <div
              className={clsx(
                "lg:col-span-7 p-5 rounded-2xl border space-y-4 transition-colors flex flex-col justify-between",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <h3 className={clsx("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {t("Jonli Ko'rinish (Live Certificate Preview)")}
                    </h3>
                  </div>

                  
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {!isMultiRound ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setCertPreviewTab('winner')}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                            certPreviewTab === 'winner'
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : isDark
                              ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          🥇 G'olib (1-o'rin)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertPreviewTab('participant')}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                            certPreviewTab === 'participant'
                              ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                              : isDark
                              ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          📜 Ishtirokchi
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setCertPreviewTab('round_passed')}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                            certPreviewTab === 'round_passed'
                              ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                              : isDark
                              ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          ✅ 1-bosqichdan o'tgan
                        </button>
                        <button
                          type="button"
                          onClick={() => setCertPreviewTab('round_failed')}
                          className={clsx(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                            certPreviewTab === 'round_failed'
                              ? "bg-indigo-500 text-white font-black shadow-xs"
                              : isDark
                              ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          🤝 Dalda / Ishtirok
                        </button>
                      </>
                    )}
                  </div>
                </div>

                
                <div className="max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-amber-400/40">
                  <CertificateCanvas
                    certificate={{
                      id: 'PREV-001',
                      userId: 'STU-901',
                      userName: 'Xoliqov Azizbek Olimovich',
                      olympiadId: olympiad.id,
                      olympiadTitle: title,
                      subject: certSubject || subject,
                      type: certPreviewTab,
                      issuedAt: new Date().toISOString(),
                      verificationCode: 'NO-8921',
                      score: certPreviewTab === 'winner' ? 96.7 : certPreviewTab === 'round_passed' ? 88.5 : certPreviewTab === 'round_failed' ? 54.0 : 78.0,
                      maxScore: 100,
                      rank: certPreviewTab === 'winner' ? 1 : 0,
                      totalParticipants: 420,
                      fontFamily: certFont
                    }}
                    config={{
                      fontFamily: certFont,
                      subjectName: certSubject || subject,
                      isMultiRound,
                      winnerText: certWinnerText,
                      participantText: certParticipantText,
                      round1PassedText: certRound1PassedText,
                      round1FailedText: certRound1FailedText,
                      signatureName: certSignatureName,
                      signatureRole: certSignatureRole
                    }}
                  />
                </div>
              </div>

              
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-slate-300 flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    QR-kod skaner qilinganda avtomatik <strong>/verify-certificate/:code</strong> sahifasida rasmiy tasdiqlanadi.
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold whitespace-nowrap">
                  PDF EXPORT READY
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'anticheat' && (
        <div className="space-y-5">
          
          <div
            className={clsx(
              "p-5 rounded-2xl border space-y-4 transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>{t("Anti-Cheat Nazorat Sozlamalari (Aktivlashtirish)")}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t("Ushbu olimpiada davomida qatnashchilarning nohalol harakatlarini cheklash va monitoring qilish")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-white">
                    {antiCheatEnabled ? "Tizim Yoqilgan" : "Tizim O'chirilgan"}
                  </span>
                  <input
                    type="checkbox"
                    checked={antiCheatEnabled}
                    onChange={(e) => setAntiCheatEnabled(e.target.checked)}
                    className="w-5 h-5 accent-rose-500 cursor-pointer"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all"
                >
                  {t("Saqlash")}
                </button>
              </div>
            </div>

            
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {t("AI Proktoring Qat'iylik Rejimlari (Preset Modes & AI Config)")}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-indigo-300 font-semibold">
                  Google MediaPipe Face Mesh Engine (478 Landmarks)
                </span>
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                
                <button
                  type="button"
                  onClick={() => handlePresetSelect('STRICT')}
                  className={clsx(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden",
                    proctoringMode === 'STRICT'
                      ? "bg-rose-500/20 border-rose-500 text-white shadow-lg ring-1 ring-rose-500"
                      : "bg-black/30 border-white/10 text-slate-300 hover:border-rose-500/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      QAT'IY (Strict)
                    </span>
                    {proctoringMode === 'STRICT' && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[9px] font-black text-white">Faol</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Ikkala ko'z, burun, og'iz to'liq ochiq bo'lishi shart. Grace period <strong>1.5s</strong>. Nigoh va chetga qarash qat'iy nazoratda.
                  </p>
                  <div className="text-[9px] font-mono text-rose-300 font-bold mt-1">
                    Chegara: 3 ta ogohlantirish
                  </div>
                </button>

                
                <button
                  type="button"
                  onClick={() => handlePresetSelect('STANDARD')}
                  className={clsx(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden",
                    proctoringMode === 'STANDARD'
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500"
                      : "bg-black/30 border-white/10 text-slate-300 hover:border-amber-500/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      O'RTACHA (Standard)
                    </span>
                    {proctoringMode === 'STANDARD' && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-black text-slate-950">Faol</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Yuz va ko'zlar mavjudligi tekshiriladi. Grace period <strong>3.0s</strong>. Muntazam tekshiruv va me'yoriy nazorat.
                  </p>
                  <div className="text-[9px] font-mono text-amber-300 font-bold mt-1">
                    Chegara: 4 ta ogohlantirish
                  </div>
                </button>

                
                <button
                  type="button"
                  onClick={() => handlePresetSelect('RELAXED')}
                  className={clsx(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden",
                    proctoringMode === 'RELAXED'
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500"
                      : "bg-black/30 border-white/10 text-slate-300 hover:border-emerald-500/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      YUMSHOQ (Relaxed)
                    </span>
                    {proctoringMode === 'RELAXED' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[9px] font-black text-slate-950">Faol</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Faqat umumiy yuz mavjudligi tekshiriladi. Qisqa vaqt yopishga ruxsat. Grace period <strong>5.0s</strong>.
                  </p>
                  <div className="text-[9px] font-mono text-emerald-300 font-bold mt-1">
                    Chegara: 5 ta ogohlantirish
                  </div>
                </button>

                
                <button
                  type="button"
                  onClick={() => setProctoringMode('DISABLED')}
                  className={clsx(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden",
                    proctoringMode === 'DISABLED'
                      ? "bg-slate-500/20 border-slate-400 text-white shadow-lg ring-1 ring-slate-400"
                      : "bg-black/30 border-white/10 text-slate-300 hover:border-slate-500/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      O'CHIRILGAN (Off)
                    </span>
                    {proctoringMode === 'DISABLED' && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-400 text-[9px] font-black text-slate-950">Faol</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Yuz AI tahlili to'liq o'chiriladi. Faqat brauzer va tab cheklovlari ishlaydi.
                  </p>
                  <div className="text-[9px] font-mono text-slate-400 font-bold mt-1">
                    Yuz tekshiruvi yo'q
                  </div>
                </button>
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20">
                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Ikkala ko'z to'liq ko'rinishi shart (Both Eyes)</div>
                    <div className="text-[10px] text-slate-400">Ko'z to'silganda darhol jarima berish</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireBothEyesVisible}
                    onChange={(e) => setRequireBothEyesVisible(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Yuz nuqtalari to'liqligi (Landmarks Mesh)</div>
                    <div className="text-[10px] text-slate-400">Burun, iyak, peshona ochiqligini tekshirish</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictFaceCheck}
                    onChange={(e) => setStrictFaceCheck(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Nigoh va chetga qarash nazorati (Gaze Track)</div>
                    <div className="text-[10px] text-slate-400">Monitordan chetga burilishni aniqlash</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={trackGazeDirection}
                    onChange={(e) => setTrackGazeDirection(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-1.5">
                  <div className="text-xs font-bold text-white">Kutish vaqti (Grace Period):</div>
                  <select
                    value={maxAbsenceGracePeriod}
                    onChange={(e) => setMaxAbsenceGracePeriod(Number(e.target.value))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-300 outline-none cursor-pointer"
                  >
                    <option value={1.0}>1.0 soniya (Ultra qat'iy)</option>
                    <option value={1.5}>1.5 soniya (Standart qat'iy)</option>
                    <option value={2.0}>2.0 soniya</option>
                    <option value={3.0}>3.0 soniya (O'rtacha)</option>
                    <option value={5.0}>5.0 soniya (Yumshoq)</option>
                  </select>
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-1.5">
                  <div className="text-xs font-bold text-white">Minimal ishonchlilik (Confidence):</div>
                  <select
                    value={minFaceConfidence}
                    onChange={(e) => setMinFaceConfidence(Number(e.target.value))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs font-mono font-bold text-indigo-300 outline-none cursor-pointer"
                  >
                    <option value={0.50}>50% (Past yorug'likda ham sezgir)</option>
                    <option value={0.65}>65% (Optimal - Tavsiya etiladi)</option>
                    <option value={0.75}>75% (Yuqori aniqlik)</option>
                    <option value={0.85}>85% (Maksimal qat'iy)</option>
                  </select>
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-1.5">
                  <div className="text-xs font-bold text-white">Ruxsat etilgan ogohlantirishlar chegarasi:</div>
                  <select
                    value={maxViolations}
                    onChange={(e) => setMaxViolations(Number(e.target.value))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs font-mono font-bold text-rose-400 outline-none cursor-pointer"
                  >
                    <option value={1}>1 marta (Darhol diskvalifikatsiya)</option>
                    <option value={2}>2 marta</option>
                    <option value={3}>3 marta (Standart)</option>
                    <option value={5}>5 marta (Yumshoq)</option>
                    <option value={10}>10 marta</option>
                  </select>
                </div>
              </div>
            </div>

            
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {t("Audio AI Proktoring & Ovoz Biometriyasi (Voiceprint & Diarization)")}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                  Acoustic Spectral Embedding (Cosine Similarity & Multi-Speaker Detection)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AudioLines className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t("Ovozli Biometriya (Voiceprint)")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Imtihondan oldin 4 soniyalik ovoz namunasi olinadi.</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!antiCheatEnabled}
                    checked={requireVoiceBiometrics}
                    onChange={(e) => setRequireVoiceBiometrics(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer shrink-0 mt-0.5"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t("Begona Shaxs Ovozini Tutish")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Yordamchi yoki begona ovoz gapirganda ogohlantirish.</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!antiCheatEnabled}
                    checked={detectUnknownSpeakers}
                    onChange={(e) => setDetectUnknownSpeakers(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 cursor-pointer shrink-0 mt-0.5"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t("Ko'p Ovoz / Pichirlash Nazorati")}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Fon suhbatlari va pichirlashlarni ajratish (Diarization).</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!antiCheatEnabled}
                    checked={detectMultipleSpeakers}
                    onChange={(e) => setDetectMultipleSpeakers(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0 mt-0.5"
                  />
                </div>

                
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between gap-1.5">
                  <div className="text-xs font-bold text-white">Ovoz o'xshashlik chegarasi:</div>
                  <select
                    disabled={!antiCheatEnabled}
                    value={voiceSimilarityThreshold}
                    onChange={(e) => setVoiceSimilarityThreshold(Number(e.target.value))}
                    className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 outline-none cursor-pointer"
                  >
                    <option value={0.65}>65% (Keng / Shovqinli xonalar uchun)</option>
                    <option value={0.70}>70% (Standart tavsiya etiladi)</option>
                    <option value={0.75}>75% (Yuqori aniqlik)</option>
                    <option value={0.80}>80% (Ultra qat'iy)</option>
                  </select>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t("1 ta IP - 1 ta Ishtirokchi (Single IP)")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bitta IP manzildan 2-kishi olimpiadaga kirishini qat'iy taqiqlash va dublikat ulanishni bloklash.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled={!antiCheatEnabled}
                  checked={blockDuplicateIP}
                  onChange={(e) => setBlockDuplicateIP(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t("Oflayn Nazorat (Heartbeat Ping)")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Internet uzilishi va oflayn qolishini muntazam tekshirib turish.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-300 font-semibold">Tekshirish oraliq vaqti:</span>
                  <select
                    disabled={!antiCheatEnabled}
                    value={heartbeatIntervalSec}
                    onChange={(e) => setHeartbeatIntervalSec(Number(e.target.value))}
                    className={clsx(
                      "px-2 py-0.5 rounded text-[11px] font-mono font-bold outline-none border cursor-pointer",
                      isDark ? "bg-[#091024] border-[#182A4D] text-emerald-300" : "bg-white border-slate-300 text-slate-900"
                    )}
                  >
                    <option value={0.1}>Har 0.1 soniyada (100 ms - Ultra tezkor)</option>
                    <option value={0.5}>Har 0.5 soniyada (500 ms - Tezkor)</option>
                    <option value={1}>Har 1 soniyada (1000 ms - Standart)</option>
                    <option value={2}>Har 2 soniyada</option>
                    <option value={5}>Har 5 soniyada</option>
                    <option value={10}>Har 10 soniyada</option>
                  </select>
                </div>
              </div>

              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>{t("Kamera Yuz Snapshot Nazorati")}</span>
                    </span>
                    <input
                      type="checkbox"
                      disabled={!antiCheatEnabled}
                      checked={cameraFaceSnapshotEnabled}
                      onChange={(e) => setCameraFaceSnapshotEnabled(e.target.checked)}
                      className="w-4 h-4 accent-purple-500 cursor-pointer shrink-0"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kamera orqali yuzni kuzatish; nojo'ya holatda darhol ogohlantirib, o'sha lahzadagi rasmni admin panelga yuborish.
                  </p>
                </div>

                <div className="space-y-1 pt-1 border-t border-white/5">
                  <label className="flex items-center justify-between text-[10px] text-slate-300 cursor-pointer">
                    <span>👥 2 ta yuz aniqlansa rasm olish</span>
                    <input
                      type="checkbox"
                      disabled={!antiCheatEnabled || !cameraFaceSnapshotEnabled}
                      checked={snapshotOnMultipleFaces}
                      onChange={(e) => setSnapshotOnMultipleFaces(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[10px] text-slate-300 cursor-pointer">
                    <span>👤❌ Yuz ko'rinmay qolsa rasm olish</span>
                    <input
                      type="checkbox"
                      disabled={!antiCheatEnabled || !cameraFaceSnapshotEnabled}
                      checked={snapshotOnNoFace}
                      onChange={(e) => setSnapshotOnNoFace(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                  </label>
                </div>
              </div>

              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t("Tab Almashtirishni Bloklash")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Boshqa brauzer oynasiga yoki ilovalarga o'tishni qayd etadi.</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!antiCheatEnabled}
                  checked={blockTabSwitch}
                  onChange={(e) => setBlockTabSwitch(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t("Nusxa Ko'chirishni Cheklash")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Savollarni nusxalash (Ctrl+C, sichqoncha o'ng tugmasi) taqiqlanadi.</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!antiCheatEnabled}
                  checked={blockCopyPaste}
                  onChange={(e) => setBlockCopyPaste(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t("Fullscreen & DevTools Blok")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Majburiy to'liq ekran va F12 / Dasturchi vositalarini bloklash.</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!antiCheatEnabled}
                  checked={requireFullscreen && blockDevTools}
                  onChange={(e) => {
                    setRequireFullscreen(e.target.checked);
                    setBlockDevTools(e.target.checked);
                  }}
                  className="w-4 h-4 accent-blue-500 cursor-pointer shrink-0 mt-0.5"
                />
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-5 rounded-2xl border space-y-4 transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{t("Qayd etilgan Qoidabuzarliklar & Kamera Snapshotlari")}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t("Bitta IP dan kirish, 2 ta yuz va oflayn holatlar bo'yicha tushirilgan suratli hisobotlar")}
                </p>
              </div>

              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCheatFilter('all')}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    cheatFilter === 'all' ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  Barchasi ({cheatLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCheatFilter('pending')}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    cheatFilter === 'pending' ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  Kutilayotganlar ({cheatLogs.filter(l => l.status === 'pending').length})
                </button>
              </div>
            </div>

            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead
                  className={clsx(
                    "text-[11px] uppercase tracking-wider border-b font-semibold whitespace-nowrap",
                    isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <tr>
                    <th className="py-2.5 px-3">Ishtirokchi</th>
                    <th className="py-2.5 px-3">IP Manzil & Aloqa</th>
                    <th className="py-2.5 px-3">Qoidabuzarlik</th>
                    <th className="py-2.5 px-3">Kamera Rasmi</th>
                    <th className="py-2.5 px-3 text-center">Soni</th>
                    <th className="py-2.5 px-3">Daraja</th>
                    <th className="py-2.5 px-3">Holati</th>
                    <th className="py-2.5 px-3 text-right">Admin Harakati</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {cheatLogs
                    .filter(l => cheatFilter === 'all' ? true : l.status === 'pending')
                    .map((log) => (
                      <tr key={log.id} className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{log.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.studentId} · {log.school}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-slate-300 font-semibold">{log.ipAddress || '192.168.1.1'}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={clsx("w-2 h-2 rounded-full", log.isOnline !== false ? "bg-emerald-400 animate-pulse" : "bg-rose-500")} />
                            <span className="text-[10px] text-slate-400">{log.isOnline !== false ? "Online (Ping OK)" : "Oflayn bo'lgan"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-amber-300">{log.type}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{log.detail}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.timestamp}</div>
                        </td>
                        <td className="py-3 px-3">
                          {log.snapshotUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSnapshotLog(log)}
                              className="group relative block w-14 h-10 rounded-lg overflow-hidden border border-purple-400/40 hover:border-purple-400 shadow-xs cursor-pointer"
                              title="Kamera suratini ko'rish"
                            >
                              <img src={log.snapshotUrl} alt="Webcam" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Mavjud emas</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-rose-400 text-sm">
                          {log.count}x
                        </td>
                        <td className="py-3 px-3">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            log.severity === 'Kritik' ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          )}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            log.status === 'pending' ? "bg-yellow-500/20 text-yellow-300" :
                            log.status === 'warned' ? "bg-orange-500/20 text-orange-300" :
                            log.status === 'penalized' ? "bg-rose-500/20 text-rose-300" :
                            log.status === 'disqualified' ? "bg-red-900/40 text-red-400 font-black border border-red-500/50" :
                            "bg-slate-500/20 text-slate-400"
                          )}>
                            {log.status === 'pending' ? 'Kutilmoqda' :
                             log.status === 'warned' ? 'Ogohlantirildi' :
                             log.status === 'penalized' ? 'Jarima qo\'llandi' :
                             log.status === 'disqualified' ? 'Diskvalifikatsiya' : 'Oqlandi'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCheatAction(log.id, 'warned')}
                                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                                  title="Ogohlantirish yuborish"
                                >
                                  Ogohlantirish
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCheatAction(log.id, 'disqualified')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Diskvalifikatsiya qilish"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Chetlatish</span>
                                </button>
                              </>
                            )}
                            {log.status !== 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleCheatAction(log.id, 'pending')}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Qayta ko'rish
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          
          {selectedSnapshotLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div
                className={clsx(
                  "w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden space-y-4 p-5",
                  isDark ? "bg-[#0D1832] border-[#1E3666]" : "bg-white border-slate-300"
                )}
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Veb-Kamera Snapshot Rasmi</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Qoidabuzarlik vaqti: {selectedSnapshotLog.timestamp}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSnapshotLog(null)}
                    className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-black aspect-video flex items-center justify-center">
                  <img
                    src={selectedSnapshotLog.snapshotUrl}
                    alt="Webcam Snapshot"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {selectedSnapshotLog.type}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded">
                    IP: {selectedSnapshotLog.ipAddress}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">O'quvchi:</span>
                    <span className="font-bold text-white">{selectedSnapshotLog.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maktab / ID:</span>
                    <span className="text-slate-200 font-mono">{selectedSnapshotLog.school} ({selectedSnapshotLog.studentId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Qoidabuzarlik tafsiloti:</span>
                    <span className="text-amber-300 font-medium">{selectedSnapshotLog.detail}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      handleCheatAction(selectedSnapshotLog.id, 'warned');
                      setSelectedSnapshotLog(null);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition-all"
                  >
                    Ogohlantirish yuborish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleCheatAction(selectedSnapshotLog.id, 'disqualified');
                      setSelectedSnapshotLog(null);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                  >
                    Diskvalifikatsiya qilish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      
      {activeTab === 'stats' && (() => {
        const rawParticipants = submissionService.getOlympiadSubmissions(olympiad.id);
        
        const filteredParticipants = rawParticipants.filter((p) => {
          const matchesTerm =
            !participantSearchTerm ||
            p.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
            p.phone.includes(participantSearchTerm) ||
            p.id.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
            p.region.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
            p.school.toLowerCase().includes(participantSearchTerm.toLowerCase());

          if (!matchesTerm) return false;

          if (participantFilterTab === 'submitted') {
            return p.status === 'completed' || (p.score !== undefined && p.score > 0) || Boolean(p.submittedAt);
          }
          if (participantFilterTab === 'paid') {
            return p.paymentType && !p.paymentType.includes('Bepul');
          }
          if (participantFilterTab === 'registered') {
            return true; 
          }
          return true;
        });

        const registeredCountDisplay = Math.max(olympiad.registeredCount || 0, rawParticipants.length);
        const submittedCountDisplay = rawParticipants.filter(p => p.status === 'completed' || (p.score !== undefined && p.score > 0)).length;

        return (
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setParticipantFilterTab(participantFilterTab === 'registered' ? 'all' : 'registered')}
                className={clsx(
                  "p-4 rounded-2xl border text-center transition-all cursor-pointer text-left w-full",
                  participantFilterTab === 'registered'
                    ? "bg-blue-500/25 border-blue-400 ring-2 ring-blue-400/50 shadow-lg"
                    : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15"
                )}
              >
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("Ro'yxatdan O'tganlar")}</div>
                <div className="text-xl font-black text-blue-400 font-mono mt-1">{registeredCountDisplay.toLocaleString()} {t("kishi")}</div>
                <div className="text-[10px] text-blue-300 font-medium mt-0.5">Filtr: {participantFilterTab === 'registered' ? "Faol 🟢" : "Bosish"}</div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterTab(participantFilterTab === 'submitted' ? 'all' : 'submitted')}
                className={clsx(
                  "p-4 rounded-2xl border text-center transition-all cursor-pointer text-left w-full",
                  participantFilterTab === 'submitted'
                    ? "bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg"
                    : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                )}
              >
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("Topshirganlar")}</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">{submittedCountDisplay.toLocaleString()} {t("kishi")}</div>
                <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Filtr: {participantFilterTab === 'submitted' ? "Faol 🟢" : "Bosish"}</div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterTab(participantFilterTab === 'paid' ? 'all' : 'paid')}
                className={clsx(
                  "p-4 rounded-2xl border text-center transition-all cursor-pointer text-left w-full",
                  participantFilterTab === 'paid'
                    ? "bg-purple-500/25 border-purple-400 ring-2 ring-purple-400/50 shadow-lg"
                    : "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15"
                )}
              >
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("To'lov Qilganlar")}</div>
                <div className="text-xl font-black text-purple-300 font-mono mt-1">{olympiad.paidCount.toLocaleString()} {t("kishi")}</div>
                <div className="text-[10px] text-purple-300 font-medium mt-0.5">Filtr: {participantFilterTab === 'paid' ? "Faol 🟢" : "Bosish"}</div>
              </button>

              <button
                type="button"
                onClick={() => setParticipantFilterTab('all')}
                className={clsx(
                  "p-4 rounded-2xl border text-center transition-all cursor-pointer text-left w-full",
                  participantFilterTab === 'all'
                    ? "bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/50 shadow-lg"
                    : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
                )}
              >
                <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("Jami Tushum")}</div>
                <div className="text-lg font-black text-amber-300 font-mono mt-1">{olympiad.totalRevenue.toLocaleString()} UZS</div>
                <div className="text-[10px] text-amber-300 font-medium mt-0.5">Barchasini ko'rsatish</div>
              </button>
            </div>

            
            {participantFilterTab !== 'all' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                <span className="font-semibold">
                  📌 Hozirda tanlangan filtr: <strong className="text-white uppercase">{participantFilterTab === 'registered' ? 'Ro\'yxatdan o\'tganlar' : participantFilterTab === 'submitted' ? 'Imtihonni topshirganlar' : 'To\'lov qilganlar'}</strong> ({filteredParticipants.length} ta ishtirokchi)
                </span>
                <button
                  type="button"
                  onClick={() => setParticipantFilterTab('all')}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  Filtrni bekor qilish ✕
                </button>
              </div>
            )}

            
            <div
              className={clsx(
                "p-5 rounded-2xl border space-y-4 transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>{t("Ishtirokchilar Natijalari")}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t("Har bir o'quvchining to'g'ri javoblari, to'plagan balli va natijasi (Admin e'lon qilinmagan natijalarni ham ko'ra oladi)")}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ishtirokchi nomi bo'yicha..."
                      value={participantSearchTerm}
                      onChange={(e) => setParticipantSearchTerm(e.target.value)}
                      className={clsx(
                        "w-full rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none border transition-all",
                        isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>

                  <button
                    onClick={handleExportResultsExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{t("Excel'da yuklash")}</span>
                  </button>
                </div>
              </div>

              
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead
                    className={clsx(
                      "text-[11px] uppercase tracking-wider border-b font-semibold whitespace-nowrap",
                      isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">№</th>
                      <th className="py-2.5 px-3">{t("Ishtirokchi (F.I.Sh.)")}</th>
                      <th className="py-2.5 px-3">{t("Hudud / Maktab")}</th>
                      <th className="py-2.5 px-3">{t("Sinf")}</th>
                      <th className="py-2.5 px-3">{t("Nechta Topgan (To'g'ri / Jami)")}</th>
                      <th className="py-2.5 px-3">{t("Natija (%)")}</th>
                      <th className="py-2.5 px-3">{t("To'lov Maqomi")}</th>
                      <th className="py-2.5 px-3 text-right">{t("Admin Natija Preview")}</th>
                    </tr>
                  </thead>
                  <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {t("Ishtirokchilar topilmadi")}
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p, idx) => (
                        <tr key={p.id} className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}>
                          
                          <td className="py-3 px-3 text-center font-bold text-xs whitespace-nowrap">
                            {idx === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">1 🥇</span>
                            ) : idx === 1 ? (
                              <span className="px-2 py-0.5 rounded bg-slate-300 text-slate-950 font-black">2 🥈</span>
                            ) : idx === 2 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-black">3 🥉</span>
                            ) : (
                              <span className="text-slate-400 font-mono">{idx + 1}</span>
                            )}
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-white text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.phone} · {p.id}</div>
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-300">{p.region}</div>
                            <div className="text-[10px] text-slate-400">{p.school}</div>
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {p.grade}-sinf
                            </span>
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-emerald-400 text-sm">
                            {p.correctAnswers || 0} / {p.totalQuestions || 25} <span className="text-[10px] text-slate-400 font-normal">ta to'g'ri</span>
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-cyan-400 text-xs">
                            {p.percentage || 0}%
                          </td>

                          
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              isFreeForAll || price === 0 || (p.paymentType && p.paymentType.includes('Bepul'))
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            )}>
                              {isFreeForAll || price === 0 ? "Bepul" : (p.paymentType || 'Karta')}
                            </span>
                          </td>

                          
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedParticipantDetail(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Natijani Ko'rish</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            
            {selectedParticipantDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-[#0B1120] border border-[#1E293B] rounded-3xl p-6 max-w-2xl w-full text-white space-y-4 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedParticipantDetail.name} — Test Natijasi</h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {selectedParticipantDetail.school} ({selectedParticipantDetail.grade}-sinf) · ID: {selectedParticipantDetail.id}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantDetail(null)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">To'plangan Ball</div>
                      <div className="text-xl font-black text-blue-400 font-mono mt-0.5">{selectedParticipantDetail.score || 0} ball</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">To'g'ri Javoblar</div>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                        {selectedParticipantDetail.correctAnswers || 0} / {selectedParticipantDetail.totalQuestions || 25}
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Natija Foizi</div>
                      <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">{selectedParticipantDetail.percentage || 0}%</div>
                    </div>
                  </div>

                  
                  <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                    <span>
                      🔒 <strong>Admin ko'rinish rejimida:</strong> Natijalar o'quvchilarga e'lon qilinmagan bo'lsa ham, adminlar ushbu ko'rinishda to'liq tekshirishlari mumkin.
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500 text-white font-bold text-[10px]">E'lon Xabari: {showResultsToStudent ? "Ochiq" : "Yashirin"}</span>
                  </div>

                  
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar border-t border-[#1E293B] pt-3">
                    <h4 className="text-xs font-bold text-slate-300">Savollar tahlili va ko'rsatkichlar:</h4>
                    <div className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] text-xs space-y-2">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Sertifikat holati:</span>
                        <span className="font-bold text-emerald-400">{selectedParticipantDetail.certificateType || "Ishtirok Sertifikati"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Anti-Cheat Holati:</span>
                        <span className="font-bold text-slate-200">Qoidabuzarliklar qayd etilmadi (0 ta)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Imtihon topshirilgan vaqt:</span>
                        <span className="font-mono text-amber-300">{selectedParticipantDetail.submittedAt || "2026-09-22 14:00"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#1E293B]">
                    <button
                      type="button"
                      onClick={() => setSelectedParticipantDetail(null)}
                      className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? "Savolni Tahrirlash" : "Yangi Savol Qo'shish"}
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 font-sans text-xs">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Savol Sharti / Matni *
              </label>
              <label className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs cursor-pointer border border-indigo-200 transition-all">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Savolga rasm biriktirish</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQuestionImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              required
              rows={3}
              value={qContent}
              onChange={(e) => setQContent(e.target.value)}
              placeholder="Masalan: Mantiqiy masalani yeching yoki rasmdagi holatni tahlil qiling..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-blue-500 font-medium"
            />

            
            {qImageUrl && (
              <div className="relative inline-block border border-slate-200 rounded-xl p-1 bg-slate-50">
                <img src={qImageUrl} alt="Savol rasmi" className="h-28 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setQImageUrl('')}
                  className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md cursor-pointer"
                  title="Rasmni o'chirish"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Savol Turi
              </label>
              <select
                value={qType}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  setQType(newType);
                  if (newType === 'multiple_choice') setQCorrectAnswer('A');
                  else setQCorrectAnswer('');
                }}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
              >
                <option value="multiple_choice">Ko'p variantli (Test - A, B, C, D)</option>
                <option value="open_text">Ochiq matnli javob</option>
                <option value="file_upload">Fayl/Rasm yuklash</option>
                <option value="code">Kod yozish (Informatika)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Har Bir Savol Uchun Ball (Points) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          
          {qType !== 'multiple_choice' && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>To'g'ri Javob Matni / Etalon Javob Kaliti *</span>
              </label>
              <input
                type="text"
                required
                value={qCorrectAnswer}
                onChange={(e) => setQCorrectAnswer(e.target.value)}
                placeholder="Masalan: 42 (O'quvchi kiritgan javob bilan solishtiriladi)"
                className="w-full p-2.5 text-xs border border-blue-300 rounded-xl bg-white font-bold text-blue-700 outline-none"
              />
            </div>
          )}

          
          {qType === 'multiple_choice' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <label className="block text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Variantlar ({optionsList.length} ta) va To'g'ri Javobni Belgilash</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Tanlangan to'g'ri javob: <span className="font-mono">{qCorrectAnswer}</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {optionsList.map((optItem, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const isSelectedCorrect = qCorrectAnswer === optionLetter || qCorrectAnswer === optItem.text;

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "p-2.5 rounded-xl border transition-all space-y-2",
                        isSelectedCorrect
                          ? "bg-emerald-50/80 border-emerald-400 shadow-xs"
                          : "bg-white border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        
                        <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                          <input
                            type="radio"
                            name="correctOptionRadio"
                            checked={isSelectedCorrect}
                            onChange={() => setQCorrectAnswer(optionLetter)}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          />
                          <span
                            className={clsx(
                              "font-black text-xs px-2 py-0.5 rounded font-mono",
                              isSelectedCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                            )}
                          >
                            {optionLetter}
                          </span>
                        </label>

                        
                        <input
                          type="text"
                          required
                          value={optItem.text}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          placeholder={`${optionLetter} variant matni...`}
                          className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-medium"
                        />

                        
                        <label
                          className={clsx(
                            "p-2 rounded-lg border flex items-center gap-1 cursor-pointer transition-all shrink-0 text-xs font-bold",
                            optItem.img
                              ? "bg-blue-600 text-white border-blue-500"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                          )}
                          title={`${optionLetter} variantiga rasm yuklash`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">{optItem.img ? 'Rasm' : 'Rasm'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleOptionImageUpload(idx, e)}
                            className="hidden"
                          />
                        </label>

                        
                        {optionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 cursor-pointer"
                            title="Variantni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      
                      {optItem.img && (
                        <div className="relative inline-block border border-slate-300 rounded-lg p-1 bg-slate-50 ml-7">
                          <img src={optItem.img} alt={`Variant ${optionLetter}`} className="h-16 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionImage(idx)}
                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-md cursor-pointer"
                            title="Variant rasmini o'chirish"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>+ Variant qo'shish ({String.fromCharCode(65 + optionsList.length)})</span>
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      
      {selectedSnapshotLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1832] border border-[#1E3563] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-[#182A4D] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Kamera Snapshot & Qoidabuzarlik Tafsilotlari</span>
              </h3>
              <button
                onClick={() => setSelectedSnapshotLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            
            <div className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-black/50 aspect-4/3 flex items-center justify-center">
              {selectedSnapshotLog.snapshotUrl ? (
                <img
                  src={selectedSnapshotLog.snapshotUrl}
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <p className="text-xs">Ushbu holatda kamera rasmi mavjud emas</p>
                </div>
              )}
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-amber-300 font-mono text-[10px] font-bold border border-white/10">
                📸 {selectedSnapshotLog.timestamp || 'Jonli kadr'}
              </div>
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-rose-600/90 text-white font-mono text-[10px] font-bold">
                {selectedSnapshotLog.count}x Qoidabuzarlik
              </div>
            </div>

            
            <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400">Ishtirokchi:</span>
                <span className="font-bold text-white">{selectedSnapshotLog.name} ({selectedSnapshotLog.studentId})</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400">Qoidabuzarlik turi:</span>
                <span className="font-bold text-amber-400">{selectedSnapshotLog.type}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400">Tafsilot:</span>
                <span className="text-slate-300 text-right max-w-[260px]">{selectedSnapshotLog.detail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">IP Manzil / Qurilma:</span>
                <span className="font-mono text-cyan-300">{selectedSnapshotLog.ipAddress || '195.158.12.45'}</span>
              </div>
            </div>

            
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#182A4D]">
              <button
                type="button"
                onClick={() => {
                  handleCheatAction(selectedSnapshotLog.id, 'dismissed');
                  setSelectedSnapshotLog(null);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Oqlash (Xato)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCheatAction(selectedSnapshotLog.id, 'warned');
                    setSelectedSnapshotLog(null);
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Ogohlantirish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCheatAction(selectedSnapshotLog.id, 'penalized');
                    setSelectedSnapshotLog(null);
                  }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  Jarima Qo'llash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
