import React, { useState } from 'react';
import { useSupportStore } from '../../store/useSupportStore';
import { useAuth } from '../../hooks/useAuth';
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  User,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Paperclip,
  FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

export const StudentSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { tickets, createTicket, addMessageToTicket } = useSupportStore();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Olimpiada' | 'To\'lov' | 'Sertifikat' | 'Texnik muammo' | 'Boshqa'>('Olimpiada');
  const [priority, setPriority] = useState<'yuqori' | 'orta' | 'past'>('orta');
  const [messageText, setMessageText] = useState('');

  const [replyText, setReplyText] = useState('');

  const myTickets = tickets.filter(
    (t) => (user?.id && t.userId === user.id) || (user?.email && t.userEmail === user.email)
  );

  const activeTicket = myTickets.find((t) => t.id === activeTicketId) || myTickets[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const isImageExt = allowedExtensions.some(ext => fileName.endsWith(ext));
    const isImageMime = file.type.startsWith('image/');

    if (!isImageExt || !isImageMime) {
      alert("⚠️ Xavfsizlik qoidasi: Faqat JPG, JPEG, PNG va WEBP rasm fayllarini yuklash mumkin! Boshqa formatlar taqiqlanadi.");
      e.target.value = '';
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setAttachedFile({
      name: file.name,
      size: `${sizeMb} MB`,
      type: 'Rasm (JPG/PNG)'
    });
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !messageText.trim() || !user) return;

    createTicket({
      userId: user.id,
      userName: user.fullName || 'O\'quvchi',
      userPhone: user.phone || '+998 90 123 45 67',
      userEmail: user.email || 'user@ibnsino.uz',
      userRole: (user.role as any) || 'student',
      subject: subject.trim(),
      category,
      priority,
      messageText: messageText.trim()
    });

    setSubject('');
    setMessageText('');
    setIsNewModalOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !attachedFile) return;
    if (!activeTicket || !user) return;

    addMessageToTicket(
      activeTicket.id,
      replyText.trim() || (attachedFile ? `[Fayl biriktirildi: ${attachedFile.name}]` : ''),
      'user',
      attachedFile ? [attachedFile] : undefined
    );

    setReplyText('');
    setAttachedFile(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'yangi':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Yangi</span>;
      case 'jarayonda':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">Jarayonda</span>;
      case 'hal_etildi':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">Hal etildi</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Yopilgan</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in text-zinc-100 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-zinc-100">Murojaat va Yordam Xizmati</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Savol, taklif yoki texnik muammolar bo'yicha adminlarga to'g'ridan-to'g'ri murojaat yuborish
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Murojaat Yuborish</span>
        </button>
      </div>

      
      {myTickets.length === 0 && !isNewModalOpen ? (
        <div className="p-12 rounded-2xl bg-zinc-900/60 border border-dashed border-white/10 text-center space-y-4 max-w-lg mx-auto mt-6 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-100">Sizda hali murojaatlar mavjud emas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Platforma, olimpiada testlari, sertifikatlar yoki to'lov bo'yicha savollaringiz bo'lsa, adminga murojaat yuboring.
            </p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Birinchi murojaatni yozish</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <div className="lg:col-span-4 bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md space-y-0 shadow-xl">
            <div className="p-3.5 bg-zinc-950/80 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Murojaatlarim</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/20">
                {myTickets.length} ta
              </span>
            </div>

            <div className="divide-y divide-white/5 max-h-[550px] overflow-y-auto custom-scrollbar">
              {myTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const lastMsg = t.messages[t.messages.length - 1];

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTicketId(t.id)}
                    className={clsx(
                      "p-3.5 cursor-pointer transition-all space-y-1.5 border-l-4",
                      isSelected
                        ? "bg-zinc-800/70 border-emerald-500 text-white"
                        : "hover:bg-zinc-800/40 border-transparent text-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-amber-400">{t.id}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4 className="text-xs font-bold line-clamp-1">{t.subject}</h4>
                    {lastMsg && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                        "{lastMsg.text}"
                      </p>
                    )}
                    <div className="text-[10px] text-zinc-500 font-mono text-right">{t.createdAt}</div>
                  </div>
                );
              })}
            </div>
          </div>

          
          <div className="lg:col-span-8 bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col min-h-[550px] shadow-xl">
            {activeTicket ? (
              <>
                
                <div className="p-4 bg-zinc-950/80 border-b border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                      {activeTicket.id}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">{activeTicket.subject}</h3>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-3 font-mono">
                    <span>Kategoriya: <strong className="text-emerald-400">{activeTicket.category}</strong></span>
                    <span>Yuborilgan: {activeTicket.createdAt}</span>
                  </div>
                </div>

                
                <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                  {activeTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={clsx("flex flex-col", isAdmin ? "items-start" : "items-end")}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                          <span className={clsx("font-bold", isAdmin ? "text-emerald-400" : "text-teal-400")}>
                            {isAdmin ? "🛡️ Ibn Sino Qo'llab-quvvatlash" : "Siz"}
                          </span>
                          <span className="text-zinc-500 font-mono">{msg.timestamp}</span>
                        </div>

                        <div
                          className={clsx(
                            "max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed border space-y-1",
                            isAdmin
                              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-100 rounded-tl-none"
                              : "bg-zinc-800/80 border-white/10 text-zinc-100 rounded-tr-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                <form onSubmit={handleSendReply} className="p-4 bg-zinc-950/80 border-t border-white/10 space-y-2">
                  {attachedFile && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono truncate max-w-[200px]">{attachedFile.name}</span>
                        <span className="text-[10px] text-zinc-400">({attachedFile.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-zinc-400 hover:text-white font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Qo'shimcha javob yoki savol yozing..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                    />

                    
                    <label
                      title="Rasm yoki fayl biriktirish"
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center active:scale-95"
                    >
                      <Paperclip className="w-4 h-4 text-zinc-400 hover:text-emerald-400 transition-colors" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!replyText.trim() && !attachedFile}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Yuborish</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-zinc-600" />
                <p className="text-xs">Suhbatni ko'rish uchun chap tomondan murojaatni tanlang</p>
              </div>
            )}
          </div>
        </div>
      )}

      
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-zinc-900/95 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-zinc-100 space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Yangi Murojaat / Taklif Yuborish
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Murojaat Mavzusi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Olimpiada sertifikatida familiyam xato yozilgan"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Kategoriya</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 outline-none font-bold"
                >
                  <option value="Olimpiada">Olimpiada va Testlar</option>
                  <option value="Sertifikat">Sertifikat va Diplomlar</option>
                  <option value="To'lov">To'lovlar va Tariflar</option>
                  <option value="Texnik muammo">Texnik Xatolik / Sayt bo'yicha</option>
                  <option value="Boshqa">Boshqa murojaat va takliflar</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1">Batafsil Xabar Matni</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Muammo yoki taklifingizni to'liq tushuntirib yozing..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 outline-none focus:border-emerald-500 resize-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 cursor-pointer active:scale-95 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Adminga Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
