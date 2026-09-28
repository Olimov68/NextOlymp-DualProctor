import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { NotificationLog } from '../../data/initialNotifications';
import { clsx } from 'clsx';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Percent,
  Send,
  Search,
  FileSpreadsheet,
  Columns,
  Calendar,
  Filter,
  Trash2,
  RefreshCw,
  PhoneCall,
  MapPin,
  X,
  UserCheck,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const EgaNotificationsPage: React.FC = () => {
  const { notifications, sendNotification, deleteNotification } = useNotificationStore();
  const { viloyatlar } = useLocationStore();
  const { users } = useUserStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [smsText, setSmsText] = useState('');
  const [smsType, setSmsType] = useState<NotificationLog['type']>('Bildirishnoma');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  
  const [historyTab, setHistoryTab] = useState<'all' | 'otp' | 'notifications'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    recipient: true,
    type: true,
    message: true,
    region: true,
    status: true,
    sentAt: true,
    actions: true
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  
  const totalSmsCount = notifications.length;
  const deliveredCount = useMemo(() => {
    return notifications.filter((n) => n.status === 'Qabul qilindi').length;
  }, [notifications]);

  const failedCount = useMemo(() => {
    return notifications.filter((n) => n.status === 'Yuborilmadi').length;
  }, [notifications]);

  const deliveryRate = useMemo(() => {
    if (totalSmsCount === 0) return '0%';
    return `${((deliveredCount / totalSmsCount) * 100).toFixed(1)}%`;
  }, [totalSmsCount, deliveredCount]);

  
  const charCount = smsText.length;
  const smsPartCount = Math.ceil(charCount / 160) || (charCount > 0 ? 1 : 0);

  
  const filteredLogs = useMemo(() => {
    return notifications.filter((log) => {
      
      if (historyTab === 'otp') {
        if (log.type !== 'Tasdiqlash' && log.type !== 'Parol') return false;
      } else if (historyTab === 'notifications') {
        if (log.type === 'Tasdiqlash' || log.type === 'Parol') return false;
      }

      
      const matchesSearch =
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.phone.includes(searchTerm) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.region.toLowerCase().includes(searchTerm.toLowerCase());

      
      let matchesDate = true;
      if (fromDate) {
        matchesDate = matchesDate && log.sentAt >= fromDate;
      }
      if (toDate) {
        matchesDate = matchesDate && log.sentAt <= `${toDate} 23:59`;
      }

      return matchesSearch && matchesDate;
    });
  }, [notifications, historyTab, searchTerm, fromDate, toDate]);

  
  const filteredUsersForPicker = useMemo(() => {
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        u.phone.includes(userSearchTerm) ||
        u.id.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  
  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;

    if (selectedAudience === 'custom' && selectedUserIds.length > 0) {
      const selectedUsersList = users.filter((u) => selectedUserIds.includes(u.id));
      selectedUsersList.forEach((u) => {
        sendNotification(
          smsText.trim(),
          smsType,
          u.region,
          `${u.fullName} (${u.phone})`
        );
      });
    } else {
      sendNotification(
        smsText.trim(),
        smsType,
        selectedRegion,
        selectedAudience
      );
    }

    setSmsText('');
    setSelectedUserIds([]);
  };

  
  const handleExportExcel = () => {
    const exportData = filteredLogs.map((log, idx) => ({
      '№': idx + 1,
      [t('ID')]: log.id,
      [t('Qabul qiluvchi')]: `${log.userName} (${log.phone})`,
      [t('Xabar turi')]: t(log.type),
      [t('Xabar matni')]: log.message,
      [t('Viloyat')]: t(log.region),
      [t('Holati')]: t(log.status),
      [t('Yuborilgan vaqt')]: log.sentAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'XABAR_LOGLARI');
    XLSX.writeFile(workbook, 'SMS_Xabarnomalar_ruyhati.xlsx');
  };

  
  const getTypeBadgeClass = (type: NotificationLog['type']) => {
    switch (type) {
      case 'Tasdiqlash':
      case 'Parol':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Bildirishnoma':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Tranzaksiya':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Xavfsizlik ogohlantirishi':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <EgaLayout>
      <div className="space-y-4 font-sans text-xs">
        
        <div
          className={clsx(
            "p-4 rounded-xl border shadow-sm transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h1 className={clsx("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <MessageSquare className="w-4 h-4 text-amber-400" />
              {t("Xabarnomalar Boshqaruvi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("SMS xabarnomalar, OTP tasdiqlash kodlari yuborish va audit jurnallarini ko'rish")}
            </p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[10px] uppercase font-bold tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("JAMI SMS")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5 font-mono", isDark ? "text-white" : "text-slate-900")}>
                {totalSmsCount.toLocaleString()}
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
              <div className={clsx("text-[10px] uppercase font-bold tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("QABUL QILINGAN")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5 font-mono text-emerald-400")}>
                {deliveredCount.toLocaleString()}
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[10px] uppercase font-bold tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("YUBORILMADI")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5 font-mono text-rose-400")}>
                {failedCount}
              </div>
            </div>
          </div>

          
          <div
            className={clsx(
              "p-3.5 rounded-xl border shadow-xs transition-all flex items-center gap-3",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className={clsx("text-[10px] uppercase font-bold tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("YETKAZILISH")}
              </div>
              <div className={clsx("text-lg font-black mt-0.5 font-mono text-purple-400")}>
                {deliveryRate}
              </div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "p-5 rounded-xl border shadow-sm transition-colors space-y-4",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex items-center justify-between border-b pb-2.5 border-[#182A4D]">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-500" />
              <span>{t("SMS YUBORISH")}</span>
            </h2>
          </div>

          <form onSubmit={handleSendSms} className="space-y-3">
            
            <div className="relative">
              <textarea
                rows={4}
                required
                placeholder={t("Xabar matni")}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                className={clsx(
                  "w-full rounded-xl px-4 py-3 text-xs outline-none transition-all resize-none border leading-relaxed",
                  isDark
                    ? "bg-[#050B18] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                    : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                )}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 font-mono">
                <span>
                  {charCount} {t("belgi")} · {smsPartCount} {t("ta SMS")}
                </span>
                <span>Latin: 1 SMS – 160 belgi</span>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              
              <div>
                <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Xabar turi *")}
                </label>
                <select
                  value={smsType}
                  onChange={(e) => setSmsType(e.target.value as any)}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                    isDark
                      ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                      : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                  )}
                >
                  <option value="Bildirishnoma">{t("Bildirishnoma")}</option>
                  <option value="Parol">{t("Parol")}</option>
                  <option value="Tasdiqlash">{t("Tasdiqlash (OTP)")}</option>
                  <option value="Xavfsizlik ogohlantirishi">{t("Xavfsizlik ogohlantirishi")}</option>
                  <option value="Tranzaksiya">{t("Tranzaksiya")}</option>
                  <option value="Boshqa">{t("Boshqa")}</option>
                </select>
              </div>

              
              <div>
                <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Viloyatni tanlang")}
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                    isDark
                      ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                      : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                  )}
                >
                  <option value="all">{t("Barcha viloyatlar")}</option>
                  {viloyatlar.map((v) => (
                    <option key={v.id} value={v.nomi}>
                      {t(v.nomi)}
                    </option>
                  ))}
                </select>
              </div>

              
              <div>
                <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  {t("Foydalanuvchilar auditoriyasi")}
                </label>
                <select
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  className={clsx(
                    "w-full rounded-lg px-3 py-2 text-xs outline-none border font-semibold",
                    isDark
                      ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                      : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                  )}
                >
                  <option value="all">{t("Barcha foydalanuvchilar")}</option>
                  <option value="students">{t("Faqat O'quvchilar")}</option>
                  <option value="teachers">{t("Faqat O'qituvchilar")}</option>
                  <option value="vip">{t("Faqat VIP Obunachilar")}</option>
                  <option value="custom">{t("Alohida belgilangan foydalanuvchilar...")}</option>
                </select>
              </div>
            </div>

            
            {selectedAudience === 'custom' && (
              <div
                className={clsx(
                  "p-3 rounded-xl border space-y-2 transition-all",
                  isDark ? "bg-[#091024] border-amber-500/40" : "bg-amber-50/60 border-amber-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-amber-400">
                    <UserCheck className="w-4 h-4" />
                    <span>{t("Alohida foydalanuvchilarni belgilang")}:</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedUserIds.length} {t("ta tanlandi")}
                  </span>
                </div>

                
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("Foydalanuvchi ismi, telefoni yoki ID bo'yicha qidirish...")}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onFocus={() => setIsUserDropdownOpen(true)}
                    className={clsx(
                      "w-full rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none border transition-all",
                      isDark
                        ? "bg-[#050B18] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                        : "bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                    )}
                  />

                  
                  {isUserDropdownOpen && (
                    <div
                      className={clsx(
                        "absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border shadow-2xl z-40 divide-y custom-scrollbar",
                        isDark ? "bg-[#0D1832] border-[#1A2F57] divide-[#162748]" : "bg-white border-slate-200 divide-slate-100"
                      )}
                    >
                      <div className="p-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-0.5 px-2 py-0.5 rounded bg-black/20"
                        >
                          <X className="w-3 h-3" /> Yopish
                        </button>
                      </div>

                      {filteredUsersForPicker.length === 0 ? (
                        <div className="p-3 text-center text-slate-500 text-xs">
                          Foydalanuvchi topilmadi
                        </div>
                      ) : (
                        filteredUsersForPicker.map((u) => {
                          const isSelected = selectedUserIds.includes(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleUserSelection(u.id)}
                              className={clsx(
                                "p-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors select-none",
                                isSelected
                                  ? isDark
                                    ? "bg-[#132448] text-amber-300"
                                    : "bg-amber-100/80 text-amber-900"
                                  : isDark
                                  ? "hover:bg-[#11203E] text-slate-200"
                                  : "hover:bg-slate-50 text-slate-800"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{u.fullName}</span>
                                    <span className="text-[10px] font-mono text-amber-400">({u.id})</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {u.phone} · {t(u.region)}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {t(u.role === 'student' ? "O'quvchi" : "O'qituvchi")}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {users
                      .filter((u) => selectedUserIds.includes(u.id))
                      .map((u) => (
                        <span
                          key={u.id}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-medium"
                        >
                          <span>{u.fullName}</span>
                          <span className="font-mono text-[10px] opacity-80">({u.phone})</span>
                          <button
                            type="button"
                            onClick={() => toggleUserSelection(u.id)}
                            className="hover:text-rose-400 ml-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}

            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-400 italic">
                * {t("Manzil yoki foydalanuvchilar guruhi tanlansa, ommaviy SMS yuboriladi.")}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{t("SMS yuborish")}</span>
              </button>
            </div>
          </form>
        </div>

        
        <div className="space-y-3 pt-2">
          
          <div
            className={clsx(
              "flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            
            <div
              className={clsx(
                "flex items-center gap-1 p-1 rounded-lg border w-full lg:w-auto overflow-x-auto",
                isDark ? "bg-[#091024] border-[#162747]" : "bg-slate-100 border-slate-200"
              )}
            >
              <button
                onClick={() => setHistoryTab('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  historyTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:bg-[#11203E]' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t("Barchasi")}
              </button>
              <button
                onClick={() => setHistoryTab('otp')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  historyTab === 'otp'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:bg-[#11203E]' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t("OTP kodlar")}
              </button>
              <button
                onClick={() => setHistoryTab('notifications')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  historyTab === 'notifications'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : isDark ? 'text-slate-400 hover:bg-[#11203E]' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t("Bildirishnomalar")}
              </button>
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
                    isDark
                      ? "bg-[#091024] border-[#1A2F57] text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
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
                    isDark
                      ? "bg-[#091024] border-[#1A2F57] text-white"
                      : "bg-slate-50 border-slate-300 text-slate-900"
                  )}
                />
              </div>

              
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("Xabar bo'yicha qidirish...")}
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
                      recipient: t("Qabul qiluvchi"),
                      type: t("Xabar turi"),
                      message: t("Xabar matni"),
                      region: t("Viloyat"),
                      status: t("Holati"),
                      sentAt: t("Yuborilgan vaqt"),
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

              
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{t("Excel")}</span>
              </button>
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
                    {visibleColumns.id && <th className="py-2.5 px-3">{t("ID")}</th>}
                    {visibleColumns.recipient && <th className="py-2.5 px-3">{t("Qabul qiluvchi")}</th>}
                    {visibleColumns.type && <th className="py-2.5 px-3">{t("Xabar turi")}</th>}
                    {visibleColumns.message && <th className="py-2.5 px-3">{t("Xabar matni")}</th>}
                    {visibleColumns.region && <th className="py-2.5 px-3">{t("Viloyat")}</th>}
                    {visibleColumns.status && <th className="py-2.5 px-3">{t("Holati")}</th>}
                    {visibleColumns.sentAt && <th className="py-2.5 px-3">{t("Yuborilgan vaqt")}</th>}
                    {visibleColumns.actions && <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>}
                  </tr>
                </thead>
                <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        {t("Xabarlar topilmadi")}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => (
                      <tr
                        key={log.id}
                        className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 text-[11px] font-mono whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {visibleColumns.id && (
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                            {log.id}
                          </td>
                        )}

                        {visibleColumns.recipient && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-white">{log.userName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.phone}</div>
                          </td>
                        )}

                        {visibleColumns.type && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", getTypeBadgeClass(log.type))}>
                              {t(log.type)}
                            </span>
                          </td>
                        )}

                        {visibleColumns.message && (
                          <td className="py-2.5 px-3 max-w-md">
                            <div className="text-slate-200 line-clamp-2 leading-relaxed">
                              {log.message}
                            </div>
                          </td>
                        )}

                        {visibleColumns.region && (
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {t(log.region)}
                          </td>
                        )}

                        {visibleColumns.status && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border",
                                log.status === 'Qabul qilindi'
                                  ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/60"
                                  : log.status === 'Yuborilmadi'
                                  ? "bg-rose-950/70 text-rose-400 border-rose-800/60"
                                  : "bg-amber-950/70 text-amber-400 border-amber-800/60"
                              )}
                            >
                              {t(log.status)}
                            </span>
                          </td>
                        )}

                        {visibleColumns.sentAt && (
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {log.sentAt}
                          </td>
                        )}

                        {visibleColumns.actions && (
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => deleteNotification(log.id)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0 ml-auto"
                              title={t("O'chirish")}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t("O'chirish")}</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </EgaLayout>
  );
};
