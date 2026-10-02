# NCKH — Ví Sinh Viên

> Hệ thống Quản lý Tài chính Cá nhân dành cho Sinh viên tích hợp Trợ lý Trí tuệ Nhân tạo (Đề tài Nghiên cứu Khoa học).

---

## 🏛️ Sơ đồ Kiến trúc Hệ thống Trực quan (System Architecture)

Dự án sử dụng [Archify](https://github.com/tt-a1i/archify) để xây dựng sơ đồ kiến trúc trực quan, tương tác cao với đầy đủ tính năng:
- **Xem sơ đồ trực tiếp**: Tải hoặc mở file [`architecture.html`](./architecture.html) bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Cốc Cốc,...).
- **Xem khi chạy ứng dụng**: Truy cập `http://localhost:10000/architecture.html` (hoặc domain trên Render).
- **Cấu hình & Dữ liệu nguồn**: File [`.archify/candidate.json`](./.archify/candidate.json).

### Các tính năng trên sơ đồ:
- 🌗 Chuyển đổi giao diện Sáng / Tối (Dark / Light mode).
- 🔍 Thu phóng (Zoom), kéo thả (Pan), làm nổi bật đường truyền dữ liệu (Trace motion).
- 📌 Xem chi tiết từng thành phần: Frontend SPA, Backend REST API, RAG Knowledge Base, MySQL và Google Gemini AI.
- 💾 Xuất ảnh chất lượng cao định dạng PNG / SVG / WebP để làm báo cáo tài liệu.

---

## 🛠️ Cấu trúc mã nguồn

```text
├── .archify/                 # Cấu hình và công cụ tạo sơ đồ kiến trúc
├── architecture.html         # File sơ đồ kiến trúc tương tác standalone (chạy trực tiếp)
├── loc-project/
│   ├── backend/              # Máy chủ Node.js + Express + MySQL
│   │   ├── routes/           # auth, transactions, budgets, chat, multimodal, knowledge, settings
│   │   ├── public/           # Static build frontend (kèm architecture.html)
│   │   └── server.js         # Entrypoint server
│   └── frontend/             # Giao diện React 18 + Vite + Recharts
│       └── src/              # Các components, modals và context xác thực
```