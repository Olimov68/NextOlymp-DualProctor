import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { usePackageStore } from '../../store/usePackageStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { PackageItem } from '../../data/initialPackages';
import { clsx } from 'clsx';
import {
  Package,
  CheckCircle2,
  Users,
  DollarSign,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  FileSpreadsheet,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const EgaPackagesPage: React.FC = () => {
  const { packages, addPackage, updatePackage, deletePackage, togglePackageStatus } = usePackageStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  const [searchTerm, setSearchTerm] = useState('');

  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);

  
  const [newNomi, setNewNomi] = useState('');
  const [newNarxi, setNewNarxi] = useState<number>(29000);
  const [newDavomiyligi, setNewDavomiyligi] = useState('1 oy');
  const [newTavsif, setNewTavsif] = useState('');
  const [newImkoniyatlarInput, setNewImkoniyatlarInput] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newHolati, setNewHolati] = useState<'sotuvda' | 'nofaol'>('sotuvda');

  
  const totalPackagesCount = packages.length;
  const activePackagesCount = useMemo(() => packages.filter((p) => p.holati === 'sotuvda').length, [packages]);
  const totalBuyersCount = useMemo(() => packages.reduce((sum, p) => sum + p.sotilganSoni, 0), [packages]);
  const totalRevenueSum = useMemo(() => packages.reduce((sum, p) => sum + p.jamiTushum, 0), [packages]);

  
  const filteredPackages = useMemo(() => {
    return packages.filter(
      (p) =>
        p.nomi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tavsif.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.davomiyligi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  
  const formatCurrency = (val: number) => {
    if (val === 0) return t('Bepul');
    return `${val.toLocaleString()} UZS`;
  };

  
  const handleExportExcel = () => {
    const exportData = filteredPackages.map((p, index) => ({
      '№': index + 1,
      [t('ID')]: p.id,
      [t('Paket Nomi')]: p.nomi,
      [t('Narxi')]: p.narxi === 0 ? t('Bepul') : `${p.narxi} UZS`,
      [t('Davomiyligi')]: t(p.davomiyligi),
      [t('Imkoniyatlar')]: p.imkoniyatlar.join('; '),
      [t('Xarid qilganlar')]: p.sotilganSoni,
      [t('Jami tushum')]: `${p.jamiTushum} UZS`,
      [t('Holati')]: p.holati === 'sotuvda' ? t('Sotuvda') : t('Nofaol'),
      [t('Yorliq')]: p.badge || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PAKETLAR');
    XLSX.writeFile(workbook, 'Paketlar_ruyhati.xlsx');
  };

  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomi.trim()) return;

    const imkoniyatlarList = newImkoniyatlarInput
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    addPackage({
      nomi: newNomi.trim(),
      narxi: Number(newNarxi) || 0,
      davomiyligi: newDavomiyligi,
      tavsif: newTavsif.trim(),
      imkoniyatlar: imkoniyatlarList.length > 0 ? imkoniyatlarList : [t("Barcha testlardan foydalanish")],
      holati: newHolati,
      badge: newBadge.trim() || undefined
    });

    setNewNomi('');
    setNewNarxi(29000);
    setNewDavomiyligi('1 oy');
    setNewTavsif('');
    setNewImkoniyatlarInput('');
    setNewBadge('');
    setIsAddModalOpen(false);
  };

  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage || !editingPackage.nomi.trim()) return;

    updatePackage(editingPackage.id, {
      nomi: editingPackage.nomi.trim(),
      narxi: Number(editingPackage.narxi) || 0,
      davomiyligi: editingPackage.davomiyligi,
      tavsif: editingPackage.tavsif,
      imkoniyatlar: editingPackage.imkoniyatlar,
      holati: editingPackage.holati,
      badge: editingPackage.badge ? editingPackage.badge.trim() : undefined
    });

    setEditingPackage(null);
  };

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
              <Package className="w-4 h-4 text-purple-400" />
              {t("Paketlar Bo'limi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Platformadagi obuna paketlari, narxlar va imkoniyatlarni boshqarish")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Paketlar ro'yxatini Excel'da yuklab olish"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da yuklab olish")}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Paket qo'shish")}</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Jami paketlar")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5", isDark ? "text-white" : "text-slate-900")}>
                {totalPackagesCount} {t("ta")}
              </div>
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
              <div className={clsx("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Sotuvdagi paketlar")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5", isDark ? "text-emerald-400" : "text-emerald-600")}>
                {activePackagesCount} {t("ta sotuvda")}
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Xarid qilganlar")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5", isDark ? "text-blue-400" : "text-blue-600")}>
                {totalBuyersCount.toLocaleString()} {t("kishi")}
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[11px] font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Jami tushum")}
              </div>
              <div className={clsx("text-base font-black mt-0.5", isDark ? "text-amber-400" : "text-amber-600")}>
                {totalRevenueSum.toLocaleString()} UZS
              </div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("Paketlarni qidirish...")}
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

          <div className={clsx("text-xs font-semibold", isDark ? "text-slate-400" : "text-slate-600")}>
            {t("Ko'rsatilmoqda")}: <span className="text-amber-500 font-bold">{filteredPackages.length}</span> {t("ta paket")}
          </div>
        </div>

        
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
                  <th className="py-2.5 px-4 w-12 text-center">№</th>
                  <th className="py-2.5 px-4">{t("Paket Nomi")}</th>
                  <th className="py-2.5 px-4">{t("Narxi")}</th>
                  <th className="py-2.5 px-4">{t("Davomiyligi")}</th>
                  <th className="py-2.5 px-4">{t("Imkoniyatlar")}</th>
                  <th className="py-2.5 px-4">{t("Xarid qilganlar")}</th>
                  <th className="py-2.5 px-4">{t("Jami tushum")}</th>
                  <th className="py-2.5 px-4">{t("Holati")}</th>
                  <th className="py-2.5 px-4 text-right">{t("Amallar")}</th>
                </tr>
              </thead>
              <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {t("Paketlar topilmadi")}
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pkg, idx) => (
                    <tr
                      key={pkg.id}
                      className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                    >
                      <td className="py-3 px-4 text-center text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {idx + 1}
                      </td>

                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                          <Package className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className={clsx(isDark ? "text-white" : "text-slate-900")}>
                            {pkg.nomi}
                          </span>
                          {pkg.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {pkg.tavsif}
                        </div>
                      </td>

                      
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            "font-bold font-mono text-xs px-2 py-0.5 rounded border inline-block whitespace-nowrap",
                            pkg.narxi === 0
                              ? isDark
                                ? "bg-slate-800 text-slate-300 border-slate-700"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                              : isDark
                              ? "bg-amber-950/70 text-amber-300 border-amber-800/60"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {formatCurrency(pkg.narxi)}
                        </span>
                      </td>

                      
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {t(pkg.davomiyligi)}
                        </span>
                      </td>

                      
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-1">
                          {pkg.imkoniyatlar.slice(0, 2).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1 text-[11px] text-slate-300">
                              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                          {pkg.imkoniyatlar.length > 2 && (
                            <div className="text-[10px] text-slate-500 italic pl-4">
                              +{pkg.imkoniyatlar.length - 2} ta qo'shimcha
                            </div>
                          )}
                        </div>
                      </td>

                      
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {pkg.sotilganSoni.toLocaleString()} {t("kishi")}
                      </td>

                      
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {pkg.jamiTushum.toLocaleString()} UZS
                      </td>

                      
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border inline-block whitespace-nowrap",
                            pkg.holati === 'sotuvda'
                              ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/60"
                              : "bg-rose-950/70 text-rose-400 border-rose-800/60"
                          )}
                        >
                          {pkg.holati === 'sotuvda' ? t("Sotuvda") : t("Nofaol")}
                        </span>
                      </td>

                      
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPackage(pkg)}
                            className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            title={t("Tahrirlash")}
                          >
                            <Pencil className="w-3 h-3" />
                            <span>{t("Tahrirlash")}</span>
                          </button>

                          <button
                            onClick={() => togglePackageStatus(pkg.id)}
                            className={clsx(
                              "px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all border shrink-0",
                              pkg.holati === 'sotuvda'
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            )}
                            title={pkg.holati === 'sotuvda' ? t("Nofaol qilish") : t("Sotuvga chiqarish")}
                          >
                            {pkg.holati === 'sotuvda' ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 text-amber-400" />
                                <span>{t("Nofaol qil")}</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t("Sotuvga chiqar")}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => deletePackage(pkg.id)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
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

        
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Package className="w-4 h-4 text-purple-400" />
                  {t("Yangi Paket Qo'shish")}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Paket Nomi *")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Premium Ultra"
                      value={newNomi}
                      onChange={(e) => setNewNomi(e.target.value)}
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
                      {t("Narxi (UZS) *")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="0 (Bepul bo'lsa)"
                      value={newNarxi}
                      onChange={(e) => setNewNarxi(Number(e.target.value))}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Davomiyligi *")}
                    </label>
                    <select
                      value={newDavomiyligi}
                      onChange={(e) => setNewDavomiyligi(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="Cheksiz">Cheksiz</option>
                      <option value="1 oy">1 oy</option>
                      <option value="3 oy">3 oy</option>
                      <option value="6 oy">6 oy</option>
                      <option value="1 yil">1 yil</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Yorliq (Badge - ixtiyoriy)")}
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Mashhur, TOP"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Qisqa Tavsif")}
                  </label>
                  <input
                    type="text"
                    placeholder="Paket haqida qisqacha ma'lumot"
                    value={newTavsif}
                    onChange={(e) => setNewTavsif(e.target.value)}
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
                    {t("Imkoniyatlar (Har bir qatorda bittadan foydali imkoniyat yozing)")}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={`Barcha olimpiadalarga ruxsat\nDiplom va sertifikatlar\nVIP ustoz maslahati`}
                    value={newImkoniyatlarInput}
                    onChange={(e) => setNewImkoniyatlarInput(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border resize-none",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Holati")}
                  </label>
                  <select
                    value={newHolati}
                    onChange={(e) => setNewHolati(e.target.value as any)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="sotuvda">Sotuvda (Faol)</option>
                    <option value="nofaol">Nofaol</option>
                  </select>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
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

        
        {editingPackage && (
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
                  {t("Paketni tahrirlash")} ({editingPackage.id})
                </h3>
                <button
                  onClick={() => setEditingPackage(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Paket Nomi *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPackage.nomi}
                      onChange={(e) => setEditingPackage({ ...editingPackage, nomi: e.target.value })}
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
                      {t("Narxi (UZS) *")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingPackage.narxi}
                      onChange={(e) => setEditingPackage({ ...editingPackage, narxi: Number(e.target.value) })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Davomiyligi *")}
                    </label>
                    <select
                      value={editingPackage.davomiyligi}
                      onChange={(e) => setEditingPackage({ ...editingPackage, davomiyligi: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="Cheksiz">Cheksiz</option>
                      <option value="1 oy">1 oy</option>
                      <option value="3 oy">3 oy</option>
                      <option value="6 oy">6 oy</option>
                      <option value="1 yil">1 yil</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Yorliq (Badge)")}
                    </label>
                    <input
                      type="text"
                      value={editingPackage.badge || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Qisqa Tavsif")}
                  </label>
                  <input
                    type="text"
                    value={editingPackage.tavsif}
                    onChange={(e) => setEditingPackage({ ...editingPackage, tavsif: e.target.value })}
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
                    {t("Imkoniyatlar (Qatorma-qator yozing)")}
                  </label>
                  <textarea
                    rows={4}
                    value={editingPackage.imkoniyatlar.join('\n')}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        imkoniyatlar: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter((line) => line.length > 0)
                      })
                    }
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border resize-none",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Holati")}
                  </label>
                  <select
                    value={editingPackage.holati}
                    onChange={(e) => setEditingPackage({ ...editingPackage, holati: e.target.value as any })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="sotuvda">Sotuvda (Faol)</option>
                    <option value="nofaol">Nofaol</option>
                  </select>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingPackage(null)}
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
