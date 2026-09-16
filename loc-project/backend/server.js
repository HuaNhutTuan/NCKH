require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const chatRoutes = require("./routes/chat");
const multimodalRoutes = require("./routes/multimodal");
const settingsRoutes = require("./routes/settings");

const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// API health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Các route API
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/multimodal", multimodalRoutes);
app.use("/api/settings", settingsRoutes);

// Phục vụ các file tĩnh của Frontend (từ public hoặc ../frontend/dist)
const publicPath = path.join(__dirname, "public");
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(publicPath));
app.use(express.static(frontendDistPath));

// Xử lý lỗi chung cho API
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Đã có lỗi xảy ra trên server." });
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