#!/bin/bash
# ==========================================================
# NextOlymp — Production Deploy Script
# Domain: nextolymp.uz
# ==========================================================

set -e

echo "🚀 [1/5] Muhit va talablar tekshirilmoqda..."
echo "📂 Ishchi katalog: $(pwd)"

# Node.js tekshiruvi
node -v || { echo "❌ Node.js o'rnatilmagan!"; exit 1; }
npm -v || { echo "❌ npm o'rnatilmagan!"; exit 1; }

# Xavfsizlik: .env fayl tekshiruvi
if [ ! -f ".env" ] && [ ! -f "server/.env" ]; then
  echo "⚠️ OGOHLANTIRISH: .env fayl topilmadi! .env.example asosida .env yarating."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "📄 .env.example dan .env nusxalandi. Iltimos, JWT_SECRET ni o'zgartiring!"
  fi
fi

# Frontend paketlarni o'rnatish va build
echo "📦 [2/5] Frontend paketlari o'rnatilmoqda..."
npm install --legacy-peer-deps --no-audit

echo "⚡ [3/5] Frontend production build yig'ilmoqda..."
npm run build

# Backend paketlarni o'rnatish
echo "📦 [4/5] Backend (server/) paketlari o'rnatilmoqda..."
if [ -d "server" ]; then
  cd server
  npm install --legacy-peer-deps --no-audit
  cd ..
fi

# Systemd xizmatini qayta ishga tushirish (agar mavjud bo'lsa)
echo "🔄 [5/5] Backend xizmati yangilanmoqda..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet ibnsinoapi.service 2>/dev/null; then
  sudo systemctl restart ibnsinoapi.service || echo "⚠️ ibnsinoapi.service ni qayta ishga tushirib bo'lmadi (sudo ruxsati kerak)."
fi

echo "=========================================================="
echo "🎉 NextOlymp muvaffaqiyatli yangilandi va yig'ildi!"
echo "🔗 https://nextolymp.uz"
echo "=========================================================="
