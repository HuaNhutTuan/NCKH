const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Multer: lưu ảnh vào bộ nhớ (memory) thay vì disk để dễ gửi sang Gemini
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // tối đa 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, HEIC)."));
  },
});

// ─── Prompt dùng chung ────────────────────────────────────────────────────────
const TODAY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

const PARSE_SYSTEM_PROMPT = `Bạn là trợ lý tài chính thông minh cho sinh viên Việt Nam.
Nhiệm vụ: Phân tích đầu vào (văn bản hoặc hình ảnh hóa đơn/chuyển khoản) và trả về JSON hợp lệ theo schema sau.
Hôm nay là ${TODAY()}.

SCHEMA (trả về JSON thuần, KHÔNG bọc trong markdown code block):
{
  "transactions": [
    {
      "type": "expense" | "income",
      "category": "food" | "transport" | "study" | "entertainment" | "housing" | "shopping" | "health" | "other" | "scholarship" | "allowance" | "parttime" | "other_income",
      "amount": <số tiền VND dạng số nguyên, không có dấu chấm/phẩy>,
      "note": "<mô tả ngắn gọn tiếng Việt>",
      "date": "<YYYY-MM-DD, mặc định hôm nay nếu không rõ>"
    }
  ],
  "groupExpense": {
    "detected": true | false,
    "totalAmount": <tổng số tiền>,
    "suggestedPeople": <số người đề xuất, 0 nếu không rõ>,
    "reason": "<lý do phát hiện là chi tiêu nhóm, ví dụ: 'Hóa đơn ăn uống nhóm', 'Tiền phòng trọ chung'>"
  },
  "confidence": "high" | "medium" | "low",
  "rawSummary": "<tóm tắt ngắn bằng tiếng Việt những gì bạn tìm thấy>"
}

QUY TẮC:
- Số tiền VND: nếu thấy "k" hoặc "K" → nhân 1000; "tr" hoặc "triệu" → nhân 1.000.000; "đ" → giữ nguyên.
- Phát hiện chi tiêu nhóm khi: thấy từ "cùng N người", "chia", "mấy đứa", "tiền phòng trọ", số người được đề cập rõ ràng.
- Nếu phát hiện nhiều giao dịch riêng biệt trong một hóa đơn, tách thành nhiều phần tử trong mảng "transactions".
- Nếu là ảnh chuyển khoản: loại thường là "expense" (người gửi) hoặc "income" (người nhận) — suy ra từ ngữ cảnh.
- Nếu không tìm thấy thông tin tài chính rõ ràng: trả về mảng transactions rỗng và confidence = "low".
- Luôn trả về JSON hợp lệ, không thêm giải thích hay markdown.`;

// ─── Helper: gọi Gemini API ───────────────────────────────────────────────────
async function callGemini(apiKey, contents) {
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: PARSE_SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.1, // thấp để kết quả nhất quán
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { text: data.candidates[0].content.parts[0].text, model };
      }
      lastError = data.error?.message || `Model ${model} không phản hồi.`;
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(lastError || "Không thể kết nối tới Gemini API.");
}

// ─── Helper: parse và validate JSON từ Gemini ────────────────────────────────
function parseGeminiJson(text) {
  // Bóc markdown code block nếu Gemini vẫn bọc dù đã yêu cầu JSON thuần
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const parsed = JSON.parse(cleaned);

  // Validate và làm sạch dữ liệu
  const validCategories = [
    "food", "transport", "study", "entertainment", "housing",
    "shopping", "health", "other", "scholarship", "allowance",
    "parttime", "other_income",
  ];
  const validTypes = ["income", "expense"];

  const transactions = (parsed.transactions || []).map((t) => ({
    type: validTypes.includes(t.type) ? t.type : "expense",
    category: validCategories.includes(t.category) ? t.category : "other",
    amount: Math.abs(Math.round(Number(t.amount) || 0)),
    note: String(t.note || "").slice(0, 200),
    date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : TODAY(),
  })).filter((t) => t.amount > 0);

  const groupExpense = parsed.groupExpense || { detected: false, totalAmount: 0, suggestedPeople: 0, reason: "" };

  return {
    transactions,
    groupExpense,
    confidence: parsed.confidence || "medium",
    rawSummary: String(parsed.rawSummary || ""),
  };
}

// ─── Fast Vietnamese regex parser cho các câu lệnh thông dụng ─────────────────
function tryFastParseVietnamese(rawText) {
  const text = rawText.trim().toLowerCase();

  // Bỏ qua nếu có dấu hiệu nhóm phức tạp để Gemini xử lý
  if (/(cùng|chia|mấy đứa|mỗi người)/i.test(text)) {
    return null;
  }

  let amount = 0;

  // Xử lý dạng: 1tr5, 1tr500, 2tr8
  const trCombinedMatch = text.match(/(\d+)\s*(?:tr|triệu)\s*(\d+)\s*(?:k|nghìn|ngàn)?/i);
  if (trCombinedMatch) {
    const main = parseInt(trCombinedMatch[1], 10) * 1000000;
    let sub = parseInt(trCombinedMatch[2], 10);
    if (sub < 10) sub = sub * 100000;
    else if (sub < 100) sub = sub * 10000;
    else if (sub < 1000) sub = sub * 1000;
    amount = main + sub;
  } else {
    // Xử lý dạng: 1.5tr, 2 triệu
    const trMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)/i);
    if (trMatch) {
      amount = Math.round(parseFloat(trMatch[1].replace(",", ".")) * 1000000);
    } else {
      // Xử lý dạng: 50k, 50 k, 50 nghìn, 50 ngàn
      const kMatch = text.match(/(\d+)\s*(?:k|nghìn|ngàn)\b/i);
      if (kMatch) {
        amount = parseInt(kMatch[1], 10) * 1000;
      } else {
        // Xử lý dạng số thường: 50000, 50.000đ
        const numMatch = text.match(/(\d[\d.,]*)\s*(?:đ|vnd|dong|đồng)?/i);
        if (numMatch) {
          const cleanNum = numMatch[1].replace(/[.,]/g, "");
          const val = parseInt(cleanNum, 10);
          if (val >= 1000) amount = val;
          else if (val > 0 && val < 1000 && (text.includes("k") || text.includes("nghìn"))) amount = val * 1000;
        }
      }
    }
  }

  if (!amount || amount <= 0) return null;

  // Xác định Loại & Danh mục
  let type = "expense";
  let category = "food";
  let note = rawText.trim();

  // Nhận diện Thu nhập
  if (/(lương|thưởng|nhận|thu|trợ cấp|học bổng|ba mẹ cho|bố mẹ cho|gia đình gửi|chuyển khoản nhận)/i.test(text)) {
    type = "income";
    if (/(học bổng)/i.test(text)) category = "scholarship";
    else if (/(trợ cấp|ba mẹ|bố mẹ|gia đình)/i.test(text)) category = "allowance";
    else if (/(lương|làm thêm|parttime|part-time|tiền công)/i.test(text)) category = "parttime";
    else category = "other_income";
  } else {
    // Nhận diện Chi tiêu
    if (/(ăn|uống|cơm|bún|phở|bánh|sáng|trưa|tối|cafe|cà phê|trà sữa|lẩu|nướng|nước|bánh mì)/i.test(text)) {
      category = "food";
    } else if (/(xăng|xe|grab|be|gojek|gửi xe|vé xe|bus|xe buýt|bắt xe)/i.test(text)) {
      category = "transport";
    } else if (/(sách|vở|học|học phí|tài liệu|in ấn|photo|bút)/i.test(text)) {
      category = "study";
    } else if (/(phim|game|chơi|du lịch|hát|karaoke|vé xem|billiards|net)/i.test(text)) {
      category = "entertainment";
    } else if (/(phòng|trọ|nhà|tiền phòng|tiền nhà|điện|nước|mạng|wifi)/i.test(text)) {
      category = "housing";
    } else if (/(áo|quần|giày|dép|mua sắm|shopee|lazada|tiki|mỹ phẩm)/i.test(text)) {
      category = "shopping";
    } else if (/(thuốc|khám|bệnh|viện|bác sĩ|nha khoa)/i.test(text)) {
      category = "health";
    } else {
      category = "other";
    }
  }

  // Viết hoa chữ cái đầu cho ghi chú
  note = note.charAt(0).toUpperCase() + note.slice(1);

  return {
    transactions: [
      {
        type,
        category,
        amount,
        note,
        date: TODAY(),
      },
    ],
    groupExpense: {
      detected: false,
      totalAmount: 0,
      suggestedPeople: 0,
      reason: "",
    },
    confidence: "high",
    rawSummary: `${type === "income" ? "Khoản thu" : "Khoản chi"}: ${note} (${amount.toLocaleString("vi-VN")} đ)`,
  };
}

// ─── POST /api/multimodal/text ────────────────────────────────────────────────
router.post("/text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Vui lòng cung cấp câu lệnh văn bản." });
    }

    // Thử phân tích nhanh với các câu lệnh tiếng Việt chuẩn (phản hồi tức thì)
    const fastResult = tryFastParseVietnamese(text);
    if (fastResult) {
      return res.json(fastResult);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: `Phân tích câu lệnh tài chính sau: "${text.trim()}"` }],
      },
    ];

    const { text: geminiText } = await callGemini(apiKey, contents);
    const result = parseGeminiJson(geminiText);

    res.json(result);
  } catch (err) {
    console.error("Lỗi multimodal/text:", err.message);
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: "AI trả về dữ liệu không hợp lệ, vui lòng thử lại." });
    }
    res.status(500).json({ error: err.message || "Có lỗi xảy ra khi phân tích văn bản." });
  }
});

// ─── POST /api/multimodal/image ───────────────────────────────────────────────
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return res.status(400).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng upload file ảnh (JPEG, PNG, WebP)." });
    }

    // Chuyển buffer sang base64
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: "Đây là ảnh hóa đơn hoặc ảnh chuyển khoản. Hãy phân tích và trích xuất thông tin tài chính.",
          },
        ],
      },
    ];

    const { text: geminiText } = await callGemini(apiKey, contents);
    const result = parseGeminiJson(geminiText);

    res.json(result);
  } catch (err) {
    console.error("Lỗi multimodal/image:", err.message);
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: "AI không đọc được hình ảnh này, vui lòng thử ảnh khác hoặc nhập thủ công." });
    }
    if (err.message.includes("Chỉ chấp nhận")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "Có lỗi xảy ra khi phân tích hình ảnh." });
  }
});

module.exports = router;
