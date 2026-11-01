import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    blank_layout = prs.slide_layouts[6] # completely blank layout

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)      # #0F172A Slate 900
    CARD_BG = RGBColor(30, 41, 59)      # #1E293B Slate 800
    CARD_BORDER = RGBColor(51, 65, 85)  # #334155
    ACCENT_BLUE = RGBColor(37, 99, 235) # #2563EB Blue 600
    ACCENT_PURPLE = RGBColor(124, 58, 237) # #7C3AED Purple 600
    ACCENT_GREEN = RGBColor(16, 185, 129)  # #10B981 Emerald 500
    ACCENT_RED = RGBColor(239, 68, 68)     # #EF4444 Red 500
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Slate 400
    TEXT_CYAN = RGBColor(56, 189, 248)     # #38BDF8 Sky 400

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, time_text=""):
        # Header Badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.5), Inches(3.2), Inches(0.35))
        badge.fill.solid()
        badge.fill.fore_color.rgb = CARD_BG
        badge.line.color.rgb = ACCENT_BLUE
        tf = badge.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = tag_text.upper()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_CYAN
        p.alignment = PP_ALIGN.CENTER

        if time_text:
            tb_time = slide.shapes.add_textbox(Inches(10.5), Inches(0.5), Inches(2.0), Inches(0.35))
            pt = tb_time.text_frame.paragraphs[0]
            pt.text = f"⏱️ {time_text}"
            pt.font.size = Pt(12)
            pt.font.bold = True
            pt.font.color.rgb = TEXT_MUTED
            pt.alignment = PP_ALIGN.RIGHT

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.95), Inches(11.7), Inches(0.8))
        ptit = tb_title.text_frame.paragraphs[0]
        ptit.text = title_text
        ptit.font.size = Pt(28)
        ptit.font.bold = True
        ptit.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 1: HERO TITLE SLIDE
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    add_bg(s1)

    # Decorative top glow card
    glow = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(3.66), Inches(1.2), Inches(6.0), Inches(0.45))
    glow.fill.solid()
    glow.fill.fore_color.rgb = CARD_BG
    glow.line.color.rgb = ACCENT_PURPLE
    p = glow.text_frame.paragraphs[0]
    p.text = "✨ ĐỀ TÀI NGHIÊN CỨU & PHÁT TRIỂN PHẦN MỀM"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = TEXT_CYAN
    p.alignment = PP_ALIGN.CENTER

    # Main Title
    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.9), Inches(10.9), Inches(2.2))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI)\nTRONG QUY TRÌNH PHÁT TRIỂN WEB/APP"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.alignment = PP_ALIGN.CENTER

    # Subtitle
    tb_sub = s1.shapes.add_textbox(Inches(1.5), Inches(4.3), Inches(10.3), Inches(0.8))
    p = tb_sub.text_frame.paragraphs[0]
    p.text = "Tối ưu hóa hiệu suất từ Ý tưởng – Lập trình Fullstack – Kiểm thử đến Tính năng Thông minh"
    p.font.size = Pt(18)
    p.font.color.rgb = TEXT_MUTED
    p.alignment = PP_ALIGN.CENTER

    # Case Study Card at bottom
    cs_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.5), Inches(5.3), Inches(8.33), Inches(1.3))
    cs_card.fill.solid()
    cs_card.fill.fore_color.rgb = CARD_BG
    cs_card.line.color.rgb = ACCENT_BLUE
    tf = cs_card.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "📌 CASE STUDY THỰC TIỄN: ỨNG DỤNG VÍ SINH VIÊN THÔNG MINH"
    p1.font.size = Pt(14)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_GREEN
    p1.alignment = PP_ALIGN.CENTER
    
    p2 = tf.add_paragraph()
    p2.text = "Node.js (Express) + React 18 (Vite) + Google Gemini AI (Multimodal & RAG Assistant)"
    p2.font.size = Pt(13)
    p2.font.color.rgb = TEXT_WHITE
    p2.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 2: THÁCH THỨC VÀ ĐỘT PHÁ
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_bg(s2)
    add_header(s2, "So Sánh Thực Trạng", "THÁCH THỨC TRUYỀN THỐNG VÀ BƯỚC ĐỘT PHÁ CỦA AI", "0:45 - 1:30")

    # Left Card: Traditional
    card_l = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(5.6), Inches(4.8))
    card_l.fill.solid()
    card_l.fill.fore_color.rgb = CARD_BG
    card_l.line.color.rgb = ACCENT_RED
    tfl = card_l.text_frame
    tfl.word_wrap = True
    
    pl = tfl.paragraphs[0]
    pl.text = "❌ QUY TRÌNH PHÁT TRIỂN TRUYỀN THỐNG"
    pl.font.size = Pt(18)
    pl.font.bold = True
    pl.font.color.rgb = ACCENT_RED
    
    bullets_l = [
        ("Tốn thời gian với mã mẫu:", "Lập trình viên mất 40% thời gian viết CRUD, cấu hình boilerplate lặp đi lặp lại."),
        ("Dễ phát sinh lỗi logic & cú pháp:", "Tốn nhiều giờ debug thủ công, kiểm soát ngoại lệ (edge cases) thiếu sót."),
        ("Rào cản tính năng thông minh:", "Tích hợp OCR nhận diện hóa đơn hay chatbot yêu cầu hạ tầng phức tạp, chi phí cao.")
    ]
    for b_title, b_desc in bullets_l:
        p_t = tfl.add_paragraph()
        p_t.text = f"\n• {b_title}"
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_d = tfl.add_paragraph()
        p_d.text = f"   {b_desc}"
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = TEXT_MUTED

    # Right Card: With AI
    card_r = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.9), Inches(5.6), Inches(4.8))
    card_r.fill.solid()
    card_r.fill.fore_color.rgb = CARD_BG
    card_r.line.color.rgb = ACCENT_GREEN
    tfr = card_r.text_frame
    tfr.word_wrap = True

    pr = tfr.paragraphs[0]
    pr.text = "🚀 BỨC PHÁ VỚI SỰ TRỢ LỰC TỪ AI"
    pr.font.size = Pt(18)
    pr.font.bold = True
    pr.font.color.rgb = ACCENT_GREEN

    bullets_r = [
        ("Tăng tốc độ gấp 3 lần:", "Tự động sinh mã nguồn, thiết kế Schema CSDL chuẩn hóa chỉ bằng câu lệnh tự nhiên."),
        ("Rà soát & Tối ưu tự động:", "AI phân tích bảo mật, đề xuất giải pháp xử lý rate-limit và chống tấn công từ đầu."),
        ("Bình dân hóa tính năng cao cấp:", "Tích hợp Vision AI đọc hóa đơn đa định dạng và Trợ lý RAG thông minh dễ dàng.")
    ]
    for b_title, b_desc in bullets_r:
        p_t = tfr.add_paragraph()
        p_t.text = f"\n• {b_title}"
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_d = tfr.add_paragraph()
        p_d.text = f"   {b_desc}"
        p_d.font.size = Pt(13)
        p_d.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 3: BẢN ĐỒ 4 GIAI ĐOẠN PHÁT TRIỂN
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_bg(s3)
    add_header(s3, "Quy Trình Chuẩn Hóa", "VÒNG ĐỜI PHÁT TRIỂN ỨNG DỤNG ĐƯỢC TĂNG TỐC BỞI AI", "1:30 - 2:45")

    stages = [
        ("01", "PHÂN TÍCH &\nTHIẾT KẾ", [
            "Đặc tả Use-case & User Story",
            "Sinh Schema CSDL MySQL",
            "Thiết kế cấu trúc API Endpoints"
        ], ACCENT_BLUE),
        ("02", "LẬP TRÌNH\nFULLSTACK", [
            "Sinh CRUD Node.js / Express",
            "Dựng UI React 18 + Tailwind",
            "Cấu hình Auth JWT & Middleware"
        ], ACCENT_PURPLE),
        ("03", "KIỂM THỬ &\nTỐI ƯU HÓA", [
            "Tự động sinh Mock Data",
            "Kiểm thử bảo mật (CORS, Rate Limit)",
            "Tối ưu truy vấn SQL Indexing"
        ], ACCENT_GREEN),
        ("04", "TÍCH HỢP AI\nCỐT LÕI (CORE)", [
            "Gemini Multimodal OCR Bill",
            "Kịch bản trợ lý tài chính RAG",
            "JSON Schema Enforcement"
        ], TEXT_CYAN)
    ]

    card_w = Inches(2.7)
    gap = Inches(0.3)
    left_start = Inches(0.8)

    for i, (num, title, items, color) in enumerate(stages):
        cur_left = left_start + i * (card_w + gap)
        c = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cur_left, Inches(2.0), card_w, Inches(4.7))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = color
        tf = c.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = num
        p_num.font.size = Pt(32)
        p_num.font.bold = True
        p_num.font.color.rgb = color

        p_tit = tf.add_paragraph()
        p_tit.text = title
        p_tit.font.size = Pt(15)
        p_tit.font.bold = True
        p_tit.font.color.rgb = TEXT_WHITE

        sep = tf.add_paragraph()
        sep.text = "─────────"
        sep.font.size = Pt(10)
        sep.font.color.rgb = CARD_BORDER

        for it in items:
            p_it = tf.add_paragraph()
            p_it.text = f"✔ {it}"
            p_it.font.size = Pt(13)
            p_it.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 4: THỰC THI KIẾN TRÚC & LẬP TRÌNH
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_bg(s4)
    add_header(s4, "Case Study: Coding & Architecture", "AI TRONG LẬP TRÌNH MÃ NGUỒN VÀ KIẾN TRÚC DỰ ÁN", "2:45 - 4:00")

    cards_s4 = [
        ("🏛️ Kiến Trúc Hệ Thống & CSDL", [
            "AI hỗ trợ chuẩn hóa thiết kế Schema CSDL MySQL cho giao dịch, ngân sách, phân loại chi tiêu.",
            "Tự động tạo sơ đồ kiến trúc trực quan tương tác (Interactive System Architecture HTML).",
            "Phân tầng chuẩn MVC rõ ràng: Frontend SPA, REST API Server, DB & External AI Gateway."
        ], ACCENT_BLUE),
        ("🛡️ Bảo Mật & Tối Ưu Backend", [
            "Thiết lập cơ chế kiểm soát CORS đa môi trường (Dev, Render Production, Localhost).",
            "Tích hợp Express-Rate-Limit chống spam request vào các API tiêu tốn chi phí AI.",
            "Bảo vệ chống rò rỉ bộ nhớ bằng Multer MemoryStorage khi upload ảnh phân tích."
        ], ACCENT_PURPLE),
        ("💻 Frontend Tương Tác Hiện Đại", [
            "Sinh cấu trúc React 18 + Vite mượt mà, phân tách component và modal khoa học.",
            "Trực quan hóa tài chính với biểu đồ Recharts (phân bổ thu nhập, chi tiêu, cảnh báo bội chi).",
            "Đảm bảo Responsive hiển thị hoàn hảo trên cả điện thoại di động và máy tính."
        ], ACCENT_GREEN)
    ]

    card4_w = Inches(3.7)
    gap4 = Inches(0.3)
    left4 = Inches(0.8)

    for i, (title, points, color) in enumerate(cards_s4):
        c = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left4 + i * (card4_w + gap4), Inches(2.0), card4_w, Inches(4.7))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = color
        tf = c.text_frame
        tf.word_wrap = True

        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = color

        for p_item in points:
            p_p = tf.add_paragraph()
            p_p.text = f"\n• {p_item}"
            p_p.font.size = Pt(13)
            p_p.font.color.rgb = TEXT_WHITE

    # -------------------------------------------------------------
    # SLIDE 5: TÍNH NĂNG AI CỐT LÕI
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_bg(s5)
    add_header(s5, "Tính Năng Đột Phá", "ĐƯA AI VÀO SẢN PHẨM: 2 TÍNH NĂNG CỐT LÕI VƯỢT TRỘI", "4:00 - 5:15")

    # Feature 1
    f1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.7))
    f1.fill.solid()
    f1.fill.fore_color.rgb = CARD_BG
    f1.line.color.rgb = ACCENT_BLUE
    tf1 = f1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "📸 1. MULTIMODAL BILL SCANNING (OCR)"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    bullets_f1 = [
        ("Công nghệ nền tảng:", "Google Gemini 2.5 Flash / Pro Vision API."),
        ("Cách thức hoạt động:", "Người dùng chụp hóa đơn ăn uống, mua sắm hoặc ảnh chụp màn hình chuyển khoản ngân hàng."),
        ("Xử lý thông minh:", "AI nhận diện chính xác Số tiền, Danh mục (Ăn uống, Tiền trọ, Học tập), Ngày giờ và Người chi trả."),
        ("Ép chuẩn đầu ra (JSON Schema):", "Ép AI trả về JSON chuẩn xác 100%, ghi thẳng vào CSDL mà không cần gõ phím.")
    ]
    for bt, bd in bullets_f1:
        pt = tf1.add_paragraph()
        pt.text = f"\n✔ {bt}"
        pt.font.size = Pt(14)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pd = tf1.add_paragraph()
        pd.text = f"   {bd}"
        pd.font.size = Pt(13)
        pd.font.color.rgb = TEXT_MUTED

    # Feature 2
    f2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(2.0), Inches(5.6), Inches(4.7))
    f2.fill.solid()
    f2.fill.fore_color.rgb = CARD_BG
    f2.line.color.rgb = ACCENT_PURPLE
    tf2 = f2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "🤖 2. TRỢ LÝ CỐ VẤN TÀI CHÍNH (RAG CHATBOT)"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE

    bullets_f2 = [
        ("Công nghệ nền tảng:", "RAG (Retrieval-Augmented Generation) & System Prompting."),
        ("Kịch bản sư phạm chuyên sâu:", "Được huấn luyện theo tâm lý sinh viên, thấu hiểu thu nhập bấp bênh và thói quen sinh hoạt."),
        ("Cá nhân hóa lời khuyên:", "Đọc dữ liệu ngân sách thực tế để cảnh báo bội chi, hướng dẫn lập quỹ khẩn cấp."),
        ("Giao tiếp tự nhiên tiếng Việt:", "Trả lời thân thiện, gần gũi, khích lệ thay vì chỉ trích.")
    ]
    for bt, bd in bullets_f2:
        pt = tf2.add_paragraph()
        pt.text = f"\n✔ {bt}"
        pt.font.size = Pt(14)
        pt.font.bold = True
        pt.font.color.rgb = TEXT_WHITE
        pd = tf2.add_paragraph()
        pd.text = f"   {bd}"
        pd.font.size = Pt(13)
        pd.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 6: HIỆU QUẢ ĐỊNH LƯỢNG
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_bg(s6)
    add_header(s6, "Kết Quả Đạt Được", "GIÁ TRỊ THỰC TIỄN & CHỈ SỐ ĐỊNH LƯỢNG ẤN TƯỢNG", "5:15 - 6:15")

    metrics = [
        ("⚡ -60%", "Rút Ngắn Thời Gian Phát Triển", "Từ 5 tuần dự kiến xuống còn chưa đầy 2 tuần để hoàn thiện bản MVP Fullstack chạy thực tế trên Cloud.", ACCENT_GREEN),
        ("🎯 95%+", "Độ Chính Xác Bóc Tách OCR", "Nhận diện đúng hóa đơn phức tạp, chữ viết tay hoặc ảnh chụp mờ nhờ sức mạnh của Gemini Vision.", ACCENT_BLUE),
        ("🛡️ 0 Lỗi", "Bảo Mật & Rò Rỉ Dữ Liệu", "Vượt qua toàn bộ bài kiểm thử tự động về Authentication, CORS, Rate Limiting và SQL Injection.", ACCENT_PURPLE)
    ]

    metric_w = Inches(3.7)
    gap_m = Inches(0.3)
    left_m = Inches(0.8)

    for i, (big_num, title, desc, col) in enumerate(metrics):
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_m + i * (metric_w + gap_m), Inches(2.1), metric_w, Inches(4.5))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = col
        tf = box.text_frame
        tf.word_wrap = True

        p_num = tf.paragraphs[0]
        p_num.text = big_num
        p_num.font.size = Pt(46)
        p_num.font.bold = True
        p_num.font.color.rgb = col
        p_num.alignment = PP_ALIGN.CENTER

        p_tit = tf.add_paragraph()
        p_tit.text = title
        p_tit.font.size = Pt(16)
        p_tit.font.bold = True
        p_tit.font.color.rgb = TEXT_WHITE
        p_tit.alignment = PP_ALIGN.CENTER

        sep = tf.add_paragraph()
        sep.text = "───────────────"
        sep.font.size = Pt(10)
        sep.font.color.rgb = CARD_BORDER
        sep.alignment = PP_ALIGN.CENTER

        p_desc = tf.add_paragraph()
        p_desc.text = f"\n{desc}"
        p_desc.font.size = Pt(14)
        p_desc.font.color.rgb = TEXT_MUTED
        p_desc.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 7: KẾT LUẬN & Q&A
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_bg(s7)
    add_header(s7, "Tổng Kết & Thảo Luận", "KẾT LUẬN & HỎI ĐÁP (Q&A)", "6:15 - 7:00")

    # Left takeaway card
    left_c = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(7.5), Inches(4.7))
    left_c.fill.solid()
    left_c.fill.fore_color.rgb = CARD_BG
    left_c.line.color.rgb = ACCENT_PURPLE
    tf7 = left_c.text_frame
    tf7.word_wrap = True

    p = tf7.paragraphs[0]
    p.text = "💡 THÔNG ĐIỆP CỐT LÕI"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    q = tf7.add_paragraph()
    q.text = '\n"AI không thay thế lập trình viên – Nhưng lập trình viên biết làm chủ AI sẽ thay thế những người không dùng nó."'
    q.font.size = Pt(17)
    q.font.bold = True
    q.font.color.rgb = TEXT_WHITE

    tf7.add_paragraph().text = "\n3 BÀI HỌC KINH NGHIỆM ĐẮC GIÁ:"
    tf7.paragraphs[-1].font.size = Pt(15)
    tf7.paragraphs[-1].font.bold = True
    tf7.paragraphs[-1].font.color.rgb = TEXT_CYAN

    lessons = [
        "Làm chủ Prompt Engineering & Schema Design là kỹ năng sống còn.",
        "Luôn có quy trình Verification (con người kiểm duyệt lại code của AI).",
        "Đưa AI vào đúng 'nỗi đau' của người dùng (tự động hóa nhập liệu)."
    ]
    for les in lessons:
        pl = tf7.add_paragraph()
        pl.text = f"✔ {les}"
        pl.font.size = Pt(14)
        pl.font.color.rgb = TEXT_MUTED

    # Right QR & Thanks Card
    right_c = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.7), Inches(2.0), Inches(3.8), Inches(4.7))
    right_c.fill.solid()
    right_c.fill.fore_color.rgb = CARD_BG
    right_c.line.color.rgb = ACCENT_BLUE
    tfr7 = right_c.text_frame
    tfr7.word_wrap = True

    pr7 = tfr7.paragraphs[0]
    pr7.text = "📱 TRẢI NGHIỆM SẢN PHẨM"
    pr7.font.size = Pt(15)
    pr7.font.bold = True
    pr7.font.color.rgb = ACCENT_BLUE
    pr7.alignment = PP_ALIGN.CENTER

    qr_path = "qrcode_nckh.png"
    if os.path.exists(qr_path):
        s7.shapes.add_picture(qr_path, Inches(9.4), Inches(2.8), width=Inches(2.4), height=Inches(2.4))
    
    tb_thx = s7.shapes.add_textbox(Inches(8.8), Inches(5.3), Inches(3.6), Inches(1.2))
    pt = tb_thx.text_frame.paragraphs[0]
    pt.text = "CẢM ƠN THẦY CÔ & CÁC BẠN!"
    pt.font.size = Pt(15)
    pt.font.bold = True
    pt.font.color.rgb = TEXT_WHITE
    pt.alignment = PP_ALIGN.CENTER

    pt2 = tb_thx.text_frame.add_paragraph()
    pt2.text = "Sẵn sàng lắng nghe câu hỏi (Q&A)"
    pt2.font.size = Pt(13)
    pt2.font.color.rgb = ACCENT_GREEN
    pt2.alignment = PP_ALIGN.CENTER

    out_file = "Slide_Canva_AI_Web_App.pptx"
    prs.save(out_file)
    print(f"Presentation successfully created at: {os.path.abspath(out_file)}")

if __name__ == "__main__":
    build_deck()
