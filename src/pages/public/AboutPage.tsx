import React from 'react';
import { ShieldCheck, Target, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-zinc-950 text-zinc-100 font-sans">
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-100 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Ibn Sino Platformasi
          </span> Haqida
        </h1>
        <p className="text-zinc-400 text-base max-w-2xl mx-auto leading-relaxed">
          Biz O'zbekiston va xalqaro mintaqadagi iqtidorli o'quvchilarni adolatli, yuqori sifatli va zamonaviy texnologiyalar asosida o'tkaziladigan akademik mock imtihonlar hamda olimpiadalar orqali kashf etamiz va ularni qo'llab-quvvatlaymiz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 sm:p-8 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-3.5 shadow-xl shadow-black/20 hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-zinc-100">Bizning Missiyamiz</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Akademik olimpiada masalalariga qiziqishni oshirish va eng iqtidorli maktab o'quvchilariga xalqaro maydonga chiqishda zamin yaratish.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-3.5 shadow-xl shadow-black/20 hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-zinc-100">Shaffoflik va Integrity</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Anti-cheat algoritmlari, server-side vaqt nazorati va ikki bosqichli hakamlik orqali 100% adolatli reytingni ta'minlaymiz.
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl space-y-3.5 shadow-xl shadow-black/20 hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-zinc-100">Nufuzli Sertifikatlar</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Har bir muvaffaqiyatli ishtirokchi uchun unikal QR-kodli va rasmiy verifikatsiyalangan elektron sertifikatlar beriladi.
          </p>
        </div>
      </div>
    </div>
  );
};
