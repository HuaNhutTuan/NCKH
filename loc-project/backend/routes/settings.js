const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Đảm bảo bảng user_settings luôn tồn tại
let tableInitialized = false;
async function ensureSettingsTable() {
  if (tableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INT PRIMARY KEY,
        payday_day INT DEFAULT 1,
        emergency_reserve DECIMAL(14,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    tableInitialized = true;
  } catch (err) {
    console.error("Lỗi khởi tạo bảng user_settings:", err.message);
  }
}

// GET /api/settings — Lấy cài đặt Safe-to-Spend của sinh viên
router.get("/", async (req, res) => {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.query(
      "SELECT payday_day, emergency_reserve FROM user_settings WHERE user_id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      // Mặc định: ngày 1 hàng tháng, quỹ dự phòng 0đ
      return res.json({
        settings: {
          payday_day: 1,
          emergency_reserve: 0,
        },
      });
    }

    res.json({
      settings: {
        payday_day: Number(rows[0].payday_day) || 1,
        emergency_reserve: Number(rows[0].emergency_reserve) || 0,
      },
    });
  } catch (err) {
    console.error("Lỗi lấy cài đặt:", err);
    res.status(500).json({ error: "Không thể tải cài đặt." });
  }
});

// PUT /api/settings — Cập nhật ngày nhận tiền và quỹ dự phòng
router.put("/", async (req, res) => {
  try {
    await ensureSettingsTable();
    let { payday_day, emergency_reserve } = req.body;

    payday_day = parseInt(payday_day, 10);
    if (isNaN(payday_day) || payday_day < 1 || payday_day > 31) {
      payday_day = 1;
    }

    emergency_reserve = parseFloat(emergency_reserve);
    if (isNaN(emergency_reserve) || emergency_reserve < 0) {
      emergency_reserve = 0;
    }

    await pool.query(
      `INSERT INTO user_settings (user_id, payday_day, emergency_reserve)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payday_day = VALUES(payday_day),
         emergency_reserve = VALUES(emergency_reserve)`,
      [req.userId, payday_day, emergency_reserve]
    );

    res.json({
      settings: {
        payday_day,
        emergency_reserve,
      },
    });
  } catch (err) {
    console.error("Lỗi cập nhật cài đặt:", err);
    res.status(500).json({ error: "Không thể lưu cài đặt." });
  }
});

module.exports = router;
