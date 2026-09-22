const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth); // mọi route bên dưới đều yêu cầu đăng nhập

// GET /api/transactions — danh sách giao dịch của người dùng hiện tại
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, type, category, amount, note, DATE_FORMAT(tx_date, '%Y-%m-%d') AS date FROM transactions WHERE user_id = ? ORDER BY tx_date DESC, id DESC",
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

    // Chuẩn hóa ngày theo múi giờ Việt Nam (YYYY-MM-DD)
    let txDate = date;
    if (!txDate) {
      txDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    } else if (typeof txDate === "string" && txDate.includes("T")) {
      const d = new Date(txDate);
      if (!isNaN(d.getTime())) {
        txDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
      }
    }

    if (!category || !amount || Number(amount) <= 0 || !txDate) {
      return res.status(400).json({ error: "Vui lòng nhập đủ danh mục, số tiền hợp lệ và ngày." });
    }

    const [result] = await pool.query(
      "INSERT INTO transactions (user_id, type, category, amount, note, tx_date) VALUES (?, ?, ?, ?, ?, ?)",
      [req.userId, type, category, amount, note || "", txDate]
    );

    res.status(201).json({
      transaction: { id: result.insertId, type, category, amount: Number(amount), note: note || "", date: txDate },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể lưu giao dịch." });
  }
});

// PUT /api/transactions/:id — cập nhật giao dịch
router.put("/:id", async (req, res) => {
  try {
    const { type, category, amount, note, date } = req.body;

    if (type && !["income", "expense"].includes(type)) {
      return res.status(400).json({ error: "Loại giao dịch không hợp lệ." });
    }

    let txDate = date;
    if (txDate && typeof txDate === "string" && txDate.includes("T")) {
      const d = new Date(txDate);
      if (!isNaN(d.getTime())) {
        txDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
      }
    }

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ error: "Số tiền giao dịch phải lớn hơn 0." });
    }

    // Kiểm tra giao dịch có thuộc về user không
    const [existing] = await pool.query(
      "SELECT id, type, category, amount, note, DATE_FORMAT(tx_date, '%Y-%m-%d') AS date FROM transactions WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch hoặc không có quyền sửa." });
    }

    const current = existing[0];
    const updatedType = type || current.type;
    const updatedCategory = category || current.category;
    const updatedAmount = amount !== undefined ? Number(amount) : Number(current.amount);
    const updatedNote = note !== undefined ? note : current.note;
    const updatedDate = txDate || current.date;

    await pool.query(
      "UPDATE transactions SET type = ?, category = ?, amount = ?, note = ?, tx_date = ? WHERE id = ? AND user_id = ?",
      [updatedType, updatedCategory, updatedAmount, updatedNote, updatedDate, req.params.id, req.userId]
    );

    res.json({
      transaction: {
        id: Number(req.params.id),
        type: updatedType,
        category: updatedCategory,
        amount: updatedAmount,
        note: updatedNote,
        date: updatedDate,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Không thể cập nhật giao dịch." });
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
