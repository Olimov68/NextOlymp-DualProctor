import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { OlympiadItem } from '../../data/initialOlympiads';
import { clsx } from 'clsx';
import {
  Trophy,
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
  Award,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Megaphone,
  CheckCircle,
  Sparkles,
  Download,
  SlidersHorizontal,
  Filter,
  EyeOff,
  UserX,
  AlertCircle
} from 'lucide-react';
import { OlympiadFullEditor } from '../../components/ega/OlympiadFullEditor';
import { submissionService } from '../../services/submissionService';
import { CertificateCanvas } from '../../components/certificate/CertificateCanvas';
import { Certificate } from '../../types';
import * as XLSX from 'xlsx';

export const EgaCompetitionsPage: React.FC = () => {
  const {
    olympiads,
    addOlympiad,
    updateOlympiad,
    deleteOlympiad,
    togglePinOlympiad,
    toggleOlympiadStatus
  } = useOlympiadStore();

  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  
  const [selectedOlympiadForEdit, setSelectedOlympiadForEdit] = useState<OlympiadItem | null>(null);

  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOlympiad, setEditingOlympiad] = useState<OlympiadItem | null>(null);
  const [viewingOlympiad, setViewingOlympiad] = useState<OlympiadItem | null>(null);
  const [viewParticipantTab, setViewParticipantTab] = useState<'registered' | 'in_progress' | 'completed' | 'top_ranked' | 'cheating' | 'all'>('registered');
  const [viewSearchTerm, setViewSearchTerm] = useState('');
  const [topRankFilter, setTopRankFilter] = useState<'all' | 'top10' | 'top20' | 'top30' | 'passed_only'>('all');
  const [minPassScore, setMinPassScore] = useState<number>(60);
  const [modalGradeFilter, setModalGradeFilter] = useState<string>('all');
  const [selectedCertForModal, setSelectedCertForModal] = useState<{ participant: any; olympiad: OlympiadItem } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Matematika');
  const [newFormat, setNewFormat] = useState<'online' | 'offline'>('online');
  const [newPrice, setNewPrice] = useState<number>(35000);
  const [newStatus, setNewStatus] = useState<'ochiq' | 'yopiq'>('ochiq');
  const [newStartDate, setNewStartDate] = useState('2025-09-20 10:00');
  const [newEndDate, setNewEndDate] = useState('2025-09-20 18:00');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');

  
  const totalCount = olympiads?.length || 0;
  const openCount = useMemo(() => (olympiads || []).filter((o) => (o?.status || 'ochiq') === 'ochiq').length, [olympiads]);
  const closedCount = useMemo(() => (olympiads || []).filter((o) => o?.status === 'yopiq').length, [olympiads]);
  const totalRevenueSum = useMemo(() => (olympiads || []).reduce((sum, o) => sum + (Number(o?.totalRevenue) || 0), 0), [olympiads]);
  const totalPaidCountSum = useMemo(() => (olympiads || []).reduce((sum, o) => sum + (Number(o?.paidCount) || 0), 0), [olympiads]);

  
  const filteredOlympiads = useMemo(() => {
    const list = (olympiads || []).filter((o) => {
      if (!o) return false;
      const title = (o.title || '').toLowerCase();
      const subject = (o.subject || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const location = (o.location || '').toLowerCase();
      const query = (searchTerm || '').toLowerCase();

      const matchesSearch =
        title.includes(query) ||
        subject.includes(query) ||
        id.includes(query) ||
        location.includes(query);

      const oFormat = o.format || 'online';
      const oStatus = o.status || 'ochiq';
      const matchesFormat = formatFilter === 'all' || oFormat === formatFilter;
      const matchesStatus = statusFilter === 'all' || oStatus === statusFilter;

      return matchesSearch && matchesFormat && matchesStatus;
    });

    
    return list.sort((a, b) => {
      if (a?.isPinned && !b?.isPinned) return -1;
      if (!a?.isPinned && b?.isPinned) return 1;
      return 0;
    });
  }, [olympiads, searchTerm, formatFilter, statusFilter]);

  
  const formatUZS = (val?: number) => {
    const num = Number(val || 0);
    if (!num || num === 0) return t('Bepul');
    return `${num.toLocaleString()} UZS`;
  };

  
  const handleExportExcel = () => {
    const exportData = filteredOlympiads.map((o, idx) => ({
      '№': idx + 1,
      [t('ID')]: o.id || '',
      [t('Olimpiada Nomi')]: o.title || '',
      [t('Fan')]: t(o.subject || ''),
      [t('Formati')]: (o.format || 'online').toUpperCase(),
      [t('Narxi')]: !o.price || o.price === 0 ? t('Bepul') : `${o.price} UZS`,
      [t('Holati')]: (o.status || 'ochiq') === 'ochiq' ? t('Ochiq (Faol)') : t('Yopiq'),
      [t('Ro\'yxatdan o\'tganlar')]: o.registeredCount || 0,
      [t('Topshirganlar')]: o.submittedCount || 0,
      [t('To\'lov qilganlar')]: o.paidCount || 0,
      [t('Jami tushum')]: `${o.totalRevenue || 0} UZS`,
      [t('Boshlanish vaqti')]: o.startDate || '',
      [t('Tugash vaqti')]: o.endDate || '',
      [t('Manzil (Offline)')]: o.location || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OLIMPIADALAR');
    XLSX.writeFile(workbook, 'Olimpiadalar_ruyhati.xlsx');
  };

  
  const handleCreateNewOlympiad = () => {
    const created = addOlympiad({
      title: 'Yangi Olimpiada',
      subject: 'Matematika',
      format: 'online',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      price: 35000,
      status: 'ochiq',
      isPinned: false,
      startDate: '2025-10-01 10:00',
      endDate: '2025-10-01 18:00',
      registrationStartDate: '2025-09-15 09:00',
      registrationEndDate: '2025-09-30 23:59',
      description: 'Musobaqa haqida batafsil ma\'lumot...',
      organizer: 'Ibn Sino Kengashi'
    });
    setSelectedOlympiadForEdit(created);
  };

  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOlympiad || !editingOlympiad.title.trim()) return;

    updateOlympiad(editingOlympiad.id, {
      title: editingOlympiad.title.trim(),
      subject: editingOlympiad.subject,
      format: editingOlympiad.format,
      price: Number(editingOlympiad.price) || 0,
      status: editingOlympiad.status,
      startDate: editingOlympiad.startDate,
      endDate: editingOlympiad.endDate,
      description: editingOlympiad.description,
      location: editingOlympiad.format === 'offline' ? editingOlympiad.location : undefined,
      image: editingOlympiad.image
    });

    setEditingOlympiad(null);
  };

  
  if (selectedOlympiadForEdit) {
    const activeItem = olympiads.find((o) => o.id === selectedOlympiadForEdit.id) || selectedOlympiadForEdit;
    return (
      <EgaLayout>
        <OlympiadFullEditor
          olympiad={activeItem}
          onBack={() => setSelectedOlympiadForEdit(null)}
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
              <Trophy className="w-4 h-4 text-amber-400" />
              {t("Olimpiadalar Boshqaruvi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Barcha onlayn va oflayn olimpiadalarni boshqarish, ishtirokchilar va tushumlarni ko'rish")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da yuklab olish")}</span>
            </button>

            <button
              onClick={handleCreateNewOlympiad}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Olimpiada yaratish")}</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Jami Olimpiadalar")}</div>
              <div className="text-lg font-black text-white mt-0.5 font-mono">{totalCount} {t("ta")}</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Ochiq (Faol)")}</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">{openCount} {t("ta ochiq")}</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Yopiq (Tugagan)")}</div>
              <div className="text-lg font-black text-slate-400 mt-0.5 font-mono">{closedCount} {t("ta yopiq")}</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("Jami Tushum")}</div>
              <div className="text-sm font-black text-blue-300 mt-0.5 font-mono truncate">{totalRevenueSum.toLocaleString()} UZS</div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t("To'lov Qilganlar")}</div>
              <div className="text-lg font-black text-purple-300 mt-0.5 font-mono">{totalPaidCountSum.toLocaleString()} {t("kishi")}</div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs outline-none border font-semibold",
                isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{t("Barcha formatlar (Online & Offline)")}</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs outline-none border font-semibold",
                isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{t("Barcha holatlar")}</option>
              <option value="ochiq">{t("Ochiq (Faol)")}</option>
              <option value="yopiq">{t("Yopiq (Tugagan)")}</option>
            </select>
          </div>

          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={t("Olimpiada nomi bo'yicha qidirish...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={clsx(
                  "w-full rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none transition-all border",
                  isDark
                    ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>

            
            <div className={clsx("flex items-center p-1 rounded-lg border", isDark ? "bg-[#091024] border-[#162747]" : "bg-slate-100 border-slate-200")}>
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1 rounded cursor-pointer transition-all",
                  viewMode === 'grid' ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                )}
                title="Karta ko'rinishi"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  "p-1 rounded cursor-pointer transition-all",
                  viewMode === 'table' ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                )}
                title="Jadval ko'rinishi"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOlympiads.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400">
                {t("Olimpiadalar topilmadi")}
              </div>
            ) : (
              filteredOlympiads.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "rounded-2xl border shadow-sm transition-all overflow-hidden flex flex-col justify-between group",
                    item.isPinned
                      ? isDark
                        ? "bg-[#0E1A38] border-amber-500/60 shadow-amber-500/5"
                        : "bg-amber-50/40 border-amber-400 shadow-amber-500/5"
                      : isDark
                      ? "bg-[#0D1832] border-[#182A4D] hover:border-[#223B6C]"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  )}
                >
                  
                  <div className="relative h-36 w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1832] via-transparent to-black/40" />

                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs flex items-center gap-1",
                          item.format === 'online'
                            ? "bg-blue-600/90 text-white border-blue-400"
                            : "bg-purple-600/90 text-white border-purple-400"
                        )}
                      >
                        {item.format === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {item.format}
                      </span>

                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shadow-xs",
                          item.status === 'ochiq'
                            ? "bg-emerald-500/90 text-white border-emerald-400"
                            : "bg-rose-500/90 text-white border-rose-400"
                        )}
                      >
                        {item.status === 'ochiq' ? t("Ochiq") : t("Yopiq")}
                      </span>
                    </div>

                    
                    <button
                      onClick={() => togglePinOlympiad(item.id)}
                      className={clsx(
                        "absolute top-3 right-3 p-1.5 rounded-lg border backdrop-blur-md transition-all cursor-pointer",
                        item.isPinned
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-110"
                          : "bg-black/50 text-slate-300 border-white/20 hover:text-amber-400"
                      )}
                      title={item.isPinned ? t("Qadab qo'yilgan") : t("Qadab qo'yish")}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    
                    <div className="absolute bottom-2 left-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                        {t(item.subject)}
                      </span>
                    </div>
                  </div>

                  
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className={clsx("text-sm font-bold line-clamp-2", isDark ? "text-white" : "text-slate-900")}>
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                      {item.location && (
                        <div className="flex items-center gap-1 text-[10px] text-purple-300 mt-1 font-medium">
                          <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      )}
                    </div>

                    
                    <div className={clsx("p-2.5 rounded-xl border grid grid-cols-2 gap-2 text-[11px]", isDark ? "bg-[#091024] border-[#182A4D]" : "bg-slate-50 border-slate-200")}>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{t("Ro'yxatdan o'tganlar")}</div>
                        <div className="font-bold font-mono text-cyan-400 mt-0.5">{(item.registeredCount || 0).toLocaleString()} kishi</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{t("Topshirganlar")}</div>
                        <div className="font-bold font-mono text-emerald-400 mt-0.5">{(item.submittedCount || 0).toLocaleString()} kishi</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{t("To'laganlar")}</div>
                        <div className="font-bold font-mono text-purple-300 mt-0.5">{(item.paidCount || 0).toLocaleString()} kishi</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-semibold">{t("Jami Tushum")}</div>
                        <div className="font-bold font-mono text-amber-400 text-xs mt-0.5 whitespace-nowrap inline-block">{formatUZS(item.totalRevenue)}</div>
                      </div>
                    </div>

                    
                    <div className="flex items-center justify-between pt-2 border-t border-[#182A4D] gap-2">
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {item.startDate ? String(item.startDate).split(' ')[0] : '2025-10-01'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingOlympiad(item)}
                          className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          title={t("Ko'rish")}
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>{t("Ko'rish")}</span>
                        </button>

                        <button
                          onClick={() => setSelectedOlympiadForEdit(item)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          title={t("Tahrirlash")}
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>{t("Tahrirlash")}</span>
                        </button>

                        <button
                          onClick={() => deleteOlympiad(item.id)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold cursor-pointer transition-all"
                          title={t("O'chirish")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        
        {viewMode === 'table' && (
          <div
            className={clsx(
              "rounded-xl border overflow-hidden shadow-sm transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={clsx(
                    "text-[11px] uppercase tracking-wider border-b font-semibold whitespace-nowrap",
                    isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">№</th>
                    <th className="py-2.5 px-3">{t("Olimpiada Nomi")}</th>
                    <th className="py-2.5 px-3">{t("Formati")}</th>
                    <th className="py-2.5 px-3">{t("Narxi")}</th>
                    <th className="py-2.5 px-3">{t("Ro'yxatdan o'tganlar")}</th>
                    <th className="py-2.5 px-3">{t("Topshirganlar")}</th>
                    <th className="py-2.5 px-3">{t("To'laganlar")}</th>
                    <th className="py-2.5 px-3">{t("Jami Tushum")}</th>
                    <th className="py-2.5 px-3">{t("Holati")}</th>
                    <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {filteredOlympiads.map((item, idx) => (
                    <tr key={item.id} className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}>
                      <td className="py-3 px-3 text-center text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-white">
                          {item.isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                          <span>{item.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{t(item.subject || '')} · {item.startDate || '-'}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border uppercase", item.format === 'online' ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-purple-500/20 text-purple-300 border-purple-500/40")}>
                          {item.format || 'online'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {formatUZS(item.price)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        {(item.registeredCount || 0).toLocaleString()} kishi
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {(item.submittedCount || 0).toLocaleString()} kishi
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {(item.paidCount || 0).toLocaleString()} kishi
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {formatUZS(item.totalRevenue)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", item.status === 'ochiq' ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/60" : "bg-rose-950/70 text-rose-400 border-rose-800/60")}>
                          {item.status === 'ochiq' ? t("Ochiq") : t("Yopiq")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setViewingOlympiad(item)} className="px-2 py-1 bg-slate-500/10 text-slate-300 border border-slate-500/30 rounded text-[11px] font-semibold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> <span>{t("Ko'rish")}</span>
                          </button>
                          <button onClick={() => setSelectedOlympiadForEdit(item)} className="px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1">
                            <Pencil className="w-3 h-3 text-amber-400" /> <span>{t("Tahrirlash")}</span>
                          </button>
                          <button onClick={() => deleteOlympiad(item.id)} className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded text-[11px]">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {editingOlympiad && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Pencil className="w-4 h-4 text-blue-500" />
                  {t("Olimpiadani tahrirlash")} ({editingOlympiad.id})
                </h3>
                <button onClick={() => setEditingOlympiad(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Olimpiada Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOlympiad.title}
                    onChange={(e) => setEditingOlympiad({ ...editingOlympiad, title: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Formati *")}
                    </label>
                    <select
                      value={editingOlympiad.format}
                      onChange={(e) => setEditingOlympiad({ ...editingOlympiad, format: e.target.value as any })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-bold",
                        isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Holati")}
                    </label>
                    <select
                      value={editingOlympiad.status}
                      onChange={(e) => setEditingOlympiad({ ...editingOlympiad, status: e.target.value as any })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-bold",
                        isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="ochiq">{t("Ochiq (Faol)")}</option>
                      <option value="yopiq">{t("Yopiq")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Narxi (UZS)")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingOlympiad.price}
                      onChange={(e) => setEditingOlympiad({ ...editingOlympiad, price: Number(e.target.value) })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono",
                        isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Fan")}
                    </label>
                    <input
                      type="text"
                      value={editingOlympiad.subject}
                      onChange={(e) => setEditingOlympiad({ ...editingOlympiad, subject: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tavsif")}
                  </label>
                  <textarea
                    rows={3}
                    value={editingOlympiad.description}
                    onChange={(e) => setEditingOlympiad({ ...editingOlympiad, description: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border resize-none",
                      isDark ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white" : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingOlympiad(null)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                      isDark ? "bg-[#162748] text-slate-300 border-[#1E365E]" : "bg-slate-100 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {toastMessage && (
          <div className="fixed top-6 right-6 z-[9999] bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs">{toastMessage}</span>
          </div>
        )}

        
        {viewingOlympiad && (() => {
          const allParticipants = submissionService.getOlympiadAllParticipants(viewingOlympiad.id);
          const isResultsPublished = !!viewingOlympiad.showResultsToStudent;

          const registeredList = allParticipants.filter((p) => p.status === 'registered');
          const inProgressList = allParticipants.filter((p) => p.status === 'in_progress');
          const completedList = allParticipants.filter((p) => p.status === 'completed' || p.status === 'disqualified');
          const cheatingList = allParticipants.filter((p) => (p.antiCheatViolations?.totalViolations || 0) > 0 || p.status === 'disqualified');
          
          const passedCount = completedList.filter((p) => (p.percentage || 0) >= minPassScore || (p.score || 0) >= minPassScore).length;

          
          let displayList: any[] = [];

          if (viewParticipantTab === 'registered') {
            displayList = registeredList;
          } else if (viewParticipantTab === 'in_progress') {
            displayList = inProgressList;
          } else if (viewParticipantTab === 'completed') {
            displayList = completedList;
          } else if (viewParticipantTab === 'top_ranked') {
            
            let sorted = [...completedList].sort((a, b) => ((b.score || 0) - (a.score || 0)) || ((a.timeSpentMinutes || 0) - (b.timeSpentMinutes || 0)));
            if (topRankFilter === 'top10') {
              sorted = sorted.slice(0, 10);
            } else if (topRankFilter === 'top20') {
              sorted = sorted.slice(0, 20);
            } else if (topRankFilter === 'top30') {
              sorted = sorted.slice(0, 30);
            } else if (topRankFilter === 'passed_only') {
              sorted = sorted.filter((p) => (p.percentage || 0) >= minPassScore || (p.score || 0) >= minPassScore);
            }
            displayList = sorted;
          } else if (viewParticipantTab === 'cheating') {
            displayList = cheatingList;
          } else {
            displayList = allParticipants;
          }

          
          if (modalGradeFilter !== 'all') {
            displayList = displayList.filter((p) => String(p.grade) === modalGradeFilter);
          }

          
          if (viewSearchTerm.trim()) {
            const q = viewSearchTerm.toLowerCase();
            displayList = displayList.filter((p) =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.phone && p.phone.includes(q)) ||
              (p.region && p.region.toLowerCase().includes(q)) ||
              (p.school && p.school.toLowerCase().includes(q)) ||
              (p.id && p.id.toLowerCase().includes(q))
            );
          }

          
          const handleToggleResultsPublish = () => {
            const newStatus = !isResultsPublished;
            const updated = { ...viewingOlympiad, showResultsToStudent: newStatus };
            updateOlympiad(viewingOlympiad.id, { showResultsToStudent: newStatus });
            setViewingOlympiad(updated);
            showToast(
              newStatus
                ? "Natijalar muvaffaqiyatli e'lon qilindi! Barcha o'quvchilarga ko'rinadi."
                : "Natijalar yashirildi (faqat admin ko'ra oladi)."
            );
          };

          
          const handleDisqualify = (participantId: string, participantName: string) => {
            if (window.confirm(`${participantName} ismli ishtirokchini chetlatishni (diskvalifikatsiya) tasdiqlaysizmi?`)) {
              submissionService.disqualifyParticipant(participantId, viewingOlympiad.id, "Anti-cheat qoidabuzarlik");
              showToast(`${participantName} musobaqadan chetlatildi.`);
              setViewingOlympiad({ ...viewingOlympiad }); 
            }
          };

          const handleWarn = (participantName: string) => {
            showToast(`${participantName} ga rasmiy ogohlantirish yuborildi!`);
          };

          
          const handleExportModalExcel = () => {
            const exportData = displayList.map((p, idx) => {
              const base: any = {
                '№': idx + 1,
                'Ishtirokchi ID': p.id,
                'F.I.Sh.': p.name,
                'Telefon': p.phone,
                'Viloyat': p.region,
                'Maktab': p.school,
                'Sinf': `${p.grade}-sinf`,
                'Holati': p.status === 'completed' ? 'Topshirgan' : p.status === 'in_progress' ? 'Hozir yechmoqda' : p.status === 'disqualified' ? 'Chetlatilgan' : 'Ro\'yxatdan o\'tgan'
              };

              if (viewParticipantTab === 'top_ranked' || viewParticipantTab === 'completed') {
                base['O\'rin'] = p.rank ? `${p.rank}-o'rin` : `${idx + 1}-o'rin`;
                base['To\'plagan ball'] = p.score ?? '-';
                base['Foiz (%)'] = p.percentage ? `${p.percentage}%` : '-';
                base['To\'g\'ri javoblar'] = p.correctAnswers ? `${p.correctAnswers} / ${p.totalQuestions || 30}` : '-';
                base['Sarflangan vaqt (min)'] = p.timeSpentMinutes ?? '-';
                base['Diplom / Sertifikat'] = p.certificateType || '-';
                base['O\'tish holati'] = (p.percentage >= minPassScore || p.score >= minPassScore) ? "Muvaffaqiyatli o'tdi" : "O'ta olmadi";
              } else if (viewParticipantTab === 'in_progress') {
                base['Jarayon'] = p.currentQuestion ? `${p.currentQuestion} / ${p.totalQuestions || 30}-savolda` : 'Yechmoqda';
                base['Sarflangan vaqt'] = `${p.timeSpentMinutes || 15} daqiqa`;
              } else if (viewParticipantTab === 'cheating') {
                base['Tabdan chiqishlar'] = p.antiCheatViolations?.tabSwitches || 0;
                base['Kamera buzilishlari'] = p.antiCheatViolations?.faceAbsence || 0;
                base['Jami qoidabuzarliklar'] = p.antiCheatViolations?.totalViolations || 0;
              } else {
                base['Ro\'yxatdan o\'tgan vaqti'] = p.registeredAt || '-';
                base['To\'lov holati'] = 'To\'langan (Tasdiqlangan)';
              }

              return base;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'ISHTIROKCHILAR');
            XLSX.writeFile(workbook, `${viewingOlympiad.id}_${viewParticipantTab}_Ishtirokchilar.xlsx`);
          };

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
              <div
                className={clsx(
                  "rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 border transition-colors max-h-[94vh] overflow-y-auto custom-scrollbar flex flex-col",
                  isDark ? "bg-[#0B152B] border-[#1E3768]" : "bg-white border-slate-200"
                )}
              >
                
                <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={clsx("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                        <Eye className="w-5 h-5 text-amber-400" />
                        <span>{viewingOlympiad.title}</span>
                      </h3>
                      <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
                        {viewingOlympiad.id}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        {viewingOlympiad.subject}
                      </span>
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-md font-bold uppercase",
                        viewingOlympiad.status === 'ochiq' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      )}>
                        {viewingOlympiad.status === 'ochiq' ? "Ochiq (Aktiv)" : "Yopiq (Tugagan)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {t("Ro'yxatdan o'tganlar, jonli qatnashayotganlar, g'oliblar va anti-cheat nazorati markazi")}
                    </p>
                  </div>

                  <button
                    onClick={() => setViewingOlympiad(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                
                <div className={clsx(
                  "p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all",
                  isResultsPublished
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                )}>
                  <div className="flex items-center gap-2.5">
                    {isResultsPublished ? (
                      <Megaphone className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{isResultsPublished ? "Natijalar E'lon Qilingan 📢" : "Natijalar Hali E'lon Qilinmagan (Yashirin rejim) 🔒"}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {isResultsPublished
                          ? "Barcha ishtirokchilar o'z kabinetida natijalarni, to'plagan ballarini va diplom/sertifikatlarini ko'rishlari mumkin."
                          : "O'quvchilar testni tugatgan bo'lsa ham umumiy natijalar va g'oliblar ro'yxati e'lon qilinmaguncha ko'rinmaydi."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleResultsPublish}
                    className={clsx(
                      "px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-md flex items-center gap-1.5 shrink-0",
                      isResultsPublished
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    )}
                  >
                    {isResultsPublished ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Natijalarni Yashirish</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Natijalarni E'lon Qilish</span>
                      </>
                    )}
                  </button>
                </div>

                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  
                  <div
                    onClick={() => setViewParticipantTab('registered')}
                    className={clsx(
                      "p-3 rounded-xl border text-center cursor-pointer transition-all",
                      viewParticipantTab === 'registered' ? "bg-blue-600/25 border-blue-400 shadow-md scale-[1.02]" : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15"
                    )}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("1. Ro'yxatdan o'tganlar")}</div>
                    <div className="font-black text-blue-400 text-base font-mono mt-0.5">
                      {registeredList.length} <span className="text-[10px] text-slate-400">ta</span>
                    </div>
                  </div>

                  
                  <div
                    onClick={() => setViewParticipantTab('in_progress')}
                    className={clsx(
                      "p-3 rounded-xl border text-center cursor-pointer transition-all",
                      viewParticipantTab === 'in_progress' ? "bg-amber-600/25 border-amber-400 shadow-md scale-[1.02]" : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
                    )}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("2. Hozir Yechmoqda")}</div>
                    <div className="font-black text-amber-400 text-base font-mono mt-0.5 flex items-center justify-center gap-1">
                      {inProgressList.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                      {inProgressList.length} <span className="text-[10px] text-slate-400">ta</span>
                    </div>
                  </div>

                  
                  <div
                    onClick={() => setViewParticipantTab('completed')}
                    className={clsx(
                      "p-3 rounded-xl border text-center cursor-pointer transition-all",
                      viewParticipantTab === 'completed' ? "bg-emerald-600/25 border-emerald-400 shadow-md scale-[1.02]" : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                    )}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("3. Topshirganlar")}</div>
                    <div className="font-black text-emerald-400 text-base font-mono mt-0.5">
                      {completedList.length} <span className="text-[10px] text-slate-400">ta</span>
                    </div>
                  </div>

                  
                  <div
                    onClick={() => setViewParticipantTab('top_ranked')}
                    className={clsx(
                      "p-3 rounded-xl border text-center cursor-pointer transition-all",
                      viewParticipantTab === 'top_ranked' ? "bg-purple-600/25 border-purple-400 shadow-md scale-[1.02]" : "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15"
                    )}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("4. O'tganlar / Top")}</div>
                    <div className="font-black text-purple-300 text-base font-mono mt-0.5">
                      {passedCount} <span className="text-[10px] text-slate-400">ta</span>
                    </div>
                  </div>

                  
                  <div
                    onClick={() => setViewParticipantTab('cheating')}
                    className={clsx(
                      "p-3 rounded-xl border text-center cursor-pointer transition-all col-span-2 sm:col-span-1",
                      viewParticipantTab === 'cheating' ? "bg-rose-600/25 border-rose-400 shadow-md scale-[1.02]" : "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15"
                    )}
                  >
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{t("5. Cheating & Qoida")}</div>
                    <div className="font-black text-rose-400 text-base font-mono mt-0.5">
                      {cheatingList.length} <span className="text-[10px] text-slate-400">ta</span>
                    </div>
                  </div>
                </div>

                
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                  
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 border border-white/5 w-full md:w-auto overflow-x-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setViewParticipantTab('registered')}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                        viewParticipantTab === 'registered' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Ro'yxatdan o'tganlar ({registeredList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewParticipantTab('in_progress')}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                        viewParticipantTab === 'in_progress' ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Hozir yechmoqda ({inProgressList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewParticipantTab('completed')}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                        viewParticipantTab === 'completed' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Topshirganlar ({completedList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewParticipantTab('top_ranked')}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                        viewParticipantTab === 'top_ranked' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Award className="w-3.5 h-3.5 text-amber-300" />
                      <span>Saralanganlar / Top Reyting</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewParticipantTab('cheating')}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                        viewParticipantTab === 'cheating' ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Cheating ({cheatingList.length})</span>
                    </button>
                  </div>

                  
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="F.I.Sh., tel yoki maktab..."
                        value={viewSearchTerm}
                        onChange={(e) => setViewSearchTerm(e.target.value)}
                        className={clsx(
                          "w-full rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none border transition-colors",
                          isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                        )}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExportModalExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0"
                      title="Ishtirokchilar ro'yxatini Excel'da yuklash"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                  </div>
                </div>

                
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filtr:</span>
                    </span>

                    
                    <select
                      value={modalGradeFilter}
                      onChange={(e) => setModalGradeFilter(e.target.value)}
                      className={clsx(
                        "rounded-lg px-2 py-1 text-xs outline-none border font-semibold",
                        isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    >
                      <option value="all">Barcha sinflar (1-11)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                        <option key={g} value={String(g)}>{g}-sinf</option>
                      ))}
                    </select>

                    
                    {viewParticipantTab === 'top_ranked' && (
                      <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => setTopRankFilter('all')}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                            topRankFilter === 'all' ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Barchasi
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopRankFilter('top10')}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                            topRankFilter === 'top10' ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Top 10 talik 🥇
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopRankFilter('top20')}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                            topRankFilter === 'top20' ? "bg-slate-300 text-slate-950 font-black" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Top 20 talik 🥈
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopRankFilter('top30')}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                            topRankFilter === 'top30' ? "bg-amber-700 text-white font-black" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Top 30 talik 🥉
                        </button>
                        <button
                          type="button"
                          onClick={() => setTopRankFilter('passed_only')}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                            topRankFilter === 'passed_only' ? "bg-emerald-600 text-white font-black" : "text-slate-400 hover:text-white"
                          )}
                        >
                          Faqat O'tganlar (≥{minPassScore} ball)
                        </button>
                      </div>
                    )}
                  </div>

                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">O'tish bali:</span>
                    <div className="flex items-center gap-1">
                      {[50, 60, 70, 80].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setMinPassScore(score)}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all",
                            minPassScore === score
                              ? "bg-emerald-500 text-slate-950 border-emerald-400"
                              : "bg-black/30 text-slate-400 border-white/10 hover:text-white"
                          )}
                        >
                          {score}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                
                <div className="rounded-xl border overflow-hidden border-[#182A4D] flex-1">
                  <div className="overflow-x-auto custom-scrollbar max-h-[380px]">
                    <table className="w-full text-left text-xs">
                      <thead
                        className={clsx(
                          "text-[11px] uppercase tracking-wider border-b font-semibold whitespace-nowrap sticky top-0 z-10",
                          isDark ? "bg-[#101E3C] text-slate-400 border-[#182A4D]" : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">
                            {viewParticipantTab === 'top_ranked' ? "O'rin" : "№"}
                          </th>
                          <th className="py-2.5 px-3">Ishtirokchi (F.I.Sh.)</th>
                          <th className="py-2.5 px-3">Hudud / Maktab</th>
                          <th className="py-2.5 px-3">Sinf</th>

                          
                          {viewParticipantTab === 'registered' && (
                            <>
                              <th className="py-2.5 px-3">Ro'yxatdan O'tgan Vaqti</th>
                              <th className="py-2.5 px-3">To'lov Holati</th>
                              <th className="py-2.5 px-3 text-right">Imtihon Holati</th>
                            </>
                          )}

                          {viewParticipantTab === 'in_progress' && (
                            <>
                              <th className="py-2.5 px-3">Jonli Jarayon</th>
                              <th className="py-2.5 px-3">Sarflangan Vaqt</th>
                              <th className="py-2.5 px-3">Aloqa & Anti-Cheat</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </>
                          )}

                          {(viewParticipantTab === 'completed' || viewParticipantTab === 'top_ranked' || viewParticipantTab === 'all') && (
                            <>
                              <th className="py-2.5 px-3">Natija (To'g'ri / Ball)</th>
                              <th className="py-2.5 px-3">Foiz</th>
                              <th className="py-2.5 px-3">Sarflangan Vaqt</th>
                              <th className="py-2.5 px-3">O'tish Holati</th>
                              <th className="py-2.5 px-3 text-right">Diplom / Sertifikat</th>
                            </>
                          )}

                          {viewParticipantTab === 'cheating' && (
                            <>
                              <th className="py-2.5 px-3 text-center">Tab Switches</th>
                              <th className="py-2.5 px-3 text-center">Kamera/Yuz</th>
                              <th className="py-2.5 px-3 text-center">Jami Buzilish</th>
                              <th className="py-2.5 px-3">Xavf Darajasi</th>
                              <th className="py-2.5 px-3 text-right">Harakatlar</th>
                            </>
                          )}
                        </tr>
                      </thead>

                      <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                        {displayList.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-10 text-center text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Users className="w-8 h-8 text-slate-600" />
                                <p className="text-xs font-semibold">{t("Ushbu filtr bo'yicha ishtirokchilar topilmadi")}</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayList.map((p, idx) => {
                            const isDisqualified = p.status === 'disqualified' || submissionService.isParticipantDisqualified(p.id, viewingOlympiad.id);
                            const isPassed = (p.percentage || 0) >= minPassScore || (p.score || 0) >= minPassScore;

                            return (
                              <tr
                                key={p.id || idx}
                                className={clsx(
                                  "transition-colors",
                                  isDisqualified
                                    ? "bg-rose-950/20 hover:bg-rose-950/30"
                                    : isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50"
                                )}
                              >
                                
                                <td className="py-3 px-3 text-center font-bold text-xs whitespace-nowrap">
                                  {viewParticipantTab === 'top_ranked' ? (
                                    idx === 0 ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">1 🥇</span>
                                    ) : idx === 1 ? (
                                      <span className="px-2 py-0.5 rounded bg-slate-300 text-slate-950 font-black">2 🥈</span>
                                    ) : idx === 2 ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-black">3 🥉</span>
                                    ) : (
                                      <span className="text-slate-400 font-mono">{idx + 1}</span>
                                    )
                                  ) : (
                                    <span className="text-slate-400 font-mono">{idx + 1}</span>
                                  )}
                                </td>

                                
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {isDisqualified && (
                                      <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                                        Chetlatilgan
                                      </span>
                                    )}
                                  </div>
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

                                
                                {viewParticipantTab === 'registered' && (
                                  <>
                                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                      {p.registeredAt || '2025-09-19'}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        To'langan (Tasdiqlangan)
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap text-right">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                        Imtihonga tayyor / Ruxsat berilgan
                                      </span>
                                    </td>
                                  </>
                                )}

                                
                                {viewParticipantTab === 'in_progress' && (
                                  <>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
                                          <div
                                            className="bg-amber-400 h-full rounded-full"
                                            style={{ width: `${Math.round(((p.currentQuestion || 15) / (p.totalQuestions || 30)) * 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-amber-300">
                                          {p.currentQuestion || 15} / {p.totalQuestions || 30}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[10px] text-slate-300">
                                      {p.timeSpentMinutes || 18} daqiqa o'tdi
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      {(p.antiCheatViolations?.totalViolations || 0) > 0 ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-fit">
                                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                                          <span>{p.antiCheatViolations?.totalViolations} ta ogohlantirish</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>Normada (0 buzilish)</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap text-right">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-400 border border-amber-800/60 animate-pulse">
                                        🟡 Jonli Yechmoqda
                                      </span>
                                    </td>
                                  </>
                                )}

                                
                                {(viewParticipantTab === 'completed' || viewParticipantTab === 'top_ranked' || viewParticipantTab === 'all') && (
                                  <>
                                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-emerald-400">
                                      {p.correctAnswers !== undefined ? (
                                        <span>{p.correctAnswers} / {p.totalQuestions || 30} <span className="text-[10px] text-slate-400 font-normal">({p.score} ball)</span></span>
                                      ) : (
                                        <span className="text-slate-500">-</span>
                                      )}
                                    </td>

                                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold">
                                      {p.percentage !== undefined ? (
                                        <span className={clsx(p.percentage >= 80 ? "text-emerald-400" : p.percentage >= 60 ? "text-amber-400" : "text-rose-400")}>
                                          {p.percentage}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-500">-</span>
                                      )}
                                    </td>

                                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[10px] text-slate-300">
                                      {p.timeSpentMinutes ? `${p.timeSpentMinutes} min` : '-'}
                                    </td>

                                    <td className="py-3 px-3 whitespace-nowrap">
                                      {p.percentage !== undefined ? (
                                        isPassed ? (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                            ✅ O'tdi ({p.percentage}%)
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                            ❌ O'tmadi
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-500 text-[10px]">-</span>
                                      )}
                                    </td>

                                    <td className="py-3 px-3 whitespace-nowrap text-right">
                                      {p.certificateType ? (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedCertForModal({ participant: p, olympiad: viewingOlympiad })}
                                          className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/50 font-bold rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                        >
                                          <Award className="w-3 h-3 text-amber-300" />
                                          <span>{p.certificateType}</span>
                                        </button>
                                      ) : (
                                        <span className="text-slate-500 text-[10px]">-</span>
                                      )}
                                    </td>
                                  </>
                                )}

                                
                                {viewParticipantTab === 'cheating' && (
                                  <>
                                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">
                                      {p.antiCheatViolations?.tabSwitches || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono font-bold text-rose-400">
                                      {p.antiCheatViolations?.faceAbsence || 0}
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono font-bold text-red-500">
                                      {p.antiCheatViolations?.totalViolations || 0}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap">
                                      {(p.antiCheatViolations?.totalViolations || 0) >= 5 ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                          🔴 Yuqori Xavf
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                          🟡 O'rtacha Xavf
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 whitespace-nowrap text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleWarn(p.name)}
                                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                                        >
                                          Ogohlantirish
                                        </button>
                                        {!isDisqualified ? (
                                          <button
                                            type="button"
                                            onClick={() => handleDisqualify(p.id, p.name)}
                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
                                          >
                                            <UserX className="w-3 h-3" />
                                            <span>Chetlatish</span>
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-rose-400 font-bold">Chetlatilgan</span>
                                        )}
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                
                <div className={clsx("flex items-center justify-between pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    onClick={() => {
                      setSelectedOlympiadForEdit(viewingOlympiad);
                      setViewingOlympiad(null);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>To'liq tahrirlash & Savollar / Anti-Cheat</span>
                  </button>

                  <button
                    onClick={() => setViewingOlympiad(null)}
                    className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    {t("Yopish")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        
        {selectedCertForModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
            <div
              className={clsx(
                "rounded-2xl max-w-3xl w-full p-5 shadow-2xl space-y-4 border transition-colors max-h-[92vh] overflow-y-auto custom-scrollbar",
                isDark ? "bg-[#0D1832] border-[#1E3666]" : "bg-white border-slate-200"
              )}
            >
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {selectedCertForModal.participant.certificateType || "G'oliblik Diplomi"} — {selectedCertForModal.participant.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedCertForModal.olympiad.title} · To'plagan ball: {selectedCertForModal.participant.score || 90} ball ({selectedCertForModal.participant.percentage || 90}%)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCertForModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              
              <div className="border border-white/10 rounded-xl overflow-hidden p-2 bg-black/40 flex justify-center">
                <CertificateCanvas
                  certificate={{
                    id: `CERT-${selectedCertForModal.participant.id}`,
                    userId: selectedCertForModal.participant.id,
                    userName: selectedCertForModal.participant.name,
                    olympiadId: selectedCertForModal.olympiad.id,
                    olympiadTitle: selectedCertForModal.olympiad.title,
                    subject: selectedCertForModal.olympiad.subject || 'Matematika',
                    type: (selectedCertForModal.participant.certificateType?.includes('I darajali')
                      ? 'I darajali Diplom'
                      : selectedCertForModal.participant.certificateType?.includes('II darajali')
                      ? 'II darajali Diplom'
                      : selectedCertForModal.participant.certificateType?.includes('III darajali')
                      ? 'III darajali Diplom'
                      : 'Sertifikat') as any,
                    score: selectedCertForModal.participant.score || 90,
                    maxScore: 100,
                    rank: selectedCertForModal.participant.rank || 1,
                    totalParticipants: 100,
                    issuedAt: new Date().toLocaleDateString('uz-UZ'),
                    verificationCode: `NO-2025-${selectedCertForModal.participant.id}`,
                    grade: selectedCertForModal.participant.grade || 9,
                    school: selectedCertForModal.participant.school || '',
                    region: selectedCertForModal.participant.region || ''
                  } as any}
                  config={selectedCertForModal.olympiad.certificateConfig}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Chop etish / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCertForModal(null)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
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
