import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#0d1832]/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-white/10 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-400 text-xs font-bold border border-cyan-500/30">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Rasmiy Hujjat</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Foydalanish Shartlari va Reglament
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Abu Ali ibn Sino nomidagi Onlayn Ta’lim va Olimpiada Platformasi
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              1. Umumiy qoidalar va Kelishuv mavzusi
            </h2>
            <p>
              Ushbu Foydalanish shartlari (keyingi o‘rinlarda — "Shartlar") IbnSinoSchool platformasi va platformada ro‘yxatdan o‘tgan hamda undan foydalanuvchi jismoniy shaxs (keyingi o‘rinlarda — "Foydalanuvchi") o‘rtasidagi huquqiy munosabatlarni tartibga soladi.
            </p>
            <p>
              Platformada ro‘yxatdan o‘tish yoki musobaqalarda qatnashish orqali Foydalanuvchi ushbu Shartlarni to‘liq va shartlarsiz qabul qiladi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              2. Akkaunt va Xavfsizlik
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Foydalanuvchi ro‘yxatdan o‘tishda to‘g‘ri va amaldagi shaxsiy ma’lumotlarini kiritishi shart.</li>
              <li>Akkaunt ma’lumotlari va parollarning maxfiyligini saqlash uchun shaxsan Foydalanuvchi javobgardir.</li>
              <li>Boshqa shaxs nomidan musobaqada qatnashish qat’iyan man etiladi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              3. Musobaqalarda qatnashish shartlari
            </h2>
            <p>
              Barcha akademik musobaqalar belgilangan vaqt reglamenti hamda Anti-Cheat sun’iy intellekt nazorati ostida o‘tkaziladi. Musobaqa davomida nohalol harakatlar cheklanadi va diskvalifikatsiyaga sabab bo‘lishi mumkin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
