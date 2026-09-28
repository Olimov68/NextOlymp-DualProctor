#!/bin/bash
# ==========================================================
# NextOlymp — Uzcloud VPS / FastPanel Deploy Script
# Domain: nextolymp.uz
# ==========================================================

set -e

echo "🚀 [1/4] NextOlymp ishlab chiqarishga tayyorlanmoqda..."
echo "📂 Ishchi katalog: $(pwd)"

# Tekshiruv
node -v || { echo "❌ Node.js o'rnatilmagan! curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"; exit 1; }

# Paketlarni o'rnatish
echo "📦 [2/4] Zarur paketlar o'rnatilmoqda (npm install)..."
npm install --legacy-peer-deps

# Build qilish
echo "⚡ [3/4] Production build yig'ilmoqda (npm run build)..."
npm run build

echo "✅ [4/4] dist/ katalogi tayyor!"
echo "=========================================================="
echo "🎉 NextOlymp muvaffaqiyatli yig'ildi!"
echo "🔗 https://nextolymp.uz"
echo "=========================================================="
