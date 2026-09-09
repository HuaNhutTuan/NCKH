import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Send, MessageCircle,
  PiggyBank, AlertTriangle, X, Trash2, GraduationCap, Sparkles,
  Utensils, Bus, BookOpen, Gamepad2, Home, ShoppingBag, HeartPulse,
  MoreHorizontal, Coins, ChevronRight, Lightbulb, Target, CheckCircle2, LogOut,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { transactionsApi, budgetsApi } from "./api";

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

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => d.slice(0, 7);
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
  const [dataLoading, setDataLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: "expense", cat: "food", amount: "", note: "", date: todayStr() });

  // Tải giao dịch + ngân sách của tài khoản đang đăng nhập từ backend
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    Promise.all([transactionsApi.list(token), budgetsApi.list(token)])
      .then(([txData, budgetData]) => {
        if (cancelled) return;
        setTransactions(
          txData.transactions.map((t) => ({ ...t, cat: t.category, amount: Number(t.amount) }))
        );
        setBudgets(budgetData.budgets);
      })
      .catch((err) => console.error("Không thể tải dữ liệu:", err.message))
      .finally(() => !cancelled && setDataLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Chào bạn, mình là Lộc — trợ lý tài chính dành cho sinh viên. Mình có thể giúp bạn lập ngân sách, hiểu các khái niệm tài chính, hoặc nhận xét về chi tiêu tháng này. Bạn muốn bắt đầu từ đâu?",
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

  // ---------- actions ----------
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

    const systemPrompt = `Bạn là "Lộc", một trợ lý AI đồng hành giáo dục tài chính cá nhân dành riêng cho sinh viên Việt Nam, tích hợp trong ứng dụng quản lý chi tiêu.
Phong cách: gần gũi, khích lệ, nói tiếng Việt tự nhiên, ngắn gọn (dưới 150 từ trừ khi được yêu cầu chi tiết), dùng ví dụ cụ thể, không phán xét.
Mục tiêu: dạy kiến thức tài chính nền tảng (ngân sách, tiết kiệm, nợ, lãi suất, thói quen chi tiêu) và đưa lời khuyên thực tế phù hợp với thu nhập sinh viên (thường thấp, không ổn định).
Không đưa lời khuyên đầu tư cụ thể (không gợi ý mã cổ phiếu, tiền mã hoá cụ thể) hay tư vấn pháp lý/thuế; nếu được hỏi, hãy giải thích khái niệm chung và khuyên tìm chuyên gia.
Dữ liệu tài chính hiện tại của người dùng trong tháng này: Thu nhập ${fmtVND(stats.income)}, Chi tiêu ${fmtVND(stats.expense)}, Số dư hiện tại ${fmtVND(stats.balance)}. Top danh mục chi tiêu: ${topCats || "chưa có dữ liệu"}. ${overBudgetCats.length ? "Đã vượt ngân sách ở: " + overBudgetCats.join(", ") + "." : "Chưa vượt ngân sách nào."}
Hãy dùng dữ liệu này khi có liên quan để đưa ra lời khuyên cá nhân hoá, nhưng đừng liệt kê lại toàn bộ số liệu nếu người dùng không hỏi trực tiếp.`;

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const reply = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim()
        || "Xin lỗi, mình chưa nhận được phản hồi rõ ràng. Bạn thử hỏi lại nhé.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Có lỗi kết nối, bạn thử gửi lại tin nhắn nhé." }]);
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
        .tab-btn { transition: color .15s ease; }
        .chip-btn:hover { background: ${T.teal}14; border-color: ${T.teal}; }
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
            <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark }}>Lộc — Ví sinh viên</div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
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
            <HomeTab stats={stats} pieData={pieData} overBudgetCats={overBudgetCats} onAdd={() => setShowAdd(true)} transactions={transactions} />
          )}
          {!dataLoading && tab === "transactions" && (
            <TransactionsTab transactions={transactions} onDelete={deleteTx} onAdd={() => setShowAdd(true)} />
          )}
          {!dataLoading && tab === "budget" && (
            <BudgetTab budgets={budgets} onUpdateBudget={updateBudget} byCat={stats.byCat} />
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
                className="tab-btn"
                onClick={() => setTab(id)}
                style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "4px 2px", color: active ? T.teal : T.inkSoft,
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>

        {showAdd && (
          <AddTxModal form={form} setForm={setForm} onClose={() => setShowAdd(false)} onSubmit={addTransaction} />
        )}
      </div>
    </div>
  );
}

// ---------------- Home ----------------
function HomeTab({ stats, pieData, overBudgetCats, onAdd, transactions }) {
  const recent = transactions.slice(0, 4);
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

      <button
        onClick={onAdd}
        style={{
          marginTop: 12, width: "100%", background: T.gold, color: "#3A2A08", border: "none",
          borderRadius: 12, padding: "11px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <Plus size={17} /> Thêm giao dịch
      </button>

      {overBudgetCats.length > 0 && (
        <div style={{
          marginTop: 14, background: "#F4E3DE", border: `1px solid ${T.brick}55`, borderRadius: 12,
          padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: "#6E2E22" }}>
            Bạn đã vượt ngân sách ở: <strong>{overBudgetCats.join(", ")}</strong>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <SectionTitle label="Chi tiêu theo danh mục · tháng này" />
        {pieData.length === 0 ? (
          <EmptyNote text="Chưa có khoản chi nào trong tháng này." />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 128, height: 128, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={58} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke={T.paper} strokeWidth={2} />)}
                  </Pie>
                  <RTooltip formatter={(v) => fmtVND(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {pieData.sort((a, b) => b.value - a.value).slice(0, 5).map((d) => (
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
  const meta = catMeta(t.cat);
  return (
    <div className="ledger-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
      <IconBadge Icon={meta.Icon} color={meta.color} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note}</div>
        <div style={{ fontSize: 11, color: T.inkSoft }}>{meta.label} · {t.date}</div>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: t.type === "income" ? T.teal : T.brick, flexShrink: 0 }}>
        {t.type === "income" ? "+" : "-"}{fmtVND(t.amount)}
      </div>
      {onDelete && (
        <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 2 }}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ---------------- Transactions ----------------
function TransactionsTab({ transactions, onDelete, onAdd }) {
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Tất cả giao dịch</div>
        <button onClick={onAdd} style={{ background: T.teal, color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={14} /> Thêm
        </button>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {sorted.length === 0 ? <div style={{ padding: 16 }}><EmptyNote text="Chưa có giao dịch nào." /></div> :
          sorted.map((t) => <TxRow key={t.id} t={t} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

// ---------------- Budget ----------------
function BudgetTab({ budgets, onUpdateBudget, byCat }) {
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
      <div style={{ marginTop: 12, marginBottom: 4, fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Ngân sách theo danh mục</div>
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
                    <button onClick={() => saveEdit(c.id)} style={{ background: T.teal, border: "none", borderRadius: 6, padding: "0 8px", color: "#fff", cursor: "pointer" }}>
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(c.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: T.inkSoft }}>
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

      <SectionTitle label="Hỏi Lộc thêm về chủ đề này" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SUGGESTED_PROMPTS.map((q) => (
          <button key={q} onClick={() => onAsk(q)} className="chip-btn" style={{
            textAlign: "left", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "10px 12px", fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: T.ink,
          }}>
            {q} <ChevronRight size={14} color={T.inkSoft} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Chat ----------------
function ChatTab({ messages, chatInput, setChatInput, chatLoading, sendChat, chatEndRef }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginTop: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <Target size={16} color={T.teal} />
        <div style={{ fontSize: 12, color: T.inkSoft }}>Lộc biết dữ liệu chi tiêu của bạn để đưa lời khuyên phù hợp.</div>
      </div>

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
              Lộc đang soạn câu trả lời…
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
            placeholder="Hỏi Lộc về tài chính của bạn..."
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

// ---------------- Add transaction modal ----------------
function AddTxModal({ form, setForm, onClose, onSubmit }) {
  const cats = form.type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  return (
    <div style={{
      position: "absolute", inset: 0, background: "#20302Cb0", display: "flex",
      alignItems: "flex-end", zIndex: 20,
    }}>
      <div style={{ width: "100%", background: T.paper, borderRadius: "18px 18px 0 0", padding: "18px 20px 22px", border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Thêm giao dịch</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft }}><X size={20} /></button>
        </div>

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
                borderRadius: 10, cursor: "pointer", border: `1px solid ${form.cat === c.id ? c.color : T.border}`,
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
          onClick={onSubmit}
          style={{ width: "100%", background: T.gold, border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, color: "#3A2A08", cursor: "pointer" }}
        >
          Lưu giao dịch
        </button>
      </div>
    </div>
  );
}
