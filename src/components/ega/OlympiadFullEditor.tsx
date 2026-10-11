import React, { useState, useMemo, useEffect } from 'react';
import { loadAdminQuestions } from '../../services/adminExamAdapter';
import { OlympiadItem } from '../../data/initialOlympiads';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Trophy,
  Calendar,
  Clock,
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
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, AntiCheatConfig } from '../../types';
import { parseDocxQuestions } from '../../utils/docxParser';
import { submissionService, ParticipantAdminResult } from '../../services/submissionService';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AntiCheatSettingsEditor } from './AntiCheatSettingsEditor';
import apiClient from '../../services/api';

interface OlympiadFullEditorProps {
  olympiad: OlympiadItem;
  onBack: () => void;
  onSave?: (id: string, fields: Partial<OlympiadItem>) => Promise<unknown>;
  certificateEnabled?: boolean;
  participantsEnabled?: boolean;
}

const ALL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const PRESET_IMAGES = [
  { label: 'Matematika', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fizika', url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80' },
  { label: 'Kimyo', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Biologiya', url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Informatika', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ingliz tili', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80' }
];

export const OlympiadFullEditor: React.FC<OlympiadFullEditorProps> = ({
  olympiad,
  onBack,
  onSave,
  participantsEnabled = true
}) => {
  const { updateOlympiad } = useOlympiadStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  // 5 ta asosiy bo'lim:
  // 1: basic (Sinfi, Nomi, Rasmi, Ochiq/Yopiqligi)
  // 2: questions (Savollar)
  // 3: schedule_results (Vaqt va natija qismi)
  // 4: participants (Ishtirokchilar)
  // 5: anticheat (Anti-Cheat nazorati)
  const [activeTab, setActiveTab] = useState<'basic' | 'questions' | 'schedule_results' | 'participants' | 'anticheat'>('basic');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // 1-BO'LIM: BAZAVIY NASTROYKA
  // ==========================================
  const [title, setTitle] = useState(olympiad.title || '');
  const [targetGrades, setTargetGrades] = useState<number[]>(
    olympiad.targetGrades && olympiad.targetGrades.length > 0 ? olympiad.targetGrades : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  );
  const [image, setImage] = useState(olympiad.image || PRESET_IMAGES[0].url);
  const [status, setStatus] = useState<'ochiq' | 'yopiq'>(olympiad.status || 'ochiq');
  const [subject, setSubject] = useState(olympiad.subject || 'Matematika');
  const [description, setDescription] = useState(olympiad.description || '');
  const [organizer, setOrganizer] = useState(olympiad.organizer || 'Next Olymp Akademik Kengashi');

  const toggleGrade = (grade: number) => {
    if (targetGrades.includes(grade)) {
      if (targetGrades.length === 1) return; // kamida 1 ta sinf qolsin
      setTargetGrades(targetGrades.filter((g) => g !== grade));
    } else {
      setTargetGrades([...targetGrades, grade].sort((a, b) => a - b));
    }
  };

  const selectAllGrades = () => setTargetGrades([...ALL_GRADES]);
  const clearGrades = () => setTargetGrades([ALL_GRADES[0]]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Rasm hajmi 2 MB dan oshmasligi kerak!");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 2-BO'LIM: SAVOLLAR
  // ==========================================
  const [questionsList, setQuestionsList] = useState<Question[]>(() => {
    return olympiad.questions && olympiad.questions.length > 0 ? olympiad.questions : [];
  });
  const [questionsBaseline, setQuestionsBaseline] = useState<string | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionsSearch, setQuestionsSearch] = useState('');

  const [qContent, setQContent] = useState('');
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qPoints, setQPoints] = useState<number>(10);
  const [qImageUrl, setQImageUrl] = useState<string>('');
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string>('A');
  const [qExplanation, setQExplanation] = useState('');
  const [optionsList, setOptionsList] = useState<{ id: string; text: string }[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);

  useEffect(() => {
    let cancelled = false;
    setQuestionsBaseline(null);
    void loadAdminQuestions(olympiad.id)
      .then((questions) => {
        if (!cancelled) {
          setQuestionsList(questions);
          setQuestionsBaseline(JSON.stringify(questions));
        }
      })
      .catch(() => {
        if (!cancelled) {
          console.warn('Savollar yuklanmadi, mavjud savollar ishlatilmoqda.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [olympiad.id]);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQContent('');
    setQType('multiple_choice');
    setQPoints(10);
    setQImageUrl('');
    setQCorrectAnswer('A');
    setQExplanation('');
    setOptionsList([
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' },
    ]);
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQContent(q.content || '');
    setQType(q.type || 'multiple_choice');
    setQPoints(q.points || 10);
    setQImageUrl(q.imageUrl || '');
    setQCorrectAnswer(q.correctAnswer || (q as any).correct_answer || 'A');
    setQExplanation(q.explanation || '');

    if (q.options && q.options.length > 0) {
      setOptionsList(
        q.options.map((optText, idx) => ({
          id: q.optionIds?.[idx] || String.fromCharCode(65 + idx),
          text: optText,
        }))
      );
    } else {
      setOptionsList([
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ]);
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim()) {
      alert('Iltimos, savol matnini kiriting.');
      return;
    }
    if (!qCorrectAnswer.trim()) {
      alert('Iltimos, to‘g‘ri javobni tanlang.');
      return;
    }

    if (qType === 'multiple_choice') {
      const emptyOpts = optionsList.filter((o) => !o.text.trim());
      if (emptyOpts.length > 0) {
        alert('Barcha variant matnlarini to‘ldiring yoki keraksizlarini o‘chiring.');
        return;
      }
      if (optionsList.length < 2) {
        alert('Kamida ikkita variant kiritilishi shart.');
        return;
      }
    }

    const payloadOptions = qType === 'multiple_choice' ? optionsList.map((o) => o.text.trim()) : undefined;
    const payloadOptionIds = qType === 'multiple_choice' ? optionsList.map((o) => o.id) : undefined;

    if (editingQuestion) {
      const updated = questionsList.map((item) =>
        item.id === editingQuestion.id
          ? {
              ...item,
              content: qContent.trim(),
              type: qType,
              points: Number(qPoints) || 10,
              imageUrl: qImageUrl || undefined,
              options: payloadOptions,
              optionIds: payloadOptionIds,
              correctAnswer: qCorrectAnswer,
              correct_answer: qCorrectAnswer,
              explanation: qExplanation.trim(),
            }
          : item
      );
      setQuestionsList(updated);
    } else {
      const newQ: Question = {
        id: `q-${Date.now()}`,
        olympiadId: olympiad.id,
        roundId: 'r1',
        content: qContent.trim(),
        type: qType,
        points: Number(qPoints) || 10,
        order: questionsList.length + 1,
        imageUrl: qImageUrl || undefined,
        options: payloadOptions,
        optionIds: payloadOptionIds,
        correctAnswer: qCorrectAnswer,
        correct_answer: qCorrectAnswer,
        explanation: qExplanation.trim(),
      };
      setQuestionsList([...questionsList, newQ]);
    }
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (confirm("Ushbu savolni o'chirmoqchimisiz?")) {
      setQuestionsList(questionsList.filter((q) => q.id !== qId));
    }
  };

  const handleDocxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseDocxQuestions(file, olympiad.id);
      if (parsed && parsed.length > 0) {
        setQuestionsList([...questionsList, ...parsed]);
        alert(`✅ Muvaffaqiyatli! ${parsed.length} ta savol DOCX fayldan import qilindi.`);
      } else {
        alert("Faylda mos savollar formati topilmadi.");
      }
    } catch (err: any) {
      console.error('Docx import error:', err);
      alert(`Xatolik: ${err.message || 'DOCX faylini tahlil qilishda xatolik yuz berdi'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleExportQuestionsJson = () => {
    const blob = new Blob([JSON.stringify(questionsList, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${olympiad.title || 'savollar'}_savollar.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredQuestions = useMemo(() => {
    if (!questionsSearch.trim()) return questionsList;
    const q = questionsSearch.toLowerCase();
    return questionsList.filter((item) => item.content.toLowerCase().includes(q));
  }, [questionsList, questionsSearch]);

  const totalPoints = useMemo(() => {
    return questionsList.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  }, [questionsList]);

  // ==========================================
  // 3-BO'LIM: VAQT VA NATIJA QISMI
  // ==========================================
  const toDatetimeInput = (val?: string) => {
    if (!val) return '';
    const date = new Date(val);
    if (!Number.isFinite(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };

  const [startDate, setStartDate] = useState<string>(olympiad.startDate || '2026-10-01 10:00');
  const [endDate, setEndDate] = useState<string>(olympiad.endDate || '2026-10-01 18:00');
  const [resultsPublishDate, setResultsPublishDate] = useState<string>(
    olympiad.resultsPublishDate || olympiad.endDate || '2026-10-02 12:00'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(olympiad.durationMinutes || 60);
  const [isAlwaysOpen, setIsAlwaysOpen] = useState<boolean>(Boolean(olympiad.isAlwaysOpen));
  const [showResultsToStudent, setShowResultsToStudent] = useState<boolean>(olympiad.showResultsToStudent !== false);

  const dateValidationMsg = useMemo(() => {
    if (isAlwaysOpen) return null;
    if (!startDate || !endDate) return null;
    const st = new Date(startDate.replace(' ', 'T')).getTime();
    const end = new Date(endDate.replace(' ', 'T')).getTime();
    if (st && end && end <= st) {
      return "Tugash vaqti boshlanish vaqtidan keyin bo'lishi shart!";
    }
    return null;
  }, [isAlwaysOpen, startDate, endDate]);

  // ==========================================
  // 4-BO'LIM: ISHTIROKCHILAR
  // ==========================================
  const [participants, setParticipants] = useState<ParticipantAdminResult[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantStatusFilter, setParticipantStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'disqualified'>('all');

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    try {
      const res = await apiClient.get<{ data: any[] }>(`/submissions?exam_id=${encodeURIComponent(olympiad.id)}`);
      const subs = Array.isArray(res?.data) ? res.data : [];
      const mapped: ParticipantAdminResult[] = subs.map((s: any, idx: number) => ({
        id: s.userId || s.id,
        name: s.userName || s.fullName || 'Ishtirokchi',
        phone: s.phone || '',
        region: s.region || '',
        school: s.school || '',
        grade: s.grade || 0,
        status: s.status || 'completed',
        score: s.score ?? 0,
        percentage: s.percentage ?? (s.maxScore ? Math.round((s.score / s.maxScore) * 100) : 0),
        timeSpentMinutes: s.timeSpentMinutes ?? 0,
        submittedAt: s.submittedAt || '',
        rank: idx + 1,
      }));
      setParticipants(mapped);
    } catch (e) {
      console.warn("Ishtirokchilarni yuklashda xatolik:", e);
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'participants') {
      fetchParticipants();
    }
  }, [activeTab, olympiad.id]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(participantSearch.toLowerCase()) ||
        (p.phone || '').includes(participantSearch) ||
        (p.region || '').toLowerCase().includes(participantSearch.toLowerCase());
      const matchesStatus =
        participantStatusFilter === 'all' || p.status === participantStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [participants, participantSearch, participantStatusFilter]);

  const handleExportParticipantsExcel = () => {
    const exportData = filteredParticipants.map((p, idx) => ({
      '№': idx + 1,
      Ism: p.name || 'Noma\'lum',
      Telefon: p.phone || '-',
      Viloyat: p.region || '-',
      Maktab: p.school || '-',
      Sinf: p.grade ? `${p.grade}-sinf` : '-',
      Ball: p.score ?? 0,
      Foiz: p.percentage ? `${p.percentage}%` : '0%',
      'Sarf vaqti': p.timeSpentMinutes ? `${p.timeSpentMinutes} daq` : '-',
      Holati: p.status === 'completed' ? 'Topshirgan' : p.status === 'disqualified' ? 'Diskvalifikatsiya' : 'Jarayonda',
      'Topshirilgan vaqt': p.submittedAt ? new Date(p.submittedAt).toLocaleString() : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ISHTIROKCHILAR');
    XLSX.writeFile(workbook, `${olympiad.title || 'olimpiada'}_ishtirokchilar.xlsx`);
  };

  // ==========================================
  // 5-BO'LIM: ANTI-CHEAT NAZORATI
  // ==========================================
  const initialAntiCheat: AntiCheatConfig = useMemo(() => ({
    enabled: olympiad.antiCheatConfig?.enabled !== false,
    blockTabSwitch: olympiad.antiCheatConfig?.blockTabSwitch ?? true,
    blockCopyPaste: olympiad.antiCheatConfig?.blockCopyPaste ?? true,
    requireFullscreen: olympiad.antiCheatConfig?.requireFullscreen ?? true,
    requireWebcam: olympiad.antiCheatConfig?.requireWebcam ?? true,
    requireMic: olympiad.antiCheatConfig?.requireMic ?? false,
    blockDevTools: olympiad.antiCheatConfig?.blockDevTools ?? true,
    maxViolationsAllowed: olympiad.antiCheatConfig?.maxViolationsAllowed ?? 3,
    blockDuplicateIP: olympiad.antiCheatConfig?.blockDuplicateIP ?? true,
    heartbeatIntervalSec: olympiad.antiCheatConfig?.heartbeatIntervalSec ?? 10,
    cameraFaceSnapshotEnabled: olympiad.antiCheatConfig?.cameraFaceSnapshotEnabled ?? true,
    snapshotOnMultipleFaces: olympiad.antiCheatConfig?.snapshotOnMultipleFaces ?? true,
    snapshotOnNoFace: olympiad.antiCheatConfig?.snapshotOnNoFace ?? true,
    proctoringMode: olympiad.antiCheatConfig?.proctoringMode ?? 'STRICT',
    requireBothEyesVisible: olympiad.antiCheatConfig?.requireBothEyesVisible ?? true,
    strictFaceCheck: olympiad.antiCheatConfig?.strictFaceCheck ?? true,
    minFaceConfidence: olympiad.antiCheatConfig?.minFaceConfidence ?? 0.65,
    maxAbsenceGracePeriod: olympiad.antiCheatConfig?.maxAbsenceGracePeriod ?? 1.5,
    trackGazeDirection: olympiad.antiCheatConfig?.trackGazeDirection ?? true,
    requireVoiceBiometrics: olympiad.antiCheatConfig?.requireVoiceBiometrics ?? false,
    detectUnknownSpeakers: olympiad.antiCheatConfig?.detectUnknownSpeakers ?? false,
    detectMultipleSpeakers: olympiad.antiCheatConfig?.detectMultipleSpeakers ?? false,
    voiceSimilarityThreshold: olympiad.antiCheatConfig?.voiceSimilarityThreshold ?? 0.70,
  }), [olympiad.antiCheatConfig]);

  const [antiCheatConfig, setAntiCheatConfig] = useState<AntiCheatConfig>(initialAntiCheat);
  const [baselineAntiCheatConfig, setBaselineAntiCheatConfig] = useState<AntiCheatConfig>(initialAntiCheat);
  const [isSavingAntiCheat, setIsSavingAntiCheat] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchServerAntiCheat = async () => {
      try {
        const res = await apiClient.get<{ config: AntiCheatConfig }>(`/admin/exams/${olympiad.id}/anti-cheat`);
        if (res && res.config && isMounted) {
          setAntiCheatConfig(res.config);
          setBaselineAntiCheatConfig(res.config);
        }
      } catch {
        // Server endpoint mavjud bo'lmasa exam ichidagi config ishlatiladi
      }
    };
    fetchServerAntiCheat();
    return () => {
      isMounted = false;
    };
  }, [olympiad.id]);

  const isAntiCheatDirty = useMemo(() => {
    return JSON.stringify(antiCheatConfig) !== JSON.stringify(baselineAntiCheatConfig);
  }, [antiCheatConfig, baselineAntiCheatConfig]);

  const handleSaveAntiCheat = async () => {
    setIsSavingAntiCheat(true);
    try {
      const response = await apiClient.put<{ config: AntiCheatConfig }>(
        `/admin/exams/${encodeURIComponent(olympiad.id)}/anti-cheat`,
        antiCheatConfig
      );
      if (response && response.config) {
        setAntiCheatConfig(response.config);
        setBaselineAntiCheatConfig(response.config);
      }
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Anti-cheat sozlamalarini saqlashda xatolik:', err);
      alert(`❌ Saqlashda xatolik: ${err.message || 'Server xatosi'}`);
    } finally {
      setIsSavingAntiCheat(false);
    }
  };

  // ==========================================
  // UMUMIY SAQLASH (SAVE ALL SETTINGS)
  // ==========================================
  const handleSaveExam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (dateValidationMsg) {
      alert(`⚠️ Xatolik: ${dateValidationMsg}`);
      return;
    }

    if (!title.trim()) {
      alert('Musobaqa nomi bo‘sh bo‘lishi mumkin emas!');
      return;
    }

    setIsSaving(true);
    try {
      const questionsChanged =
        questionsBaseline !== null && JSON.stringify(questionsList) !== questionsBaseline;

      const updatedPayload: Partial<OlympiadItem> = {
        title: title.trim(),
        subject,
        format: 'online',
        status,
        image,
        description: description.trim(),
        organizer: organizer.trim(),
        targetGrades,
        price: 0, // Barcha olimpiadalar bepul (AGENTS.md qoidasi)
        isFreeForAll: true,
        startDate,
        endDate,
        resultsPublishDate,
        durationMinutes: Number(durationMinutes) || 60,
        isAlwaysOpen,
        showResultsToStudent,
        totalQuestions: questionsList.length,
        antiCheatConfig,
        ...(questionsChanged
          ? {
              questions: questionsList.map((q, idx) => ({
                id: q.id,
                content: q.content,
                question_text: q.content,
                points: q.points,
                orderNum: idx + 1,
                explanation: q.explanation || '',
                imageUrl: q.imageUrl || undefined,
                options: q.options?.map((text, index) => ({
                  id: q.optionIds?.[index] ?? String.fromCharCode(65 + index),
                  text,
                })),
                correctAnswer: q.correctAnswer,
                correct_answer: q.correctAnswer,
              })),
            }
          : {}),
      };

      await (onSave ?? updateOlympiad)(olympiad.id, updatedPayload);

      setQuestionsBaseline(JSON.stringify(questionsList));
      setBaselineAntiCheatConfig(antiCheatConfig);
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error('Save olympiad error:', err);
      alert(`❌ Saqlashda xatolik yuz berdi: ${err.message || 'Server xatosi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Musobaqalar ro'yxatiga qaytish
        </button>

        <div
          className={clsx(
            "p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {subject}
              </span>
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                  status === 'ochiq'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                )}
              >
                {status === 'ochiq' ? 'Ochiq (Faol)' : 'Yopiq'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">ID: {olympiad.id}</span>
            </div>
            <h1 className={clsx("text-xl md:text-2xl font-black", isDark ? "text-white" : "text-slate-900")}>
              {title || 'Nomsiz Olimpiada'}
            </h1>
            <p className="text-slate-500 text-[11px]">
              Sinflar: <span className="font-semibold text-blue-500">{targetGrades.join(', ')}-sinflar</span> • {questionsList.length} ta savol • {durationMinutes} daqiqa
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {savedSuccessMsg && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Saqlandi!
              </span>
            )}
            <Button
              onClick={() => handleSaveExam()}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20"
              leftIcon={isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isSaving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
            </Button>
          </div>
        </div>

        {/* 5 TA TAB TUGMALARI */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 dark:border-slate-800 -mx-1 px-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('basic')}
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all",
              activeTab === 'basic'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : isDark
                ? "text-slate-300 hover:bg-slate-800/60"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            1. Bazaviy sozlamalar
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all",
              activeTab === 'questions'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : isDark
                ? "text-slate-300 hover:bg-slate-800/60"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            2. Savollar ({questionsList.length})
          </button>

          <button
            onClick={() => setActiveTab('schedule_results')}
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all",
              activeTab === 'schedule_results'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : isDark
                ? "text-slate-300 hover:bg-slate-800/60"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            3. Vaqt va natija
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all",
              activeTab === 'participants'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : isDark
                ? "text-slate-300 hover:bg-slate-800/60"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            4. Ishtirokchilar
          </button>

          <button
            onClick={() => setActiveTab('anticheat')}
            className={clsx(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all",
              activeTab === 'anticheat'
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : isDark
                ? "text-slate-300 hover:bg-slate-800/60"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            5. Anti-Cheat nazorati
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1-BO'LIM: BAZAVIY NASTROYKA                                 */}
      {/* ========================================================= */}
      {activeTab === 'basic' && (
        <div
          className={clsx(
            "p-6 rounded-2xl border shadow-sm space-y-6 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h2 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
              Bazaviy Nastroyka (Asosiy parametrlar)
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Olimpiadaning sinfi, nomi, muqova rasmi va ochiq/yopiqlik holatini boshqaring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CHAP USTUN */}
            <div className="space-y-4">
              {/* Nomi */}
              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                  Olimpiada Nomi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Respublika Matematika Fan Olimpiadasi"
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                  required
                />
              </div>

              {/* Sinfi (Target Grades) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                    Qatnashuvchi Sinflar ({targetGrades.length} ta tanlangan) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllGrades}
                      className="text-[11px] font-bold text-blue-500 hover:underline"
                    >
                      Barchasini tanlash
                    </button>
                    <span className="text-slate-400">•</span>
                    <button
                      type="button"
                      onClick={clearGrades}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline"
                    >
                      Tozalash
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALL_GRADES.map((g) => {
                    const isSelected = targetGrades.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGrade(g)}
                        className={clsx(
                          "px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all border",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 scale-105"
                            : isDark
                            ? "bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-500"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {g}-sinf
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ochiq yoki Yopiqligi (Status) */}
              <div className="space-y-2">
                <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                  Olimpiada Holati (Ochiq yoki Yopiq) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('ochiq')}
                    className={clsx(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all",
                      status === 'ochiq'
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-sm"
                        : isDark
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Ochiq (Faol musobaqa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('yopiq')}
                    className={clsx(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all",
                      status === 'yopiq'
                        ? "bg-rose-500/10 border-rose-500 text-rose-600 shadow-sm"
                        : isDark
                        ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <X className="w-4 h-4 text-rose-500" />
                    <span>Yopiq (To'xtatilgan)</span>
                  </button>
                </div>
              </div>

              {/* Fan va Tashkilotchi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                    Fan Yo'nalishi
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                      isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Fizika">Fizika</option>
                    <option value="Kimyo">Kimyo</option>
                    <option value="Biologiya">Biologiya</option>
                    <option value="Informatika">Informatika</option>
                    <option value="Ona tili va adabiyot">Ona tili va adabiyot</option>
                    <option value="Ingliz tili">Ingliz tili</option>
                    <option value="Tarix">Tarix</option>
                    <option value="Geografiya">Geografiya</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                    Tashkilotchi
                  </label>
                  <input
                    type="text"
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className={clsx(
                      "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                      isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                </div>
              </div>

              {/* Tavsif */}
              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                  Olimpiada Haqida Tavsif
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Musobaqa qoidalari va ishtirok etish shartlari..."
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-blue-500",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                />
              </div>
            </div>

            {/* O'NG USTUN: RASMI (MUQOVA) */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide", isDark ? "text-slate-300" : "text-slate-700")}>
                  Olimpiada Muqova Rasmi *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://... rasm havolasi"
                    className={clsx(
                      "flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border outline-none",
                      isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                    )}
                  />
                  <label className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer text-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fayl</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Rasm prevyusi */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">Muqova ko'rinishi (Preview):</span>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-48 bg-slate-900 group">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    onError={(e) => {
                      (e.target as any).src = PRESET_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                    <span className="text-white font-extrabold text-sm drop-shadow">{title || 'Olimpiada'}</span>
                    <span className="text-slate-300 text-[11px] drop-shadow">{targetGrades.join(', ')}-sinflar uchun</span>
                  </div>
                </div>
              </div>

              {/* Tayyor rasmlar to'plami */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">Tezkor tavsiya etilgan muqovalar:</span>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImage(p.url)}
                      className={clsx(
                        "p-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all overflow-hidden",
                        image === p.url
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/30"
                          : isDark
                          ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <img src={p.url} alt={p.label} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-[10px] font-bold truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2-BO'LIM: SAVOLLAR                                         */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div
          className={clsx(
            "p-6 rounded-2xl border shadow-sm space-y-5 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
                Musobaqa Savollari Bazasi
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Jami {questionsList.length} ta savol • Maksimal ball: {totalPoints} ball
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer text-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>DOCX Import</span>
                <input type="file" accept=".docx" onChange={handleDocxImport} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleExportQuestionsJson}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Eksport (JSON)</span>
              </button>

              <Button
                onClick={handleOpenAddQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Yangi savol qo'shish
              </Button>
            </div>
          </div>

          {/* Qidiruv */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={questionsSearch}
                onChange={(e) => setQuestionsSearch(e.target.value)}
                placeholder="Savol matni bo'yicha qidirish..."
                className={clsx(
                  "w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none",
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
              />
            </div>
          </div>

          {/* Savollar ro'yxati */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="w-8 h-8 opacity-40 mx-auto mb-2" />
                <p className="font-bold text-xs">Savollar mavjud emas</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Yangi savol qo'shish yoki DOCX fayldan import qilish tugmasini bosing
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={clsx(
                    "p-4 rounded-2xl border transition-all space-y-3",
                    isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                          #{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {q.type === 'multiple_choice' ? 'Test' : 'Ochiq'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {q.points} ball
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          To'g'ri: {q.correctAnswer || (q as any).correct_answer || 'Belgilanmagan'}
                        </span>
                      </div>
                      <p className={clsx("text-sm font-semibold pt-1", isDark ? "text-white" : "text-slate-900")}>
                        {q.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Savol rasmi bo'lsa */}
                  {q.imageUrl && (
                    <div className="mt-2">
                      <img src={q.imageUrl} alt="Savol rasmi" className="max-h-40 rounded-xl border border-slate-200 object-contain" />
                    </div>
                  )}

                  {/* Variantlar */}
                  {q.type === 'multiple_choice' && q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      {q.options.map((optText, oIdx) => {
                        const optKey = q.optionIds?.[oIdx] || String.fromCharCode(65 + oIdx);
                        const isCorrect =
                          optKey === (q.correctAnswer || (q as any).correct_answer) ||
                          optText === (q.correctAnswer || (q as any).correct_answer);
                        return (
                          <div
                            key={oIdx}
                            className={clsx(
                              "px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border",
                              isCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                                : isDark
                                ? "bg-slate-800/40 border-slate-700/60 text-slate-300"
                                : "bg-white border-slate-200 text-slate-700"
                            )}
                          >
                            <span className="font-mono font-bold">{optKey})</span>
                            <span className="flex-1">{optText}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3-BO'LIM: VAQT VA NATIJA QISMI                             */}
      {/* ========================================================= */}
      {activeTab === 'schedule_results' && (
        <div
          className={clsx(
            "p-6 rounded-2xl border shadow-sm space-y-6 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h2 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
              Vaqt va Natija Qismi
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Imtihon boshlanish vaqti, tugash vaqti, davomiyligi hamda natijani e'lon qilish sanasini belgilang.
            </p>
          </div>

          {dateValidationMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dateValidationMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CHAP TOMON: Boshlanish va tugash vaqtlari */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Boshlanish Vaqti *</span>
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeInput(startDate)}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Ushbu vaqtdan boshlab ro'yxatdan o'tgan o'quvchilar imtihonni topshirishlari mumkin.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Tugash Vaqti *</span>
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeInput(endDate)}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Ushbu vaqtdan so'ng imtihonga kirish to'xtatiladi.
                </span>
              </div>

              {/* Doimiy ochiqlik rejimi */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className={clsx("font-bold text-xs", isDark ? "text-white" : "text-slate-900")}>
                    Cheksiz muddatli (Doimiy ochiq)
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Agar yoqilsa, tugash vaqti hisobga olinmaydi va doimiy ochiq qoladi
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isAlwaysOpen}
                  onChange={(e) => setIsAlwaysOpen(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* O'NG TOMON: Natijani e'lon qilish sanasi va Davomiyligi */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Natijani E'lon Qilish Sanasi *</span>
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeInput(resultsPublishDate)}
                  onChange={(e) => setResultsPublishDate(e.target.value)}
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Ushbu sanada barcha ishtirokchilarning rasmiy reytingi va ballari e'lon qilinadi.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className={clsx("font-bold text-xs uppercase tracking-wide flex items-center gap-1.5", isDark ? "text-slate-300" : "text-slate-700")}>
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Imtihon Davomiyligi (Daqiqada) *</span>
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className={clsx(
                    "w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border outline-none",
                    isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Har bir o'quvchiga testni yechish uchun beriladigan vaqt (masalan, 60 yoki 90 daqiqa).
                </span>
              </div>

              {/* Natijalarni talabaga ko'rsatish */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className={clsx("font-bold text-xs", isDark ? "text-white" : "text-slate-900")}>
                    Talabaga natijasini ko'rsatish
                  </span>
                  <p className="text-[11px] text-slate-400">
                    O'quvchi topshirgach darhol o'z ballini ko'rishi mumkinmi
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showResultsToStudent}
                  onChange={(e) => setShowResultsToStudent(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4-BO'LIM: ISHTIROKCHILAR                                    */}
      {/* ========================================================= */}
      {activeTab === 'participants' && (
        <div
          className={clsx(
            "p-6 rounded-2xl border shadow-sm space-y-5 transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className={clsx("text-base font-extrabold", isDark ? "text-white" : "text-slate-900")}>
                Ishtirokchilar va Natijalar Auditi
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Musobaqada qatnashgan va ro'yxatdan o'tgan o'quvchilar ro'yxati
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={fetchParticipants}
                variant="outline"
                className="text-xs font-bold"
                leftIcon={<RefreshCw className={clsx("w-3.5 h-3.5", participantsLoading && "animate-spin")} />}
              >
                Yangilash
              </Button>

              <Button
                onClick={handleExportParticipantsExcel}
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold"
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              >
                Excel (.xlsx) Eksport
              </Button>
            </div>
          </div>

          {/* Qidiruv va Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Ism, telefon yoki viloyat bo'yicha qidirish..."
                className={clsx(
                  "w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none",
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={participantStatusFilter}
                onChange={(e) => setParticipantStatusFilter(e.target.value as any)}
                className={clsx(
                  "px-3 py-2 rounded-xl text-xs font-semibold border outline-none",
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                <option value="all">Barcha ishtirokchilar</option>
                <option value="completed">Topshirganlar</option>
                <option value="in_progress">Jarayonda</option>
                <option value="disqualified">Diskvalifikatsiya</option>
              </select>
            </div>
          </div>

          {/* Jadval */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className={clsx("font-extrabold uppercase text-[10px] border-b", isDark ? "bg-slate-900 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200")}>
                <tr>
                  <th className="p-3">O'rin</th>
                  <th className="p-3">Ishtirokchi</th>
                  <th className="p-3">Sinf & Hudud</th>
                  <th className="p-3">Ball & Foiz</th>
                  <th className="p-3">Vaqt</th>
                  <th className="p-3">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {participantsLoading ? "Ishtirokchilar yuklanmoqda..." : "Hozircha ishtirokchilar mavjud emas"}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">#{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.name || 'Noma\'lum'}</div>
                        <div className="text-[10px] text-slate-400">{p.phone || '-'}</div>
                      </td>
                      <td className="p-3">
                        <div>{p.grade ? `${p.grade}-sinf` : '-'}</div>
                        <div className="text-[10px] text-slate-400">{p.region || p.school || '-'}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {p.score ?? 0} ball
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">({p.percentage ?? 0}%)</span>
                      </td>
                      <td className="p-3 font-mono">
                        {p.timeSpentMinutes ? `${p.timeSpentMinutes} daq` : '-'}
                      </td>
                      <td className="p-3">
                        {p.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Topshirdi
                          </span>
                        ) : p.status === 'disqualified' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Chetlatilgan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Jarayonda
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5-BO'LIM: ANTI-CHEAT NAZORATI                               */}
      {/* ========================================================= */}
      {activeTab === 'anticheat' && (
        <div className="space-y-4">
          <AntiCheatSettingsEditor
            config={antiCheatConfig}
            onChange={(newCfg) => setAntiCheatConfig(newCfg)}
            onSave={handleSaveAntiCheat}
            isSaving={isSavingAntiCheat}
            hasUnsavedChanges={isAntiCheatDirty}
          />
        </div>
      )}

      {/* SAVOL QO'SHISH / TAHRIRLASH MODALI */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? "Savolni Tahrirlash" : "Yangi Savol Qo'shish"}
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 font-sans text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              Savol Sharti / Matni *
            </label>
            <textarea
              rows={3}
              value={qContent}
              onChange={(e) => setQContent(e.target.value)}
              placeholder="Savol matnini kiriting..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
                Savol Turi
              </label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="multiple_choice">Ko'p tanlovli (Test)</option>
                <option value="open_text">Ochiq savol</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
                Ball
              </label>
              <input
                type="number"
                min={1}
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              Savol Rasmi (Ixtiyoriy havola)
            </label>
            <input
              type="text"
              value={qImageUrl}
              onChange={(e) => setQImageUrl(e.target.value)}
              placeholder="https://... rasm havolasi"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
            />
          </div>

          {/* Test variantlari */}
          {qType === 'multiple_choice' && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
                  Variantlar va To'g'ri Javobni Tanlang *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextChar = String.fromCharCode(65 + optionsList.length);
                    setOptionsList([...optionsList, { id: nextChar, text: '' }]);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  + Variant qo'shish
                </button>
              </div>

              <div className="space-y-2">
                {optionsList.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQCorrectAnswer(opt.id)}
                      className={clsx(
                        "w-8 h-8 rounded-lg font-mono font-black flex items-center justify-center transition-colors text-xs border",
                        qCorrectAnswer === opt.id
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      )}
                      title={`To'g'ri javob: ${opt.id}`}
                    >
                      {opt.id}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = [...optionsList];
                        newOpts[idx].text = e.target.value;
                        setOptionsList(newOpts);
                      }}
                      placeholder={`Variant ${opt.id} matni...`}
                      className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      required
                    />
                    {optionsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = optionsList.filter((_, i) => i !== idx);
                          setOptionsList(newOpts);
                          if (qCorrectAnswer === opt.id) {
                            setQCorrectAnswer(newOpts[0]?.id || 'A');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                To'g'ri javobni tanlash uchun harf tugmasi ustiga bosing (yashil rang to'g'ri javobni bildiradi).
              </p>
            </div>
          )}

          {qType === 'open_text' && (
            <div className="space-y-1.5">
              <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
                To'g'ri Javob Kaliti *
              </label>
              <input
                type="text"
                value={qCorrectAnswer}
                onChange={(e) => setQCorrectAnswer(e.target.value)}
                placeholder="To'g'ri javob matni..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-xs uppercase text-slate-700 dark:text-slate-300">
              Yechim Tushuntirishi (Ixtiyoriy)
            </label>
            <textarea
              rows={2}
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Nima uchun bu javob to'g'riligi haqida qisqacha izoh..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuestionModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" className="bg-blue-600 text-white font-bold">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
