import React, { useState, useMemo, useRef, useEffect } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useSupportStore } from '../../store/useSupportStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { SupportTicket } from '../../data/initialSupport';
import { clsx } from 'clsx';
import {
  LifeBuoy,
  Search,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  ShieldAlert,
  X,
  FileText,
  Trash2
} from 'lucide-react';

export const EgaSupportPage: React.FC = () => {
  const {
    tickets,
    selectedTicketId,
    setSelectedTicketId,
    addMessageToTicket,
    updateTicketStatus,
    closeTicket,
    deleteTicket
  } = useSupportStore();

  const { theme } = useThemeStore();
  const { i18n } = useI18nTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  
  const [replyText, setReplyText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const currentTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userPhone.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  
  const totalCount = tickets.length;
  const pendingCount = useMemo(() => tickets.filter((t) => t.status === 'yangi' || t.status === 'jarayonda').length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter((t) => t.status === 'hal_etildi').length, [tickets]);
  const closedCount = useMemo(() => tickets.filter((t) => t.status === 'yopildi').length, [tickets]);

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const isImageExt = allowedExtensions.some(ext => fileName.endsWith(ext));
      const isImageMime = file.type.startsWith('image/');

      if (!isImageExt || !isImageMime) {
        alert("⚠️ Xavfsizlik qoidasi: Faqat JPG, JPEG, PNG va WEBP rasm fayllarini yuklash mumkin!");
        e.target.value = '';
        return;
      }

      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFiles((prev) => [
        ...prev,
        { name: file.name, size: `${fileSizeMB} MB`, type: 'image' }
      ]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  
  const handleSendReply = (closeAfterSend = false) => {
    if (!currentTicket || (!replyText.trim() && attachedFiles.length === 0)) return;

    addMessageToTicket(currentTicket.id, replyText.trim(), 'admin', attachedFiles.length > 0 ? attachedFiles : undefined);
    setReplyText('');
    setAttachedFiles([]);

    if (closeAfterSend) {
      closeTicket(currentTicket.id);
    }
  };

  
  const getCategoryBadgeClass = (cat: SupportTicket['category']) => {
    switch (cat) {
      case "To'lov":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Texnik muammo":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "Sertifikat":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "Olimpiada":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  
  const getPriorityBadgeClass = (p: SupportTicket['priority']) => {
    switch (p) {
      case 'yuqori':
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case 'orta':
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case 'past':
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  
  const getStatusBadgeClass = (st: SupportTicket['status']) => {
    switch (st) {
      case 'yangi':
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case 'jarayonda':
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case 'hal_etildi':
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case 'yopildi':
        return "bg-slate-500/20 text-slate-400 border-slate-500/40";
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
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              {t("Yordam Xizmati Bo'limi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Foydalanuvchilar murojaatlarini ko'rish va tezkor yordam berish")}
            </p>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-2.5 transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t("Jami Murojaatlar")}</div>
              <div className="text-sm font-black text-white">{totalCount} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-2.5 transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t("Kutilayotganlar")}</div>
              <div className="text-sm font-black text-amber-400">{pendingCount} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-2.5 transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t("Hal etildi")}</div>
              <div className="text-sm font-black text-emerald-400">{resolvedCount} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border flex items-center gap-2.5 transition-all",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t("Yopilganlar")}</div>
              <div className="text-sm font-black text-slate-300">{closedCount} ta</div>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[580px]">
          
          <div
            className={clsx(
              "lg:col-span-4 rounded-xl border shadow-sm flex flex-col h-full min-h-[580px] transition-colors overflow-hidden",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            
            <div className={clsx("p-3 border-b space-y-2.5", isDark ? "border-[#182A4D] bg-[#091024]" : "border-slate-200 bg-slate-50")}>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-slate-300">
                  <LifeBuoy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("Murojaatlar ro'yxati")}</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  {filteredTickets.length} ta
                </span>
              </div>

              
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("Murojaat yoki Ismni qidirish...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={clsx(
                    "w-full rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none transition-all border",
                    isDark
                      ? "bg-[#050B18] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                      : "bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                  )}
                />
              </div>

              
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-all",
                    statusFilter === 'all'
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : isDark ? "text-slate-400 hover:bg-[#11203E]" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t("Barchasi")}
                </button>
                <button
                  onClick={() => setStatusFilter('yangi')}
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-all",
                    statusFilter === 'yangi'
                      ? "bg-blue-500 text-white font-bold"
                      : isDark ? "text-slate-400 hover:bg-[#11203E]" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t("Yangi")}
                </button>
                <button
                  onClick={() => setStatusFilter('jarayonda')}
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-all",
                    statusFilter === 'jarayonda'
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : isDark ? "text-slate-400 hover:bg-[#11203E]" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t("Jarayonda")}
                </button>
                <button
                  onClick={() => setStatusFilter('hal_etildi')}
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-all",
                    statusFilter === 'hal_etildi'
                      ? "bg-emerald-500 text-white font-bold"
                      : isDark ? "text-slate-400 hover:bg-[#11203E]" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t("Hal etildi")}
                </button>
                <button
                  onClick={() => setStatusFilter('yopildi')}
                  className={clsx(
                    "px-2 py-1 rounded text-[10px] font-semibold shrink-0 cursor-pointer transition-all",
                    statusFilter === 'yopildi'
                      ? "bg-slate-600 text-white font-bold"
                      : isDark ? "text-slate-400 hover:bg-[#11203E]" : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t("Yopildi")}
                </button>
              </div>
            </div>

            
            <div className="flex-1 overflow-y-auto divide-y divide-[#162748] custom-scrollbar max-h-[500px]">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {t("Murojaatlar topilmadi")}
                </div>
              ) : (
                filteredTickets.map((tItem) => {
                  const isSelected = tItem.id === currentTicket?.id;
                  const lastMsg = tItem.messages[tItem.messages.length - 1];

                  return (
                    <div
                      key={tItem.id}
                      onClick={() => setSelectedTicketId(tItem.id)}
                      className={clsx(
                        "p-3 cursor-pointer transition-all flex flex-col gap-1.5 border-l-4",
                        isSelected
                          ? isDark
                            ? "bg-[#112144] border-amber-400"
                            : "bg-amber-50/70 border-amber-500"
                          : isDark
                          ? "hover:bg-[#0A1329] border-transparent"
                          : "hover:bg-slate-50 border-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-amber-400">
                          {tItem.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border", getCategoryBadgeClass(tItem.category))}>
                            {t(tItem.category)}
                          </span>
                          <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase", getStatusBadgeClass(tItem.status))}>
                            {t(tItem.status === 'yangi' ? 'Yangi' : tItem.status === 'jarayonda' ? 'Jarayonda' : tItem.status === 'hal_etildi' ? 'Hal etildi' : 'Yopildi')}
                          </span>
                        </div>
                      </div>

                      <div className={clsx("font-bold text-xs line-clamp-1", isDark ? "text-white" : "text-slate-900")}>
                        {tItem.subject}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          {tItem.userName}
                        </span>
                        <span className="font-mono text-[10px]">{tItem.createdAt}</span>
                      </div>

                      {lastMsg && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-black/20 p-1 rounded">
                          "{lastMsg.text}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          
          <div
            className={clsx(
              "lg:col-span-8 rounded-xl border shadow-sm flex flex-col h-full min-h-[580px] transition-colors overflow-hidden",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            {currentTicket ? (
              <>
                
                <div className={clsx("p-4 border-b space-y-3", isDark ? "border-[#182A4D] bg-[#091024]" : "border-slate-200 bg-slate-50")}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {currentTicket.id}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border", getCategoryBadgeClass(currentTicket.category))}>
                          {t(currentTicket.category)}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", getPriorityBadgeClass(currentTicket.priority))}>
                          {currentTicket.priority} {t("muhimlik")}
                        </span>
                      </div>
                      <h2 className={clsx("text-sm font-bold mt-1.5", isDark ? "text-white" : "text-slate-900")}>
                        {currentTicket.subject}
                      </h2>
                    </div>

                    
                    <div className="flex items-center gap-2">
                      {currentTicket.status !== 'yopildi' ? (
                        <button
                          onClick={() => closeTicket(currentTicket.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t("Muammoni yopish")}</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          {t("Yopilgan")}
                        </span>
                      )}

                      <button
                        onClick={() => deleteTicket(currentTicket.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                        title={t("Murojaatni o'chirish")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  
                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 text-slate-400 border-t border-[#142344]">
                    <span className="flex items-center gap-1 font-bold text-white">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      {currentTicket.userName} ({currentTicket.userRole === 'student' ? "O'quvchi" : "O'qituvchi"})
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      {currentTicket.userPhone}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      {currentTicket.userEmail}
                    </span>
                    <span className="flex items-center gap-1 font-mono ml-auto text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {currentTicket.createdAt}
                    </span>
                  </div>
                </div>

                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px] custom-scrollbar">
                  {currentTicket.messages.map((msg) => {
                    const isUser = msg.sender === 'user';

                    return (
                      <div
                        key={msg.id}
                        className={clsx("flex flex-col", isUser ? "items-start" : "items-end")}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={clsx("text-[10px] font-bold flex items-center gap-1", isUser ? "text-amber-400" : "text-emerald-400")}>
                            {isUser ? <User className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {msg.senderName}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
                        </div>

                        <div
                          className={clsx(
                            "max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed space-y-2 border",
                            isUser
                              ? isDark
                                ? "bg-[#091126] border-[#182F5C] text-slate-200 rounded-tl-none"
                                : "bg-slate-100 border-slate-300 text-slate-900 rounded-tl-none"
                              : isDark
                              ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-100 rounded-tr-none"
                              : "bg-emerald-50 border-emerald-300 text-emerald-900 rounded-tr-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                {t("Biriktirilgan fayllar")}:
                              </div>
                              {msg.attachments.map((att, attIdx) => (
                                <div
                                  key={attIdx}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-[11px]"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="font-mono truncate">{att.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono ml-auto">{att.size}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                <div className={clsx("p-4 border-t space-y-3", isDark ? "border-[#182A4D] bg-[#091024]" : "border-slate-200 bg-slate-50")}>
                  
                  {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {attachedFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[11px] font-mono"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{f.name} ({f.size})</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-slate-400 hover:text-rose-400 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  
                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder={t("Javob matnini kiriting...")}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className={clsx(
                        "w-full rounded-xl px-3 py-2.5 text-xs outline-none border transition-all resize-none pr-10",
                        isDark
                          ? "bg-[#050B18] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                          : "bg-white border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                      )}
                    />

                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-3 top-3 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title={t("Fayl biriktirish")}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>

                  
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendReply(false)}
                      disabled={!replyText.trim() && attachedFiles.length === 0}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t("Javob Yuborish")}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <LifeBuoy className="w-12 h-12 text-slate-600" />
                <p className="text-xs">{t("Suhbatni ko'rish uchun chap ro'yxatdan murojaatni tanlang")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </EgaLayout>
  );
};
