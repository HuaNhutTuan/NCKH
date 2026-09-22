import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Send, MessageCircle,
  PiggyBank, AlertTriangle, X, Trash2, GraduationCap, Sparkles,
  Utensils, Bus, BookOpen, Gamepad2, Home, ShoppingBag, HeartPulse,
  MoreHorizontal, Coins, ChevronRight, ChevronLeft, Lightbulb, Target, CheckCircle2, LogOut,
  Mic, MicOff, Camera, Type, Loader2, Users, Edit3, ImagePlus, Wand2,
  ShieldCheck, ShieldAlert, Settings, Calendar, Info, Search,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { transactionsApi, budgetsApi, chatApi, multimodalApi, settingsApi, knowledgeApi } from "./api";

// ---------- Design tokens (ledger / student notebook theme) ----------
const T = {
  paper: "#F1EEE3",
  paperLine: "#DAD5C4",
  ink: "#20302C",
  inkSoft: "#5B6660",
  teal: "#1F6F63",
  tealDark: "#123F38",
  gold: "#D9A441",
  goldDark: "#8C6620",
  brick: "#AE4C3B",
  card: "#FBFAF4",
  border: "#D9D3C1",
};

const EXPENSE_CATS = [
  { id: "food", label: "Ăn uống", color: "#AE4C3B", Icon: Utensils },
  { id: "transport", label: "Di chuyển", color: "#3E7CA6", Icon: Bus },
  { id: "study", label: "Học tập", color: "#1F6F63", Icon: BookOpen },
  { id: "entertainment", label: "Giải trí", color: "#8B5FBF", Icon: Gamepad2 },
  { id: "housing", label: "Nhà ở", color: "#D9A441", Icon: Home },
  { id: "shopping", label: "Mua sắm", color: "#C97A4A", Icon: ShoppingBag },
  { id: "health", label: "Sức khỏe", color: "#4C8C63", Icon: HeartPulse },
  { id: "other", label: "Khác", color: "#8A8778", Icon: MoreHorizontal },
];

const INCOME_CATS = [
  { id: "scholarship", label: "Học bổng", color: "#1F6F63", Icon: GraduationCap },
  { id: "allowance", label: "Trợ cấp gia đình", color: "#D9A441", Icon: Wallet },
  { id: "parttime", label: "Làm thêm", color: "#4C8C63", Icon: Coins },
  { id: "other_income", label: "Khác", color: "#8A8778", Icon: MoreHorizontal },
];

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];
const catMeta = (id) => ALL_CATS.find((c) => c.id === id) || EXPENSE_CATS[7];

const fmtVND = (n) =>
  Math.round(n).toLocaleString("vi-VN") + " đ";

const todayStr = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

function formatDateVN(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    // Nếu là chuỗi ISO từ server (có T như 2026-09-10T17:00:00.000Z)
    if (dateInput.includes("T")) {
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d);
      }
    }
    // Nếu là dạng chuỗi chuẩn YYYY-MM-DD
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }
  return String(dateInput);
}

const monthKey = (d) => {
  if (!d) return "";
  if (typeof d === "string" && d.includes("T")) {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) {
      const vnStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(dt);
      return vnStr.slice(0, 7);
    }
  }
  return String(d).slice(0, 7);
};
const THIS_MONTH = monthKey(todayStr());

const LESSONS = [
  { title: "Quy tắc 50/30/20 cho sinh viên", desc: "50% chi tiêu thiết yếu, 30% mong muốn, 20% tiết kiệm — cách chia thu nhập đơn giản để không bao giờ cháy túi.", tag: "Ngân sách" },
  { title: "Quỹ khẩn cấp là gì?", desc: "Một khoản tiền nhỏ dự phòng (1-3 triệu) giúp bạn không vay nóng khi xe hỏng hay ốm đau đột xuất.", tag: "Tiết kiệm" },
  { title: "Lãi kép hoạt động thế nào?", desc: "Tiền sinh lời rồi lời lại sinh lời tiếp. Gửi tiết kiệm sớm, dù ít, vẫn tạo khác biệt lớn sau nhiều năm.", tag: "Đầu tư" },
  { title: "Bẫy nợ thẻ tín dụng sinh viên", desc: "Lãi suất trả chậm có thể lên đến 20-40%/năm. Chỉ quẹt thẻ khi chắc chắn trả đủ trước hạn.", tag: "Nợ" },
  { title: "Theo dõi chi tiêu 7 ngày", desc: "Ghi lại mọi khoản chi trong một tuần — hầu hết mọi người bất ngờ vì các khoản nhỏ lặt vặt cộng lại rất nhiều.", tag: "Thói quen" },
];

const TIP_OF_DAY = "Trước khi mua món gì trên 200.000đ, hãy đợi 24 giờ. Nếu vẫn muốn mua sau một ngày, đó có thể là nhu cầu thật.";

const SUGGESTED_PROMPTS = [
  "Làm sao để giảm tiền ăn uống mỗi tháng?",
  "Giải thích lãi kép cho mình như mình 10 tuổi",
  "Đánh giá chi tiêu tháng này của mình",
  "Sinh viên nên tiết kiệm bao nhiêu phần trăm thu nhập?",
];

// ---------- small UI atoms ----------
function IconBadge({ Icon, color, size = 36 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 10,
        background: color + "22", color, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <Icon size={size * 0.52} strokeWidth={2} />
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div style={{ background: "#E7E2D2", borderRadius: 6, height: 8, overflow: "hidden" }}>
      <div
        style={{
          width: pct + "%", height: "100%",
          background: over ? T.brick : color,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

export default function LocApp() {
  const { token, user, logout } = useAuth();
  const [tab, setTab] = useState("home");
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [userSettings, setUserSettings] = useState({ payday_day: 1, emergency_reserve: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [initialAddTab, setInitialAddTab] = useState("manual");
  const [form, setForm] = useState({ type: "expense", cat: "food", amount: "", note: "", date: todayStr() });

  // Tải giao dịch + ngân sách + cài đặt Safe-to-Spend của tài khoản đang đăng nhập
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    Promise.all([transactionsApi.list(token), budgetsApi.list(token), settingsApi.get(token)])
      .then(([txData, budgetData, settingsData]) => {
        if (cancelled) return;
        setTransactions(
          txData.transactions.map((t) => {
            let cleanDate = t.date;
            if (typeof cleanDate === "string" && cleanDate.includes("T")) {
              const d = new Date(cleanDate);
              if (!isNaN(d.getTime())) {
                cleanDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
              }
            }
            return { ...t, cat: t.category, amount: Number(t.amount), date: cleanDate };
          })
        );
        setBudgets(budgetData.budgets);
        if (settingsData?.settings) {
          setUserSettings(settingsData.settings);
        }
      })
      .catch((err) => console.error("Không thể tải dữ liệu:", err.message))
      .finally(() => !cancelled && setDataLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Chào bạn, mình là Tuấn — trợ lý tài chính dành cho sinh viên. Mình có thể giúp bạn lập ngân sách, hiểu các khái niệm tài chính, hoặc nhận xét về chi tiêu tháng này. Bạn muốn bắt đầu từ đâu?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // ---------- derived stats ----------
  const stats = useMemo(() => {
    const monthTx = transactions.filter((t) => monthKey(t.date) === THIS_MONTH);
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const byCat = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      byCat[t.cat] = (byCat[t.cat] || 0) + t.amount;
    });
    const balance = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
    return { income, expense, byCat, balance, monthTx };
  }, [transactions]);

  const pieData = Object.entries(stats.byCat).map(([id, val]) => ({
    name: catMeta(id).label, value: val, color: catMeta(id).color,
  }));

  const overBudgetCats = Object.entries(budgets)
    .filter(([id, limit]) => (stats.byCat[id] || 0) > limit)
    .map(([id]) => catMeta(id).label);

  // ---------- Safe-to-Spend (Hạn mức hàng ngày cho sinh viên) ----------
  const safeToSpend = useMemo(() => {
    const todayObj = new Date();
    const currentDay = todayObj.getDate();
    const currentYear = todayObj.getFullYear();
    const currentMonth = todayObj.getMonth();

    const payday = userSettings?.payday_day || 1;
    const emergencyReserve = Number(userSettings?.emergency_reserve) || 0;

    // Tính ngày nhận trợ cấp / lương tiếp theo
    let nextPayday;
    if (currentDay < payday) {
      nextPayday = new Date(currentYear, currentMonth, payday);
    } else {
      nextPayday = new Date(currentYear, currentMonth + 1, payday);
    }

    const startOfToday = new Date(currentYear, currentMonth, currentDay);
    const diffMs = nextPayday.getTime() - startOfToday.getTime();
    const daysRemaining = Math.max(1, Math.round(diffMs / (1000 * 3600 * 24)));

    const today = todayStr();
    const todayExpenses = transactions
      .filter((t) => t.type === "expense" && t.date === today)
      .reduce((s, t) => s + t.amount, 0);

    // Tiền khả dụng = Số dư - Quỹ dự phòng khẩn cấp
    const usableBalance = Math.max(0, stats.balance - emergencyReserve);
    // Tổng ngân sách phân bổ cho các ngày còn lại của chu kỳ (đã cộng lại khoản chi hôm nay)
    const totalAllocated = usableBalance + todayExpenses;
    const dailyLimit = Math.max(0, Math.round(totalAllocated / daysRemaining));
    const remainingToday = dailyLimit - todayExpenses;
    const isOverBudget = remainingToday < 0;
    const overAmount = isOverBudget ? Math.abs(remainingToday) : 0;
    const percentSpent = dailyLimit > 0 ? Math.min(100, Math.round((todayExpenses / dailyLimit) * 100)) : (todayExpenses > 0 ? 100 : 0);

    const nextPaydayStr = `${String(nextPayday.getDate()).padStart(2, "0")}/${String(nextPayday.getMonth() + 1).padStart(2, "0")}`;

    return {
      dailyLimit,
      todayExpenses,
      remainingToday,
      isOverBudget,
      overAmount,
      percentSpent,
      daysRemaining,
      nextPaydayStr,
      emergencyReserve,
      payday,
    };
  }, [transactions, stats.balance, userSettings]);

  // ---------- actions ----------
  async function updateSettings(newSettings) {
    try {
      const res = await settingsApi.update(token, newSettings);
      setUserSettings(res.settings);
      setShowSettings(false);
    } catch (err) {
      alert("Không thể lưu cài đặt: " + err.message);
    }
  }

  async function addTransaction() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    const payload = {
      type: form.type,
      category: form.cat,
      amount: amt,
      note: form.note || "(không ghi chú)",
      date: form.date,
    };
    try {
      const { transaction } = await transactionsApi.create(token, payload);
      setTransactions((prev) => [{ ...transaction, cat: transaction.category }, ...prev]);
      setForm({ type: "expense", cat: "food", amount: "", note: "", date: todayStr() });
      setShowAdd(false);
    } catch (err) {
      alert(err.message);
    }
  }

  // Lưu nhiều giao dịch cùng lúc (từ kết quả AI)
  async function addMultipleTransactions(txList) {
    const results = [];
    for (const tx of txList) {
      try {
        const payload = {
          type: tx.type,
          category: tx.category,
          amount: tx.amount,
          note: tx.note || "(không ghi chú)",
          date: tx.date,
        };
        const { transaction } = await transactionsApi.create(token, payload);
        results.push({ ...transaction, cat: transaction.category });
      } catch (err) {
        console.error("Lỗi lưu giao dịch:", err.message);
      }
    }
    if (results.length > 0) {
      setTransactions((prev) => [...results.reverse(), ...prev]);
      setShowAdd(false);
    }
  }

  async function deleteTx(id) {
    try {
      await transactionsApi.remove(token, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateBudget(category, limit) {
    try {
      await budgetsApi.update(token, category, limit);
      setBudgets((prev) => ({ ...prev, [category]: limit }));
    } catch (err) {
      alert(err.message);
    }
  }

  async function sendChat(textOverride) {
    const text = (textOverride ?? chatInput).trim();
    if (!text || chatLoading) return;
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    const topCats = Object.entries(stats.byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, val]) => `${catMeta(id).label}: ${fmtVND(val)}`)
      .join(", ");

    const systemPrompt = `Bạn là "Tuấn", một trợ lý AI đồng hành giáo dục tài chính cá nhân dành riêng cho sinh viên Việt Nam, tích hợp trong ứng dụng quản lý chi tiêu.
Phong cách: gần gũi, khích lệ, nói tiếng Việt tự nhiên, ngắn gọn (dưới 150 từ trừ khi được yêu cầu chi tiết), dùng ví dụ cụ thể, không phán xét.
Mục tiêu: dạy kiến thức tài chính nền tảng (ngân sách, tiết kiệm, nợ, lãi suất, thói quen chi tiêu) và đưa lời khuyên thực tế phù hợp với thu nhập sinh viên (thường thấp, không ổn định).
Không đưa lời khuyên đầu tư cụ thể (không gợi ý mã cổ phiếu, tiền mã hoá cụ thể) hay tư vấn pháp lý/thuế; nếu được hỏi, hãy giải thích khái niệm chung và khuyên tìm chuyên gia.
Dữ liệu tài chính hiện tại của người dùng trong tháng này: Thu nhập ${fmtVND(stats.income)}, Chi tiêu ${fmtVND(stats.expense)}, Số dư hiện tại ${fmtVND(stats.balance)}. Top danh mục chi tiêu: ${topCats || "chưa có dữ liệu"}. ${overBudgetCats.length ? "Đã vượt ngân sách ở: " + overBudgetCats.join(", ") + "." : "Chưa vượt ngân sách nào."}
Hãy dùng dữ liệu này khi có liên quan để đưa ra lời khuyên cá nhân hoá, nhưng đừng liệt kê lại toàn bộ số liệu nếu người dùng không hỏi trực tiếp.`;

    let hasAddedBotMsg = false;

    try {
      // Dùng streaming để chữ hiển thị tức thì sau ~0.5s theo thời gian thực
      await chatApi.sendStream(
        token,
        { messages: nextMessages, systemPrompt },
        (chunk, fullText) => {
          if (!hasAddedBotMsg) {
            hasAddedBotMsg = true;
            setMessages((prev) => [...prev, { role: "assistant", text: fullText }]);
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", text: fullText };
              return updated;
            });
          }
        }
      );
    } catch (streamErr) {
      console.warn("Lỗi stream, chuyển sang gọi API thường:", streamErr.message);
      // Fallback gọi API thường nếu stream gặp trục trặc
      if (!hasAddedBotMsg) {
        try {
          const data = await chatApi.send(token, { messages: nextMessages, systemPrompt });
          const reply = data.reply || "Xin lỗi, mình chưa nhận được phản hồi rõ ràng. Bạn thử hỏi lại nhé.";
          setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        } catch (fallbackErr) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: fallbackErr.message || "Có lỗi kết nối, bạn thử gửi lại tin nhắn nhé." },
          ]);
        }
      }
    } finally {
      setChatLoading(false);
    }
  }

  const NAV = [
    { id: "home", label: "Tổng quan", Icon: Wallet },
    { id: "transactions", label: "Giao dịch", Icon: TrendingUp },
    { id: "budget", label: "Ngân sách", Icon: PiggyBank },
    { id: "learn", label: "Học", Icon: BookOpen },
    { id: "chat", label: "Trợ lý AI", Icon: MessageCircle },
  ];

  return (
    <div style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", color: T.ink, minHeight: 640, display: "flex", justifyContent: "center", background: "transparent" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .loc-shell { font-family: 'Inter', sans-serif; }
        .loc-shell * { box-sizing: border-box; }
        .loc-scroll::-webkit-scrollbar { width: 6px; }
        .loc-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        .ledger-row { border-bottom: 1px solid ${T.paperLine}; }
        .ledger-row:last-child { border-bottom: none; }
        .send-btn:disabled { opacity: .45; cursor: default; }
        input, select, textarea { font-family: inherit; }
      `}</style>

      <div
        className="loc-shell"
        style={{
          width: 420, maxWidth: "100%", minHeight: 640, background: T.paper,
          borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column",
          border: `1px solid ${T.border}`, position: "relative",
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${T.paperLine} 28px)`,
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.paper }}>
          <div>
            <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 500, letterSpacing: 0.2 }}>Xin chào, {user?.name || "bạn"}</div>
            <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark }}>Tuấn — Ví sinh viên</div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="btn-logout"
            style={{ width: 38, height: 38, borderRadius: "50%", background: T.gold, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <LogOut size={16} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div className="loc-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 20px 90px" }}>
          {dataLoading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.inkSoft, fontSize: 13 }}>Đang tải dữ liệu của bạn...</div>
          )}
          {!dataLoading && tab === "home" && (
            <HomeTab
              stats={stats}
              pieData={pieData}
              overBudgetCats={overBudgetCats}
              onAdd={() => { setInitialAddTab("manual"); setShowAdd(true); }}
              onOpenVoice={() => { setInitialAddTab("voice"); setShowAdd(true); }}
              transactions={transactions}
              safeToSpend={safeToSpend}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}
          {!dataLoading && tab === "transactions" && (
            <TransactionsTab transactions={transactions} onDelete={deleteTx} onAdd={() => { setInitialAddTab("manual"); setShowAdd(true); }} />
          )}
          {!dataLoading && tab === "budget" && (
            <BudgetTab
              budgets={budgets}
              onUpdateBudget={updateBudget}
              byCat={stats.byCat}
              userSettings={userSettings}
              onUpdateSettings={updateSettings}
              safeToSpend={safeToSpend}
            />
          )}
          {!dataLoading && tab === "learn" && <LearnTab onAsk={(q) => { setTab("chat"); sendChat(q); }} />}
          {!dataLoading && tab === "chat" && (
            <ChatTab
              messages={messages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatLoading={chatLoading}
              sendChat={sendChat}
              chatEndRef={chatEndRef}
              user={user}
              token={token}
            />
          )}
        </div>

        {/* Bottom nav */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, background: T.card,
          borderTop: `1px solid ${T.border}`, display: "flex", padding: "8px 4px",
        }}>
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                className={`tab-btn ${active ? "active" : ""}`}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "6px 2px", color: active ? T.teal : T.inkSoft,
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>

        {showAdd && (
          <AddTxModal
            form={form}
            setForm={setForm}
            onClose={() => setShowAdd(false)}
            onSubmit={addTransaction}
            token={token}
            onSaveMultiple={addMultipleTransactions}
            safeToSpend={safeToSpend}
            initialTab={initialAddTab}
          />
        )}

        {showSettings && (
          <SafeToSpendSettingsModal
            userSettings={userSettings}
            onClose={() => setShowSettings(false)}
            onSave={updateSettings}
            safeToSpend={safeToSpend}
          />
        )}
      </div>
    </div>
  );
}

// ---------------- Home ----------------
function HomeTab({ stats, pieData, overBudgetCats, onAdd, onOpenVoice, transactions, safeToSpend, onOpenSettings }) {
  const recent = transactions.slice(0, 4);

  // ---------- Period filter for pie chart ----------
  const [period, setPeriod] = useState("month"); // "week" | "month" | "year"
  const [offset, setOffset] = useState(0); // 0 = current, -1 = previous, etc.

  const filteredPieData = useMemo(() => {
    const today = new Date();
    let filtered;
    if (period === "week") {
      // Start of current week (Monday-based), shifted by offset weeks
      const startOfWeek = new Date(today);
      const day = today.getDay(); // 0=Sun
      startOfWeek.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= startOfWeek && d <= endOfWeek;
      });
    } else if (period === "month") {
      const targetYear = today.getFullYear() + Math.floor((today.getMonth() + offset) / 12);
      const targetMonth = ((today.getMonth() + offset) % 12 + 12) % 12;
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });
    } else {
      // year
      const targetYear = today.getFullYear() + offset;
      filtered = transactions.filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getFullYear() === targetYear;
      });
    }
    const byCat = {};
    filtered.forEach((t) => { byCat[t.cat] = (byCat[t.cat] || 0) + t.amount; });
    return Object.entries(byCat).map(([id, val]) => ({
      name: catMeta(id).label, value: val, color: catMeta(id).color,
    }));
  }, [period, offset, transactions]);

  // Label for current period window
  const periodLabel = useMemo(() => {
    const today = new Date();
    if (period === "week") {
      const startOfWeek = new Date(today);
      const day = today.getDay();
      startOfWeek.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
      return offset === 0 ? "Tuần này" : `${fmt(startOfWeek)}–${fmt(endOfWeek)}`;
    } else if (period === "month") {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      if (offset === 0) return "Tháng này";
      return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    } else {
      const yr = today.getFullYear() + offset;
      return offset === 0 ? "Năm nay" : `Năm ${yr}`;
    }
  }, [period, offset]);

  return (
    <div>
      <div style={{
        marginTop: 10, background: T.tealDark, borderRadius: 16, padding: "18px 20px",
        color: "#F1EEE3", position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 500 }}>Số dư hiện tại</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", marginTop: 4 }}>
          {fmtVND(stats.balance)}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={14} color="#D9A441" />
            <span style={{ fontSize: 12.5, opacity: 0.9 }}>Thu: {fmtVND(stats.income)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingDown size={14} color="#E08D7A" />
            <span style={{ fontSize: 12.5, opacity: 0.9 }}>Chi: {fmtVND(stats.expense)}</span>
          </div>
        </div>
      </div>

      {/* Thẻ Hạn mức hôm nay (Safe-to-Spend) */}
      <div style={{
        marginTop: 12, background: T.card, borderRadius: 16, padding: "14px 16px",
        border: `1px solid ${safeToSpend?.isOverBudget ? T.brick : T.border}`,
        position: "relative"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {safeToSpend?.isOverBudget ? (
              <ShieldAlert size={17} color={T.brick} />
            ) : (
              <ShieldCheck size={17} color={T.teal} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: safeToSpend?.isOverBudget ? T.brick : T.tealDark }}>
              Hạn mức hôm nay (Safe-to-Spend)
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            title="Cài đặt kỳ nhận tiền & quỹ dự phòng"
            style={{
              display: "flex", alignItems: "center", gap: 3, background: "none",
              border: "none", cursor: "pointer", color: T.inkSoft, fontSize: 11, padding: "2px 4px"
            }}
          >
            <Settings size={12} />
            <span>Cài đặt</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
            color: safeToSpend?.isOverBudget ? T.brick : T.tealDark
          }}>
            {safeToSpend?.isOverBudget ? `-${fmtVND(safeToSpend.overAmount)}` : fmtVND(safeToSpend?.remainingToday || 0)}
          </span>
          <span style={{ fontSize: 11, color: safeToSpend?.isOverBudget ? T.brick : T.inkSoft, fontWeight: 500 }}>
            {safeToSpend?.isOverBudget ? "vượt hạn mức hôm nay!" : "còn được tiêu hôm nay"}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <ProgressBar
            value={safeToSpend?.todayExpenses || 0}
            max={safeToSpend?.dailyLimit || 1}
            color={safeToSpend?.percentSpent > 80 ? T.gold : T.teal}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.inkSoft }}>
          <span>Đã chi: <strong>{fmtVND(safeToSpend?.todayExpenses || 0)}</strong> / {fmtVND(safeToSpend?.dailyLimit || 0)}</span>
          <span>⏳ Còn <strong>{safeToSpend?.daysRemaining} ngày</strong> (ngày {safeToSpend?.nextPaydayStr})</span>
        </div>
      </div>

      {/* Cảnh báo nếu đã chi vượt hạn mức hôm nay */}
      {safeToSpend?.isOverBudget && (
        <div style={{
          marginTop: 10, background: "#FFF3F0", border: `1px solid ${T.brick}66`, borderRadius: 12,
          padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: "#7B2317", lineHeight: 1.4 }}>
            <strong>Nhắc nhở chi tiêu hôm nay:</strong> Bạn đã chi vượt hạn mức an toàn <strong>{fmtVND(safeToSpend.overAmount)}</strong>. Hãy tiết chế các khoản chi trong <strong>{safeToSpend.daysRemaining} ngày tới</strong> để tránh cạn ví trước ngày nhận trợ cấp/lương ({safeToSpend.nextPaydayStr})!
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={onAdd}
          className="btn-gold"
          style={{
            flex: 1.2, background: T.gold, color: "#3A2A08", border: "none",
            borderRadius: 12, padding: "11px 12px", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Plus size={16} /> Thêm giao dịch
        </button>
        <button
          onClick={onOpenVoice}
          style={{
            flex: 1, background: T.teal, color: "#fff", border: "none",
            borderRadius: 12, padding: "11px 12px", fontWeight: 600, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
          title="Nói để cộng/trừ trực tiếp vào giao dịch ngay lập tức"
        >
          <Mic size={16} /> Ghi bằng giọng nói
        </button>
      </div>

      {overBudgetCats.length > 0 && (
        <div style={{
          marginTop: 12, background: "#F4E3DE", border: `1px solid ${T.brick}55`, borderRadius: 12,
          padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#6E2E22" }}>
            Bạn đã vượt ngân sách ở: <strong>{overBudgetCats.join(", ")}</strong>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {/* Header: title + period pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.tealDark }}>Chi tiêu theo danh mục</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setOffset(0); }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: period === p ? T.tealDark : T.border,
                  color: period === p ? "#fff" : T.inkSoft,
                  transition: "all 0.15s",
                }}
              >
                {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-header: prev/next navigator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setOffset((o) => o - 1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: T.inkSoft, display: "flex" }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 500, color: T.inkSoft }}>{periodLabel}</span>
          <button onClick={() => setOffset((o) => Math.min(o + 1, 0))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: offset >= 0 ? T.border : T.inkSoft, display: "flex" }} disabled={offset >= 0}>
            <ChevronRight size={16} />
          </button>
        </div>

        {filteredPieData.length === 0 ? (
          <EmptyNote text={`Chưa có khoản chi nào ${period === "week" ? "trong tuần" : period === "month" ? "trong tháng" : "trong năm"} này.`} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 128, height: 128, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={filteredPieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={58} paddingAngle={2}>
                    {filteredPieData.map((d, i) => <Cell key={i} fill={d.color} stroke={T.paper} strokeWidth={2} />)}
                  </Pie>
                  <RTooltip formatter={(v) => fmtVND(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {[...filteredPieData].sort((a, b) => b.value - a.value).slice(0, 5).map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: T.inkSoft }}>{d.name}</span>
                  <span style={{ fontWeight: 600 }}>{fmtVND(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 22, marginBottom: 8 }}>
        <SectionTitle label="Giao dịch gần đây" />
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {recent.map((t) => <TxRow key={t.id} t={t} />)}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: T.tealDark, marginBottom: 10 }}>{label}</div>;
}

function EmptyNote({ text }) {
  return <div style={{ fontSize: 12.5, color: T.inkSoft, fontStyle: "italic", padding: "8px 0" }}>{text}</div>;
}

function TxRow({ t, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const meta = catMeta(t.cat);
  const noteText = (t.note || "").trim() || meta.label;
  return (
    <div
      className="ledger-row"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderBottom: `1px solid ${T.paperLine}`,
      }}
    >
      <IconBadge Icon={meta.Icon} color={meta.color} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: T.ink }}>
          {noteText}
        </div>
        <div style={{ fontSize: 10.5, color: T.inkSoft, marginTop: 1 }}>
          {meta.label} · {formatDateVN(t.date)}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.type === "income" ? T.teal : T.brick, flexShrink: 0, marginLeft: 4 }}>
        {t.type === "income" ? "+" : "-"}{fmtVND(t.amount)}
      </div>
      {onDelete && (
        confirmDel ? (
          <div style={{ display: "flex", gap: 3, flexShrink: 0, marginLeft: 4 }}>
            <button
              onClick={() => onDelete(t.id)}
              style={{ background: T.brick, color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
            >
              Xóa
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              style={{ background: T.paperLine, color: T.inkSoft, border: "none", borderRadius: 6, padding: "3px 7px", fontSize: 10.5, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            className="btn-delete"
            title="Xóa giao dịch"
            style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 2 }}
          >
            <Trash2 size={13} />
          </button>
        )
      )}
    </div>
  );
}

// ---------------- Date Helpers for Transactions ----------------
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekRange(refDate) {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const day = d.getDay(); // 0: Chủ Nhật, 1: Thứ Hai ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = toISODate(monday);
  const endDate = toISODate(sunday);
  const label = `${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
  return { startDate, endDate, label };
}

function isSamePeriod(period, refDate) {
  const now = new Date();
  if (period === "week") {
    const { startDate, endDate } = getWeekRange(now);
    const ref = toISODate(refDate);
    return ref >= startDate && ref <= endDate;
  }
  if (period === "month") {
    return now.getFullYear() === refDate.getFullYear() && now.getMonth() === refDate.getMonth();
  }
  if (period === "year") {
    return now.getFullYear() === refDate.getFullYear();
  }
  return true;
}

// ---------------- Transactions ----------------
function TransactionsTab({ transactions, onDelete, onAdd }) {
  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(() => new Date());
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const PAGE_SIZE = 20;

  function handlePrev() {
    setCurrentPage(1);
    setRefDate((prev) => {
      const next = new Date(prev);
      if (period === "week") next.setDate(next.getDate() - 7);
      else if (period === "month") next.setMonth(next.getMonth() - 1);
      else if (period === "year") next.setFullYear(next.getFullYear() - 1);
      return next;
    });
  }

  function handleNext() {
    setCurrentPage(1);
    setRefDate((prev) => {
      const next = new Date(prev);
      if (period === "week") next.setDate(next.getDate() + 7);
      else if (period === "month") next.setMonth(next.getMonth() + 1);
      else if (period === "year") next.setFullYear(next.getFullYear() + 1);
      return next;
    });
  }

  function handleResetCurrent() {
    setCurrentPage(1);
    setRefDate(new Date());
  }

  function resetAllFilters() {
    setSelectedCat("all");
    setSearchKeyword("");
    setFilterType("all");
    setCurrentPage(1);
  }

  const periodLabel = useMemo(() => {
    if (period === "week") return getWeekRange(refDate).label;
    if (period === "month") return `Th.${refDate.getMonth() + 1}/${refDate.getFullYear()}`;
    if (period === "year") return `${refDate.getFullYear()}`;
    return "Tất cả";
  }, [period, refDate]);

  const isCurrent = isSamePeriod(period, refDate);

  const periodTransactions = useMemo(() => {
    let list = [...transactions];
    if (period === "week") {
      const { startDate, endDate } = getWeekRange(refDate);
      list = list.filter((t) => t.date >= startDate && t.date <= endDate);
    } else if (period === "month") {
      const monthPrefix = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}`;
      list = list.filter((t) => t.date.startsWith(monthPrefix));
    } else if (period === "year") {
      const yearPrefix = `${refDate.getFullYear()}-`;
      list = list.filter((t) => t.date.startsWith(yearPrefix));
    }
    return list;
  }, [transactions, period, refDate]);

  const periodStats = useMemo(() => {
    const income = periodTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = periodTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [periodTransactions]);

  const filtered = useMemo(() => {
    let list = [...periodTransactions];
    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (selectedCat !== "all") list = list.filter((t) => t.cat === selectedCat);
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter((t) =>
        (t.note || "").toLowerCase().includes(kw) ||
        String(t.amount).includes(kw) ||
        (t.date || "").includes(kw)
      );
    }
    return list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id || 0) - (a.id || 0)));
  }, [periodTransactions, filterType, selectedCat, searchKeyword]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (validCurrentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, validCurrentPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (validCurrentPage <= 3) pages.push(1, 2, 3, 4, "...", totalPages);
    else if (validCurrentPage >= totalPages - 2) pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    else pages.push(1, "...", validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, "...", totalPages);
    return pages;
  }, [totalPages, validCurrentPage]);

  const displayCats = filterType === "income" ? [
    { id: "scholarship", label: "Học bổng", color: "#1F6F63", Icon: GraduationCap },
    { id: "allowance",   label: "Trợ cấp",   color: "#D9A441", Icon: Wallet },
    { id: "parttime",    label: "Làm thêm",  color: "#4C8C63", Icon: Coins },
    { id: "other_income",label: "Khác",      color: "#8A8778", Icon: MoreHorizontal },
  ] : EXPENSE_CATS;

  const hasActiveFilter = selectedCat !== "all" || searchKeyword || filterType !== "all";

  // btn style helpers
  const navBtnStyle = {
    background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.ink, cursor: "pointer", padding: "3px 6px",
    display: "flex", alignItems: "center",
  };

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ── Row 1: Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.ink }}>
          Lịch sử giao dịch
        </div>
        <button
          onClick={onAdd}
          className="btn-teal"
          style={{
            background: T.teal, color: "#fff", border: "none", borderRadius: 8,
            padding: "6px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 6px rgba(31,111,99,0.2)",
          }}
        >
          <Plus size={14} /> Thêm
        </button>
      </div>

      {/* ── Row 2: Period tabs + navigation (1 dòng) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 3, background: T.paperLine, borderRadius: 8, padding: 3, flexShrink: 0 }}>
          {[
            { id: "week", label: "Tuần" },
            { id: "month", label: "Tháng" },
            { id: "year", label: "Năm" },
            { id: "all", label: "Tất cả" },
          ].map((tab) => {
            const active = period === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setPeriod(tab.id); setCurrentPage(1); }}
                style={{
                  padding: "4px 8px", fontSize: 11, fontWeight: active ? 700 : 500,
                  color: active ? "#fff" : T.inkSoft,
                  background: active ? T.teal : "transparent",
                  border: "none", borderRadius: 6, cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {period !== "all" && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "flex-end" }}>
            <button onClick={handlePrev} style={navBtnStyle}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk',sans-serif", whiteSpace: "nowrap" }}>
              {periodLabel}
            </span>
            {!isCurrent ? (
              <button onClick={handleResetCurrent} style={{ background: T.paperLine, border: "none", borderRadius: 4, fontSize: 9.5, fontWeight: 600, color: T.tealDark, padding: "2px 5px", cursor: "pointer" }}>
                Hiện tại
              </button>
            ) : (
              <span style={{ background: T.teal + "20", color: T.tealDark, borderRadius: 4, fontSize: 9.5, fontWeight: 600, padding: "2px 5px" }}>
                {period === "week" ? "Tuần này" : period === "month" ? "Tháng này" : "Năm nay"}
              </span>
            )}
            <button onClick={handleNext} style={navBtnStyle}><ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      {/* ── Row 3: Summary bar (1 dòng compact) ── */}
      <div style={{ display: "flex", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
        {[
          { label: "Tổng thu",  value: `+${fmtVND(periodStats.income)}`,  color: T.teal },
          { label: "Tổng chi",  value: `-${fmtVND(periodStats.expense)}`, color: T.brick },
          { label: "Còn lại",   value: `${periodStats.balance >= 0 ? "+" : ""}${fmtVND(periodStats.balance)}`, color: periodStats.balance >= 0 ? T.tealDark : T.brick },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "6px 8px", borderRight: i < 2 ? `1px solid ${T.border}` : "none", textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: T.inkSoft }}>{s.label}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk',sans-serif", marginTop: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Row 4: Search + Type filter (1 dòng) ── */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} color={T.inkSoft} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Tìm giao dịch..."
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
            style={{
              width: "100%", padding: "6px 26px 6px 26px",
              borderRadius: 8, border: `1px solid ${searchKeyword ? T.teal : T.border}`,
              fontSize: 12, background: T.card, color: T.ink, outline: "none",
              boxSizing: "border-box",
            }}
          />
          {searchKeyword && (
            <button onClick={() => { setSearchKeyword(""); setCurrentPage(1); }} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.inkSoft, display: "flex", alignItems: "center", padding: 1 }}>
              <X size={11} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
          {[
            { id: "all",     label: "Tất cả" },
            { id: "expense", label: "Chi" },
            { id: "income",  label: "Thu" },
          ].map((f) => {
            const active = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setFilterType(f.id); setSelectedCat("all"); setCurrentPage(1); }}
                style={{
                  background: active ? T.ink : "transparent",
                  color: active ? "#fff" : T.inkSoft,
                  border: `1px solid ${active ? T.ink : T.border}`,
                  borderRadius: 16, padding: "4px 9px",
                  fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Row 5: Category chips (cuộn ngang) ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {displayCats.map((c) => {
            const active = selectedCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedCat(active ? "all" : c.id); setCurrentPage(1); }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 20, flexShrink: 0,
                  border: active ? `1.5px solid ${c.color}` : `1px solid ${T.border}`,
                  background: active ? c.color + "15" : T.card,
                  cursor: "pointer", fontSize: 10.5,
                  color: active ? c.color : T.inkSoft,
                  fontWeight: active ? 700 : 500,
                  transition: "all 0.12s ease",
                }}
              >
                <c.Icon size={12} color={active ? c.color : T.inkSoft} strokeWidth={active ? 2.2 : 1.7} />
                {c.label}
              </button>
            );
          })}
        </div>
        {hasActiveFilter && (
          <button
            onClick={resetAllFilters}
            style={{ marginTop: 5, background: "none", border: "none", padding: 0, fontSize: 10.5, color: T.inkSoft, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
          >
            <X size={9} /> Bỏ tất cả bộ lọc
          </button>
        )}
      </div>

      {/* ── Đếm số giao dịch ── */}
      {totalItems > 0 && (
        <div style={{ fontSize: 10.5, color: T.inkSoft, marginBottom: 5 }}>
          {totalItems} giao dịch{hasActiveFilter ? " phù hợp" : ""}
        </div>
      )}

      {/* ── Danh sách giao dịch ── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
        {totalItems === 0 ? (
          <div style={{ padding: "20px 16px", textAlign: "center" }}>
            {hasActiveFilter ? (
              <div>
                <EmptyNote text="Không tìm thấy giao dịch phù hợp với bộ lọc." />
                <button
                  onClick={resetAllFilters}
                  style={{ marginTop: 8, background: T.teal, color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <EmptyNote text="Không có giao dịch nào trong khoảng thời gian này." />
            )}
          </div>
        ) : (
          paginatedTransactions.map((t) => <TxRow key={t.id} t={t} onDelete={onDelete} />)
        )}
      </div>

      {/* ── Phân trang (chỉ hiện khi > PAGE_SIZE) ── */}
      {totalItems > PAGE_SIZE && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, padding: "4px 0" }}>
          <div style={{ fontSize: 10.5, color: T.inkSoft }}>
            {(validCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(validCurrentPage * PAGE_SIZE, totalItems)} / {totalItems}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              style={{ ...navBtnStyle, padding: "3px 7px", fontSize: 11, color: validCurrentPage <= 1 ? "#bbb" : T.ink, cursor: validCurrentPage <= 1 ? "not-allowed" : "pointer", gap: 2 }}
            >
              <ChevronLeft size={12} /> Trước
            </button>
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`d-${idx}`} style={{ padding: "0 3px", color: T.inkSoft, fontSize: 11 }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  style={{
                    minWidth: 24, height: 24, borderRadius: 5,
                    border: p === validCurrentPage ? "none" : `1px solid ${T.border}`,
                    background: p === validCurrentPage ? T.teal : T.card,
                    color: p === validCurrentPage ? "#fff" : T.ink,
                    fontSize: 11, fontWeight: p === validCurrentPage ? 700 : 500,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              style={{ ...navBtnStyle, padding: "3px 7px", fontSize: 11, color: validCurrentPage >= totalPages ? "#bbb" : T.ink, cursor: validCurrentPage >= totalPages ? "not-allowed" : "pointer", gap: 2 }}
            >
              Sau <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Budget ----------------
function BudgetTab({ budgets, onUpdateBudget, byCat, userSettings, onUpdateSettings, safeToSpend }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");

  function startEdit(id) {
    setEditing(id);
    setDraft(String(budgets[id] || ""));
  }
  function saveEdit(id) {
    const v = parseFloat(draft);
    onUpdateBudget(id, v > 0 ? v : 0);
    setEditing(null);
  }

  const cats = EXPENSE_CATS.filter((c) => budgets[c.id] !== undefined || byCat[c.id]);
  const others = EXPENSE_CATS.filter((c) => !cats.includes(c));

  return (
    <div>
      {/* Thẻ Cấu hình Safe-to-Spend */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", marginTop: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <ShieldCheck size={18} color={T.teal} />
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark }}>
            Hạn mức Safe-to-Spend hàng ngày
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12, lineHeight: 1.4 }}>
          Số tiền tối đa bạn được phép tiêu trong ngày hôm nay để không hết tiền trước kỳ nhận trợ cấp hoặc lương tiếp theo.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: T.paper, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.inkSoft }}>Hạn mức hôm nay</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: safeToSpend?.isOverBudget ? T.brick : T.tealDark, fontFamily: "'Space Grotesk',sans-serif" }}>
              {fmtVND(safeToSpend?.dailyLimit || 0)}
            </div>
            <div style={{ fontSize: 10, color: T.inkSoft }}>{safeToSpend?.isOverBudget ? "⚠️ Đã vượt mức" : `Còn lại: ${fmtVND(safeToSpend?.remainingToday || 0)}`}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.inkSoft }}>Kỳ nhận tiền tới</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.goldDark, fontFamily: "'Space Grotesk',sans-serif" }}>
              {safeToSpend?.nextPaydayStr}
            </div>
            <div style={{ fontSize: 10, color: T.inkSoft }}>Còn {safeToSpend?.daysRemaining} ngày</div>
          </div>
        </div>

        <SafeToSpendForm userSettings={userSettings} onUpdateSettings={onUpdateSettings} />
      </div>

      <div style={{ marginBottom: 4, fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Ngân sách theo danh mục</div>
      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 14 }}>Đặt giới hạn chi tiêu hàng tháng để kiểm soát tốt hơn.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...cats, ...others].map((c) => {
          const spent = byCat[c.id] || 0;
          const limit = budgets[c.id] || 0;
          const over = limit > 0 && spent > limit;
          return (
            <div key={c.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <IconBadge Icon={c.Icon} color={c.color} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                  <div style={{ fontSize: 11.5, color: over ? T.brick : T.inkSoft }}>
                    {fmtVND(spent)} / {limit > 0 ? fmtVND(limit) : "chưa đặt"}
                  </div>
                </div>
                {editing === c.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      autoFocus type="number" value={draft} onChange={(e) => setDraft(e.target.value)}
                      style={{ width: 90, fontSize: 12, padding: "5px 6px", borderRadius: 6, border: `1px solid ${T.border}` }}
                    />
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="btn-teal-sm"
                      title="Lưu"
                      style={{ background: T.teal, border: "none", borderRadius: 6, padding: "0 8px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(c.id)}
                    className="btn-edit"
                    style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: T.inkSoft }}
                  >
                    Sửa
                  </button>
                )}
              </div>
              {limit > 0 && <ProgressBar value={spent} max={limit} color={c.color} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Learn ----------------
function LearnTab({ onAsk }) {
  return (
    <div>
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <div style={{ background: T.gold + "26", border: `1px solid ${T.gold}66`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
          <Lightbulb size={18} color={T.goldDark} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.goldDark, marginBottom: 2 }}>MẸO HÔM NAY</div>
            <div style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.5 }}>{TIP_OF_DAY}</div>
          </div>
        </div>
      </div>

      <SectionTitle label="Bài học tài chính ngắn" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {LESSONS.map((l) => (
          <div key={l.title} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: T.teal, background: T.teal + "1A", padding: "2px 8px", borderRadius: 20 }}>{l.tag}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>{l.title}</div>
            <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>{l.desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle label="Hỏi Tuấn thêm về chủ đề này" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SUGGESTED_PROMPTS.map((q) => (
          <button key={q} onClick={() => onAsk(q)} className="chip-btn" style={{
            textAlign: "left", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "10px 12px", fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: T.ink,
          }}>
            <span>{q}</span> <ChevronRight size={14} className="chip-arrow" color={T.inkSoft} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Knowledge Base Modal (Quản lý Tri thức AI dành cho Admin) ----------------
function KnowledgeBaseModal({ token, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState("list"); // "list" | "add_faq" | "add_doc"
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  // Form thêm FAQ
  const [faqTitle, setFaqTitle] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Form thêm tài liệu / upload
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    knowledgeApi.list(token)
      .then((data) => {
        setItems(data.knowledge || []);
        if (onRefresh) onRefresh(data.knowledge?.length || 0);
      })
      .catch((err) => console.error("Lỗi tải tri thức:", err))
      .finally(() => setLoading(false));
  }, [token, onRefresh]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddFaq(e) {
    e.preventDefault();
    if (!faqTitle.trim() || !faqAnswer.trim()) {
      alert("Vui lòng điền tiêu đề và nội dung trả lời.");
      return;
    }
    setSubmitting(true);
    try {
      const fullContent = `Câu hỏi: ${faqQuestion.trim() || faqTitle.trim()}\nTrả lời: ${faqAnswer.trim()}`;
      await knowledgeApi.create(token, {
        type: "faq",
        title: faqTitle.trim(),
        content: fullContent,
      });
      setNotice("Đã thêm câu hỏi FAQ thành công!");
      setFaqTitle("");
      setFaqQuestion("");
      setFaqAnswer("");
      loadData();
      setTimeout(() => { setNotice(""); setActiveTab("list"); }, 1200);
    } catch (err) {
      alert(err.message || "Không thể thêm FAQ.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDocument(e) {
    e.preventDefault();
    if (selectedFile) {
      setSubmitting(true);
      try {
        await knowledgeApi.upload(token, selectedFile, docTitle.trim() || selectedFile.name);
        setNotice("Đã tải lên và nạp tài liệu thành công!");
        setSelectedFile(null);
        setDocTitle("");
        loadData();
        setTimeout(() => { setNotice(""); setActiveTab("list"); }, 1200);
      } catch (err) {
        alert(err.message || "Lỗi khi tải file lên.");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!docTitle.trim() || !docContent.trim()) {
        alert("Vui lòng nhập tiêu đề và nội dung văn bản.");
        return;
      }
      setSubmitting(true);
      try {
        await knowledgeApi.create(token, {
          type: "document",
          title: docTitle.trim(),
          content: docContent.trim(),
        });
        setNotice("Đã lưu tài liệu thành công!");
        setDocTitle("");
        setDocContent("");
        loadData();
        setTimeout(() => { setNotice(""); setActiveTab("list"); }, 1200);
      } catch (err) {
        alert(err.message || "Lỗi khi lưu tài liệu.");
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function handleToggle(id) {
    try {
      const res = await knowledgeApi.toggle(token, id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_active: res.is_active } : item))
      );
    } catch (err) {
      alert("Không thể đổi trạng thái: " + err.message);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Bạn có chắc muốn xóa tài liệu "${title}" khỏi kho tri thức?`)) return;
    try {
      await knowledgeApi.remove(token, id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (onRefresh) onRefresh(items.length - 1);
    } catch (err) {
      alert("Không thể xóa: " + err.message);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(32,48,44,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 16, boxSizing: "border-box",
    }}>
      <div style={{
        width: "100%", maxWidth: 410, maxHeight: "88vh",
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
        overflow: "hidden", boxSizing: "border-box",
      }}>
        {/* Header modal */}
        <div style={{
          padding: "16px 18px", borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", background: T.paper,
        }}>
          <div>
            <div style={{ fontSize: 11, color: T.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Dành cho Quản trị viên
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.tealDark, fontFamily: "'Space Grotesk',sans-serif" }}>
              Kho Tri thức AI Chuẩn bị trước
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color={T.inkSoft} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.card, padding: "4px 8px" }}>
          {[
            { id: "list", label: `Đã nạp (${items.length})` },
            { id: "add_faq", label: "+ Thêm FAQ" },
            { id: "add_doc", label: "+ Nạp tài liệu" },
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setNotice(""); }}
                style={{
                  flex: 1, padding: "8px 4px", border: "none", background: "transparent",
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? T.teal : T.inkSoft,
                  borderBottom: active ? `2px solid ${T.teal}` : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {notice && (
          <div style={{
            margin: "10px 14px 0", padding: "8px 12px", borderRadius: 8,
            background: "rgba(31,111,99,0.12)", color: T.teal, fontSize: 12, fontWeight: 600,
            textAlign: "center",
          }}>
            {notice}
          </div>
        )}

        {/* Modal content body */}
        <div style={{ padding: 14, overflowY: "auto", flex: 1, boxSizing: "border-box" }}>
          {/* TAB 1: Danh sách tri thức */}
          {activeTab === "list" && (
            <div>
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 10, lineHeight: 1.4 }}>
                Dưới đây là các tài liệu và câu hỏi mà AI ("Tuấn") sẽ tự động tra cứu để trả lời cho mọi sinh viên.
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: 24, fontSize: 12.5, color: T.inkSoft }}>Đang tải dữ liệu tri thức...</div>
              ) : items.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: T.inkSoft, fontSize: 12.5 }}>
                  Chưa có tài liệu nào. Bạn hãy bấm <b>+ Thêm FAQ</b> hoặc <b>+ Nạp tài liệu</b> để huấn luyện AI.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
                        background: item.is_active ? T.paper : "#E8E4D688",
                        opacity: item.is_active ? 1 : 0.65,
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                            background: item.type === "faq" ? "rgba(217,164,65,0.2)" : "rgba(31,111,99,0.15)",
                            color: item.type === "faq" ? T.goldDark : T.teal,
                            textTransform: "uppercase",
                          }}>
                            {item.type === "faq" ? "FAQ" : "Tài liệu"}
                          </span>
                          {item.file_name && (
                            <span style={{ fontSize: 10.5, color: T.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              📎 {item.file_name}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: 11.5, color: T.inkSoft, lineHeight: 1.4,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {item.content}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => handleToggle(item.id)}
                          title={item.is_active ? "Bấm để tắt" : "Bấm để bật"}
                          style={{
                            padding: "3px 8px", borderRadius: 6, border: `1px solid ${item.is_active ? T.teal : T.border}`,
                            background: item.is_active ? T.teal : "transparent",
                            color: item.is_active ? "#fff" : T.inkSoft,
                            fontSize: 10.5, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          {item.is_active ? "Bật" : "Tắt"}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          title="Xóa tài liệu"
                          style={{
                            border: "none", background: "transparent", color: T.brick,
                            cursor: "pointer", padding: 2, display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Thêm FAQ */}
          {activeTab === "add_faq" && (
            <form onSubmit={handleAddFaq}>
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 12 }}>
                Tạo các câu hỏi - trả lời mẫu để AI ưu tiên trả lời chính xác khi sinh viên hỏi câu tương tự.
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                  Chủ đề / Tên câu hỏi:
                </label>
                <input
                  type="text"
                  value={faqTitle}
                  onChange={(e) => setFaqTitle(e.target.value)}
                  placeholder="Ví dụ: Quy định học bổng khuyến khích"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.paper, boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                  Câu hỏi mẫu (tùy chọn):
                </label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="Ví dụ: Điều kiện để nhận học bổng sinh viên là gì?"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.paper, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                  Câu trả lời chuẩn của hệ thống:
                </label>
                <textarea
                  rows={4}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Nhập nội dung câu trả lời chuẩn xác mà bạn muốn AI phản hồi cho sinh viên..."
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, background: T.paper, boxSizing: "border-box", resize: "vertical" }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-gold"
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                  background: T.gold, color: "#3A2A08", fontSize: 13.5, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                }}
              >
                {submitting ? "Đang lưu..." : "Lưu vào Kho Tri thức"}
              </button>
            </form>
          )}

          {/* TAB 3: Nạp tài liệu (File TXT/MD/PDF hoặc dán text) */}
          {activeTab === "add_doc" && (
            <form onSubmit={handleAddDocument}>
              <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 12 }}>
                Nạp cẩm nang, quy định, sổ tay sinh viên qua file (.pdf, .txt, .md) hoặc dán văn bản trực tiếp.
              </div>

              {/* Upload file box */}
              <div style={{
                border: `2px dashed ${T.border}`, borderRadius: 10, padding: "14px 12px",
                textAlign: "center", marginBottom: 12, background: selectedFile ? "rgba(31,111,99,0.06)" : T.paper,
              }}>
                <input
                  type="file"
                  id="kb-file-upload"
                  accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  style={{ display: "none" }}
                />
                <label htmlFor="kb-file-upload" style={{ cursor: "pointer", display: "block" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.teal }}>
                    {selectedFile ? `Đã chọn: ${selectedFile.name}` : "Chọn file PDF, TXT hoặc MD"}
                  </div>
                  <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
                    (Dung lượng tối đa 10MB — Hệ thống tự động đọc và trích xuất chữ)
                  </div>
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    style={{ marginTop: 8, fontSize: 11, color: T.brick, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Bỏ chọn file này
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                  Tên tài liệu / Sổ tay:
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ví dụ: Sổ tay quy chế sinh viên 2026"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.paper, boxSizing: "border-box" }}
                  required={!selectedFile}
                />
              </div>

              {!selectedFile && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
                    Hoặc dán nội dung văn bản trực tiếp:
                  </label>
                  <textarea
                    rows={5}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Dán toàn bộ nội dung văn bản, bài viết hướng dẫn hoặc sổ tay vào đây..."
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12.5, background: T.paper, boxSizing: "border-box", resize: "vertical" }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (!selectedFile && !docContent.trim())}
                className="btn-gold"
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                  background: T.gold, color: "#3A2A08", fontSize: 13.5, fontWeight: 700,
                  cursor: submitting || (!selectedFile && !docContent.trim()) ? "default" : "pointer",
                  opacity: submitting || (!selectedFile && !docContent.trim()) ? 0.6 : 1,
                }}
              >
                {submitting ? "Đang xử lý tải lên..." : selectedFile ? "Tải lên & Huấn luyện AI" : "Lưu tài liệu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Chat ----------------
function ChatTab({ messages, chatInput, setChatInput, chatLoading, sendChat, chatEndRef, user, token }) {
  const isAdmin = user?.role === "admin";
  const [showKBModal, setShowKBModal] = useState(false);
  const [kbCount, setKbCount] = useState(4);

  useEffect(() => {
    if (isAdmin && token) {
      knowledgeApi.list(token)
        .then((data) => setKbCount(data.knowledge?.length || 0))
        .catch(() => {});
    }
  }, [isAdmin, token]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginTop: 12, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
          <Target size={16} color={T.teal} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: T.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Học tập theo tài liệu & dữ liệu chi tiêu
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowKBModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
              borderRadius: 8, border: `1px solid ${T.teal}`, background: "rgba(31,111,99,0.08)",
              color: T.teal, fontSize: 11.5, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            <BookOpen size={13} />
            <span>Tri thức AI ({kbCount})</span>
          </button>
        )}
      </div>

      {showKBModal && (
        <KnowledgeBaseModal
          token={token}
          onClose={() => setShowKBModal(false)}
          onRefresh={(count) => setKbCount(count)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "9px 12px", borderRadius: 14,
              borderBottomRightRadius: m.role === "user" ? 3 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 3,
              background: m.role === "user" ? T.teal : T.card,
              color: m.role === "user" ? "#fff" : T.ink,
              border: m.role === "user" ? "none" : `1px solid ${T.border}`,
              fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "9px 12px", borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, fontSize: 13, color: T.inkSoft }}>
              Tuấn đang soạn câu trả lời…
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: T.paper, paddingTop: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
            placeholder="Hỏi Tuấn về tài chính của bạn..."
            style={{
              flex: 1, borderRadius: 20, border: `1px solid ${T.border}`, padding: "10px 14px",
              fontSize: 13, outline: "none", background: T.card, color: T.ink,
            }}
          />
          <button
            className="send-btn"
            onClick={() => sendChat()}
            disabled={chatLoading || !chatInput.trim()}
            style={{
              width: 40, height: 40, borderRadius: "50%", border: "none", background: T.teal,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Add transaction modal (4 tabs: manual / text / voice / image) ----------------
function AddTxModal({ form, setForm, onClose, onSubmit, token, onSaveMultiple, safeToSpend, initialTab = "manual" }) {
  const [inputTab, setInputTab] = useState(initialTab); // "manual" | "text" | "voice" | "image"
  const [nlText, setNlText] = useState(""); // natural language input
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [autoDirectRecord, setAutoDirectRecord] = useState(true); // Tự động cộng/trừ trực tiếp vào sổ
  const [voiceStatus, setVoiceStatus] = useState("idle"); // "idle" | "listening" | "processing" | "done" | "error"
  const [voiceSuccessTx, setVoiceSuccessTx] = useState(null);
  const latestTranscriptRef = useRef("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // parsed result from AI
  const [aiError, setAiError] = useState("");
  const [editableTxs, setEditableTxs] = useState([]); // editable list in confirm panel
  const [splitPeople, setSplitPeople] = useState(2);
  const [saving, setSaving] = useState(false);
  const recognitionRef = useRef(null);
  const imageInputRef = useRef(null);

  function handleManualSubmit() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    if (form.type === "expense" && safeToSpend && amt > safeToSpend.remainingToday) {
      const confirmSave = window.confirm(
        `Cảnh báo Safe-to-Spend: Khoản chi này (${fmtVND(amt)}) sẽ làm bạn vượt hạn mức cho phép hôm nay (còn lại: ${safeToSpend.remainingToday > 0 ? fmtVND(safeToSpend.remainingToday) : "0 đ"}). Bạn còn ${safeToSpend.daysRemaining} ngày nữa mới đến kỳ nhận tiền (${safeToSpend.nextPaydayStr}). Bạn có chắc chắn muốn ghi nhận không?`
      );
      if (!confirmSave) return;
    }
    onSubmit();
  }

  const TABS = [
    { id: "manual", label: "Thủ công", Icon: Edit3 },
    { id: "text", label: "Câu lệnh", Icon: Type },
    { id: "voice", label: "Giọng nói", Icon: Mic },
    { id: "image", label: "Hình ảnh", Icon: Camera },
  ];

  // Check browser support for Web Speech API
  const speechSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Voice: Tự động cộng trừ trực tiếp vào giao dịch ──────────────────────────
  async function handleVoiceFinished(spokenText) {
    const text = (spokenText || voiceTranscript || nlText).trim();
    if (!text) {
      setVoiceStatus("idle");
      return;
    }

    if (autoDirectRecord) {
      setVoiceStatus("processing");
      setAiLoading(true);
      setAiError("");

      try {
        const result = await multimodalApi.parseText(token, text);
        if (!result.transactions || result.transactions.length === 0) {
          setAiError("Không nhận diện được số tiền hoặc danh mục. Bạn thử nói lại nhé (VD: 'ăn sáng 50k').");
          setVoiceStatus("error");
          setAiLoading(false);
          return;
        }

        // Lưu trực tiếp vào cơ sở dữ liệu và cộng/trừ ngay vào số dư & giao dịch
        await onSaveMultiple(result.transactions);
        setVoiceSuccessTx(result.transactions[0]);
        setVoiceStatus("done");
      } catch (err) {
        setAiError(err.message || "Lỗi xử lý câu lệnh.");
        setVoiceStatus("error");
      } finally {
        setAiLoading(false);
      }
    } else {
      // Chế độ xem trước
      setNlText(text);
      runAiParse();
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = true;

    setVoiceTranscript("");
    latestTranscriptRef.current = "";
    setVoiceStatus("listening");
    setVoiceSuccessTx(null);
    setAiError("");

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join("");
      setVoiceTranscript(transcript);
      latestTranscriptRef.current = transcript;
      if (e.results[e.results.length - 1].isFinal) {
        setNlText(transcript);
      }
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error !== "no-speech") {
        setAiError("Không thu được âm thanh. Hãy thử lại.");
        setVoiceStatus("error");
      } else {
        setVoiceStatus("idle");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = latestTranscriptRef.current?.trim();
      if (text) {
        handleVoiceFinished(text);
      } else {
        setVoiceStatus("idle");
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  // Tự động bật mic khi mở trực tiếp tab giọng nói
  useEffect(() => {
    if (initialTab === "voice" && speechSupported) {
      const timer = setTimeout(() => {
        startListening();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [initialTab]);

  // ── Image preview ────────────────────────────────────────────────────────────
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAiResult(null);
    setAiError("");
  }

  // ── AI parse ─────────────────────────────────────────────────────────────────
  async function runAiParse() {
    setAiLoading(true);
    setAiError("");
    setAiResult(null);
    try {
      let result;
      if (inputTab === "image" && imageFile) {
        result = await multimodalApi.parseImage(token, imageFile);
      } else {
        const text = inputTab === "voice" ? voiceTranscript || nlText : nlText;
        if (!text.trim()) { setAiError("Vui lòng nhập câu lệnh."); setAiLoading(false); return; }
        result = await multimodalApi.parseText(token, text);
      }

      if (!result.transactions || result.transactions.length === 0) {
        setAiError("Không tìm thấy thông tin tài chính rõ ràng. Hãy thử mô tả cụ thể hơn.");
        setAiLoading(false);
        return;
      }

      setAiResult(result);
      setEditableTxs(result.transactions.map((t, i) => ({ ...t, _id: i })));
      if (result.groupExpense?.detected && result.groupExpense.suggestedPeople > 1) {
        setSplitPeople(result.groupExpense.suggestedPeople);
      }
    } catch (err) {
      setAiError(err.message || "Có lỗi xảy ra khi gọi AI.");
    } finally {
      setAiLoading(false);
    }
  }

  // ── Save confirmed transactions ───────────────────────────────────────────────
  async function saveConfirmed(useSplit = false) {
    setSaving(true);
    const toSave = editableTxs.map((t) => ({
      ...t,
      amount: useSplit ? Math.round(t.amount / splitPeople) : t.amount,
      note: useSplit ? `${t.note} (1/${splitPeople} người)` : t.note,
    }));
    await onSaveMultiple(toSave);
    setSaving(false);
  }

  const cats = form.type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#20302Cb0", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
      <div style={{ width: "100%", background: T.paper, borderRadius: "18px 18px 0 0", border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 10px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Thêm giao dịch</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Input-mode tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 20px 14px", borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(({ id, label, Icon }) => {
            const isVoiceDisabled = id === "voice" && !speechSupported;
            const active = inputTab === id;
            return (
              <button
                key={id}
                disabled={isVoiceDisabled}
                onClick={() => { setInputTab(id); setAiResult(null); setAiError(""); }}
                title={isVoiceDisabled ? "Trình duyệt không hỗ trợ Voice" : label}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "7px 4px", borderRadius: 10, cursor: isVoiceDisabled ? "not-allowed" : "pointer",
                  border: `1px solid ${active ? T.teal : T.border}`,
                  background: active ? T.teal + "18" : T.card,
                  color: isVoiceDisabled ? T.border : active ? T.teal : T.inkSoft,
                  opacity: isVoiceDisabled ? 0.45 : 1,
                  fontSize: 10, fontWeight: active ? 700 : 500,
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: "14px 20px 22px" }}>

          {/* ── TAB: Manual (original form) ────────────────────────── */}
          {inputTab === "manual" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["expense", "income"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t, cat: t === "expense" ? "food" : "allowance" }))}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                      border: `1px solid ${form.type === t ? T.teal : T.border}`,
                      background: form.type === t ? T.teal : T.card,
                      color: form.type === t ? "#fff" : T.ink,
                    }}
                  >
                    {t === "expense" ? "Chi tiêu" : "Thu nhập"}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, cat: c.id }))}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px",
                      borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${form.cat === c.id ? c.color : T.border}`,
                      background: form.cat === c.id ? c.color + "22" : T.card,
                    }}
                  >
                    <c.Icon size={16} color={c.color} />
                    <span style={{ fontSize: 9.5, color: T.ink, textAlign: "center" }}>{c.label}</span>
                  </button>
                ))}
              </div>
              <input
                type="number" placeholder="Số tiền (VND)" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, marginBottom: 8, background: T.card, color: T.ink }}
              />
              {form.type === "expense" && safeToSpend && Number(form.amount) > 0 && Number(form.amount) > safeToSpend.remainingToday && (
                <div style={{
                  background: "#FFF3F0", border: `1px solid ${T.brick}66`, borderRadius: 10,
                  padding: "10px 12px", marginBottom: 8, display: "flex", gap: 8, alignItems: "flex-start"
                }}>
                  <AlertTriangle size={16} color={T.brick} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: "#7B2317", lineHeight: 1.4 }}>
                    <strong>Cảnh báo vượt hạn mức Safe-to-Spend!</strong><br />
                    Khoản chi này (<strong>{fmtVND(Number(form.amount))}</strong>) sẽ làm bạn vượt hạn mức cho phép hôm nay (còn lại: <strong>{safeToSpend.remainingToday > 0 ? fmtVND(safeToSpend.remainingToday) : "0 đ"}</strong>). Còn <strong>{safeToSpend.daysRemaining} ngày</strong> nữa mới đến kỳ nhận tiền ({safeToSpend.nextPaydayStr}).
                  </div>
                </div>
              )}
              <input
                type="text" placeholder="Ghi chú (vd: Ăn trưa với bạn)" value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 8, background: T.card, color: T.ink }}
              />
              <input
                type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 13, marginBottom: 14, background: T.card, color: T.ink }}
              />
              <button
                onClick={handleManualSubmit}
                style={{ width: "100%", background: T.gold, border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, color: "#3A2A08", cursor: "pointer" }}
              >
                Lưu giao dịch
              </button>
            </>
          )}

          {/* ── TAB: Natural Language Text ──────────────────────────── */}
          {inputTab === "text" && !aiResult && (
            <>
              <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8 }}>
                Mô tả giao dịch bằng lời tự nhiên, AI sẽ tự bóc tách:
              </div>
              <div style={{ fontSize: 11, color: T.teal, background: T.teal + "12", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                Ví dụ: <em>"ăn bún bò 45k"</em> · <em>"nhận học bổng 2 triệu"</em> · <em>"lẩu cùng 4 người hết 480k"</em>
              </div>
              <textarea
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder="Nhập câu lệnh tài chính của bạn..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${T.border}`, fontSize: 13, resize: "none",
                  background: T.card, color: T.ink, marginBottom: 10, fontFamily: "inherit",
                }}
              />
              {aiError && <div style={{ color: T.brick, fontSize: 12, marginBottom: 8 }}>{aiError}</div>}
              <button
                onClick={runAiParse}
                disabled={aiLoading || !nlText.trim()}
                style={{
                  width: "100%", background: aiLoading || !nlText.trim() ? T.border : T.teal,
                  border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700,
                  fontSize: 13, color: "#fff", cursor: aiLoading || !nlText.trim() ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {aiLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang phân tích...</> : <><Wand2 size={15} /> Phân tích với AI</>}
              </button>
            </>
          )}

          {/* ── TAB: Voice (Ghi nhận giọng nói trực tiếp vào sổ) ─────── */}
          {inputTab === "voice" && !aiResult && (
            <div>
              {/* Option toggle: Tự động cộng/trừ trực tiếp */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: T.teal + "12", border: `1px solid ${T.teal}33`, borderRadius: 10,
                padding: "8px 12px", marginBottom: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={15} color={T.teal} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.tealDark }}>
                    Tự động cộng/trừ trực tiếp vào giao dịch
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoDirectRecord}
                  onChange={(e) => setAutoDirectRecord(e.target.checked)}
                  style={{ cursor: "pointer", width: 16, height: 16, accentColor: T.teal }}
                />
              </div>

              {/* Màn hình khi đã ghi nhận thành công */}
              {voiceStatus === "done" && voiceSuccessTx ? (
                <div style={{
                  background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 14,
                  padding: "18px 16px", textAlign: "center", marginBottom: 12
                }}>
                  <CheckCircle2 size={40} color="#2E7D32" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1B5E20", marginBottom: 4 }}>
                    Đã ghi nhận giao dịch thành công!
                  </div>
                  <div style={{ fontSize: 12, color: "#2E7D32", marginBottom: 14 }}>
                    {voiceSuccessTx.type === "expense"
                      ? "Đã trừ trực tiếp vào số dư và danh mục chi tiêu của bạn."
                      : "Đã cộng trực tiếp vào số dư và danh mục thu nhập của bạn."}
                  </div>

                  <div style={{
                    background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #C8E6C9",
                    display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IconBadge Icon={catMeta(voiceSuccessTx.category).Icon} color={catMeta(voiceSuccessTx.category).color} size={36} />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{voiceSuccessTx.note}</div>
                        <div style={{ fontSize: 11, color: T.inkSoft }}>
                          {catMeta(voiceSuccessTx.category).label} · {voiceSuccessTx.date}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: voiceSuccessTx.type === "expense" ? T.brick : T.teal }}>
                      {voiceSuccessTx.type === "expense" ? "-" : "+"}{fmtVND(voiceSuccessTx.amount)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={startListening}
                      style={{
                        flex: 1.2, padding: "10px 0", borderRadius: 10, border: "none",
                        background: T.teal, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                      }}
                    >
                      <Mic size={15} /> Nói tiếp khoản khác
                    </button>
                    <button
                      onClick={onClose}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`,
                        background: T.card, color: T.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      Xem giao dịch
                    </button>
                  </div>
                </div>
              ) : (
                /* Màn hình ghi âm */
                <div style={{ textAlign: "center", padding: "10px 0 14px" }}>
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={voiceStatus === "processing"}
                    style={{
                      width: 76, height: 76, borderRadius: "50%", border: "none", cursor: voiceStatus === "processing" ? "default" : "pointer",
                      background: isListening ? T.brick : voiceStatus === "processing" ? T.border : T.teal,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px",
                      boxShadow: isListening ? `0 0 0 10px ${T.brick}33` : "0 4px 14px rgba(31,111,99,0.25)",
                      transition: "all 0.3s",
                    }}
                  >
                    {voiceStatus === "processing" ? (
                      <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
                    ) : isListening ? (
                      <MicOff size={32} />
                    ) : (
                      <Mic size={32} />
                    )}
                  </button>

                  <div style={{ fontSize: 13.5, fontWeight: 600, color: isListening ? T.brick : T.tealDark, marginBottom: 6 }}>
                    {voiceStatus === "processing"
                      ? "⚡ Đang xử lý & cộng trừ trực tiếp vào giao dịch..."
                      : isListening
                      ? "Đang nghe bạn nói… (nói xong dừng 1s hoặc nhấn micro)"
                      : "Nhấn vào micro để nói"}
                  </div>

                  <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 12 }}>
                    Ví dụ: <em>"ăn sáng 50k"</em> · <em>"uống cafe 25k"</em> · <em>"đổ xăng 50k"</em> · <em>"nhận lương 2 triệu"</em>
                  </div>

                  {voiceTranscript && (
                    <div style={{
                      background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                      padding: "10px 14px", fontSize: 13, color: T.ink, textAlign: "left",
                      fontStyle: "italic", marginBottom: 10, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)"
                    }}>
                      "{voiceTranscript}"
                    </div>
                  )}

                  {aiError && (
                    <div style={{
                      background: "#FFF2EE", border: `1px solid ${T.brick}66`, borderRadius: 8,
                      padding: "8px 10px", color: T.brick, fontSize: 12, marginBottom: 10
                    }}>
                      {aiError}
                    </div>
                  )}

                  {/* Nút phân tích nếu người dùng tắt tự động lưu */}
                  {!autoDirectRecord && (voiceTranscript || nlText) && !isListening && (
                    <button
                      onClick={runAiParse}
                      disabled={aiLoading}
                      style={{
                        width: "100%", background: aiLoading ? T.border : T.teal,
                        border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700,
                        fontSize: 13, color: "#fff", cursor: aiLoading ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {aiLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang phân tích...</> : <><Wand2 size={15} /> Xem lại với AI</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Image / OCR ────────────────────────────────────── */}
          {inputTab === "image" && !aiResult && (
            <>
              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
              {!imagePreview ? (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: "100%", padding: "30px 0", border: `2px dashed ${T.border}`,
                    borderRadius: 12, background: T.card, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    color: T.inkSoft, marginBottom: 10,
                  }}
                >
                  <ImagePlus size={32} color={T.teal} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Chọn ảnh hóa đơn / bill CK</span>
                  <span style={{ fontSize: 11 }}>JPEG, PNG, WebP · Tối đa 10MB</span>
                </button>
              ) : (
                <div style={{ marginBottom: 10, position: "relative" }}>
                  <img src={imagePreview} alt="preview" style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "contain", background: "#eee" }} />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); setAiResult(null); setAiError(""); }}
                    style={{
                      position: "absolute", top: 6, right: 6, background: T.brick, border: "none",
                      borderRadius: "50%", width: 24, height: 24, cursor: "pointer", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {aiError && <div style={{ color: T.brick, fontSize: 12, marginBottom: 8 }}>{aiError}</div>}
              {imageFile && (
                <button
                  onClick={runAiParse}
                  disabled={aiLoading}
                  style={{
                    width: "100%", background: aiLoading ? T.border : T.teal,
                    border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700,
                    fontSize: 13, color: "#fff", cursor: aiLoading ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {aiLoading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Đang phân tích ảnh...</> : <><Wand2 size={15} /> Phân tích hóa đơn</>}
                </button>
              )}
            </>
          )}

          {/* ── AI Confirm Panel (shared across text/voice/image tabs) ── */}
          {aiResult && (
            <AiConfirmPanel
              aiResult={aiResult}
              editableTxs={editableTxs}
              setEditableTxs={setEditableTxs}
              splitPeople={splitPeople}
              setSplitPeople={setSplitPeople}
              saving={saving}
              onBack={() => setAiResult(null)}
              onSave={saveConfirmed}
              safeToSpend={safeToSpend}
            />
          )}

        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

// ── AI Confirm Panel component ────────────────────────────────────────────────
function AiConfirmPanel({ aiResult, editableTxs, setEditableTxs, splitPeople, setSplitPeople, saving, onBack, onSave, safeToSpend }) {
  const { groupExpense, rawSummary, confidence } = aiResult;
  const showSplit = groupExpense?.detected;

  function updateTx(idx, field, value) {
    setEditableTxs((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }
  function removeTx(idx) {
    setEditableTxs((prev) => prev.filter((_, i) => i !== idx));
  }

  const confidenceColor = confidence === "high" ? T.teal : confidence === "medium" ? T.gold : T.brick;
  const confidenceLabel = confidence === "high" ? "Độ chính xác cao" : confidence === "medium" ? "Độ chính xác trung bình" : "Độ chính xác thấp — vui lòng kiểm tra";

  // Tính tổng chi phí dự kiến lưu
  const pendingExpenseTotal = editableTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + (showSplit ? Math.round(t.amount / splitPeople) : t.amount), 0);
  const willExceedSafe = safeToSpend && pendingExpenseTotal > 0 && pendingExpenseTotal > safeToSpend.remainingToday;

  function handleSaveClick(splitMode) {
    if (willExceedSafe) {
      const confirmed = window.confirm(
        `Cảnh báo Safe-to-Spend: Tổng khoản chi (${fmtVND(pendingExpenseTotal)}) vượt quá hạn mức cho phép hôm nay (còn lại: ${safeToSpend.remainingToday > 0 ? fmtVND(safeToSpend.remainingToday) : "0 đ"}). Bạn còn ${safeToSpend.daysRemaining} ngày nữa đến kỳ nhận tiền (${safeToSpend.nextPaydayStr}). Bạn có chắc muốn lưu không?`
      );
      if (!confirmed) return;
    }
    onSave(splitMode);
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ background: T.teal + "15", border: `1px solid ${T.teal}44`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Sparkles size={14} color={T.teal} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>Kết quả AI</span>
          <span style={{ fontSize: 10, color: confidenceColor, marginLeft: "auto", fontWeight: 600 }}>● {confidenceLabel}</span>
        </div>
        {rawSummary && <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.4 }}>{rawSummary}</div>}
      </div>

      {/* Editable transaction list */}
      <div style={{ fontSize: 12, fontWeight: 600, color: T.tealDark, marginBottom: 8 }}>Giao dịch phát hiện được ({editableTxs.length})</div>
      {editableTxs.map((t, idx) => {
        const meta = catMeta(t.category);
        return (
          <div key={t._id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconBadge Icon={meta.Icon} color={meta.color} size={28} />
              <div style={{ flex: 1 }}>
                <input
                  value={t.note}
                  onChange={(e) => updateTx(idx, "note", e.target.value)}
                  style={{ width: "100%", fontSize: 12, fontWeight: 600, background: "transparent", border: "none", outline: "none", color: T.ink, padding: 0 }}
                />
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                  <select
                    value={t.type}
                    onChange={(e) => updateTx(idx, "type", e.target.value)}
                    style={{ fontSize: 10, border: "none", background: "transparent", color: T.inkSoft, cursor: "pointer" }}
                  >
                    <option value="expense">Chi tiêu</option>
                    <option value="income">Thu nhập</option>
                  </select>
                  <select
                    value={t.category}
                    onChange={(e) => updateTx(idx, "category", e.target.value)}
                    style={{ fontSize: 10, border: "none", background: "transparent", color: T.inkSoft, cursor: "pointer" }}
                  >
                    {ALL_CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <input
                  type="number"
                  value={t.amount}
                  onChange={(e) => updateTx(idx, "amount", Math.max(0, Number(e.target.value)))}
                  style={{ width: 90, fontSize: 13, fontWeight: 700, color: t.type === "income" ? T.teal : T.brick, textAlign: "right", border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 6px", background: T.paper }}
                />
                <div style={{ fontSize: 10, color: T.inkSoft, marginTop: 2 }}>đ</div>
              </div>
              <button onClick={() => removeTx(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 2 }}>
                <X size={13} />
              </button>
            </div>
            <input
              type="date" value={t.date}
              onChange={(e) => updateTx(idx, "date", e.target.value)}
              style={{ fontSize: 11, border: "none", background: "transparent", color: T.inkSoft, cursor: "pointer" }}
            />
          </div>
        );
      })}

      {/* Group split section */}
      {showSplit && (
        <div style={{ background: "#FFF6E0", border: `1px solid ${T.gold}66`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Users size={14} color={T.goldDark} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.goldDark }}>Gợi ý chia tiền nhóm</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.inkSoft, marginBottom: 8 }}>{groupExpense.reason}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: T.ink }}>Số người:</span>
            <input
              type="number" min={1} max={20} value={splitPeople}
              onChange={(e) => setSplitPeople(Math.max(1, Number(e.target.value)))}
              style={{ width: 56, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, textAlign: "center" }}
            />
            <span style={{ fontSize: 12, color: T.inkSoft, flex: 1 }}>
              → Mỗi người: <strong style={{ color: T.tealDark }}>{fmtVND(Math.round(editableTxs.reduce((s, t) => s + t.amount, 0) / splitPeople))}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Cảnh báo vượt hạn mức Safe-to-Spend */}
      {willExceedSafe && (
        <div style={{
          background: "#FFF3F0", border: `1px solid ${T.brick}66`, borderRadius: 10,
          padding: "10px 12px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start"
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: "#7B2317", lineHeight: 1.45 }}>
            <strong>Cảnh báo vượt hạn mức Safe-to-Spend!</strong><br />
            Tổng chi tiêu sắp lưu (<strong>{fmtVND(pendingExpenseTotal)}</strong>) sẽ làm bạn vượt hạn mức cho phép hôm nay (còn lại: <strong>{safeToSpend.remainingToday > 0 ? fmtVND(safeToSpend.remainingToday) : "0 đ"}</strong>). Còn <strong>{safeToSpend.daysRemaining} ngày</strong> nữa mới đến kỳ nhận tiền ({safeToSpend.nextPaydayStr}).
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={onBack}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, fontSize: 13, cursor: "pointer", color: T.inkSoft }}
        >
          ← Sửa lại
        </button>
        {showSplit && (
          <button
            onClick={() => handleSaveClick(true)}
            disabled={saving || editableTxs.length === 0}
            style={{
              flex: 1.5, padding: "10px 0", borderRadius: 10, border: "none",
              background: saving ? T.border : T.gold, fontSize: 12, fontWeight: 700,
              cursor: saving || editableTxs.length === 0 ? "default" : "pointer", color: "#3A2A08",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Users size={14} />}
            Lưu (phần tôi)
          </button>
        )}
        <button
          onClick={() => handleSaveClick(false)}
          disabled={saving || editableTxs.length === 0}
          style={{
            flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
            background: saving || editableTxs.length === 0 ? T.border : T.teal,
            fontSize: 13, fontWeight: 700,
            cursor: saving || editableTxs.length === 0 ? "default" : "pointer", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={14} />}
          {showSplit ? "Lưu toàn bộ" : "Lưu giao dịch"}
        </button>
      </div>
    </div>
  );
}

// ── Safe-to-Spend Form component (used in Budget tab) ─────────────────────────
function SafeToSpendForm({ userSettings, onUpdateSettings }) {
  const [payday, setPayday] = useState(userSettings?.payday_day || 1);
  const [reserve, setReserve] = useState(userSettings?.emergency_reserve || 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPayday(userSettings?.payday_day || 1);
    setReserve(userSettings?.emergency_reserve || 0);
  }, [userSettings]);

  function handleSave() {
    onUpdateSettings({ payday_day: payday, emergency_reserve: reserve });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Thiết lập kỳ trợ cấp & quỹ dự phòng:</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Ngày nhận tiền định kỳ:</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11.5, color: T.inkSoft }}>Ngày</span>
            <input
              type="number" min={1} max={31} value={payday}
              onChange={(e) => setPayday(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ width: 50, padding: "5px 6px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12.5, textAlign: "center", background: T.paper }}
            />
            <span style={{ fontSize: 11.5, color: T.inkSoft }}>hàng tháng</span>
          </div>
        </div>
        <div style={{ flex: 1.5 }}>
          <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Quỹ dự phòng khẩn cấp:</div>
          <input
            type="number" step={50000} min={0} value={reserve}
            onChange={(e) => setReserve(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="Số tiền giữ lại (VND)"
            style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12.5, background: T.paper }}
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        style={{
          width: "100%", background: saved ? "#388E3C" : T.teal, border: "none", borderRadius: 8,
          padding: "8px 0", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "background .2s"
        }}
      >
        <CheckCircle2 size={15} /> {saved ? "Đã lưu cài đặt Safe-to-Spend!" : "Lưu cài đặt Safe-to-Spend"}
      </button>
    </div>
  );
}

// ── Safe-to-Spend Quick Settings Modal (opened from HomeTab) ──────────────────
function SafeToSpendSettingsModal({ userSettings, onClose, onSave }) {
  const [payday, setPayday] = useState(userSettings?.payday_day || 1);
  const [reserve, setReserve] = useState(userSettings?.emergency_reserve || 0);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#20302Cb0", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 360, background: T.paper, borderRadius: 16, border: `1px solid ${T.border}`, padding: "20px 18px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={18} color={T.teal} />
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark }}>
              Cài đặt Safe-to-Spend
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 2 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 14, lineHeight: 1.4 }}>
          Cấu hình ngày nhận trợ cấp/lương và quỹ khẩn cấp để Tuấn tính toán hạn mức tiêu tối đa mỗi ngày cho bạn.
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
            Ngày nhận trợ cấp / lương định kỳ:
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: T.inkSoft }}>Ngày</span>
            <input
              type="number"
              min={1}
              max={31}
              value={payday}
              onChange={(e) => setPayday(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ width: 60, padding: "6px 8px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, textAlign: "center", background: T.card }}
            />
            <span style={{ fontSize: 12, color: T.inkSoft }}>hàng tháng</span>
          </div>
          <div style={{ fontSize: 10.5, color: T.inkSoft, marginTop: 3 }}>
            (Ví dụ: Ngày 1 nhận tiền gia đình gửi, hoặc ngày 15 nhận lương)
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>
            Quỹ dự phòng khẩn cấp giữ lại:
          </label>
          <input
            type="number"
            step={50000}
            min={0}
            value={reserve}
            onChange={(e) => setReserve(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="Số tiền giữ lại (VND)"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, background: T.card }}
          />
          <div style={{ fontSize: 10.5, color: T.inkSoft, marginTop: 3 }}>
            (Khoản tiền này sẽ không chia vào hạn mức tiêu để phòng sự cố đột xuất)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, fontSize: 12.5, cursor: "pointer", color: T.inkSoft }}
          >
            Hủy
          </button>
          <button
            onClick={() => onSave({ payday_day: payday, emergency_reserve: reserve })}
            style={{ flex: 1.5, padding: "9px 0", borderRadius: 8, border: "none", background: T.teal, fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

