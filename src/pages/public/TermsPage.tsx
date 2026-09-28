import React from 'react';
import { FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-border p-8 md:p-12 rounded-3xl shadow-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Rasmiy Hujjat</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-accent-900 tracking-tight">
            Foydalanish Shartlari va Ommaviy Oferta
          </h1>
          <p className="text-xs text-accent-500 font-medium">
            Oxirgi yangilangan sana: 2026-yil 1-sentyabr | Next Olymp Platformasi
          </p>
        </div>

        <div className="space-y-6 text-sm text-accent-800 leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              1. Umumiy qoidalar va Kelishuv mavzusi
            </h2>
            <p>
              Ushbu Foydalanish shartlari (keyingi o'rinlarda — "Shartlar") "Next Olymp Inc." platformasi (keyingi o'rinlarda — "Platforma") va platformada ro'yxatdan o'tgan hamda undan foydalanuvchi jismoniy shaxs (keyingi o'rinlarda — "Foydalanuvchi") o'rtasidagi huquqiy munosabatlarni tartibga soladi.
            </p>
            <p>
              Platformada ro'yxatdan o'tish yoki xizmatlardan foydalanish orqali Foydalanuvchi ushbu Shartlarni to'liq va shartlarsiz qabul qiladi (Offer ofertasi).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              2. Akkaunt va Xavfsizlik
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Foydalanuvchi ro'yxatdan o'tishda to'g'ri va amaldagi shaxsiy ma'lumotlarini (F.I.SH, email, telefon, maktab va sinf) kiritishi shart.</li>
              <li>Akkaunt ma'lumotlari va parollarning maxfiyligini saqlash uchun shaxsan Foydalanuvchi javobgardir.</li>
              <li>Akkauntni uchinchi shaxslarga berish yoki boshqa shaxs nomidan musobaqada qatnashish qat'iyan man etiladi.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              3. Musobaqalarda qatnashish shartlari
            </h2>
            <p>
              Barcha akademik musobaqalar belgilangan vaqt reglamenti hamda Anti-Cheat sun'iy intellekt nazorati ostida o'tkaziladi. Musobaqa davomida quyidagi harakatlar qat'iyan taqiqlanadi:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-rose-700 font-semibold">
              <li>Brauzer oynasidan boshqa ilovalarga o'tish (Tab switching);</li>
              <li>Kamera kadrini yopish yoki ekrandan uzoq vaqt chetga qarash;</li>
              <li>Boshqa shaxslar yordamidan yoki AI vositalaridan foydalanish;</li>
              <li>DevTools (konsol) hamda nusxa olish (Copy-Paste) harakatlari.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              4. Intellektual mulk huquqlari
            </h2>
            <p>
              Next Olymp platformasidagi barcha savollar, grafik materiallar, metodologik topshiriqlar va dasturiy kodlar "Next Olymp Inc." intellektual mulki hisoblanadi. Ularni nusxalash, tarqatish yoki tijorat maqsadida foydalanish taqiqlanadi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              5. To'lovlar va qaytarish siyosati
            </h2>
            <p>
              Pullik olimpiadalarga a'zolik to'lovi amalga oshirilgandan so'ng, ishtirok etish imkoniyati darhol faollashadi. Musobaqa boshlanishiga 24 soat qolganda to'lov qaytarilmaydi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-primary pl-3">
              6. Bog'lanish va qo'llab-quvvatlash
            </h2>
            <p>
              Foydalanish shartlari bo'yicha savollaringiz bo'lsa, <strong>support@nextolymp.uz</strong> yoki <strong>+998 99-174-99-33</strong> telefon raqami orqali bog'lanishingiz mumkin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
