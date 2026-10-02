const fs = require("fs");
const candidate = {
  "schema_version": 1,
  "diagram_type": "architecture",
  "meta": {
    "title": "NCKH — Ví Sinh Viên Architecture",
    "subtitle": "Kiến trúc hệ thống Quản lý Tài chính Sinh viên & Trợ lý AI Thông minh",
    "output": "architecture.html",
    "animation": "trace",
    "quality_profile": "showcase"
  },
  "components": [
    { "id": "users", "type": "external", "label": "Sinh viên (Users)", "sublabel": "Web & Mobile Browser", "pos": [40, 280], "size": [130, 60] },
    { "id": "frontend_auth", "type": "frontend", "label": "Auth UI & Streak", "sublabel": "Login, Register, Check Email", "pos": [260, 140], "size": [150, 60] },
    { "id": "frontend_app", "type": "frontend", "label": "Ví Sinh Viên SPA", "sublabel": "React 18 + Vite + Recharts", "pos": [260, 280], "size": [150, 60] },
    { "id": "frontend_chat", "type": "frontend", "label": "AI Assistant UI", "sublabel": "Chat Stream + Hóa đơn Vision", "pos": [260, 420], "size": [150, 60] },
    { "id": "api_auth", "type": "security", "label": "Auth Controller", "sublabel": "JWT, Bcrypt, SHA-256", "pos": [570, 140], "size": [160, 60] },
    { "id": "api_server", "type": "backend", "label": "Express API Server", "sublabel": "REST API + Static Host", "pos": [570, 280], "size": [160, 60] },
    { "id": "api_ai", "type": "backend", "label": "AI Orchestrator", "sublabel": "SSE Stream, Multimodal Vision", "pos": [570, 420], "size": [160, 60] },
    { "id": "engine_finance", "type": "backend", "label": "Finance Engine", "sublabel": "TX, Budgets, Safe-to-Spend", "pos": [850, 180], "size": [160, 60] },
    { "id": "engine_knowledge", "type": "backend", "label": "Knowledge RAG", "sublabel": "FAQ & Document Engine", "pos": [850, 320], "size": [160, 60] },
    { "id": "render_platform", "type": "cloud", "label": "Render Cloud", "sublabel": "Hosting & Deployment", "pos": [1130, 80], "size": [150, 56] },
    { "id": "mysql_db", "type": "database", "label": "MySQL Database", "sublabel": "Users, TX, Budgets, FAQ", "pos": [1130, 230], "size": [150, 64] },
    { "id": "gemini_cloud", "type": "cloud", "label": "Google Gemini AI", "sublabel": "Flash / Pro LLM & Vision", "pos": [1130, 390], "size": [150, 60] }
  ],
  "boundaries": [
    { "kind": "region", "label": "Client Layer (Frontend SPA)", "wraps": ["frontend_auth", "frontend_app", "frontend_chat"] },
    { "kind": "security-group", "label": "Backend Core (Express / Node.js)", "wraps": ["api_server", "api_auth", "api_ai", "engine_finance", "engine_knowledge"] },
    { "kind": "region", "label": "Data & Cloud Infrastructure", "wraps": ["render_platform", "mysql_db", "gemini_cloud"] }
  ],
  "connections": [
    { "from": "users", "to": "frontend_app", "label": "Tương tác ví sinh viên", "variant": "emphasis" },
    { "from": "users", "to": "frontend_auth", "label": "Đăng nhập / Đăng ký" },
    { "from": "users", "to": "frontend_chat", "label": "Hỏi đáp & quét ảnh" },
    { "from": "frontend_app", "to": "api_server", "label": "REST API calls", "variant": "emphasis" },
    { "from": "frontend_auth", "to": "api_auth", "label": "Auth API (check-email)", "variant": "security" },
    { "from": "frontend_chat", "to": "api_ai", "label": "SSE Stream & Upload" },
    { "from": "api_server", "to": "render_platform", "label": "Deploy & Runtime", "variant": "dashed" },
    { "from": "api_server", "to": "engine_finance", "label": "Giao dịch & ngân sách" },
    { "from": "api_server", "to": "engine_knowledge", "label": "Tra cứu FAQ" },
    { "from": "api_ai", "to": "engine_knowledge", "label": "Context RAG", "variant": "dashed" },
    { "from": "api_auth", "to": "mysql_db", "label": "Kiểm tra email trùng", "variant": "security" },
    { "from": "engine_finance", "to": "mysql_db", "label": "CRUD tài chính", "variant": "emphasis" },
    { "from": "engine_knowledge", "to": "mysql_db", "label": "Đọc/ghi tri thức" },
    { "from": "api_ai", "to": "gemini_cloud", "label": "Streaming & Vision", "variant": "emphasis" }
  ],
  "cards": [
    { "dot": "cyan", "title": "Giao diện Sinh viên (Client Frontend)", "items": ["Ứng dụng đơn trang React 18 tối ưu trên cả máy tính và điện thoại", "Trực quan hóa tài chính: Biểu đồ thu chi, ngân sách hàng tháng, Safe-to-Spend", "Xác thực tài khoản với bước kiểm tra email trùng lặp tự động thời gian thực"] },
    { "dot": "emerald", "title": "Máy chủ & Dịch vụ (Backend Server)", "items": ["Nền tảng Express/Node.js cung cấp REST API và phục vụ static frontend", "Bảo mật thông tin: Mã hóa mật khẩu SHA-256 kết hợp Bcrypt, cấp token JWT", "Tự động tính chuỗi đăng nhập (streak) và gợi ý hạn mức chi tiêu hàng ngày"] },
    { "dot": "violet", "title": "Trí tuệ nhân tạo (AI Assistant)", "items": ["Trợ lý tài chính AI sử dụng Google Gemini Flash/Pro qua API", "Phản hồi trực tiếp dạng dòng thời gian thực (Server-Sent Events streaming)", "Tính năng đa phương thức (Multimodal Vision): Nhận diện và bóc tách hóa đơn tự động"] },
    { "dot": "amber", "title": "Lưu trữ & Hạ tầng (Database & Cloud)", "items": ["Cơ sở dữ liệu quan hệ MySQL lưu trữ người dùng, giao dịch và tri thức FAQ", "Hỗ trợ RAG tìm kiếm tài liệu và câu hỏi thường gặp phục vụ chatbot", "Triển khai trên nền tảng đám mây Render với khả năng mở rộng linh hoạt"] }
  ]
};
fs.writeFileSync(".archify/candidate.json", JSON.stringify(candidate, null, 2), "utf8");
console.log("Candidate updated");