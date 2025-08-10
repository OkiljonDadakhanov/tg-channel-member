const fs = require("fs").promises;
const path = require("path");
const XLSX = require("xlsx");
const fsExtra = require("fs-extra");

class UserStorage {
  constructor() {
    this.dataPath = path.join(__dirname, "..", "data", "users.json");
    this.excelPath = path.join(__dirname, "..", "data", "users.xlsx");
    this.backupPath = path.join(__dirname, "..", "data", "backups");
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      const dataDir = path.dirname(this.dataPath);
      await fsExtra.ensureDir(dataDir);
      await fsExtra.ensureDir(this.backupPath);
    } catch (error) {
      console.error("Data directory yaratishda xato:", error);
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.dataPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      }
      console.error("Users yuklashda xato:", error);
      return {};
    }
  }

  async saveUsers(users) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error("Users saqlashda xato:", error);
      throw error;
    }
  }

  async saveUser(userId, userData) {
    try {
      const users = await this.loadUsers();
      const now = new Date().toISOString();

      users[userId] = {
        ...userData,
        userId: userId.toString(),
        createdAt: users[userId]?.createdAt || now,
        updatedAt: now,
        lastActivity: now,
      };

      await this.saveUsers(users);

      // Auto-backup every 10 users
      const userCount = Object.keys(users).length;
      if (userCount % 10 === 0) {
        await this.createBackup();
      }

      return users[userId];
    } catch (error) {
      console.error("User saqlashda xato:", error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      const users = await this.loadUsers();
      return users[userId] || null;
    } catch (error) {
      console.error("User olishda xato:", error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      const users = await this.loadUsers();
      return Object.values(users).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    } catch (error) {
      console.error("Barcha users olishda xato:", error);
      return [];
    }
  }

  async getUserCount() {
    try {
      const users = await this.loadUsers();
      return Object.keys(users).length;
    } catch (error) {
      console.error("User sonini olishda xato:", error);
      return 0;
    }
  }

  async searchUsers(query) {
    try {
      const users = await this.loadUsers();
      const searchTerm = query.toLowerCase();

      return Object.values(users).filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          user.phone?.includes(searchTerm) ||
          user.address?.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error("User qidirishda xato:", error);
      return [];
    }
  }

  async deleteUser(userId) {
    try {
      const users = await this.loadUsers();
      if (users[userId]) {
        delete users[userId];
        await this.saveUsers(users);
        return true;
      }
      return false;
    } catch (error) {
      console.error("User o'chirishda xato:", error);
      return false;
    }
  }

  async getStats() {
    try {
      const users = await this.loadUsers();
      const today = new Date().toISOString().split("T")[0];
      const byDate = {};

      Object.values(users).forEach((user) => {
        const date = user.createdAt.split("T")[0];
        byDate[date] = (byDate[date] || 0) + 1;
      });

      return {
        total: Object.keys(users).length,
        byDate,
        today: byDate[today] || 0,
      };
    } catch (error) {
      console.error("Statistika olishda xato:", error);
      return { total: 0, byDate: {}, today: 0 };
    }
  }

  async exportToExcel() {
    try {
      const users = await this.getAllUsers();

      if (users.length === 0) {
        throw new Error("Export qilish uchun ma'lumot yo'q");
      }

      // Prepare data for Excel
      const excelData = users.map((user, index) => ({
        "№": index + 1,
        "User ID": user.userId,
        Username: user.username || "-",
        Ism: user.firstName || "-",
        Familiya: user.lastName || "-",
        Telefon: user.phone || "-",
        Manzil: user.address || "-",
        "Ro'yxatdan o'tgan sana": user.registrationDate || "-",
        "Yaratilgan vaqt": user.createdAt
          ? new Date(user.createdAt).toLocaleString("uz-UZ")
          : "-",
        "Yangilangan vaqt": user.updatedAt
          ? new Date(user.updatedAt).toLocaleString("uz-UZ")
          : "-",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, // №
        { wch: 15 }, // User ID
        { wch: 15 }, // Username
        { wch: 20 }, // Ism
        { wch: 20 }, // Familiya
        { wch: 20 }, // Telefon
        { wch: 30 }, // Manzil
        { wch: 20 }, // Ro'yxatdan o'tgan sana
        { wch: 25 }, // Yaratilgan vaqt
        { wch: 25 }, // Yangilangan vaqt
      ];
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Foydalanuvchilar");

      // Write to file
      XLSX.writeFile(workbook, this.excelPath);

      return this.excelPath;
    } catch (error) {
      console.error("Excel export xato:", error);
      throw error;
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(
        this.backupPath,
        `users_backup_${timestamp}.json`
      );

      const users = await this.loadUsers();
      await fs.writeFile(backupFile, JSON.stringify(users, null, 2));

      // Keep only last 5 backups
      const backupFiles = await fs.readdir(this.backupPath);
      const jsonBackups = backupFiles
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse();

      if (jsonBackups.length > 5) {
        for (let i = 5; i < jsonBackups.length; i++) {
          await fs.unlink(path.join(this.backupPath, jsonBackups[i]));
        }
      }

      return backupFile;
    } catch (error) {
      console.error("Backup yaratishda xato:", error);
      return null;
    }
  }

  async getBackupList() {
    try {
      const backupFiles = await fs.readdir(this.backupPath);
      return backupFiles
        .filter((f) => f.endsWith(".json"))
        .map((f) => ({
          filename: f,
          size: fs.statSync(path.join(this.backupPath, f)).size,
          date: f.replace("users_backup_", "").replace(".json", ""),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Backup ro'yxatini olishda xato:", error);
      return [];
    }
  }

  async restoreFromBackup(backupFilename) {
    try {
      const backupPath = path.join(this.backupPath, backupFilename);
      const backupData = await fs.readFile(backupPath, "utf8");
      const users = JSON.parse(backupData);

      // Create current backup before restore
      await this.createBackup();

      // Restore data
      await this.saveUsers(users);

      return true;
    } catch (error) {
      console.error("Backup dan tiklashda xato:", error);
      return false;
    }
  }

  async getSystemInfo() {
    try {
      const users = await this.loadUsers();
      const stats = await this.getStats();
      const backupList = await this.getBackupList();

      return {
        totalUsers: Object.keys(users).length,
        todayRegistrations: stats.today,
        lastBackup: backupList.length > 0 ? backupList[0].date : "Yo'q",
        backupCount: backupList.length,
        dataFileSize: await this.getFileSize(this.dataPath),
        excelFileSize: await this.getFileSize(this.excelPath),
      };
    } catch (error) {
      console.error("System info olishda xato:", error);
      return null;
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return (stats.size / 1024).toFixed(2) + " KB";
    } catch (error) {
      return "0 KB";
    }
  }
}

module.exports = new UserStorage();
