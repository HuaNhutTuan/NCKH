import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Mail, Check, AlertCircle, Loader2, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";
import auroraBg from "./assets/aurora_bg.jpg";
import "./Login.css";

// Social SVGs
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.24 10.285V13.84h6.05c-.245 1.583-1.848 4.635-6.05 4.635-3.645 0-6.62-3.013-6.62-6.725s2.975-6.725 6.62-6.725c2.077 0 3.473.886 4.267 1.649l2.842-2.736C17.518 2.518 15.08 1.5 12.24 1.5 6.452 1.5 1.75 6.202 1.75 11.99s4.702 10.49 10.49 10.49c6.05 0 10.057-4.256 10.057-10.237 0-.693-.075-1.222-.165-1.748L12.24 10.285Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

export default function Login() {
  const { login, register, saveSession } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "forgot" | "social" | null
  const [socialProvider, setSocialProvider] = useState("");

  // Trạng thái xác nhận mã liên kết mạng xã hội (Google / Facebook)
  const [socialStep, setSocialStep] = useState(1); // 1: nhập email, 2: nhập mã xác nhận OTP
  const [socialEmail, setSocialEmail] = useState("");
  const [socialOtp, setSocialOtp] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState("");
  const [socialSuccessMsg, setSocialSuccessMsg] = useState("");
  const [socialGeneratedCode, setSocialGeneratedCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Tải lại email đã ghi nhớ
  useEffect(() => {
    const saved = localStorage.getItem("loc_remembered_email");
    if (saved) {
      setForm((f) => ({ ...f, email: saved }));
    }
  }, []);

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
            setError("Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.");
          } else if (error && (error.includes("đã được đăng ký") || error.includes("trùng"))) {
            setError("");
          }
        }
      } catch (err) {
        // bỏ qua lỗi kiểm tra ngầm
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
      setError("Vui lòng điền đầy đủ các trường thông tin.");
      return;
    }

    if (mode === "register" && emailStatus?.exists) {
      setError("Email này đã được đăng ký trước đó. Không thể đăng ký lại!");
      return;
    }

    // Lưu hoặc xóa email đã ghi nhớ
    if (rememberMe) {
      localStorage.setItem("loc_remembered_email", cleanEmail);
    } else {
      localStorage.removeItem("loc_remembered_email");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(cleanEmail, form.password);
      } else {
        await register(cleanName, cleanEmail, form.password);
      }
    } catch (err) {
      setError(err.message || "Tài khoản hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  }

  // Đếm ngược thời gian gửi lại mã OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  function handleSocialClick(providerName) {
    setSocialProvider(providerName);
    setSocialStep(1);
    setSocialEmail(form.email || "");
    setSocialOtp("");
    setSocialError("");
    setSocialSuccessMsg("");
    setSocialGeneratedCode("");
    setResendCountdown(0);
    setActiveModal("social");
  }

  // Gửi mã OTP xác nhận liên kết Google / Facebook
  async function handleSendSocialOtp(e) {
    if (e) e.preventDefault();
    setSocialError("");
    setSocialSuccessMsg("");

    const cleanEmail = socialEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setSocialError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setSocialLoading(true);
    try {
      const res = await authApi.sendSocialOtp(cleanEmail, socialProvider);
      setSocialGeneratedCode(res.code || "");
      setSocialSuccessMsg(res.message || "Mã xác nhận đã được gửi thành công!");
      setSocialStep(2);
      setResendCountdown(60);
    } catch (err) {
      setSocialError(err.message || "Không thể gửi mã xác nhận. Vui lòng thử lại.");
    } finally {
      setSocialLoading(false);
    }
  }

  // Xác thực mã OTP và đăng nhập vào hệ thống
  async function handleVerifySocialOtp(e) {
    if (e) e.preventDefault();
    setSocialError("");

    const cleanEmail = socialEmail.trim().toLowerCase();
    const cleanCode = socialOtp.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setSocialError("Vui lòng nhập đủ 6 chữ số mã xác nhận OTP.");
      return;
    }

    setSocialLoading(true);
    try {
      const res = await authApi.verifySocialOtp(cleanEmail, cleanCode, socialProvider);
      saveSession(res);
      setActiveModal(null);
    } catch (err) {
      setSocialError(err.message || "Mã xác nhận không hợp lệ hoặc đã hết hạn.");
    } finally {
      setSocialLoading(false);
    }
  }

  return (
    <div className="aurora-login-viewport">
      <div className="aurora-desktop-ambient" />

      {/* Khung mô phỏng ứng dụng điện thoại / giao diện chính */}
      <div
        className="aurora-phone-screen"
        style={{
          backgroundImage: `url(${auroraBg})`,
        }}
      >
        {/* Khối Glassmorphism mờ sang trọng */}
        <div className="aurora-glass-card">
          {/* Tiêu đề & phụ đề */}
          <h1 className="aurora-title">
            {mode === "login" ? "Chào mừng quay trở lại" : "Tạo tài khoản mới"}
          </h1>
          <p className="aurora-subtitle">
            {mode === "login"
              ? "Vui lòng nhập thông tin của bạn"
              : "Vui lòng điền thông tin để đăng ký ví"}
          </p>

          <form className="aurora-form" onSubmit={handleSubmit}>
            {/* Trường Họ tên nếu đang ở chế độ Đăng ký */}
            {mode === "register" && (
              <div className="aurora-input-wrapper">
                <div className="aurora-input-icon">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Họ và tên của bạn"
                  className="aurora-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}

            {/* Trường Tên đăng nhập hoặc Email */}
            <div className="aurora-input-wrapper">
              <div className="aurora-input-icon">
                {mode === "register" ? <Mail size={18} /> : <User size={18} />}
              </div>
              <input
                type="text"
                placeholder={mode === "register" ? "Địa chỉ Email" : "Tên đăng nhập hoặc Email"}
                className="aurora-input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                autoComplete="username"
              />
            </div>

            {/* Trường Mật khẩu */}
            <div className="aurora-input-wrapper">
              <div className="aurora-input-icon">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                className="aurora-input"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="aurora-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Thông báo lỗi nếu có */}
            {error && (
              <div className="aurora-error-badge">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
                {mode === "register" && emailStatus?.exists && (
                  <div style={{ marginTop: 6, fontWeight: 600 }}>
                    <span
                      onClick={() => switchMode("login")}
                      style={{ color: "#38D8D8", cursor: "pointer", textDecoration: "underline" }}
                    >
                      👉 Bấm vào đây để chuyển sang Đăng nhập
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Hàng Ghi nhớ đăng nhập & Quên mật khẩu */}
            {mode === "login" && (
              <div className="aurora-controls-row">
                <label className="aurora-remember" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`aurora-checkbox ${rememberMe ? "checked" : ""}`}>
                    {rememberMe && <Check size={12} strokeWidth={3.5} color="#FFFFFF" />}
                  </div>
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <span
                  className="aurora-forgot-link"
                  onClick={() => setActiveModal("forgot")}
                >
                  Quên mật khẩu?
                </span>
              </div>
            )}

            {/* Nút Đăng nhập / Đăng ký phát sáng */}
            <button
              type="submit"
              className="aurora-submit-btn"
              disabled={loading || (mode === "register" && (emailStatus?.exists || emailChecking))}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                  <span>ĐANG XỬ LÝ...</span>
                </>
              ) : mode === "login" ? (
                "ĐĂNG NHẬP"
              ) : (
                "ĐĂNG KÝ TÀI KHOẢN"
              )}
            </button>
          </form>

          {/* Dải phân cách */}
          <div className="aurora-divider">
            <span>Hoặc đăng nhập bằng</span>
          </div>

          {/* Nút đăng nhập xã hội: Google, Facebook (Đã xóa Apple) */}
          <div className="aurora-social-row">
            <button
              type="button"
              className="aurora-social-btn"
              onClick={() => handleSocialClick("Google")}
              title="Liên kết & Đăng nhập với Google"
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              className="aurora-social-btn"
              onClick={() => handleSocialClick("Facebook")}
              title="Liên kết & Đăng nhập với Facebook"
            >
              <FacebookIcon />
            </button>
          </div>

          {/* Chuyển đổi giữa Đăng nhập và Đăng ký */}
          <div className="aurora-switch-mode">
            {mode === "login" ? (
              <>
                Chưa có tài khoản?
                <span className="aurora-switch-link" onClick={() => switchMode("register")}>
                  Đăng ký ngay
                </span>
              </>
            ) : (
              <>
                Đã có tài khoản?
                <span className="aurora-switch-link" onClick={() => switchMode("login")}>
                  Đăng nhập
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Hướng dẫn Quên Mật Khẩu */}
      {activeModal === "forgot" && (
        <div className="aurora-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="aurora-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16 }}>
                <Lock size={18} color="#26E5DC" />
                <span>Khôi phục mật khẩu</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "4px 0" }}>
              Vì lý do bảo mật dữ liệu ví tài chính cá nhân, vui lòng liên hệ trực tiếp Quản trị viên hệ thống qua email:
            </p>
            <div style={{
              background: "rgba(38, 229, 220, 0.12)",
              border: "1px solid rgba(38, 229, 220, 0.35)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#38D8D8",
              textAlign: "center",
              userSelect: "all",
            }}>
              tuannhut419@gmail.com
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Kèm theo địa chỉ Email đăng ký tài khoản của bạn để được hỗ trợ cấp lại mật khẩu ngay lập tức.
            </p>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="aurora-submit-btn"
              style={{ marginTop: 8, padding: "10px 0" }}
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Liên kết & Đăng nhập Google / Facebook bằng Mã xác nhận OTP */}
      {activeModal === "social" && (
        <div className="aurora-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="aurora-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: socialProvider === "Google" ? "rgba(66, 133, 244, 0.2)" : "rgba(24, 119, 242, 0.2)",
                  border: `1px solid ${socialProvider === "Google" ? "rgba(66, 133, 244, 0.4)" : "rgba(24, 119, 242, 0.4)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: socialProvider === "Google" ? "#4285F4" : "#1877F2"
                }}>
                  {socialProvider === "Google" ? <GoogleIcon /> : <FacebookIcon />}
                </div>
                <span>Liên kết {socialProvider}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {socialStep === 1 ? (
              /* BƯỚC 1: Nhập email để nhận mã xác nhận OTP */
              <form onSubmit={handleSendSocialOtp} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: 0 }}>
                  Nhập địa chỉ email tài khoản <strong>{socialProvider}</strong> của bạn để hệ thống gửi mã xác nhận liên kết đăng nhập.
                </p>

                <div className="aurora-input-wrapper">
                  <div className="aurora-input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder={`Địa chỉ email ${socialProvider}`}
                    className="aurora-input"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {socialError && (
                  <div className="aurora-error-badge">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{socialError}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="aurora-submit-btn"
                  disabled={socialLoading || !socialEmail.trim()}
                  style={{ marginTop: 2 }}
                >
                  {socialLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>ĐANG GỬI MÃ...</span>
                    </>
                  ) : (
                    "GỬI MÃ XÁC NHẬN"
                  )}
                </button>
              </form>
            ) : (
              /* BƯỚC 2: Nhập mã xác nhận OTP 6 chữ số */
              <form onSubmit={handleVerifySocialOtp} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  Mã xác nhận 6 số đã được gửi tới:
                  <div style={{ color: "#38D8D8", fontWeight: 600, wordBreak: "break-all", marginTop: 2 }}>
                    📧 {socialEmail}
                  </div>
                </div>

                {/* Badge thông báo mã OTP thử nghiệm */}
                {socialGeneratedCode && (
                  <div style={{
                    background: "rgba(38, 229, 220, 0.12)",
                    border: "1px dashed rgba(38, 229, 220, 0.45)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12.5
                  }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.7)" }}>Mã xác nhận: </span>
                      <strong style={{ color: "#38D8D8", fontSize: 16, letterSpacing: 2, marginLeft: 4 }}>
                        {socialGeneratedCode}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSocialOtp(socialGeneratedCode)}
                      style={{
                        background: "rgba(38, 229, 220, 0.22)",
                        border: "1px solid rgba(38, 229, 220, 0.55)",
                        borderRadius: 6,
                        color: "#38D8D8",
                        padding: "3px 9px",
                        fontSize: 11.5,
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      Điền nhanh
                    </button>
                  </div>
                )}

                {/* Trường nhập mã OTP */}
                <div className="aurora-input-wrapper">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="MÃ 6 CHỮ SỐ"
                    className="aurora-input"
                    style={{
                      textAlign: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: 6,
                      color: "#38D8D8"
                    }}
                    value={socialOtp}
                    onChange={(e) => setSocialOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                    required
                  />
                </div>

                {socialError && (
                  <div className="aurora-error-badge">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{socialError}</span>
                    </div>
                  </div>
                )}

                {/* Các nút hành động phụ: Đổi email / Gửi lại mã */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginTop: -2 }}>
                  <span
                    onClick={() => {
                      setSocialStep(1);
                      setSocialError("");
                    }}
                    style={{ color: "rgba(255,255,255,0.75)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Đổi email khác
                  </span>

                  {resendCountdown > 0 ? (
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Gửi lại sau {resendCountdown}s
                    </span>
                  ) : (
                    <span
                      onClick={handleSendSocialOtp}
                      style={{ color: "#38D8D8", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Gửi lại mã OTP
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="aurora-submit-btn"
                  disabled={socialLoading || socialOtp.trim().length !== 6}
                  style={{ marginTop: 4 }}
                >
                  {socialLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>ĐANG XÁC NHẬN...</span>
                    </>
                  ) : (
                    "XÁC NHẬN & LIÊN KẾT ĐĂNG NHẬP"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
