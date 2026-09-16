const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const isCloud =
  process.env.DB_HOST &&
  process.env.DB_HOST !== "localhost" &&
  process.env.DB_HOST !== "127.0.0.1";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "loc_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl:
    process.env.DB_SSL === "true" || isCloud
      ? { rejectUnauthorized: false }
      : undefined,
});

// Tự động kiểm tra kết nối, tạo bảng và nạp dữ liệu ban đầu
async function initDB() {
  if (!process.env.DB_HOST && !process.env.DB_NAME) {
    console.warn(
      "⚠️ CẢNH BÁO: Chưa cấu hình biến môi trường DB trên Render (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)."
    );
    return;
  }
  try {
    const conn = await pool.getConnection();
    console.log("✅ Đã kết nối cơ sở dữ liệu MySQL thành công!");

    // 1. Tạo các bảng nếu chưa có
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('income','expense') NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        note VARCHAR(255) DEFAULT '',
        tx_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, tx_date)
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        monthly_limit DECIMAL(14,2) NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_user_category (user_id, category)
      ) ENGINE=InnoDB;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INT PRIMARY KEY,
        payday_day INT DEFAULT 1,
        emergency_reserve DECIMAL(14,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // 2. Khôi phục dữ liệu ban đầu nếu bảng users đang trống
    const [existingUsers] = await conn.query("SELECT COUNT(*) as count FROM users");
    if (existingUsers[0].count === 0) {
      const backupFile = path.join(__dirname, "data_backup.sql");
      if (fs.existsSync(backupFile)) {
        console.log("🔄 Đang nạp dữ liệu ban đầu từ data_backup.sql...");
        const sqlContent = fs.readFileSync(backupFile, "utf8");
        const statements = sqlContent
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const stmt of statements) {
          try {
            await conn.query(stmt);
          } catch (e) {
            // Bỏ qua lỗi trùng
          }
        }
        console.log("✅ Đã khôi phục dữ liệu người dùng và giao dịch thành công!");
      }
    }

    conn.release();
  } catch (err) {
    console.error("❌ Lỗi kết nối hoặc khởi tạo MySQL:", err.message);
  }
}

initDB();

module.exports = pool;
