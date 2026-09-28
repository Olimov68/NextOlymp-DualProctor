import React from 'react';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-border p-8 md:p-12 rounded-3xl shadow-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Maxfiylik va Xavfsizlik</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-accent-900 tracking-tight">
            Maxfiylik Siyosati (Privacy Policy)
          </h1>
          <p className="text-xs text-accent-500 font-medium">
            Oxirgi tahrir: 2026-yil 1-sentyabr | Shaxsiy Ma'lumotlarni Himoyalash
          </p>
        </div>

        <div className="space-y-6 text-sm text-accent-800 leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-emerald-600 pl-3">
              1. Qanday shaxsiy ma'lumotlarni yig'amiz?
            </h2>
            <p>
              Next Olymp platformasi xizmatlar sifatini oshirish va musobaqalarni adolatli o'tkazish maqsadida quyidagi ma'lumotlarni yig'adi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Shaxsiy identifikatsiya ma'lumotlari:</strong> Ism-familiya, email, telefon raqami, sinf, hudud va maktab kiritmasi;</li>
              <li><strong>Proctoring & Anti-cheat texnik ma'lumotlari:</strong> Kamera va audio treklari (test davomida), IP manzil, brauzer turi hamda oyna faollik jurnali;</li>
              <li><strong>Akademik natijalar:</strong> Musobaqa javoblari, sarflangan vaqt va sertifikat kodi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-emerald-600 pl-3">
              2. Ma'lumotlardan foydalanish maqsadlari
            </h2>
            <p>
              Yig'ilgan ma'lumotlar faqat quyidagi maqsadlarda ishlatiladi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Musobaqalar ishtirokchilarini verifikatsiyalash va natijalarni hisoblash;</li>
              <li>Anti-cheat xavfsizlik tizimi yordamida halol va shaffof baholashni ta'minlash;</li>
              <li>Rasmiy sertifikat va QR-kodli verifikatsiya hujjatlarini shakllantirish;</li>
              <li>G'oliblar va viloyatlar bo'yicha milliy reyting jadvallarini tuzish.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-emerald-600 pl-3">
              3. Ma'lumotlarni saqlash va Himoyalash (Encryption)
            </h2>
            <p>
              Barcha shaxsiy va akademik ma'lumotlar zamonaviy SSL/TLS shifrlash protokollari hamda AES-256 algoritmlari orqali himoyalangan serverlarda saqlanadi. Ma'lumotlar hech qachon tijorat maqsadida uchinchi shaxslarga berilmaydi yoki sotilmaydi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-emerald-600 pl-3">
              4. Foydalanuvchining huquqlari
            </h2>
            <p>
              Foydalanuvchilar o'z shaxsiy ma'lumotlarini ko'rish, tuzatish kiritish yoki platformadan akkauntni to'liq o'chirishni talab qilish huquqiga ega. Buning uchun <strong>privacy@nextolymp.uz</strong> manziliga so'rov yuborish kifoya.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
