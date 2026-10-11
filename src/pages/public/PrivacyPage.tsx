import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#0d1832]/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-white/10 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Maxfiylik va Xavfsizlik</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Maxfiylik Siyosati (Privacy Policy)
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Shaxsiy Ma’lumotlarni Himoyalash va Xavfsizlik Kafolati
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              1. Qanday shaxsiy ma’lumotlarni yig‘amiz?
            </h2>
            <p>
              IbnSinoSchool platformasi xizmatlar sifatini oshirish va musobaqalarni adolatli o‘tkazish maqsadida quyidagi ma’lumotlarni qayta ishlaydi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Shaxsiy identifikatsiya ma’lumotlari:</strong> Ism-familiya, email, sinf, hudud va maktab ma’lumotlari;</li>
              <li><strong>Proctoring & Anti-cheat texnik ma’lumotlari:</strong> Imtihon davomida kamera va audio monitoring signallari, anomaliya holatlaridagi kadrlar;</li>
              <li><strong>Akademik natijalar:</strong> Musobaqa javoblari, sarflangan vaqt va elektron sertifikat kodi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-cyan-500 pl-3">
              2. Ma’lumotlardan foydalanish maqsadlari
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Musobaqalar ishtirokchilarini verifikatsiyalash va natijalarni hisoblash;</li>
              <li>Anti-cheat tizimi yordamida halol va shaffof baholashni ta’minlash;</li>
              <li>Rasmiy sertifikat va QR-kodli verifikatsiya hujjatlarini shakllantirish;</li>
              <li>G‘oliblar va viloyatlar bo‘yicha milliy reyting jadvallarini tuzish.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-teal-500 pl-3">
              3. Ma’lumotlarni saqlash va Himoyalash
            </h2>
            <p>
              Foydalanuvchi ma’lumotlari zamonaviy shifrlash protokollari asosida himoyalanadi va uchinchi shaxslarga tijoriy maqsadlarda berilmaydi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
