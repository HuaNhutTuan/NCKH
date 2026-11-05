import React, { useState, useRef } from "react";
import {
  ArrowLeft, ArrowRight, Sparkles, RefreshCw, Trophy,
  AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Zap,
  MessageCircle, Flame, Heart, Wallet
} from "lucide-react";

// Danh sách các tình huống thẻ bài kết hợp SGK KT&PL 10 và thực tế đời sống sinh viên
const CARDS_DATA = [
  {
    id: 1,
    tag: "Tín dụng tiêu dùng • SGK KT&PL 10",
    title: "Điện Thoại Trả Góp 0%",
    situation: "Cửa hàng quảng cáo: 'Mua iPhone 16 trả góp 0% lãi suất', chỉ cần CCCD và trả trước 20%, phần còn lại ký hợp đồng công ty tài chính. Có nên chốt ngay?",
    left: {
      action: "Từ chối / Xem lại hợp đồng",
      isSafe: true,
      resultTitle: "Quyết định rất tỉnh táo!",
      explanation: "Chính xác! Gói '0% lãi suất' thường đi kèm phí bảo hiểm khoản vay bắt buộc (từ 1 - 2 triệu) và phí chuyển đổi kỳ hạn. Tổng số tiền thực trả luôn cao hơn giá niêm yết rất nhiều.",
      moneyDelta: 0,
      wisdomDelta: 15,
    },
    right: {
      action: "Ký hợp đồng chốt luôn",
      isSafe: false,
      resultTitle: "Dính bẫy phí ẩn!",
      explanation: "Sai lầm! Bạn phải gánh thêm 1.800.000 đ phí bảo hiểm cộng vào gốc và áp lực trả nợ 2 triệu/tháng khi chưa có thu nhập ổn định.",
      moneyDelta: -1800000,
      wisdomDelta: -15,
    },
  },
  {
    id: 2,
    tag: "Thẻ tín dụng • Ngân hàng",
    title: "Sao Kê Thẻ Tín Dụng Đến Hạn",
    situation: "Đến ngày thanh toán thẻ tín dụng 3.000.000 đ. App ngân hàng gợi ý: 'Chỉ cần thanh toán tối thiểu 150.000 đ (5%)'. Bạn có nên chỉ đóng 150k để giữ tiền đi chơi?",
    left: {
      action: "Thanh toán đủ 100% (3 triệu)",
      isSafe: true,
      resultTitle: "Quy tắc vàng của thẻ tín dụng!",
      explanation: "Rất chuẩn! Thanh toán đủ 100% trước hạn quyết toán giúp bạn hưởng trọn ưu đãi 40-45 ngày miễn lãi (lãi suất 0%) và xây dựng điểm tín dụng tốt.",
      moneyDelta: 0,
      wisdomDelta: 25,
    },
    right: {
      action: "Chỉ trả tối thiểu 150.000 đ",
      isSafe: false,
      resultTitle: "Bẫy lãi suất cắt cổ!",
      explanation: "Rất nguy hiểm! Nếu chỉ trả tối thiểu, ngân hàng sẽ phạt phí chậm trả và tính lãi 30-35%/năm trên TOÀN BỘ 3 triệu từ ngày quẹt thẻ, khiến nợ phình to nhanh chóng.",
      moneyDelta: -900000,
      wisdomDelta: -25,
    },
  },
  {
    id: 3,
    tag: "Cảnh báo cạm bẫy",
    title: "Vay Tiền Nhanh Qua iCloud",
    situation: "Xe hỏng giữa tháng, bạn thấy tin nhắn: 'Cần tiền gấp đóng trọ? Vay 3 triệu trong 5 phút, chỉ cần thế chấp tài khoản iCloud máy iPhone, không cần gặp mặt'. Vay không?",
    left: {
      action: "Từ chối & Chặn tin nhắn",
      isSafe: true,
      resultTitle: "Thoát bẫy tín dụng đen!",
      explanation: "Chính xác tuyệt đối! Vay qua iCloud là hình thức tín dụng đen nguy hiểm. Kẻ xấu sẽ đổi mật khẩu khóa máy từ xa để tống tiền với mức lãi lên đến 500%/năm.",
      moneyDelta: 0,
      wisdomDelta: 30,
    },
    right: {
      action: "Đăng nhập iCloud vay ngay",
      isSafe: false,
      resultTitle: "Bị khóa máy & tống tiền!",
      explanation: "Thảm họa! Bạn bị khóa iPhone từ xa, mất quyền riêng tư hình ảnh và danh bạ, đồng thời bị đe dọa đòi nợ lãi mẹ đẻ lãi con.",
      moneyDelta: -3000000,
      wisdomDelta: -40,
    },
  },
  {
    id: 4,
    tag: "Kiến thức SGK KT&PL 10",
    title: "Bản Chất Tín Dụng Thương Mại",
    situation: "Doanh nghiệp A xuất kho bán chịu lô sữa trị giá 50 triệu cho siêu thị B, hẹn 60 ngày sau B phải thanh toán tiền hàng kèm lãi. Đây là hình thức Tín dụng thương mại. Đúng hay Sai?",
    left: {
      action: "Sai",
      isSafe: false,
      resultTitle: "Chưa chính xác!",
      explanation: "Theo SGK Bài 9, Tín dụng thương mại là quan hệ giữa các doanh nghiệp dưới hình thức mua bán chịu, trả chậm hàng hóa; đến hạn bên mua trả vốn gốc và lãi bằng tiền tệ.",
      moneyDelta: 0,
      wisdomDelta: -10,
    },
    right: {
      action: "Đúng",
      isSafe: true,
      resultTitle: "Nắm vững lý thuyết SGK!",
      explanation: "Chính xác! Đối tượng của tín dụng thương mại ban đầu là hàng hóa chứ không phải tiền mặt, giúp các doanh nghiệp duy trì chuỗi cung ứng linh hoạt.",
      moneyDelta: 0,
      wisdomDelta: 20,
    },
  },
  {
    id: 5,
    tag: "Kiến thức SGK KT&PL 10",
    title: "Vay Vốn Học Sinh - Sinh Viên",
    situation: "Sinh viên hoàn cảnh khó khăn muốn vay vốn học tập ưu đãi từ Ngân hàng Chính sách xã hội, có thể làm hồ sơ thông qua tổ chức ủy thác là Đoàn Thanh niên xã/phường không?",
    left: {
      action: "Không được",
      isSafe: false,
      resultTitle: "Chưa đúng quy định!",
      explanation: "Sai rồi! Ngân hàng Chính sách xã hội hoạt động chủ yếu theo phương thức cho vay ủy thác qua 4 đoàn thể chính trị - xã hội: Hội Nông dân, Phụ nữ, Cựu chiến binh và Đoàn TNCS Hồ Chí Minh.",
      moneyDelta: 0,
      wisdomDelta: -10,
    },
    right: {
      action: "Hoàn toàn được",
      isSafe: true,
      resultTitle: "Hiểu đúng Tín dụng Nhà nước!",
      explanation: "Chính xác! Đây là chính sách tín dụng phi lợi nhuận của Nhà nước nhằm hỗ trợ sinh viên nghèo yên tâm theo đuổi việc học với mức lãi suất ưu đãi nhất.",
      moneyDelta: 0,
      wisdomDelta: 20,
    },
  },
  {
    id: 6,
    tag: "Tâm lý học hành vi • 50/30/20",
    title: "Cơn Sốt Săn Sale Lúc Nửa Đêm",
    situation: "Vừa thi xong môn khó, bạn thấy đôi giày hiệu giảm sốc từ 2 triệu còn 1.2 triệu lúc 0h. Trong ví chỉ còn 1.5 triệu tiền ăn cho 15 ngày tới. Có nên tự thưởng?",
    left: {
      action: "Áp dụng Quy tắc 24 Giờ",
      isSafe: true,
      resultTitle: "Làm chủ cảm xúc chi tiêu!",
      explanation: "Tuyệt vời! Quy tắc 24h giúp xua tan cơn hưng phấn bốc đồng (dopamine). Bạn nhận ra đôi giày cũ vẫn dùng tốt và giữ trọn tiền ăn cho nửa tháng tới.",
      moneyDelta: 300000,
      wisdomDelta: 20,
    },
    right: {
      action: "Chốt đơn tự thưởng ngay",
      isSafe: false,
      resultTitle: "Cháy túi cuối tháng!",
      explanation: "Cảnh báo! Bạn chi tới 80% ngân sách còn lại cho món đồ 'Mong muốn' (Wants) và rơi vào cảnh phải ăn mì tôm, vay mượn để sống sót qua kỳ thi.",
      moneyDelta: -1200000,
      wisdomDelta: -20,
    },
  },
  {
    id: 7,
    tag: "Toán tài chính • SGK 10",
    title: "So Sánh Hai Cách Tính Trả Góp",
    situation: "Khi vay 30 triệu mua laptop, ngân hàng đưa ra 2 gói: Gói A tính theo 'Dư nợ gốc ban đầu' và Gói B tính theo 'Dư nợ giảm dần' (cùng lãi suất năm). Bạn nên chọn Gói B?",
    left: {
      action: "Sai (Gói nào cũng như nhau)",
      isSafe: false,
      resultTitle: "Chưa nắm rõ công thức!",
      explanation: "Chưa đúng! Gói A tính tiền lãi cố định trên cả 30 triệu suốt kỳ vay. Trong khi Gói B chỉ tính lãi trên số nợ thực tế còn lại sau khi đã trừ gốc các tháng trước.",
      moneyDelta: -600000,
      wisdomDelta: -15,
    },
    right: {
      action: "Đúng (Chọn Dư nợ giảm dần)",
      isSafe: true,
      resultTitle: "Bậc thầy tính toán thông minh!",
      explanation: "Chính xác! Gói dư nợ giảm dần giúp tiền lãi và số tiền phải trả giảm dần theo thời gian, giúp bạn tiết kiệm được một khoản tiền lãi rất lớn!",
      moneyDelta: 600000,
      wisdomDelta: 25,
    },
  },
  {
    id: 8,
    tag: "Cảnh báo cạm bẫy",
    title: "Lời Mời 'Khởi Nghiệp Vốn 0 Đồng'",
    situation: "Khóa trên rủ bạn tham gia hội thảo tài chính: 'Nộp phí 3 triệu tham gia, mỗi ngày nhận lãi cam kết 2%/ngày (60%/tháng), giới thiệu bạn bè nhận hoa hồng 20%'. Có tham gia không?",
    left: {
      action: "Từ chối & Cảnh giác",
      isSafe: true,
      resultTitle: "Tỉnh táo trước bẫy đa cấp!",
      explanation: "Bậc thầy nhận diện lừa đảo! Lãi suất 60%/tháng và tiền thưởng từ việc lôi kéo người khác là dấu hiệu 100% của mô hình Ponzi lừa đảo đa cấp biến tướng.",
      moneyDelta: 0,
      wisdomDelta: 30,
    },
    right: {
      action: "Đóng tiền tham gia thử",
      isSafe: false,
      resultTitle: "Mất trắng tiền ăn!",
      explanation: "Thảm kịch! Chỉ sau vài tuần đường dây sập, người dẫn dắt biến mất, bạn mất trắng 3 triệu tích cóp và làm tổn hại uy tín với bạn bè.",
      moneyDelta: -3000000,
      wisdomDelta: -35,
    },
  },
];

export default function SwipeGame({ onAsk, T }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wallet, setWallet] = useState(1500000); // 1.5 triệu vốn ban đầu
  const [wisdom, setWisdom] = useState(50); // 50 điểm ban đầu
  const [lastFeedback, setLastFeedback] = useState(null); // Feedback sau mỗi cú gạt
  const [history, setHistory] = useState([]);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);

  const currentCard = CARDS_DATA[currentIndex];
  const isGameOver = currentIndex >= CARDS_DATA.length;

  const handleSwipe = (direction) => {
    if (!currentCard || lastFeedback) return;
    const choice = direction === "left" ? currentCard.left : currentCard.right;

    setWallet((prev) => Math.max(0, prev + choice.moneyDelta));
    setWisdom((prev) => Math.max(0, Math.min(100, prev + choice.wisdomDelta)));
    
    setHistory((prev) => [
      ...prev,
      {
        card: currentCard,
        direction,
        choice,
      },
    ]);

    setLastFeedback({
      direction,
      choice,
    });
  };

  const handleNextCard = () => {
    setLastFeedback(null);
    setCurrentIndex((prev) => prev + 1);
    setDragOffset(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setWallet(1500000);
    setWisdom(50);
    setLastFeedback(null);
    setHistory([]);
    setDragOffset(0);
  };

  // Drag handlers cho chuột và cảm ứng điện thoại
  const handlePointerDown = (e) => {
    if (lastFeedback) return;
    isDragging.current = true;
    startX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || lastFeedback) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handlePointerUp = () => {
    if (!isDragging.current || lastFeedback) return;
    isDragging.current = false;
    if (dragOffset > 75) {
      handleSwipe("right");
    } else if (dragOffset < -75) {
      handleSwipe("left");
    }
    setDragOffset(0);
  };

  // Đánh giá xếp hạng khi kết thúc
  let rankBadge = "Học Viên Tập Sự";
  let rankDesc = "Bạn đã có nhận thức nhưng vẫn còn dễ bị lung lay trước các bẫy tín dụng và ưu đãi hấp dẫn.";
  let rankColor = "#D97706";
  if (wisdom >= 80 && wallet >= 1000000) {
    rankBadge = "Thần Đèn Tài Chính";
    rankDesc = "Kỷ luật thép! Bạn nhận diện cạm bẫy cực kỳ sắc sảo và bảo toàn trọn vẹn ngân sách sinh viên.";
    rankColor = "#059669";
  } else if (wisdom >= 60) {
    rankBadge = "Nhà Thực Hành Tỉnh Táo";
    rankDesc = "Bạn nắm khá vững lý thuyết SGK và phản xạ tốt, cần chú ý thêm chi tiết hợp đồng vay.";
    rankColor = "#2563EB";
  } else if (wallet <= 500000) {
    rankBadge = "Cần Bổ Túc Gấp";
    rankDesc = "Túi tiền đã cạn! Bạn bị rơi vào các bẫy chi tiêu bốc đồng và phí ẩn của công ty tài chính.";
    rankColor = "#DC2626";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Thanh Chỉ Số HUD Gamified: Cân đối, hiện đại và thân thiện */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: "14px 16px",
          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Hàng 1: Tiến độ vòng chơi mượt mà */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: T.tealDark,
                background: T.teal + "14",
                padding: "3px 9px",
                borderRadius: 8,
                letterSpacing: 0.3,
              }}
            >
              THẺ {Math.min(currentIndex + 1, CARDS_DATA.length)} / {CARDS_DATA.length}
            </span>
            <span style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 500 }}>
              Phản xạ tài chính 60s
            </span>
          </div>

          {/* Thanh mini progress bar */}
          <div
            style={{
              flex: 1,
              maxWidth: 130,
              height: 6,
              background: "#F1F5F9",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((currentIndex + 1) / CARDS_DATA.length) * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${T.teal}, #10B981)`,
                borderRadius: 10,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Hàng 2: Hai Mini-Card Chỉ Số Cân Đối (Không vạch chia thô) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Card Ví tiền */}
          <div
            style={{
              background: wallet < 500000 ? "#FEF2F2" : "#F0FDF4",
              border: `1px solid ${wallet < 500000 ? "#FECACA" : "#DCFCE7"}`,
              borderRadius: 14,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: wallet < 500000 ? "#FEE2E2" : "#DCFCE7",
                color: wallet < 500000 ? "#DC2626" : "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Wallet size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: wallet < 500000 ? "#991B1B" : "#166534" }}>
                Ví Sinh Viên
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: wallet < 500000 ? "#DC2626" : "#047857",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {wallet.toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>

          {/* Card Điểm thông thái */}
          <div
            style={{
              background: wisdom < 40 ? "#FEF2F2" : "#EFF6FF",
              border: `1px solid ${wisdom < 40 ? "#FECACA" : "#DBEAFE"}`,
              borderRadius: 14,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: wisdom < 40 ? "#FEE2E2" : "#DBEAFE",
                color: wisdom < 40 ? "#DC2626" : "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: wisdom < 40 ? "#991B1B" : "#1E40AF" }}>
                Điểm Thông Thái
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: wisdom < 40 ? "#DC2626" : "#1D4ED8",
                  whiteSpace: "nowrap",
                }}
              >
                {wisdom} / 100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Màn Kết Thúc Game */}
      {isGameOver ? (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: "24px 20px",
            textAlign: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: rankColor + "1A",
              color: rankColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Trophy size={32} />
          </div>

          <span
            style={{
              display: "inline-block",
              background: rankColor + "20",
              color: rankColor,
              fontWeight: 800,
              fontSize: 11,
              padding: "3px 12px",
              borderRadius: 20,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {rankBadge}
          </span>

          <h3 style={{ margin: "4px 0 8px", fontSize: 18, fontWeight: 800, color: T.ink }}>
            Tổng Kết Vòng Phản Xạ 60s
          </h3>
          <p style={{ fontSize: 12.5, color: T.inkSoft, margin: "0 auto 16px", maxWidth: 360, lineHeight: 1.5 }}>
            {rankDesc}
          </p>

          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-around",
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: T.inkSoft }}>Số dư ví còn lại</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.tealDark }}>
                {wallet.toLocaleString("vi-VN")} đ
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.inkSoft }}>Điểm năng lực FLS</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2563EB" }}>
                {wisdom} điểm
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRestart}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${T.border}`,
                background: "#fff",
                fontWeight: 700,
                fontSize: 12.5,
                color: T.ink,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={15} /> Chơi Lại Vòng Khác
            </button>
            <button
              onClick={() => onAsk && onAsk("Tuấn ơi, hãy phân tích giúp mình tại sao sinh viên thường dễ bị rơi vào bẫy trả góp điện thoại và bẫy thanh toán tối thiểu thẻ tín dụng?")}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: T.teal,
                fontWeight: 700,
                fontSize: 12.5,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Sparkles size={15} /> Hỏi Tuấn AI Giải Thích
            </button>
          </div>
        </div>
      ) : (
        /* Vùng Thẻ Bài Vuốt Tương Tác */
        <div style={{ position: "relative", minHeight: 330 }}>
          {/* Card chính */}
          <div
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{
              background: "#FFFFFF",
              border: `2px solid ${
                dragOffset > 30 ? "#10B981" : dragOffset < -30 ? "#EF4444" : "#E2E8F0"
              }`,
              borderRadius: 22,
              padding: "20px 18px 16px",
              boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02)",
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
              transition: isDragging.current ? "none" : "all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
              cursor: isDragging.current ? "grabbing" : "grab",
              userSelect: "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Huy hiệu phản hồi trực quan khi kéo */}
            {dragOffset > 25 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "#059669",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "5px 12px",
                  borderRadius: 20,
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                }}
              >
                👉 {currentCard.right.action}
              </div>
            )}
            {dragOffset < -25 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "5px 12px",
                  borderRadius: 20,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                }}
              >
                👈 {currentCard.left.action}
              </div>
            )}

            {/* Tag & Chủ đề */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  background: currentCard.tag.includes("Cảnh báo")
                    ? "#FEF3C7"
                    : currentCard.tag.includes("SGK")
                    ? "#E0F2FE"
                    : "#F1F5F9",
                  color: currentCard.tag.includes("Cảnh báo")
                    ? "#B45309"
                    : currentCard.tag.includes("SGK")
                    ? "#0369A1"
                    : "#475569",
                  padding: "4px 10px",
                  borderRadius: 12,
                }}
              >
                {currentCard.tag}
              </span>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                💡 Tình huống thực tế
              </span>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: "#0F172A", lineHeight: 1.35 }}>
              {currentCard.title}
            </h3>

            {/* Khung nội dung câu chuyện / tình huống thân thiện */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #EDF2F7",
                borderRadius: 14,
                padding: "14px 16px",
                fontSize: 13.5,
                color: "#334155",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {currentCard.situation}
            </div>

            {/* Hướng dẫn thao tác vuốt tinh gọn trong thẻ */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 8,
                fontSize: 11,
                color: "#94A3B8",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#EF4444", fontWeight: 600 }}>
                <ArrowLeft size={13} /> Vuốt Trái
              </span>
              <span style={{ opacity: 0.7 }}>kéo thẻ hoặc bấm nút dưới</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#10B981", fontWeight: 600 }}>
                Vuốt Phải <ArrowRight size={13} />
              </span>
            </div>

            {/* Modal/Overlay giải thích sau khi gạt */}
            {lastFeedback && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255, 255, 255, 0.96)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "20px",
                  textAlign: "center",
                  zIndex: 10,
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: lastFeedback.choice.isSafe ? "#ECFDF5" : "#FEF2F2",
                    color: lastFeedback.choice.isSafe ? "#059669" : "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  {lastFeedback.choice.isSafe ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: lastFeedback.choice.isSafe ? "#059669" : "#DC2626",
                    marginBottom: 6,
                  }}
                >
                  {lastFeedback.choice.resultTitle}
                </div>

                <p style={{ fontSize: 12, color: T.ink, lineHeight: 1.5, margin: "0 0 14px", maxWidth: 380 }}>
                  {lastFeedback.choice.explanation}
                </p>

                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  {lastFeedback.choice.moneyDelta !== 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 8,
                        background: lastFeedback.choice.moneyDelta > 0 ? "#ECFDF5" : "#FEF2F2",
                        color: lastFeedback.choice.moneyDelta > 0 ? "#059669" : "#DC2626",
                      }}
                    >
                      {lastFeedback.choice.moneyDelta > 0 ? "+" : ""}
                      {lastFeedback.choice.moneyDelta.toLocaleString("vi-VN")} đ ví
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 8,
                      background: lastFeedback.choice.wisdomDelta > 0 ? "#EFF6FF" : "#FEF2F2",
                      color: lastFeedback.choice.wisdomDelta > 0 ? "#2563EB" : "#DC2626",
                    }}
                  >
                    {lastFeedback.choice.wisdomDelta > 0 ? "+" : ""}
                    {lastFeedback.choice.wisdomDelta} Thông thái
                  </span>
                </div>

                <button
                  onClick={handleNextCard}
                  style={{
                    padding: "9px 24px",
                    borderRadius: 10,
                    background: T.teal,
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(31, 111, 99, 0.25)",
                  }}
                >
                  Thẻ Tiếp Theo ➔
                </button>
              </div>
            )}
          </div>

          {/* 2 Nút Bấm Lựa Chọn Hành Động */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <button
              onClick={() => handleSwipe("left")}
              disabled={!!lastFeedback}
              style={{
                padding: "13px 14px",
                borderRadius: 16,
                border: "1.5px solid #FECACA",
                background: "#FEF2F2",
                color: "#DC2626",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: lastFeedback ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s ease",
                textAlign: "center",
                lineHeight: 1.35,
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.08)",
              }}
            >
              <XCircle size={18} style={{ flexShrink: 0 }} />
              <span>{currentCard.left.action}</span>
            </button>

            <button
              onClick={() => handleSwipe("right")}
              disabled={!!lastFeedback}
              style={{
                padding: "13px 14px",
                borderRadius: 16,
                border: "1.5px solid #A7F3D0",
                background: "#ECFDF5",
                color: "#059669",
                fontWeight: 700,
                fontSize: 12.5,
                cursor: lastFeedback ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s ease",
                textAlign: "center",
                lineHeight: 1.35,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
              }}
            >
              <span>{currentCard.right.action}</span>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
