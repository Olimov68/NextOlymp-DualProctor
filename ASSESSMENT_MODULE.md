# Yagona test moduli — foydalanish va chegaralar

## Admin uchun

Uchta bo‘lim bir xil `SharedExamAdminPage` va `OlympiadFullEditor` orqali ishlaydi:

- `/ega/olympiads`: olimpiada (`olympiad`).
- `/ega/level-tests`: daraja testi (`level_test`).
- `/ega/baholash`: milliy sertifikatga tayyorgarlik (`national_certificate`).

1. Nomi va fanini tanlab yangi test yarating. Yangi test yopiq, mashq ruxsati o‘chiq va anti-cheat master OFF holatda yaratiladi; avtomatik nashr qilinmaydi.
2. Umumiy tahrirlash oynasida savollar, aniq to‘g‘ri javob, ball, yechim izohi, vaqt va sinflarni kiriting. Savol oynasidagi saqlash faqat formani yangilaydi; yuqoridagi umumiy **Saqlash** serverga yozadi.
3. Mashq kutubxonasida doim ochiq qoldirish katagini belgilang va umumiy **Saqlash**ni bosing.
4. Daraja testi mashqqa darhol ochiladi. Olimpiada va milliy sinov faqat belgilangan tugash vaqtidan keyin ochiladi. `isAlwaysOpen` musobaqasi avtomatik mashqqa aylanmaydi. Bu faol savollar/javoblarning oldindan ochilib ketishini cheklaydi.
5. Musobaqa holati va mashq ruxsati alohida: `yopiq` musobaqaning arxiv mashqi ochiq qolishi mumkin. Mashqni yopish uchun alohida katakni o‘chiring. Boshlangan urinish yakunlanishiga ruxsat qoladi; yangi startlar rad qilinadi.
6. Boshlangan test savollari, turi, jadvali va Rasch parametrlarini almashtirish serverda bloklanadi. O‘zgartirish uchun **Nusxa olish**dan foydalaning: yangi server ID, yangi savol IDlari, yopiq holat, o‘chiq mashq va bo‘sh kalibrlash bilan yaratiladi. Eski urinishlar saqlanadi.

Avvalgi turi ko‘rsatilmagan yozuvlar `olympiad` hisoblanadi. Nom/IDdan milliy test deb taxmin qilinmaydi. Tarixi yo‘q testni admin yuqoridagi Test turi maydonida aniq tasniflashi mumkin. Tarixi bor noto‘g‘ri tasniflangan yozuvlar alohida nazoratli migratsiya talab qiladi.

Avval localStorage'da saqlangan daraja savollari avtomatik ravishda ishonchli server savollariga aylantirilmadi. Ularni tekshirib, admin orqali qayta kiritish/import qilish kerak. Brauzerdagi eski yozuvlar bu o‘zgarishda o‘chirilmadi.

## O‘quvchi uchun

`/student/level-test` yoki `/student/practice` — barcha ochiq arxiv/daraja mashqlari. `/dashboard/milliy-sertifikat` — milliy sinovlar va ularning natijalari.

- Mashq olimpiada jadvali bo‘lmagan kunlarda ham ishlaydi; fan/nom/yil bo‘yicha topiladi.
- Variant tanlash server tasdig‘idan so‘ng saqlangan hisoblanadi. Ochiq javob uchun **Javobni saqlash** talab qilinadi.
- Refresh aynan shu faol sessiya va saqlangan javoblarni tiklaydi; vaqt qaytadan boshlanmaydi.
- Yakunlash idempotent: qayta yuborish ikkinchi natija yaratmaydi. Natija manzili `?result=...`; refresh yangi urinish yaratmaydi.
- Keyingi mashq yangi sessiya va alohida natija yaratadi. Cheksiz qayta mashq qilish mumkin; oddiy API rate-limit saqlanadi.
- Mashqlar rasmiy olimpiada reytingiga, foydalanuvchining musobaqa eng yuqori balliga va sertifikatlarga qo‘shilmaydi. Vaqt cheklovi serverda qoladi; mashqda proktor jarimasi, Single-IP va heartbeat-diskvalifikatsiya qo‘llanmaydi.
- Javob va izohlar mashq yakunlangandan keyin server natijasidan ko‘rsatiladi.

## Milliy sertifikat / Rasch

BMBA milliy sertifikat natijalarini Rasch modeli bilan hisoblashini rasmiy e’lon qilgan. Bu platformadagi aniq estimator, kalibrlash bazasi va rasmiy shkala aynan ularniki degani emas.

- [BMBA: natijalarni Rasch modeli bilan hisoblash](https://uzbmb.uz/post/view/milliy-sertifikat-imtihonlarida-test-natijalari-xalqaro-metodika-rash-modeli-asosida-hisoblanadi).
- [Rasch Measurement Transactions: EAP measures](https://www.rasch.org/rmt/rmt163i.htm).

Hozirgi implementatsiya serverdagi **dixotomik 1PL + EAP**. Har bir savol to‘g‘ri/xato ko‘rinishida olinadi, oldindan kalibrlangan `b` qiyinligi ishlatiladi. `P(correct | theta,b) = logistic(theta-b)`. EAP normal prior va likelihood ko‘paytmasidan sonli integrallash orqali theta va posterior standart og‘ishni beradi. Bu raw foizning logiti emas. Savolning `points` vazni xom ballga qo‘llanadi, Rasch response esa 0 yoki 1.

Parametrlar faqat admin API orqali o‘qiladi/yoziladi; public katalogga tarqalmaydi. `raschConfig` maydonlari:

| Maydon | Talab |
|---|---|
| `version` | Kalibrlashning aniq versiyasi, 1–100 belgi |
| `source` | Parametrlar olingan manba/tekshiruv, 1–1000 belgi |
| `model`, `estimator` | `1PL`, `EAP` |
| `priorMean`, `priorSd` | Ushbu estimator uchun tanlangan prior: mean −3…3, SD 0.2…2 |
| `itemDifficulties` | Aynan saqlangan har bir savol IDsi uchun sonli `b`, −8…8; ortiqcha/kam ID rad qilinadi |

Chegaralar ushbu sonli implementatsiyaning qo‘llab-quvvatlanadigan diapazoni; BMBA qoidasi deb berilmagan. Rasmiy kalibrlash ishlovi, model fit tekshiruvi, representative cohort, variantlarni tenglashtirish va item parametrlarini taxmin qilish bu modulga kiritilmagan. Faqat admin konfiguratsiya kiritgani uning ilmiy yaroqliligini isbotlamaydi.

**Yo‘riqnoma va parametrlar yo‘q holat:** `rasch.status = pending_calibration`, `theta = null`. Xom ball diagnostika uchun ko‘rsatiladi, Rasch/rаsmiy ball deb nomlanmaydi. Parametrlar bilan hisoblanganda ham `officialEquivalent = false`; A+/A/B daraja, 75 ballik shkala yoki davlat sertifikati yasalmaydi.

User tasdiqlagan ustuvorlik: matematika, kimyo, biologiya, fizika. Keyin ona tili, tarix, chet tili. Rasmiy yo‘riqnoma keyin taqdim etiladi. Shunda fan/variantga tegishli shkala, qisman balli savollar uchun kerakli model, yozma rubrika, baholovchilar, apellyatsiya va qayta hisoblash auditi alohida integratsiya qilinadi. Mavjud natijalarni indamay qayta hisoblamang.

Hozir ochiq savollar trim + case-insensitive aniq matn bilan solishtiriladi; algebraik ekvivalentlik, kasr/decimal ekvivalentligi, insho baholash va qisman ball yo‘q. Bunday vazifani bu model bilan avtomatik baholangandek ko‘rsatmang.

## API va DB

- `GET /api/exams?kind=...`: turi bo‘yicha public metadata, `practiceAvailable` serverda aniqlanadi.
- `GET /api/admin/exams/:id`: faqat admin; kalibrlash konfiguratsiyasi bilan.
- `POST /api/exams`, `PUT /api/exams/:id`: yagona admin CRUD; `kind`, `practiceEnabled`, `sourceYear`, `raschConfig` validatsiya qilinadi.
- `POST /api/exams/:id/start { mode: 'practice' }`: server ruxsati bilan yangi yoki davom etayotgan mashq. Mode berilmasa competitive; level_test uchun competitive rad etiladi.
- `GET /api/exams/:id/questions?sessionId=...`: egasi, examID, holat, deadline tekshiriladi; javoblar yo‘q.
- `/answer`, `/finish`: sessiya egasi va server deadline bilan umumiy endpointlar.
- `GET /api/submissions/:id`: o‘z natijasi yoki admin; saqlangan sessiya bilan aniq bog‘langan.

`SubmissionRecord.sessionId`, `mode`, `examKind`, `attempt`, `rasch` PostgreSQL JSONB payloadida saqlanadi. Competitive attempt `1`, practice attempt server UUID sessiya IDsi. SQLda user/exam/attempt va nonempty sessionId uchun noyob indeks bor. Deploy oldidan yangilangan `npm run db:migrate`ni ajratilgan staging bazada sinang; bu yerda production bazaga migratsiya bajarilmadi.

Savol chizmalari va variant rasmlari HTTPS havola yoki hajmi cheklangan PNG/JPEG/WebP data URL sifatida saqlanadi. Har bir reference ko‘pi bilan 350 kB, umumiy HTTP JSON chegarasi 1 MiB; katta savol banklariga keyinchalik alohida media storage kerak. Server tashqi rasm URLlarini yuklab olmaydi. SVG/HTML/javascript rad qilinadi.

## Regression qoidalari

1. Uchala boshqaruv yo‘lini bitta umumiy tahrir/servisga ulangan holda saqlang.
2. Urinish rejimi, score, certificate eligibility va kalibrlashga frontenddan ishonmang.
3. Practice natijalarini reyting/certificate/cache competitive ro‘yxatiga qo‘shmang.
4. Natija refreshini `start`ga aylantirmang; faqat serverdagi natija IDsi bilan o‘qing.
5. Eski `useLevelTestStore`, national simulator va brauzerdagi raw→Rasch hisobini active routelarga qaytarmang. Legacy manbalar foydalanuvchi o‘zgarishlarini saqlash uchun diskda qoldirilgan, asosiy routerda ishlatilmaydi.
6. Yangi tahrirdan keyin `npm run verify` va `npm run build`; HTTP suite, PostgreSQL restart/parallel va qo‘lda admin/o‘quvchi refresh tekshiruvi.
7. Bu modulning tugashi butun platforma production-ready ekanini anglatmaydi. Qolgan bloklovchilar `PRODUCTION_READINESS.md`da.
