import React from 'react';
import { Award, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RulesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 bg-white border border-border p-8 md:p-12 rounded-3xl shadow-xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
        </Link>

        <div className="border-b border-border pb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Rasmiy Reglament</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-accent-900 tracking-tight">
            Musobaqa Nizomi va Anti-Cheat Qoidalari
          </h1>
          <p className="text-xs text-accent-500 font-medium">
            Next Olymp Akademik Musobaqalari bo'yicha Rasmiy Nizom
          </p>
        </div>

        <div className="space-y-6 text-sm text-accent-800 leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-amber-500 pl-3">
              1. Musobaqani o'tkazish tartibi va tayyorgarlik
            </h2>
            <p>
              Musobaqalar belgilangan sana va soatda avtomatik ravishda boshlanadi. Ishtirokchilar musobaqa boshlanishidan 10 daqiqa oldin shaxsiy kabinetlariga kirib, internet tezligi va kameralarini tekshirib olishlari tavsiya etiladi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-amber-500 pl-3">
              2. Anti-Cheat va Proctoring Talablari
            </h2>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Nazorat va Qoidabuzarlik Mezonlari:</span>
              </h3>
              <ul className="list-disc pl-5 text-xs text-amber-950 space-y-1">
                <li><strong>Tab-Switching (Oynadan chiqish):</strong> Test davomida brauzer oynasini yopish yoki boshqa ilovaga o'tish 1-marta ogohlantirish, 3-marta diskvalifikatsiyaga sabab bo'ladi.</li>
                <li><strong>Kamera va Yuz holati nazorati:</strong> Kamera kadrida ishtirokchi yuzi 15 soniyadan ortiq ko'rinmay qolsa yoki ikkinchi shaxs aniqlansa qoidabuzarlik qayd etiladi.</li>
                <li><strong>DevTools va Inspect block:</strong> Dasturchi vositalarini ochishga urinish darhol testni to'xtatadi.</li>
                <li><strong>Klipbord nazorati:</strong> Matnni nusxalash yoki tashlash (Copy-Paste) bloklangan.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-amber-500 pl-3">
              3. Baholash va Reyting shakllantirish (Glikman Tizimi)
            </h2>
            <p>
              Musobaqa natijalari har bir to'g'ri javob uchun ajratilgan ballar yig'indisi va testni topshirishga sarflangan vaqt (sekundlar) bo'yicha hisoblanadi. Bir xil ball toplayotgan ishtirokchilar orasida kamroq vaqt sarflagan o'quvchi yuqoriroq o'rinni egallaydi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-accent-900 border-l-4 border-amber-500 pl-3">
              4. G'oliblarni Aniqlash va Sertifikatlash
            </h2>
            <p>
              Musobaqa yakunlangach 24 soat ichida anti-cheat audit tekshiruvi o'tkaziladi. Auditdan muvaffaqiyatli o'tgan ishtirokchilarning sertifikatlari shaxsiy kabinetda faollashadi va QR-kodli verifikatsiya bazasiga kiritiladi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
