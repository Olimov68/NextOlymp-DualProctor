# IbnSinoSchool / NextOlymp — AI dasturchilar uchun majburiy qoidalar

Ushbu fayl loyihaning ildizida saqlanishi kerak. Loyiha ustida ishlaydigan har qanday AI yoki dasturchi o‘zgarish kiritishdan oldin bu faylni to‘liq o‘qishi va barcha qoidalarga rioya qilishi shart.

## 1. Asosiy tamoyil

Server va server database’i barcha rasmiy ma’lumotlar uchun yagona haqiqat manbasi hisoblanadi.

Frontenddagi Zustand state, React state, React Query cache va localStorage hech qachon rasmiy ma’lumot manbasi hisoblanmaydi.

Quyidagi ma’lumotlar faqat server orqali yaratilishi, o‘zgartirilishi va o‘chirilishi kerak:

- foydalanuvchilar;
- foydalanuvchi role va statuslari;
- olimpiadalar;
- savollar va to‘g‘ri javoblar;
- registration;
- payment holati;
- exam session;
- student javoblari;
- rasmiy ball va natijalar;
- sertifikatlar;
- proktor hodisalari;
- security sozlamalari va blocked IP ro‘yxati.

## 2. LocalStorage qoidalari

### LocalStorage’da saqlash mumkin

- light/dark theme;
- tanlangan til;
- sidebar ochiq yoki yopiq holati;
- xavfsizlikka ta’sir qilmaydigan filter va table ko‘rinishi;
- serverga yuborilmagan oddiy forma drafti;
- foydalanuvchi o‘zgartirsa ham tizimga zarar yetkazmaydigan UI sozlamalari.

Draft localStorage’da saqlansa:

- key user ID va obyekt ID bilan namespaced bo‘lsin;
- schema version bo‘lsin;
- `expiresAt` bo‘lsin;
- rasmiy ma’lumot sifatida ko‘rsatilmasin;
- serverga yuborilgach o‘chirilsin.

### LocalStorage’da saqlash taqiqlanadi

- admin yoki user role;
- authorization qarori;
- parol;
- to‘g‘ri javoblar;
- payment yoki registration holati;
- rasmiy score, result yoki rank;
- sertifikat va verification status;
- proktor dalillari;
- voiceprint, biometrik embedding yoki kamera snapshoti;
- server security settinglari;
- backend ma’lumotining yagona nusxasi.

Yangi auth tokenlarni localStorage’ga yozmang. Mavjud token tizimini alohida migratsiya orqali `HttpOnly`, `Secure`, `SameSite` cookie’ga o‘tkazing.

LocalStorage server xatosini yashiruvchi fallback sifatida ishlatilmasin.

## 3. Olimpiada API contracti

Frontend quyidagi endpointlardan foydalanishi shart:

```text
GET    /api/exams
GET    /api/exams/:id
POST   /api/exams
PUT    /api/exams/:id
DELETE /api/exams/:id
```

Qat’iy qoidalar:

- yaratish uchun faqat `POST /api/exams`;
- yangilash uchun faqat `PUT /api/exams/:id`;
- o‘chirish uchun faqat `DELETE /api/exams/:id`;
- `POST /api/exams`ni update sifatida ishlatmang;
- `DELETE /api/exams?id=...` formatini ishlatmang;
- ID doimo `encodeURIComponent(id)` bilan pathga qo‘yilsin;
- frontend server qaytargan obyektni qabul qilsin;
- frontend o‘zi rasmiy ID, timestamp yoki status yaratmasin.

## 4. CRUD operatsiyalarining majburiy tartibi

### Create

1. Input frontendda tekshirilsin.
2. Serverga `POST` yuborilsin.
3. Server muvaffaqiyatli javob qaytarsin.
4. Zustand/cache server qaytargan obyekt bilan yangilansin.
5. Server xato qilsa UI muvaffaqiyat ko‘rsatmasin.

### Update

1. Serverga faqat o‘zgargan allowlisted maydonlar `PUT /api/exams/:id` orqali yuborilsin.
2. Server javobi kutilishi shart.
3. State server qaytargan obyekt bilan yangilansin.
4. Server xato qilsa eski state saqlansin va foydalanuvchiga xato ko‘rsatilsin.

### Delete

1. Foydalanuvchidan confirmation olinsin.
2. `DELETE /api/exams/:id` muvaffaqiyatli tugashi kutilsin.
3. Faqat muvaffaqiyatdan keyin obyekt frontend state’dan olib tashlansin.
4. API xato qilsa obyekt UI’dan yo‘qolmasin.
5. Server delete muvaffaqiyatidan oldin bog‘liq lokal ma’lumotlarni o‘chirmang.

### Optimistic update

Optimistic update faqat zarur bo‘lsa ishlatilishi mumkin. Bunda:

- oldingi state snapshoti saqlansin;
- server xatosida rollback majburiy bo‘lsin;
- foydalanuvchiga xato ko‘rsatilsin;
- payment, role, grading, certificate va security holatlarida optimistic update ishlatilmasin.

## 5. Fetch va refresh qoidalari

Sahifa ochilganda va refreshdan keyin rasmiy ma’lumot serverdan olinsin.

Server bo‘sh array qaytarsa, frontend state ham bo‘sh array bo‘lishi kerak. Eski localStorage yoki seed ma’lumotni qoldirmang.

To‘g‘ri usul:

```ts
const response = await apiClient.get('/exams');
const list = Array.isArray(response) ? response : response?.data ?? [];

set({
  olympiads: list,
  loading: false,
  error: null,
});
```

Taqiqlangan usul:

```ts
if (list.length > 0) {
  set({ olympiads: list });
}
```

Chunki serverdagi haqiqiy bo‘sh ro‘yxat eski frontend ma’lumotini tozalashi kerak.

API xatosida:

- eski ma’lumotni yangi yoki tasdiqlangan deb ko‘rsatmang;
- xatoni `console.warn` bilan yutib yubormang;
- UI’da error va retry holati ko‘rsating;
- offline cache ishlatilsa, uni aniq `Eskirgan offline nusxa` deb belgilang.

## 6. Zustand va React Query qoidalari

- Zustand runtime state uchun ishlatiladi, database sifatida emas.
- Bir xil entity uchun bir nechta mustaqil store yaratmang.
- API mutationlari `async` bo‘lsin va `Promise` qaytarsin.
- Fire-and-forget `.catch(console.warn)` ishlatmang.
- Loading, error va success holatlari aniq bo‘lsin.
- Bir xil server ma’lumotini React Query va Zustand’da ikki xil truth sifatida saqlamang.
- React Query ishlatilsa, mutationdan keyin tegishli query invalidate yoki server javobi bilan update qilinsin.

## 7. Savollar va to‘g‘ri javoblar

Transport DTO uchun yagona maydon nomi ishlatilsin:

```ts
correctAnswer
```

Server ichki modelida `correct_answer` ishlatilsa, konvertatsiya bitta adapter qatlamida bajarilsin:

```ts
const correctAnswer = body.correctAnswer ?? body.correct_answer;
```

Qat’iy talablar:

- `correctAnswer` yo‘q bo‘lsa request `400` bilan rad etilsin;
- yo‘q qiymatni avtomatik `A` deb saqlamang;
- correct answer mavjud optionlardan biriga tegishli ekanini server tekshirsin;
- public/student API hech qachon `correctAnswer`, `correct_answer` yoki explanation keyni qaytarmasin;
- grading faqat serverda bajarilsin;
- frontend hisoblagan ball rasmiy natija bo‘lmasin.

Majburiy testlar:

- A javobli savol;
- B javobli savol;
- C javobli savol;
- D javobli savol;
- correct answer yo‘q request;
- mavjud bo‘lmagan option ID;
- public response’da answer key yo‘qligi.

## 8. Authentication va authorization

- Frontend role tekshiruvi faqat UI ko‘rinishi uchun.
- Haqiqiy authorization har bir protected endpointda serverda bajarilsin.
- Admin endpointlarda `authenticateJWT` va admin role tekshiruvi majburiy.
- Faqat `status === 'active'` hisoblar protected API’dan foydalansin.
- Frontenddagi `setRole()` server role’ini o‘zgartira olmaydi.
- User ID request body’dan kelganiga ishonmang; imkon qadar authenticated token/sessiondan oling.
- Object ownership tekshiruvsiz boshqa user ma’lumotini qaytarmang.
- Parol va tokenlarni logga yozmang.

## 9. Registration, payment va natijalar

Registration localStorage orqali tasdiqlanmasin.

Server quyidagilarni tekshirishi kerak:

- user authenticated;
- user role;
- exam mavjudligi;
- registration deadline;
- target grade;
- urinishlar soni;
- oldingi submission;
- exam schedule;
- kerak bo‘lsa payment holati.

Loyiha bepul rejimda bo‘lsa:

- serverda price `0` bo‘lsin;
- frontend “to‘langan” deb ko‘rsatmasin;
- ishlamaydigan payment endpoint va UI ishlatilmasin.

Pullik rejim qaytarilsa:

- browser yuborgan `paid/completed` holatiga ishonmang;
- real provider API yoki imzolangan webhook ishlating;
- summa va exam narxi serverda solishtirilsin;
- webhook idempotent bo‘lsin.

Natija va sertifikat faqat server gradingdan keyin yaratilishi kerak. API xatosida lokal rasmiy sertifikat yoki `NO-*` verification code yaratmang.

## 10. Proktor xavfsizligi

- Proktor session faqat serverda yaratiladi.
- Frontendda xavfsizlik tokeni generatsiya qilmang.
- `token-<sessionId>` fallback taqiqlanadi.
- Tokenni URL query, localStorage yoki uchinchi tomon QR servisiga yubormang.
- Primary va secondary qurilma uchun alohida role-bound token ishlating.
- Token `sessionId`, `examId`, `studentId`, `deviceRole`, `jti` va qisqa expiry bilan bog‘lansin.
- Pairing token bir marta ishlatilgach bekor qilinsin.
- Snapshot payload MIME va decoded byte hajmi serverda tekshirilsin.
- Snapshot AI chaqiruviga per-session rate limit va concurrency limit qo‘yilsin.
- AI mavjud bo‘lmasa fail-closed ishlasin; mock yoki checksum bilan avtomatik pass bermang.
- Biometrik ma’lumot uchun rozilik, retention va delete siyosati bo‘lsin.

## 11. Mock va hardcoded ma’lumotlar

Production kodda quyidagilar taqiqlanadi:

- random proktor violation;
- random audio levelni real qiymat sifatida ko‘rsatish;
- soxta security log;
- hardcoded CPU yoki server account;
- soxta payment;
- demo certificate;
- bazada mavjud bo‘lmagan user/result;
- `Math.random()` orqali security evidence yaratish.

Demo ma’lumot zarur bo‘lsa:

- alohida demo build yoki feature flag ishlating;
- ekranda katta `DEMO` belgisi bo‘lsin;
- productionda flag majburan o‘chiq bo‘lsin.

## 12. Environment va secretlar

- `.env` gitga commit qilinmaydi.
- `.env.example` faqat placeholder beradi.
- Deploy `.env.example`ni avtomatik `.env`ga ko‘chirmasin.
- `replace_with`, `change_me`, `example`, `default_secret` kabi qiymatlar productionda rad etilsin.
- Productionda `NODE_ENV=production` majburiy.
- Productionda kuchli `JWT_SECRET` bo‘lmasa server ishga tushmasin.
- Initial admin/student password placeholder bo‘lsa server ishga tushmasin.
- Secretlar source code, log, URL query va API response’da ko‘rinmasin.

## 13. API error contracti

Barcha API xatolari yagona typed formatda boshqarilsin:

```ts
interface ApiErrorData {
  status: number;
  code?: string;
  message: string;
  details?: unknown;
}
```

- Invalid JSON javobni `[]`ga aylantirmang.
- `204 No Content` alohida boshqarilsin.
- Network error, timeout, unauthorized, validation va server error farqlansin.
- Callerlar `error.response.status` yoki kelishilgan typed formatdan foydalanishi kerak.
- Xato yutilmasin va muvaffaqiyat holatiga aylantirilmasin.

## 14. Database qoidalari

JSON store faqat vaqtinchalik development yechimi hisoblanadi.

Production uchun PostgreSQL yoki boshqa transactional database ishlating.

Majburiy constraintlar:

- unique user email;
- unique normalized phone;
- unique registration `(userId, examId)`;
- unique submission `(userId, examId, attempt)`;
- unique payment provider transaction ID;
- unique certificate verification code;
- foreign keylar;
- transactionlar.

Bir nechta server process JSON faylga parallel yozmasin.

## 15. O‘zgarish kiritishdan oldingi majburiy tartib

AI yoki dasturchi quyidagilarni bajarishi shart:

1. `AGENTS.md`ni to‘liq o‘qish.
2. Tegishli frontend component/store/service’ni o‘qish.
3. Tegishli server route va controllerni o‘qish.
4. Request va response DTOlarini solishtirish.
5. Mavjud o‘zgarishlarni va foydalanuvchi kodini saqlash.
6. Qaysi fayllar o‘zgarishini qisqa rejalashtirish.
7. Faqat vazifa doirasidagi fayllarni o‘zgartirish.

API contractni ko‘rmasdan frontend metodini taxmin qilib yozmang.

## 16. O‘zgarishdan keyingi majburiy tekshiruv

Kamida quyidagilar bajarilsin:

```bash
npm run build
npm run lint
npm audit --package-lock-only --ignore-scripts
```

Test script mavjud bo‘lgach:

```bash
npm test
```

Har bir CRUD o‘zgarishida qo‘lda yoki avtomatik tekshiring:

1. Yaratish.
2. Refreshdan keyin saqlanishi.
3. Boshqa brauzer/sessionda ko‘rinishi.
4. Yangilash.
5. Refreshdan keyin yangi qiymat qolishi.
6. O‘chirish.
7. Refreshdan keyin qaytib kelmasligi.
8. API xatosida UI yolg‘on muvaffaqiyat ko‘rsatmasligi.
9. Ruxsatsiz user CRUD bajara olmasligi.

Security yoki gradingga tegishli o‘zgarishda negative testlar majburiy.

## 17. Deploy qoidalari

- Reproduktiv install uchun `npm ci` ishlating.
- `npm install --legacy-peer-deps`ni default deploy usuli sifatida ishlatmang.
- `--no-audit` bilan advisorylarni yashirmang.
- Mavjud bo‘lmagan `server/package.json` ichida install bajarilmang.
- Builddan oldin env schema tekshirilsin.
- Build, lint, test va audit muvaffaqiyatsiz bo‘lsa deploy to‘xtasin.
- Service faqat muvaffaqiyatli tekshiruvlardan keyin restart qilinsin.
- Backup va rollback rejasi bo‘lsin.

## 18. Taqiqlangan “tezkor yechimlar”

Quyidagilarni ishlatmang:

```ts
const isPaid = true;
const isAdmin = localStorage.getItem('role') === 'admin';
const correctAnswer = body.correctAnswer || 'A';
apiCall().catch(console.warn);
return localStorageDataWhenServerFails;
```

Shuningdek:

- server tekshiruvini frontend tekshiruvi bilan almashtirmang;
- xatoni bo‘sh arrayga aylantirmang;
- ishlamaydigan endpoint uchun fallback success yaratmang;
- security muammosini funksiyani butunlay o‘chirib yashirmang;
- rasmiy data uchun random ID/status/score yaratmang;
- foydalanuvchiga xabar bermasdan ma’lumotni yo‘qotmang.

## 19. Ish tugagandagi hisobot formati

Har bir vazifa yakunida quyidagilar yozilsin:

### O‘zgartirilgan fayllar

- fayl nomi;
- nima o‘zgardi;
- nima sababdan o‘zgardi.

### API contract

- ishlatilgan endpoint;
- HTTP method;
- request DTO;
- response DTO;
- auth/role talabi.

### Tekshiruv

- build natijasi;
- lint natijasi;
- test natijasi;
- audit natijasi;
- CRUD refresh tekshiruvi.

### Qolgan cheklovlar

Bajarilmagan yoki tekshirilmagan ishlarni ochiq yozing. Taxminni tasdiqlangan natija sifatida ko‘rsatmang.

## 20. To‘lovlar va paketlarni hozircha butunlay olib tashlash

Loyihaning hozirgi versiyasida to‘lovlar va tarif paketlari kerak emas. Ularni shunchaki menyudan yashirish yetarli emas.

Quyidagilar bajarilsin:

1. Admin va foydalanuvchi menyularidan `To‘lovlar`, `Moliya`, `Paketlar` bo‘limlarini olib tashlash.
2. `/ega/finance`, `/ega/payments`, `/ega/packages` va boshqa payment/package route’larini olib tashlash.
3. `EgaFinancePage`, `EgaPackagesPage`, payment modal, package store, PayX service va ishlatilmay qolgan importlarni runtime bundle’dan olib tashlash.
4. Yangi va mavjud olimpiadalar bepul bo‘lsin:
   - `isFreeForAll: true`;
   - `price`, `onlinePrice`, `offlinePrice`, `discountAmount`, `discountPercent`: `0`;
   - payment method va `freeForPackageId` ishlatilmasin.
5. Backenddagi payment gate va soxta “payment success” endpointini olib tashlash. Savollarga kirish auth, ro‘yxatdan o‘tish, vaqt va faol sessiya orqali tekshirilsin.
6. `initialPayments`, `initialPackages`, demo tranzaksiyalar va PayX’ning hardcoded demo ma’lumotlarini olib tashlash.
7. Foydalanuvchi yoki natija DTOlarida payment/package maydonlari faqat tarixiy ma’lumot uchun zarur bo‘lmasa olib tashlansin. Mavjud production ma’lumotlarini migratsiyasiz buzib o‘chirmang.
8. Keyinchalik to‘lov qo‘shilishi uchun Git tarixiga tayaniladi; hozir ishlamaydigan, yashirin yoki yarim tayyor payment kodini saqlamang.
9. To‘lov olib tashlangandan keyin build, lint va barcha import/route tekshiruvlari bajarilsin.

Taqiqlanadi:

- menyuni yashirib, payment route yoki endpointlarni ochiq qoldirish;
- `isPaid = true` kabi bypass;
- ishlamaydigan payment API uchun fake success qaytarish;
- narx/paket tanlash UI’larini ko‘rsatish;
- demo tranzaksiyalarni real ma’lumot sifatida chiqarish.

## 21. Anti-cheat sozlamalarining majburiy ishlash qoidasi

Admin paneldagi har bir switch, checkbox va select faqat dizayn elementi emas, real boshqaruv bo‘lishi shart. Saqlangan qiymat serverdagi olimpiada yozuviga yozilsin, imtihon boshlanganda serverdan qayta olinsin va real nazorat modullariga uzatilsin.

### 21.1 Yagona server modeli

Serverda validatsiya qilinadigan `AntiCheatConfig` saqlansin. Kamida quyidagi maydonlar bo‘lsin:

```ts
type ProctoringMode = 'STRICT' | 'STANDARD' | 'RELAXED' | 'DISABLED';

interface AntiCheatConfig {
  enabled: boolean;
  proctoringMode: ProctoringMode;

  requireBothEyesVisible: boolean;
  strictFaceCheck: boolean;
  trackGazeDirection: boolean;
  minFaceConfidence: number;
  maxAbsenceGracePeriod: number;
  maxViolationsAllowed: number;

  requireVoiceBiometrics: boolean;
  detectUnknownSpeakers: boolean;
  detectMultipleSpeakers: boolean;
  voiceSimilarityThreshold: number;

  blockDuplicateIP: boolean;
  heartbeatEnabled: boolean;
  heartbeatIntervalSec: number;

  cameraFaceSnapshotEnabled: boolean;
  snapshotOnMultipleFaces: boolean;
  snapshotOnNoFace: boolean;

  blockTabSwitch: boolean;
  blockCopyPaste: boolean;
  requireFullscreen: boolean;
  blockDevTools: boolean;

  updatedAt?: string;
  updatedBy?: string;
  version?: number;
}
```

Server quyidagi qiymatlarni validatsiya qilsin:

- `minFaceConfidence`: `0.5–0.95`;
- `maxAbsenceGracePeriod`: `1–10` soniya;
- `maxViolationsAllowed`: `1–20`;
- `voiceSimilarityThreshold`: `0.5–0.95`;
- `heartbeatIntervalSec`: kamida `2`, ko‘pi bilan `60` soniya. `0.1` soniyalik ping serverga ortiqcha yuk beradi va ishlatilmasin.

Admin uchun alohida, role bilan himoyalangan endpoint ishlating:

```text
GET  /api/admin/exams/:examId/anti-cheat
PUT  /api/admin/exams/:examId/anti-cheat
```

Imtihon sessiyasi boshlanganda qatnashchiga faqat ishlashi uchun kerak bo‘lgan public-safe policy qaytarilsin. Admin audit maydonlari va ichki sirlar berilmasin.

### 21.2 Bosh switch va Off rejimi

- `enabled = false`: barcha anti-cheat listener, kamera, mikrofon, AI model, snapshot, heartbeat va violation yuborish to‘liq to‘xtasin. Oddiy auth va imtihon sessiyasi xavfsizligi saqlanadi.
- `proctoringMode = DISABLED`: faqat yuz va audio AI o‘chadi. Admin yoqqan browser/tab/fullscreen/network cheklovlari ishlashda davom etishi mumkin.
- Ushbu ikki holatni bir-biriga aralashtirmang.
- O‘chirilgan nazorat qoidabuzarlik yaratmasin va kamera/mikrofon ruxsatini so‘ramasin.

### 21.3 Har bir checkboxning real ta’siri

- `blockTabSwitch`: faqat `true` bo‘lsa `visibilitychange` va `blur` hodisalari yozilsin.
- `blockCopyPaste`: faqat `true` bo‘lsa copy/cut/paste/contextmenu cheklansin.
- `requireFullscreen`: faqat `true` bo‘lsa fullscreen talab qilinsin va chiqish hodisasi yozilsin.
- `blockDevTools`: faqat `true` bo‘lsa F12 va ma’lum klavishlar qayd etilsin.
- `heartbeatEnabled`: faqat `true` bo‘lsa server heartbeat kutib tursin; interval serverdagi qiymatdan olinsin.
- `blockDuplicateIP`: faqat frontendda emas, imtihon sessiyasini yaratishda server tomonidan atomik tekshirilsin.
- `cameraFaceSnapshotEnabled`: `false` bo‘lsa hech qanday rasm olinmasin va yuborilmasin.
- `snapshotOnMultipleFaces` va `snapshotOnNoFace`: faqat tegishli anomaly uchun ishlasin.
- `requireVoiceBiometrics`: `false` bo‘lsa mikrofon va voice model ishga tushmasin.
- `detectUnknownSpeakers` va `detectMultipleSpeakers`: bir-biridan mustaqil ishlasin.
- `requireBothEyesVisible`, `strictFaceCheck`, `trackGazeDirection`: yuz analizatoriga real parametr sifatida uzatilsin.
- `maxViolationsAllowed`: diskvalifikatsiya chegarasiga real ta’sir qilsin; kodda `3` deb hardcode qilinmasin.

Hozirgi koddagi quyidagi xatolarni majburiy tuzating:

1. `ContestParticipatePage` ichidagi `maxViolations: 3` va `requireFullscreen: true` hardcode qiymatlarini server policy bilan almashtiring.
2. `ExamGuard.init()` barcha modullarni shartsiz yoqmasin; har bir modul o‘z flagiga qarab init/destroy qilinsin.
3. Kamera `enabled = false`, `proctoringMode = DISABLED` yoki `requireWebcam = false` bo‘lsa ishga tushmasin.
4. Audio proctoring ifodasiga bosh `enabled` holati ham qo‘shilsin.
5. Snapshot flaglari `captureSnapshot()` chaqirilishidan oldin tekshirilsin.
6. `heartbeatIntervalSec` real guard va server timeout hisobiga uzatilsin.
7. `blockDuplicateIP` uchun serverda real tekshiruv qo‘shilsin; frontend checkboxning o‘zi himoya emas.
8. `value || default` o‘rniga `value ?? default` ishlating; `false` va `0` qiymatlari yo‘qolmasin. Masalan, `requireWebcam || true` xato.
9. “Saqlash muvaffaqiyatli” faqat `PUT` muvaffaqiyatli tugagandan keyin ko‘rsatilsin. API xatosida eski qiymat qaytarilsin yoki formadagi unsaved holat saqlansin.
10. Sahifa yangilanganda policy serverdan qayta yuklanib, aynan saqlangan kataklar ko‘rinsin.

### 21.4 Server-authoritative enforcement

Frontend cheklovlari foydali deterrent va monitoringdir, lekin foydalanuvchi DevTools orqali ularni aylanib o‘tishi mumkin. Shu sabab:

- violation hodisasi authenticated faol exam session bilan bog‘lansin;
- server hodisa turi shu olimpiada policy’sida yoqilganini tekshirsin;
- klient yuborgan severity, violation count va “diskvalifikatsiya” qaroriga ko‘r-ko‘rona ishonilmasin;
- violation count serverda hisoblanib, idempotency/event ID bilan takroriy yuborishdan himoyalansin;
- limitga yetganda server sessiyani diskvalifikatsiya qilsin;
- heartbeat timeout server vaqtiga asoslangan bo‘lsin;
- Single IP tekshiruvi proxy sozlamalari va ishonchli real IP qoidasi bilan bajarilsin;
- snapshot hajmi, MIME turi, soni, saqlash muddati va access control serverda tekshirilsin;
- faqat admin o‘ziga ruxsat etilgan exam snapshotlarini ko‘rsin.

F12, Alt+Tab, screenshot yoki DevTools’ni brauzer ichidan 100% bloklash mumkin deb da’vo qilmang. Ularni qayd etish, cheklash va serverga yuborish mumkin; asosiy himoya savollar/javoblarning serverda bo‘lishi, sessiya nazorati va server-side scoring hisoblanadi.

### 21.5 Preset rejimlar

Preset tanlanganda quyidagi defaultlar bitta markaziy funksiyadan o‘rnatilsin:

- `STRICT`: eyes, landmarks, gaze yoqilgan; grace `1.5`; confidence `0.70`; limit `3`.
- `STANDARD`: eyes va landmarks yoqilgan; gaze ixtiyoriy; grace `3`; confidence `0.65`; limit `4`.
- `RELAXED`: umumiy yuz mavjudligi; grace `5`; confidence `0.50`; limit `5`.
- `DISABLED`: yuz va audio AI o‘chirilgan; browser/network flaglari alohida holatda qoladi.

Preset tanlangandan keyin admin individual parametrni o‘zgartirishi mumkin. UI, frontend runtime va backend bir xil default funksiyadan yoki bir xil contractdan foydalansin; uch joyda alohida hardcode qilmang.

### 21.6 Ishlamaydigan AI funksiyasini soxta ko‘rsatmang

Voiceprint, diarization, gaze yoki Face Mesh real model/pipeline bilan ishlamasa:

- switchni `Mavjud emas` deb disabled qiling; yoki
- real implementatsiyani yakunlang va test qiling.

Random confidence, luminance heuristic yoki mock natijani “AI biometrika ishladi” deb ko‘rsatmang. Model yuklanmasa admin va qatnashchiga aniq status bering; xavfsizlik siyosatiga qarab imtihonni boshlatmaslik yoki nazorat darajasini pasaytirganini qayd etish kerak.

## 22. Anti-cheat bo‘limining ixcham dizayni

Hozirgi katta rangli kartalar sahifada ortiqcha joy egallaydi. Funksiyalarni olib tashlamasdan quyidagi minimal ko‘rinishga o‘tkazing:

1. Tepada bitta ixcham header:
   - `Anti-Cheat nazorati`;
   - bosh switch;
   - `Saqlanmagan o‘zgarishlar` statusi;
   - `Saqlash` tugmasi.
2. Preset rejimlar bitta qatordagi segmented control/radio ko‘rinishida bo‘lsin: `Qat’iy | O‘rtacha | Yumshoq | Off`.
3. Pastda 4 ta yopilib-ochiladigan accordion bo‘lsin:
   - `Kamera va AI`;
   - `Audio`;
   - `Brauzer himoyasi`;
   - `Tarmoq va dalillar`.
4. Har bir qoida katta karta emas, 40–48 px balandlikdagi row bo‘lsin:
   - chapda nomi;
   - kerak bo‘lsa info tooltip;
   - o‘ngda switch/checkbox yoki ixcham select.
5. Izohlarni doimiy uzun matn sifatida ko‘rsatmang; qisqa helper text yoki tooltip ishlating.
6. Keng ekranda advanced qiymatlar 2–3 ustun, mobil ekranda 1 ustun bo‘lsin.
7. Bosh switch o‘chsa ichki sozlamalar disabled ko‘rinsin, lekin qiymatlari yo‘qolmasin.
8. `Saqlash` tugmasi bo‘limning pastida sticky yoki doim ko‘rinadigan bo‘lsin.
9. Saqlash vaqtida loading, muvaffaqiyatda serverdan qaytgan qiymat, xatoda aniq error ko‘rsatilsin.
10. Checkbox va switchlar keyboard, focus ring, `aria-label` va rangdan tashqari holat belgisi bilan accessible bo‘lsin.

Tavsiya etilgan ixcham tuzilma:

```text
Anti-Cheat nazorati                         [Yoqilgan] [Saqlash]
Faol: 11 ta qoida · Qat’iy rejim · Saqlanmagan o‘zgarishlar

[ Qat’iy ] [ O‘rtacha ] [ Yumshoq ] [ Off ]

▾ Kamera va AI                                      6 faol
  Ikkala ko‘z ko‘rinsin                              [✓]
  Landmarks tekshiruvi                              [✓]
  Nigoh nazorati                                    [✓]
  Grace period [1.5 s] Confidence [70%] Limit [3]

▸ Audio                                             3 faol
▸ Brauzer himoyasi                                  4 faol
▸ Tarmoq va dalillar                                3 faol
```

WAF ekranidagi kichik row/switch uslubidan vizual ilhom olish mumkin, ammo anti-cheat holati soxta dekorativ toggle bo‘lmasin.

## 23. Anti-cheat uchun majburiy testlar

Har bir flag uchun kamida `ON` va `OFF` testi yozilsin. Quyidagilar alohida tekshirilsin:

1. Admin policy’ni saqlaydi, refreshdan keyin qiymatlar o‘zgarmaydi.
2. Bosh switch `OFF`: kamera, mikrofon, listeners, heartbeat va event requestlar yo‘q.
3. `DISABLED` preset: Face Mesh/audio o‘chiq, tanlangan browser qoidalari ishlaydi.
4. Copy/paste `OFF`: nusxalash bloklanmaydi va violation yozilmaydi.
5. Tab switch `OFF`: visibility/blur violation yozilmaydi.
6. Fullscreen `OFF`: fullscreen majburlanmaydi.
7. DevTools `OFF`: F12 uchun violation yozilmaydi.
8. Snapshot `OFF`: anomaly bo‘lsa ham rasm yaratilmaydi/yuborilmaydi.
9. Multiple face va no-face snapshot flaglari mustaqil ishlaydi.
10. Voiceprint `OFF`: mikrofon ruxsati so‘ralmaydi.
11. Heartbeat interval server bilan mos va timeout to‘g‘ri hisoblanadi.
12. Single IP `ON`: parallel ikkinchi sessiya serverda bloklanadi; `OFF`: siyosatga muvofiq ruxsat etiladi.
13. Violation limit serverda ishlaydi va klient requestini tahrirlash bilan oshirib/pasaytirib bo‘lmaydi.
14. Oddiy user admin policy endpointini o‘zgartira olmaydi.
15. API xatosida UI muvaffaqiyat ko‘rsatmaydi.
16. Ikki xil brauzerda serverdagi bir xil policy ko‘rinadi.

## 24. Definition of Done

Vazifa faqat quyidagi shartlarda tugallangan hisoblanadi:

- server yagona rasmiy truth source;
- refreshdan keyin ma’lumot qaytib ketmaydi;
- create/update/delete to‘g‘ri endpointlardan foydalanadi;
- API xatosi foydalanuvchiga ko‘rsatiladi;
- localStorage security yoki rasmiy data uchun ishlatilmaydi;
- frontend va backend DTOlari mos;
- correct answer serverda to‘g‘ri saqlanadi va public API’da yashiriladi;
- authorization serverda tekshiriladi;
- mock/hardcoded security data qo‘shilmagan;
- payment va package UI/route/service’lari runtime’dan olib tashlangan;
- barcha olimpiadalar hozir bepul va soxta payment success endpointi yo‘q;
- anti-cheat policy serverda saqlanadi va refreshdan keyin o‘zgarmaydi;
- har bir anti-cheat checkbox `ON` va `OFF` holatda real runtime ta’siriga ega;
- bosh switch o‘chirilganda kamera, mikrofon, listener, heartbeat va snapshot ishlamaydi;
- violation limit va diskvalifikatsiya server tomonidan hisoblanadi;
- anti-cheat bo‘limi ixcham accordion/checklist ko‘rinishida;
- build, lint va testlardan o‘tilgan;
- bajarilgan o‘zgarishlar hisobotda aniq ko‘rsatilgan.

