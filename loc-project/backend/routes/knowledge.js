const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const pool = require("../db");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
  fileFilter: (req, file, cb) => {
    const originalName = (file.originalname || "").toLowerCase();
    if (
      originalName.endsWith(".txt") ||
      originalName.endsWith(".md") ||
      originalName.endsWith(".pdf") ||
      file.mimetype === "text/plain" ||
      file.mimetype === "text/markdown" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file định dạng .txt, .md, hoặc .pdf"));
    }
  },
});

// Tất cả các route quản lý đều yêu cầu quyền Admin
router.use(requireAdmin);

// GET /api/knowledge — Lấy danh sách toàn bộ tri thức
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, type, title, content, file_name, is_active, created_at, updated_at FROM knowledge_base ORDER BY created_at DESC"
    );
    res.json({ knowledge: rows });
  } catch (err) {
    console.error("Lỗi lấy danh sách tri thức:", err);
    res.status(500).json({ error: "Không thể lấy danh sách tri thức." });
  }
});

// POST /api/knowledge — Thêm câu hỏi FAQ hoặc văn bản thủ công
router.post("/", async (req, res) => {
  try {
    const { type = "faq", title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Vui lòng nhập tiêu đề và nội dung." });
    }

    const [result] = await pool.query(
      "INSERT INTO knowledge_base (type, title, content, created_by, is_active) VALUES (?, ?, ?, ?, 1)",
      [type, title.trim(), content.trim(), req.userId]
    );

    res.status(201).json({
      success: true,
      item: {
        id: result.insertId,
        type,
        title: title.trim(),
        content: content.trim(),
        is_active: 1,
      },
    });
  } catch (err) {
    console.error("Lỗi thêm tri thức:", err);
    res.status(500).json({ error: "Không thể thêm tri thức." });
  }
});

// POST /api/knowledge/upload — Tải lên file tài liệu (TXT, MD, PDF)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng chọn file để tải lên." });
    }

    const originalName = req.file.originalname;
    const lowerName = originalName.toLowerCase();
    let extractedText = "";

    if (lowerName.endsWith(".pdf") || req.file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = (pdfData.text || "").trim();
    } else {
      // File .txt hoặc .md
      extractedText = req.file.buffer.toString("utf-8").trim();
    }

    if (!extractedText) {
      return res.status(400).json({ error: "File rỗng hoặc không thể trích xuất văn bản." });
    }

    const title = req.body.title ? req.body.title.trim() : originalName;

    const [result] = await pool.query(
      "INSERT INTO knowledge_base (type, title, content, file_name, created_by, is_active) VALUES ('document', ?, ?, ?, ?, 1)",
      [title, extractedText, originalName, req.userId]
    );

    res.status(201).json({
      success: true,
      item: {
        id: result.insertId,
        type: "document",
        title,
        file_name: originalName,
        content: extractedText,
        is_active: 1,
      },
    });
  } catch (err) {
    console.error("Lỗi tải file tài liệu:", err);
    res.status(500).json({ error: err.message || "Không thể xử lý file tải lên." });
  }
});

// PATCH /api/knowledge/:id/toggle — Bật / Tắt kích hoạt
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, is_active FROM knowledge_base WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu này." });
    }

    const newActive = rows[0].is_active ? 0 : 1;
    await pool.query("UPDATE knowledge_base SET is_active = ? WHERE id = ?", [newActive, id]);

    res.json({ success: true, is_active: newActive });
  } catch (err) {
    console.error("Lỗi bật/tắt tri thức:", err);
    res.status(500).json({ error: "Không thể cập nhật trạng thái." });
  }
});

// DELETE /api/knowledge/:id — Xóa tri thức
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM knowledge_base WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài liệu để xóa." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi xóa tri thức:", err);
    res.status(500).json({ error: "Không thể xóa tài liệu." });
  }
});

module.exports = router;
