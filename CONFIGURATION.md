# 🔧 Bot Sozlash (Configuration Guide)

## 📋 Kerakli Fayllar

### 1. `.env` Fayl Yaratish

Terminal da quyidagi buyruqni yuboring:

```bash
copy env.example .env
```

### 2. `.env` Faylini Tahrirlash

`.env` faylini ochib, quyidagi ma'lumotlarni kiriting:

```env
# Bot token from @BotFather
BOT_TOKEN=your_actual_bot_token_here

# Channel ID (siz bergan ma'lumot)
REQUIRED_CHANNEL_ID=-1001780323018

# Channel title
REQUIRED_CHANNEL_TITLE=Akilhan

# Channel URL
REQUIRED_CHANNEL_URL=https://t.me/testuchunbotmajburiy

# Admin configuration
# Admin usernames (without @) separated by commas
ADMIN_USERNAMES=

# Admin user IDs separated by commas (sizning ID: 5350135989)
ADMIN_USER_IDS=5350135989

# Note: If both are empty, only channel admins can use admin commands
```

## 🔐 Admin Sozlash

### Admin ID 5350135989 ni Qo'shish

Sizning admin ID 5350135989 ni `.env` faylida `ADMIN_USER_IDS` ga qo'shganingizda:

- ✅ `/stats` buyrug'i ishlaydi
- ✅ `/export` buyrug'i ishlaydi
- ✅ `/backup` buyrug'i ishlaydi
- ✅ Barcha admin buyruqlari ishlaydi

### Admin Tekshiruv

Bot quyidagi usullar bilan admin ni aniqlaydi:

1. **User ID orqali** - `.env` dagi `ADMIN_USER_IDS` da
2. **Username orqali** - `.env` dagi `ADMIN_USERNAMES` da
3. **Kanal admin orqali** - @testuchunbotmajburiy kanalida admin bo'lsangiz

## 🚀 Bot Ishga Tushirish

### Development (Development)

```bash
npm run dev
```

### Production (Production)

```bash
npm start
```

## 📊 Yangi Admin Buyruqlari

### Excel Export

```
/export - Barcha foydalanuvchilar ma'lumotlarini Excel faylga export qiladi
```

### Backup Management

```
/backup - Avtomatik backup yaratadi
/backups - Mavjud backup fayllar ro'yxatini ko'rsatadi
/restore [fayl] - Backup dan ma'lumotlarni tiklaydi
```

### System Management

```
/system - Tizim ma'lumotlarini ko'rsatadi
/cleanup - Eski backup fayllarni tozalaydi
```

## 🔍 Test Qilish

### 1. Bot Ishga Tushganini Tekshirish

```
/start - Bot javob beradi
```

### 2. Admin Buyruqlarini Test Qilish

```
/stats - Statistika ko'rsatiladi
/export - Excel fayl yaratiladi
/system - Tizim ma'lumotlari ko'rsatiladi
```

## ⚠️ Muhim Eslatmalar

1. **Bot Token** - @BotFather dan olingan haqiqiy token bo'lishi kerak
2. **Admin ID** - 5350135989 ni to'g'ri kiritganingizni tekshiring
3. **Kanal ID** - -1001780323018 to'g'ri ekanligini tekshiring
4. **Backup** - Avtomatik backup har 10 ta yangi foydalanuvchida yaratiladi

## 🆘 Xatoliklar

### Bot Ishlamayapti

- `.env` fayl mavjudligini tekshiring
- `BOT_TOKEN` to'g'ri kiritilganini tekshiring
- `npm install` buyrug'ini ishga tushiring

### Admin Buyruqlari Ishlamayapti

- `ADMIN_USER_IDS=5350135989` ni `.env` ga qo'shganingizni tekshiring
- Kanalda admin ekanligingizni tekshiring
- Bot qayta ishga tushiring

## 📞 Yordam

Agar muammo bo'lsa:

1. Console xatolarini tekshiring
2. `.env` fayl sozlamalarini tekshiring
3. Bot qayta ishga tushiring
