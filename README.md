# 🏆 NextOlymp — Dual-Device AI Proctoring Platform

> **NextOlymp** — Akademik olimpiadalar va nufuzli onlayn imtihonlar uchun mo'ljallangan, sun'iy intellekt (Computer Vision) va ikki qurilmali nazorat (Dual-Device Proctoring) tizimiga ega zamonaviy platforma.

---

## 🌟 Asosiy Imkoniyatlar (Core Features)

1. **📱 Ikki Qurilmali Nazorat (Dual-Device Pairing)**
   - Asosiy test qurilmasi (Noutbuk yoki Planshet) va ikkinchi kuzatuvchi mobil telefon o'rtasida real-vaqtda P2P (WebRTC) va WebSocket aloqasi.
   - Tezkor QR-kod orqali 2-telefonni bir zumda tizimga ulash.
   - Mobil telefon uchun maxsus batareyani tejovchi (OLED Pitch Black) va ekranni o'chirmaslik (Wake Lock API) rejimlari.

2. **🧠 Sun'iy Intellekt Rakurs Kalibratsiyasi (AI Placement Calibration)**
   - 2-telefon kamerasidan olingan nazorat kadrini **Vision AI (Gemini 1.5 Flash / DeepSeek Vision)** orqali 4 ta qat'iy parametr bo'yicha baholash:
     - 👤 **O'quvchi gavdasi (`student`):** Kadrda bosh, yuz va tana holati yetarli darajada ko'rinishi.
     - ✍️ **Ikkala qo'l va ish stoli (`hands`, `desk`):** Klaviatura, sichqoncha va ishchi stol yuzasi to'liq ko'rinib turishi.
     - 💻 **Asosiy test ekrani (`screen`):** Noutbuk monitori yon/orqa rakursdan kadrga tushganligi.
     - 📐 **Masofa va burchak:** Telefon stoldan 1.5 metr uzoqlikda va 45° burchak ostida o'rnatilganligi.
   - Agar biror element yetishmasa, AI o'quvchiga aniq yo'riqnoma beradi (masalan: *"Kamerani biroz orqaroqqa suring, qo'llaringiz ko'rinmayapti"*).

3. **⏱️ Imtihon Darvozasi (Gatekeeper)**
   - Joylashuv AI tomonidan tasdiqlangach, imtihon vaqti tekshiriladi (`currentTime >= exam.startTime`).
   - Vaqt yetib kelguncha "Imtihonni boshlash" tugmasi qulflangan bo'ladi va ortga hisoblash taymeri ishlaydi.
   - Belgilangan soniyada server orqali `START_PERMITTED` signali keladi va to'liq ekranga o'tish bilan test boshlanadi.

4. **🛡️ ExamGuard 360° Anti-Cheat Himoyasi**
   - MediaPipe FaceMesh (WASM) orqali kadrda begona shaxslar yoki monitordan chetga qarashlarni aniqlash.
   - Voiceprint biometrik audio nazorati (begona ovozlarni tahlil qilish).
   - Tab almashish va to'liq ekrandan chiqish holatlarini qat'iy qayd etish.

---

## 🛠 Texnik Stek (Tech Stack)

### Frontend (Asosiy Tizim & Mobil Oqim):
- **Framework:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons, Canvas Confetti
- **Real-time & Video:** WebRTC PeerConnection, Socket.io Client, BroadcastChannel
- **State Management:** Zustand, TanStack Query

### Backend & AI Servis:
- **Server:** Node.js, Express, Socket.io Server
- **Ma'lumotlar Bazasi:** PostgreSQL, Prisma ORM
- **AI Vision Engine:** Google Gemini 1.5/2.0 Flash Vision API, DeepSeek Vision

---

## 📂 Loyiha Tuzilishi (Project Structure)

```text
NextOlymp/
├── src/
│   ├── components/
│   │   ├── contest/
│   │   │   ├── ExamSetupModal.tsx      # 4 bosqichli Stepper (QR, Joylashuv, AI, Gatekeeper)
│   │   │   ├── QuestionCard.tsx        # Imtihon savollari va javoblar interfeysi
│   │   │   ├── AntiCheatBanner.tsx     # Qoidabuzarliklar ogohlantirishi
│   │   │   └── Timer.tsx               # Real-vaqt imtihon taymeri
│   ├── pages/
│   │   ├── public/
│   │   │   └── ProctorStreamView.tsx   # 2-telefon mobil brauzeri uchun engil kamera sahifasi
│   │   └── student/
│   │       ├── ContestParticipatePage.tsx # Asosiy imtihon xonasi
│   │       └── ExamDiagnosticPage.tsx     # Boshlang'ich texnik diagnostika
│   ├── services/
│   │   ├── setupProctor.service.ts     # AI Snapshot Validator & Multi-Channel Signaling
│   │   ├── mediaPipeVisionService.ts   # Edge AI FaceMesh
│   │   └── audioProctoringService.ts   # Voiceprint audio monitoring
│   └── types/
│       └── dualDeviceProctor.ts        # TypeScript interfeyslari va socket hodisalari
├── server/
│   ├── prisma/
│   │   └── schema.prisma               # Prisma ORM modellari (Session, CalibrationLogs)
│   └── src/
│       ├── controllers/
│       │   └── proctor.controller.ts   # Seans yaratish, kalibratsiya va Gatekeeper API
│       ├── services/
│       │   └── setupProctor.service.ts # Backend Gemini/DeepSeek Vision validator
│       ├── sockets/
│       │   └── proctorSocketHandler.ts # WebSocket xonalar va WebRTC relay
│       └── server.ts                   # Express & Socket.io serveri
└── scripts/
    └── clean-comments.js               # Kodlarni tozalash skripti
```

---

## 🚀 Ishga Tushirish (Getting Started)

### 1. Talablar:
- **Node.js:** v18.0.0 yoki undan yuqori
- **npm** yoki **yarn**

### 2. O'rnatish va Frontendni Ishga Tushirish:
```bash
# Repositoriyani yuklab oling
git clone https://github.com/Olimov68/NextOlymp-DualProctor.git
cd NextOlymp-DualProctor

# Bog'liqliklarni o'rnating
npm install

# Lokal serverni ishga tushiring
npm run dev
```
Sayt avtomatik ravishda `http://localhost:3000` manzilida ishga tushadi.

### 3. Backend Proktorlik Serverini Ishga Tushirish (Ixtiyoriy):
```bash
cd server
npm install
npm run dev
```
Backend `http://localhost:5000` portida faollashadi.

> **Eslatma:** Frontend ichida o'rnatilgan **Multi-Channel Local Gateway (`BroadcastChannel` + `localStorage`)** tufayli, siz alohida backend serverni yoqmasdan ham bitta kompyuterda ikkita oyna ochib (yoki "Tezkor Sinov Rejimi" orqali) butun ikki qurilmali jarayonni to'liq sinab ko'rishingiz mumkin!

---

## 📱 Sinash va Foydalanish Qo'llanmasi

1. Brauzerda istalgan imtihon sahifasiga kiring: `http://localhost:3000/olympiads/OLY-101/participate`
2. **"Sozlash va Kalibratsiya"** tugmasini bosing.
3. **1-Bosqich (Ulanish):**
   - **Kompyuterda sinash uchun:** "📲 2-Telefon oynasini ochish (Popup)" yoki "⚡ Tezkor Sinov Rejimi" tugmasini bosing.
   - **Haqiqiy telefonda sinash uchun:** QR-kod ostidagi **"Wi-Fi IP"** tugmasini bosing va telefon kamerasi bilan skanerlang.
4. **2-Bosqich (Joylashuv):**
   - Stol burchagiga 45° rakursda qo'ying va jonli tasvirni ko'rib turing.
   - "Joylashtirdim, tekshirish (AI Calibration)" tugmasini bosing.
5. **3-Bosqich (AI Tasdiqlash):**
   - Vision AI o'quvchi, qo'llar, ishchi stol va ekranni tahlil qiladi va natijani qaytaradi.
6. **4-Bosqich (Gatekeeper):**
   - Taymer tugagach yoki ruxsat berilgach, **"Imtihonni Boshlash"** tugmasi ochiladi!

---

## 📡 WebSocket Signallari (Socket.io Events)

| Hodisa (Event) | Tavsif |
|----------------|--------|
| `proctor:join_room` | Seans xonasiga ulanish (`sessionId`, `role`) |
| `DEVICE_CONNECTED` | 2-telefon muvaffaqiyatli ulanganida asosiy ekranga xabar berish |
| `proctor:frame_preview` | 2-telefondan har 400ms da jonli kadrlar oqimini yetkazish |
| `proctor:request_snapshot` | 1-qurilmadan 2-telefonga yuqori sifatli kadr olish buyrug'i |
| `proctor:snapshot_ready` | Olingan snapshotni AI tekshiruviga yuborish |
| `proctor:ai_calibration_result` | AI tahlilining natijasi (tasdiqlash yoki xatolik yo'riqnomasi) |
| `START_PERMITTED` | Imtihon vaqti kelganida testni ochish buyrug'i |

---

## 📄 Litsenziya

NextOlymp loyihasi ochiq kodli ta'limiy va akademik tizim hisoblanadi. Mualliflik huquqlari himoyalangan.
Muallif: **Asilbek Olimov (Olimov68)**.
