import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, Utensils, Bus, BookOpen, Gamepad2, Home, ShoppingBag, HeartPulse, MoreHorizontal, GraduationCap, Wallet, Coins } from "lucide-react";

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

const fmtVND = (n) => Math.round(n).toLocaleString("vi-VN") + " đ";

export default function EditTxModal({ tx, onClose, onSave, safeToSpend }) {
  if (!tx) return null;

  const [form, setForm] = useState({
    id: tx.id,
    type: tx.type || "expense",
    cat: tx.cat || tx.category || "food",
    amount: String(tx.amount || ""),
    note: tx.note || "",
    date: tx.date || "",
  });
  const [saving, setSaving] = useState(false);

  const cats = form.type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  const T = {
    paper: "#F1EEE3",
    ink: "#20302C",
    inkSoft: "#5B6660",
    teal: "#1F6F63",
    border: "#D9D3C1",
    card: "#FBFAF4",
    gold: "#D9A441",
    goldDark: "#8C6620",
    brick: "#AE4C3B",
  };

  async function handleSave() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: form.id,
        type: form.type,
        category: form.cat,
        cat: form.cat,
        amount: amt,
        note: form.note || "(không ghi chú)",
        date: form.date,
      });
      onClose();
    } catch (err) {
      alert(err.message || "Lỗi lưu giao dịch.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 48, 44, 0.7)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: T.paper,
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${T.border}`,
          padding: "20px 20px 30px",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
          fontFamily: "'Inter', sans-serif",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, fontFamily: "'Space Grotesk', sans-serif" }}>
            Chỉnh sửa giao dịch
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["expense", "income"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: t, cat: t === "expense" ? "food" : "allowance" }))}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${form.type === t ? T.teal : T.border}`,
                background: form.type === t ? T.teal : T.card,
                color: form.type === t ? "#fff" : T.ink,
              }}
            >
              {t === "expense" ? "Chi tiêu" : "Thu nhập"}
            </button>
          ))}
        </div>

        {/* Category grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, cat: c.id }))}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "7px 2px",
                borderRadius: 10,
                cursor: "pointer",
                minWidth: 0,
                border: `1px solid ${form.cat === c.id ? c.color : T.border}`,
                background: form.cat === c.id ? c.color + "22" : T.card,
              }}
            >
              <c.Icon size={16} color={c.color} />
              <span style={{ fontSize: 9.5, color: T.ink, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input
            type="number"
            placeholder="Số tiền (VND)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              fontSize: 15,
              fontWeight: 700,
              background: T.card,
              color: T.ink,
              boxSizing: "border-box",
            }}
          />
          {form.amount && Number(form.amount) > 0 && (
            <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, fontWeight: 700, color: T.teal }}>
              {fmtVND(Number(form.amount))}
            </div>
          )}
        </div>

        {/* Quick add chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {[10000, 20000, 50000, 100000, 500000].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setForm((f) => ({ ...f, amount: String((Number(f.amount) || 0) + chip) }))}
              style={{
                padding: "4px 8px",
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: T.card,
                fontSize: 11,
                fontWeight: 600,
                color: T.goldDark,
                cursor: "pointer",
              }}
            >
              +{chip >= 1000000 ? `${chip / 1000000}tr` : `${chip / 1000}k`}
            </button>
          ))}
        </div>

        {/* Note input */}
        <input
          type="text"
          placeholder="Ghi chú (vd: Ăn trưa cơm tấm)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            fontSize: 13,
            marginBottom: 8,
            background: T.card,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />

        {/* Date input */}
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            fontSize: 13,
            marginBottom: 16,
            background: T.card,
            color: T.ink,
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.card,
              fontSize: 13,
              fontWeight: 600,
              color: T.inkSoft,
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            style={{
              flex: 2,
              background: T.teal,
              border: "none",
              borderRadius: 10,
              padding: "11px 0",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
              cursor: saving ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={16} /> {saving ? "Đang lưu..." : "Cập nhật giao dịch"}
          </button>
        </div>
      </div>
    </div>
  );
}
