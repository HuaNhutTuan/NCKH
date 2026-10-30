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
  ShieldCheck, ShieldAlert, Settings, Calendar, Info, Search, Pencil, User,
  Eye, EyeOff, ChevronDown, ChevronUp, Check,
  HelpCircle, MoreVertical, Globe, ChevronsRight, Car, Receipt,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { transactionsApi, budgetsApi, chatApi, multimodalApi, settingsApi, knowledgeApi } from "./api";
import Toast from "./components/ui/Toast";
import ConfirmModal from "./components/ui/ConfirmModal";
import OnboardingModal from "./components/onboarding/OnboardingModal";
import EditTxModal from "./components/modals/EditTxModal";
import ProfileModal from "./components/ui/ProfileModal";
import LearnTab from "./components/learn/LearnTab";
import { formatThousands, parseThousands, handleNumericChange } from "./utils/format";
import tuanAvatar from "./assets/tuan_avatar.jpg";

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
  { id: "food", label: "Ăn uống", color: "#334155", bg: "#334155", iconColor: "#FFFFFF", Icon: Utensils },
  { id: "transport", label: "Di chuyển", color: "#D97706", bg: "#FDE68A", iconColor: "#D97706", Icon: Car },
  { id: "study", label: "Giáo dục", color: "#0F766E", bg: "#99F6E4", iconColor: "#0F766E", Icon: GraduationCap },
  { id: "entertainment", label: "Giải trí", color: "#7C3AED", bg: "#EDE9FE", iconColor: "#7C3AED", Icon: Gamepad2 },
  { id: "housing", label: "Nhà ở", color: "#B45309", bg: "#FEF3C7", iconColor: "#B45309", Icon: Home },
  { id: "shopping", label: "Mua sắm", color: "#BE185D", bg: "#FCE7F3", iconColor: "#BE185D", Icon: ShoppingBag },
  { id: "health", label: "Sức khỏe", color: "#DC2626", bg: "#FEE2E2", iconColor: "#DC2626", Icon: HeartPulse },
  { id: "other", label: "Khác", color: "#4B5563", bg: "#F3F4F6", iconColor: "#4B5563", Icon: MoreHorizontal },
];

const INCOME_CATS = [
  { id: "scholarship", label: "Học bổng", color: "#0F766E", bg: "#99F6E4", iconColor: "#0F766E", Icon: GraduationCap },
  { id: "allowance", label: "Trợ cấp gia đình", color: "#D97706", bg: "#FEF3C7", iconColor: "#D97706", Icon: Wallet },
  { id: "parttime", label: "Làm thêm", color: "#16A34A", bg: "#DCFCE7", iconColor: "#16A34A", Icon: Coins },
  { id: "other_income", label: "Khác", color: "#4B5563", bg: "#F3F4F6", iconColor: "#4B5563", Icon: MoreHorizontal },
];

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];
const catMeta = (id) => {
  if (id === "education") id = "study";
  return ALL_CATS.find((c) => c.id === id) || EXPENSE_CATS[7];
};

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
  const { token, user, logout, updateUser } = useAuth();
  const [tab, setTab] = useState("home");
  const [previousTab, setPreviousTab] = useState("home");
  const [showTuấnPill, setShowTuấnPill] = useState(true);

  // Hiển thị chữ "Trợ lý Tuấn" trong 3 giây đầu khi mở app rồi tự biến mất
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTuấnPill(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  const [showProfile, setShowProfile] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [userSettings, setUserSettings] = useState({ payday_day: 1, emergency_reserve: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [initialAddTab, setInitialAddTab] = useState("manual");
  const [form, setForm] = useState({ type: "expense", cat: "", nature: "need", amount: "", note: "", date: todayStr() });

  const openAddModal = (tab = "manual") => {
    setForm({ type: "expense", cat: "", nature: "need", amount: "", note: "", date: todayStr() });
    setInitialAddTab(tab);
    setShowAdd(true);
  };
  const [editingTx, setEditingTx] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", confirmText: "Đồng ý", onConfirm: null, isDanger: false });

  // Tải giao dịch + ngân sách + cài đặt Safe-to-Spend của tài khoản đang đăng nhập
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    Promise.all([transactionsApi.list(token), budgetsApi.list(token), settingsApi.get(token)])
      .then(([txData, budgetData, settingsData]) => {
        if (cancelled) return;
        const loadedTxs = txData.transactions.map((t) => {
          let cleanDate = t.date;
          if (typeof cleanDate === "string" && cleanDate.includes("T")) {
            const d = new Date(cleanDate);
            if (!isNaN(d.getTime())) {
              cleanDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
            }
          }
          return { ...t, cat: t.category, amount: Number(t.amount), nature: t.nature || (["entertainment", "shopping"].includes(t.category) ? "want" : "need"), date: cleanDate };
        });
        setTransactions(loadedTxs);
        setBudgets(budgetData.budgets);
        if (settingsData?.settings) {
          setUserSettings(settingsData.settings);
        }

        // Tự động mở Onboarding nếu người dùng mới chưa có giao dịch nào
        if (loadedTxs.length === 0 && (!settingsData?.settings || (Number(settingsData.settings.emergency_reserve) === 0 && settingsData.settings.payday_day === 1))) {
          setShowOnboarding(true);
        }
      })
      .catch((err) => console.error("Không thể tải dữ liệu:", err.message))
      .finally(() => !cancelled && setDataLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Chào bạn, mình là Tuấn — trợ lý tài chính đồng hành cùng sinh viên NCKH. Mình có thể giúp bạn phân tích chi tiêu, gợi ý tiết kiệm hoặc giải đáp các khái niệm tài chính. Bạn muốn bắt đầu từ đâu?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading, tab]);

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
    // Phân loại giáo dục Nhu cầu (Needs) vs Mong muốn (Wants) theo chuẩn 50/30/20
    const monthExpenses = monthTx.filter((t) => t.type === "expense");
    const needsExpense = monthExpenses.filter((t) => t.nature !== "want").reduce((s, t) => s + t.amount, 0);
    const wantsExpense = monthExpenses.filter((t) => t.nature === "want").reduce((s, t) => s + t.amount, 0);
    const needsPercent = expense > 0 ? Math.round((needsExpense / expense) * 100) : 50;
    const wantsPercent = expense > 0 ? Math.round((wantsExpense / expense) * 100) : 0;

    let disciplineScore = 80;
    if (expense > 0) {
      if (wantsPercent > 45) disciplineScore -= 30;
      else if (wantsPercent > 35) disciplineScore -= 15;
      else if (wantsPercent <= 30) disciplineScore += 10;
    }
    if (balance < 0) disciplineScore -= 20;
    else if (balance > 500000) disciplineScore += 10;
    disciplineScore = Math.max(20, Math.min(100, disciplineScore));

    return {
      income, expense, byCat, balance, monthTx,
      needsExpense, wantsExpense, needsPercent, wantsPercent, disciplineScore
    };
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

    const payday = Math.min(31, Math.max(1, userSettings?.payday_day || 1));
    const emergencyReserve = Number(userSettings?.emergency_reserve) || 0;

    // Helper: Tính số ngày tối đa trong tháng (xử lý chuẩn tháng 2 và tháng 30 ngày)
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    let nextPayday;
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    const clampedPaydayCurrent = Math.min(payday, daysInCurrentMonth);

    if (currentDay < clampedPaydayCurrent) {
      nextPayday = new Date(currentYear, currentMonth, clampedPaydayCurrent);
    } else {
      const daysInNextMonth = getDaysInMonth(currentYear, currentMonth + 1);
      const clampedPaydayNext = Math.min(payday, daysInNextMonth);
      nextPayday = new Date(currentYear, currentMonth + 1, clampedPaydayNext);
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
      setToast({ message: "Đã lưu cài đặt hạn mức Safe-to-Spend!", type: "success" });
    } catch (err) {
      setToast({ message: "Không thể lưu cài đặt: " + err.message, type: "error" });
    }
  }

  async function handleOnboardingComplete({ initialBalance, payday_day, emergency_reserve }) {
    setShowOnboarding(false);
    try {
      await settingsApi.update(token, { payday_day, emergency_reserve });
      setUserSettings({ payday_day, emergency_reserve });
      if (initialBalance > 0) {
        const { transaction } = await transactionsApi.create(token, {
          type: "income",
          category: "allowance",
          amount: initialBalance,
          note: "Số dư ví ban đầu",
          date: todayStr(),
        });
        setTransactions([{ ...transaction, cat: transaction.category, amount: Number(transaction.amount) }]);
      }
      setToast({ message: "Thiết lập thành công! Hãy theo dõi hạn mức mỗi ngày.", type: "success" });
    } catch (err) {
      setToast({ message: "Lỗi lưu thiết lập: " + err.message, type: "error" });
    }
  }

  async function addTransaction() {
    const amt = parseThousands(form.amount);
    if (!amt || amt <= 0) return;
    if (!form.cat) {
      setToast({ message: "Vui lòng chọn danh mục cho giao dịch!", type: "error" });
      return;
    }
    const txNature = form.nature || (["entertainment", "shopping"].includes(form.cat) ? "want" : "need");
    const payload = {
      type: form.type,
      category: form.cat,
      amount: amt,
      nature: txNature,
      note: form.note || "(không ghi chú)",
      date: form.date,
    };
    try {
      const { transaction } = await transactionsApi.create(token, payload);
      setTransactions((prev) => [{ ...transaction, cat: transaction.category, nature: transaction.nature || txNature, amount: Number(transaction.amount) }, ...prev]);
      setForm({ type: "expense", cat: "", nature: "need", amount: "", note: "", date: todayStr() });
      setShowAdd(false);
      setToast({ message: `Đã lưu giao dịch: ${fmtVND(amt)}!`, type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  }

  async function editTransaction(updatedTx) {
    try {
      const res = await transactionsApi.update(token, updatedTx.id, {
        type: updatedTx.type,
        category: updatedTx.category || updatedTx.cat,
        amount: updatedTx.amount,
        nature: updatedTx.nature || "need",
        note: updatedTx.note,
        date: updatedTx.date,
      });
      const saved = res.transaction;
      setTransactions((prev) =>
        prev.map((t) => (t.id === saved.id ? { ...saved, cat: saved.category, nature: saved.nature || updatedTx.nature || "need", amount: Number(saved.amount) } : t))
      );
      setToast({ message: "Đã cập nhật giao dịch thành công!", type: "success" });
    } catch (err) {
      setToast({ message: "Lỗi cập nhật: " + err.message, type: "error" });
      throw err;
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
        results.push({ ...transaction, cat: transaction.category, amount: Number(transaction.amount) });
      } catch (err) {
        console.error("Lỗi lưu giao dịch:", err.message);
      }
    }
    if (results.length > 0) {
      setTransactions((prev) => [...results.reverse(), ...prev]);
      setShowAdd(false);
      setToast({
        message: `Đã ghi nhận ${results.length} giao dịch!`,
        type: "success",
        undoLabel: "Hoàn tác",
        duration: 6000,
        onUndo: async () => {
          for (const item of results) {
            try {
              await transactionsApi.remove(token, item.id);
            } catch (e) {}
          }
          setTransactions((prev) => prev.filter((t) => !results.some((r) => r.id === t.id)));
          setToast({ message: "Đã hoàn tác các giao dịch vừa tạo.", type: "info" });
        },
      });
    }
  }

  async function deleteTx(id) {
    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) return;
    try {
      await transactionsApi.remove(token, id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setToast({
        message: `Đã xóa "${txToDelete.note || catMeta(txToDelete.cat).label}" (${fmtVND(txToDelete.amount)})`,
        type: "info",
        undoLabel: "Hoàn tác",
        duration: 6000,
        onUndo: async () => {
          try {
            const { transaction } = await transactionsApi.create(token, {
              type: txToDelete.type,
              category: txToDelete.cat || txToDelete.category,
              amount: txToDelete.amount,
              note: txToDelete.note,
              date: txToDelete.date,
            });
            setTransactions((prev) => [{ ...transaction, cat: transaction.category, amount: Number(transaction.amount) }, ...prev]);
            setToast({ message: "Đã khôi phục giao dịch!", type: "success" });
          } catch (e) {
            setToast({ message: "Không thể khôi phục: " + e.message, type: "error" });
          }
        },
      });
    } catch (err) {
      setToast({ message: "Không thể xoá giao dịch: " + err.message, type: "error" });
    }
  }

  async function updateBudget(category, limit) {
    try {
      await budgetsApi.update(token, category, limit);
      setBudgets((prev) => ({ ...prev, [category]: limit }));
      setToast({ message: "Đã cập nhật ngân sách danh mục!", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
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

    const systemPrompt = `Bạn là "Tuấn", Cố vấn Giáo dục Tài chính Cá nhân đồng hành (Peer-Mentor) theo phương pháp gợi mở Socratic dành cho sinh viên Việt Nam (Đề tài Nghiên cứu Khoa học).
HÌNH TƯỢNG SƯ PHẠM & NGUYÊN TẮC SOCRATIC:
1. KHÔNG GIẢI BÀI HỘ: Khi sinh viên hỏi nên chi tiêu thế nào hay có nên mua gì không, không lập sẵn kế hoạch hay phán xét, mà đặt câu hỏi gợi mở để người học tự rà soát chi phí Thiết yếu (Needs) vs Mong muốn (Wants).
2. TIẾP CẬN 4 BẬC THANG NHẬN THỨC: Chẩn đoán (Diagnosis) -> Gợi ý phản tư (Reflection) -> Thử thách hành động (Action Challenge) -> Đúc kết bài học (Consolidation).
3. ĐỒNG CẢM & NUÔI DƯỠNG TƯ DUY PHÁT TRIỂN: Luôn ghi nhận nỗ lực ghi chép của sinh viên trước khi chỉ ra các điểm cần tối ưu hóa. Tuyệt đối không rao giảng đạo đức.
4. KIỂM SOÁT TẢI LƯỢNG NHẬN THỨC: Trả lời ngắn gọn dưới 150 từ, trình bày gãy gọn và kết thúc bằng DUY NHẤT 1 CÂU HỎI TRỌNG TÂM để người học tập trung phản tư.
5. Tuyệt đối không phím mã cổ phiếu, crypto hay tư vấn vay nợ rủi ro.

DỮ LIỆU TÀI CHÍNH THÁNG NÀY CỦA SINH VIÊN:
- Thu nhập: ${fmtVND(stats.income)} | Chi tiêu: ${fmtVND(stats.expense)} | Số dư: ${fmtVND(stats.balance)}.
- Thiết yếu (Needs): ${fmtVND(stats.needsExpense || 0)} (${stats.needsPercent || 0}%).
- Mong muốn (Wants): ${fmtVND(stats.wantsExpense || 0)} (${stats.wantsPercent || 0}%).
- Điểm kỷ luật: ${stats.disciplineScore || 80}/100.
- Top danh mục chi: ${topCats || "chưa có"}. ${overBudgetCats.length ? "Đã vượt hạn mức ở: " + overBudgetCats.join(", ") + "." : "Ngân sách an toàn."}
Hãy dùng dữ liệu này để đưa ra câu hỏi gợi mở hoặc lời khuyên sư phạm phù hợp.`;

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

  // NAV gồm 4 tab học phần + FAB nổi ở giữa
  const NAV_LEFT = [
    { id: "home", label: "Trang chủ", Icon: Wallet },
    { id: "transactions", label: "Sổ giao dịch", Icon: Receipt },
  ];
  const NAV_RIGHT = [
    { id: "learn", label: "Học tập", Icon: GraduationCap },
    { id: "budget", label: "Ngân sách", Icon: PiggyBank },
  ];

  const currentDateVN = useMemo(() => {
    const now = new Date();
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const dayName = days[now.getDay()];
    return `${dayName}, ngày ${now.getDate()} tháng ${now.getMonth() + 1}`;
  }, []);

  return (
    <div className="loc-shell-wrapper" style={{ fontFamily: "'Space Grotesk','Inter',sans-serif", color: T.ink, background: "transparent" }}>
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
        .fab-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .fab-btn:active { transform: scale(0.93); }
        .fab-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(217,164,65,0.55) !important; }
      `}</style>

      <div
        className="loc-shell"
        style={{
          background: T.paper,
          position: "relative",
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(218, 213, 196, 0.42) 28px)`,
        }}
      >
        {/* Header — Ngày & Người dùng (ẩn khi ở tab sổ giao dịch) */}
        {tab !== "transactions" && (
          <div className="loc-shell-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.paper, flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
            <div style={{ fontSize: 11, color: T.inkSoft, fontWeight: 500, letterSpacing: 0.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Xin chào, {user?.name || "bạn"}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentDateVN}
            </div>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            title="Hồ sơ cá nhân"
            className="btn-profile"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: user?.avatar_url ? "transparent" : `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
              border: `2px solid ${T.teal}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(31,111,99,0.3)",
              flexShrink: 0,
              padding: 0,
              overflow: "hidden",
            }}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                {user?.name
                  ? user.name.trim().split(" ").filter(Boolean).slice(-2).map((w) => w[0].toUpperCase()).join("")
                  : <User size={18} color="#fff" />}
              </span>
            )}
          </button>
        </div>
        )}

        {/* Body */}
        {tab !== "chat" ? (
          tab === "transactions" ? (
            <div
              className="loc-scroll-ledger"
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: 85,
                background: "#FFFFFF",
              }}
            >
              {dataLoading && (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.inkSoft, fontSize: 13 }}>Đang tải dữ liệu của bạn...</div>
              )}
              {!dataLoading && (
                <TransactionsTab
                  transactions={transactions}
                  balance={stats.balance}
                  onDelete={deleteTx}
                  onEdit={(tx) => setEditingTx(tx)}
                  onAdd={() => openAddModal("manual")}
                  onOpenProfile={() => setShowProfile(true)}
                />
              )}
            </div>
          ) : (
            <div className="loc-scroll" style={{ flex: 1, overflowY: "auto" }}>
              {dataLoading && (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.inkSoft, fontSize: 13 }}>Đang tải dữ liệu của bạn...</div>
              )}
              {!dataLoading && tab === "home" && (
                <HomeTab
                  stats={stats}
                  pieData={pieData}
                  overBudgetCats={overBudgetCats}
                  onAdd={() => openAddModal("manual")}
                  onOpenVoice={() => openAddModal("voice")}
                  onOpenImage={() => openAddModal("image")}
                  transactions={transactions}
                  safeToSpend={safeToSpend}
                  onOpenSettings={() => setShowSettings(true)}
                  onEditTx={(tx) => setEditingTx(tx)}
                  onDeleteTx={deleteTx}
                />
              )}
            {!dataLoading && tab === "budget" && (
              <div style={{ paddingBottom: 20 }}>
                <BudgetTab
                  budgets={budgets}
                  onUpdateBudget={updateBudget}
                  byCat={stats.byCat}
                  userSettings={userSettings}
                  onUpdateSettings={updateSettings}
                  safeToSpend={safeToSpend}
                />
              </div>
            )}
            {!dataLoading && tab === "learn" && (
              <LearnTab
                onAsk={(q) => { setPreviousTab(tab); setTab("chat"); setChatInput(q); }}
                stats={stats}
                transactions={transactions}
              />
            )}
          </div>
          )
        ) : (
          <div className="loc-chat-wrapper">
            {dataLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: T.inkSoft, fontSize: 13 }}>Đang tải dữ liệu của bạn...</div>
            ) : (
              <ChatTab
                messages={messages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                sendChat={sendChat}
                chatEndRef={chatEndRef}
                user={user}
                token={token}
                onClose={() => setTab(previousTab || "home")}
              />
            )}
          </div>
        )}

        {/* Bottom nav — 4 tab + FAB nổi ở giữa */}
        <div
          className="loc-bottom-nav"
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, background: T.card,
            borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center",
            zIndex: 10,
          }}
        >
          {/* 2 tab trái */}
          {NAV_LEFT.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { setPreviousTab(id); setTab(id); }}
                style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "4px 2px", color: active ? T.teal : T.inkSoft,
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}

          {/* Nút FAB nổi [ + ] ở chính giữa */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
            <button
              className="fab-btn"
              onClick={() => openAddModal("manual")}
              title="Thêm giao dịch"
              style={{
                width: 46, height: 46, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.gold}, #C8922A)`,
                border: "3px solid " + T.card,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px rgba(217,164,65,0.45)",
                marginTop: -22,
                marginBottom: 2,
              }}
            >
              <Plus size={24} color="#3A2A08" strokeWidth={2.8} />
            </button>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.gold, lineHeight: 1.2 }}>Thêm</span>
          </div>

          {/* 2 tab phải */}
          {NAV_RIGHT.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => { setPreviousTab(id); setTab(id); }}
                style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "4px 2px", color: active ? T.teal : T.inkSoft,
                }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal: Thêm giao dịch */}
        {showAdd && (
          <AddTxModal
            form={form}
            setForm={setForm}
            onClose={() => {
              setShowAdd(false);
              setForm({ type: "expense", cat: "", nature: "need", amount: "", note: "", date: todayStr() });
            }}
            onSubmit={addTransaction}
            token={token}
            onSaveMultiple={addMultipleTransactions}
            safeToSpend={safeToSpend}
            initialTab={initialAddTab}
          />
        )}

        {/* Modal: Chỉnh sửa giao dịch */}
        {editingTx && (
          <EditTxModal
            tx={editingTx}
            onClose={() => setEditingTx(null)}
            onSave={editTransaction}
            onDelete={deleteTx}
            safeToSpend={safeToSpend}
          />
        )}

        {/* Modal: Cài đặt Safe-to-Spend */}
        {showSettings && (
          <SafeToSpendSettingsModal
            userSettings={userSettings}
            onClose={() => setShowSettings(false)}
            onSave={updateSettings}
            safeToSpend={safeToSpend}
          />
        )}

        {/* Onboarding wizard */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />

        {/* Modal: Profile người dùng */}
        {showProfile && (
          <ProfileModal
            user={user}
            token={token}
            onClose={() => setShowProfile(false)}
            onLogout={logout}
            onUserUpdate={(updated) => updateUser?.(updated)}
            onClearData={() => {
              setTransactions([]);
              setBudgets({});
              setUserSettings({ payday_day: 1, emergency_reserve: 0 });
              setToast({
                message: "Đã xóa toàn bộ dữ liệu giao dịch và ngân sách thành công.",
                type: "info",
              });
            }}
          />
        )}

        {/* ConfirmModal (dùng thay thế window.confirm) */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDanger={confirmModal.isDanger}
          onConfirm={() => {
            confirmModal.onConfirm?.();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Toast notification với Undo */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* ── Bong bóng chat Trợ lý Tuấn nổi ở góc dưới màn hình ── */}
        <div
          className="loc-floating-chat-container"
          style={{
            position: "absolute",
            right: 16,
            bottom: "calc(66px + env(safe-area-inset-bottom, 0px))",
            zIndex: 35,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {tab !== "chat" && (
            <div
              className={`chat-bubble-pill ${!showTuấnPill ? "pill-hidden" : ""}`}
              onClick={() => {
                setPreviousTab(tab);
                setTab("chat");
              }}
              title="Nhấn để trò chuyện cùng Trợ lý Tuấn"
              style={{
                background: T.card,
                color: T.tealDark,
                border: `1px solid ${T.teal}44`,
                padding: "6px 11px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                boxShadow: "0 3px 12px rgba(31,111,99,0.12)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Sparkles size={13} color={T.goldDark} />
              <span>Trợ lý Tuấn</span>
            </div>
          )}
          <button
            className="loc-chat-bubble"
            onClick={() => {
              if (tab === "chat") {
                setTab(previousTab || "home");
              } else {
                setPreviousTab(tab);
                setTab("chat");
              }
            }}
            title={tab === "chat" ? "Đóng trợ lý Tuấn" : "Trò chuyện với Trợ lý Tuấn"}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: tab === "chat"
                ? `linear-gradient(135deg, #AE4C3B, #8B3527)`
                : "#FFFFFF",
              border: "2.5px solid #FFFFFF",
              boxShadow: tab === "chat"
                ? "0 4px 16px rgba(174, 76, 59, 0.45)"
                : "0 4px 16px rgba(31, 111, 99, 0.35)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
              padding: 0,
            }}
          >
            {tab === "chat" ? (
              <X size={24} color="#FFFFFF" strokeWidth={2.6} />
            ) : (
              <>
                <img
                  src={tuanAvatar}
                  alt="Trợ lý Tuấn"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    objectPosition: "center 20%",
                    display: "block",
                  }}
                />
                {/* Chấm xanh online */}
                <span
                  style={{
                    position: "absolute",
                    bottom: 1,
                    right: 1,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#22C55E",
                    border: "2px solid #FFFFFF",
                    boxShadow: "0 0 5px rgba(34,197,94,0.7)",
                    zIndex: 2,
                  }}
                />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}


// ---------------- Home ----------------
function HomeTab({ stats, pieData, overBudgetCats, onAdd, onOpenVoice, onOpenImage, transactions, safeToSpend, onOpenSettings, onEditTx, onDeleteTx }) {
  const recent = transactions.slice(0, 4);

  const [hideBalance, setHideBalance] = useState(() => {
    try {
      return localStorage.getItem("loc_hide_balance") === "true";
    } catch {
      return false;
    }
  });

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("loc_hide_balance", String(next));
      } catch {}
      return next;
    });
  };

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
      {/* ── Smart Wallet Card: Số dư ví + Hạn mức Safe-to-Spend tích hợp ── */}
      <div style={{
        marginTop: 10, background: `linear-gradient(145deg, ${T.tealDark}, #174b43)`,
        borderRadius: 18, padding: "18px 18px 14px",
        color: "#F1EEE3", position: "relative", overflow: "hidden",
        boxShadow: "0 6px 20px rgba(18, 63, 56, 0.22)",
      }}>
        {/* Số dư Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12, opacity: 0.82, fontWeight: 500 }}>Số dư hiện tại</span>
            <button
              type="button"
              onClick={toggleHideBalance}
              title={hideBalance ? "Hiện số dư" : "Ẩn số dư"}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                cursor: "pointer",
                padding: "3px 6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F1EEE3",
                borderRadius: 6,
                transition: "background 0.15s",
              }}
            >
              {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={onOpenSettings}
            title="Cài đặt hạn mức Safe-to-Spend"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#F1EEE3",
              borderRadius: 6,
              fontSize: 11,
              transition: "background 0.15s",
            }}
          >
            <Settings size={12} />
            <span>Cài đặt</span>
          </button>
        </div>

        {/* Số dư to */}
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Space Grotesk',sans-serif",
          marginTop: 6,
          letterSpacing: hideBalance ? "2px" : "normal",
        }}>
          {hideBalance ? "••••••••" : fmtVND(stats.balance)}
        </div>

        {/* Thu vs Chi mini row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", marginTop: 8, paddingBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <TrendingUp size={14} color="#D9A441" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, opacity: 0.9, whiteSpace: "nowrap" }}>Thu: {fmtVND(stats.income)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <TrendingDown size={14} color="#E08D7A" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, opacity: 0.9, whiteSpace: "nowrap" }}>Chi: {fmtVND(stats.expense)}</span>
          </div>
        </div>

        {/* Sub-Card: Hạn mức hôm nay (Safe-to-Spend) */}
        <div style={{
          background: "rgba(0, 0, 0, 0.22)",
          borderRadius: 12,
          padding: "10px 12px",
          border: `1px solid ${safeToSpend?.isOverBudget ? "rgba(224, 141, 122, 0.45)" : "rgba(255, 255, 255, 0.12)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {safeToSpend?.isOverBudget ? (
                <ShieldAlert size={15} color="#E08D7A" style={{ flexShrink: 0 }} />
              ) : (
                <ShieldCheck size={15} color="#4C8C63" style={{ flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 11.5, opacity: 0.92, fontWeight: 600 }}>
                {safeToSpend?.isOverBudget ? "Đã vượt hạn mức ngày:" : "Hạn mức hôm nay (Safe-to-Spend):"}
              </span>
            </div>
            <span style={{
              fontSize: 14, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
              color: safeToSpend?.isOverBudget ? "#E08D7A" : "#D9A441"
            }}>
              {safeToSpend?.isOverBudget ? `-${fmtVND(safeToSpend.overAmount)}` : fmtVND(safeToSpend?.remainingToday || 0)}
            </span>
          </div>

          <div style={{ marginBottom: 6 }}>
            <ProgressBar
              value={safeToSpend?.todayExpenses || 0}
              max={safeToSpend?.dailyLimit || 1}
              color={safeToSpend?.percentSpent > 80 ? T.gold : "#4C8C63"}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10.5, opacity: 0.8 }}>
            <span>Đã chi: {fmtVND(safeToSpend?.todayExpenses || 0)} / {fmtVND(safeToSpend?.dailyLimit || 0)}</span>
            <span>⏳ Còn {safeToSpend?.daysRemaining} ngày ({safeToSpend?.nextPaydayStr})</span>
          </div>
        </div>
      </div>

      {/* ── Quick Action Pills (2 nút rút gọn: Nói để ghi & Chụp ảnh hóa đơn) ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={onOpenVoice}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 13, fontSize: 12.5, fontWeight: 600,
            background: T.card, color: T.tealDark, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
          title="Nói để ghi chép giao dịch nhanh"
        >
          <Mic size={15} color={T.teal} />
          <span>Nói để ghi</span>
        </button>

        <button
          onClick={onOpenImage}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 13, fontSize: 12.5, fontWeight: 600,
            background: T.card, color: T.tealDark, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
          title="Chụp hình ảnh hóa đơn để lưu giao dịch"
        >
          <Camera size={15} color="#3E7CA6" />
          <span>Chụp ảnh hóa đơn</span>
        </button>
      </div>

      {/* Cảnh báo vượt hạn mức (nếu có) */}
      {safeToSpend?.isOverBudget && (
        <div style={{
          marginTop: 10, background: "#FFF3F0", border: `1px solid ${T.brick}66`, borderRadius: 12,
          padding: "10px 12px", display: "flex", gap: 8, alignItems: "center",
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: "#7B2317", lineHeight: 1.4 }}>
            Hôm nay bạn chi vượt hạn mức <strong>{fmtVND(safeToSpend.overAmount)}</strong>. Hãy tiết chế trong <strong>{safeToSpend.daysRemaining} ngày tới</strong> nhé!
          </div>
        </div>
      )}

      {overBudgetCats.length > 0 && (
        <div style={{
          marginTop: 10, background: "#F4E3DE", border: `1px solid ${T.brick}55`, borderRadius: 12,
          padding: "10px 12px", display: "flex", gap: 8, alignItems: "center",
        }}>
          <AlertTriangle size={16} color={T.brick} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 11.5, color: "#6E2E22" }}>
            Vượt ngân sách danh mục: <strong>{overBudgetCats.join(", ")}</strong>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {/* Header: title + period pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 112, height: 112, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={filteredPieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50} paddingAngle={2}>
                    {filteredPieData.map((d, i) => <Cell key={i} fill={d.color} stroke={T.paper} strokeWidth={2} />)}
                  </Pie>
                  <RTooltip formatter={(v) => fmtVND(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {[...filteredPieData].sort((a, b) => b.value - a.value).slice(0, 5).map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: T.inkSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0, fontSize: 11.5 }}>{fmtVND(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 22, marginBottom: 8 }}>
        <SectionTitle label="Giao dịch gần đây" />
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {recent.map((t) => <TxRow key={t.id} t={t} onEdit={onEditTx} onDelete={onDeleteTx} />)}
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

function TxRow({ t, onDelete, onEdit }) {
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
        <div style={{ fontSize: 10.5, color: T.inkSoft, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
          <span>{meta.label} · {formatDateVN(t.date)}</span>
          {t.type === "expense" && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
              background: t.nature === "want" ? "#FEF3C7" : "#D1FAE5",
              color: t.nature === "want" ? "#92400E" : "#065F46",
              border: `1px solid ${t.nature === "want" ? "#FDE68A" : "#A7F3D0"}`
            }}>
              {t.nature === "want" ? "Mong muốn" : "Thiết yếu"}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: t.type === "income" ? T.teal : T.brick, flexShrink: 0, marginLeft: 4 }}>
        {t.type === "income" ? "+" : "-"}{fmtVND(t.amount)}
      </div>
      {/* Nút Sửa */}
      {onEdit && (
        <button
          onClick={() => onEdit(t)}
          title="Sửa giao dịch"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 2 }}
        >
          <Pencil size={13} />
        </button>
      )}
      {/* Nút Xóa */}
      {onDelete && (
        <button
          onClick={() => onDelete(t.id)}
          title="Xóa giao dịch"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 0 }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ---------------- Money Lover Category Icon Atom ----------------
function CategoryIconML({ meta }) {
  const IconComp = meta?.Icon || MoreHorizontal;
  const bg = meta?.bg || "#F3F4F6";
  const iconColor = meta?.iconColor || meta?.color || "#111827";

  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0, marginRight: 14 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: iconColor,
        }}
      >
        <IconComp size={22} strokeWidth={2.2} />
      </div>
      {/* Mini wallet badge */}
      <div
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 15,
          height: 15,
          borderRadius: 4,
          background: "#D97706",
          border: "1.5px solid #FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      >
        <Wallet size={8} color="#FFFFFF" strokeWidth={2.4} />
      </div>
    </div>
  );
}

// ---------------- Helpers for Money Lover Journal ----------------
function formatVNDAmount(amount) {
  return Math.abs(Math.round(amount || 0)).toLocaleString("en-US");
}

function formatDayTotalVN(amount) {
  const rounded = Math.round(amount || 0);
  const formatted = Math.abs(rounded).toLocaleString("en-US");
  if (rounded < 0) return `-${formatted}`;
  if (rounded > 0) return `+${formatted}`;
  return "0";
}

function formatBalanceVND(balance) {
  const rounded = Math.round(balance || 0);
  const formatted = Math.abs(rounded).toLocaleString("en-US");
  return (rounded < 0 ? "-" : "") + formatted + " đ";
}

function parseTxDate(dateStr) {
  if (!dateStr) return { day: "", dayName: "", monthYear: "" };
  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = clean.split("-");
  if (parts.length < 3) return { day: "", dayName: "", monthYear: "" };
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m - 1, d);
  const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  return {
    day: String(d).padStart(2, "0"),
    dayName: isNaN(dt.getTime()) ? "" : dayNames[dt.getDay()],
    monthYear: `tháng ${m} ${y}`,
  };
}

// ---------------- Transactions (Sổ giao dịch / Nhật ký) ----------------
function TransactionsTab({ transactions = [], balance = 0, onDelete, onEdit, onAdd, onOpenProfile }) {
  const [refDate, setRefDate] = useState(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const hasCurrent = transactions.some((t) => (t.date || "").startsWith(currentMonthKey));
    if (hasCurrent) return now;
    if (transactions.length > 0) {
      const dates = transactions
        .map((t) => (t.date || "").split("T")[0])
        .filter(Boolean)
        .sort()
        .reverse();
      if (dates[0]) {
        const [y, m] = dates[0].split("-").map(Number);
        return new Date(y, m - 1, 1);
      }
    }
    return now;
  });

  const [walletFilter, setWalletFilter] = useState("all"); // "all" | "expense" | "income" | "need" | "want"
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const currMonthLabel = `${String(refDate.getMonth() + 1).padStart(2, "0")}/${refDate.getFullYear()}`;
  const prevMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const prevMonthLabel = `${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}/${prevMonthDate.getFullYear()}`;
  const nextMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
  const nextMonthLabel = `${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}/${nextMonthDate.getFullYear()}`;

  function handleMonthChange(delta) {
    setRefDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function handleJumpCurrent() {
    setRefDate(new Date());
  }

  const selectedMonthPrefix = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}`;

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = (t.date || "").split("T")[0];
      return d.startsWith(selectedMonthPrefix);
    });
  }, [transactions, selectedMonthPrefix]);

  const filteredTransactions = useMemo(() => {
    let list = [...monthTransactions];
    if (walletFilter === "expense") {
      list = list.filter((t) => t.type === "expense");
    } else if (walletFilter === "income") {
      list = list.filter((t) => t.type === "income");
    } else if (walletFilter === "need") {
      list = list.filter((t) => t.type === "expense" && t.nature !== "want");
    } else if (walletFilter === "want") {
      list = list.filter((t) => t.type === "expense" && t.nature === "want");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((t) => {
        const meta = catMeta(t.cat);
        return (
          (t.note || "").toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          (t.date || "").includes(q)
        );
      });
    }

    return list;
  }, [monthTransactions, walletFilter, searchQuery]);

  const groupedByDate = useMemo(() => {
    const map = {};
    filteredTransactions.forEach((t) => {
      const dStr = (t.date || "").split("T")[0];
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(t);
    });
    const sortedDates = Object.keys(map).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    return sortedDates.map((dateKey) => {
      const items = map[dateKey].sort((a, b) => (b.id || 0) - (a.id || 0));
      const dayTotal = items.reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
      return {
        dateKey,
        items,
        dayTotal,
        parsed: parseTxDate(dateKey),
      };
    });
  }, [filteredTransactions]);

  const walletName = useMemo(() => {
    if (walletFilter === "expense") return "Khoản chi";
    if (walletFilter === "income") return "Khoản thu";
    if (walletFilter === "need") return "Thiết yếu";
    if (walletFilter === "want") return "Mong muốn";
    return "Tổng cộng";
  }, [walletFilter]);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100%", width: "100%" }}>
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px 8px",
          background: "#FFFFFF",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Left: Help button */}
        <button
          onClick={() => setShowHelp(true)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", borderRadius: "50%" }}
          title="Trợ giúp"
        >
          <HelpCircle size={22} color="#1F2937" strokeWidth={1.8} />
        </button>

        {/* Center: Dropdown badge */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setShowWalletMenu(!showWalletMenu);
              setShowMoreMenu(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: "#F3F4F6",
              border: "none",
              borderRadius: 20,
              cursor: "pointer",
              color: "#1F2937",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Globe size={16} color="#0D9488" strokeWidth={2} />
            <span>{walletName}</span>
            <ChevronDown size={14} color="#6B7280" />
          </button>

          {/* Dropdown Menu */}
          {showWalletMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 100 }}
                onClick={() => setShowWalletMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 220,
                  background: "#FFFFFF",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  border: "1px solid #E5E7EB",
                  zIndex: 101,
                  overflow: "hidden",
                  padding: "4px 0",
                }}
              >
                {[
                  { id: "all", label: "Tất cả ví (Tổng cộng)" },
                  { id: "expense", label: "Chỉ khoản chi tiêu" },
                  { id: "income", label: "Chỉ khoản thu nhập" },
                  { id: "need", label: "🟢 Thiết yếu (Needs)" },
                  { id: "want", label: "🟡 Mong muốn (Wants)" },
                ].map((item) => {
                  const isSelected = walletFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setWalletFilter(item.id);
                        setShowWalletMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        textAlign: "left",
                        background: isSelected ? "#F3F4F6" : "transparent",
                        border: "none",
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#0D9488" : "#374151",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={14} color="#0D9488" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: Search and More options */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{
              background: showSearch ? "#F3F4F6" : "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
            }}
            title="Tìm kiếm"
          >
            <Search size={22} color={showSearch ? "#0D9488" : "#1F2937"} strokeWidth={1.8} />
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowMoreMenu(!showMoreMenu);
                setShowWalletMenu(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center" }}
              title="Tùy chọn khác"
            >
              <MoreVertical size={22} color="#1F2937" strokeWidth={1.8} />
            </button>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 100 }}
                  onClick={() => setShowMoreMenu(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: 190,
                    background: "#FFFFFF",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    border: "1px solid #E5E7EB",
                    zIndex: 101,
                    overflow: "hidden",
                    padding: "4px 0",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onAdd && onAdd();
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      fontSize: 13,
                      color: "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Plus size={15} color="#0D9488" /> Thêm giao dịch mới
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowSearch(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      fontSize: 13,
                      color: "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Search size={15} color="#374151" /> Tìm kiếm giao dịch
                  </button>
                  {onOpenProfile && (
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        onOpenProfile();
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        fontSize: 13,
                        color: "#374151",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <User size={15} color="#374151" /> Hồ sơ cá nhân
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setWalletFilter("all");
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      borderTop: "1px solid #F3F4F6",
                      fontSize: 13,
                      color: "#6B7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <X size={15} color="#6B7280" /> Bỏ tất cả bộ lọc
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      {showSearch && (
        <div style={{ padding: "0 16px 12px", background: "#FFFFFF", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: 10, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Tìm theo ghi chú, số tiền, ngày..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "8px 30px 8px 34px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                color: "#1F2937",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 8, background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
              >
                <X size={14} color="#9CA3AF" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Balance Section ── */}
      <div style={{ textAlign: "center", padding: "10px 16px 12px", background: "#FFFFFF" }}>
        <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginBottom: 4 }}>
          Số dư
        </div>
        <div
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: "#111827",
            fontFamily: "'Space Grotesk', -apple-system, sans-serif",
            letterSpacing: -0.3,
          }}
        >
          {formatBalanceVND(balance)}
        </div>
      </div>

      {/* ── Month Navigation Carousel ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 16px 10px",
          background: "#FFFFFF",
          borderBottom: "1px solid #ECEEF1",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, gap: 20 }}>
          {/* Previous Month */}
          <button
            onClick={() => handleMonthChange(-1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              fontSize: 14,
              fontWeight: 500,
              padding: "4px 8px",
            }}
          >
            {prevMonthLabel}
          </button>

          {/* Selected Month */}
          <div style={{ textAlign: "center", position: "relative", padding: "4px 8px" }}>
            <div style={{ color: "#111827", fontSize: 15, fontWeight: 700 }}>
              {currMonthLabel}
            </div>
            <div
              style={{
                width: 36,
                height: 3.5,
                background: "#111827",
                borderRadius: 2,
                margin: "4px auto 0",
              }}
            />
          </div>

          {/* Next Month */}
          <button
            onClick={() => handleMonthChange(1)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9CA3AF",
              fontSize: 14,
              fontWeight: 500,
              padding: "4px 8px",
            }}
          >
            {nextMonthLabel}
          </button>
        </div>

        {/* Jump to current month button ⏭ */}
        <button
          onClick={handleJumpCurrent}
          title="Về tháng hiện tại"
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#111827",
          }}
        >
          <ChevronsRight size={17} strokeWidth={2.4} />
        </button>
      </div>

      {/* ── Transaction List grouped by Day ── */}
      {groupedByDate.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#6B7280" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#9CA3AF",
            }}
          >
            <Receipt size={28} strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>
            {searchQuery ? "Không tìm thấy giao dịch" : `Chưa có giao dịch trong tháng ${currMonthLabel}`}
          </div>
          <div style={{ fontSize: 12.5, color: "#6B7280", maxWidth: 260, margin: "0 auto 18px", lineHeight: 1.4 }}>
            {searchQuery
              ? `Không có giao dịch nào khớp với "${searchQuery}". Hãy thử tìm kiếm từ khóa khác.`
              : "Bạn chưa ghi chép khoản thu chi nào trong tháng này."}
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "#0D9488",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "8px 18px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Xóa tìm kiếm
            </button>
          ) : (
            <button
              onClick={onAdd}
              style={{
                background: "#0D9488",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
              }}
            >
              + Thêm giao dịch ngay
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: "#FFFFFF" }}>
          {groupedByDate.map((group) => (
            <div key={group.dateKey} style={{ borderBottom: "1px solid #ECEEF1" }}>
              {/* Day Header Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px 8px",
                  background: "#FFFFFF",
                  borderBottom: "1px solid #ECEEF1",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Large Day Number */}
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', -apple-system, sans-serif",
                      color: "#111827",
                      lineHeight: 1,
                      marginRight: 10,
                      minWidth: 42,
                    }}
                  >
                    {group.parsed.day}
                  </div>
                  {/* Day of Week & Month/Year */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2937", lineHeight: 1.2 }}>
                      {group.parsed.dayName}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#6B7280", lineHeight: 1.2, marginTop: 2 }}>
                      {group.parsed.monthYear}
                    </span>
                  </div>
                </div>

                {/* Day Total */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
                    color: group.dayTotal > 0 ? "#10B981" : "#111827",
                  }}
                >
                  {formatDayTotalVN(group.dayTotal)}
                </div>
              </div>

              {/* Transactions in Day */}
              <div>
                {group.items.map((t, idx) => {
                  const meta = catMeta(t.cat);
                  return (
                    <div
                      key={t.id || idx}
                      onClick={() => onEdit && onEdit(t)}
                      className="money-lover-tx-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "11px 16px",
                        background: "#FFFFFF",
                        borderBottom: "1px solid #F3F4F6",
                        cursor: "pointer",
                        transition: "background-color 0.12s ease",
                      }}
                    >
                      <CategoryIconML meta={meta} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {meta.label}
                        </div>
                        {t.note && t.note.trim() && t.note.trim() !== meta.label && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#6B7280",
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t.note}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          fontFamily: "'Space Grotesk', -apple-system, sans-serif",
                          color: t.type === "income" ? "#10B981" : "#EB5757",
                          flexShrink: 0,
                          marginLeft: 10,
                        }}
                      >
                        {t.type === "income" ? `+${formatVNDAmount(t.amount)}` : formatVNDAmount(t.amount)}
                      </div>

                      {onDelete && (
                        <button
                          type="button"
                          title="Xóa giao dịch"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Bạn có chắc muốn xóa giao dịch này?")) {
                              onDelete(t.id);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#D1D5DB",
                            padding: 4,
                            marginLeft: 6,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#D1D5DB")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Help Modal ── */}
      {showHelp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "20px 24px",
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#CCFBF1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0D9488",
                }}
              >
                <HelpCircle size={20} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                Sổ giao dịch (Nhật ký)
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.5, marginBottom: 16 }}>
              Đây là nơi ghi chép và tổng hợp chi tiết các giao dịch tài chính hàng ngày của bạn theo từng tháng.
              <br /><br />
              • <b>Số dư:</b> Tổng số dư ngân quỹ hiện có của bạn.<br />
              • <b>Theo ngày:</b> Các khoản thu chi được gom nhóm theo từng ngày để bạn nắm rõ lịch sử tiêu dùng.<br />
              • <b>Chỉnh sửa/Xóa:</b> Bấm vào bất kỳ dòng giao dịch nào để xem chi tiết hoặc chỉnh sửa.
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                background: "#0D9488",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Đã hiểu
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
    setDraft(formatThousands(budgets[id] || ""));
  }
  function saveEdit(id) {
    const v = parseThousands(draft);
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, background: T.paper, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: T.inkSoft }}>Hạn mức hôm nay</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: safeToSpend?.isOverBudget ? T.brick : T.tealDark, fontFamily: "'Space Grotesk',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fmtVND(safeToSpend?.dailyLimit || 0)}
            </div>
            <div style={{ fontSize: 10, color: T.inkSoft }}>{safeToSpend?.isOverBudget ? "⚠️ Đã vượt mức" : `Còn lại: ${fmtVND(safeToSpend?.remainingToday || 0)}`}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: T.inkSoft }}>Kỳ nhận tiền tới</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.goldDark, fontFamily: "'Space Grotesk',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                  <div style={{ fontSize: 11.5, color: over ? T.brick : T.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fmtVND(spent)} / {limit > 0 ? fmtVND(limit) : "chưa đặt"}
                  </div>
                </div>
                {editing === c.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      autoFocus
                      type="text"
                      inputMode="numeric"
                      value={draft}
                      onChange={(e) => handleNumericChange(e, (formatted) => setDraft(formatted))}
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
function ChatTab({ messages, chatInput, setChatInput, chatLoading, sendChat, chatEndRef, user, token, onClose }) {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* ── Header bar: Target & Tri thức AI ── */}
      <div style={{ marginTop: 10, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
          {onClose && (
            <button
              onClick={onClose}
              title="Quay lại"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: T.teal, display: "flex", alignItems: "center", gap: 2,
                fontSize: 12, fontWeight: 700, padding: "4px 4px 4px 0", flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} />
              <span>Quay lại</span>
            </button>
          )}
          <div style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
            <img
              src={tuanAvatar}
              alt="Tuấn"
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", objectPosition: "center 20%", border: `1.5px solid ${T.teal}` }}
            />
            <span style={{ position: "absolute", bottom: -1, right: -1, width: 7, height: 7, borderRadius: "50%", background: "#22C55E", border: "1.5px solid #fff" }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.tealDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Trợ lý Tuấn • Đồng hành chi tiêu
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

      {/* ── Scrollable Messages Container (Carousel + Messages + scroll anchor) ── */}
      <div
        className="chat-messages-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingRight: 4,
          paddingBottom: 12,
        }}
      >
        {/* Carousel Bí kíp & Mẹo tài chính sinh viên (Hợp nhất từ tab Học cũ) */}
        <div style={{ marginBottom: 4, flexShrink: 0 }}>
          <div style={{
            background: `linear-gradient(135deg, ${T.card}, #FFFBF0)`,
            border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "10px 12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Lightbulb size={14} color={T.gold} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.tealDark, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Mẹo tài chính hôm nay
              </span>
            </div>
            <div style={{ fontSize: 12, color: T.ink, lineHeight: 1.45, fontStyle: "italic" }}>
              "{TIP_OF_DAY}"
            </div>
          </div>

          {/* Danh sách chủ đề học nhanh — Scroll ngang */}
          <div style={{
            display: "flex", gap: 8, overflowX: "auto", padding: "8px 0 4px",
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}>
            {LESSONS.map((l, idx) => (
              <div
                key={idx}
                onClick={() => {
                  const prompt = `Giải thích thêm cho mình về "${l.title}": ${l.desc}`;
                  sendChat(prompt);
                }}
                style={{
                  flexShrink: 0, width: 175, background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 10,
                  padding: "8px 10px", cursor: "pointer",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.teal; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: T.teal, background: "rgba(31,111,99,0.08)", padding: "1px 5px", borderRadius: 4 }}>
                    {l.tag}
                  </span>
                  <Sparkles size={11} color={T.gold} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.ink, lineHeight: 1.3, marginBottom: 2 }}>
                  {l.title}
                </div>
                <div style={{ fontSize: 10, color: T.inkSoft, lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {l.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Câu hỏi gợi ý nhanh */}
          <div style={{ display: "flex", gap: 5, overflowX: "auto", padding: "4px 0", scrollbarWidth: "none" }}>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendChat(prompt)}
                style={{
                  flexShrink: 0, background: "rgba(31,111,99,0.05)",
                  border: `1px solid rgba(31,111,99,0.2)`, borderRadius: 14,
                  padding: "4px 9px", fontSize: 10.5, color: T.tealDark,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                💬 {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách tin nhắn */}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
            {m.role === "assistant" && (
              <img
                src={tuanAvatar}
                alt="Tuấn"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "cover",
                  objectPosition: "center 20%",
                  border: `1.5px solid ${T.teal}44`,
                  flexShrink: 0,
                  marginBottom: 2,
                }}
              />
            )}
            <div style={{
              maxWidth: "82%", padding: "9px 12px", borderRadius: 14,
              borderBottomRightRadius: m.role === "user" ? 3 : 14,
              borderBottomLeftRadius: m.role === "user" ? 14 : 3,
              background: m.role === "user" ? T.teal : T.card,
              color: m.role === "user" ? "#fff" : T.ink,
              border: m.role === "user" ? "none" : `1px solid ${T.border}`,
              fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {chatLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 7, flexShrink: 0 }}>
            <img
              src={tuanAvatar}
              alt="Tuấn"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center 20%",
                border: `1.5px solid ${T.teal}44`,
                flexShrink: 0,
                marginBottom: 2,
              }}
            />
            <div style={{ padding: "9px 12px", borderRadius: 14, background: T.card, border: `1px solid ${T.border}`, fontSize: 13, color: T.inkSoft }}>
              Tuấn đang soạn câu trả lời…
            </div>
          </div>
        )}
        <div ref={chatEndRef} style={{ height: 1, flexShrink: 0 }} />
      </div>

      {/* ── Fixed Chat Input Bar at bottom (above bottom nav) ── */}
      <div
        className="chat-input-bar"
        style={{
          flexShrink: 0,
          background: T.paper,
          paddingTop: 8,
          paddingBottom: 6,
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
            placeholder="Hỏi Tuấn về tài chính của bạn..."
            style={{
              flex: 1, borderRadius: 20, border: `1px solid ${T.border}`, padding: "10px 14px",
              fontSize: 13, outline: "none", background: T.card, color: T.ink,
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
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
  const [showCatList, setShowCatList] = useState(false);
  const [catError, setCatError] = useState(false);
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
    const amt = parseThousands(form.amount);
    if (!amt || amt <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (!form.cat) {
      setCatError(true);
      setShowCatList(true);
      return;
    }
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(32, 48, 44, 0.7)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 10000 }}>
      <div style={{ width: "100%", maxWidth: 440, background: T.paper, borderRadius: "20px 20px 0 0", border: `1px solid ${T.border}`, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -8px 30px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 10px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Thêm giao dịch</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Input-mode tabs - chỉ hiển thị nếu mở từ tính năng khác ngoài nút Thêm thủ công */}
        {initialTab !== "manual" && (
          <div style={{ display: "flex", gap: 5, padding: "0 16px 12px", borderBottom: `1px solid ${T.border}` }}>
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
                    padding: "7px 3px", borderRadius: 10, cursor: isVoiceDisabled ? "not-allowed" : "pointer",
                    border: `1px solid ${active ? T.teal : T.border}`,
                    background: active ? T.teal + "18" : T.card,
                    color: isVoiceDisabled ? T.border : active ? T.teal : T.inkSoft,
                    opacity: isVoiceDisabled ? 0.45 : 1,
                    fontSize: 10, fontWeight: active ? 700 : 500, minWidth: 0,
                  }}
                >
                  <Icon size={16} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", textAlign: "center" }}>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ padding: "14px 18px 22px" }}>

          {/* ── TAB: Manual (original form) ────────────────────────── */}
          {inputTab === "manual" && (
            <>
              {/* Loại giao dịch: Chi tiêu / Thu nhập */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {["expense", "income"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, type: t, cat: "" }));
                      setShowCatList(false);
                      setCatError(false);
                    }}
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

              {/* Số tiền */}
              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Số tiền (VND)"
                  value={form.amount}
                  onChange={(e) => handleNumericChange(e, (formatted) => setForm((f) => ({ ...f, amount: formatted })))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, marginBottom: 4, background: T.card, color: T.ink }}
                />
                {/* Format preview */}
                {Boolean(parseThousands(form.amount)) && (
                  <div style={{ fontSize: 11, color: T.tealDark, fontWeight: 600, padding: "0 4px 6px" }}>
                    👉 Bằng chữ: {fmtVND(parseThousands(form.amount))}
                  </div>
                )}
                {/* Quick amount chips */}
                <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                  {[10000, 20000, 50000, 100000, 500000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, amount: formatThousands((parseThousands(f.amount) || 0) + quick) }))}
                      style={{
                        background: "rgba(217,164,65,0.12)", border: `1px solid ${T.border}`,
                        borderRadius: 6, padding: "3px 7px", fontSize: 10.5, fontWeight: 600,
                        color: T.ink, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      +{quick >= 1000000 ? `${quick / 1000000}tr` : `${quick / 1000}k`}
                    </button>
                  ))}
                  {Boolean(form.amount) && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, amount: "" }))}
                      style={{
                        background: "rgba(186,45,37,0.08)", border: `1px solid rgba(186,45,37,0.2)`,
                        borderRadius: 6, padding: "3px 7px", fontSize: 10.5, fontWeight: 600,
                        color: T.brick, cursor: "pointer",
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Dòng chọn thuộc tính/danh mục dưới số tiền */}
              <div style={{ marginBottom: 12, position: "relative" }}>
                <div
                  onClick={() => setShowCatList((v) => !v)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1px solid ${catError ? T.brick : (showCatList ? T.teal : T.border)}`,
                    background: T.card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    {(() => {
                      const selected = cats.find((c) => c.id === form.cat);
                      if (!selected) return <span style={{ fontSize: 13, color: T.inkSoft }}>Chọn danh mục</span>;
                      const IconComp = selected.Icon;
                      return (
                        <>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              background: selected.color + "22",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <IconComp size={15} color={selected.color} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selected.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {showCatList ? <ChevronUp size={18} color={T.inkSoft} /> : <ChevronDown size={18} color={T.inkSoft} />}
                  </div>
                </div>

                {catError && !form.cat && (
                  <div style={{ fontSize: 11, color: T.brick, marginTop: 4, paddingLeft: 4 }}>
                    Vui lòng chọn 1 danh mục
                  </div>
                )}

                {/* List các thuộc tính hiển thị khi bấm vào */}
                {showCatList && (
                  <div
                    style={{
                      marginTop: 6,
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: 6,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 6,
                      maxHeight: 220,
                      overflowY: "auto",
                    }}
                  >
                    {cats.map((c) => {
                      const isSelected = form.cat === c.id;
                      const IconComp = c.Icon;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              cat: c.id,
                              nature: (c.id === "entertainment" || c.id === "shopping") ? "want" : (f.type === "expense" ? f.nature : "need"),
                            }));
                            setShowCatList(false);
                            setCatError(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: `1px solid ${isSelected ? c.color : T.border}`,
                            background: isSelected ? c.color + "18" : "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              background: c.color + "22",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <IconComp size={14} color={c.color} />
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              color: T.ink,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                            }}
                          >
                            {c.label}
                          </span>
                          {isSelected && <Check size={14} color={c.color} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {form.type === "expense" && safeToSpend && parseThousands(form.amount) > 0 && parseThousands(form.amount) > safeToSpend.remainingToday && (
                <div style={{
                  background: "#FFF3F0", border: `1px solid ${T.brick}66`, borderRadius: 10,
                  padding: "10px 12px", marginBottom: 10, display: "flex", gap: 8, alignItems: "flex-start"
                }}>
                  <AlertTriangle size={16} color={T.brick} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: "#7B2317", lineHeight: 1.4 }}>
                    <strong>Cảnh báo vượt hạn mức Safe-to-Spend!</strong><br />
                    Khoản chi này (<strong>{fmtVND(parseThousands(form.amount))}</strong>) sẽ làm bạn vượt hạn mức cho phép hôm nay (còn lại: <strong>{safeToSpend.remainingToday > 0 ? fmtVND(safeToSpend.remainingToday) : "0 đ"}</strong>). Còn <strong>{safeToSpend.daysRemaining} ngày</strong> nữa mới đến kỳ nhận tiền ({safeToSpend.nextPaydayStr}).
                  </div>
                </div>
              )}

              {/* Bố cục Thiết yếu (Needs) & Mong muốn (Wants) - Đã xóa dòng tiêu đề PHÂN LOẠI TƯ DUY TÀI CHÍNH */}
              {form.type === "expense" && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, nature: "need" }))}
                      style={{
                        flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                        border: `1.5px solid ${form.nature !== "want" ? "#10B981" : T.border}`,
                        background: form.nature !== "want" ? "#ECFDF5" : T.card,
                        color: form.nature !== "want" ? "#065F46" : T.inkSoft,
                        cursor: "pointer",
                      }}
                    >
                      🟢 Thiết yếu (Needs)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, nature: "want" }))}
                      style={{
                        flex: 1, padding: "8px 6px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                        border: `1.5px solid ${form.nature === "want" ? "#F59E0B" : T.border}`,
                        background: form.nature === "want" ? "#FFFBEB" : T.card,
                        color: form.nature === "want" ? "#92400E" : T.inkSoft,
                        cursor: "pointer",
                      }}
                    >
                      🟡 Mong muốn (Wants)
                    </button>
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
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(t.amount)}
                  onChange={(e) => handleNumericChange(e, (_, num) => updateTx(idx, "amount", Math.max(0, num)))}
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
  const [reserve, setReserve] = useState(formatThousands(userSettings?.emergency_reserve || 0));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPayday(userSettings?.payday_day || 1);
    setReserve(formatThousands(userSettings?.emergency_reserve || 0));
  }, [userSettings]);

  function handleSave() {
    onUpdateSettings({ payday_day: payday, emergency_reserve: parseThousands(reserve) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ borderTop: `1px dashed ${T.border}`, paddingTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Thiết lập kỳ trợ cấp & quỹ dự phòng:</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
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
        <div style={{ flex: "1 1 160px", minWidth: 0 }}>
          <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>Quỹ dự phòng khẩn cấp:</div>
          <input
            type="text"
            inputMode="numeric"
            value={reserve}
            onChange={(e) => handleNumericChange(e, (formatted) => setReserve(formatted))}
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
  const [reserve, setReserve] = useState(formatThousands(userSettings?.emergency_reserve || 0));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(32, 48, 44, 0.7)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380, background: T.paper, borderRadius: 18, border: `1px solid ${T.border}`, padding: "20px 18px", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}>
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
            type="text"
            inputMode="numeric"
            value={reserve}
            onChange={(e) => handleNumericChange(e, (formatted) => setReserve(formatted))}
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
            onClick={() => onSave({ payday_day: payday, emergency_reserve: parseThousands(reserve) })}
            style={{ flex: 1.5, padding: "9px 0", borderRadius: 8, border: "none", background: T.teal, fontSize: 12.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}

