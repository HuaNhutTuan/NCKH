import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>2.3. Thiết Kế Kịch Bản Sư Phạm Cho Trợ Lý AI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  @page {
    size: A4;
    margin: 22mm 20mm 22mm 20mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.65;
    color: #1e293b;
    font-size: 13.5px;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Document Header */
  .doc-header {
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 12px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .doc-header .left-title {
    font-size: 12px;
    font-weight: 700;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .doc-header .right-sub {
    font-size: 11px;
    color: #64748b;
    font-style: italic;
  }

  /* Section Titles */
  h1.main-sec-title {
    color: #1e3a8a;
    font-size: 19px;
    font-weight: 800;
    text-transform: uppercase;
    margin-top: 0;
    margin-bottom: 18px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #cbd5e1;
    letter-spacing: 0.3px;
  }

  h2.sub-sec-title {
    color: #0f172a;
    font-size: 15.5px;
    font-weight: 700;
    margin-top: 22px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }

  h2.sub-sec-title::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 16px;
    background-color: #2563eb;
    margin-right: 8px;
    border-radius: 2px;
  }

  /* Bullet points formatting */
  ul {
    margin: 0 0 14px 0;
    padding-left: 20px;
    list-style-type: disc;
  }

  ul ul {
    margin: 6px 0 8px 0;
    padding-left: 22px;
    list-style-type: circle;
  }

  li {
    margin-bottom: 8px;
    text-align: justify;
    line-height: 1.6;
  }

  li strong {
    color: #0f172a;
  }

  /* Callout box */
  .callout-box {
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    border-radius: 4px;
    padding: 12px 16px;
    margin: 14px 0;
    font-size: 12.8px;
  }

  .callout-title {
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 4px;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.5px;
  }

  /* Tables */
  table.content-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 12.5px;
  }

  table.content-table th, table.content-table td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }

  table.content-table th {
    background-color: #f1f5f9;
    color: #1e3a8a;
    font-weight: 700;
  }

  table.content-table tr:nth-child(even) {
    background-color: #f8fafc;
  }

  .code-tag {
    background: #e2e8f0;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', monospace;
    font-size: 11.5px;
    font-weight: 600;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <div class="doc-header">
    <div class="left-title">Báo Cáo Nghiên Cứu Kỹ Thuật & Sư Phạm Số — Đề Tài Ví Sinh Viên</div>
    <div class="right-sub">Trích lục Mục 2.3: Thiết kế kịch bản sư phạm cho Trợ lý AI</div>
  </div>

  <h1 class="main-sec-title">2.3. Thiết kế kịch bản sư phạm cho Trợ lý AI</h1>

  <h2 class="sub-sec-title">2.3.1. Hình tượng sư phạm và phong cách gợi mở</h2>
  <ul>
    <li>
      <strong>Định hình hình tượng sư phạm (Pedagogical Persona):</strong>
      <ul>
        <li>Đóng vai trò là <strong>"Cố vấn Tài chính Đồng hành" (Peer-Mentor)</strong>: Thể hiện hình ảnh một người anh/chị đi trước am hiểu tài chính, thấu hiểu tâm lý và những khó khăn thực tế của sinh viên.</li>
        <li>Tuyệt đối tránh thái độ "rao giảng đạo đức", giáo điều hoặc sử dụng văn phong hàn lâm, quan liêu, xa cách khiến người học cảm thấy bị phán xét.</li>
        <li>Thể hiện sự đồng cảm cao (High Empathy): Luôn tạo ra môi trường an toàn về mặt tâm lý khi sinh viên chia sẻ về các khoản chi tiêu quá tay hoặc các sai lầm tài chính.</li>
      </ul>
    </li>
    <li>
      <strong>Phong cách đối thoại gợi mở Socratic (Socratic Dialogue Style):</strong>
      <ul>
        <li><strong>Nguyên tắc "Không giải bài hộ":</strong> Khi người học đặt câu hỏi (ví dụ: <em>"Em có 3 triệu thì nên tiêu thế nào?"</em>), AI không lập sẵn danh sách phân bổ ngay lập tức mà đặt câu hỏi ngược lại để người học tự rà soát các chi phí sinh hoạt cố định trước.</li>
        <li><strong>Kỹ thuật chia nhỏ bậc thang nhận thức (Scaffolding & Chunking):</strong> Tách các quyết định tài chính phức tạp thành 2 - 3 bước nhận thức đơn giản, giúp người học dễ dàng tiếp cận và tự rút ra giải pháp.</li>
        <li><strong>Nuôi dưỡng tư duy phát triển (Growth Mindset):</strong> Luôn ghi nhận nỗ lực ghi chép hoặc nhận định đúng của sinh viên trước khi chỉ ra các điểm thiếu sót cần tối ưu hóa.</li>
        <li><strong>Kiểm soát tải lượng nhận thức (Cognitive Load Control):</strong> Mỗi lượt phản hồi duy trì độ dài dưới 150 từ, trình bày gãy gọn và kết thúc bằng <strong>duy nhất 1 câu hỏi trọng tâm</strong> để người học tập trung phản tư mà không bị quá tải thông tin.</li>
      </ul>
    </li>
  </ul>

  <div class="callout-box">
    <div class="callout-title">Tóm lược nguyên tắc cốt lõi của hình tượng sư phạm:</div>
    <em>"Không phán xét sai lầm — Không cung cấp đáp án sẵn — Dẫn dắt bằng câu hỏi phản tư — Khích lệ từng tiến bộ nhỏ trong hành vi tài chính của sinh viên."</em>
  </div>

  <h2 class="sub-sec-title">2.3.2. Cấu trúc câu lệnh chỉ dẫn hệ thống</h2>
  <ul>
    <li>
      <strong>Thành phần 1 - Định danh vai trò và mục tiêu (Role & Objectives Prompting):</strong>
      <ul>
        <li>Xác lập vai trò rõ ràng cho mô hình: Là Huấn luyện viên Tài chính Socratic hỗ trợ giáo dục sinh viên, không phải nhân viên bán bảo hiểm, môi giới chứng khoán hay chuyên viên cho vay.</li>
        <li>Gắn mục tiêu tối thượng: Giúp sinh viên rèn luyện tư duy tự chủ tài chính, nâng cao khả năng quản trị ngân sách cá nhân bền vững.</li>
      </ul>
    </li>
    <li>
      <strong>Thành phần 2 - Cơ chế kích hoạt luồng sư phạm theo 4 giai đoạn nhận thức:</strong>
      <ul>
        <li><strong>Giai đoạn Chẩn đoán (Diagnosis):</strong> Kích hoạt các câu hỏi thăm dò thói quen, xác định tổng thu nhập và phát hiện các khoản chi tiêu bất thường trong tuần gần nhất.</li>
        <li><strong>Giai đoạn Gợi ý phản tư (Reflection):</strong> Hướng dẫn sinh viên tự đối chiếu dữ liệu chi tiêu với quy tắc 50/30/20 và phân biệt rạch ròi giữa Nhu cầu (Needs) và Mong muốn (Wants).</li>
        <li><strong>Giai đoạn Thử thách hành động (Action Challenge):</strong> Thúc đẩy sinh viên tự đưa ra con số cam kết (ví dụ: cắt giảm 20% chi phí giải trí tuần này để bù quỹ dự phòng).</li>
        <li><strong>Giai đoạn Đúc kết bài học (Consolidation):</strong> Yêu cầu sinh viên diễn đạt lại bằng lời nguyên nhân thành công hoặc lý do chưa đạt mục tiêu để khắc sâu bài học hành vi.</li>
      </ul>
    </li>
    <li>
      <strong>Thành phần 3 - Quy chuẩn định dạng đầu ra (Output Formatting Standards):</strong>
      <ul>
        <li>Bắt buộc trình bày bằng các gạch đầu dòng ngắn, câu từ cô đọng, thân thiện với giao diện thiết bị di động.</li>
        <li>Sử dụng các bảng quy đổi hoặc phép tính đối chiếu trực quan (ví dụ: giá gốc sản phẩm so với tổng tiền phải trả khi mua trả góp kèm lãi suất ẩn).</li>
      </ul>
    </li>
  </ul>

  <div class="page-break"></div>

  <h2 class="sub-sec-title">2.3.3. Tinh chỉnh tham số và kiểm soát sai lệch thông tin</h2>
  <ul>
    <li>
      <strong>Chiến lược tinh chỉnh tham số mô hình (Hyperparameter Tuning):</strong>
      <ul>
        <li><strong>Temperature (Thiết lập 0.2 - 0.4):</strong> Duy trì ở ngưỡng thấp nhằm đảm bảo tính ổn định, chặt chẽ về mặt logic, bám sát các nguyên lý tài chính chuẩn mực và triệt tiêu tính sáng tạo tùy tiện của AI.</li>
        <li><strong>Top_P (Thiết lập 0.8 - 0.9):</strong> Giữ cho ngôn từ đối thoại tự nhiên, phong phú nhưng luôn nằm trong phạm vi tri thức tài chính an toàn đã được định trước.</li>
        <li><strong>Max Output Tokens (250 - 350 tokens):</strong> Khống chế độ dài văn bản tạo ra, buộc mô hình phải trả lời súc tích, giữ đúng nhịp điệu tương tác sư phạm nhanh giữa sinh viên và AI.</li>
      </ul>
    </li>
  </ul>

  <table class="content-table">
    <thead>
      <tr>
        <th style="width: 28%;">Tham số</th>
        <th style="width: 22%;">Giá trị cấu hình</th>
        <th style="width: 50%;">Mục đích sư phạm & Kỹ thuật</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Temperature</strong></td>
        <td><span class="code-tag">0.2 - 0.4</span></td>
        <td>Giảm thiểu sai số tính toán, giữ vững logic gợi mở và nguyên tắc tài chính chuẩn xác.</td>
      </tr>
      <tr>
        <td><strong>Top_P</strong></td>
        <td><span class="code-tag">0.85</span></td>
        <td>Đảm bảo ngôn ngữ gần gũi, sinh động với sinh viên trong giới hạn ngữ nghĩa an toàn.</td>
      </tr>
      <tr>
        <td><strong>Max Output Tokens</strong></td>
        <td><span class="code-tag">300 tokens</span></td>
        <td>Ngăn chặn câu trả lời quá dài, tránh làm phân tán sự chú ý của người học.</td>
      </tr>
    </tbody>
  </table>

  <ul>
    <li>
      <strong>Kiểm soát ảo giác và sai lệch thông tin qua RAG (Retrieval-Augmented Generation):</strong>
      <ul>
        <li><strong>Truy xuất tri thức có kiểm chứng:</strong> Buộc AI chỉ trích xuất định nghĩa, công thức và lời khuyên từ Cơ sở tri thức học liệu đã qua thẩm định ở Mục 2.2, ngăn chặn hiện tượng bịa đặt thuật ngữ (hallucination).</li>
        <li><strong>Cơ chế "Trả lời trung thực":</strong> Quy định rõ nếu người học cung cấp dữ liệu chưa đủ hoặc mâu thuẫn, AI phải hỏi lại để làm rõ thông tin, tuyệt đối không được tự ý suy đoán con số thu nhập hay chi tiêu.</li>
      </ul>
    </li>
    <li>
      <strong>Thiết lập hàng rào an toàn tài chính và đạo đức (Financial Safety Guardrails):</strong>
      <ul>
        <li><strong>Chặn hoàn toàn các rủi ro đầu cơ:</strong> Tự động phát hiện và kích hoạt cơ chế từ chối khi sinh viên đề cập đến đầu tư mạo hiểm (Forex, tiền điện tử/crypto, chứng khoán phái sinh) hoặc các dịch vụ vay nóng, tín dụng đen.</li>
        <li><strong>Giao thức hỗ trợ khẩn cấp:</strong> Khi sinh viên chia sẻ dấu hiệu khủng hoảng tâm lý vì nợ nần, AI lập tức tạm dừng bài học tài chính, đưa ra phản hồi trấn an tâm lý và cung cấp thông tin liên hệ của Phòng Chăm sóc & Hỗ trợ Người học của nhà trường.</li>
      </ul>
    </li>
  </ul>

</body>
</html>
"""

with open("generate_sec_2_3_html.py", "w", encoding="utf-8") as f:
    f.write(f'''
html_data = """{html_content}"""
with open("sec_2_3_preview.html", "w", encoding="utf-8") as f:
    f.write(html_data)
print("Wrote sec_2_3_preview.html")
''')

print("Created generator script.")
