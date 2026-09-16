const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

function hashPasswordSHA256(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: "Email không hợp lệ." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu cần ít nhất 6 ký tự." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = ?",
      [cleanEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập." });
    }

    const passwordHash = hashPasswordSHA256(password);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [cleanName, cleanEmail, passwordHash]
    );

    const token = signToken(result.insertId);
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
    const userRole = cleanEmail === adminEmail ? "admin" : "user";
    res.status(201).json({
      token,
      user: { id: result.insertId, name: cleanName, email: cleanEmail, role: userRole },
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập." });
    }
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ER_ACCESS_DENIED_ERROR" || !process.env.DB_HOST) {
      return res.status(500).json({
        error: "Chưa kết nối cơ sở dữ liệu MySQL trên Render. Vui lòng thêm biến môi trường DB vào Render Dashboard."
      });
    }
    res.status(500).json({ error: "Có lỗi xảy ra khi đăng ký, thử lại sau." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập email và mật khẩu." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";

    // Lấy tất cả các tài khoản có email trùng khớp (đề phòng CSDL cũ có bản ghi trùng lặp)
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE LOWER(TRIM(email)) = ? ORDER BY id DESC",
      [cleanEmail]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    // Kiểm tra mật khẩu qua các bản ghi nếu chẳng may CSDL có nhiều hàng cùng email
    let matchedUser = null;
    for (const user of rows) {
      let match = false;
      if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
        match = await bcrypt.compare(password, user.password_hash);
        if (match) {
          // Tự động nâng cấp tài khoản cũ sang SHA-256
          const newHash = hashPasswordSHA256(password);
          await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id]);
        }
      } else {
        match = hashPasswordSHA256(password) === user.password_hash;
      }

      if (match) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    const effectiveRole = matchedUser.email === adminEmail || matchedUser.role === "admin" ? "admin" : "user";
    const token = signToken(matchedUser.id);
    res.json({
      token,
      user: { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, role: effectiveRole },
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ER_ACCESS_DENIED_ERROR" || !process.env.DB_HOST) {
      return res.status(500).json({
        error: "Chưa kết nối cơ sở dữ liệu MySQL trên Render. Vui lòng thêm biến môi trường DB vào Render Dashboard."
      });
    }
    res.status(500).json({ error: "Có lỗi xảy ra khi đăng nhập, thử lại sau." });
  }
});

// GET /api/auth/me — lấy thông tin người dùng đang đăng nhập
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Không tìm thấy người dùng." });
    const u = rows[0];
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
    if (u.email === adminEmail || u.role === "admin") {
      u.role = "admin";
    } else {
      u.role = u.role || "user";
    }
    res.json({ user: u });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Có lỗi xảy ra." });
  }
});

module.exports = router;
