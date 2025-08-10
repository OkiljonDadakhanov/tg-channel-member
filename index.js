require("dotenv").config();
const { bot } = require("./bot/bot");
const healthServer = require("./health");

// ---- Ishga tushirish ----
bot.launch();
console.log("✅ Bot ishga tushdi… CTRL+C bilan to'xtatishingiz mumkin.");

// Toza to'xtatish
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  healthServer.close();
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  healthServer.close();
});
