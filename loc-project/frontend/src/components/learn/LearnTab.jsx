import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap, Sparkles, HelpCircle, CheckCircle2, XCircle,
  Lightbulb, Calculator, Target, Trophy, BookOpen, AlertTriangle,
  ChevronRight, RefreshCw, ArrowRight, ShieldCheck, ArrowUpRight,
  Clock, Rocket, MessageCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { formatThousands, parseThousands } from "../../utils/format";

const fmtVND = (n) => Math.round(n).toLocaleString("vi-VN") + " đ";

// ---------- Bộ câu hỏi Trắc nghiệm Đánh giá Năng lực Tài chính (Chuẩn OECD/INFE thích ứng cho Sinh viên) ----------
const QUIZ_QUESTIONS = [
  {
    id: 1,
    topic: "Lãi kép & Tích lũy",
    question: "Bạn gửi tiết kiệm 2.000.000 đ vào ngân hàng với lãi suất 6%/năm. Nếu không rút cả gốc lẫn lãi trong 2 năm liên tiếp, tổng số tiền bạn nhận được sẽ:",
    options: [
      { id: "A", text: "Đúng 2.120.000 đ" },
      { id: "B", text: "Nhiều hơn 2.240.000 đ", isCorrect: true },
      { id: "C", text: "Đúng 2.240.000 đ" },
      { id: "D", text: "Ít hơn 2.120.000 đ" },
    ],
    explanation: "Chính xác! Nhờ hiệu ứng Lãi kép (tiền lãi năm 1 tiếp tục sinh lãi ở năm 2): 2.000.000 x 1.06 x 1.06 = 2.247.200 đ, nhiều hơn mức lãi đơn (2.240.000 đ).",
  },
  {
    id: 2,
    topic: "Lạm phát & Sức mua",
    question: "Giả sử lạm phát năm nay là 5%, trong khi ngân hàng trả lãi gửi tiết kiệm 3.5%/năm. Sau 1 năm, sức mua thực tế của số tiền bạn gửi sẽ:",
    options: [
      { id: "A", text: "Tăng lên" },
      { id: "B", text: "Giữ nguyên không đổi" },
      { id: "C", text: "Giảm đi", isCorrect: true },
      { id: "D", text: "Gấp đôi" },
    ],
    explanation: "Đúng rồi! Lãi suất thực = Lãi suất danh nghĩa - Lạm phát (3.5% - 5% = -1.5%). Khi tỷ lệ tăng giá hàng hóa nhanh hơn tốc độ sinh lãi, sức mua thực tế của tiền sẽ bị xói mòn.",
  },
  {
    id: 3,
    topic: "Bẫy Mua Trả Góp 0%",
    question: "Khi sinh viên mua điện thoại hoặc laptop với quảng cáo 'Trả góp 0% lãi suất', khoản chi phí ẩn nào sau đây thường làm đội giá sản phẩm?",
    options: [
      { id: "A", text: "Phí bảo hiểm khoản vay & phí dịch vụ chuyển đổi kỳ hạn", isCorrect: true },
      { id: "B", text: "Hoàn toàn không mất thêm bất kỳ chi phí nào" },
      { id: "C", text: "Được cửa hàng tặng thêm tiền mặt hàng tháng" },
      { id: "D", text: "Chỉ mất 5.000 đ tiền vé gửi xe" },
    ],
    explanation: "Chính xác! 'Lãi suất 0%' thường đi kèm phí chuyển đổi (từ 2-5%) và phí bảo hiểm hợp đồng vay bắt buộc (vài trăm nghìn đến tiền triệu). Tổng số tiền thực trả luôn cao hơn giá bán niêm yết.",
  },
  {
    id: 4,
    topic: "Quy tắc 50/30/20 (Needs vs Wants)",
    question: "Khoản chi tiêu nào sau đây thuộc nhóm 'Mong muốn' (Wants) chứ KHÔNG phải 'Nhu cầu thiết yếu' (Needs)?",
    options: [
      { id: "A", text: "Tiền cơm trưa bình dân phục vụ việc đi học" },
      { id: "B", text: "Tiền thuê trọ và tiền điện nước sinh hoạt" },
      { id: "C", text: "Nâng cấp điện thoại mới khi máy cũ vẫn tốt, uống trà sữa hàng ngày", isCorrect: true },
      { id: "D", text: "Tiền vé xe buýt / xăng xe đi lại hàng ngày" },
    ],
    explanation: "Đúng! Nhu cầu (Needs) là các khoản bắt buộc để duy trì sinh hoạt và học tập tối thiểu. Mua sắm đổi đời máy hoặc trà sữa tụ tập là Mong muốn (Wants) có thể linh hoạt tiết chế.",
  },
  {
    id: 5,
    topic: "Quỹ Khẩn Cấp Sinh Viên",
    question: "Mục đích quan trọng nhất của việc sinh viên tích lũy 'Quỹ dự phòng khẩn cấp' là gì?",
    options: [
      { id: "A", text: "Gom sẵn tiền để săn sale đợt giảm giá lớn cuối năm" },
      { id: "B", text: "Chi trả cho sự cố bất ngờ (ốm đau, hỏng xe, mất việc part-time) mà không phải vay nợ", isCorrect: true },
      { id: "C", text: "Dùng để nạp game hoặc mua vé concert thần tượng" },
      { id: "D", text: "Gửi vào các hội nhóm đầu tư crypto rủi ro cao" },
    ],
    explanation: "Tuyệt vời! Quỹ khẩn cấp là tấm lá chắn bảo vệ bạn trước các biến cố đột xuất, giúp bạn duy trì việc học an tâm mà không rơi vào bẫy tín dụng đen hay vay lãi cao.",
  },
];

// ---------- Danh sách Thử thách Kỷ luật Tài chính ----------
const INITIAL_QUESTS = [
  {
    id: "cook_home",
    title: "7 Ngày Tự Nấu Ăn Tại Trọ",
    target: "7 ngày",
    savingsEstimate: "180.000 đ - 250.000 đ",
    desc: "Tự chuẩn bị bữa cơm trưa hoặc tối tại phòng thay vì gọi ship hay ăn ngoài.",
    badge: "Bếp Trưởng Tiết Kiệm",
  },
  {
    id: "no_boba",
    title: "3 Ngày Không Nước Ngọt / Trà Sữa",
    target: "3 ngày",
    savingsEstimate: "75.000 đ - 120.000 đ",
    desc: "Mang theo bình nước lọc cá nhân khi đi học. Vừa khỏe người vừa giữ túi tiền an toàn.",
    badge: "Chiến Binh Nước Lọc",
  },
  {
    id: "rule_24h",
    title: "Áp Dụng Quy Tắc 24 Giờ",
    target: "5 lần",
    savingsEstimate: "Tránh chi tiêu bốc đồng",
    desc: "Trước khi mua bất kỳ món đồ 'Wants' nào trên 100k, dừng lại 24h để tự hỏi: 'Mình có thực sự cần nó không?'.",
    badge: "Khắc Tinh Bốc Đồng",
  },
  {
    id: "emergency_200k",
    title: "Khởi Tạo Quỹ Khẩn Cấp 200.000 đ",
    target: "1 lần",
    savingsEstimate: "Lá chắn an toàn",
    desc: "Trích riêng 200k từ tiền tiết kiệm hoặc làm thêm vào quỹ dự phòng bất khả xâm phạm.",
    badge: "Mầm Xanh Tự Chủ",
  },
];

// ---------- Danh mục Sổ tay Bài học Vi mô ----------
const LESSON_ARTICLES = [
  {
    id: "debt_trap",
    tag: "Cảnh báo cạm bẫy",
    title: "Nhận diện Bẫy Tín Dụng Đen & Việc Nhẹ Lương Cao",
    summary: "Cách tránh các app cho vay nặng lãi qua iCloud và lừa đảo làm nhiệm vụ qua mạng.",
    content: "Các hình thức tín dụng đen hiện nay trá hình rất tinh vi qua các app vay sinh viên chỉ cần CCCD hoặc thế chấp tài khoản iCloud. Lãi suất thực tế thường lên tới 300% - 700%/năm kèm phí phạt cắt cổ. Tuyệt đối không vay mượn từ các ứng dụng không rõ nguồn gốc và không chuyển tiền cọc cho bất kỳ công việc tuyển dụng online nào.",
    prompt: "Tuấn ơi, sinh viên cần chú ý những dấu hiệu nào để nhận biết bẫy tín dụng đen và app vay nặng lãi qua mạng?"
  },
  {
    id: "rule_50_30_20",
    tag: "Phương pháp nền tảng",
    title: "Quy Tắc 50/30/20 Cho Sinh Viên Thu Nhập Thấp",
    summary: "Linh hoạt phân bổ ngân sách khi chỉ có 2-3 triệu/tháng từ gia đình hoặc làm thêm.",
    content: "Với mức trợ cấp 3 triệu/tháng: 50% (1.5 triệu) cho Nhu cầu thiết yếu (tiền trọ, ăn cơ bản, xăng xe). 30% (900k) cho Mong muốn & Phát triển (sách vở, giao lưu bạn bè). 20% (600k) gửi vào Quỹ khẩn cấp tích lũy. Khi thu nhập thấp, bạn có thể tạm điều chỉnh thành tỷ lệ 60/25/15 nhưng nhất định phải có phần tích lũy.",
    prompt: "Tuấn hướng dẫn mình cách chia hũ chi tiêu 50/30/20 chi tiết với số tiền trợ cấp 2.5 triệu mỗi tháng được không?"
  },
  {
    id: "doom_spending",
    tag: "Tâm lý học hành vi",
    title: "Bẫy Tâm Lý 'Tự Thưởng Sau Kỳ Thi Căng Thẳng'",
    summary: "Hiểu về hiện tượng Doom Spending và cơ chế dopamine đánh lừa não bộ.",
    content: "Sau những ngày thi cử áp lực, sinh viên có xu hướng 'xả hơi' bằng cách mua sắm thả ga hoặc tụ tập ăn uống đắt đỏ với lý do 'mình xứng đáng được thưởng'. Cảm giác thỏa mãn chỉ kéo dài vài giờ, nhưng áp lực nợ nần sẽ kéo dài cả tháng. Hãy thay thế bằng các hình thức tự thưởng 0 đồng: ngủ một giấc thật sâu, xem bộ phim yêu thích hoặc chạy bộ cùng bạn bè.",
    prompt: "Làm thế nào để kiềm chế cảm xúc muốn mua sắm tự thưởng vô tội vạ sau khi thi xong hả Tuấn?"
  },
  {
    id: "credit_cards",
    tag: "Kỹ năng tài chính",
    title: "Cách Đọc Sao Kê & Tránh Lãi Thẻ Tín Dụng",
    summary: "Hiểu đúng về số tiền thanh toán tối thiểu và chu kỳ miễn lãi 45 ngày.",
    content: "Thẻ tín dụng là tiền bạn đi vay trước của ngân hàng, không phải tiền của bạn. Nếu chỉ trả 'Số tiền thanh toán tối thiểu' (thường 5%), ngân hàng sẽ tính lãi suất cao (25-35%/năm) trên TOÀN BỘ dư nợ ban đầu tính từ ngày quẹt thẻ. Nguyên tắc vàng: Luôn thanh toán 100% dư nợ đúng hạn trước ngày đến hạn thanh toán.",
    prompt: "Tuấn giải thích giúp mình cơ chế tính lãi của thẻ tín dụng sinh viên và bẫy 'thanh toán tối thiểu' với?"
  },
];

export default function LearnTab({ onAsk, stats, transactions }) {
  const [subTab, setSubTab] = useState("quiz"); // "quiz" | "simulator" | "quests" | "lessons"

  // ---------- Trắc nghiệm State ----------
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(() => {
    try {
      const saved = localStorage.getItem("edufin_quiz_score");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSelectAnswer = (qId, optionId) => {
    if (isQuizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      const correct = q.options.find((o) => o.isCorrect)?.id;
      if (quizAnswers[q.id] === correct) score++;
    });

    let level = "Cấp 1: Cần Cải Thiện Kiến Thức";
    if (score === 5) level = "Cấp 5: Bậc Thầy Quản Trị Tài Chính Sinh Viên";
    else if (score === 4) level = "Cấp 4: Nhà Thực Hành Tài Chính Có Ý Thức";
    else if (score === 3) level = "Cấp 3: Sinh Viên Bắt Đầu Hình Thành Tư Duy";
    else if (score >= 2) level = "Cấp 2: Nhận Thức Cơ Bản";

    const result = { score, total: QUIZ_QUESTIONS.length, level, date: new Date().toLocaleDateString("vi-VN") };
    setQuizScore(result);
    setIsQuizSubmitted(true);
    try {
      localStorage.setItem("edufin_quiz_score", JSON.stringify(result));
    } catch {}
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setIsQuizSubmitted(false);
  };

  // ---------- Mô phỏng Trả góp State ----------
  const [itemPrice, setItemPrice] = useState("10000000"); // 10 triệu
  const [months, setMonths] = useState(6);
  const [interestRate, setInterestRate] = useState(2.5); // %/tháng

  const simResult = useMemo(() => {
    const principal = parseThousands(itemPrice) || 0;
    if (principal <= 0) return null;

    // Tính lãi đơn hoặc lãi trên dư nợ phẳng mô phỏng thực tế gói trả góp
    const monthlyFee = (principal * (interestRate / 100));
    const totalFee = monthlyFee * months;
    const totalAmount = principal + totalFee;
    const monthlyPayment = totalAmount / months;

    // Quy đổi cơ hội sư phạm
    const bobaCups = Math.round(totalFee / 30000);
    const parttimeHours = Math.round(totalFee / 22000); // 22k/h làm quán cafe
    const mealDays = Math.round(totalFee / 50000); // 50k/ngày ăn trọ

    return {
      principal,
      totalFee,
      totalAmount,
      monthlyPayment,
      bobaCups,
      parttimeHours,
      mealDays,
    };
  }, [itemPrice, months, interestRate]);

  // ---------- Thử thách State ----------
  const [quests, setQuests] = useState(() => {
    try {
      const saved = localStorage.getItem("edufin_user_quests");
      return saved ? JSON.parse(saved) : INITIAL_QUESTS.map((q) => ({ ...q, status: "idle" }));
    } catch {
      return INITIAL_QUESTS.map((q) => ({ ...q, status: "idle" }));
    }
  });

  const toggleQuestStatus = (qId) => {
    setQuests((prev) => {
      const next = prev.map((q) => {
        if (q.id === qId) {
          const nextStatus = q.status === "idle" ? "in_progress" : q.status === "in_progress" ? "completed" : "idle";
          return { ...q, status: nextStatus };
        }
        return q;
      });
      try {
        localStorage.setItem("edufin_user_quests", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const completedQuestCount = quests.filter((q) => q.status === "completed").length;

  // ---------- Sổ tay bài học State ----------
  const [activeLesson, setActiveLesson] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const T = {
    teal: "#1F6F63",
    tealDark: "#123F38",
    gold: "#D9A441",
    goldDark: "#8C6620",
    brick: "#AE4C3B",
    paper: "#F1EEE3",
    paperLine: "#DAD5C4",
    card: "#FBFAF4",
    ink: "#20302C",
    inkSoft: "#5B6660",
    border: "#D9D3C1",
  };

  // Mặc định hiển thị màn hình "Tính năng đang phát triển"
  if (!showDemo) {
    return (
      <div style={{ paddingBottom: 24 }}>
        {/* Hero Banner: Tính năng đang phát triển */}
        <div
          style={{
            marginTop: 10,
            marginBottom: 16,
            padding: "24px 20px 20px",
            background: `linear-gradient(145deg, ${T.tealDark}, #174b43)`,
            borderRadius: 18,
            color: "#F1EEE3",
            textAlign: "center",
            boxShadow: "0 6px 20px rgba(18, 63, 56, 0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Biểu tượng trung tâm */}
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: T.gold,
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
            }}
          >
            <GraduationCap size={32} strokeWidth={2.2} />
          </div>

          {/* Huy hiệu Tính năng đang phát triển */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(217, 164, 65, 0.2)",
              color: "#F6C76E",
              border: "1px solid rgba(217, 164, 65, 0.4)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <Sparkles size={13} />
            <span>Tính năng đang phát triển</span>
          </div>

          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#FFFFFF",
              marginBottom: 6,
            }}
          >
            Góc Học Tập & Rèn Luyện
          </div>

          <p
            style={{
              margin: "0 auto 14px",
              fontSize: 12.5,
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.5,
              maxWidth: 340,
            }}
          >
            Học phần Giáo dục & Rèn luyện năng lực tài chính dành riêng cho sinh viên đang được đội ngũ nghiên cứu hoàn thiện nội dung sư phạm và sẽ sớm ra mắt trong bản cập nhật kế tiếp!
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: "7px 14px",
              fontSize: 11.5,
              color: "#F1EEE3",
            }}
          >
            <Clock size={14} color="#F6C76E" />
            <span>Dự kiến ra mắt: <strong>Quý 4/2026</strong> (Đề tài NCKH)</span>
          </div>
        </div>

        {/* Các module nội dung sắp ra mắt */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: T.tealDark,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Rocket size={16} color={T.teal} />
            <span>Nội dung dự kiến sẽ ra mắt</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                Icon: BookOpen,
                color: "#0F766E",
                bg: "#99F6E4",
                tag: "Cẩm nang vi mô",
                title: "Bài học Tài chính 3-5 Phút",
                desc: "Quy tắc 50/30/20, quỹ khẩn cấp sinh viên, cạm bẫy thẻ tín dụng và tư duy tự chủ tài chính.",
              },
              {
                Icon: Calculator,
                color: "#D97706",
                bg: "#FEF3C7",
                tag: "Mô phỏng thực tế",
                title: "Mô phỏng Bẫy Mua Trả Góp 0%",
                desc: "Tính toán lãi suất ẩn và quy đổi chi phí cơ hội thành số cốc trà sữa, số giờ làm thêm part-time.",
              },
              {
                Icon: Target,
                color: "#16A34A",
                bg: "#DCFCE7",
                tag: "Rèn luyện hành vi",
                title: "Thử thách 7 Ngày Tiết Kiệm",
                desc: "Thử thách tự nấu ăn tại trọ, 3 ngày không trà sữa và theo dõi chi tiêu để nhận huy hiệu kỷ luật.",
              },
              {
                Icon: CheckCircle2,
                color: "#7C3AED",
                bg: "#EDE9FE",
                tag: "Chuẩn OECD/INFE",
                title: "Đánh giá Năng lực Tài chính (FLS)",
                desc: "Bộ câu hỏi trắc nghiệm đo lường chỉ số hiểu biết tài chính trước và sau khóa rèn luyện.",
              },
            ].map((item, idx) => {
              const ItemIcon = item.Icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: item.bg,
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ItemIcon size={20} strokeWidth={2.2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          background: item.color + "1A",
                          color: item.color,
                          borderRadius: 4,
                          padding: "1px 6px",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.ink,
                        marginBottom: 3,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: T.inkSoft,
                        lineHeight: 1.45,
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thẻ Kết nối Trợ lý AI Tuấn */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "16px 18px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.ink,
              marginBottom: 4,
            }}
          >
            Bạn cần giải đáp kiến thức tài chính ngay?
          </div>
          <div
            style={{
              fontSize: 12,
              color: T.inkSoft,
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            Trợ lý AI Tuấn luôn sẵn sàng giải thích các khái niệm, phân tích chi tiêu và gợi ý thói quen tiết kiệm cho bạn.
          </div>
          <button
            onClick={() => onAsk && onAsk("Chào Tuấn, hãy gợi ý cho mình các kiến thức quản lý tài chính cơ bản nhất dành cho sinh viên")}
            className="btn-teal"
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 12,
              background: T.teal,
              color: "#FFFFFF",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <MessageCircle size={16} />
            <span>Trò chuyện cùng Trợ lý Tuấn ngay</span>
          </button>
        </div>

        {/* Nút mở bản thử nghiệm (Developer / Testing Demo) */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button
            onClick={() => setShowDemo(true)}
            style={{
              background: "transparent",
              border: `1px dashed ${T.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              color: T.inkSoft,
              fontSize: 11,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.teal)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.inkSoft)}
          >
            ⚙️ Xem trước bản thử nghiệm tính năng (Developer Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Banner thông báo chế độ thử nghiệm */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FEF3C7",
          border: "1px solid #FDE68A",
          borderRadius: 10,
          padding: "8px 12px",
          marginTop: 10,
          marginBottom: 10,
          fontSize: 11.5,
          color: "#92400E",
        }}
      >
        <span>⚠️ Bạn đang ở chế độ xem trước bản thử nghiệm (Demo)</span>
        <button
          onClick={() => setShowDemo(false)}
          style={{
            background: "#92400E",
            color: "#FFF",
            border: "none",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Quay lại
        </button>
      </div>

      {/* Header Banner Sư Phạm */}
      <div style={{
        marginTop: 4, marginBottom: 12, padding: "16px 18px",
        background: `linear-gradient(135deg, ${T.tealDark}, ${T.teal})`,
        borderRadius: 16, color: "#fff", position: "relative", overflow: "hidden"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
            background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12,
            letterSpacing: 0.5
          }}>
            Học phần Nghiên cứu Khoa học
          </span>
          <span style={{ fontSize: 11, opacity: 0.85 }}>EduFin Lab</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: "2px 0 6px" }}>
          Góc Học Tập & Rèn Luyện Tài Chính
        </div>
        <p style={{ margin: 0, fontSize: 11.5, opacity: 0.9, lineHeight: 1.45 }}>
          Đo lường năng lực tài chính (FLS), trải nghiệm mô phỏng các cạm bẫy thực tế và rèn luyện thói quen kỷ luật.
        </p>
      </div>

      {/* Sub-tab Navigation (4 Trụ Cột Sư Phạm) */}
      <div style={{
        display: "flex", gap: 4, background: T.border, borderRadius: 12,
        padding: 3, marginBottom: 14, overflowX: "auto"
      }}>
        {[
          { id: "quiz", label: "Đánh giá Năng lực", Icon: HelpCircle },
          { id: "simulator", label: "Mô phỏng Trả góp", Icon: Calculator },
          { id: "quests", label: "Thử thách Hành vi", Icon: Target },
          { id: "lessons", label: "Sổ tay Vi mô", Icon: BookOpen },
        ].map(({ id, label, Icon }) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              style={{
                flex: 1, minWidth: 70, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 5, padding: "8px 6px", borderRadius: 9, border: "none", cursor: "pointer",
                background: active ? T.card : "transparent",
                color: active ? T.tealDark : T.inkSoft,
                fontWeight: active ? 700 : 500,
                fontSize: 11, transition: "all 0.15s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={14} color={active ? T.teal : T.inkSoft} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: BÀI TRẮC NGHIỆM ĐÁNH GIÁ NĂNG LỰC (QUIZ PRE/POST TEST) ── */}
      {subTab === "quiz" && (
        <div>
          {/* Huy hiệu điểm số đã làm trước đó nếu có */}
          {quizScore && (
            <div style={{
              background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12,
              padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", textTransform: "uppercase" }}>
                  Chỉ số Hiểu biết Tài chính (FLS) của bạn:
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#065F46", marginTop: 2 }}>
                  {quizScore.score}/{quizScore.total} Điểm — {quizScore.level}
                </div>
                <div style={{ fontSize: 10.5, color: "#059669", marginTop: 2 }}>
                  Đánh giá gần nhất: {quizScore.date}
                </div>
              </div>
              <button
                onClick={handleRetakeQuiz}
                style={{
                  background: "#fff", border: "1px solid #A7F3D0", borderRadius: 8,
                  padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#065F46",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}
              >
                <RefreshCw size={12} /> Làm lại bài
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {QUIZ_QUESTIONS.map((q, idx) => {
              const selectedOpt = quizAnswers[q.id];
              return (
                <div key={q.id} style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
                  padding: "14px 16px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: T.teal + "1A", color: T.teal,
                      padding: "2px 8px", borderRadius: 10
                    }}>
                      Câu {idx + 1}: {q.topic}
                    </span>
                    {isQuizSubmitted && (
                      <span style={{ fontSize: 11, fontWeight: 700 }}>
                        {selectedOpt === q.options.find((o) => o.isCorrect)?.id ? (
                          <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: 3 }}>
                            <CheckCircle2 size={13} /> Đúng
                          </span>
                        ) : (
                          <span style={{ color: "#DC2626", display: "flex", alignItems: "center", gap: 3 }}>
                            <XCircle size={13} /> Sai
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10, lineHeight: 1.45 }}>
                    {q.question}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((opt) => {
                      const isSelected = selectedOpt === opt.id;
                      let btnBg = isSelected ? T.teal + "15" : "#fff";
                      let btnBorder = isSelected ? T.teal : T.border;
                      let textColor = isSelected ? T.tealDark : T.ink;

                      if (isQuizSubmitted) {
                        if (opt.isCorrect) {
                          btnBg = "#D1FAE5";
                          btnBorder = "#10B981";
                          textColor = "#065F46";
                        } else if (isSelected && !opt.isCorrect) {
                          btnBg = "#FEE2E2";
                          btnBorder = "#EF4444";
                          textColor = "#991B1B";
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isQuizSubmitted}
                          onClick={() => handleSelectAnswer(q.id, opt.id)}
                          style={{
                            textAlign: "left", padding: "9px 12px", borderRadius: 9,
                            border: `1.5px solid ${btnBorder}`, background: btnBg,
                            color: textColor, cursor: isQuizSubmitted ? "default" : "pointer",
                            fontSize: 12, lineHeight: 1.4, display: "flex", gap: 8, alignItems: "flex-start",
                            transition: "all 0.12s ease"
                          }}
                        >
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%", background: isSelected ? T.teal : T.border,
                            color: isSelected ? "#fff" : T.inkSoft, fontSize: 10.5, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1
                          }}>
                            {opt.id}
                          </span>
                          <span style={{ flex: 1 }}>{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Giải thích sư phạm chi tiết sau khi nộp bài */}
                  {isQuizSubmitted && (
                    <div style={{
                      marginTop: 10, padding: "9px 12px", background: "#F8FAFC",
                      borderLeft: `3px solid ${T.teal}`, borderRadius: 6, fontSize: 11.5,
                      color: T.inkSoft, lineHeight: 1.45
                    }}>
                      <div style={{ fontWeight: 700, color: T.tealDark, marginBottom: 2 }}>💡 Giải thích sư phạm:</div>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            {!isQuizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  background: Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length ? T.teal : T.border,
                  color: "#fff", border: "none", fontSize: 13.5, fontWeight: 700,
                  cursor: Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length ? "pointer" : "not-allowed",
                  boxShadow: "0 4px 12px rgba(31,111,99,0.25)"
                }}
              >
                {Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length
                  ? `Vui lòng trả lời đủ ${QUIZ_QUESTIONS.length} câu (đã chọn ${Object.keys(quizAnswers).length}/${QUIZ_QUESTIONS.length})`
                  : "Chấm điểm & Đánh giá Năng lực Tài chính"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleRetakeQuiz}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, background: T.card,
                    border: `1px solid ${T.border}`, color: T.ink, fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Làm lại bài kiểm tra
                </button>
                <button
                  onClick={() => onAsk("Tuấn nhận xét bài kiểm tra năng lực tài chính vừa rồi của mình và gợi ý thêm cách rèn luyện nhé!")}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 10, background: T.teal,
                    border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  <Sparkles size={14} /> Hỏi Tuấn nhận xét
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: MÔ PHỎNG TÀI CHÍNH (SIMULATOR TRẢ GÓP & CƠ HỘI) ── */}
      {subTab === "simulator" && (
        <div>
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
            padding: "16px", marginBottom: 14
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.tealDark, marginBottom: 4 }}>
              Giả lập Chi phí Thực tế khi Mua Trả Góp
            </div>
            <p style={{ fontSize: 11.5, color: T.inkSoft, margin: "0 0 14px", lineHeight: 1.45 }}>
              Sinh viên thường bị hấp dẫn bởi số tiền chia nhỏ hàng tháng mà không nhận ra tổng số tiền lãi và phí bảo hiểm phải gánh. Hãy thử nhập số liệu dưới đây:
            </p>

            {/* Nhập giá trị món đồ */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.ink, display: "block", marginBottom: 4 }}>
                Giá món đồ bạn định mua (Laptop / Điện thoại):
              </label>
              <input
                type="text"
                value={formatThousands(itemPrice)}
                onChange={(e) => setItemPrice(String(parseThousands(e.target.value) || 0))}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9,
                  border: `1px solid ${T.border}`, background: "#fff", fontSize: 14, fontWeight: 700,
                  color: T.ink
                }}
              />
              <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                {[5000000, 10000000, 15000000, 20000000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setItemPrice(String(quick))}
                    style={{
                      background: T.paper, border: `1px solid ${T.border}`, borderRadius: 6,
                      padding: "3px 8px", fontSize: 10.5, fontWeight: 600, color: T.inkSoft, cursor: "pointer"
                    }}
                  >
                    {quick / 1000000} triệu
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn số tháng trả góp */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: T.ink, display: "block", marginBottom: 4 }}>
                Kỳ hạn trả góp:
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[3, 6, 9, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${months === m ? T.teal : T.border}`,
                      background: months === m ? T.teal + "15" : "#fff",
                      color: months === m ? T.teal : T.inkSoft, cursor: "pointer"
                    }}
                  >
                    {m} tháng
                  </button>
                ))}
              </div>
            </div>

            {/* Lãi suất & phí ước tính mỗi tháng */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                <span>Lãi suất + Phí bảo hiểm vay:</span>
                <span style={{ color: T.goldDark, fontWeight: 700 }}>{interestRate}% / tháng</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: T.teal }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: T.inkSoft }}>
                <span>0% (Miễn lãi thật)</span>
                <span>2.5% (Phổ biến thị trường)</span>
                <span>5% (Vay tín chấp cao)</span>
              </div>
            </div>

            {/* Kết quả tính toán mô phỏng */}
            {simResult && (
              <div style={{
                background: "#F8FAFC", border: `1px solid ${T.border}`, borderRadius: 12,
                padding: "14px", marginTop: 12
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: T.inkSoft }}>Mỗi tháng phải trả:</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.tealDark }}>
                      {fmtVND(simResult.monthlyPayment)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: T.inkSoft }}>Tổng số tiền thực trả:</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>
                      {fmtVND(simResult.totalAmount)}
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 10, marginBottom: 12
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B" }}>
                    🔥 Tổng tiền chênh lệch (Lãi + Phí phụ): {fmtVND(simResult.totalFee)}
                  </div>
                  <div style={{ fontSize: 11, color: "#7F1D1D", marginTop: 4, lineHeight: 1.45 }}>
                    Món đồ giá gốc <strong>{fmtVND(simResult.principal)}</strong> nhưng bạn phải chi thêm <strong>{fmtVND(simResult.totalFee)}</strong> chỉ để có nó sớm hơn vài tháng!
                  </div>
                </div>

                {/* Thước đo quy đổi sư phạm */}
                <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.tealDark, marginBottom: 6, textTransform: "uppercase" }}>
                    🎓 Quy đổi Cơ hội Sư phạm Sinh viên:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11.5, color: T.ink }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🧋 Bằng khoảng:</span>
                      <strong>{simResult.bobaCups} cốc trà sữa</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>⏱️ Tương đương:</span>
                      <strong style={{ color: "#B45309" }}>{simResult.parttimeHours} giờ làm thêm bưng bê (22k/h)</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🍲 Đủ tiền ăn trọ trong:</span>
                      <strong>{simResult.mealDays} ngày sinh hoạt cơ bản</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: THỬ THÁCH RÈN LUYỆN HÀNH VI (BEHAVIORAL QUESTS) ── */}
      {subTab === "quests" && (
        <div>
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
            padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.tealDark }}>
                Tiến độ Chinh phục Thử thách
              </div>
              <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
                Đã hoàn thành {completedQuestCount}/{quests.length} nhiệm vụ kỷ luật
              </div>
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: T.gold + "22",
              border: `2px solid ${T.gold}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.goldDark, fontWeight: 700, fontSize: 13
            }}>
              <Trophy size={18} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quests.map((q) => {
              const isDone = q.status === "completed";
              const isInProgress = q.status === "in_progress";
              return (
                <div
                  key={q.id}
                  style={{
                    background: isDone ? "#F0FDF4" : isInProgress ? "#FFFBEB" : T.card,
                    border: `1.5px solid ${isDone ? "#86EFAC" : isInProgress ? "#FDE68A" : T.border}`,
                    borderRadius: 14, padding: "14px 16px", transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: isDone ? "#166534" : T.ink }}>
                      {q.title}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                      background: isDone ? "#DCFCE7" : isInProgress ? "#FEF3C7" : T.border,
                      color: isDone ? "#166534" : isInProgress ? "#92400E" : T.inkSoft
                    }}>
                      {isDone ? "Đã đạt được" : isInProgress ? "Đang rèn luyện" : "Chưa nhận"}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: T.inkSoft, margin: "0 0 8px", lineHeight: 1.45 }}>
                    {q.desc}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.inkSoft, marginBottom: 10 }}>
                    <span>⏳ Mục tiêu: <strong>{q.target}</strong></span>
                    <span style={{ color: "#059669", fontWeight: 600 }}>💰 Tiết kiệm: {q.savingsEstimate}</span>
                  </div>

                  <button
                    onClick={() => toggleQuestStatus(q.id)}
                    style={{
                      width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                      border: "none", cursor: "pointer",
                      background: isDone ? "#166534" : isInProgress ? "#D97706" : T.teal,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                    }}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 size={14} /> Chúc mừng! Bấm để làm lại
                      </>
                    ) : isInProgress ? (
                      <>
                        <CheckCircle2 size={14} /> Xác nhận đã hoàn thành!
                      </>
                    ) : (
                      <>
                        <Target size={14} /> Nhận thử thách ngay
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: SỔ TAY BÀI HỌC VI MÔ (MICRO-LEARNING) ── */}
      {subTab === "lessons" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LESSON_ARTICLES.map((article) => {
            const isExpanded = activeLesson === article.id;
            return (
              <div
                key={article.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
                  padding: "14px 16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                    background: T.teal + "1A", color: T.teal
                  }}>
                    {article.tag}
                  </span>
                </div>

                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 4 }}>
                  {article.title}
                </div>

                <p style={{ fontSize: 12, color: T.inkSoft, margin: "0 0 10px", lineHeight: 1.45 }}>
                  {article.summary}
                </p>

                {isExpanded && (
                  <div style={{
                    padding: "10px 12px", background: "#F8FAFC", borderRadius: 8,
                    borderLeft: `3px solid ${T.teal}`, fontSize: 12, color: T.ink,
                    lineHeight: 1.5, marginBottom: 10
                  }}>
                    {article.content}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setActiveLesson(isExpanded ? null : article.id)}
                    style={{
                      flex: 1, padding: "7px 10px", borderRadius: 8,
                      border: `1px solid ${T.border}`, background: "#fff",
                      fontSize: 11.5, fontWeight: 600, color: T.inkSoft, cursor: "pointer"
                    }}
                  >
                    {isExpanded ? "Thu gọn" : "Đọc chi tiết"}
                  </button>
                  <button
                    onClick={() => onAsk(article.prompt)}
                    style={{
                      flex: 1, padding: "7px 10px", borderRadius: 8,
                      border: "none", background: T.teal,
                      fontSize: 11.5, fontWeight: 600, color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                    }}
                  >
                    <Sparkles size={12} /> Hỏi Tuấn thêm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
