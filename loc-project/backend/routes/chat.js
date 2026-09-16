const express = require("express");
const pool = require("../db");
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

    // Lấy cơ sở tri thức hệ thống đã chuẩn bị trước
    let kbPrompt = "";
    try {
      const [kbRows] = await pool.query(
        "SELECT type, title, content FROM knowledge_base WHERE is_active = 1 ORDER BY type ASC, id ASC"
      );
      if (kbRows.length > 0) {
        const faqs = kbRows.filter((k) => k.type === "faq");
        const docs = kbRows.filter((k) => k.type !== "faq");

        kbPrompt += "\n\n=== CƠ SỞ TRI THỨC VÀ TÀI LIỆU CHUẨN BỊ TRƯỚC (ƯU TIÊN HÀNG ĐẦU) ===\n";
        kbPrompt += "Hãy sử dụng các thông tin và kịch bản dưới đây để trả lời câu hỏi của người dùng một cách chính xác, tự nhiên:\n\n";

        if (faqs.length > 0) {
          kbPrompt += "--- BỘ CÂU HỎI & TRẢ LỜI MẪU (FAQ) ---\n";
          faqs.forEach((f, idx) => {
            kbPrompt += `[FAQ ${idx + 1}] ${f.title}\n${f.content}\n\n`;
          });
        }

        if (docs.length > 0) {
          kbPrompt += "--- TÀI LIỆU & SỔ TAY CẨM NANG HỆ THỐNG ---\n";
          docs.forEach((d, idx) => {
            kbPrompt += `[Tài liệu ${idx + 1}: ${d.title}]\n${d.content}\n\n`;
          });
        }
        kbPrompt += "=== HƯỚNG DẪN TRẢ LỜI ===\n";
        kbPrompt += "- Khi câu hỏi của người dùng liên quan đến nội dung trong Cơ sở tri thức ở trên, hãy ƯU TIÊN TUYỆT ĐỐI áp dụng các hướng dẫn, số liệu, quy tắc và câu trả lời đã được chuẩn bị trước đó.\n";
        kbPrompt += "- Nếu người dùng hỏi những câu nằm ngoài tài liệu, hãy kết hợp kiến thức tổng quát và dữ liệu tài chính thực tế của họ để đưa ra lời khuyên hữu ích.\n";
        kbPrompt += "========================================================\n";
      }
    } catch (e) {
      console.warn("Không thể tải knowledge_base cho chat:", e.message);
    }

    const requestBody = { contents };
    const fullSystemPrompt = (systemPrompt || "") + kbPrompt;
    if (fullSystemPrompt.trim()) {
      requestBody.systemInstruction = {
        parts: [{ text: fullSystemPrompt }],
      };
    }

    const candidateModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-3.5-flash"];
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
