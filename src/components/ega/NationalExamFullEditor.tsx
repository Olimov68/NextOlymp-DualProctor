import React, { useState, useMemo, useEffect } from 'react';
import { loadAdminQuestions } from '../../services/adminExamAdapter';
import { NationalExamItem } from '../../data/initialNationalExams';
import { useNationalExamStore } from '../../store/useNationalExamStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Award,
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
  Scale,
  BookOpen,
  ShieldCheck,
  ShieldAlert,
  Shield,
  FileText,
  Image as ImageIcon,
  Type,
  UserX,
  AlertTriangle,
  QrCode,
  Lock,
  SlidersHorizontal,
  Printer,
  RefreshCw,
  Mic,
  AudioLines,
  Volume2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, CertificateConfig, AntiCheatConfig, Certificate, ProctoringPresetMode } from '../../types';
import { MOCK_QUESTIONS } from '../../services/mockData';
import { parseDocxQuestions } from '../../utils/docxParser';
import { submissionService } from '../../services/submissionService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CertificateCanvas } from '../certificate/CertificateCanvas';
import { AntiCheatSettingsEditor } from './AntiCheatSettingsEditor';
import apiClient from '../../services/api';

interface NationalExamFullEditorProps {
  exam: NationalExamItem;
  onBack: () => void;
}

export const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const NationalExamFullEditor: React.FC<NationalExamFullEditorProps> = ({ exam, onBack }) => {
  const { updateExam } = useNationalExamStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [activeTab, setActiveTab] = useState<'main' | 'questions' | 'pricing' | 'schedule' | 'certificate' | 'anticheat' | 'stats'>('main');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  
  const [certEnabled, setCertEnabled] = useState<boolean>(
    exam.certificateConfig?.enabled !== false
  );
  const [certFont, setCertFont] = useState<'serif' | 'sans' | 'cinzel' | 'playfair' | 'montserrat' | 'greatvibes'>('cinzel');
  const [certSubject, setCertSubject] = useState<string>(exam.subject || '');
  const [isMultiRound, setIsMultiRound] = useState<boolean>(false);

  
  const [awardCriteria, setAwardCriteria] = useState<'top_rank' | 'min_score' | 'both'>('min_score');
  const [topRankLimit, setTopRankLimit] = useState<number>(10);
  const [minScoreLimit, setMinScoreLimit] = useState<number>(65);

  const [certWinnerText, setCertWinnerText] = useState<string>(
    '"{olympiad}" milliy baholash sinovida yuqori akademik salohiyat ko\'rsatib, {score} ball (Rasch shkalasi) bilan A darajali Davlat Sertifikatiga sazovor bo\'ldi.'
  );
  const [certParticipantText, setCertParticipantText] = useState<string>(
    '"{olympiad}" milliy sertifikat sinovida faol ishtirok etib, {score} ball to\'plagani munosabati bilan taqdirlanadi.'
  );
  const [certRound1PassedText, setCertRound1PassedText] = useState<string>(
    'Tabriklaymiz! Siz "{olympiad}" sinovining 1-bosqichidan muvaffaqiyatli o\'tdingiz va final bosqichiga yo\'llanma oldingiz!'
  );
  const [certRound1FailedText, setCertRound1FailedText] = useState<string>(
    'Ishtirokingiz va intilishingiz uchun samimiy tashakkur! Sizning bilimingiz yuqori, kelgusi sinovlarda albatta yuqori darajani qo\'lga kiritasiz!'
  );
  const [certSignatureName, setCertSignatureName] = useState<string>(
    exam.organizer || 'BMBA & Next Olymp Ilmiy Ekspertlar Markazi'
  );
  const [certSignatureRole, setCertSignatureRole] = useState<string>("Bosh Davlat Eksperti");
  const [certPreviewTab, setCertPreviewTab] = useState<'winner' | 'participant' | 'round_passed' | 'round_failed'>('winner');

  
  const initialAntiCheat: AntiCheatConfig = useMemo(() => ({
    enabled: exam.antiCheatConfig?.enabled !== false,
    blockTabSwitch: exam.antiCheatConfig?.blockTabSwitch ?? true,
    blockCopyPaste: exam.antiCheatConfig?.blockCopyPaste ?? true,
    requireFullscreen: exam.antiCheatConfig?.requireFullscreen ?? true,
    requireWebcam: exam.antiCheatConfig?.requireWebcam ?? true,
    requireMic: exam.antiCheatConfig?.requireMic ?? false,
    blockDevTools: exam.antiCheatConfig?.blockDevTools ?? true,
    maxViolationsAllowed: exam.antiCheatConfig?.maxViolationsAllowed ?? 3,
    blockDuplicateIP: exam.antiCheatConfig?.blockDuplicateIP ?? true,
    heartbeatIntervalSec: exam.antiCheatConfig?.heartbeatIntervalSec ?? 10,
    cameraFaceSnapshotEnabled: exam.antiCheatConfig?.cameraFaceSnapshotEnabled ?? true,
    snapshotOnMultipleFaces: exam.antiCheatConfig?.snapshotOnMultipleFaces ?? true,
    snapshotOnNoFace: exam.antiCheatConfig?.snapshotOnNoFace ?? true,
    proctoringMode: exam.antiCheatConfig?.proctoringMode ?? 'STRICT',
    requireBothEyesVisible: exam.antiCheatConfig?.requireBothEyesVisible ?? true,
    strictFaceCheck: exam.antiCheatConfig?.strictFaceCheck ?? true,
    minFaceConfidence: exam.antiCheatConfig?.minFaceConfidence ?? 0.65,
    maxAbsenceGracePeriod: exam.antiCheatConfig?.maxAbsenceGracePeriod ?? 1.5,
    trackGazeDirection: exam.antiCheatConfig?.trackGazeDirection ?? true,
    requireVoiceBiometrics: exam.antiCheatConfig?.requireVoiceBiometrics ?? false,
    detectUnknownSpeakers: exam.antiCheatConfig?.detectUnknownSpeakers ?? false,
    detectMultipleSpeakers: exam.antiCheatConfig?.detectMultipleSpeakers ?? false,
    voiceSimilarityThreshold: exam.antiCheatConfig?.voiceSimilarityThreshold ?? 0.70,
  }), [exam.antiCheatConfig]);

  const [antiCheatConfig, setAntiCheatConfig] = useState<AntiCheatConfig>(initialAntiCheat);
  const [baselineAntiCheatConfig, setBaselineAntiCheatConfig] = useState<AntiCheatConfig>(initialAntiCheat);
  const [isSavingAntiCheat, setIsSavingAntiCheat] = useState(false);

  // Restore & sync anti-cheat settings from server API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchServerAntiCheat = async () => {
      try {
        const res = await apiClient.get<{ config: AntiCheatConfig }>(`/admin/exams/${exam.id}/anti-cheat`);
        if (res && res.config && isMounted) {
          setAntiCheatConfig(res.config);
          setBaselineAntiCheatConfig(res.config);
        }
      } catch {
        if (isMounted) alert('Anti-cheat sozlamalari serverdan olinmadi. Sahifani qayta yuklang.');
      }
    };
    fetchServerAntiCheat();
    return () => {
      isMounted = false;
    };
  }, [exam.id]);

  // Deep comparison between current form values and baseline
  const isAntiCheatDirty = useMemo(() => {
    return JSON.stringify(antiCheatConfig) !== JSON.stringify(baselineAntiCheatConfig);
  }, [antiCheatConfig, baselineAntiCheatConfig]);

  const handleSaveAntiCheat = async () => {
    if (!isAntiCheatDirty || isSavingAntiCheat) return;
    setIsSavingAntiCheat(true);
    try {
      const response = await apiClient.put<{ config: AntiCheatConfig }>(`/admin/exams/${encodeURIComponent(exam.id)}/anti-cheat`, antiCheatConfig);
      setAntiCheatConfig(response.config);
      setBaselineAntiCheatConfig(response.config);
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Anti-cheat sozlamalarini saqlashda xatolik:', err);
      alert(`❌ Saqlashda xatolik: ${err.message || 'Server xatosi'}`);
    } finally {
      setIsSavingAntiCheat(false);
    }
  };

  const [cheatLogs, setCheatLogs] = useState<any[]>([]);
  const [cheatFilter, setCheatFilter] = useState<'all' | 'pending' | 'actioned'>('all');
  const [selectedSnapshotLog, setSelectedSnapshotLog] = useState<any | null>(null);

  useEffect(() => {
    void submissionService.getOlympiadCheatLogs(exam.id).then(setCheatLogs).catch(() => setCheatLogs([]));
  }, [activeTab, exam.id]);

  const handleCheatAction = async (logId: string, newStatus: 'warned' | 'penalized' | 'disqualified' | 'dismissed' | 'pending') => {
    try {
      await submissionService.updateCheatLogStatus(exam.id, logId, newStatus);
      setCheatLogs(await submissionService.getOlympiadCheatLogs(exam.id));
    } catch (error: any) { alert(error?.message || 'Server qarorini saqlab bo‘lmadi'); }
  };

  
  const participantsList = useMemo(() => {
    const rawList = submissionService.getOlympiadSubmissions(exam.id);
    return rawList.map((p) => {
      const percentage = p.percentage || 0;
      const rasch = Math.round((percentage / 100) * 75 * 10) / 10;
      const gradeLetter = percentage >= 86 ? 'A+ (A\'lo)' : percentage >= 70 ? 'A (Juda yaxshi)' : percentage >= 55 ? 'B+ (Yaxshi)' : percentage >= 45 ? 'B (Qoniqarli)' : 'C (Ishtirok)';
      return {
        ...p,
        raschScore: rasch,
        certificateGrade: gradeLetter,
        status: 'Yakunlangan',
        appealStatus: 'none',
      };
    });
  }, [exam.id]);

  
  const [title, setTitle] = useState(exam.title);
  const [subject, setSubject] = useState(exam.subject);
  const [format, setFormat] = useState<'online' | 'offline'>(exam.format);
  const [status, setStatus] = useState<'ochiq' | 'yopiq'>(exam.status);
  const [location, setLocation] = useState(exam.location || '');
  const [organizer, setOrganizer] = useState(exam.organizer || 'BMBA & Next Olymp Ilmiy Ekspertlar Markazi');
  const [image, setImage] = useState(exam.image);
  const [description, setDescription] = useState(exam.description);
  const [specType, setSpecType] = useState<'spec_1' | 'spec_2' | 'lang'>(exam.specType || 'spec_1');
  const [durationMinutes, setDurationMinutes] = useState<number>(exam.durationMinutes || 150);
  const [totalQuestions, setTotalQuestions] = useState<number>(exam.totalQuestions || 43);
  const [maxScore, setMaxScore] = useState<number>(exam.maxScore || 75);
  const [aThreshold, setAThreshold] = useState<number>(exam.aThreshold || 65);

  
  const [showResultsToStudent, setShowResultsToStudent] = useState<boolean>(
    exam.showResultsToStudent !== false
  );
  const [resultsPublishDate, setResultsPublishDate] = useState<string>(
    exam.resultsPublishDate || '2025-09-28 10:00'
  );

  
  const [retakeAllowed, setRetakeAllowed] = useState<boolean>(
    exam.retakeAllowed || false
  );
  const [maxRetakeAttempts, setMaxRetakeAttempts] = useState<number>(
    exam.maxRetakeAttempts || 2
  );

  
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(
    exam.allowedLanguages || ["O'zbek tili", "Rus tili", "Qoraqalpoq tili"]
  );

  
  const [targetGrades, setTargetGrades] = useState<number[]>(
    exam.targetGrades || [9, 10, 11]
  );

  const [price, setPrice] = useState<number>(exam.price);
  const [isFreeForAll, setIsFreeForAll] = useState<boolean>(
    exam.isFreeForAll || exam.price === 0
  );
  const [separatePricesEnabled, setSeparatePricesEnabled] = useState<boolean>(
    exam.separatePricesEnabled || false
  );
  const [onlinePrice, setOnlinePrice] = useState<number>(exam.onlinePrice || exam.price);
  const [offlinePrice, setOfflinePrice] = useState<number>(exam.offlinePrice || exam.price + 35000);

  
  const [discountPercent, setDiscountPercent] = useState<number>(exam.discountPercent || 0);
  const [discountAmount, setDiscountAmount] = useState<number>(exam.discountAmount || 0);

  
  const [isAlwaysOpen, setIsAlwaysOpen] = useState<boolean>(Boolean(exam.isAlwaysOpen));

  
  const [registrationStartDate, setRegistrationStartDate] = useState<string>(
    exam.registrationStartDate || '2025-09-01 09:00'
  );
  const [registrationEndDate, setRegistrationEndDate] = useState<string>(
    exam.registrationEndDate || '2025-09-24 23:59'
  );
  const [startDate, setStartDate] = useState<string>(exam.startDate);
  const [endDate, setEndDate] = useState<string>(exam.endDate);

  
  const [participantSearchTerm, setParticipantSearchTerm] = useState('');
  const [selectedStudentForMistakes, setSelectedStudentForMistakes] = useState<any | null>(null);

  
  const [questionsList, setQuestionsList] = useState<Question[]>(() => {
    return exam.questions && exam.questions.length > 0 ? exam.questions : [];
  });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionsBaseline, setQuestionsBaseline] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setQuestionsBaseline(null);
    void loadAdminQuestions(exam.id).then(questions => {
      if (!cancelled) { setQuestionsList(questions); setQuestionsBaseline(JSON.stringify(questions)); }
    }).catch(() => { if (!cancelled) alert('Savollar yuklanmadi. Savollar tahriri saqlanmaydi; sahifani yangilang.'); });
    return () => { cancelled = true; };
  }, [exam.id]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qContent, setQContent] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qPoints, setQPoints] = useState<number>(1.5);
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
    setQPoints(1.5);
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
    setQPoints(q.points || 1.5);
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
      const importedQuestions = await parseDocxQuestions(file, exam.id);
      if (importedQuestions.length === 0) {
        alert("⚠️ Fayldan savollar topilmadi. Shablon formatiga mosligini tekshiring!");
        return;
      }

      const updated = [...questionsList, ...importedQuestions];
      setQuestionsList(updated);
      MOCK_QUESTIONS[exam.id] = updated;

      alert(`✅ Muvaffaqiyatli: Word fayldan ${importedQuestions.length} ta savol ajratib olindi va qo'shildi!`);
    } catch (err) {
      console.error("Docx import error:", err);
      alert("❌ Faylni o'qishda xatolik yuz berdi.");
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
      points: Number(qPoints) || 1.5,
      imageUrl: qImageUrl || undefined,
      options,
      optionImages,
      correctAnswer: qCorrectAnswer || undefined,
      correct_answer: qCorrectAnswer || undefined
    };

    if (editingQuestion) {
      const updated = questionsList.map((item) =>
        item.id === editingQuestion.id ? { ...item, ...questionPayload } : item
      );
      setQuestionsList(updated);
      MOCK_QUESTIONS[exam.id] = updated;
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        olympiadId: exam.id,
        roundId: 'r1',
        type: qType,
        content: qContent.trim(),
        points: Number(qPoints) || 1.5,
        order: questionsList.length + 1,
        imageUrl: qImageUrl || undefined,
        options,
        optionImages,
        correctAnswer: qCorrectAnswer || undefined,
        correct_answer: qCorrectAnswer || undefined
      };
      const updated = [...questionsList, newQ];
      setQuestionsList(updated);
      MOCK_QUESTIONS[exam.id] = updated;
    }

    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (qId: string) => {
    const updated = questionsList.filter((q) => q.id !== qId);
    setQuestionsList(updated);
    MOCK_QUESTIONS[exam.id] = updated;
  };

  
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
      return "Ro'yxatdan o'tish yopilish vaqti boshlanish vaqtidan oldin bo'lishi mumkin emas! (Boshlanish < Yopilish)";
    }
    if (rEnd && st && rEnd > st) {
      return "Ro'yxatdan o'tish yopilish vaqti sinov boshlanish vaqtidan keyin bo'lishi mumkin emas! (Ro'yxat yopilishi ≤ Sinov boshlanishi)";
    }
    if (rStart && st && rStart >= st) {
      return "Ro'yxatdan o'tish boshlanishi sinov boshlanish vaqtidan oldin bo'lishi kerak! (Ro'yxat boshlanishi < Sinov boshlanishi)";
    }
    if (st && end && end <= st) {
      return "Sinovning tugash vaqti boshlanish vaqtidan keyin bo'lishi shart! (Boshlash < Tugash)";
    }
    return null;
  }, [isAlwaysOpen, registrationStartDate, registrationEndDate, startDate, endDate]);

  
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

  
  const getCalculatedPrice = (base: number) => {
    let finalP = base;
    if (discountPercent > 0) {
      finalP = Math.max(0, base - (base * discountPercent) / 100);
    } else if (discountAmount > 0) {
      finalP = Math.max(0, base - discountAmount);
    }
    return finalP;
  };

  
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

  
  const handleExportResultsExcel = () => {
    const exportData = participantsList.map((p, idx) => ({
      'O\'rin': idx + 1,
      'F.I.Sh.': p.name,
      'Telefon': p.phone,
      'Hudud': p.region,
      'Maktab': p.school,
      'Sinf': p.grade,
      'To\'g\'ri javoblar': `${p.correctAnswers} / ${p.totalQuestions}`,
      'Rasch Balli (75)': p.raschScore,
      'Sertifikat Darajasi': p.certificateGrade,
      'Holat': p.status,
      'Topshirilgan Vaqt': p.submittedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sertifikat_Natijalari');
    XLSX.writeFile(workbook, `${exam.id}_Milliy_Sertifikat_Natijalari.xlsx`);
  };

  
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (dateValidationErrorMsg) {
      alert(`⚠️ Xatolik: ${dateValidationErrorMsg}`);
      return;
    }

    try {
      await updateExam(exam.id, {
        title: title.trim(),
        subject,
        format,
        status,
        location: format === 'offline' ? location : undefined,
        organizer,
        image,
        description,
        specType,
        durationMinutes: Number(durationMinutes) || 150,
        totalQuestions: Number(totalQuestions) || 43,
        maxScore: Number(maxScore) || 75,
        aThreshold: Number(aThreshold) || 65,
        showResultsToStudent,
        resultsPublishDate,
        retakeAllowed,
        maxRetakeAttempts: retakeAllowed ? maxRetakeAttempts : 1,
        allowedLanguages,
        targetGrades,
        isFreeForAll: true,
        separatePricesEnabled: false,
        price: 0,
        onlinePrice: 0,
        offlinePrice: 0,
        discountPercent: 0,
        discountAmount: 0,
        isAlwaysOpen,
        registrationStartDate,
        registrationEndDate,
        startDate,
        endDate,
        ...(questionsBaseline !== null && JSON.stringify(questionsList) !== questionsBaseline ? {
          questions: questionsList.map(q => ({ ...q,
            options: q.options?.map((text, index) => ({ id: q.optionIds?.[index] ?? String.fromCharCode(65 + index), text })),
            correct_answer: q.correctAnswer,
          })),
        } : {}),
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
        antiCheatConfig: antiCheatConfig
      });

      setBaselineAntiCheatConfig(antiCheatConfig);
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Save exam error:', err);
      alert(`❌ Saqlashda xatolik yuz berdi: ${err.message || 'Server xatosi'}`);
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      
      <div
        className={clsx(
          "p-3.5 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors",
          isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={clsx(
              "p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 font-bold",
              isDark
                ? "bg-[#142347] border-[#1E3666] text-slate-200 hover:text-white hover:border-emerald-400"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400"
            )}
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>{t("Ro'yxatga qaytish")}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
                {title || exam.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {exam.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 hidden sm:inline-block">
                Rasch 75 Ball Shkalasi
              </span>
            </div>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("BMBA milliy sertifikat sinovi parametrlari, Rasch formulalari, ballar va natijalarni boshqarish")}
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
            onClick={() => handleSave()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t("Saqlash")}</span>
          </button>
        </div>
      </div>

      
      <div
        className={clsx(
          "flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto custom-scrollbar transition-colors",
          isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-100 border-slate-200"
        )}
      >
        <button
          onClick={() => setActiveTab('main')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'main'
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{t("Asosiy")}</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'questions'
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t("Savollar & Rubrikalar")} ({totalQuestions})</span>
        </button>


        <button
          onClick={() => setActiveTab('schedule')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'schedule'
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-white hover:bg-[#14244A]"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          )}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t("Vaqt & Rasch Shkalasi")}</span>
        </button>

        <button
          onClick={() => setActiveTab('certificate')}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer whitespace-nowrap",
            activeTab === 'certificate'
              ? "bg-emerald-500 text-slate-950 shadow-sm"
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
              ? "bg-emerald-500 text-slate-950 shadow-sm"
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
              ? "bg-emerald-500 text-slate-950 shadow-sm"
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
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{t("Milliy Sertifikat Sinovi Tasnifi va Nomi")}</span>
              </h2>

              <div>
                <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Sinov Nomi *")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Kimyo fanidan Milliy Sertifikat Sinovi"
                  className={clsx(
                    "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border transition-all font-semibold",
                    isDark ? "bg-[#091024] border-[#1A2F57] text-white focus:border-emerald-500" : "bg-slate-50 border-slate-300 text-slate-900"
                  )}
                />
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Qatnashish Rejimi *")}
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as 'online' | 'offline')}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2 text-xs outline-none border font-bold",
                      isDark ? "bg-[#091024] border-[#1A2F57] text-cyan-400" : "bg-slate-50 border-slate-300 text-cyan-700"
                    )}
                  >
                    <option value="online">🌐 Online (Masofaviy)</option>
                    <option value="offline">📍 Offline (Bino ichida)</option>
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
                      "w-full rounded-xl px-3 py-2 text-xs outline-none border font-bold",
                      isDark ? "bg-[#091024] border-[#1A2F57] text-amber-300" : "bg-slate-50 border-slate-300 text-amber-700"
                    )}
                  >
                    <option value="Kimyo">Kimyo</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Biologiya">Biologiya</option>
                    <option value="Fizika">Fizika</option>
                    <option value="Ona tili">Ona tili va adabiyot</option>
                    <option value="Ingliz tili">Ingliz tili</option>
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Holati *")}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ochiq' | 'yopiq')}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2 text-xs outline-none border font-bold",
                      status === 'ochiq' ? 'text-emerald-400' : 'text-rose-400',
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300"
                    )}
                  >
                    <option value="ochiq">🟢 Ochiq (Ro'yxatdan o'tish faol)</option>
                    <option value="yopiq">🔴 Yopiq (Tugagan / Yopilgan)</option>
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("BMBA Spetsifikatsiya *")}
                  </label>
                  <select
                    value={specType}
                    onChange={(e) => setSpecType(e.target.value as any)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2 text-xs outline-none border font-bold text-blue-400",
                      isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-slate-50 border-slate-300 text-blue-700"
                    )}
                  >
                    <option value="spec_1">1-spets (35 test + 8 yozma)</option>
                    <option value="spec_2">2-spets (Amaliy / Nazariy)</option>
                    <option value="lang">Til sertifikati (4 blok)</option>
                  </select>
                </div>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tashkilotchi / Ilmiy Kengash")}
                  </label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl px-3.5 py-2.5 text-xs outline-none border",
                      isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Muqova Rasm (Banner Image URL / Fayl Upload) *")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={clsx(
                        "flex-1 rounded-xl px-3 py-2 text-xs outline-none border font-mono",
                        isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                    <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                    </label>
                  </div>
                </div>
              </div>

              
              <div className="space-y-2 pt-2 border-t border-[#182A4D]">
                <label className={clsx("block text-xs font-bold flex items-center gap-1.5", isDark ? "text-slate-200" : "text-slate-800")}>
                  <Languages className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t("Tillar bo'limi (Mavjud bo'lgan test tillari) *")}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {["O'zbek tili", "Rus tili", "Qoraqalpoq tili", "Ingliz tili"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                        allowedLanguages.includes(lang)
                          ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-300 shadow-xs"
                          : isDark
                          ? "bg-[#091024] border-[#16284D] text-slate-400 hover:border-slate-500"
                          : "bg-slate-100 border-slate-200 text-slate-600"
                      )}
                    >
                      {allowedLanguages.includes(lang) ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                      <span>{lang}</span>
                    </button>
                  ))}
                </div>
              </div>

              
              <div>
                <label className={clsx("block text-xs font-bold mb-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Sinov Haqida Batafsil Tavsif")}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={clsx(
                    "w-full rounded-xl p-3 text-xs outline-none border resize-none",
                    isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  )}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  {t("O'zgarishlarni saqlash")}
                </button>
              </div>
            </div>

            
            <div className="space-y-4">
              <div
                className={clsx(
                  "p-4 rounded-2xl border space-y-3 transition-colors",
                  isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
                )}
              >
                <h3 className={clsx("text-xs font-bold uppercase tracking-wider text-slate-400")}>
                  {t("Muqova Rasm va Karta Preview")}
                </h3>

                <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-[#091024] shadow-lg">
                  <div className="relative h-40 w-full overflow-hidden">
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                        {format}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-xs">
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                      <Scale className="w-3 h-3 text-blue-400" />
                      <span>Rasch 75 ball • A: 65+</span>
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{title}</div>
                    <div className="text-[11px] text-amber-400 font-bold">{subject}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Ruxsat etilgan tillar:</span>
                    <span className="text-white font-semibold">{allowedLanguages.length} ta til</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Davomiyligi:</span>
                    <span className="text-cyan-400 font-semibold">{durationMinutes} daqiqa</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Savollar soni:</span>
                    <span className="text-amber-300 font-semibold">{totalQuestions} ta</span>
                  </div>
                </div>
              </div>
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
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <span>{t("Ushbu Sinovga Biriktirilgan Savollar va Ballar")}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Jami {questionsList.length} ta savol kiritilgan • Umumiy xom ball summasi: <span className="font-extrabold text-emerald-400 font-mono">{totalQuestionsScore} ball</span> • Rasch shkalasi: <span className="font-extrabold text-blue-400 font-mono">{maxScore} ball</span>
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
                    isDark ? "bg-[#091024] border-[#182A4D] hover:border-emerald-500/40" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        #{idx + 1}-savol
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {q.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-black font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {q.points || 1.5} ball
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
                                  <span className="font-black text-emerald-400 mr-1">{optionLetter}:</span>
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
              <span>{t("Ro'yxatdan o'tish va Sinovni Boshlash/Tugash Vaqtlari")}</span>
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
                      {t("Doimiy Ochiq Rejim (24/7 Cheklovsiz Sinov)")}
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
                      ? t("🟢 Ushbu milliy sertifikat sinovi 24/7 doimiy ochiq: foydalanuvchilar istalgan vaqtda kirib testlarni yechishlari mumkin.")
                      : t("Yoqilsa, ro'yxatdan o'tish va sinov boshlanish/tugash vaqtlari bo'yicha cheklovlar bekor qilinadi.")}
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
                <label className="block text-xs font-extrabold text-cyan-300">
                  1. {t("Ro'yxatdan O'tish Boshlanishi")} {!isAlwaysOpen && '*'}
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(registrationStartDate)}
                  onChange={(e) => setRegistrationStartDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs font-mono font-bold text-cyan-400 outline-none border",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-amber-300">
                  2. {t("Ro'yxatdan O'tish Yopilishi")} {!isAlwaysOpen && '*'}
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(registrationEndDate)}
                  onChange={(e) => setRegistrationEndDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-400 outline-none border",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-emerald-300">
                  3. {t("Sinovni Boshlash Vaqti")} {!isAlwaysOpen && '*'}
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(startDate)}
                  onChange={(e) => setStartDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 outline-none border",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <label className="block text-xs font-extrabold text-rose-300">
                  4. {t("Sinov Tugash Vaqti")} {!isAlwaysOpen && '*'}
                </label>
                <input
                  type="datetime-local"
                  required={!isAlwaysOpen}
                  value={toDatetimeInput(endDate)}
                  onChange={(e) => setEndDate(fromDatetimeInput(e.target.value))}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs font-mono font-bold text-rose-400 outline-none border",
                    isDark ? "bg-[#091024] border-[#1A2F57]" : "bg-white border-slate-300 text-slate-900",
                    isAlwaysOpen && "opacity-60"
                  )}
                />
              </div>
            </div>

            
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-indigo-500/40 space-y-3">
              <h3 className="text-xs font-extrabold text-indigo-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-300" />
                <span>{t("BMBA Rasmiy 75-Ballik Rasch Shkalasi & Darajalar")}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">A daraja</div>
                  <div className="text-sm font-black text-emerald-400 mt-0.5">65 — 75</div>
                  <div className="text-[9px] text-slate-400 font-sans">100% Imtiyoz</div>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40">
                  <div className="text-[10px] text-cyan-300 font-bold uppercase">B+ daraja</div>
                  <div className="text-sm font-black text-cyan-400 mt-0.5">60 — 64.9</div>
                  <div className="text-[9px] text-slate-400 font-sans">Yuqori ball</div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40">
                  <div className="text-[10px] text-blue-300 font-bold uppercase">B daraja</div>
                  <div className="text-sm font-black text-blue-400 mt-0.5">55 — 59.9</div>
                  <div className="text-[9px] text-slate-400 font-sans">Standart</div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <div className="text-[10px] text-amber-300 font-bold uppercase">C+ daraja</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">50 — 54.9</div>
                  <div className="text-[9px] text-slate-400 font-sans">Qoniqarli</div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-rose-300 font-bold uppercase">C daraja</div>
                  <div className="text-sm font-black text-rose-400 mt-0.5">46 — 49.9</div>
                  <div className="text-[9px] text-slate-400 font-sans">Minimal sertifikat</div>
                </div>
              </div>
            </div>

            
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/40 space-y-4">
              <h3 className="text-xs font-extrabold text-emerald-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-300" />
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
                        ? t("Sinov tugashi bilan Rasch balli va sertifikat darajasi darhol ko'rsatiladi.")
                        : t("Natijalar rasmiy e'lon sanasigacha yashiriladi va belgilangan vaqtda e'lon qilinadi.")}
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
                    : "bg-black/30 border-emerald-500/40"
                )}>
                  <label className="block text-xs font-bold text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
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
                        : "bg-[#091024] border-[#1A2F57] text-emerald-300 cursor-pointer"
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
                        ? t("O'quvchi Rasch ballini yaxshilash uchun testni qayta topshira oladi.")
                        : t("Milliy sinov faqat 1 marta topshiriladi.")}
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
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>{t("Milliy Sertifikat Shabloni va Matnlar")}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                  DAVLAT STANDARTI
                </span>
              </div>

              
              <div className="space-y-1.5">
                <label className={clsx("block text-xs font-bold flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
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
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                          : isDark
                          ? "bg-[#091024] border-[#182A4D] text-slate-300 hover:border-emerald-400/50"
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
                  placeholder="Masalan: Kimyo (Milliy Sertifikat), Biologiya..."
                  className={clsx(
                    "w-full rounded-xl px-3 py-2 text-xs outline-none border transition-all",
                    isDark ? "bg-[#091024] border-[#182A4D] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  )}
                />
              </div>

              
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>{t("Davlat Sertifikati / Diplom Berish Mezonlari")}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    {awardCriteria === 'top_rank' ? `Top ${topRankLimit}-o'ringacha` : awardCriteria === 'min_score' ? `${minScoreLimit}+ ball` : `Top ${topRankLimit} & ${minScoreLimit}+ ball`}
                  </span>
                </div>

                
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setAwardCriteria('min_score')}
                    className={clsx(
                      "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                      awardCriteria === 'min_score'
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    🎯 Minimal Ball
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwardCriteria('top_rank')}
                    className={clsx(
                      "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                      awardCriteria === 'top_rank'
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    🏆 Top N O'rin
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwardCriteria('both')}
                    className={clsx(
                      "py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer",
                      awardCriteria === 'both'
                        ? "bg-emerald-500 text-slate-950 shadow-xs"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    ✨ Ikkalasi Ham
                  </button>
                </div>

                
                {(awardCriteria === 'min_score' || awardCriteria === 'both') && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">
                        {t("A / B+ Daraja uchun Minimal Ball:")}
                      </label>
                      <div className="flex items-center gap-1">
                        {[55, 60, 65, 70, 75].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setMinScoreLimit(score)}
                            className={clsx(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer",
                              minScoreLimit === score
                                ? "bg-emerald-400 text-slate-950 font-black"
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
                          isDark ? "bg-[#091024] border-[#182A4D] text-emerald-300" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">balldan yuqori</span>
                    </div>
                  </div>
                )}

                
                {(awardCriteria === 'top_rank' || awardCriteria === 'both') && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">
                        {t("Davlat Sertifikati beriladigan O'rinlar Chegarasi (Top N):")}
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
                                ? "bg-emerald-400 text-slate-950 font-black"
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
                          isDark ? "bg-[#091024] border-[#182A4D] text-emerald-300" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">o'ringacha</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  💡 {minScoreLimit} balldan yuqori to'plaganlarga (yoki Top {topRankLimit}-o'rin egalariga) Rasmiy A/B Darajali Davlat Sertifikati taqdim etiladi. Qolgan ishtirokchilarga esa balli ko'rsatilgan ishtirok sertifikati beriladi.
                </p>
              </div>

              
              <div className="space-y-3 pt-1">
                
                <div className="space-y-1">
                  <label className={clsx("block text-xs font-bold text-emerald-400")}>
                    {t("A / B+ Darajali G'oliblar matni")}
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
                  <p className="text-[9px] text-slate-400">Teglar: <code>{'{name}'}</code>, <code>{'{olympiad}'}</code>, <code>{'{score}'}</code></p>
                </div>

                
                <div className="space-y-1">
                  <label className={clsx("block text-xs font-bold text-blue-400")}>
                    {t("Qoniqarli / Ishtirokchilar matni")}
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

                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">{t("Bosh Ekspert / Kengash")}</label>
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
                    onClick={() => handleSave()}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <h3 className={clsx("text-sm font-bold", isDark ? "text-white" : "text-slate-900")}>
                      {t("Jonli Ko'rinish (Davlat Namunasi)")}
                    </h3>
                  </div>

                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCertPreviewTab('winner')}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                        certPreviewTab === 'winner'
                          ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                          : isDark
                          ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      🏅 A Daraja (68 ball)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertPreviewTab('participant')}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all",
                        certPreviewTab === 'participant'
                          ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                          : isDark
                          ? "bg-[#142347] text-slate-300 hover:bg-[#1E3666]"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      📜 B Daraja (58 ball)
                    </button>
                  </div>
                </div>

                
                <div className="max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-emerald-400/40">
                  <CertificateCanvas
                    certificate={{
                      id: 'EXAM-CERT-01',
                      userId: 'STU-881',
                      userName: 'Toirova Madina Shavkatovna',
                      olympiadId: exam.id,
                      olympiadTitle: title,
                      subject: certSubject || subject,
                      type: certPreviewTab,
                      issuedAt: new Date().toISOString(),
                      verificationCode: 'NO-9931',
                      score: certPreviewTab === 'winner' ? 68.4 : 58.2,
                      maxScore: 75,
                      rank: certPreviewTab === 'winner' ? 1 : 0,
                      totalParticipants: 320,
                      fontFamily: certFont
                    }}
                    config={{
                      fontFamily: certFont,
                      subjectName: certSubject || subject,
                      isMultiRound: false,
                      winnerText: certWinnerText,
                      participantText: certParticipantText,
                      signatureName: certSignatureName,
                      signatureRole: certSignatureRole
                    }}
                  />
                </div>
              </div>

              
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-slate-300 flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    QR-kod orqali <strong>/verify-certificate/:code</strong> manzilida haqiqiylik tasdiqlanadi.
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold whitespace-nowrap">
                  VERIFIED BMBA QR
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {activeTab === 'anticheat' && (
        <div className="space-y-5">
          <AntiCheatSettingsEditor
            config={antiCheatConfig}
            onChange={setAntiCheatConfig}
            onSave={handleSaveAntiCheat}
            isSaving={isSavingAntiCheat}
            hasUnsavedChanges={isAntiCheatDirty}
          />

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
                          <div className="font-mono text-slate-300 font-semibold">{log.ipAddress || '195.158.30.22'}</div>
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
                            log.status === 'disqualified' ? "bg-red-900/40 text-red-400 font-black" : "bg-slate-500/20 text-slate-400"
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
                                >
                                  Ogohlantirish
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCheatAction(log.id, 'disqualified')}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
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

      
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div
            className={clsx(
              "p-5 rounded-2xl border space-y-4 transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{t("Ishtirokchilar Natijalari va Apellyatsiyalar")}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t("Rasch 75 ballik natijalari, sertifikat darajalari va apellyatsiyalarni ko'rish")}
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
                    className={clsx("w-full rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none border", isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900")}
                  />
                </div>

                <button
                  onClick={handleExportResultsExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t("Excel'da yuklash")}</span>
                </button>
              </div>
            </div>

            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className={clsx("text-[11px] uppercase border-b font-semibold whitespace-nowrap", isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200")}>
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">№</th>
                    <th className="py-2.5 px-3">{t("Ishtirokchi")}</th>
                    <th className="py-2.5 px-3">{t("Hudud / Maktab")}</th>
                    <th className="py-2.5 px-3">{t("To'g'ri Javoblar")}</th>
                    <th className="py-2.5 px-3">{t("Rasch Balli (75)")}</th>
                    <th className="py-2.5 px-3">{t("Sertifikat Darajasi")}</th>
                    <th className="py-2.5 px-3 text-right">{t("Apellyatsiya")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {participantsList.filter((p) => p.name.toLowerCase().includes(participantSearchTerm.toLowerCase())).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 opacity-40 text-slate-400" />
                          <p className="font-semibold text-xs text-slate-300">{t("Hozircha ishtirokchilar mavjud emas")}</p>
                          <p className="text-[11px] text-slate-500">{t("O'quvchilar ushbu imtihonga yozilgach yoki topshirgach natijalar shu yerda ko'rinadi")}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    participantsList.filter((p) => p.name.toLowerCase().includes(participantSearchTerm.toLowerCase())).map((p, idx) => (
                      <tr key={p.id} className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}>
                        <td className="py-3 px-3 text-center font-bold font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.phone}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-300">{p.region}</div>
                          <div className="text-[10px] text-slate-400">{p.school}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-emerald-400">
                          {p.correctAnswers} / {p.totalQuestions}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-black text-amber-300 text-sm">
                          {p.raschScore} ball
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {p.certificateGrade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {p.appealStatus === 'pending' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              1 ta arizasi kutilmoqda
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? "Savolni Tahrirlash" : "Yangi Savol Qo'shish"}
        size="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 font-sans text-xs">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={clsx("block text-xs font-bold", isDark ? "text-slate-200" : "text-slate-800")}>
                Savol Sharti / Matni *
              </label>
              <label className={clsx(
                "flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg text-xs cursor-pointer border transition-all",
                isDark
                  ? "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
              )}>
                <ImageIcon className="w-3.5 h-3.5" />
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
              placeholder="Masalan: Kimyoviy reaksiyani yeching yoki masalani tahlil qiling..."
              className={clsx(
                "w-full p-2.5 text-xs border rounded-xl outline-none font-medium",
                isDark
                  ? "bg-[#091024] border-[#1A2F57] text-white placeholder:text-slate-500 focus:border-emerald-500"
                  : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
              )}
            />

            
            {qImageUrl && (
              <div className={clsx("relative inline-block border rounded-xl p-1", isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50")}>
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
              <label className={clsx("block text-xs font-bold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
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
                className={clsx(
                  "w-full p-2.5 text-xs border rounded-xl font-bold",
                  isDark
                    ? "bg-[#091024] border-[#1A2F57] text-white"
                    : "bg-white border-slate-300 text-slate-900"
                )}
              >
                <option value="multiple_choice">Ko'p variantli (Test - A, B, C, D)</option>
                <option value="open_text">Ochiq matnli javob (Yozma ish)</option>
                <option value="file_upload">Fayl/Rasm yuklash</option>
                <option value="code">Kod yozish (Informatika)</option>
              </select>
            </div>

            <div>
              <label className={clsx("block text-xs font-bold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                Har Bir Savol Uchun Xom Ball (Rasch) *
              </label>
              <input
                type="number"
                required
                min={0.5}
                step={0.5}
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                className={clsx(
                  "w-full p-2.5 text-xs border rounded-xl font-mono font-bold",
                  isDark
                    ? "bg-[#091024] border-[#1A2F57] text-emerald-400"
                    : "bg-white border-slate-300 text-emerald-600"
                )}
              />
            </div>
          </div>

          
          {qType !== 'multiple_choice' && (
            <div className={clsx(
              "p-3 rounded-xl border space-y-1.5",
              isDark ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50/70 border-blue-200"
            )}>
              <label className={clsx("block text-xs font-bold flex items-center gap-1.5", isDark ? "text-blue-300" : "text-blue-900")}>
                <CheckCircle2 className="w-4 h-4" />
                <span>To'g'ri Javob Matni / Etalon Javob Kaliti *</span>
              </label>
              <input
                type="text"
                required
                value={qCorrectAnswer}
                onChange={(e) => setQCorrectAnswer(e.target.value)}
                placeholder="Masalan: 42 (O'quvchi kiritgan javob bilan solishtiriladi)"
                className={clsx(
                  "w-full p-2.5 text-xs border rounded-xl font-bold outline-none",
                  isDark
                    ? "bg-[#091024] border-blue-500/40 text-blue-300"
                    : "bg-white border-blue-300 text-blue-700"
                )}
              />
            </div>
          )}

          
          {qType === 'multiple_choice' && (
            <div className={clsx(
              "p-4 border rounded-2xl space-y-3",
              isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200"
            )}>
              <div className={clsx("flex items-center justify-between border-b pb-2", isDark ? "border-slate-700" : "border-slate-200")}>
                <label className={clsx("block text-xs font-extrabold flex items-center gap-1.5", isDark ? "text-slate-200" : "text-slate-800")}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Variantlar ({optionsList.length} ta) va To'g'ri Javobni Belgilash</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
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
                          ? isDark
                            ? "bg-emerald-500/15 border-emerald-500/50 shadow-xs"
                            : "bg-emerald-50/80 border-emerald-400 shadow-xs"
                          : isDark
                          ? "bg-[#0D1832] border-[#1A2F57]"
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
                              isSelectedCorrect
                                ? "bg-emerald-600 text-white"
                                : isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"
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
                          className={clsx(
                            "flex-1 p-2 text-xs border rounded-lg outline-none font-medium",
                            isDark
                              ? "bg-[#091024] border-[#1A2F57] text-white focus:border-emerald-500"
                              : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
                          )}
                        />

                        
                        <label
                          className={clsx(
                            "p-2 rounded-lg border flex items-center gap-1 cursor-pointer transition-all shrink-0 text-xs font-bold",
                            optItem.img
                              ? "bg-blue-600 text-white border-blue-500"
                              : isDark
                              ? "bg-[#0D1832] hover:bg-[#182A4D] text-slate-400 border-[#1A2F57]"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                          )}
                          title={`${optionLetter} variantiga rasm yuklash`}
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">Rasm</span>
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
                            className={clsx(
                              "p-2 rounded-lg border cursor-pointer transition-all",
                              isDark
                                ? "text-rose-400 hover:bg-rose-500/20 border-transparent hover:border-rose-500/30"
                                : "text-rose-500 hover:bg-rose-50 border-transparent hover:border-rose-200"
                            )}
                            title="Variantni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      
                      {optItem.img && (
                        <div className={clsx("relative inline-block border rounded-lg p-1 ml-7", isDark ? "border-slate-700 bg-slate-900" : "border-slate-300 bg-slate-50")}>
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
                className={clsx(
                  "w-full py-2 border border-dashed font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                  isDark
                    ? "bg-[#0D1832] hover:bg-[#182A4D] border-slate-600 text-slate-300"
                    : "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                )}
              >
                <Plus className="w-4 h-4 text-blue-500" />
                <span>+ Variant qo'shish ({String.fromCharCode(65 + optionsList.length)})</span>
              </button>
            </div>
          )}

          <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-slate-700" : "border-slate-200")}>
            <Button type="button" variant="ghost" onClick={() => setIsQuestionModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
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
