const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const isCloud =
  process.env.DB_HOST &&
  process.env.DB_HOST !== "localhost" &&
  process.env.DB_HOST !== "127.0.0.1";

const targetDbName =
  process.env.DB_NAME === "sys" ? "test" : (process.env.DB_NAME || "loc_app");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: targetDbName,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
  timezone: "+07:00",
  dateStrings: true,
  ssl:
    process.env.DB_SSL === "true" || isCloud
      ? {
          rejectUnauthorized: false, // Cho phép kết nối an toàn với Cloud MySQL (Aiven, TiDB, CleverCloud, Render)
          ca: process.env.DB_SSL_CA || undefined,
        }
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
        nature VARCHAR(10) DEFAULT 'need',
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

    // Bổ sung hoặc nâng cấp cột avatar_url lên MEDIUMTEXT (hỗ trợ lưu ảnh đại diện)
    try {
      await conn.query("ALTER TABLE users ADD COLUMN avatar_url MEDIUMTEXT DEFAULT NULL");
    } catch (e) {
      try {
        await conn.query("ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT DEFAULT NULL");
      } catch (err2) { /* Đã là MEDIUMTEXT hoặc bỏ qua */ }
    }

    // Bổ sung cột birthday nếu chưa có
    try {
      await conn.query("ALTER TABLE users ADD COLUMN birthday DATE DEFAULT NULL");
    } catch (e) { /* Đã có cột */ }

    // Bổ sung cột streak_count nếu chưa có
    try {
      await conn.query("ALTER TABLE users ADD COLUMN streak_count INT DEFAULT 1");
    } catch (e) { /* Đã có cột */ }

    // Bổ sung cột last_login_date nếu chưa có
    try {
      await conn.query("ALTER TABLE users ADD COLUMN last_login_date DATE DEFAULT NULL");
    } catch (e) { /* Đã có cột */ }

    // Bổ sung cột nature (need/want) vào bảng transactions cho đề tài NCKH Giáo dục Tài chính
    try {
      await conn.query("ALTER TABLE transactions ADD COLUMN nature VARCHAR(10) DEFAULT 'need'");
    } catch (e) { /* Đã có cột */ }

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
        {
          type: "document",
          title: "Chuyên đề Tín dụng & Phương pháp tính toán lãi suất (SGK KT&PL 10)",
          content: "CHUYÊN ĐỀ TÍN DỤNG VÀ CÁC DỊCH VỤ TÍN DỤNG (SGK GD KT&PL 10 - BÀI 9)\n\n1. 4 HÌNH THỨC TÍN DỤNG CHÍNH:\n- Tín dụng ngân hàng: Cho vay tín chấp, thế chấp, trả góp trên cơ sở lòng tin và hoàn trả gốc + lãi khi đến hạn.\n- Tín dụng thương mại: Doanh nghiệp mua bán chịu, trả chậm hàng hóa với nhau; hoàn trả gốc và lãi bằng tiền tệ.\n- Tín dụng tiêu dùng: Cho cá nhân/hộ gia đình vay mua sắm thiết bị, sinh hoạt (trả góp công ty tài chính, thẻ tín dụng). Lãi suất thường cao.\n- Tín dụng nhà nước: Nhà nước đi vay qua trái phiếu chính phủ (Bộ Tài chính) hoặc cho vay ưu đãi phi lợi nhuận qua Ngân hàng Chính sách xã hội.\n\n2. CÔNG THỨC CHO VAY TRẢ GÓP:\na) Dư nợ gốc ban đầu: Gốc hằng tháng = Tiền vay / Số tháng; Lãi hằng tháng = Tiền vay * Lãi suất tháng; Tiền trả hằng tháng = Gốc + Lãi (cố định).\nb) Dư nợ giảm dần: Gốc hằng tháng = Tiền vay / Số tháng; Lãi tháng k = Dư nợ còn lại * Lãi suất tháng (tiền lãi và tổng tiền giảm dần theo thời gian).\n\n3. THẺ TÍN DỤNG:\nChi tiêu trước, trả tiền sau; miễn lãi 40-45 ngày nếu trả đủ 100%. Nếu chậm trả sẽ bị phạt phí và chịu lãi suất rất cao (20-35%/năm).",
        },
        {
          type: "faq",
          title: "Phân biệt 4 hình thức tín dụng: Ngân hàng, Thương mại, Tiêu dùng và Nhà nước",
          content: "Câu hỏi: Có những hình thức tín dụng phổ biến nào theo SGK Giáo dục Kinh tế và Pháp luật 10 và cách phân biệt?\nTrả lời: Có 4 hình thức chính: Tín dụng ngân hàng (quan hệ vay tiền ngân hàng - khách hàng); Tín dụng thương mại (quan hệ giữa các doanh nghiệp mua bán chịu hàng hóa); Tín dụng tiêu dùng (vay mua sắm sinh hoạt cá nhân qua công ty tài chính hoặc thẻ tín dụng); Tín dụng nhà nước (Nhà nước đi vay qua trái phiếu chính phủ hoặc cho vay ưu đãi qua Ngân hàng Chính sách xã hội).",
        },
        {
          type: "faq",
          title: "Công thức tính cho vay trả góp theo dư nợ gốc ban đầu và dư nợ giảm dần",
          content: "Câu hỏi: Làm thế nào để tính tiền gốc và lãi khi vay mua trả góp (theo dư nợ gốc ban đầu vs dư nợ giảm dần)?\nTrả lời:\n1. Phương pháp Dư nợ gốc ban đầu (Gốc chia đều, lãi cố định): Gốc hằng tháng = Tiền vay gốc / Số tháng vay; Lãi hằng tháng = Tiền vay gốc × Lãi suất tháng; Tiền trả hằng tháng = Gốc + Lãi (cố định).\n2. Phương pháp Dư nợ giảm dần: Gốc hằng tháng = Tiền vay gốc / Số tháng vay; Lãi tháng k = Dư nợ còn lại × Lãi suất tháng; Tiền trả tháng k = Gốc hằng tháng + Lãi tháng k (giảm dần qua các tháng).",
        },
        {
          type: "faq",
          title: "Thẻ tín dụng (Credit Card) và bẫy lãi suất cần lưu ý cho sinh viên",
          content: "Câu hỏi: Thẻ tín dụng hoạt động như thế nào và sinh viên cần lưu ý gì để không bị tính lãi?\nTrả lời:\n- Bản chất: Chi tiêu trước, trả tiền sau trong hạn mức được cấp.\n- Miễn lãi: Thường từ 40-45 ngày.\n- Quy tắc: Trả đủ 100% đúng hạn sẽ không mất lãi (lãi suất 0%). Nếu chậm trả hoặc chỉ trả mức tối thiểu, bạn bị phạt và chịu lãi suất rất cao (20% - 35%/năm) tính dồn từ ngày chi tiêu.",
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
