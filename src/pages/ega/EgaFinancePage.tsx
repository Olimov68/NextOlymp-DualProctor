import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { usePaymentStore } from '../../store/usePaymentStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { PaymentTransaction } from '../../data/initialPayments';
import { clsx } from 'clsx';
import {
  CreditCard,
  Wallet,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Package,
  Plus,
  Search,
  FileSpreadsheet,
  Columns,
  Calendar,
  Trash2,
  Pencil,
  X,
  AlertCircle,
  TrendingUp,
  Banknote,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const EgaFinancePage: React.FC = () => {
  const { payments, addPayment, updatePaymentStatus, deletePayment, generateFinancialSummary } = usePaymentStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    user: true,
    item: true,
    method: true,
    amount: true,
    status: true,
    date: true,
    actions: true
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [editingPayment, setEditingPayment] = useState<PaymentTransaction | null>(null);

  
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+998 ');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher'>('student');
  const [newOlympiadOrPkg, setNewOlympiadOrPkg] = useState('Respublika Matematika Olimpiadasi');
  const [newMethod, setNewMethod] = useState<'karta' | 'naqd' | 'hamyon' | 'paket'>('karta');
  const [newAmount, setNewAmount] = useState<number>(35000);
  const [newStatus, setNewStatus] = useState<'muvaffaqiyatli' | 'kutilmoqda' | 'bekor_qilindi'>('muvaffaqiyatli');
  const [newRef, setNewRef] = useState('');

  
  const totalParticipants = useMemo(() => {
    const unique = new Set(payments.map((p) => p.userName + p.userPhone));
    return unique.size;
  }, [payments]);

  const paidCount = useMemo(() => {
    return payments.filter((p) => p.status === 'muvaffaqiyatli' && p.method !== 'paket').length;
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p) => p.status === 'kutilmoqda').length;
  }, [payments]);

  const cardRevenue = useMemo(() => {
    return payments
      .filter((p) => p.method === 'karta' && p.status === 'muvaffaqiyatli')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const cashRevenue = useMemo(() => {
    return payments
      .filter((p) => p.method === 'naqd' && p.status === 'muvaffaqiyatli')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const walletRevenue = useMemo(() => {
    return payments
      .filter((p) => p.method === 'hamyon' && p.status === 'muvaffaqiyatli')
      .reduce((acc, p) => acc + p.amount, 0);
  }, [payments]);

  const packageSubscribersCount = useMemo(() => {
    return payments.filter((p) => p.method === 'paket' && p.status === 'muvaffaqiyatli').length;
  }, [payments]);

  
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userPhone.includes(searchTerm) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.olympiadOrPackage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      let matchesDate = true;
      if (fromDate) {
        matchesDate = matchesDate && p.date >= fromDate;
      }
      if (toDate) {
        matchesDate = matchesDate && p.date <= `${toDate} 23:59`;
      }

      return matchesSearch && matchesMethod && matchesStatus && matchesDate;
    });
  }, [payments, searchTerm, methodFilter, statusFilter, fromDate, toDate]);

  
  const formatUZS = (val: number) => {
    if (val === 0) return t('Bepul (Paket)');
    return `${val.toLocaleString()} UZS`;
  };

  
  const handleOpenFinancialReport = () => {
    const report = generateFinancialSummary();
    setReportContent(report);
    setIsReportModalOpen(true);
  };

  
  const handleExportExcel = () => {
    const exportData = filteredPayments.map((p, idx) => ({
      '№': idx + 1,
      [t('Tranzaksiya ID')]: p.id,
      [t('Foydalanuvchi')]: `${p.userName} (${p.userPhone})`,
      [t('Rol')]: t(p.userRole === 'student' ? "O'quvchi" : "O'qituvchi"),
      [t('Olimpiada / Paket')]: p.olympiadOrPackage,
      [t('To\'lov Usuli')]: t(
        p.method === 'karta'
          ? 'Karta (Click/Payme)'
          : p.method === 'naqd'
          ? 'Naqd pul'
          : p.method === 'hamyon'
          ? 'Hamyon'
          : 'Paket obunasi'
      ),
      [t('Summa')]: p.amount === 0 ? t('Bepul (Paket)') : `${p.amount} UZS`,
      [t('Holati')]: t(p.status === 'muvaffaqiyatli' ? 'Muvaffaqiyatli' : p.status === 'kutilmoqda' ? 'Kutilmoqda' : 'Bekor qilindi'),
      [t('Tranzaksiya Kodu')]: p.transactionRef,
      [t('Sana')]: p.date
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TOLOVLAR');
    XLSX.writeFile(workbook, 'Tolovlar_Moliya_Hisoboti.xlsx');
  };

  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    addPayment({
      userName: newUserName.trim(),
      userPhone: newUserPhone.trim(),
      userRole: newUserRole,
      olympiadOrPackage: newOlympiadOrPkg.trim(),
      method: newMethod,
      amount: Number(newAmount) || 0,
      status: newStatus,
      transactionRef: newRef.trim() || 'MANUAL-ENTRY'
    });

    setNewUserName('');
    setNewUserPhone('+998 ');
    setNewRef('');
    setIsAddModalOpen(false);
  };

  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    updatePaymentStatus(editingPayment.id, editingPayment.status);
    setEditingPayment(null);
  };

  
  const getMethodBadgeClass = (m: PaymentTransaction['method']) => {
    switch (m) {
      case 'karta':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'naqd':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'hamyon':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'paket':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
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
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {t("To'lovlar va Moliya Boshqaruvi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Ishtirokchilar to'lovlari, kartalar, naqd pul va hamyon tushumlari tahlili")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFinancialReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              title="Moliya Tahlili va Hisoboti"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span>{t("Moliya Hisoboti")}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da yuklab olish")}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("To'lov kiritish")}</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Jami Ishtirokchilar")}</span>
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-base font-black text-white mt-2 font-mono">
              {totalParticipants.toLocaleString()}
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("To'lov Qilganlar")}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-black text-emerald-400 mt-2 font-mono">
              {paidCount.toLocaleString()}
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Kutilayotganlar")}</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-400 mt-2 font-mono">
              {pendingCount.toLocaleString()}
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Karta Tushumi")}</span>
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xs font-black text-blue-300 mt-2 font-mono truncate">
              {cardRevenue.toLocaleString()} UZS
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Naqd Tushum")}</span>
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-black text-emerald-300 mt-2 font-mono truncate">
              {cashRevenue.toLocaleString()} UZS
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Hamyon Tushumi")}</span>
              <Wallet className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xs font-black text-purple-300 mt-2 font-mono truncate">
              {walletRevenue.toLocaleString()} UZS
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">{t("Paket Obunachilari")}</span>
              <Package className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-300 mt-2 font-mono">
              {packageSubscribersCount.toLocaleString()} {t("kishi")}
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">{t("To'lov usuli")}:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-xs outline-none border font-semibold",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              >
                <option value="all">{t("Barcha usullar")}</option>
                <option value="karta">{t("Karta (Click/Payme/Uzum)")}</option>
                <option value="naqd">{t("Naqd pul / Bank")}</option>
                <option value="hamyon">{t("Hamyon (Balans)")}</option>
                <option value="paket">{t("Paket obunasi")}</option>
              </select>
            </div>

            
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">{t("Holati")}:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={clsx(
                  "rounded-lg px-2.5 py-1 text-xs outline-none border font-semibold",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              >
                <option value="all">{t("Barcha holatlar")}</option>
                <option value="muvaffaqiyatli">{t("Muvaffaqiyatli")}</option>
                <option value="kutilmoqda">{t("Kutilmoqda")}</option>
                <option value="bekor_qilindi">{t("Bekor qilindi")}</option>
              </select>
            </div>
          </div>

          
          <div className="flex flex-wrap items-center gap-2">
            
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("Dan")}:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={clsx(
                  "rounded-lg px-2 py-1 text-xs outline-none border font-mono",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              />
            </div>

            
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>{t("Gacha")}:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={clsx(
                  "rounded-lg px-2 py-1 text-xs outline-none border font-mono",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                )}
              />
            </div>

            
            <div className="relative w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={t("F.I.Sh., Tranzaksiya ID...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={clsx(
                  "w-full rounded-lg pl-9 pr-3 py-1 text-xs outline-none transition-all border",
                  isDark
                    ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>

            
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                  isDark ? "bg-[#091024] border-[#1A2F57] text-slate-300 hover:text-white" : "bg-slate-50 border-slate-300 text-slate-700"
                )}
              >
                <Columns className="w-3.5 h-3.5 text-amber-500" />
                <span>{t("Ustunlar")}</span>
              </button>

              {isColumnDropdownOpen && (
                <div
                  className={clsx(
                    "absolute right-0 mt-2 w-48 rounded-xl p-3 border shadow-2xl z-30 space-y-2",
                    isDark ? "bg-[#0D1832] border-[#1A2F57] text-white" : "bg-white border-slate-200 text-slate-900"
                  )}
                >
                  {Object.entries({
                    id: t("ID"),
                    user: t("Foydalanuvchi"),
                    item: t("Olimpiada / Paket"),
                    method: t("To'lov Usuli"),
                    amount: t("Summa"),
                    status: t("Holati"),
                    date: t("Sana"),
                    actions: t("Amallar")
                  }).map(([colKey, label]) => (
                    <label key={colKey} className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey as keyof typeof visibleColumns]}
                        onChange={() =>
                          setVisibleColumns((prev) => ({
                            ...prev,
                            [colKey]: !prev[colKey as keyof typeof visibleColumns]
                          }))
                        }
                        className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
                  <th className="py-2.5 px-3 w-10 text-center">№</th>
                  {visibleColumns.id && <th className="py-2.5 px-3">{t("Tranzaksiya ID")}</th>}
                  {visibleColumns.user && <th className="py-2.5 px-3">{t("Foydalanuvchi")}</th>}
                  {visibleColumns.item && <th className="py-2.5 px-3">{t("Olimpiada / Paket")}</th>}
                  {visibleColumns.method && <th className="py-2.5 px-3">{t("To'lov Usuli")}</th>}
                  {visibleColumns.amount && <th className="py-2.5 px-3">{t("Summa")}</th>}
                  {visibleColumns.status && <th className="py-2.5 px-3">{t("Holati")}</th>}
                  {visibleColumns.date && <th className="py-2.5 px-3">{t("Sana")}</th>}
                  {visibleColumns.actions && <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>}
                </tr>
              </thead>
              <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {t("To'lovlar topilmadi")}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {idx + 1}
                      </td>

                      {visibleColumns.id && (
                        <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {p.id}
                          <div className="text-[9px] text-slate-400 font-mono">{p.transactionRef}</div>
                        </td>
                      )}

                      {visibleColumns.user && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-white">{p.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.userPhone}</div>
                        </td>
                      )}

                      {visibleColumns.item && (
                        <td className="py-3 px-3 font-semibold text-slate-200 max-w-xs">
                          <div className="line-clamp-1">{p.olympiadOrPackage}</div>
                        </td>
                      )}

                      {visibleColumns.method && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", getMethodBadgeClass(p.method))}>
                            {t(
                              p.method === 'karta'
                                ? 'Karta (Click/Payme)'
                                : p.method === 'naqd'
                                ? 'Naqd pul'
                                : p.method === 'hamyon'
                                ? 'Hamyon'
                                : 'Paket obunasi'
                            )}
                          </span>
                        </td>
                      )}

                      {visibleColumns.amount && (
                        <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <span className={clsx(p.amount === 0 ? "text-slate-400 font-normal" : "text-amber-400 text-xs")}>
                            {formatUZS(p.amount)}
                          </span>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                              p.status === 'muvaffaqiyatli'
                                ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/60"
                                : p.status === 'kutilmoqda'
                                ? "bg-amber-950/70 text-amber-400 border-amber-800/60"
                                : "bg-rose-950/70 text-rose-400 border-rose-800/60"
                            )}
                          >
                            {t(p.status === 'muvaffaqiyatli' ? 'Muvaffaqiyatli' : p.status === 'kutilmoqda' ? 'Kutilmoqda' : 'Bekor qilindi')}
                          </span>
                        </td>
                      )}

                      {visibleColumns.date && (
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {p.date}
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingPayment(p)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                              title={t("Tahrirlash / Holat")}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{t("Tahrirlash")}</span>
                            </button>

                            <button
                              onClick={() => deletePayment(p.id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                              title={t("O'chirish")}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("O'chirish")}</span>
                            </button>
                          </div>
                        </td>
                      )}
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
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  {t("Yangi To'lov Kiritish")}
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
                      {t("F.I.Sh. *")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Shoxrux Abdullayev"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
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
                      {t("Telefon *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Olimpiada yoki Paket Nomi *")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Respublika Matematika Olimpiadasi"
                    value={newOlympiadOrPkg}
                    onChange={(e) => setNewOlympiadOrPkg(e.target.value)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("To'lov Usuli *")}
                    </label>
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value as any)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="karta">{t("Karta (Click/Payme)")}</option>
                      <option value="naqd">{t("Naqd pul / Bank")}</option>
                      <option value="hamyon">{t("Hamyon (Balans)")}</option>
                      <option value="paket">{t("Paket obunasi")}</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Summa (UZS) *")}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newAmount}
                      onChange={(e) => setNewAmount(Number(e.target.value))}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono",
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
                      {t("Holati")}
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="muvaffaqiyatli">{t("Muvaffaqiyatli")}</option>
                      <option value="kutilmoqda">{t("Kutilmoqda")}</option>
                      <option value="bekor_qilindi">{t("Bekor qilindi")}</option>
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Tranzaksiya Kodu (Check ID)")}
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: CASH-99210"
                      value={newRef}
                      onChange={(e) => setNewRef(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border font-mono",
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

        
        {editingPayment && (
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
                  {t("To'lov Holatini Tahrirlash")} ({editingPayment.id})
                </h3>
                <button
                  onClick={() => setEditingPayment(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("To'lov Holati *")}
                  </label>
                  <select
                    value={editingPayment.status}
                    onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value as any })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border font-bold",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="muvaffaqiyatli">{t("Muvaffaqiyatli (Tasdiqlangan)")}</option>
                    <option value="kutilmoqda">{t("Kutilmoqda")}</option>
                    <option value="bekor_qilindi">{t("Bekor qilindi")}</option>
                  </select>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
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

        
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border transition-colors",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>{t("Moliya Tahlili va Xulosasi")}</span>
                </h3>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div
                  className={clsx(
                    "p-4 rounded-xl border text-xs font-mono leading-relaxed whitespace-pre-wrap",
                    isDark ? "bg-[#050B18] border-indigo-900/60 text-indigo-200" : "bg-indigo-50 border-indigo-200 text-indigo-900"
                  )}
                >
                  {reportContent}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Tushunarli")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
