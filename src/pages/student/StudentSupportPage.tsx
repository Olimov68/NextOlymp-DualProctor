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
      userEmail: user.email || 'user@nextolymp.uz',
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Yangi</span>;
      case 'jarayonda':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Jarayonda</span>;
      case 'hal_etildi':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Hal etildi</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">Yopilgan</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in font-sans text-slate-100 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-white">Murojaat va Yordam Xizmati</h1>
          </div>
          <p className="text-xs text-slate-400">
            Savol, taklif yoki texnik muammolar bo'yicha adminlarga to'g'ridan-to mezoniy xabar yuborish
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Murojaat Yuborish</span>
        </button>
      </div>

      
      {myTickets.length === 0 && !isNewModalOpen ? (
        <div className="p-12 rounded-2xl bg-[#111827] border border-dashed border-[#1E293B] text-center space-y-4 max-w-lg mx-auto mt-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-400 mx-auto flex items-center justify-center border border-blue-500/30">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Sizda hali murojaatlar mavjud emas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platforma, olimpiada testlari, sertifikatlar yoki to'lov bo'yicha savollaringiz bo'lsa, adminga murojaat yuboring.
            </p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Birinchi murojaatni yozish</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <div className="lg:col-span-4 bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden space-y-0">
            <div className="p-3.5 bg-[#0B1120] border-b border-[#1E293B] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Murojaatlarim</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px] font-mono font-bold">
                {myTickets.length} ta
              </span>
            </div>

            <div className="divide-y divide-[#1E293B] max-h-[550px] overflow-y-auto custom-scrollbar">
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
                        ? "bg-[#1E293B]/70 border-blue-500 text-white"
                        : "hover:bg-[#1E293B]/30 border-transparent text-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-amber-400">{t.id}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h4 className="text-xs font-bold line-clamp-1">{t.subject}</h4>
                    {lastMsg && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                        "{lastMsg.text}"
                      </p>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono text-right">{t.createdAt}</div>
                  </div>
                );
              })}
            </div>
          </div>

          
          <div className="lg:col-span-8 bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden flex flex-col min-h-[550px]">
            {activeTicket ? (
              <>
                
                <div className="p-4 bg-[#0B1120] border-b border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                      {activeTicket.id}
                    </span>
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <h3 className="text-sm font-bold text-white">{activeTicket.subject}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                    <span>Kategoriya: <strong className="text-blue-300">{activeTicket.category}</strong></span>
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
                          <span className={clsx("font-bold", isAdmin ? "text-emerald-400" : "text-blue-400")}>
                            {isAdmin ? "🛡️ EGA Support Admin" : "Siz"}
                          </span>
                          <span className="text-slate-500 font-mono">{msg.timestamp}</span>
                        </div>

                        <div
                          className={clsx(
                            "max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed border space-y-1",
                            isAdmin
                              ? "bg-[#091B33] border-[#1E3B66] text-slate-200 rounded-tl-none"
                              : "bg-[#1E293B] border-slate-700 text-white rounded-tr-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                <form onSubmit={handleSendReply} className="p-4 bg-[#0B1120] border-t border-[#1E293B] space-y-2">
                  {attachedFile && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-mono truncate max-w-[200px]">{attachedFile.name}</span>
                        <span className="text-[10px] text-slate-400">({attachedFile.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-slate-400 hover:text-white font-bold ml-2 cursor-pointer"
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
                      className="flex-1 p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-white outline-none focus:border-blue-500 font-medium"
                    />

                    
                    <label
                      title="Rasm yoki fayl biriktirish"
                      className="p-2.5 bg-[#111827] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
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
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Yuborish</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-600" />
                <p className="text-xs">Suhbatni ko'rish uchun chap tomondan murojaatni tanlang</p>
              </div>
            )}
          </div>
        </div>
      )}

      
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0B1120] border border-[#1E293B] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Yangi Murojaat / Taklif Yuborish
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Murojaat Mavzusi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Olimpiada sertifikatida familiyam xato yozilgan"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Kategoriya</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white outline-none font-bold"
                >
                  <option value="Olimpiada">Olimpiada va Testlar</option>
                  <option value="Sertifikat">Sertifikat va Diplomlar</option>
                  <option value="To'lov">To'lovlar va Tariflar</option>
                  <option value="Texnik muammo">Texnik Xatolik / Sayt bo'yicha</option>
                  <option value="Boshqa">Boshqa murojaat va takliflar</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Batafsil Xabar Matni</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Muammo yoki taklifingizni to'liq tushuntirib yozing..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-2.5 bg-[#111827] border border-[#1E293B] rounded-xl text-white outline-none focus:border-blue-500 resize-none font-medium"
                />
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-[#111827] text-slate-300 font-bold rounded-xl hover:bg-[#1E293B] cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
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
