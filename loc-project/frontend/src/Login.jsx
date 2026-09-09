import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const T = {
  paper: "#F1EEE3",
  ink: "#20302C",
  inkSoft: "#5B6660",
  teal: "#1F6F63",
  tealDark: "#123F38",
  gold: "#D9A441",
  brick: "#AE4C3B",
  card: "#FBFAF4",
  border: "#D9D3C1",
};

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: 640, display: "flex", alignItems: "center", justifyContent: "center",
      background: T.paper, fontFamily: "'Inter',sans-serif", padding: 20,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: 340, background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: "28px 24px",
      }}>
        <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 500, marginBottom: 2 }}>
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark, marginBottom: 20 }}>
          Lộc — Ví sinh viên
        </div>

        {mode === "register" && (
          <input
            type="text" placeholder="Họ và tên" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
        )}
        <input
          type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 6 }}
        />

        {error && (
          <div style={{ fontSize: 12.5, color: T.brick, margin: "6px 0 4px" }}>{error}</div>
        )}

        <button
          type="submit" disabled={loading}
          style={{
            width: "100%", marginTop: 14, background: T.gold, border: "none", borderRadius: 10,
            padding: "11px 0", fontWeight: 700, fontSize: 14, color: "#3A2A08",
            cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: T.inkSoft }}>
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: T.teal, fontWeight: 600, cursor: "pointer" }}
          >
            {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
          </span>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
  fontSize: 13.5, marginBottom: 10, background: T.paper, color: T.ink, outline: "none",
};
