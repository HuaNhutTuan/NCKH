const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({
        error:
          "Chưa cấu hình GEMINI_API_KEY trong file backend/.env. Vui lòng lấy API key từ Google AI Studio (https://aistudio.google.com/) và điền vào file .env.",
      });
    }

    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Danh sách tin nhắn không hợp lệ." });
    }

    // Chuyển đổi định dạng tin nhắn sang chuẩn của Google Gemini API
    const contents = [];
    for (const m of messages) {
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      // Gemini yêu cầu tin nhắn đầu tiên phải là role 'user'
      if (contents.length === 0 && role === "model") {
        continue;
      }
      const text = (m.text || m.content || "").trim();
      if (!text) continue;

      // Gộp các tin nhắn liên tiếp cùng role để tránh lỗi từ Gemini API
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += "\n" + text;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "Không có nội dung tin nhắn của người dùng." });
    }

    const requestBody = { contents };
    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let reply = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
          break;
        } else {
          lastError = data.error?.message || `Lỗi khi gọi model ${model}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!reply) {
      return res.status(500).json({
        error: lastError || "Không nhận được phản hồi từ Google Gemini.",
      });
    }

    res.json({ reply });
  } catch (err) {
    console.error("Lỗi chat controller:", err);
    res.status(500).json({ error: "Có lỗi xảy ra khi xử lý phản hồi từ AI." });
  }
});

module.exports = router;
