#!/bin/bash

echo "🚀 Majburiy Bot Deployment Script"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI topilmadi. O'rnatish kerak:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Railway ga login qiling:"
    railway login
fi

echo "✅ Railway ga login qilindi"

# Deploy to Railway
echo "🚀 Bot deploy qilinmoqda..."
railway up

echo "✅ Bot muvaffaqiyatli deploy qilindi!"
echo "🌐 Railway dashboard da bot holatini ko'ring"
echo "📱 Bot endi 24/7 ishlaydi!"
