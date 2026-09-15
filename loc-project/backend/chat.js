const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

router.post("/", requireAuth, async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Gọi API của Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nNgười dùng: ${message}` }] }],
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình chưa có câu trả lời.";
    
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Không thể kết nối với AI." });
  }
});

module.exports = router;