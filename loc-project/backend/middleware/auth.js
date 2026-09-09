const jwt = require("jsonwebtoken");
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

module.exports = { requireAuth };
