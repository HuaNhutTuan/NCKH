const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// ---------- In-Memory Cache cho Cơ sở tri thức (0ms DB delay) ----------
let cachedKnowledgePrompt = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

async function getActiveKnowledgePrompt() {
  const now = Date.now();
  if (cachedKnowledgePrompt !== null && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedKnowledgePrompt;
  }

  try {
    const [kbRows] = await pool.query(
      "SELECT type, title, content FROM knowledge_base WHERE is_active = 1 ORDER BY type ASC, id ASC"
    );
    if (kbRows.length === 0) {
      cachedKnowledgePrompt = "";
      lastCacheTime = now;
      return "";
    }

    const faqs = kbRows.filter((k) => k.type === "faq");
    const docs = kbRows.filter((k) => k.type !== "faq");

    let prompt = "\n\n=== CƠ SỞ TRI THỨC VÀ TÀI LIỆU CHUẨN BỊ TRƯỚC (ƯU TIÊN HÀNG ĐẦU) ===\n";
    prompt += "Hãy sử dụng các thông tin và kịch bản dưới đây để trả lời câu hỏi của người dùng một cách chính xác, tự nhiên:\n\n";

    if (faqs.length > 0) {
      prompt += "--- BỘ CÂU HỎI & TRẢ LỜI MẪU (FAQ) ---\n";
      faqs.forEach((f, idx) => {
        prompt += `[FAQ ${idx + 1}] ${f.title}\n${f.content}\n\n`;
      });
    }

    if (docs.length > 0) {
      prompt += "--- TÀI LIỆU & SỔ TAY CẨM NANG HỆ THỐNG ---\n";
      docs.forEach((d, idx) => {
        prompt += `[Tài liệu ${idx + 1}: ${d.title}]\n${d.content}\n\n`;
      });
    }

    prompt += "=== HƯỚNG DẪN TRẢ LỜI ===\n";
    prompt += "- Khi câu hỏi của người dùng liên quan đến nội dung trong Cơ sở tri thức ở trên, hãy ƯU TIÊN TUYỆT ĐỐI áp dụng các hướng dẫn, số liệu, quy tắc và câu trả lời đã được chuẩn bị trước đó.\n";
    prompt += "- Trả lời ngắn gọn, thân thiện, súc tích (dưới 150 từ trừ khi người dùng yêu cầu giải thích chi tiết).\n";
    prompt += "========================================================\n";

    cachedKnowledgePrompt = prompt;
    lastCacheTime = now;
    return prompt;
  } catch (e) {
    console.warn("Không thể tải knowledge_base:", e.message);
    return cachedKnowledgePrompt || "";
  }
}

function clearKnowledgeCache() {
  cachedKnowledgePrompt = null;
  lastCacheTime = 0;
}

// Hàm chuẩn bị tin nhắn gửi Gemini (cắt gọn 8 tin nhắn gần nhất để tối ưu tốc độ)
function prepareGeminiContents(messages) {
  const recentMessages = messages.slice(-8);
  const contents = [];
  for (const m of recentMessages) {
    const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
    if (contents.length === 0 && role === "model") continue;
    const text = (m.text || m.content || "").trim();
    if (!text) continue;

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += "\n" + text;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  }
  return contents;
}

// POST /api/chat/stream — Streaming phản hồi theo thời gian thực (SSE)
router.post("/stream", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({
        error: "Chưa cấu hình GEMINI_API_KEY trong file backend/.env.",
      });
    }

    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Danh sách tin nhắn không hợp lệ." });
    }

    const contents = prepareGeminiContents(messages);
    if (contents.length === 0) {
      return res.status(400).json({ error: "Không có nội dung tin nhắn của người dùng." });
    }

    const kbPrompt = await getActiveKnowledgePrompt();
    const fullSystemPrompt = (systemPrompt || "") + kbPrompt;
    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    };

    if (fullSystemPrompt.trim()) {
      requestBody.systemInstruction = {
        parts: [{ text: fullSystemPrompt }],
      };
    }

    // Thiết lập header SSE cho client
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) res.flushHeaders();

    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
    let streamed = false;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          continue;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // giữ lại phần chunk chưa trọn vẹn

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const chunkText = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunkText) {
                  res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                  streamed = true;
                }
              } catch (err) {
                // bỏ qua dòng json không hợp lệ
              }
            }
          }
        }

        if (streamed) {
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
      } catch (err) {
        console.warn(`Lỗi stream model ${model}:`, err.message);
      }
    }

    if (!streamed) {
      res.write(`data: ${JSON.stringify({ error: "Không nhận được phản hồi từ AI." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    console.error("Lỗi stream chat:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Lỗi kết nối streaming." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Lỗi xử lý phản hồi." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
});

// POST /api/chat — Endpoint thường (đã tối ưu tốc độ và dùng cache)
router.post("/", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({
        error: "Chưa cấu hình GEMINI_API_KEY trong file backend/.env.",
      });
    }

    const { messages, systemPrompt } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Danh sách tin nhắn không hợp lệ." });
    }

    const contents = prepareGeminiContents(messages);
    if (contents.length === 0) {
      return res.status(400).json({ error: "Không có nội dung tin nhắn của người dùng." });
    }

    const kbPrompt = await getActiveKnowledgePrompt();
    const fullSystemPrompt = (systemPrompt || "") + kbPrompt;
    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    };

    if (fullSystemPrompt.trim()) {
      requestBody.systemInstruction = {
        parts: [{ text: fullSystemPrompt }],
      };
    }

    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
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
module.exports.clearKnowledgeCache = clearKnowledgeCache;

