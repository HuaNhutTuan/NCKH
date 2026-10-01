import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";

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
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // { exists: boolean, message: string }

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setEmailStatus(null);
    setEmailChecking(false);
  }

  // Tự động kiểm tra email trùng khi đăng ký
  useEffect(() => {
    if (mode !== "register") {
      setEmailStatus(null);
      setEmailChecking(false);
      return;
    }

    const cleanEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setEmailStatus(null);
      setEmailChecking(false);
      return;
    }

    let isMounted = true;
    setEmailChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkEmail(cleanEmail);
        if (isMounted) {
          setEmailStatus(res);
          if (res.exists) {
            setError("Email này đã được đăng ký trong hệ thống. Vui lòng chuyển sang Đăng nhập.");
          } else if (error && (error.includes("đã được đăng ký") || error.includes("trùng"))) {
            setError("");
          }
        }
      } catch (err) {
        // Bỏ qua lỗi mạng nền
      } finally {
        if (isMounted) setEmailChecking(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [form.email, mode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanName = form.name.trim();

    if (!cleanEmail || !form.password || (mode === "register" && !cleanName)) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (mode === "register" && emailStatus?.exists) {
      setError("Email này đã được đăng ký trước đó. Không thể đăng ký lại!");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(cleanEmail, form.password);
      } else {
        await register(cleanName, cleanEmail, form.password);
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  }

  const isDuplicateEmailError = (mode === "register" && emailStatus?.exists) || (error && (
    error.includes("đã được đăng ký") ||
    error.toLowerCase().includes("trùng") ||
    error.toLowerCase().includes("already")
  ));

  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter',sans-serif",
      boxSizing: "border-box",
      padding: "16px",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: 380,
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: "26px 22px",
        boxSizing: "border-box",
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Thanh chuyển đổi chế độ Đăng nhập / Đăng ký */}
        <div style={{
          display: "flex",
          background: T.paper,
          borderRadius: 10,
          padding: 3,
          marginBottom: 18,
          border: `1px solid ${T.border}`,
          boxSizing: "border-box",
        }}>
          <button
            type="button"
            onClick={() => switchMode("login")}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: mode === "login" ? 700 : 500,
              background: mode === "login" ? "#fff" : "transparent",
              color: mode === "login" ? T.tealDark : T.inkSoft,
              boxShadow: mode === "login" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            style={{
              flex: 1,
              padding: "7px 0",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: mode === "register" ? 700 : 500,
              background: mode === "register" ? "#fff" : "transparent",
              color: mode === "register" ? T.tealDark : T.inkSoft,
              boxShadow: mode === "register" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            Đăng ký
          </button>
        </div>

        <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 500, marginBottom: 3 }}>
          {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: T.tealDark, marginBottom: 18 }}>
          NCKH — Ví sinh viên
        </div>

        {mode === "register" && (
          <input
            type="text"
            placeholder="Họ và tên"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={{
            ...inputStyle,
            borderColor:
              mode === "register" && emailStatus?.exists
                ? T.brick
                : mode === "register" && emailStatus && !emailStatus.exists
                ? "#2D7A4F"
                : T.border,
            marginBottom:
              mode === "register" && (emailChecking || emailStatus) ? 4 : 10,
          }}
        />

        {mode === "register" && emailChecking && (
          <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 8, paddingLeft: 2 }}>
            ⏳ Đang kiểm tra email trùng...
          </div>
        )}

        {mode === "register" && !emailChecking && emailStatus?.exists && (
          <div style={{
            fontSize: 12,
            color: T.brick,
            marginBottom: 8,
            padding: "5px 8px",
            background: "#AE4C3B14",
            border: "1px solid #AE4C3B33",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 4,
          }}>
            <span>⚠️ Email đã trùng với tài khoản cũ!</span>
            <span
              onClick={() => switchMode("login")}
              style={{ color: T.teal, fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
            >
              Đăng nhập ngay
            </span>
          </div>
        )}

        {mode === "register" && !emailChecking && emailStatus && !emailStatus.exists && (
          <div style={{ fontSize: 12, color: "#2D7A4F", marginBottom: 8, paddingLeft: 2, fontWeight: 500 }}>
            ✓ Email khả dụng, chưa có ai đăng ký
          </div>
        )}

        <input
          type="password"
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          style={{ ...inputStyle, marginBottom: error ? 8 : 4 }}
        />

        {error && (
          <div style={{
            fontSize: 12.5,
            color: T.brick,
            background: "#AE4C3B14",
            border: "1px solid #AE4C3B33",
            borderRadius: 8,
            padding: "8px 12px",
            margin: "4px 0 10px",
            lineHeight: 1.45,
            boxSizing: "border-box",
          }}>
            <div>{error}</div>
            {mode === "register" && isDuplicateEmailError && (
              <div style={{ marginTop: 6 }}>
                <span
                  onClick={() => switchMode("login")}
                  style={{
                    color: T.teal,
                    fontWeight: 700,
                    textDecoration: "underline",
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  👉 Chuyển sang Đăng nhập với email này
                </span>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "register" && (emailStatus?.exists || emailChecking))}
          className="btn-gold"
          style={{
            width: "100%",
            marginTop: 12,
            background: mode === "register" && emailStatus?.exists ? "#D1D5DB" : T.gold,
            border: "none",
            borderRadius: 10,
            padding: "11px 0",
            fontWeight: 700,
            fontSize: 14,
            color: mode === "register" && emailStatus?.exists ? "#6B7280" : "#3A2A08",
            cursor: loading || (mode === "register" && (emailStatus?.exists || emailChecking)) ? "not-allowed" : "pointer",
            opacity: loading || (mode === "register" && emailStatus?.exists) ? 0.7 : 1,
            boxSizing: "border-box",
          }}
        >
          {loading
            ? "Đang xử lý..."
            : mode === "register" && emailChecking
            ? "Đang kiểm tra email..."
            : mode === "register" && emailStatus?.exists
            ? "Email đã trùng — Không thể đăng ký"
            : mode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: T.inkSoft }}>
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <span
            className="btn-link"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
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
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  fontSize: 14,
  marginBottom: 10,
  background: T.paper,
  color: T.ink,
  outline: "none",
  boxSizing: "border-box",
  display: "block",
};
