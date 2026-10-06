require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const chatRoutes = require("./routes/chat");
const multimodalRoutes = require("./routes/multimodal");
const settingsRoutes = require("./routes/settings");
const knowledgeRoutes = require("./routes/knowledge");

const path = require("path");
const fs = require("fs");

const app = express();

// ─── CORS — Không fallback về "*", phải cấu hình CLIENT_ORIGIN rõ ràng ───────
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (curl, mobile app, Postman) trong dev
    if (!origin && process.env.NODE_ENV !== "production") return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' không được phép truy cập.`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Giới hạn brute-force login/register: tối đa 10 lần trong 15 phút mỗi IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  message: { error: "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Chỉ đếm request thất bại
});

// Giới hạn chung cho API: 200 request/phút mỗi IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 200,
  message: { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// API health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Áp dụng rate limit chung cho toàn bộ API
app.use("/api", apiLimiter);

// Áp dụng rate limit nghiêm ngặt cho auth
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Các route API
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/multimodal", multimodalRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/knowledge", knowledgeRoutes);

// Phục vụ các file tĩnh của Frontend (từ public hoặc ../frontend/dist)
const publicPath = path.join(__dirname, "public");
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(publicPath));
app.use(express.static(frontendDistPath));

// Xử lý lỗi chung cho API — KHÔNG trả err.message về client
app.use((err, req, res, next) => {
  // Log đầy đủ phía server để debug
  console.error("Lỗi server:", { code: err.code, status: err.status, path: req.path });
  const status = err.status || err.statusCode || 500;
  // Trả thông báo chung, không lộ stack trace / schema
  res.status(status).json({ error: "Đã có lỗi xảy ra trên server." });
});

// Phục vụ frontend SPA cho mọi route (ngoại trừ các endpoint /api)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint không tồn tại." });
  }

  const publicIndex = path.join(publicPath, "index.html");
  const frontendIndex = path.join(frontendDistPath, "index.html");

  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  } else if (fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  } else {
    return res.send("Server Node.js đang chạy thành công! (Chưa tìm thấy bản build giao diện frontend)");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Tuấn API đang chạy tại http://localhost:${PORT}`);
});