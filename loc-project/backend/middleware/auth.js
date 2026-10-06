const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "d43631701a15e51eba157051c3d3166c623a93860b2dc6eeb1731f72a7b397a9d32b85994359d0f84bb0ff49842cc088af6113c59fcbf728aff189c8fc8100b9";

// Kiểm tra JWT trong header "Authorization: Bearer <token>"
// Nếu hợp lệ, gắn req.userId để các route sau dùng
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Thiếu token xác thực." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

// Kiểm tra quyền Admin — chỉ dựa vào cột "role" trong DB, không dùng email fallback
async function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    try {
      const [rows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.userId]);
      if (rows.length === 0) {
        return res.status(401).json({ error: "Không tìm thấy người dùng." });
      }
      if (rows[0].role !== "admin") {
        return res.status(403).json({ error: "Bạn không có quyền quản trị viên (Admin)." });
      }
      req.userRole = "admin";
      return next();
    } catch (err) {
      // Chỉ log error code — không log message có thể chứa thông tin schema
      console.error("Lỗi xác thực admin:", err.code || "UNKNOWN_ERROR");
      return res.status(500).json({ error: "Lỗi kiểm tra quyền quản trị." });
    }
  });
}

module.exports = { requireAuth, requireAdmin };

