const userStorage = require("./storage");
require("dotenv").config();

class AdminManager {
  constructor() {
    // Admin usernames (without @) - add your admin usernames here
    this.adminUsernames = process.env.ADMIN_USERNAMES?.split(",") || [];

    // Admin user IDs - alternative to usernames
    this.adminUserIds =
      process.env.ADMIN_USER_IDS?.split(",").map((id) => id.trim()) || [];

    console.log("AdminManager initialized with:", {
      adminUsernames: this.adminUsernames,
      adminUserIds: this.adminUserIds,
    });
  }

  // Check if user is admin by username or user ID
  async isAdmin(ctx) {
    const userId = ctx.from?.id?.toString();
    const username = ctx.from?.username;

    // Check by user ID
    if (userId && this.adminUserIds.includes(userId)) {
      return true;
    }

    // Check by username
    if (username && this.adminUsernames.includes(username)) {
      return true;
    }

    // Check if user is channel admin
    try {
      const chatMember = await ctx.telegram.getChatMember(
        process.env.REQUIRED_CHANNEL_ID || "-1001780323018",
        userId
      );
      return ["creator", "administrator"].includes(chatMember.status);
    } catch (error) {
      return false;
    }
  }

  // Get admin info for debugging
  getAdminInfo() {
    return {
      adminUsernames: this.adminUsernames,
      adminUserIds: this.adminUserIds,
      hasChannelAdminCheck: true,
    };
  }

  // Send admin notification to all admin users
  async notifyAdmins(bot, message) {
    const notifications = [];

    // Notify by user IDs
    for (const userId of this.adminUserIds) {
      try {
        await bot.telegram.sendMessage(userId, message);
        notifications.push({ type: "user_id", id: userId, success: true });
      } catch (error) {
        notifications.push({
          type: "user_id",
          id: userId,
          success: false,
          error: error.message,
        });
      }
    }

    // Note: We can't notify by username without storing user IDs
    // This is a limitation of Telegram Bot API

    return notifications;
  }

  // Check if user has permission for specific admin actions
  async hasPermission(ctx, action) {
    const isAdmin = await this.isAdmin(ctx);

    if (!isAdmin) return false;

    // All admin users have full permissions
    return true;
  }
}

module.exports = new AdminManager();
