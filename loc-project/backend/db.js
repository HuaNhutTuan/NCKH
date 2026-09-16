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
  timezone: "+07:00",
  dateStrings: true,
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

    // Bổ sung cột role vào bảng users nếu chưa có
    try {
      await conn.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
    } catch (e) {
      // Đã có cột role
    }

    // Bảng cơ sở tri thức dùng chung (Knowledge Base cho Chat Box AI)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('faq', 'document', 'text') NOT NULL,
        title VARCHAR(255) NOT NULL,
        content MEDIUMTEXT NOT NULL,
        file_name VARCHAR(255) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active (is_active)
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

    // Cập nhật quyền Admin cho tài khoản quản trị
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
    await conn.query("UPDATE users SET role = 'admin' WHERE email = ?", [adminEmail]);
    await conn.query(
      "UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM (SELECT MIN(id) as id FROM users) as t) AND (SELECT COUNT(*) FROM (SELECT id FROM users WHERE role = 'admin') as a) = 0"
    );

    // 3. Nạp sẵn dữ liệu tri thức mẫu nếu bảng knowledge_base đang trống
    const [existingKB] = await conn.query("SELECT COUNT(*) as count FROM knowledge_base");
    if (existingKB[0].count === 0) {
      console.log("🔄 Đang nạp các câu hỏi FAQ và cẩm nang tri thức AI mẫu...");
      const sampleKB = [
        {
          type: "faq",
          title: "Quy tắc 50/30/20 cho sinh viên",
          content: "Câu hỏi: Quy tắc quản lý chi tiêu 50/30/20 áp dụng cho sinh viên như thế nào?\nTrả lời: Quy tắc 50/30/20 phân bổ thu nhập (hoặc tiền trợ cấp gia đình) như sau:\n- 50% cho Nhu cầu thiết yếu: Tiền nhà trọ, tiền ăn cơ bản, xăng xe/vé xe buýt, học phí, tiền điện nước internet.\n- 30% cho Mong muốn cá nhân: Cà phê cùng bạn bè, xem phim, mua sắm quần áo, giải trí.\n- 20% cho Tiết kiệm & Quỹ khẩn cấp: Gửi tiết kiệm tích lũy, phòng ngừa lúc ốm đau hoặc sửa chữa xe máy đột xuất.",
        },
        {
          type: "faq",
          title: "Quỹ dự phòng khẩn cấp sinh viên",
          content: "Câu hỏi: Sinh viên nên để dành quỹ khẩn cấp bao nhiêu và để ở đâu?\nTrả lời: Sinh viên nên duy trì quỹ khẩn cấp từ 1.000.000đ đến 3.000.000đ (khoảng 1 tháng chi tiêu cơ bản). Khoản này nên để trong tài khoản ngân hàng riêng hoặc ví sinh lời có thể rút ngay 24/7, tuyệt đối không dùng vào mua sắm giải trí. Mục đích là để không phải vay mượn nóng khi xe hỏng, đau ốm, mất đồ.",
        },
        {
          type: "faq",
          title: "Mẹo tiết kiệm chi phí ăn uống và sinh hoạt",
          content: "Câu hỏi: Làm thế nào để tiết kiệm tiền ăn mà vẫn đảm bảo sức khỏe khi ở trọ?\nTrả lời:\n1. Nấu ăn theo nhóm hoặc nấu một lần cho cả ngày (mang cơm trưa đi học).\n2. Mua thực phẩm ở chợ truyền thống hoặc siêu thị vào khung giờ giảm giá cuối ngày.\n3. Hạn chế đặt đồ ăn qua app giao hàng (tiền ship và phụ phí cộng lại rất lớn).\n4. Dùng bình nước cá nhân lấy nước tại trường học thay vì mua nước đóng chai mỗi ngày (tiết kiệm 300k - 500k/tháng).",
        },
        {
          type: "document",
          title: "Sổ tay tài chính thông minh cho tân sinh viên",
          content: "CẨM NANG TÀI CHÍNH DÀNH CHO SINH VIÊN VIỆT NAM\n\n1. LẬP KẾ HOẠCH ĐẦU THÁNG:\n- Ngay khi nhận tiền từ gia đình hoặc lương làm thêm, hãy trích ngay 10-20% vào quỹ tiết kiệm trước, số còn lại chia đều cho 30 ngày.\n- Dùng tính năng Hạn mức chi tiêu mỗi ngày (Safe-to-Spend) của Tuấn để không bao giờ bị 'cháy túi' vào cuối tháng.\n\n2. CẢNH BÁO BẪY TÀI CHÍNH:\n- Tuyệt đối tránh xa các ứng dụng vay tiền online 'nhanh gọn', 'chỉ cần CCCD' vì lãi suất thực tế có thể lên đến 300-500%/năm.\n- Cảnh giác với các mô hình đầu tư sinh lời cam kết 20-30%/tháng, đa cấp biến tướng hoặc việc làm 'gõ văn bản/like video chuyển tiền'.\n- Nếu dùng thẻ tín dụng sinh viên, hãy luôn thanh toán 100% dư nợ đúng hạn để xây dựng điểm tín dụng tốt.",
        },
      ];

      for (const item of sampleKB) {
        await conn.query(
          "INSERT INTO knowledge_base (type, title, content, is_active) VALUES (?, ?, ?, 1)",
          [item.type, item.title, item.content]
        );
      }
      console.log("✅ Đã nạp thành công bộ tri thức AI ban đầu!");
    }

    conn.release();
  } catch (err) {
    console.error("❌ Lỗi kết nối hoặc khởi tạo MySQL:", err.message);
  }
}

initDB();

module.exports = pool;
