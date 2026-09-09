const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/budgets — { food: 1200000, transport: 300000, ... }
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT category, monthly_limit FROM budgets WHERE user_id = ?",
      [req.userId]
    );
    const budgets = {};
    rows.forEach((r) => (budgets[r.category] = Number(r.monthly_limit)));
    res.json({ budgets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể tải ngân sách." });
  }
});

// PUT /api/budgets — body: { category: "food", limit: 1200000 }
// Tạo mới nếu chưa có, cập nhật nếu đã tồn tại (upsert)
router.put("/", async (req, res) => {
  try {
    const { category, limit } = req.body;
    if (!category || limit === undefined || Number(limit) < 0) {
      return res.status(400).json({ error: "Vui lòng nhập danh mục và hạn mức hợp lệ." });
    }

    await pool.query(
      `INSERT INTO budgets (user_id, category, monthly_limit)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
      [req.userId, category, limit]
    );

    res.json({ category, limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu ngân sách." });
  }
});

module.exports = router;
