const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

// Kiểm tra JWT trong header "Authorization: Bearer <token>"
// Nếu hợp lệ, gắn req.userId để các route sau dùng
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Thiếu token xác thực." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

// Kiểm tra quyền Admin
async function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    try {
      const [rows] = await pool.query("SELECT role, email FROM users WHERE id = ?", [req.userId]);
      if (rows.length === 0) {
        return res.status(401).json({ error: "Không tìm thấy người dùng." });
      }
      const user = rows[0];
      const adminEmail = process.env.ADMIN_EMAIL || "tuannhut419@gmail.com";
      if (user.role === "admin" || user.email === adminEmail) {
        req.userRole = "admin";
        return next();
      }
      return res.status(403).json({ error: "Bạn không có quyền quản trị viên (Admin)." });
    } catch (err) {
      console.error("Lỗi xác thực admin:", err);
      return res.status(500).json({ error: "Lỗi kiểm tra quyền quản trị." });
    }
  });
}

module.exports = { requireAuth, requireAdmin };

