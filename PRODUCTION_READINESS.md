# Production tayyorgarligi — 2026-10-11

## Xulosa

**Holat: butun saytni production uchun tasdiqlash mumkin emas.** Quyidagi asosiy xavfsizlik o‘zgarishlari kodga integratsiya qilindi va mahalliy testlardan o‘tdi. Bu hisobot SECURITY_INTEGRATION_BLUEPRINT.md to‘liq bajarildi yoki sayt mutlaq xavfsiz degani emas. Hech qanday tashqi serverga deploy qilinmadi. Avvalgi foydalanuvchi o‘zgarishlari saqlandi; commit qilinmadi.

## Tasdiqlangan tekshiruvlar

| Tekshiruv | Natija |
|---|---|
| `npm run verify` | Exit 0: frontend/server TypeScript, lint, testlar va audit |
| HTTP xavfsizlik/contract to‘plami | 14/14; oxirgi test faqat eski repository shakli, DB integratsiyasi emas |
| Anti-cheat unit to‘plami | 15/15 |
| Haqiqiy PostgreSQL dvigateli — PGlite | 5/5: parallel HTTP Single-IP, rollback, FK, takroriy practice va qayta ochilganda saqlanish |
| Qo‘shimcha hardening HTTP/rasm tekshiruvlari | 15/15 |
| Haqiqiy Socket.IO ulanishlari | 4/4: token roli, takroriy ulanish, noto‘g‘ri imzo, logoutdan keyin uzish |
| Yagona test / practice / Rasch to‘plami | 12/12: CRUD, ruxsat, refresh/resume, ajratilgan urinishlar, tarix qulfi, kalibrlash, deadline va xavfsiz media |
| Jami | 65 ta tekshiruv o‘tdi |
| `npm run build` | Exit 0; `dist/` yaratildi |
| `npm audit --package-lock-only --ignore-scripts` | 0 vulnerabilities, jumladan high=0 va critical=0 |
| Toza vaqtinchalik katalogda `npm ci --ignore-scripts` | Exit 0; 429 paket o‘rnatildi. Install scriptlar ataylab bajarilmadi |
| Brauzer smoke tekshiruvi | Ajratilgan serverda admin daraja testi + savol + izoh yaratish/saqlash/refresh; o‘quvchi variant/ochiq javobni saqlash, refresh, finish, natijani qayta ochish/refresh tekshirildi. Barcha rollar/oqimlar to‘liq E2E tekshirilgani yo‘q |

Testlar foydalanuvchining haqiqiy DB/.env fayllarini ishlatmaydi; har bir to‘plam alohida vaqtinchalik ma’lumot papkasida ishlaydi. SMTP/SMS/AI kalitlari test muhitida bo‘shatilgan. PGlite PostgreSQL SQLni ishlatadi, ammo bu TCP orqali alohida production PostgreSQL serveri, ko‘p worker va yuklama testi o‘rnini bosmaydi.

ESLint sozlamalarida ilgari mavjud yumshatilgan qoidalar saqlandi. Lint muvaffaqiyati butun legacy kod `any` va yutilgan xatolardan tozalanganini anglatmaydi.

## Integratsiya qilingan ishlar

- Yagona test moduli: olimpiada, daraja testi va milliy sertifikat uchun umumiy yaratish/tahrirlash/nusxalash/ochish-yopish; serverda `kind`, `practiceEnabled`, `sourceYear`, `raschConfig`. Faol yo‘llar endi legacy level localStorage/simulatorga bormaydi. Batafsil: `ASSESSMENT_MODULE.md`.
- Mustaqil practice sessiyalari va natijalari, refresh/resume, server deadline, idempotent finish, alohida qayta urinish. Practice rasmiy reyting va sertifikatlardan chiqarilgan. Natija URLsi refreshda yangi attempt boshlamaydi.
- Kalibrlangan dixotomik savollar uchun server Rasch 1PL/EAP theta + posterior SD. Parametrlar bo‘lmasa `pending_calibration`; soxta raw logit olib tashlandi. BMBA rasmiy shkalasiga tenglik yoki davlat sertifikati da’vo qilinmaydi.
- Admin savol muharririda default A va bo‘sh variantning to‘g‘ri javob sifatida avtomatik belgilanishi olib tashlandi; yechim izohi hamda cheklangan xavfsiz rasm reference saqlanadi. Sana muharriri vaqt zonasini hisobga oladi. Boshlangan testning savollari/jadvali/kalibrlashi o‘zgarmaydi, o‘zgarish uchun nusxa olinadi.

- Production ma’lumotlarini `app_records` PostgreSQL jadvalida saqlash: `server/src/db/transactionStore.ts`, `server/src/middleware/database.middleware.ts`, `server/migrations/002_runtime_records.sql`. Mutatsiya javobi commitdan keyin yuboriladi; xatoli HTTP javobi rollback qilinadi. Production DB sozlanmasa startup to‘xtaydi.
- HttpOnly cookie auth; JWT login JSON javobiga qaytmaydi. HS256, hisob holati, authVersion va logout revokatsiyasi tekshiriladi. Foydalanuvchi profili/roli brauzer xotirasidan ishonchli manba sifatida olinmaydi.
- Aniq Origin/Referer allowlist; oddiy `X-Requested-With` bilan chetlab o‘tish yo‘q. Production domenlari muhitdan aniq ko‘rsatiladi. Bu blueprintdagi tokenli CSRF namunasi bilan bir xil implementatsiya emas; tanlangan himoya qat’iy Origin tekshiruvidir. [OWASP manbasi](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- Profil yangilashda maydonlar allowlisti; id/passwordHash/authVersion ommaviy almashtirilmaydi. Admin o‘zini o‘chira olmaydi, tarixli foydalanuvchi/imtihon o‘chirilishi rad etiladi.
- Imtihon server sessiyasi, vaqt, javoblar va baholash bilan ishlaydi. Begona savol/noto‘g‘ri variant rad etiladi. Kech yuborilgan javob natijani o‘zgartirmaydi; deadline worker saqlangan javoblarni baholaydi. Yakunlash takrori yangi natija yaratmaydi.
- Admin savollari alohida himoyalangan API orqali yuklanadi; public savollarda to‘g‘ri javob va izoh yo‘q. To‘g‘ri javobni avtomatik A qilish o‘rniga validatsiya mavjud. Boshlangan imtihon savollarini almashtirish bloklangan.
- Ro‘yxatdan o‘tish serverda saqlanadi; takroriy ro‘yxatdan o‘tish hisoblagichni oshirmaydi. Olimpiada store DTO sanalari/statusi moslashtirildi.
- Anti-cheat sozlamasi serverda saqlanadi, master OFF va alohida qoidalar serverda hisobga olinadi. Event ID takrori ikki marta hisoblanmaydi. Heartbeat server worker orqali DISCONNECTED holatini aniqlaydi; uzilgan sessiya yangi urinishga aylantirilmaydi.
- Snapshot haqiqiy JPEG/WebP dekodlashdan o‘tadi, kiruvchi rasm 1 MiB bilan cheklangan, qayta JPEGga kodlanadi. Fayl private katalogda; ko‘rish/o‘chirish admin uchun. Retention worker eskirgan va eski yetim fayllarni xavfsiz chegaralangan yo‘lda tozalaydi.
- Bir martalik QR pairing kodi, primary/secondary JWT roli, sessiya va foydalanuvchiga bog‘lash. WebSocket testlari va logoutdan keyingi revokatsiya mavjud. Soxta kalibratsiya/mijozning o‘ziga start ruxsati berishi olib tashlandi.
- Server uptime va Node process uptime alohida o‘lchanadi; CPU/RAM/disk serverdan olinadi. Topilmagan metrikalar to‘qib chiqarilmaydi. [Node.js uptime hujjati](https://nodejs.org/api/os.html#osuptime).
- SMTP/SMS provayder javobisiz `sent: true` yo‘q. Provider sozlanmasa foydalanuvchi xato oladi. Real yetkazib berish bu muhitda tekshirilmadi.
- Yordam murojaatlari (`/api/support/tickets`) serverga saqlanadi: foydalanuvchi faqat o‘z ticketlarini, admin esa barcha ticketlarni ko‘radi; xabar/status/o‘chirish amallari ownership va role bilan himoyalangan.
- Admin bildirishnomalari (`/api/admin/notifications`) haqiqiy SMS/SMTP provider javobiga asoslanadi. Provider sozlanmaganida log `Yuborilmadi` bo‘ladi va brauzerda soxta qabul qiluvchi yoki `sent=true` yaratilmaydi.
- Reyting store localStorage va qo‘lda bonus/jarima hisobidan chiqarildi. `/api/leaderboard` faqat yakunlangan competitive olimpiada submissionlaridan serverda hisoblaydi; practice natijalari kiritilmaydi.
- Admin proktor loglari `/api/admin/exams/:examId/proctor-events` orqali serverdan olinadi. Manual diskvalifikatsiya sessiya va audit event sifatida serverda saqlanadi; eski local cheat-log mutatsiyasi olib tashlandi.
- Haqiqiy backend bo‘lmagan audio voiceprint/diarization va DDoS/IDS kabi tugmalar xavfsizlik ishlayotgandek tasdiqlanmaydi. AI model yo‘q bo‘lsa yorug‘likdan soxta yuz jarimasi chiqarilmaydi.
- Sertifikat real yakunlangan submission orqali tekshiriladi. Frontenddagi soxta ishtirokchilar, A javobli sun’iy natija tahlili va chizilgan snapshotlar tegishli xizmatdan olib tashlandi.
- To‘lov/paket route va Payx runtime qismlari olib tashlanganligi test qilindi. Ayrim eski DTOlarda nol qiymatli narx maydonlari saqlandi; barcha billing so‘zlari yo‘qolgan deyilmaydi.
- Sahifalar lazy loadingga o‘tkazildi: asosiy JS fayli taxminan 2,989 kBdan 486 kBga tushdi (boshqa chunklar ham yuklanadi). Yagona muharrir birlashtirilgandan keyin eng katta admin chunk ~682 kB; build ogohlantirishi qolgan.

## Hali bajarilishi shart bo‘lgan ishlar

### P1 — butun saytni ishga tushirishga to‘sqinlik qiladigan kod

1. Rasmiy milliy sertifikat yo‘riqnomasi va kalibrlash parametrlari hali yo‘q. Server 1PL/EAP moduli qo‘shildi, ammo rasmiy shkala, qisman ball, yozma rubrikalar, apellyatsiya va double-blind baholash tugatilmagan. Eski `raschAssessmentService.ts`ga tayangan ekranlar asosiy routelardan olindi. Parametrsiz natija `pending_calibration`; rasmiy ball/daraja berilmaydi.
2. Uchala test turi uchun yagona CRUD/tahrir va practice urinishlari tayyorlandi. Eski generic yozuvlarning turini taxminan o‘zgartirish bajarilmadi: tarixi bor ma’lumotlar uchun tekshirilgan migratsiya kerak. Batafsil contract va chegaralar `ASSESSMENT_MODULE.md`da.
3. Barcha sahifalar, rolelar, mobil qurilmalar va admin amallari bo‘yicha E2E regressiya bajarilmagan. Asosiy HTTP testlari butun UI ishlashiga kafolat emas. Qolgan mock/demo marketing va mahalliy holatlarni ekranma-ekran ajratish lozim.

### P1 — infratuzilma va amaliy tasdiq

- Haqiqiy PostgreSQL instance, mavjud JSON/SQL ma’lumotlarini migratsiya qilish va stagingdagi solishtirish bajarilmagan. Demo JSON avtomatik productionga import qilinmaydi. Importdan oldin duplicate email/phone, dangling reference, sertifikat kodlari va shaxsiy ma’lumotlar tekshirilsin.
- Hozirgi repository barcha API so‘rovlarini global advisory lock bilan ketma-ket bajaradi va yozuvlarni yuklaydi. Bu atomiklik uchun o‘tish yechimi, yuqori parallel yuklama uchun yakuniy arxitektura emas. Sekin SMTP/AI so‘rovi boshqalarni kutdirishi mumkin. Maqsadli SQL repository va qisqa row-level transactionlarga o‘tish, Redis/shared limiter, yuklama testi kerak. [PostgreSQL locking hujjati](https://www.postgresql.org/docs/current/explicit-locking.html).
- Socket.IO faqat bitta worker uchun tayyorlangan. Klaster uchun shared adapter/lease va reconnect/restart recovery kerak; Redis integratsiyasi bajarilmagan. Rate-limit va security loglar hozir process xotirasida, restartdan keyin yo‘qoladi.
- HTTPS sertifikati, reverse proxy, haqiqiy IP forwarding, firewall, zaxira nusxasi va restore sinovi bajarilmagan. Faqat `TLS_CERT_PATH` sanasini ko‘rish tashqi HTTPS zanjiri/protokoli to‘g‘riligini isbotlamaydi.
- Real SMTP/SMS/Gemini Vision yetkazish va camera/mobile permission sinovlari bajarilmagan. `requireDualDevice` o‘chirilgan bo‘lsa tashqi Vision majburiy emas; yoqilsa provider va model alohida sozlanishi kerak. Ikki qurilmali seans hozir ikki soat bilan chegaralangan.
- Oldin oshkor bo‘lgan haqiqiy secretlar bo‘lsa revoke/rotate qilinsin. Git tarixida secret yo‘qligi haqida to‘liq tekshiruv/tasdiq berilmagan. `.env` va `server/.env` joriy tracked fayllar ro‘yxatida topilmadi.
- Kamera/snapshot roziligi, saqlash muddati, o‘chirish talablari va operator siyosati egasi tomonidan tasdiqlanishi kerak. Brauzer F12/tab blokini mutlaq anti-cheat himoyasi deb bo‘lmaydi; client kod o‘zgartirilishi mumkin.

## Muhim API contractlar

Har bir POST/PUT/DELETE uchun ruxsat etilgan aniq Origin kerak. Login cookie bilan ishlaydi; admin endpointlar serverdagi role tekshiruvidan o‘tadi.

| Endpoint | Ruxsat va mazmun |
|---|---|
| `POST /api/auth/login` | identifier/email/phone va password; user + HttpOnly cookie, auth token JSONda yo‘q |
| `POST /api/auth/logout` | cookie tozalanadi, authVersion orqali nusxalangan login tokenlari bekor qilinadi |
| `GET /api/auth/me` | amaldagi hisob va server roli |
| `POST/PUT /api/exams[/id]` | admin; savollar/sana/bal validatsiyasi, yangi id serverda |
| `POST /api/exams/:id/registration` | o‘quvchi; qayta yuborish idempotent |
| `POST /api/exams/:id/start` | egasiga sessiya, expiresAt, serverTime, answers va antiCheatPolicy |
| `GET /api/exams/:id/questions` | o‘quvchiga faqat faol o‘z sessiyasida javobsiz; adminga javoblar bilan |
| `POST /api/exams/:id/answer` | sessionId, questionId, selectedOption; variant ID yuboriladi |
| `POST /api/exams/:id/finish` | sessionId, optional answers; server baholaydi, kech payload e’tiborga olinmaydi |
| `POST /api/exams/:id/proctor-events` | sessionId, noyob eventId, eventType, details; hisob serverda |
| `POST /api/exams/:id/snapshot` | egasi, faol sessiya va policy; imageBase64 JPEG/WebP |
| `GET /api/admin/exams/:id/snapshots` | faqat admin; xususiy rasmga alohida admin endpoint |
| `PUT /api/admin/exams/:examId/anti-cheat` | faqat admin; canonical policy validatsiyasi |
| `POST /api/proctor/session/create` | login; primary token va bir martalik pairingCode |
| `POST /api/proctor/session/pair` | sessionId + pairingCode; secondary token; qayta ishlatish rad qilinadi |
| `GET /api/certificates/:code` | ommaviy real sertifikat tekshiruvi; topilmasa 404 |
| `GET /api/certificates` va `/api/submissions` | o‘z natijalari; admin uchun vakolatli ko‘rish |
| `GET /api/admin/system-metrics` | admin; real mavjud metrikalar, mavjud emasligi alohida |
| `GET/POST /api/support/tickets` | login; foydalanuvchi o‘z murojaatlarini yaratadi/ko‘radi |
| `POST /api/support/tickets/:id/messages` | ticket egasi yoki admin; xabar serverda saqlanadi |
| `PUT/DELETE /api/support/tickets/:id` | status faqat admin; o‘chirish owner yoki admin |
| `GET/POST/DELETE /api/admin/notifications` | faqat admin; real provider javobi bilan log yoziladi |
| `GET /api/admin/exams/:examId/proctor-events` | faqat admin; server proktor audit jurnali |
| `POST /api/admin/exams/:examId/proctor-disqualify` | faqat admin; sessiya statusi va audit eventini serverda o‘zgartiradi |

## Staging tayyorlash va rollback

1. Avval mavjud kod, DB va private snapshotlar zaxirasini oling. Ishlayotgan sayt katalogini ustidan ko‘r-ko‘rona yozmang.
2. `.env.example` asosida lokal sirlar faylini tayyorlang. `NODE_ENV=production`, kuchli yangi `JWT_SECRET`, haqiqiy `DATABASE_URL`, faqat o‘zingizga tegishli HTTPS `ALLOWED_ORIGINS`, private `SNAPSHOT_DIR`. Kalitlarni chatga yubormang, frontend `VITE_` o‘zgaruvchilariga qo‘ymang.
3. Shu tekshiruv Node v24.21.0 muhitida bajarildi. Lockfile bilan dependency o‘rnating, platformadagi native dependencylarni stagingda tekshiring. Runtime hozir `tsx` bilan ishlaydi; deploy installida uni chiqarib tashlamang.
4. Ajratilgan staging DBda `npm run db:migrate`. Faol runtime migratsiyasi `002_runtime_records.sql`; eski `001`/prototype repository parallel ishlatilmaydi. Buyruq mavjud jadvallarni drop qilmaydi.
5. Bo‘sh DB uchun `INITIAL_ADMIN_EMAIL` va kuchli `INITIAL_ADMIN_PASSWORD` bilan `npm run db:admin`; keyin bootstrap parolini muhitdan olib tashlang. Mavjud admin bo‘lsa buyruq uni ustidan yozmaydi.
6. `npm run verify` va `npm run build`. HTTPS proxy faqat `dist/`ni public qilsin; source, .env, server/data yoki snapshot katalogini public qilmasin. `/api` va `/socket.io`ni loopback Node serveriga yo‘naltiring; X-Forwarded-Forni proxy to‘g‘ri almashtirsin. Node portini internetga bevosita ochmang.
7. Bir Node worker: `NODE_ENV=production` muhitida `npm run server`. Ulanish/sertifikat/pochta/ikki qurilma/qayta yuklash holatlarini stagingda tekshiring. Hali yuqoridagi kod bloklovchilari sababli butun saytni ommaga chiqarmang.
8. Rollback: yozuvlarni vaqtincha to‘xtating, DB va snapshotlarni yana zaxiralang; oldingi mos release va uning tekshirilgan DB snapshotiga birgalikda qayting. SQL jadvalini shunchaki o‘chirib yubormang, yangi PostgreSQL ma’lumotlarini eski JSON release bilan mos deb hisoblamang. Avtomatik destructive down migration yozilmadi.

## Keyingi ish ketma-ketligi

Keyingi bosqich: rasmiy milliy sertifikat yo‘riqnomasi va kalibrlash parametrlari kelgach Rasch contractini yakunlash; so‘ng real PostgreSQL staging, provider, brauzer E2E, yuklama va backup-restore sinovlari. Shundan keyingina production launch qarori berilishi mumkin.
