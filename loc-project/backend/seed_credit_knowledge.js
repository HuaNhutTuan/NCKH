const fs = require("fs");
const path = require("path");
require("dotenv").config();
const pool = require("./db");

async function insertCreditKnowledge() {
  try {
    const mdPath = path.join(__dirname, "data", "chuyen_de_tin_dung_sgk10.md");
    const content = fs.readFileSync(mdPath, "utf8");

    // 1. Thêm hoặc cập nhật Document chuyên đề
    const docTitle = "Chuyên đề Tín dụng & Phương pháp tính toán lãi suất (SGK KT&PL 10)";
    const [existingDocs] = await pool.query(
      "SELECT id FROM knowledge_base WHERE title = ?",
      [docTitle]
    );

    if (existingDocs.length > 0) {
      await pool.query(
        "UPDATE knowledge_base SET content = ?, file_name = ?, is_active = 1 WHERE id = ?",
        [content, "chuyen_de_tin_dung_sgk10.md", existingDocs[0].id]
      );
      console.log(`✅ Đã cập nhật tài liệu: "${docTitle}" (ID: ${existingDocs[0].id})`);
    } else {
      const [res] = await pool.query(
        "INSERT INTO knowledge_base (type, title, content, file_name, is_active) VALUES (?, ?, ?, ?, 1)",
        ["document", docTitle, content, "chuyen_de_tin_dung_sgk10.md"]
      );
      console.log(`✅ Đã thêm mới tài liệu: "${docTitle}" (ID: ${res.insertId})`);
    }

    // 2. Thêm các FAQ trọng tâm đi kèm
    const faqs = [
      {
        title: "Phân biệt 4 hình thức tín dụng: Ngân hàng, Thương mại, Tiêu dùng và Nhà nước",
        content: `Câu hỏi: Có những hình thức tín dụng phổ biến nào theo SGK Giáo dục Kinh tế và Pháp luật 10 và cách phân biệt?
Trả lời:
Có 4 hình thức tín dụng chính trong nền kinh tế:
1. Tín dụng ngân hàng: Quan hệ vay mượn tiền tệ giữa ngân hàng và khách hàng dựa trên lòng tin, có thời hạn và phải hoàn trả cả gốc lẫn lãi vô điều kiện khi đến hạn (cho vay tín chấp, vay thế chấp, vay trả góp).
2. Tín dụng thương mại: Quan hệ tín dụng giữa các doanh nghiệp dưới hình thức mua bán chịu, mua bán trả chậm hoặc trả góp hàng hóa. Đối tượng cho vay ban đầu là hàng hóa; khi đến hạn, bên mua phải thanh toán cả vốn gốc và lãi bằng tiền tệ.
3. Tín dụng tiêu dùng: Cho cá nhân, hộ gia đình (người tiêu dùng) vay nhằm đáp ứng nhu cầu chi tiêu sinh hoạt (cho vay trả góp qua công ty tài chính, quẹt thẻ tín dụng). Nguồn trả nợ là thu nhập người vay; số tiền vay nhỏ, thủ tục nhanh gọn nhưng lãi suất thường cao.
4. Tín dụng nhà nước: Quan hệ vay/trả giữa Nhà nước với các chủ thể kinh tế nhằm bù đắp ngân sách hoặc đầu tư phát triển đất nước. Gồm hình thức Nhà nước đi vay (phát hành trái phiếu chính phủ do Bộ Tài chính đại diện phát hành) và hình thức Nhà nước cho vay ưu đãi, phi lợi nhuận (qua Ngân hàng Chính sách xã hội cho học sinh sinh viên khó khăn, hộ nghèo).`,
      },
      {
        title: "Công thức tính cho vay trả góp theo dư nợ gốc ban đầu và dư nợ giảm dần",
        content: `Câu hỏi: Làm thế nào để tính tiền gốc và lãi khi vay mua trả góp (theo dư nợ gốc ban đầu vs dư nợ giảm dần)?
Trả lời:
1. Phương pháp Dư nợ gốc ban đầu (Gốc chia đều, lãi cố định):
- Tiền gốc hằng tháng = Số tiền vay gốc / Số tháng vay
- Tiền lãi hằng tháng = Số tiền vay gốc × Lãi suất tháng (với Lãi suất tháng = Lãi suất năm / 12)
- Số tiền phải trả hằng tháng = Tiền gốc + Tiền lãi (cố định bằng nhau mỗi tháng)
- Tổng tiền phải trả cả khoản vay = Số tiền vay gốc + (Tiền lãi hằng tháng × Số tháng vay)

2. Phương pháp Dư nợ giảm dần:
- Tiền gốc hằng tháng = Số tiền vay gốc / Số tháng vay
- Tiền lãi tháng thứ k = Dư nợ còn lại đầu tháng k × Lãi suất tháng
- Dư nợ còn lại đầu tháng k = Số tiền vay gốc - Tổng tiền gốc đã trả các tháng trước
- Số tiền trả tháng thứ k = Tiền gốc hằng tháng + Tiền lãi tháng thứ k
(Tiền lãi và tổng tiền trả giảm dần qua từng tháng, tổng lãi thực tế phải trả thấp hơn so với phương pháp dư nợ gốc ban đầu).`,
      },
      {
        title: "Thẻ tín dụng (Credit Card) và bẫy lãi suất cần lưu ý cho sinh viên",
        content: `Câu hỏi: Thẻ tín dụng hoạt động như thế nào và sinh viên cần lưu ý gì để không bị tính lãi?
Trả lời:
- Bản chất: Hoạt động theo cơ chế "Chi tiêu trước, trả tiền sau". Ngân hàng cấp một hạn mức tín dụng dựa vào năng lực tài chính và lịch sử tín dụng của khách hàng.
- Thời hạn miễn lãi (quyết toán): Thường từ 40 đến 45 ngày.
- Quy tắc vàng: Nếu người dùng hoàn trả đầy đủ 100% dư nợ đã chi tiêu trước ngày đến hạn quyết toán, sẽ KHÔNG BỊ TÍNH LÃI (lãi suất 0%).
- Cảnh báo bẫy lãi suất: Nếu thanh toán chậm hoặc chỉ trả số tiền tối thiểu (5-10%), người vay sẽ bị phạt phí trễ hạn và chịu lãi suất rất cao (khoảng 20% - 35%/năm) tính dồn từ thời điểm phát sinh giao dịch. Sinh viên chỉ nên mở thẻ khi đã kiểm soát tốt chi tiêu cá nhân và có kỷ luật trả nợ nghiêm ngặt.`,
      },
    ];

    for (const faq of faqs) {
      const [exist] = await pool.query(
        "SELECT id FROM knowledge_base WHERE title = ?",
        [faq.title]
      );
      if (exist.length > 0) {
        await pool.query(
          "UPDATE knowledge_base SET content = ?, is_active = 1 WHERE id = ?",
          [faq.content, exist[0].id]
        );
        console.log(`✅ Đã cập nhật FAQ: "${faq.title}" (ID: ${exist[0].id})`);
      } else {
        const [r] = await pool.query(
          "INSERT INTO knowledge_base (type, title, content, is_active) VALUES (?, ?, ?, 1)",
          ["faq", faq.title, faq.content]
        );
        console.log(`✅ Đã thêm mới FAQ: "${faq.title}" (ID: ${r.insertId})`);
      }
    }

    const [rows] = await pool.query(
      "SELECT id, type, title, is_active FROM knowledge_base ORDER BY id ASC"
    );
    console.log(`\n🎉 Cập nhật thành công! Tổng số mục tri thức hiện tại: ${rows.length}`);
    rows.forEach((r) => {
      console.log(`  [#${r.id}] [${r.type.toUpperCase()}] ${r.title} (Active: ${r.is_active})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi cập nhật tri thức:", error);
    process.exit(1);
  }
}

insertCreditKnowledge();
