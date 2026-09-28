import React from 'react';
import { ShieldCheck, Target, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-[#0B1120] text-[#F1F5F9]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-[#F1F5F9] tracking-tight">Next Olymp Haqida</h1>
        <p className="text-[#94A3B8] text-base max-w-2xl mx-auto leading-relaxed">
          Biz O'zbekiston va MDH mintaqasidagi iqtidorli o'quvchilarni adolatli, yuqori sifatli va zamonaviy texnologiyalar asosida o'tkaziladigan akademik olimpiadalar orqali kashf etamiz va ularni qo'llab-quvvatlaymiz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#111827] border border-[#1E293B] rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#F1F5F9]">Bizning Missiyamiz</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Akademik olimpiada masalalariga qiziqishni oshirish va eng iqtidorli maktab o'quvchilariga xalqaro maydonga chiqishda zamin yaratish.
          </p>
        </div>

        <div className="p-6 bg-[#111827] border border-[#1E293B] rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#F1F5F9]">Shaffoflik va Integrity</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Anti-cheat algoritmlari, server-side vaqt nazorati va ikki bosqichli hakamlik orqali 100% adolatli reytingni ta'minlaymiz.
          </p>
        </div>

        <div className="p-6 bg-[#111827] border border-[#1E293B] rounded-xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#F1F5F9]">Nufuzli Sertifikatlar</h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Har bir muvaffaqiyatli ishtirokchi uchun unikal QR-kodli va rasmiy verifikatsiyalangan elektron sertifikatlar beriladi.
          </p>
        </div>
      </div>
    </div>
  );
};
