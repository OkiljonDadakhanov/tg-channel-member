require("dotenv").config();
const { Telegraf, session, Markup } = require("telegraf");
const userStorage = require("./storage");
const adminManager = require("./admin");
const path = require("path");
const fs = require("fs/promises");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN yo'q");

const REQUIRED_CHANNEL = {
  id: process.env.REQUIRED_CHANNEL_ID || "-1001780323018",
  title: process.env.REQUIRED_CHANNEL_TITLE || "Akilhan",
  url:  "https://t.me/akilhan",
};

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// ---- A'zolik tekshiruvchi helper ----
async function isMember(ctx, channelId, userId) {
  try {
    const m = await ctx.telegram.getChatMember(channelId, userId);
    return ["creator", "administrator", "member"].includes(m.status);
  } catch (e) {
    console.error("getChatMember xato:", e.message);
    return false;
  }
}

// Har safar ishlatadigan "a'zo bo'ling" tugmalari
function joinKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.url(
        `➕ ${REQUIRED_CHANNEL.title} ga qo'shilish`,
        REQUIRED_CHANNEL.url
      ),
    ],
    [Markup.button.callback("Tekshirdim ✅", "verify_join")],
  ]);
}

// 400 "message is not modified"ni yutish
async function safeEditMessageText(ctx, text, extra) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (e) {
    if (e.description?.includes("message is not modified")) {
      await ctx.answerCbQuery("Hali ham a'zo emassiz yoki xabar o'zgarmadi.");
    } else {
      console.error("editMessageText xato:", e.description || e.message);
    }
  }
}

// ---- A'zolik majburiy bo'ladigan global filter ----
bot.use(async (ctx, next) => {
  const data = ctx.message?.text || ctx.callbackQuery?.data || "";
  const skip =
    data?.startsWith?.("/start") ||
    data?.startsWith?.("/help") ||
    data?.startsWith?.("/reset") ||
    data?.startsWith?.("/stats") ||
    data === "verify_join";

  if (skip) return next();

  const userId = ctx.from?.id;
  if (!userId) return next();

  const ok = await isMember(ctx, REQUIRED_CHANNEL.id, userId);
  if (!ok) {
    await ctx.reply(
      "Davom etish uchun kanalga a'zo bo'ling va so'ng \"Tekshirdim ✅\" tugmasini bosing:",
      joinKeyboard()
    );
    return;
  }

  return next();
});

// ---- /start: FAQAT a'zo bo'lsa ro'yxatdan o'tish boshlanadi ----
bot.start(async (ctx) => {
  ctx.session ??= {};
  ctx.session.step = undefined;
  ctx.session.data = {};
  ctx.session.registered ??= false;

  const userId = ctx.from.id;
  const ok = await isMember(ctx, REQUIRED_CHANNEL.id, userId);

  if (!ok) {
    await ctx.reply(
      "Assalomu alaykum! Botdan foydalanish uchun avval kanalga a'zo bo'ling:",
      joinKeyboard()
    );
    return;
  }

  if (ctx.session.registered) {
    await ctx.reply(
      "Siz avval ro'yxatdan o'tgansiz ✅\n/help ni ko'ring yoki /reset bilan qayta boshlang."
    );
    return;
  }

  await ctx.reply(
    "Xush kelibsiz! Ro'yxatdan o'tishni boshlaymiz.\n\nIltimos, ismingizni yozing:"
  );
  ctx.session.step = "ask_first_name";
});

// ---- "Tekshirdim ✅": a'zolik tasdiqlansa ro'yxatdan o'tish start ----
bot.action("verify_join", async (ctx) => {
  ctx.session ??= {};
  const userId = ctx.from.id;
  const ok = await isMember(ctx, REQUIRED_CHANNEL.id, userId);

  if (!ok) {
    await ctx.answerCbQuery("Hali a'zo emassiz. Iltimos, kanalga qo'shiling.");
    return safeEditMessageText(
      ctx,
      "Hali a'zo emassiz. Iltimos, pastdagi tugma orqali qo'shiling:",
      joinKeyboard()
    );
  }

  await ctx.answerCbQuery("Tasdiqlandi ✅");
  await safeEditMessageText(ctx, "Rahmat! A'zolik tasdiqlandi ✅");

  if (ctx.session.registered) {
    return ctx.reply(
      "Siz avval ro'yxatdan o'tgansiz. /help ni ko'ring yoki /reset bilan qayta boshlang."
    );
  }

  await ctx.reply(
    "Ro'yxatdan o'tishni boshlaymiz. Iltimos, ismingizni yozing:"
  );
  ctx.session.step = "ask_first_name";
  ctx.session.data = {};
});

// ---- Yordam & reset ----
bot.help(async (ctx) => {
  let helpText =
    "Menyular:\n" +
    "/start — boshlash\n" +
    "/reset — ro'yxatdan o'tishni qayta boshlash\n" +
    "/profile — profil\n" +
    "/stats — statistika\n" +
    "/help — yordam\n\n" +
    "Eslatma: kanalga a'zo bo'lish majburiy.";

  // Add admin commands if user is admin
  if (await adminManager.isAdmin(ctx)) {
    helpText +=
      "\n\n🔐 Admin buyruqlari:\n" +
      "/stats — statistika\n" +
      "/users — barcha foydalanuvchilar\n" +
      "/search [so'z] — foydalanuvchilarni qidirish\n" +
      "/export — Excel fayl yaratish\n" +
      "/backup — backup yaratish\n" +
      "/backups — backup ro'yxati\n" +
      "/restore [fayl] — backup dan tiklash\n" +
      "/system — tizim ma'lumotlari\n" +
      "/cleanup — tizim tozalash\n" +
      "/admin — admin ma'lumotlari";
  }

  await ctx.reply(helpText);
});

bot.command("reset", (ctx) => {
  ctx.session = { step: undefined, data: {}, registered: false };
  return ctx.reply("Qayta boshlandi. /start yuboring va jarayonni boshlang.");
});

bot.command("profile", async (ctx) => {
  try {
    // Try to get data from storage first
    const storedUser = await userStorage.getUser(ctx.from.id);

    if (storedUser) {
      // User exists in storage
      return ctx.reply(
        `✅ Ro'yxatdan o'tgan\n` +
          `📝 Ism: ${storedUser.firstName}\n` +
          `📝 Familiya: ${storedUser.lastName}\n` +
          `📱 Telefon: ${storedUser.phone}\n` +
          `📍 Manzil: ${storedUser.address}\n` +
          `📅 Ro'yxatdan o'tgan sana: ${storedUser.createdAt.split("T")[0]}\n` +
          `🕐 Yaratilgan vaqt: ${
            storedUser.createdAt.split("T")[1].split(".")[0]
          }`
      );
    } else {
      // Fallback to session data
      const d = ctx.session?.data || {};
      const reg = ctx.session?.registered ? "✅" : "❌";
      return ctx.reply(
        `Ro'yxatdan o'tgan: ${reg}\n` +
          `Ism: ${d.firstName || "-"}\n` +
          `Familiya: ${d.lastName || "-"}\n` +
          `Telefon: ${d.phone || "-"}\n` +
          `Manzil: ${d.address || "-"}\n` +
          `Ro'yxatdan o'tgan sana: ${d.registrationDate || "-"}`
      );
    }
  } catch (error) {
    console.error("Profile ko'rishda xato:", error);
    // Fallback to session data on error
    const d = ctx.session?.data || {};
    const reg = ctx.session?.registered ? "✅" : "❌";
    return ctx.reply(
      `Ro'yxatdan o'tgan: ${reg}\n` +
        `Ism: ${d.firstName || "-"}\n` +
        `Familiya: ${d.lastName || "-"}\n` +
        `Telefon: ${d.phone || "-"}\n` +
        `Manzil: ${d.address || "-"}\n` +
        `Ro'yxatdan o'tgan sana: ${d.registrationDate || "-"}`
    );
  }
});

// ---- Yangi feature: Statistika ----
bot.command("stats", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  try {
    // Get chat information to retrieve member count
    const chatInfo = await ctx.telegram.getChat(REQUIRED_CHANNEL.id);
    const memberCount = chatInfo.member_count || "Noma'lum";
    const userStats = await userStorage.getStats();

    await ctx.reply(
      `📊 Bot statistikasi:\n\n` +
        `👥 Kanal a'zolari: ${memberCount}\n` +
        `📝 Ro'yxatdan o'tganlar: ${userStats.total}\n` +
        `📅 Bugun: ${
          userStats.byDate[new Date().toISOString().split("T")[0]] || 0
        }\n` +
        `⏰ Sana: ${new Date().toLocaleDateString("uz-UZ")}\n` +
        `🕐 Vaqt: ${new Date().toLocaleTimeString("uz-UZ")}`
    );
  } catch (error) {
    console.error("Statistika olishda xato:", error);
    await ctx.reply("Statistika olishda xatolik yuz berdi.");
  }
});

// ---- Ro'yxatdan o'tish oqimi ----
bot.on("text", async (ctx) => {
  ctx.session ??= {};
  const step = ctx.session.step;
  const msg = (ctx.message?.text || "").trim();

  // 1) Har doim a'zolikni qayta tekshiramiz
  const userId = ctx.from.id;
  const ok = await isMember(ctx, REQUIRED_CHANNEL.id, userId);
  if (!ok) {
    ctx.session.step = undefined;
    return ctx.reply(
      "Botdan foydalanish uchun kanalga a'zo bo'lish majburiy. Iltimos, a'zo bo'ling:",
      joinKeyboard()
    );
  }

  // 2) Agar oqim yo'q bo'lsa, foydali javob
  if (!step) {
    return ctx.reply("Buyruqlar: /start, /help, /profile, /reset, /stats.");
  }

  if (step === "ask_first_name") {
    if (msg.length < 2)
      return ctx.reply("Ism juda qisqa. Iltimos, to'liqroq kiriting:");
    ctx.session.data.firstName = msg;
    ctx.session.step = "ask_last_name";
    return ctx.reply("Familiyangizni kiriting:");
  }

  if (step === "ask_last_name") {
    if (msg.length < 2)
      return ctx.reply("Familiya juda qisqa. Iltimos, to'liqroq kiriting:");
    ctx.session.data.lastName = msg;
    ctx.session.step = "ask_phone";
    return ctx.reply("Telefon raqamingizni kiriting (masalan: +998901234567):");
  }

  if (step === "ask_phone") {
    const phone = msg.replace(/\s+/g, "");
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return ctx.reply(
        "Telefon formati noto'g'ri. Masalan: +998901234567. Qayta kiriting:"
      );
    }
    ctx.session.data.phone = phone;
    ctx.session.step = "ask_address";
    return ctx.reply(
      "Yashash manzilingizni kiriting (shahar/tuman, ko'cha, uy):"
    );
  }

  if (step === "ask_address") {
    if (msg.length < 5)
      return ctx.reply("Manzil juda qisqa. Iltimos, to'liqroq kiriting:");
    ctx.session.data.address = msg;
    ctx.session.data.registrationDate = new Date().toLocaleDateString("uz-UZ");

    // Yakun: ma'lumotlarni saqlab, tasdiqlaymiz
    const d = ctx.session.data;
    ctx.session.step = undefined;
    ctx.session.registered = true;

    // Save user data to storage
    try {
      await userStorage.saveUser(ctx.from.id, d);
      console.log(`✅ User ${ctx.from.id} saved to storage`);
    } catch (error) {
      console.error("User saqlashda xato:", error);
    }

    // Send admin notification using new system
    try {
      const adminMessage =
        "📝 Yangi ro'yxatdan o'tish:\n" +
        `- UserID: ${ctx.from.id}\n` +
        `- Username: @${ctx.from.username || "-"}\n` +
        `- Ism: ${d.firstName}\n` +
        `- Familiya: ${d.lastName}\n` +
        `- Telefon: ${d.phone}\n` +
        `- Manzil: ${d.address}\n` +
        `- Sana: ${d.registrationDate}`;

      await adminManager.notifyAdmins(bot, adminMessage);
    } catch (e) {
      console.error("Admin notification xato:", e.message);
    }

    await ctx.reply(
      "🎉 Rahmat! Ma'lumotlaringiz qabul qilindi ✅\n\n" +
        `📝 Ism: ${d.firstName}\n` +
        `📝 Familiya: ${d.lastName}\n` +
        `📱 Telefon: ${d.phone}\n` +
        `📍 Manzil: ${d.address}\n` +
        `📅 Sana: ${d.registrationDate}\n\n` +
        "Profilingizni ko'rish: /profile\n" +
        "Yordam: /help"
    );
    return;
  }

  return ctx.reply(
    "Jarayonni qayta boshlash uchun /reset yoki /start yuboring."
  );
});

// ---- Admin commands ----
bot.command("users", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  try {
    const userCount = await userStorage.getUserCount();
    const allUsers = await userStorage.getAllUsers();

    if (userCount === 0) {
      return ctx.reply("📝 Hali hech kim ro'yxatdan o'tmagan.");
    }

    // Show first 10 users
    const recentUsers = Object.values(allUsers)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    let message = `📊 Ro'yxatdan o'tganlar: ${userCount}\n\n`;
    message += "🆕 So'nggi 10 ta:\n\n";

    recentUsers.forEach((user, index) => {
      message += `${index + 1}. ${user.firstName} ${user.lastName}\n`;
      message += `   📱 ${user.phone}\n`;
      message += `   📅 ${user.createdAt.split("T")[0]}\n\n`;
    });

    if (userCount > 10) {
      message += `... va yana ${userCount - 10} ta`;
    }

    await ctx.reply(message);
  } catch (error) {
    console.error("Users ko'rishda xato:", error);
    await ctx.reply("Ma'lumotlarni olishda xatolik yuz berdi.");
  }
});

bot.command("search", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  const query = ctx.message.text.replace("/search", "").trim();
  if (!query) {
    return ctx.reply(
      "Qidirish uchun so'z kiriting:\n/search [ism, familiya, telefon yoki manzil]"
    );
  }

  try {
    const results = await userStorage.searchUsers(query);

    if (results.length === 0) {
      return ctx.reply(`🔍 "${query}" bo'yicha hech narsa topilmadi.`);
    }

    let message = `🔍 "${query}" bo'yicha ${results.length} ta natija:\n\n`;

    results.slice(0, 5).forEach((user, index) => {
      message += `${index + 1}. ${user.firstName} ${user.lastName}\n`;
      message += `   📱 ${user.phone}\n`;
      message += `   📍 ${user.address}\n\n`;
    });

    if (results.length > 5) {
      message += `... va yana ${results.length - 5} ta natija`;
    }

    await ctx.reply(message);
  } catch (error) {
    console.error("Qidirishda xato:", error);
    await ctx.reply("Qidirishda xatolik yuz berdi.");
  }
});

bot.command("admin", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  const adminInfo = adminManager.getAdminInfo();
  const userCount = await userStorage.getUserCount();

  let message = "🔐 Admin ma'lumotlari:\n\n";
  message += `👥 Admin usernames: ${
    adminInfo.adminUsernames.join(", ") || "Yo'q"
  }\n`;
  message += `🆔 Admin user IDs: ${
    adminInfo.adminUserIds.join(", ") || "Yo'q"
  }\n`;
  message += `✅ Kanal admin tekshiruv: ${
    adminInfo.hasChannelAdminCheck ? "Faol" : "O'chirilgan"
  }\n\n`;
  message += `📊 Bot statistikasi:\n`;
  message += `📝 Jami foydalanuvchilar: ${userCount}\n`;
  message += `🔍 Qidirish: /search [so'z]\n`;
  message += `📊 Statistika: /stats\n`;
  message += `👥 Foydalanuvchilar: /users`;

  await ctx.reply(message);
});

// New admin commands
bot.command("export", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }
  try {
    await ctx.reply("📊 Excel fayl yaratilmoqda...");
    const excelPath = await userStorage.exportToExcel();
    const fileName = path.basename(excelPath);

    await ctx.replyWithDocument(
      { source: excelPath },
      {
        caption: `📊 Excel fayl yaratildi!\n\n📁 Fayl nomi: ${fileName}\n📅 Sana: ${new Date().toLocaleDateString(
          "uz-UZ"
        )}\n🕐 Vaqt: ${new Date().toLocaleTimeString("uz-UZ")}`,
        filename: fileName,
      }
    );
  } catch (error) {
    console.error("Excel export xato:", error);
    await ctx.reply("Excel fayl yaratishda xatolik yuz berdi.");
  }
});

bot.command("backup", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }
  try {
    await ctx.reply("💾 Backup yaratilmoqda...");
    const backupFile = await userStorage.createBackup();

    if (backupFile) {
      const fileName = path.basename(backupFile);
      await ctx.replyWithDocument(
        { source: backupFile },
        {
          caption: `💾 Backup yaratildi!\n\n📁 Fayl nomi: ${fileName}\n📅 Sana: ${new Date().toLocaleDateString(
            "uz-UZ"
          )}\n🕐 Vaqt: ${new Date().toLocaleTimeString("uz-UZ")}`,
          filename: fileName,
        }
      );
    } else {
      await ctx.reply("Backup yaratishda xatolik yuz berdi.");
    }
  } catch (error) {
    console.error("Backup xato:", error);
    await ctx.reply("Backup yaratishda xatolik yuz berdi.");
  }
});

bot.command("backups", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }
  try {
    const backupList = await userStorage.getBackupList();

    if (backupList.length === 0) {
      return ctx.reply("📂 Backup fayllari topilmadi.");
    }

    let message = "📂 Mavjud backup fayllari:\n\n";
    backupList.slice(0, 10).forEach((backup, index) => {
      const date = new Date(backup.date).toLocaleDateString("uz-UZ");
      const size = (backup.size / 1024).toFixed(2);
      message += `${index + 1}. 📁 ${backup.filename}\n`;
      message += `   📅 ${date} | 📏 ${size} KB\n\n`;
    });

    if (backupList.length > 10) {
      message += `... va yana ${backupList.length - 10} ta backup fayl`;
    }

    await ctx.reply(message);
  } catch (error) {
    console.error("Backup ro'yxatini olishda xato:", error);
    await ctx.reply("Backup ro'yxatini olishda xatolik yuz berdi.");
  }
});

bot.command("restore", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply(
      "❌ Backup fayl nomini kiriting.\n\n📝 Misol: /restore users_backup_2024-12-15T10-30-00-000Z.json"
    );
  }

  const backupFilename = args[1];

  try {
    await ctx.reply("🔄 Backup dan tiklash boshlandi...");
    const success = await userStorage.restoreFromBackup(backupFilename);

    if (success) {
      await ctx.reply("✅ Backup dan muvaffaqiyatli tiklandi!");
    } else {
      await ctx.reply("❌ Backup dan tiklashda xatolik yuz berdi.");
    }
  } catch (error) {
    console.error("Backup dan tiklashda xato:", error);
    await ctx.reply("Backup dan tiklashda xatolik yuz berdi.");
  }
});

bot.command("system", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }
  try {
    const systemInfo = await userStorage.getSystemInfo();
    const adminInfo = adminManager.getAdminInfo();

    let message = "🖥️ Tizim ma'lumotlari:\n\n";
    message += `📊 Jami foydalanuvchilar: ${systemInfo.totalUsers}\n`;
    message += `📅 Bugungi ro'yxatdan o'tishlar: ${systemInfo.todayRegistrations}\n`;
    message += `💾 So'nggi backup: ${systemInfo.lastBackup}\n`;
    message += `📂 Backup soni: ${systemInfo.backupCount}\n`;
    message += `📁 Data fayl hajmi: ${systemInfo.dataFileSize}\n`;
    message += `📊 Excel fayl hajmi: ${systemInfo.excelFileSize}\n\n`;

    message += "🔐 Admin sozlamalari:\n";
    message += `👤 Admin usernames: ${
      adminInfo.usernames.length > 0 ? adminInfo.usernames.join(", ") : "Yo'q"
    }\n`;
    message += `🆔 Admin ID lar: ${
      adminInfo.userIds.length > 0 ? adminInfo.userIds.join(", ") : "Yo'q"
    }\n`;
    message += `📢 Kanal admin tekshiruv: ${
      adminInfo.channelAdminCheck ? "✅" : "❌"
    }\n\n`;

    message += `⏰ Sana: ${new Date().toLocaleDateString("uz-UZ")}\n`;
    message += `🕐 Vaqt: ${new Date().toLocaleTimeString("uz-UZ")}`;

    await ctx.reply(message);
  } catch (error) {
    console.error("System info olishda xato:", error);
    await ctx.reply("Tizim ma'lumotlarini olishda xatolik yuz berdi.");
  }
});

bot.command("cleanup", async (ctx) => {
  if (!(await adminManager.isAdmin(ctx))) {
    return ctx.reply("Bu buyruq faqat admin uchun.");
  }

  try {
    await ctx.reply("🧹 Tizim tozalash boshlandi...");

    // Create backup before cleanup
    await userStorage.createBackup();

    // Get old backups and remove them
    const backupList = await userStorage.getBackupList();
    let removedCount = 0;

    if (backupList.length > 5) {
      for (let i = 5; i < backupList.length; i++) {
        try {
          await fs.unlink(
            path.join(
              __dirname,
              "..",
              "data",
              "backups",
              backupList[i].filename
            )
          );
          removedCount++;
        } catch (error) {
          console.error(
            `Backup o'chirishda xato: ${backupList[i].filename}`,
            error
          );
        }
      }
    }

    await ctx.reply(
      `✅ Tizim tozalandi!\n\n🗑️ O'chirilgan backup fayllar: ${removedCount}\n💾 Saqlangan backup fayllar: ${Math.min(
        backupList.length,
        5
      )}`
    );
  } catch (error) {
    console.error("Tizim tozalashda xato:", error);
    await ctx.reply("Tizim tozalashda xatolik yuz berdi.");
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Bot xatosi ${ctx.updateType}:`, err);
  try {
    ctx.reply("Kechirasiz, xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
  } catch (e) {
    console.error("Xatolik haqida xabar yuborishda muammo:", e);
  }
});

module.exports = { bot, REQUIRED_CHANNEL };
