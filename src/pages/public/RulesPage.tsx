import React from 'react';
import { Award, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RulesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-[#0d1832]/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-white/10 pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Rasmiy Reglament</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Musobaqa Nizomi va Anti-Cheat Qoidalari
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Abu Ali ibn Sino nomidagi Akademik Musobaqalar bo‘yicha Rasmiy Nizom
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-normal">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              1. Musobaqani o‘tkazish tartibi va tayyorgarlik
            </h2>
            <p>
              Musobaqalar belgilangan sana va soatda avtomatik ravishda boshlanadi. Ishtirokchilar musobaqa boshlanishidan 10 daqiqa oldin shaxsiy kabinetlariga kirib, internet tezligi va kameralarini tekshirib olishlari tavsiya etiladi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-amber-500 pl-3">
              2. Anti-Cheat va Proctoring Talablari
            </h2>
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
              <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Nazorat va Qoidabuzarlik Mezonlari:</span>
              </h3>
              <ul className="list-disc pl-5 text-xs text-amber-200/90 space-y-1.5">
                <li><strong>Tab-Switching (Oynadan chiqish):</strong> Test davomida brauzer oynasini yopish yoki boshqa ilovaga o‘tish server darajasida qayd etiladi va ogohlantirish beriladi.</li>
                <li><strong>Kamera va Yuz holati nazorati:</strong> MediaPipe Face Mesh orqali ko‘z va yuz holati tekshiriladi. Begona shaxs aniqlansa qoidabuzarlik yoziladi.</li>
                <li><strong>DevTools va Inspect block:</strong> Dasturchi vositalarini ochishga urinishlar qayd etiladi.</li>
                <li><strong>Klipbord nazorati:</strong> Matnni nusxalash yoki tashlash (Copy-Paste) cheklangan.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-cyan-500 pl-3">
              3. Baholash va Reyting shakllantirish
            </h2>
            <p>
              Musobaqa natijalari har bir to‘g‘ri javob uchun ajratilgan ballar yig‘indisi va testni topshirishga sarflangan vaqt bo‘yicha hisoblanadi. Bir xil ball to‘playotgan ishtirokchilar orasida kamroq vaqt sarflagan o‘quvchi yuqoriroq o‘rinni egallaydi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white border-l-4 border-emerald-500 pl-3">
              4. G‘oliblarni Aniqlash va Sertifikatlash
            </h2>
            <p>
              Musobaqa yakunlangach, rasmiy natijalar tasdiqlanadi. Ishtirokchilarning sertifikatlari shaxsiy kabinetda faollashadi va QR-kodli verifikatsiya bazasiga kiritiladi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
