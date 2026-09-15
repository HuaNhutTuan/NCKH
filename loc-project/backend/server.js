require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const chatRoutes = require("./routes/chat");
const multimodalRoutes = require("./routes/multimodal");
const settingsRoutes = require("./routes/settings");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/multimodal", multimodalRoutes);
app.use("/api/settings", settingsRoutes);

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Đã có lỗi xảy ra trên server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Tuấn API đang chạy tại http://localhost:${PORT}`);
});
