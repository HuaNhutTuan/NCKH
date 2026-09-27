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

// Tính toán và cập nhật streak đăng nhập
async function updateStreak(conn, userId) {
  const [rows] = await conn.query(
    "SELECT streak_count, last_login_date FROM users WHERE id = ?",
    [userId]
  );
  if (rows.length === 0) return;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const lastLogin = rows[0].last_login_date;
  let streak = rows[0].streak_count || 1;

  if (!lastLogin) {
    // Lần đầu đăng nhập
    streak = 1;
  } else {
    const last = new Date(lastLogin);
    const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      // Đã đăng nhập hôm nay rồi, giữ nguyên streak
      return;
    } else if (diffDays === 1) {
      // Đăng nhập ngày liên tiếp
      streak = streak + 1;
    } else {
      // Bị ngắt quãng, reset
      streak = 1;
    }
  }

  await conn.query(
    "UPDATE users SET streak_count = ?, last_login_date = ? WHERE id = ?",
    [streak, todayStr, userId]
  );
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
    const today = new Date().toISOString().slice(0, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, streak_count, last_login_date) VALUES (?, ?, ?, 1, ?)",
      [cleanName, cleanEmail, passwordHash, today]
    );

    const token = signToken(result.insertId);
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
    const userRole = cleanEmail === adminEmail ? "admin" : "user";
    res.status(201).json({
      token,
      user: { id: result.insertId, name: cleanName, email: cleanEmail, role: userRole, streak_count: 1 },
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

    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role, avatar_url, birthday, streak_count, last_login_date FROM users WHERE LOWER(TRIM(email)) = ? ORDER BY id DESC",
      [cleanEmail]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    }

    let matchedUser = null;
    for (const user of rows) {
      let match = false;
      if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
        match = await bcrypt.compare(password, user.password_hash);
        if (match) {
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

    // Cập nhật streak sau khi đăng nhập thành công
    const conn = await pool.getConnection();
    try {
      await updateStreak(conn, matchedUser.id);
      // Lấy lại streak mới nhất
      const [fresh] = await conn.query(
        "SELECT streak_count, last_login_date, avatar_url, birthday FROM users WHERE id = ?",
        [matchedUser.id]
      );
      if (fresh.length > 0) {
        matchedUser.streak_count = fresh[0].streak_count;
        matchedUser.avatar_url = fresh[0].avatar_url;
        matchedUser.birthday = fresh[0].birthday;
      }
    } finally {
      conn.release();
    }

    const effectiveRole = matchedUser.email === adminEmail || matchedUser.role === "admin" ? "admin" : "user";
    const token = signToken(matchedUser.id);
    res.json({
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: effectiveRole,
        avatar_url: matchedUser.avatar_url || null,
        birthday: matchedUser.birthday || null,
        streak_count: matchedUser.streak_count || 1,
      },
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
    const conn = await pool.getConnection();
    try {
      await updateStreak(conn, req.userId);
    } catch (e) {
      console.error("Lỗi cập nhật streak trong /me:", e.message);
    } finally {
      conn.release();
    }

    const [rows] = await pool.query(
      "SELECT id, name, email, role, avatar_url, birthday, streak_count, created_at FROM users WHERE id = ?",
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

// PUT /api/auth/profile — cập nhật tên, email, ngày sinh, avatar
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, email, birthday, avatar_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Tên hiển thị không được để trống." });
    }

    const cleanName = String(name).trim();
    const updates = [cleanName];
    let sql = "UPDATE users SET name = ?";

    if (email && email.trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: "Email không hợp lệ." });
      }
      // Kiểm tra email trùng (trừ chính mình)
      const [dup] = await pool.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ?",
        [cleanEmail, req.userId]
      );
      if (dup.length > 0) {
        return res.status(409).json({ error: "Email này đã được sử dụng bởi tài khoản khác." });
      }
      sql += ", email = ?";
      updates.push(cleanEmail);
    }

    if (birthday !== undefined) {
      sql += ", birthday = ?";
      updates.push(birthday || null);
    }

    if (avatar_url !== undefined) {
      sql += ", avatar_url = ?";
      updates.push(avatar_url || null);
    }

    sql += " WHERE id = ?";
    updates.push(req.userId);

    await pool.query(sql, updates);

    const [rows] = await pool.query(
      "SELECT id, name, email, role, avatar_url, birthday, streak_count FROM users WHERE id = ?",
      [req.userId]
    );
    const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
    const u = rows[0];
    if (u.email === adminEmail || u.role === "admin") u.role = "admin";

    res.json({ user: u, message: "Đã cập nhật hồ sơ thành công." });
  } catch (err) {
    console.error("Lỗi cập nhật hồ sơ:", err);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật hồ sơ." });
  }
});

// PUT /api/auth/change-password — đổi mật khẩu
router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới cần ít nhất 6 ký tự." });
    }

    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    const user = rows[0];
    let match = false;
    if (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$")) {
      match = await bcrypt.compare(currentPassword, user.password_hash);
    } else {
      match = hashPasswordSHA256(currentPassword) === user.password_hash;
    }

    if (!match) {
      return res.status(401).json({ error: "Mật khẩu hiện tại không đúng." });
    }

    const newHash = hashPasswordSHA256(newPassword);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.userId]);

    res.json({ message: "Đã đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi đổi mật khẩu:", err);
    res.status(500).json({ error: "Có lỗi xảy ra khi đổi mật khẩu." });
  }
});

module.exports = router;
