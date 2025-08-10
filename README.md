# Majburiy Bot - Telegram Registration Bot

Bu bot foydalanuvchilarni kanalga a'zo bo'lishga majburlaydi va ro'yxatdan o'tkazadi.

## ✨ Yangi Features

- 🎯 **Kanal ID bilan ishlaydi** - `-1001780323018` (@testuchunbotmajburiy)
- 📊 **Admin statistika** - `/stats` buyrug'i bilan kanal statistikasini ko'rish
- 📅 **Ro'yxat sanasi** - Har bir ro'yxatdan o'tish sanasi saqlanadi
- 🚀 **Cloud deployment** - Railway platformasida uzluksiz ishlaydi
- 💪 **Error handling** - Barcha xatoliklar to'g'ri boshqariladi

## 🚀 Deployment (Railway)

### 1. Railway Account yarating

- [railway.app](https://railway.app) ga o'ting
- GitHub bilan login qiling

### 2. Project yarating

- "New Project" → "Deploy from GitHub repo"
- Bu repository ni tanlang

### 3. Environment Variables o'rnating

Railway dashboard da quyidagi o'zgaruvchilarni qo'shing:

```
BOT_TOKEN=your_bot_token_from_botfather
REQUIRED_CHANNEL_ID=-1001780323018
REQUIRED_CHANNEL_TITLE=Akilhan
REQUIRED_CHANNEL_URL=https://t.me/testuchunbotmajburiy
ADMIN_CHAT_ID=your_admin_chat_id
```

### 4. Deploy qiling

- Railway avtomatik deploy qiladi
- Bot 24/7 ishlaydi

## 🔧 Local Development

### 1. Dependencies o'rnating

```bash
npm install
```

### 2. Environment file yarating

```bash
cp env.example .env
# .env faylini tahrirlang
```

### 3. Bot ishga tushiring

```bash
npm start
```

## 📱 Bot Buyruqlari

- `/start` - Botni boshlash
- `/help` - Yordam
- `/profile` - Profil ko'rish
- `/reset` - Qayta boshlash
- `/stats` - Kanal statistikasi (admin uchun)

## 🎯 Asosiy Funksiyalar

1. **A'zolik tekshirish** - Har bir buyruq oldidan kanalga a'zolik tekshiriladi
2. **Ro'yxatdan o'tish** - Ism, familiya, telefon, manzil
3. **Admin xabarlari** - Yangi ro'yxatdan o'tishlar admin ga yuboriladi
4. **Session management** - Foydalanuvchi ma'lumotlari saqlanadi

## 🌐 Cloud Platforms

Bot quyidagi platformalarda ishlaydi:

- ✅ **Railway** (Tavsiya etiladi - bepul)
- ✅ **Heroku** (Bepul tier bekor qilindi)
- ✅ **Render** (Bepul)
- ✅ **DigitalOcean App Platform**

## 📊 Monitoring

Bot Railway da quyidagi monitoring imkoniyatlariga ega:

- Logs ko'rish
- Performance metrics
- Auto-restart on failure
- Health checks

## 🔒 Security

- Environment variables orqali konfiguratsiya
- Bot token xavfsiz saqlanadi
- Admin buyruqlari faqat admin uchun

## 📞 Support

Muammo bo'lsa:

1. Railway logs ni tekshiring
2. Bot token to'g'ri ekanligini tekshiring
3. Kanal ID va URL to'g'ri ekanligini tekshiring

## 🎉 Natija

Bot deployment dan keyin:

- 24/7 ishlaydi
- Laptop o'chirilganida ham ishlaydi
- Avtomatik restart
- Professional monitoring
