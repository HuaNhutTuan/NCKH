const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth); // mọi route bên dưới đều yêu cầu đăng nhập

// GET /api/transactions — danh sách giao dịch của người dùng hiện tại
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, type, category, amount, note, tx_date AS date FROM transactions WHERE user_id = ? ORDER BY tx_date DESC, id DESC",
      [req.userId]
    );
    res.json({ transactions: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể tải danh sách giao dịch." });
  }
});

// POST /api/transactions — thêm giao dịch mới
router.post("/", async (req, res) => {
  try {
    const { type, category, amount, note, date } = req.body;

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Loại giao dịch không hợp lệ." });
    }
    if (!category || !amount || Number(amount) <= 0 || !date) {
      return res.status(400).json({ error: "Vui lòng nhập đủ danh mục, số tiền hợp lệ và ngày." });
    }

    const [result] = await pool.query(
      "INSERT INTO transactions (user_id, type, category, amount, note, tx_date) VALUES (?, ?, ?, ?, ?, ?)",
      [req.userId, type, category, amount, note || "", date]
    );

    res.status(201).json({
      transaction: { id: result.insertId, type, category, amount: Number(amount), note: note || "", date },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu giao dịch." });
  }
});

// DELETE /api/transactions/:id — xoá giao dịch (chỉ của chính người dùng)
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM transactions WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể xoá giao dịch." });
  }
});

module.exports = router;
