# IbnSinoSchool — Frontend dizayn va animatsiya bo‘yicha majburiy topshiriq

Ushbu fayl loyihaning ildizidagi `AGENTS.md` bilan birga saqlansin. Frontendga o‘zgartirish kiritadigan har qanday AI yoki dasturchi avval ikkala faylni to‘liq o‘qishi shart.

## 1. Rol

Sen yuqori darajadagi Product Designer, UI/UX Designer va Senior React/TypeScript Frontend muhandisisan. Vazifang — IbnSinoSchool / NextOlymp loyihasining mavjud funksiyalarini buzmasdan, frontendni original, zamonaviy, premium, ishonchli va jonli ko‘rinishga keltirish.

Natija oddiy tayyor dashboard shabloniga, tasodifiy rangli kartalar to‘plamiga yoki boshqa saytning nusxasiga o‘xshamasin. Dizayn Ibn Sino maktabi va onlayn olimpiada platformasiga xos bo‘lsin.

## 2. Asosiy maqsad

Frontend quyidagi taassurotni bersin:

- zamonaviy ta’lim va ilm-fan platformasi;
- professional va ishonchli;
- innovatsion, lekin o‘quvchi uchun tushunarli;
- premium motion design;
- katta ekran, planshet va telefonlarda to‘liq moslashuvchan;
- light va dark rejimlarda izchil;
- tez, accessible va real ma’lumotlarga asoslangan.

MotionSites namunasi vizual kayfiyat uchun reference hisoblanadi: full-bleed cinematic hero, floating navigation, yumshoq glow, kuchli tipografik markaz, qatlamli fon va sokin entrance animatsiyalar. Uning matni, logotipi, videosi, fonti, maketi yoki brendini aynan nusxalamang.

## 3. Mavjud loyihani saqlash

Bu yangi statik sayt yaratish vazifasi emas. Mavjud React + TypeScript + Vite + Tailwind loyihasi ichida ishlang.

Majburiy qoidalar:

1. Mavjud route, API contract, store, auth, role, i18n, form va biznes mantiqini saqlang.
2. Kodni `index.html + styles.css + main.js` ko‘rinishida qayta yozmang.
3. Faqat dizayn uchun server contractini yoki xavfsizlik qoidalarini o‘zgartirmang.
4. Mavjud componentlarni imkon qadar refactor va reuse qiling.
5. Dizayn o‘zgarishidan oldin sahifaning desktop va mobile holatini tekshiring.
6. Har bir katta bosqichdan keyin build va asosiy user flowlarni tekshiring.
7. Oldingi ishlaydigan holatga qaytish oson bo‘lishi uchun o‘zgarishlarni kichik va mantiqiy guruhlarga ajrating.

## 4. Dizayn yo‘nalishi

### 4.1 Brend ruhi

- Asosiy accent: emerald/teal.
- Qo‘shimcha accent: cyan va cheklangan violet/indigo.
- Xavf: rose/red.
- Ogohlantirish: amber.
- Dark fon: sof `#000` emas, chuqur navy/zinc qatlamlari.
- Light fon: iliq oq/slate, ko‘zni qamashtiradigan sof oq maydonlardan ehtiyot bo‘ling.
- Logotip, o‘zbekcha ta’lim mazmuni va ilm-fan ruhi markazda qolsin.

Tavsiya etilgan tokenlar:

```css
:root {
  --brand-500: #10b981;
  --brand-400: #34d399;
  --cyan-400: #22d3ee;
  --violet-400: #a78bfa;
  --danger-500: #f43f5e;
  --warning-500: #f59e0b;

  --bg-dark: #070b14;
  --surface-dark: rgba(13, 24, 50, 0.72);
  --surface-dark-strong: #0d1832;
  --border-dark: rgba(148, 163, 184, 0.14);
  --text-dark: #f8fafc;
  --muted-dark: #94a3b8;

  --bg-light: #f6f8fb;
  --surface-light: rgba(255, 255, 255, 0.88);
  --border-light: rgba(15, 23, 42, 0.10);
  --text-light: #0f172a;
  --muted-light: #64748b;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --shadow-soft: 0 12px 40px rgba(2, 8, 23, 0.10);
  --shadow-glow: 0 0 32px rgba(16, 185, 129, 0.18);
}
```

Tokenlarni markaziy joyda saqlang. Har component ichida bir-biriga yaqin, lekin turli hex ranglarni ko‘paytirmang.

### 4.2 Tipografiya

- UI uchun loyihadagi mavjud `Plus Jakarta Sans` / `Inter` stackini saqlang.
- Display font faqat landing hero, yirik raqam yoki qisqa accent sarlavhada ishlatilishi mumkin.
- Admin jadval, forma va imtihon savollarida dekorativ font ishlatmang.
- H1: kuchli, ixcham tracking, responsive `clamp()`.
- Body: 14–16 px, o‘qilishi qulay line-height.
- 10 px yoki undan kichik matnni asosiy ma’lumot uchun ishlatmang.
- O‘zbekcha apostrof va uzun sarlavhalarda qator buzilishini tekshiring.

## 5. Ommaviy landing page

Landing page MotionSites’dagi premium hissiyotdan ilhomlansin, lekin IbnSinoSchool uchun original kompozitsiya bo‘lsin.

### 5.1 Birinchi viewport

Desktopda birinchi ko‘rinishda quyidagilar sig‘sin:

1. Floating header.
2. Ishonch badge yoki qisqa status.
3. Asosiy sarlavha.
4. Qisqa izoh.
5. Ikki CTA.
6. Real statistikalar yoki platforma afzalliklari.

Tavsiya etilgan kontent:

```text
Badge: O‘zbekiston bo‘ylab zamonaviy olimpiadalar

H1: Bilimni sinang.
    Kelajakni zabt eting.

Izoh: IbnSinoSchool — o‘quvchilar, ustozlar va maktablar uchun xavfsiz,
shaffof va zamonaviy olimpiada platformasi.

Primary CTA: Olimpiadalarni ko‘rish
Secondary CTA: Tizimga kirish
```

Matnni mavjud mahsulot funksiyalariga moslashtirish mumkin, ammo tekshirilmagan raqam yoki da’vo qo‘shmang.

### 5.2 Fon

Quyidagilardan biri ishlatilsin:

- loyiha uchun maxsus tayyorlangan qisqa abstract science/education video;
- WebGL/canvas’siz yengil CSS aurora va particle qatlamlari;
- optimallashtirilgan animated gradient mesh va nozik grid.

Agar video ishlatilsa:

- faqat loyiha egasi ruxsat bergan local assetdan foydalaning;
- `/public/assets/hero/ibnsino-hero.webm` va MP4 fallback;
- poster rasm majburiy;
- `autoplay muted loop playsInline`;
- overlay matn kontrastini saqlasin;
- mobile yoki `prefers-reduced-motion`da poster/static fon ishlashi mumkin;
- third-party CloudFront URL yoki boshqa sayt videosini hotlink qilmang;
- video yuklanmasa sahifa buzilmasin;
- foydalanuvchi mobil trafiki va batareyasini hisobga oling.

### 5.3 Floating header

- Logo chapda.
- Asosiy navigatsiya markazda pill/glass surface ichida.
- Til, theme va login o‘ngda.
- Scroll boshlanganida header ixchamlashsin va background blur kuchaysin.
- Mobile’da accessible drawer yoki sheet ochilsin.
- Header butun ekranni yopadigan og‘ir blok bo‘lmasin.

### 5.4 Hero motion

- Header: `translateY(-12px)` + opacity entrance, 450–650 ms.
- Badge, sarlavha, izoh va CTA: 60–100 ms stagger.
- Fon: juda sekin parallax yoki gradient drift.
- CTA hover: 1–2 px ko‘tarilish va yumshoq glow.
- Statistikalar: viewportga kirganda bir marta count-up.
- Animatsiya kontent o‘qilishiga xalaqit bermasin.
- `prefers-reduced-motion: reduce` to‘liq qo‘llansin.

## 6. Ichki sahifalar dizayni

Landing page cinematic bo‘lishi mumkin, lekin admin va ish jarayoni sahifalariga katta video fon qo‘ymang.

### 6.1 Admin panel

- Chap sidebar ixcham va aniq guruhlangan bo‘lsin.
- Active menu emerald accent bilan ko‘rinsin.
- Topbar’da breadcrumb, global search kerak bo‘lsa, til/theme va profil bo‘lsin.
- Dashboard kartalari faqat muhim real ma’lumot uchun ishlatilsin.
- Soxta CPU, uptime, WAF, daromad yoki foydalanuvchi raqamlari ko‘rsatilmasin.
- Jadval, filter va actionlar birinchi o‘rinda; dekoratsiya ikkinchi o‘rinda.
- Destructive action doim tasdiqlash dialogiga ega bo‘lsin.

### 6.2 Olimpiadalar ro‘yxati

- Search, status, fan, sinf va sana filterlari ixcham toolbar ichida.
- Olimpiada card yoki row’da nom, fan, vaqt, status va asosiy actionlar ko‘rinsin.
- Card hover faqat yengil border/glow va 1–2 px movement.
- Empty, loading, error va skeleton holatlari bo‘lsin.
- “Yaratish” tugmasi ko‘zga tashlansin, lekin boshqa elementlarni bosib ketmasin.

### 6.3 Olimpiada yaratish/tahrirlash

- Ko‘p bo‘limli formani tabs yoki stepper bilan ajrating.
- Sticky save bar ishlating.
- Unsaved changes statusi ko‘rinsin.
- Validation xatosi maydon yonida va umumiy summary’da chiqsin.
- Har field uchun ulkan card ishlatmang.
- Pricing/payment/paket bo‘limlari ko‘rsatilmasin.
- Anti-cheat bo‘limi `AGENTS.md`dagi ixcham accordion/checklist talabi asosida qurilsin.

### 6.4 Anti-cheat sozlamalari

Ko‘rinish quyidagicha bo‘lsin:

```text
Anti-Cheat nazorati                      [Yoqilgan] [Saqlash]
Qat’iy rejim · 11 faol qoida · Saqlanmagan o‘zgarishlar

[ Qat’iy ] [ O‘rtacha ] [ Yumshoq ] [ Off ]

▾ Kamera va AI                                   6 faol
  Ikkala ko‘z ko‘rinsin                           [switch]
  Landmarks tekshiruvi                           [switch]
  Nigoh nazorati                                 [switch]
  Grace [1.5 s]  Confidence [70%]  Limit [3]

▸ Audio                                          3 faol
▸ Brauzer himoyasi                               4 faol
▸ Tarmoq va dalillar                             3 faol
```

- Har row 40–48 px atrofida.
- Uzun izoh tooltip yoki info popover ichida.
- Bir vaqtning o‘zida faqat kerakli accordion ochiq bo‘lishi mumkin.
- Bosh switch o‘chsa ichki elementlar disabled bo‘lsin, qiymatlar yo‘qolmasin.
- UI holati real server policy bilan mos bo‘lsin.

### 6.5 Imtihon topshirish sahifasi

- Maksimal sokin va chalg‘itmaydigan dizayn.
- Savol, variantlar, timer, progress va navigatsiya vizual ustuvor.
- Ortiqcha blur, video, particle yoki uzluksiz animatsiya bo‘lmasin.
- Anti-cheat holati kichik status indicator sifatida ko‘rinsin.
- Warning modal aniq, qisqa va keyboard accessible bo‘lsin.
- Mobile’da savol va variantlar kesilmasin, tap target kamida 44 px.

### 6.6 Login va ro‘yxatdan o‘tish

- Desktopda split layout: original education visual + forma.
- Mobile’da faqat ixcham forma va kichik brand visual.
- Password, loading, error va success state’lari aniq.
- Auth ma’lumotlari yoki demo credentiallar dizayn ichida hardcode qilinmasin.

## 7. Component tizimi

Takrorlanadigan UI primitive’lar yarating yoki mavjudlarini standartlashtiring:

- `Button`: primary, secondary, ghost, danger;
- `IconButton`;
- `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`;
- `Badge` va `StatusBadge`;
- `Tooltip` va `Popover`;
- `Modal`, `Drawer`, `ConfirmDialog`;
- `Card` va `CompactRow`;
- `Tabs`, `SegmentedControl`, `Accordion`;
- `Table`, `Pagination`, `EmptyState`, `Skeleton`;
- `Toast` va inline error.

Har componentda default, hover, focus-visible, active, disabled, loading va error holatlari bo‘lsin. Bir xil vazifa uchun turli sahifalarda turli dizayn yaratmang.

## 8. Motion tizimi

Loyihada Framer Motion yo‘q. Faqat animatsiya uchun yangi og‘ir dependency qo‘shmang. Tailwind/CSS keyframes va zarur bo‘lsa kichik React hooklardan foydalaning.

Motion tokenlari:

```css
--motion-fast: 160ms;
--motion-base: 260ms;
--motion-slow: 520ms;
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Qoidalar:

- Micro interaction: 120–220 ms.
- Modal/drawer: 220–360 ms.
- Hero entrance: 450–850 ms.
- Bir sahifada hamma elementni doimiy harakatlantirmang.
- `transition-all`ni ko‘r-ko‘rona ishlatmang; kerakli property’larni belgilang.
- Layout shift keltirib chiqaradigan animation ishlatmang.
- `transform` va `opacity`ni afzal ko‘ring.
- Scroll animation bir marta ishlasin; qayta-qayta miltillamasin.
- Reduced motion’da count-up ham yakuniy qiymatni darhol ko‘rsatsin.

## 9. Responsive tizim

Quyidagi kengliklarda tekshiring:

- 360 px;
- 390 px;
- 768 px;
- 1024 px;
- 1280 px;
- 1440 px va undan katta.

Majburiy qoidalar:

- horizontal overflow bo‘lmasin;
- sticky elementlar mobile viewportni yopmasin;
- jadval mobile’da responsive row/card yoki gorizontal scroll bilan ishlasin;
- modal kichik ekranda full-height sheetga aylanishi mumkin;
- menu keyboard va screen reader bilan boshqarilsin;
- touch target kamida 44×44 px;
- safe-area insetlar hisobga olinsin.

## 10. Accessibility

- Semantik HTML ishlating.
- Har inputning label’i bo‘lsin.
- Icon-only buttonda `aria-label` bo‘lsin.
- Dialog focus trap va Escape bilan yopilishni qo‘llasin.
- Rang kontrasti kamida WCAG AA bo‘lsin.
- Holatni faqat rang bilan bildirmang; icon yoki matn ham bo‘lsin.
- Keyboard focus doim ko‘rinsin.
- `prefers-reduced-motion` va `prefers-contrast` imkoniyatlarini hisobga oling.
- Video decorative bo‘lsa screen reader’dan yashiring; mazmun tashimasa caption talab qilinmaydi.

## 11. Performance

- Landing background assetlarini optimallashtiring.
- Video va katta rasmlarga poster/fallback bering.
- Pastdagi sahifa rasmlarini lazy-load qiling.
- Birinchi viewport uchun keraksiz JS yuklamang.
- Yangi fontlar sonini cheklang va `font-display: swap` ishlating.
- Animatsiya sabab CPU doim yuqori ishlamasin.
- Re-render va event listener cleanup’larini tekshiring.
- Admin sahifalariga landing video yoki og‘ir motion bundle yuklanmasin.
- Lighthouse’da accessibility va best-practices muammolarini bartaraf eting.

## 12. Real ma’lumot qoidasi

Dizaynni to‘ldirish uchun quyidagilarni uydirmang:

- foydalanuvchilar soni;
- uptime;
- CPU yoki RAM qiymati;
- to‘lov va daromad;
- WAF/TLS holati;
- olimpiada natijasi;
- xavfsizlik ogohlantirishlari;
- “AI aniqligi” foizi;
- hamkor kompaniya logotiplari.

Real API mavjud bo‘lmasa, componentda `Ma’lumot mavjud emas` yoki skeleton/empty state ko‘rsating. Mock ma’lumot faqat aniq `demo` rejimda va belgilangan holda ishlatilishi mumkin.

## 13. Taqiqlangan dizayn xatolari

- Har bir matnni alohida katta gradient cardga joylash.
- Admin formalarida haddan tashqari katta padding va bo‘shliq.
- Neon ranglarni hamma joyda ishlatish.
- Bir sahifada ko‘p xil radius, shadow va font.
- Hover’da kuchli scale yoki sahifa sakrashi.
- O‘qilishi qiyin 9–10 px matn.
- Pure dekorativ chart va statistikalar.
- Boshqa brend videosi, logosi yoki matnini nusxalash.
- External video URL’ni hotlink qilish.
- Animatsiya uchun biznes mantiqini qayta yozish.
- UI ishlayotgandek ko‘rsatib, actionni serverga ulamaslik.
- Browser’da 100% DevTools yoki screenshot himoyasi bor deb da’vo qilish.

## 14. Ish jarayoni

AI quyidagi tartibda ishlasin:

1. `AGENTS.md` va ushbu faylni to‘liq o‘qish.
2. Mavjud route va barcha asosiy page/componentlarni inventarizatsiya qilish.
3. Takroriy UI, rang, spacing va component nomuvofiqliklarini aniqlash.
4. Avval tokenlar va primitive componentlarni standartlashtirish.
5. Landing page’ni original cinematic ko‘rinishga keltirish.
6. Auth va public sahifalarni moslashtirish.
7. Student sahifalarini moslashtirish.
8. Admin shell, list, table va formalarni ixchamlashtirish.
9. Anti-cheat sozlamalarini compact accordion ko‘rinishiga o‘tkazish.
10. Barcha sahifalarni responsive va accessible tekshirish.
11. Build/lint/testlarni bajarish.
12. O‘zgargan fayllar va qolgan cheklovlar bo‘yicha hisobot berish.

Bir urinishda butun loyihani nazoratsiz qayta yozmang. Har bosqichda mavjud funksiyani tekshiring.

## 15. Qabul mezonlari

Ish faqat quyidagilar bajarilganda tugallangan hisoblanadi:

- mavjud funksiyalar va API contractlar buzilmagan;
- landing page original, premium va animatsiyali;
- tashqi reference aynan nusxalanmagan;
- mobile va desktop responsive;
- dark/light mode izchil;
- admin panel ixcham va ishga yo‘naltirilgan;
- anti-cheat bo‘limi katta kartalar o‘rniga compact accordion/checklist;
- payment va package UI mavjud emas;
- barcha tugma, checkbox va actionlar real funksiyaga ulangan;
- soxta raqam, security status yoki testimonial yo‘q;
- loading, empty, error, success va disabled holatlar mavjud;
- reduced motion ishlaydi;
- keyboard navigation va focus holati tekshirilgan;
- `npm run build` muvaffaqiyatli;
- `npm run lint` muvaffaqiyatli;
- o‘zgartirilgan asosiy user flowlar qo‘lda tekshirilgan.

## 16. Yakuniy hisobot

Ish tugagach quyidagilarni yozing:

1. O‘zgartirilgan sahifa va componentlar.
2. Yaratilgan design token va primitive’lar.
3. Qo‘shilgan animatsiyalar.
4. Responsive va accessibility tekshiruvlari.
5. Build/lint/test natijalari.
6. Ishlatilgan assetlarning manbasi va litsenziya holati.
7. Bajarilmagan yoki real backend/asset talab qiladigan qismlar.

Natijani “tayyor” deb aytishdan oldin desktop va mobile screenshot yoki visual verification bilan tekshiring.
