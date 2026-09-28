import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useLocationStore } from '../../store/useLocationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { ViloyatItem, TumanItem, MaktabItem } from '../../data/initialLocations';
import { clsx } from 'clsx';
import {
  MapPin,
  Building2,
  School,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

type TabType = 'viloyatlar' | 'tumanlar' | 'maktablar';

export const EgaLocationsPage: React.FC = () => {
  const {
    viloyatlar,
    tumanlar,
    maktablar,
    addViloyat,
    updateViloyat,
    deleteViloyat,
    addTuman,
    updateTuman,
    deleteTuman,
    addMaktab,
    updateMaktab,
    deleteMaktab
  } = useLocationStore();

  const { theme } = useThemeStore();
  const { i18n } = useTranslation();
  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';

  const t = (text: string) => translateText(text, currentLang);

  const [activeTab, setActiveTab] = useState<TabType>('viloyatlar');
  const [searchTerm, setSearchTerm] = useState('');

  
  const [isViloyatModalOpen, setIsViloyatModalOpen] = useState(false);
  const [isTumanModalOpen, setIsTumanModalOpen] = useState(false);
  const [isMaktabModalOpen, setIsMaktabModalOpen] = useState(false);

  
  const [editingViloyat, setEditingViloyat] = useState<ViloyatItem | null>(null);
  const [editingTuman, setEditingTuman] = useState<TumanItem | null>(null);
  const [editingMaktab, setEditingMaktab] = useState<MaktabItem | null>(null);

  
  const [newViloyatName, setNewViloyatName] = useState('');
  const [newViloyatKod, setNewViloyatKod] = useState('');

  const [newTumanName, setNewTumanName] = useState('');
  const [newTumanViloyat, setNewTumanViloyat] = useState('');
  const [newTumanKod, setNewTumanKod] = useState('');

  const [newMaktabName, setNewMaktabName] = useState('');
  const [newMaktabTuri, setNewMaktabTuri] = useState<'public' | 'private'>('public');
  const [newMaktabKod, setNewMaktabKod] = useState('');
  const [newMaktabViloyat, setNewMaktabViloyat] = useState('');
  const [newMaktabTuman, setNewMaktabTuman] = useState('');

  
  const filteredViloyatlar = useMemo(() => {
    return viloyatlar.filter(
      (v) =>
        v.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.kod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [viloyatlar, searchTerm]);

  const filteredTumanlar = useMemo(() => {
    return tumanlar.filter(
      (tum) =>
        tum.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tum.viloyatNomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tum.kod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tumanlar, searchTerm]);

  const filteredMaktablar = useMemo(() => {
    return maktablar.filter(
      (m) =>
        m.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tumanNomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.viloyatNomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.noyobKod.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [maktablar, searchTerm]);

  
  const handleExportExcel = () => {
    let exportData: any[] = [];
    let fileName = '';

    if (activeTab === 'viloyatlar') {
      exportData = filteredViloyatlar.map((v, index) => ({
        '№': index + 1,
        [t('Viloyat Nomi')]: t(v.nomi),
        [t('Kod')]: v.kod,
        [t('Tumanlar soni')]: v.tumanlarSoni,
        [t('Maktablar soni')]: v.maktablarSoni
      }));
      fileName = 'Viloyatlar_ruyhati.xlsx';
    } else if (activeTab === 'tumanlar') {
      exportData = filteredTumanlar.map((tum, index) => ({
        '№': index + 1,
        [t('Tuman / Shahar Nomi')]: t(tum.nomi),
        [t('Tegishli Viloyat')]: t(tum.viloyatNomi),
        [t('Kod')]: tum.kod,
        [t('Maktablar soni')]: tum.maktablarSoni
      }));
      fileName = 'Tumanlar_ruyhati.xlsx';
    } else {
      exportData = filteredMaktablar.map((m, index) => ({
        '№': index + 1,
        [t('Maktab Nomi')]: t(m.nomi),
        [t('Turi')]: m.turi === 'public' ? t('Davlat maktabi') : t('Xususiy maktab'),
        [t('Noyob Kod')]: m.noyobKod,
        [t('Viloyat')]: t(m.viloyatNomi),
        [t('Tuman')]: t(m.tumanNomi)
      }));
      fileName = 'Maktablar_ruyhati.xlsx';
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
    XLSX.writeFile(workbook, fileName);
  };

  
  const handleAddViloyatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViloyatName.trim()) return;
    addViloyat({ nomi: newViloyatName, kod: newViloyatKod });
    setNewViloyatName('');
    setNewViloyatKod('');
    setIsViloyatModalOpen(false);
  };

  
  const handleEditViloyatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViloyat || !editingViloyat.nomi.trim()) return;
    updateViloyat(editingViloyat.id, { nomi: editingViloyat.nomi, kod: editingViloyat.kod });
    setEditingViloyat(null);
  };

  
  const handleAddTumanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTumanName.trim() || !newTumanViloyat) return;
    addTuman({ nomi: newTumanName, viloyatNomi: newTumanViloyat, kod: newTumanKod });
    setNewTumanName('');
    setNewTumanViloyat('');
    setNewTumanKod('');
    setIsTumanModalOpen(false);
  };

  
  const handleEditTumanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTuman || !editingTuman.nomi.trim() || !editingTuman.viloyatNomi) return;
    updateTuman(editingTuman.id, {
      nomi: editingTuman.nomi,
      viloyatNomi: editingTuman.viloyatNomi,
      kod: editingTuman.kod
    });
    setEditingTuman(null);
  };

  
  const handleAddMaktabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaktabName.trim() || !newMaktabTuman) return;
    addMaktab({
      nomi: newMaktabName,
      turi: newMaktabTuri,
      noyobKod: newMaktabKod,
      viloyatNomi: newMaktabViloyat || 'Toshkent shahri',
      tumanNomi: newMaktabTuman
    });
    setNewMaktabName('');
    setNewMaktabKod('');
    setNewMaktabViloyat('');
    setNewMaktabTuman('');
    setIsMaktabModalOpen(false);
  };

  
  const handleEditMaktabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaktab || !editingMaktab.nomi.trim() || !editingMaktab.tumanNomi) return;
    updateMaktab(editingMaktab.id, {
      nomi: editingMaktab.nomi,
      turi: editingMaktab.turi,
      noyobKod: editingMaktab.noyobKod,
      viloyatNomi: editingMaktab.viloyatNomi,
      tumanNomi: editingMaktab.tumanNomi
    });
    setEditingMaktab(null);
  };

  const modalAvailableTumanlar = useMemo(() => {
    if (!newMaktabViloyat) return tumanlar;
    return tumanlar.filter((tum) => tum.viloyatNomi.toLowerCase() === newMaktabViloyat.toLowerCase());
  }, [tumanlar, newMaktabViloyat]);

  const editMaktabAvailableTumanlar = useMemo(() => {
    if (!editingMaktab || !editingMaktab.viloyatNomi) return tumanlar;
    return tumanlar.filter((tum) => tum.viloyatNomi.toLowerCase() === editingMaktab.viloyatNomi.toLowerCase());
  }, [tumanlar, editingMaktab?.viloyatNomi]);

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
              <MapPin className="w-4 h-4 text-amber-500" />
              {t("Hududlar Boshqaruvi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("O'zbekiston Respublikasi viloyatlari, tumanlari va maktablari ro'yxati")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Ro'yxatni Excel fayl ko'rinishida yuklab olish"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da yuklab olish")}</span>
            </button>

            
            {activeTab === 'viloyatlar' && (
              <button
                onClick={() => setIsViloyatModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Viloyat qo'shish")}</span>
              </button>
            )}

            {activeTab === 'tumanlar' && (
              <button
                onClick={() => setIsTumanModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Tuman yaratish")}</span>
              </button>
            )}

            {activeTab === 'maktablar' && (
              <button
                onClick={() => setIsMaktabModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Maktab yaratish")}</span>
              </button>
            )}
          </div>
        </div>

        
        <div
          className={clsx(
            "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          
          <div
            className={clsx(
              "flex items-center gap-1 p-1 rounded-lg border w-full sm:w-auto",
              isDark ? "bg-[#091024] border-[#162747]" : "bg-slate-100 border-slate-200"
            )}
          >
            <button
              onClick={() => setActiveTab('viloyatlar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'viloyatlar'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#11203E]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t("Viloyatlar")} ({viloyatlar.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tumanlar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tumanlar'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#11203E]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t("Tumanlar")} ({tumanlar.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('maktablar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'maktablar'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#11203E]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>{t("Maktablar")} ({maktablar.length})</span>
            </button>
          </div>

          
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("Qidiruv...")}
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
        </div>

        
        {activeTab === 'viloyatlar' && (
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
                    "text-[11px] uppercase tracking-wider border-b font-semibold",
                    isDark
                      ? "bg-[#101E3C] text-slate-400 border-[#182A4D]"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">№</th>
                    <th className="py-2.5 px-4">{t("Viloyat Nomi")}</th>
                    <th className="py-2.5 px-4">{t("Kod")}</th>
                    <th className="py-2.5 px-4">{t("Tumanlar soni")}</th>
                    <th className="py-2.5 px-4">{t("Maktablar soni")}</th>
                    <th className="py-2.5 px-4 text-right">{t("Amallar")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {filteredViloyatlar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {t("Viloyatlar topilmadi")}
                      </td>
                    </tr>
                  ) : (
                    filteredViloyatlar.map((v, idx) => (
                      <tr
                        key={v.id}
                        className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 text-[11px] font-mono">
                          {idx + 1}
                        </td>
                        <td
                          className={clsx(
                            "py-2.5 px-4 font-bold flex items-center gap-2",
                            isDark ? "text-white" : "text-slate-900"
                          )}
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{t(v.nomi)}</span>
                        </td>
                        <td className={clsx("py-2.5 px-4 font-mono text-[11px]", isDark ? "text-amber-300" : "text-amber-700")}>
                          {v.kod}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[11px] font-semibold border",
                              isDark
                                ? "bg-[#162A50] text-blue-300 border-blue-900/50"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {t(`${v.tumanlarSoni} tuman`)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[11px] font-semibold border",
                              isDark
                                ? "bg-[#1A3323] text-emerald-300 border-emerald-900/50"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {t(`${v.maktablarSoni} maktab`)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingViloyat(v)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("Tahrirlash")}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{t("Tahrirlash")}</span>
                            </button>

                            <button
                              onClick={() => deleteViloyat(v.id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("O'chirish")}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("O'chirish")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {activeTab === 'tumanlar' && (
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
                    "text-[11px] uppercase tracking-wider border-b font-semibold",
                    isDark
                      ? "bg-[#101E3C] text-slate-400 border-[#182A4D]"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">№</th>
                    <th className="py-2.5 px-4">{t("Tuman / Shahar Nomi")}</th>
                    <th className="py-2.5 px-4">{t("Tegishli Viloyat")}</th>
                    <th className="py-2.5 px-4">{t("Kod")}</th>
                    <th className="py-2.5 px-4">{t("Maktablar soni")}</th>
                    <th className="py-2.5 px-4 text-right">{t("Amallar")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {filteredTumanlar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {t("Tumanlar topilmadi")}
                      </td>
                    </tr>
                  ) : (
                    filteredTumanlar.map((tum, idx) => (
                      <tr
                        key={tum.id}
                        className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 text-[11px] font-mono">
                          {idx + 1}
                        </td>
                        <td
                          className={clsx(
                            "py-2.5 px-4 font-bold flex items-center gap-2",
                            isDark ? "text-white" : "text-slate-900"
                          )}
                        >
                          <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{t(tum.nomi)}</span>
                        </td>
                        <td className={clsx("py-2.5 px-4 font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
                          {t(tum.viloyatNomi)}
                        </td>
                        <td className={clsx("py-2.5 px-4 font-mono text-[11px]", isDark ? "text-amber-300" : "text-amber-700")}>
                          {tum.kod}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[11px] font-semibold border",
                              isDark
                                ? "bg-[#1A3323] text-emerald-300 border-emerald-900/50"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {t(`${tum.maktablarSoni} maktab`)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingTuman(tum)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("Tahrirlash")}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{t("Tahrirlash")}</span>
                            </button>

                            <button
                              onClick={() => deleteTuman(tum.id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("O'chirish")}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("O'chirish")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {activeTab === 'maktablar' && (
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
                    "text-[11px] uppercase tracking-wider border-b font-semibold",
                    isDark
                      ? "bg-[#101E3C] text-slate-400 border-[#182A4D]"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">№</th>
                    <th className="py-2.5 px-4">{t("Maktab Nomi")}</th>
                    <th className="py-2.5 px-4">{t("Turi")}</th>
                    <th className="py-2.5 px-4">{t("Noyob Kod")}</th>
                    <th className="py-2.5 px-4">{t("Viloyat")}</th>
                    <th className="py-2.5 px-4">{t("Tuman")}</th>
                    <th className="py-2.5 px-4 text-right">{t("Amallar")}</th>
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {filteredMaktablar.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {t("Maktablar topilmadi")}
                      </td>
                    </tr>
                  ) : (
                    filteredMaktablar.map((m, idx) => (
                      <tr
                        key={m.id}
                        className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                      >
                        <td className="py-2.5 px-4 text-center text-slate-400 text-[11px] font-mono">
                          {idx + 1}
                        </td>
                        <td
                          className={clsx(
                            "py-2.5 px-4 font-bold flex items-center gap-2",
                            isDark ? "text-white" : "text-slate-900"
                          )}
                        >
                          <School className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{t(m.nomi)}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                              m.turi === 'public'
                                ? isDark
                                  ? "bg-cyan-950/70 text-cyan-300 border-cyan-800/60"
                                  : "bg-cyan-50 text-cyan-700 border-cyan-200"
                                : isDark
                                ? "bg-purple-950/70 text-purple-300 border-purple-800/60"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            )}
                          >
                            {m.turi === 'public' ? t('Davlat') : t('Xususiy')}
                          </span>
                        </td>
                        <td className={clsx("py-2.5 px-4 font-mono text-[11px]", isDark ? "text-amber-300" : "text-amber-700")}>
                          {m.noyobKod}
                        </td>
                        <td className={clsx("py-2.5 px-4", isDark ? "text-slate-300" : "text-slate-700")}>{t(m.viloyatNomi)}</td>
                        <td className={clsx("py-2.5 px-4", isDark ? "text-slate-300" : "text-slate-700")}>{t(m.tumanNomi)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingMaktab(m)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("Tahrirlash")}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{t("Tahrirlash")}</span>
                            </button>

                            <button
                              onClick={() => deleteMaktab(m.id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title={t("O'chirish")}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("O'chirish")}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        
        {isViloyatModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <MapPin className="w-4 h-4 text-amber-500" />
                  {t("Yangi Viloyat Qo'shish")}
                </h3>
                <button
                  onClick={() => setIsViloyatModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddViloyatSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyat Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Toshkent viloyati"
                    value={newViloyatName}
                    onChange={(e) => setNewViloyatName(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyat Kodi (ixtiyoriy)")}
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 15"
                    value={newViloyatKod}
                    onChange={(e) => setNewViloyatKod(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setIsViloyatModalOpen(false)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {editingViloyat && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Pencil className="w-4 h-4 text-blue-500" />
                  {t("Viloyatni tahrirlash")}
                </h3>
                <button
                  onClick={() => setEditingViloyat(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditViloyatSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyat Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingViloyat.nomi}
                    onChange={(e) => setEditingViloyat({ ...editingViloyat, nomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyat Kodi (ixtiyoriy)")}
                  </label>
                  <input
                    type="text"
                    value={editingViloyat.kod}
                    onChange={(e) => setEditingViloyat({ ...editingViloyat, kod: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingViloyat(null)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {isTumanModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Building2 className="w-4 h-4 text-blue-500" />
                  {t("Yangi Tuman Yaratish")}
                </h3>
                <button
                  onClick={() => setIsTumanModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTumanSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyatni tanlang *")}
                  </label>
                  <select
                    required
                    value={newTumanViloyat}
                    onChange={(e) => setNewTumanViloyat(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="">{t("Viloyatni tanlang...")}</option>
                    {viloyatlar.map((v) => (
                      <option key={v.id} value={v.nomi}>
                        {t(v.nomi)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tuman / Shahar Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Yunusobod tumani"
                    value={newTumanName}
                    onChange={(e) => setNewTumanName(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tuman Kodi (ixtiyoriy)")}
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 502"
                    value={newTumanKod}
                    onChange={(e) => setNewTumanKod(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setIsTumanModalOpen(false)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {editingTuman && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Pencil className="w-4 h-4 text-blue-500" />
                  {t("Tumanni tahrirlash")}
                </h3>
                <button
                  onClick={() => setEditingTuman(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditTumanSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyatni tanlang *")}
                  </label>
                  <select
                    required
                    value={editingTuman.viloyatNomi}
                    onChange={(e) => setEditingTuman({ ...editingTuman, viloyatNomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    {viloyatlar.map((v) => (
                      <option key={v.id} value={v.nomi}>
                        {t(v.nomi)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tuman / Shahar Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTuman.nomi}
                    onChange={(e) => setEditingTuman({ ...editingTuman, nomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tuman Kodi (ixtiyoriy)")}
                  </label>
                  <input
                    type="text"
                    value={editingTuman.kod}
                    onChange={(e) => setEditingTuman({ ...editingTuman, kod: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingTuman(null)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {isMaktabModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <School className="w-4 h-4 text-emerald-500" />
                  {t("Yangi Maktab Yaratish")}
                </h3>
                <button
                  onClick={() => setIsMaktabModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMaktabSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyatni tanlang *")}
                  </label>
                  <select
                    required
                    value={newMaktabViloyat}
                    onChange={(e) => {
                      setNewMaktabViloyat(e.target.value);
                      setNewMaktabTuman('');
                    }}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="">{t("Viloyatni tanlang...")}</option>
                    {viloyatlar.map((v) => (
                      <option key={v.id} value={v.nomi}>
                        {t(v.nomi)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tumanni tanlang *")}
                  </label>
                  <select
                    required
                    value={newMaktabTuman}
                    onChange={(e) => setNewMaktabTuman(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="">{t("Tumanni tanlang...")}</option>
                    {modalAvailableTumanlar.map((tum) => (
                      <option key={tum.id} value={tum.nomi}>
                        {t(tum.nomi)} ({t(tum.viloyatNomi)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Maktab Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 12-sonli maktab"
                    value={newMaktabName}
                    onChange={(e) => setNewMaktabName(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Maktab Turi")}
                    </label>
                    <select
                      value={newMaktabTuri}
                      onChange={(e) => setNewMaktabTuri(e.target.value as any)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="public">{t("Davlat maktabi")}</option>
                      <option value="private">{t("Xususiy maktab")}</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Noyob Kod")}
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: 10482"
                      value={newMaktabKod}
                      onChange={(e) => setNewMaktabKod(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setIsMaktabModalOpen(false)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {editingMaktab && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Pencil className="w-4 h-4 text-emerald-500" />
                  {t("Maktabni tahrirlash")}
                </h3>
                <button
                  onClick={() => setEditingMaktab(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditMaktabSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Viloyatni tanlang *")}
                  </label>
                  <select
                    required
                    value={editingMaktab.viloyatNomi}
                    onChange={(e) => setEditingMaktab({ ...editingMaktab, viloyatNomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    {viloyatlar.map((v) => (
                      <option key={v.id} value={v.nomi}>
                        {t(v.nomi)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Tumanni tanlang *")}
                  </label>
                  <select
                    required
                    value={editingMaktab.tumanNomi}
                    onChange={(e) => setEditingMaktab({ ...editingMaktab, tumanNomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    {editMaktabAvailableTumanlar.map((tum) => (
                      <option key={tum.id} value={tum.nomi}>
                        {t(tum.nomi)} ({t(tum.viloyatNomi)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Maktab Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMaktab.nomi}
                    onChange={(e) => setEditingMaktab({ ...editingMaktab, nomi: e.target.value })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Maktab Turi")}
                    </label>
                    <select
                      value={editingMaktab.turi}
                      onChange={(e) => setEditingMaktab({ ...editingMaktab, turi: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="public">{t("Davlat maktabi")}</option>
                      <option value="private">{t("Xususiy maktab")}</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Noyob Kod")}
                    </label>
                    <input
                      type="text"
                      value={editingMaktab.noyobKod}
                      onChange={(e) => setEditingMaktab({ ...editingMaktab, noyobKod: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingMaktab(null)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
