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

QUY TẮC BẮT BUỘC VỀ THU NHẬP (income) VÀ CHI TIÊU (expense):
1. THU NHẬP (income) - Mọi trường hợp tiền vào ví/tài khoản người dùng:
   - Người khác cho/tặng/chuyển: "cho tôi", "cho mình", "cho em", "[chủ ngữ] cho [tiền]" (mẹ cho 500k, bạn cho 50k, anh trai cho 200k...), "được cho", "được biếu", "được tặng", "lì xì", "mừng tuổi".
   - Tài khoản nhận tiền: "được cộng [tiền]", "được chuyển", "tài khoản được cộng", "nhận được", "ting ting", "được nạp", "tiền nhà gửi lên", "bố mẹ gửi tiền".
   - May mắn / bất ngờ: "nhặt được", "lượm được", "trúng số", "trúng thưởng", "nhặt được tiền".
   - Bán đồ / nhận lại tiền: "bán được", "thanh lý được", "người khác trả nợ", "bạn trả nợ", "hoàn tiền", "cashback", "thu về".
   - Thu nhập từ lao động / học tập: lương, thưởng, làm thêm, tiền tip, hoa hồng, dạy kèm, chạy xe grab kiếm được, học bổng.
   - Danh mục tương ứng:
     + "scholarship": học bổng, tiền thưởng thành tích học tập.
     + "allowance": tiền chu cấp từ gia đình, bố mẹ, người thân.
     + "parttime": lương, làm thêm, thù lao, tiền tip, chạy grab/be, gia sư.
     + "other_income": các khoản thu khác (nhặt được, được cộng, bạn cho, được cho tiền, lì xì, trúng thưởng, trả nợ, thanh lý đồ cũ...).

2. CHI TIÊU (expense) - Mọi trường hợp tiền ra khỏi ví:
   - Mua đồ, ăn uống, đi lại, giải trí, đóng tiền học, nộp tiền trọ, đóng tiền điện nước, mua sắm.
   - Người dùng cho người khác tiền hoặc cho mượn: "tôi cho bạn", "mình cho em", "cho nó mượn", "cho vay".
   - Bị rơi mất tiền, bị phạt: "bị rơi tiền", "bị phạt giao thông".

3. QUY TẮC CHUNG KHÁC:
   - Số tiền VND: "k" hoặc "K" → nhân 1000; "tr" hoặc "triệu" → nhân 1.000.000; "đ" → giữ nguyên.
   - Phát hiện chi tiêu nhóm khi: thấy từ "cùng N người", "chia", "mấy đứa", "tiền phòng trọ", số người được đề cập rõ ràng.
   - Nếu không tìm thấy thông tin tài chính rõ ràng: trả về mảng transactions rỗng và confidence = "low".
   - Luôn trả về JSON hợp lệ, không thêm bất kỳ văn bản giải thích nào ngoài JSON.`;

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
          else if (val > 0 && val < 1000 && (text.includes("k") || text.includes("nghìn") || text.includes("ngàn"))) amount = val * 1000;
        }
      }
    }
  }

  if (!amount || amount <= 0) return null;

  // Xác định Loại & Danh mục
  let type = "expense";
  let category = "food";
  let note = rawText.trim();

  // Kiểm tra nếu người dùng cho người khác tiền / cho mượn (đây là CHI TIÊU)
  const isOutgoingGiving = /(?:tôi|tao|mình|em)\s+cho\s+(?:bạn|mượn|vay|nó|em|anh|chị|ai|người)/i.test(text) ||
                           /(?:cho\s+(?:bạn|nó|người khác)\s+mượn|cho\s+vay|cho\s+mượn)/i.test(text);

  // Kiểm tra dấu hiệu THU NHẬP (Income)
  const isIncomeReceiving =
    // Được cộng / chuyển / nhận / nạp
    /(?:được\s+(?:cộng|chuyển|cho|tặng|biếu|lì\s*xì|thưởng|trả|gửi|hoàn|thối|bắn|nạp|chu\s*cấp))/i.test(text) ||
    // Nhặt được / lượm được / trúng số
    /(?:nhặt|lượm|lụm)\s+được/i.test(text) ||
    /trúng\s*(?:số|thưởng|giải|vé\s*số|minigame|độc\s*đắc)/i.test(text) ||
    // Ai đó cho tôi / cho mình / cho em
    /(?:cho\s+(?:tôi|tao|mình|em|anh|chị|con|cháu))/i.test(text) ||
    // Bố mẹ / anh chị / gia đình cho tiền
    /(?:ba|bố|mẹ|má|ông|bà|anh|chị|gia đình|bạn|người yêu)\s+cho\b/i.test(text) ||
    // Lương / làm thêm / trợ cấp / học bổng
    /(?:lương|thưởng|trợ\s*cấp|học\s*bổng|tiền\s*công|thù\s*lao|hoa\s*hồng|tiền\s*tip)/i.test(text) ||
    // Gia đình gửi tiền lên
    /(?:gia\s*đình|ba\s*mẹ|bố\s*mẹ|tiền\s*quê|tiền\s*nhà)\s*gửi/i.test(text) ||
    // Thu về / bán được / thanh lý / bạn trả nợ / hoàn tiền
    /(?:bán\s*(?:được|sách|đồ|quần|áo|xe|ve\s*chai)|thanh\s*lý|thu\s*(?:về|được)|trả\s*nợ\s*(?:cho\s*(?:tôi|mình|em))?|bạn\s+trả\s*nợ|hoàn\s*tiền|cashback)/i.test(text) ||
    // Nhận được tiền / chuyển khoản nhận
    /(?:nhận\s*(?:được|tiền|lương|thưởng)|chuyển\s*khoản\s*nhận|ting\s*ting)/i.test(text) ||
    // Kiếm được tiền từ grab, việc làm
    /(?:kiếm\s*được|chạy\s*(?:grab|be|ship)\s*được)/i.test(text);

  if (!isOutgoingGiving && isIncomeReceiving) {
    type = "income";
    if (/(học\s*bổng|thành\s*tích\s*học)/i.test(text)) {
      category = "scholarship";
    } else if (/(trợ\s*cấp|ba\s*mẹ|bố\s*mẹ|gia\s*đình|tiền\s*nhà|tiền\s*quê|\bmẹ\b|\bba\b|\bbố\b|\bmá\b|ông\s*bà|chu\s*cấp)/i.test(text)) {
      category = "allowance";
    } else if (/(lương|làm\s*thêm|parttime|part-time|tiền\s*công|thù\s*lao|hoa\s*hồng|tiền\s*tip|chạy\s*(?:grab|be|ship)|gia\s*sư|dạy)/i.test(text)) {
      category = "parttime";
    } else {
      // Bạn cho, nhặt được, được cộng, được cho, lì xì, trúng thưởng, trả nợ, thanh lý...
      category = "other_income";
    }
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
