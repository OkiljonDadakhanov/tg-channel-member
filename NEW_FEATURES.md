# 🆕 Yangi Xususiyatlar - New Features

## 📊 Ma'lumotlarni Saqlash - Data Storage

### Qanday ishlaydi?

- Barcha foydalanuvchilar ma'lumotlari `data/users.json` faylida saqlanadi
- Har bir ro'yxatdan o'tish avtomatik ravishda saqlanadi
- Ma'lumotlar JSON formatida, oson o'qish va tahrir qilish uchun

### Saqlanadigan ma'lumotlar:

```json
{
  "123456789": {
    "userId": "123456789",
    "firstName": "Aziz",
    "lastName": "Karimov",
    "phone": "+998901234567",
    "address": "Toshkent, Chilonzor",
    "registrationDate": "15.12.2024",
    "createdAt": "2024-12-15T10:30:00.000Z",
    "updatedAt": "2024-12-15T10:30:00.000Z"
  }
}
```

### Xavfsizlik:

- `data/` papkasi `.gitignore` da, GitHub ga yuklanmaydi
- Ma'lumotlar faqat serverda saqlanadi
- Backup olish uchun `data/users.json` ni nusxalab olish mumkin

---

## 🔐 Admin Tizimi - Admin System

### ADMIN_CHAT_ID o'rniga yangi tizim:

- **Username orqali**: `ADMIN_USERNAMES=admin1,admin2`
- **User ID orqali**: `ADMIN_USER_IDS=123456789,987654321`
- **Kanal adminlari**: Avtomatik ravishda kanal adminlari ham admin hisoblanadi

### Yangi admin buyruqlari:

#### `/stats` - Bot statistikasi

```
📊 Bot statistikasi:

👥 Kanal a'zolari: 150
📝 Ro'yxatdan o'tganlar: 45
📅 Bugun: 3
⏰ Sana: 15.12.2024
🕐 Vaqt: 15:30:45
```

#### `/users` - Barcha foydalanuvchilar

```
📊 Ro'yxatdan o'tganlar: 45

🆕 So'nggi 10 ta:

1. Aziz Karimov
   📱 +998901234567
   📅 2024-12-15

2. Malika Yusupova
   📱 +998901234568
   📅 2024-12-15
```

#### `/search [so'z]` - Foydalanuvchilarni qidirish

```
🔍 "Aziz" bo'yicha 1 ta natija:

1. Aziz Karimov
   📱 +998901234567
   📍 Toshkent, Chilonzor
```

#### `/admin` - Admin ma'lumotlari

```
🔐 Admin ma'lumotlari:

👥 Admin usernames: admin1, admin2
🆔 Admin user IDs: 123456789, 987654321
✅ Kanal admin tekshiruv: Faol

📊 Bot statistikasi:
📝 Jami foydalanuvchilar: 45
🔍 Qidirish: /search [so'z]
📊 Statistika: /stats
👥 Foydalanuvchilar: /users
```

---

## ⚙️ Sozlash - Configuration

### .env faylida:

```bash
# Admin usernames (vergul bilan ajratilgan)
ADMIN_USERNAMES=admin1,admin2

# Admin user IDs (vergul bilan ajratilgan)
ADMIN_USER_IDS=123456789,987654321

# Eski ADMIN_CHAT_ID endi kerak emas!
```

### Qanday ishlatish:

1. **Username orqali**: Telegram usernameingizni `ADMIN_USERNAMES` ga qo'shing
2. **User ID orqali**: User ID noma'lum bo'lsa, `/start` yuboring va bot sizga aytadi
3. **Kanal admin**: Agar kanal admin bo'lsangiz, avtomatik ravishda admin huquqlariga ega bo'lasiz

---

## 🚀 Deployment

### Railway da:

- `data/` papkasi avtomatik yaratiladi
- Ma'lumotlar Railway serverida saqlanadi
- Bot o'chganda ham ma'lumotlar saqlanadi

### Local da:

- `npm run dev` bilan ishga tushiring
- `data/users.json` avtomatik yaratiladi

---

## 🔧 Texnik ma'lumotlar

### Fayl struktura:

```
bot/
├── bot.js          # Asosiy bot logikasi
├── storage.js      # Ma'lumotlarni saqlash
├── admin.js        # Admin tizimi
└── ...

data/
└── users.json      # Foydalanuvchilar ma'lumotlari
```

### API:

- `userStorage.saveUser(userId, data)` - Foydalanuvchini saqlash
- `userStorage.getUser(userId)` - Foydalanuvchini olish
- `userStorage.searchUsers(query)` - Qidirish
- `adminManager.isAdmin(ctx)` - Admin tekshiruv
- `adminManager.notifyAdmins(bot, message)` - Adminlarga xabar

---

## ✅ Afzalliklari

1. **Xavfsiz**: Ma'lumotlar GitHub ga yuklanmaydi
2. **Qulay**: JSON formatida, oson o'qish
3. **Tezkor**: Telegraf session o'rniga doimiy saqlash
4. **Moslashuvchan**: Admin tizimi turli usullar bilan
5. **Monitoring**: Kengaytirilgan statistika va qidirish
6. **Backup**: Ma'lumotlarni nusxalab olish mumkin

---

## 🆘 Yordam

Agar muammo bo'lsa:

1. `data/users.json` ni tekshiring
2. `.env` faylida admin ma'lumotlarini to'g'ri kiriting
3. Bot loglarini ko'ring
4. `/admin` buyrug'i bilan admin holatini tekshiring
