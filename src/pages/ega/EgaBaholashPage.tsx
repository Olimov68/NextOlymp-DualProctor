import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useNationalExamStore } from '../../store/useNationalExamStore';
import { NationalExamItem } from '../../data/initialNationalExams';
import {
  raschService,
  RubricTask,
  RubricPart,
  DoubleBlindSubmission,
  AppealTicket
} from '../../services/raschAssessmentService';
import { RaschCalculator } from '../../components/baholash/RaschCalculator';
import { ReferenceTables } from '../../components/baholash/ReferenceTables';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';
import { useThemeStore } from '../../store/useThemeStore';
import { NationalExamFullEditor } from '../../components/ega/NationalExamFullEditor';
import {
  Award,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  Pin,
  Pencil,
  Trash2,
  Eye,
  Globe,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  X,
  Grid,
  List,
  ShieldCheck,
  RotateCcw,
  Save,
  HelpCircle,
  Calculator,
  Table,
  Check,
  Sparkles,
  Scale
} from 'lucide-react';

export const EgaBaholashPage: React.FC = () => {
  const {
    exams,
    addExam,
    updateExam,
    deleteExam,
    togglePinExam,
    toggleExamStatus
  } = useNationalExamStore();

  
  const [activeViewTab, setActiveViewTab] = useState<'exams' | 'appeals' | 'rasch_engine'>('exams');

  
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  
  const [viewingExam, setViewingExam] = useState<NationalExamItem | null>(null);

  
  const [appeals, setAppeals] = useState<AppealTicket[]>(() => raschService.getAppeals());
  const [appealNotes, setAppealNotes] = useState<Record<string, string>>({});

  
  const [rubrics, setRubrics] = useState<RubricTask[]>(() => raschService.getRubrics());
  const [savedSuccess, setSavedSuccess] = useState(false);

  
  const totalCount = exams.length;
  const openCount = useMemo(() => exams.filter((e) => e.status === 'ochiq').length, [exams]);
  const closedCount = useMemo(() => exams.filter((e) => e.status === 'yopiq').length, [exams]);
  const pendingAppealsCount = useMemo(() => appeals.filter((a) => a.status === 'pending').length, [appeals]);
  const totalRevenueSum = useMemo(() => exams.reduce((sum, e) => sum + e.totalRevenue, 0), [exams]);

  
  const filteredExams = useMemo(() => {
    const list = exams.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFormat = formatFilter === 'all' || e.format === formatFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesSubject = subjectFilter === 'all' || e.subject.toLowerCase() === subjectFilter.toLowerCase();

      return matchesSearch && matchesFormat && matchesStatus && matchesSubject;
    });

    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.id.localeCompare(b.id);
    });
  }, [exams, searchTerm, formatFilter, statusFilter, subjectFilter]);

  
  const handleExportExcel = () => {
    const dataToExport = filteredExams.map((e) => ({
      'Sinov ID': e.id,
      'Sinov Nomi': e.title,
      'Fani': e.subject,
      'Formati': e.format.toUpperCase(),
      'Baholash Usuli': 'Rasch Modeli (75 ballik standart shkala)',
      'Maksimal Ball': e.maxScore,
      'A Daraja Chegarasi': e.aThreshold,
      'Narxi (UZS)': e.price,
      'Holati': e.status === 'ochiq' ? 'Faol (Ochiq)' : 'Yopiq (Tugagan)',
      'Ro\'yxatdan o\'tganlar': e.registeredCount,
      'Topshirganlar': e.submittedCount,
      'To\'laganlar': e.paidCount,
      'Jami Tushum': e.totalRevenue,
      'Boshlanish Vaqti': e.startDate,
      'Tugash Vaqti': e.endDate,
      'Manzil': e.location || 'Online'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Milliy Sertifikat Sinovlari');
    XLSX.writeFile(workbook, `NextOlymp_Milliy_Sertifikat_Sinovlari_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  
  const handleAppealDecision = (appealId: string, status: 'accepted' | 'rejected') => {
    const notes = appealNotes[appealId] || (status === 'accepted' ? 'Apellyatsiya komissiyasi tomonidan tasdiqlandi va ball oshirildi.' : 'Etiroz asossiz deb topildi.');
    raschService.updateAppealStatus(appealId, status, notes);
    setAppeals(raschService.getAppeals());
  };

  
  const handleSaveRubrics = () => {
    raschService.saveRubrics(rubrics);
    setSavedSuccess(true);
  };

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  
  const [selectedExamForEdit, setSelectedExamForEdit] = useState<NationalExamItem | null>(null);

  
  const handleCreateNewExam = () => {
    const created = addExam({
      title: 'Yangi Milliy Sertifikat Sinovi',
      subject: 'Kimyo',
      format: 'online',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=600&q=80',
      price: 175000,
      status: 'ochiq',
      isPinned: false,
      startDate: '2025-10-15 09:00',
      endDate: '2025-10-15 12:30',
      registrationStartDate: '2025-09-20 09:00',
      registrationEndDate: '2025-10-14 23:59',
      description: 'BMBA davlat standarti va Rasch modeli asosida standartlashtirilgan milliy sertifikat sinovi.',
      organizer: 'BMBA & Next Olymp Ilmiy Ekspertlar Markazi',
      calculationMethod: 'rasch',
      maxScore: 75,
      aThreshold: 65,
      specType: 'spec_1',
      durationMinutes: 150,
      totalQuestions: 43
    });
    setSelectedExamForEdit(created);
  };

  
  if (selectedExamForEdit) {
    const activeItem = exams.find((e) => e.id === selectedExamForEdit.id) || selectedExamForEdit;
    return (
      <EgaLayout>
        <NationalExamFullEditor
          exam={activeItem}
          onBack={() => setSelectedExamForEdit(null)}
        />
      </EgaLayout>
    );
  }

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
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Milliy Sertifikat Sinovlari Boshqaruvi</span>
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              BMBA milliy sertifikat sinovlari, 75 ballik Rasch modeli va apellyatsiyalarni boshqarish
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel'da yuklab olish</span>
            </button>

            <button
              onClick={handleCreateNewExam}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sinov yaratish</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs transition-all flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jami Sinovlar</div>
              <div className="text-base font-black text-white mt-0.5 font-mono">{totalCount} ta</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs transition-all flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Ochiq (Faol)</div>
              <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">{openCount} ta</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs transition-all flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Yopiq (Tugagan)</div>
              <div className="text-base font-black text-slate-400 mt-0.5 font-mono">{closedCount} ta</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs transition-all flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Apellyatsiyalar</div>
              <div className="text-base font-black text-amber-300 mt-0.5 font-mono">{pendingAppealsCount} ta</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs transition-all flex items-center gap-2.5 col-span-2 sm:col-span-1",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jami Tushum</div>
              <div className="text-base font-black text-purple-300 mt-0.5 font-mono">{totalRevenueSum.toLocaleString()} UZS</div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto custom-scrollbar transition-colors",
            isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-100 border-slate-200"
          )}
        >
          <button
            type="button"
            onClick={() => setActiveViewTab('exams')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeViewTab === 'exams'
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-[#14244A]"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Milliy Sinovlar ({exams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('appeals')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeViewTab === 'appeals'
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-[#14244A]"
            )}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Apellyatsiyalar Navbati ({pendingAppealsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab('rasch_engine')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeViewTab === 'rasch_engine'
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-[#14244A]"
            )}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Rasch Baholash Moduli & Shkalalar</span>
          </button>
        </div>

        
        {activeViewTab === 'exams' && (
          <div className="space-y-4">
            
            <div
              className={clsx(
                "flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-colors",
                isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
              )}
            >
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#091024] border border-[#1A2F57] text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="all">Barcha formatlar</option>
                  <option value="online">Faqat Online</option>
                  <option value="offline">Faqat Offline</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#091024] border border-[#1A2F57] text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="ochiq">🟢 Faol (Ochiq)</option>
                  <option value="yopiq">🔴 Yakunlangan (Yopiq)</option>
                </select>

                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#091024] border border-[#1A2F57] text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="all">Barcha fanlar</option>
                  <option value="Kimyo">Kimyo</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Biologiya">Biologiya</option>
                  <option value="Fizika">Fizika</option>
                  <option value="Ona tili">Ona tili va adabiyot</option>
                  <option value="Ingliz tili">Ingliz tili</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Sinov nomi yoki fani bo'yicha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-[#091024] border border-[#1A2F57] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center p-0.5 rounded-lg bg-[#091024] border border-[#1A2F57]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      "p-1.5 rounded-md transition-colors cursor-pointer",
                      viewMode === 'grid' ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                    )}
                    title="Grid ko'rinishi"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={clsx(
                      "p-1.5 rounded-md transition-colors cursor-pointer",
                      viewMode === 'table' ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                    )}
                    title="Jadval ko'rinishi"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            
            {filteredExams.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#111827] border border-[#1E293B] space-y-3">
                <Award className="w-12 h-12 text-[#94A3B8] mx-auto opacity-60" />
                <h3 className="text-base font-bold text-[#F1F5F9]">Milliy sertifikat sinovlari topilmadi</h3>
                <p className="text-xs text-[#94A3B8]">Qidiruv yoki filtrlash parametrlarini o'zgartirib ko'ring</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExams.map((exam) => (
                  <Card
                    key={exam.id}
                    className="overflow-hidden bg-[#111827] border border-[#1E293B] hover:border-[#3B82F6]/50 transition-all duration-200 flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      
                      <div className="relative h-44 w-full overflow-hidden bg-[#0B1120]">
                        <img
                          src={exam.image}
                          alt={exam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

                        
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span
                            className={clsx(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                              exam.format === 'online'
                                ? "bg-[#3B82F6]/90 text-white border-[#3B82F6]"
                                : "bg-purple-600/90 text-white border-purple-500"
                            )}
                          >
                            {exam.format.toUpperCase()}
                          </span>

                          <span
                            className={clsx(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                              exam.status === 'ochiq'
                                ? "bg-[#10B981]/90 text-white border-[#10B981]"
                                : "bg-rose-600/90 text-white border-rose-500"
                            )}
                          >
                            {exam.status === 'ochiq' ? 'OCHIQ' : 'YOPIQ'}
                          </span>
                        </div>

                        
                        <button
                          onClick={() => togglePinExam(exam.id)}
                          className={clsx(
                            "absolute top-3 right-3 p-1.5 rounded-lg border transition-colors cursor-pointer",
                            exam.isPinned
                              ? "bg-[#F59E0B] text-black border-[#F59E0B]"
                              : "bg-[#111827]/80 text-[#94A3B8] border-[#1E293B] hover:text-white"
                          )}
                          title={exam.isPinned ? "To'g'nog'ichni olib tashlash" : "Yuqoriga qadash"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40">
                            {exam.subject}
                          </span>
                        </div>
                      </div>

                      
                      <div className="p-5 space-y-3">
                        
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#60A5FA] text-[10px] font-bold">
                          <Scale className="w-3 h-3 text-[#60A5FA]" />
                          <span>Rasch 75 ball shkalasi • A: 65+</span>
                        </div>

                        <h3 className="font-bold text-base text-[#F1F5F9] line-clamp-1 group-hover:text-[#3B82F6] transition-colors">
                          {exam.title}
                        </h3>

                        <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>

                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E293B] text-[11px]">
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Ro'yxatdan o'tganlar:</span>
                            <span className="font-bold text-[#60A5FA]">{exam.registeredCount} kishi</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Topshirganlar:</span>
                            <span className="font-bold text-[#34D399]">{exam.submittedCount} kishi</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Narx:</span>
                            <span className="font-bold text-[#F1F5F9]">{exam.price > 0 ? `${exam.price.toLocaleString()} UZS` : 'Bepul'}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Jami Tushum:</span>
                            <span className="font-bold text-[#F59E0B]">{exam.totalRevenue.toLocaleString()} UZS</span>
                          </div>
                        </div>

                        
                        <div className="pt-2 text-[11px] text-[#94A3B8] space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span>{exam.durationMinutes} daqiqa • {exam.totalQuestions} ta savol</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>{exam.startDate.split(' ')[0]} ({exam.startDate.split(' ')[1] || '09:00'})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    
                    <div className="p-4 pt-0 border-t border-[#1E293B] mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingExam(exam)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ko'rish"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>Ko'rish</span>
                        </button>

                        <button
                          onClick={() => setSelectedExamForEdit(exam)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>Tahrirlash</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleExamStatus(exam.id)}
                          className="px-2 py-1.5 rounded-lg bg-[#0B1120] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors cursor-pointer"
                          title={exam.status === 'ochiq' ? "Yopish" : "Ochish"}
                        >
                          {exam.status === 'ochiq' ? 'Yopish' : 'Ochish'}
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Haqiqatan ham "${exam.title}" sinovini o'chirmoqchimisiz?`)) {
                              deleteExam(exam.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#0B1120] hover:bg-[#EF4444]/20 border border-[#1E293B] text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              
              <div className="rounded-xl border border-[#1E293B] bg-[#111827] overflow-x-auto">
                <table className="w-full text-left text-xs text-[#94A3B8]">
                  <thead className="bg-[#0B1120] text-[#F1F5F9] uppercase text-[10px] font-bold border-b border-[#1E293B]">
                    <tr>
                      <th className="py-3.5 px-4">Sinov ID & Nomi</th>
                      <th className="py-3.5 px-4">Fani</th>
                      <th className="py-3.5 px-4">Format</th>
                      <th className="py-3.5 px-4">Holat</th>
                      <th className="py-3.5 px-4">Baholash Shkalasi</th>
                      <th className="py-3.5 px-4">Narxi</th>
                      <th className="py-3.5 px-4">Ishtirokchilar</th>
                      <th className="py-3.5 px-4">Tushum</th>
                      <th className="py-3.5 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-[#1E293B]/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#F1F5F9]">
                          <div className="flex items-center gap-2">
                            {exam.isPinned && <Pin className="w-3 h-3 text-[#F59E0B]" />}
                            <span>{exam.title}</span>
                          </div>
                          <span className="text-[10px] text-[#64748B] font-mono">{exam.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#FBBF24] font-semibold">{exam.subject}</td>
                        <td className="py-3.5 px-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            exam.format === 'online' ? "bg-[#3B82F6]/20 text-[#60A5FA]" : "bg-purple-500/20 text-purple-300"
                          )}>
                            {exam.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            exam.status === 'ochiq' ? "bg-[#10B981]/20 text-[#34D399]" : "bg-rose-500/20 text-rose-300"
                          )}>
                            {exam.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#60A5FA] font-medium">
                          Rasch (Maks. 75 ball / A: 65)
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#F1F5F9]">
                          {exam.price > 0 ? `${exam.price.toLocaleString()} UZS` : 'Bepul'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[#34D399] font-semibold">{exam.submittedCount}</span>
                          <span className="text-[#64748B]"> / {exam.registeredCount}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#F59E0B]">
                          {exam.totalRevenue.toLocaleString()} UZS
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingExam(exam)}
                              className="p-1.5 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white"
                              title="Ko'rish"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedExamForEdit(exam)}
                              className="p-1.5 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F59E0B]"
                              title="Tahrirlash"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Haqiqatan ham "${exam.title}" sinovini o'chirmoqchimisiz?`)) {
                                  deleteExam(exam.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#EF4444]/20 text-[#94A3B8] hover:text-[#EF4444]"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        
        {activeViewTab === 'appeals' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
                  <span>Nomzodlar Apellyatsiya E'tirozlari Navbati</span>
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Talabgorlar yozma ish yoki test ballaridan norozi bo'lib yuborgan apellyatsiya arizalarini ko'rib chiqish va ball qo'shish/rad etish
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-xs font-bold font-mono">
                Kutilayotgan arizalar: {pendingAppealsCount} ta
              </div>
            </div>

            <div className="space-y-4">
              {appeals.map((app) => (
                <Card key={app.id} className="p-6 bg-[#111827] border border-[#1E293B] space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                    <div>
                      <div className="text-xs font-mono text-[#94A3B8]">Ariza ID: {app.id} • Sana: {app.createdAt}</div>
                      <h4 className="text-sm font-bold text-[#F1F5F9] mt-0.5">{app.candidateName} — {app.examTitle}</h4>
                    </div>

                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold border",
                      app.status === 'accepted' && "bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30",
                      app.status === 'rejected' && "bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/30",
                      app.status === 'pending' && "bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30"
                    )}>
                      {app.status === 'accepted' ? 'Qanoatlantirilgan (+ball)' : app.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda (Ekspertiza)'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-2">
                    <div className="text-xs text-[#60A5FA] font-bold">
                      {app.taskNo}-topshiriq bo'yicha e'tiroz (Dastlabki ball: {app.originalScore} → Da'vo qilingan ball: {app.demandedScore})
                    </div>
                    <p className="text-xs text-[#94A3B8] italic">"{app.reason}"</p>
                  </div>

                  {app.reviewerNotes && (
                    <div className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] text-xs text-[#60A5FA]">
                      <span className="font-bold text-white">Ekspert xulosasi:</span> {app.reviewerNotes}
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="space-y-3 pt-2">
                      <Input
                        placeholder="Komissiya xulosasi va asoslantiruvchi izoh..."
                        value={appealNotes[app.id] || ''}
                        onChange={(e) => setAppealNotes({ ...appealNotes, [app.id]: e.target.value })}
                        className="text-xs bg-[#0B1120]"
                      />

                      <div className="flex items-center justify-end gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAppealDecision(app.id, 'rejected')}
                          leftIcon={<X className="w-3.5 h-3.5 text-[#EF4444]" />}
                          className="text-xs text-[#EF4444] hover:bg-[#EF4444]/10 border-rose-900"
                        >
                          Rad etish
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAppealDecision(app.id, 'accepted')}
                          leftIcon={<Check className="w-3.5 h-3.5 text-white" />}
                          className="text-xs font-bold bg-[#10B981] hover:bg-[#059669]"
                        >
                          Qanoatlantirish (+ball berish)
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        
        {activeViewTab === 'rasch_engine' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#111827] border border-[#1E293B] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#3B82F6]" />
                  <span>Rasch Modeli & BMBA Standart Shkalalari</span>
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Standartlashtirilgan ball formulalari, til fanlari (24→75 ball) va mutaxassislik fanlari konversiyasi
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveRubrics}
                leftIcon={<Save className="w-4 h-4" />}
                className="text-xs font-bold"
              >
                Konfiguratsiyani saqlash
              </Button>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center gap-2 text-[#34D399] text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Rasch mezonlari muvaffaqiyatli saqlandi!</span>
              </div>
            )}

            <RaschCalculator />
            <ReferenceTables />
          </div>
        )}

        
        {viewingExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="relative w-full max-w-xl rounded-2xl bg-[#111827] border border-[#1E293B] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#60A5FA]">{viewingExam.id}</span>
                  <h3 className="text-base font-bold text-[#F1F5F9]">{viewingExam.title}</h3>
                </div>
                <button
                  onClick={() => setViewingExam(null)}
                  className="p-1 rounded-lg hover:bg-[#1E293B] text-[#94A3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Baholash Metodi:</span>
                    <span className="font-bold text-[#34D399]">Rasch Modeli (BMBA 75 ball)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">A Daraja Chegarasi:</span>
                    <span className="font-bold text-[#60A5FA]">{viewingExam.aThreshold} ball (65+)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Maksimal Ball:</span>
                    <span className="font-bold text-[#F1F5F9]">{viewingExam.maxScore} ball</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Davomiyligi:</span>
                    <span className="font-bold text-[#F1F5F9]">{viewingExam.durationMinutes} daqiqa</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Savollar Soni:</span>
                    <span className="font-bold text-[#F1F5F9]">{viewingExam.totalQuestions} ta</span>
                  </div>
                </div>

                <p className="text-[#94A3B8] leading-relaxed">{viewingExam.description}</p>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1E293B]">
                <Button size="sm" variant="primary" onClick={() => setViewingExam(null)}>
                  Yopish
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
export default EgaBaholashPage;
