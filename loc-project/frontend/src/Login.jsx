import React, { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, Mail, Check, AlertCircle, Loader2, X, GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import { authApi } from "./api";
import "./Login.css";

// Official 4-color Google Icon SVG
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
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
  const [activeModal, setActiveModal] = useState(null); // "forgot" | "social" | "oauth_config" | null
  const [inputOAuthId, setInputOAuthId] = useState("");

  // Bắt access_token từ Google OAuth sau khi người dùng chọn tài khoản trên thiết bị
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const state = params.get("state") || "Google";

      if (accessToken && state === "Google") {
        setLoading(true);
        // Xóa hash trên thanh địa chỉ URL để giữ giao diện sạch đẹp
        window.history.replaceState(null, "", window.location.pathname);

        // Lấy thông tin tài khoản Google thật từ Google API
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Không thể lấy thông tin tài khoản Google.");
            return res.json();
          })
          .then(async (userInfo) => {
            // Tự động đăng nhập vào EduFin bằng tài khoản Google thật
            const res = await authApi.socialDirectLogin({
              email: userInfo.email,
              name: userInfo.name || userInfo.email.split("@")[0],
              avatar: userInfo.picture,
              provider: "Google",
            });
            saveSession(res);
          })
          .catch((err) => {
            setError(err.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  // Trạng thái xác nhận mã liên kết Google
  const [socialStep, setSocialStep] = useState(1); // 1: nhập email, 2: chọn 1 trong 3 số xác minh danh tính
  const [socialEmail, setSocialEmail] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState("");
  const [socialSuccessMsg, setSocialSuccessMsg] = useState("");
  const [socialOptions, setSocialOptions] = useState([]); // 3 con số lựa chọn
  const [socialCorrectNumber, setSocialCorrectNumber] = useState(null); // số đúng
  const [emailSent, setEmailSent] = useState(false); // trạng thái đã gửi email thực tế
  const [selectedNum, setSelectedNum] = useState(null); // số người dùng vừa bấm
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

  // Đăng nhập Google
  async function handleGoogleClick() {
    setError("");
    try {
      const cfg = await authApi.getOAuthConfig().catch(() => ({}));
      const DEFAULT_GOOGLE_CLIENT_ID = "470490421827-2mv39c2mv6s03jt13tfqmmskomui6u1h.apps.googleusercontent.com";
      const clientId =
        localStorage.getItem("loc_google_client_id") ||
        cfg?.googleClientId ||
        import.meta.env.VITE_GOOGLE_CLIENT_ID ||
        DEFAULT_GOOGLE_CLIENT_ID;

      // Chuyển hướng trực tiếp đến trang Google OAuth 2.0 chính thức
      const redirectUri = encodeURIComponent(window.location.origin);
      const scope = encodeURIComponent("openid email profile");
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId.trim()}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account&state=Google`;
    } catch (err) {
      setError("Không thể kết nối dịch vụ đăng nhập Google. Vui lòng thử lại.");
    }
  }

  function handleSaveAndRedirectOAuth(e) {
    e.preventDefault();
    if (!inputOAuthId || !inputOAuthId.trim()) return;

    const cleanId = inputOAuthId.trim();
    localStorage.setItem("loc_google_client_id", cleanId);
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent("openid email profile");
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cleanId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account&state=Google`;
  }

  // Gửi email xác minh danh tính thực tế với con số xác nhận bí mật
  async function handleSendSocialOtp(e) {
    if (e) e.preventDefault();
    setSocialError("");
    setSocialSuccessMsg("");

    const cleanEmail = socialEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setSocialError("Vui lòng nhập địa chỉ email Google hợp lệ.");
      return;
    }

    setSocialLoading(true);
    try {
      const res = await authApi.sendSocialOtp(cleanEmail, "Google");
      setSocialOptions(res.options || []);
      setSocialCorrectNumber(res.correctNumber);
      setEmailSent(!!res.emailSent);
      setSocialSuccessMsg(res.message || "Đã gửi email xác minh danh tính thành công!");
      setSocialStep(2);
      setResendCountdown(60);
    } catch (err) {
      setSocialError(err.message || "Không thể gửi email xác minh. Vui lòng thử lại.");
    } finally {
      setSocialLoading(false);
    }
  }

  // Bấm chọn đúng 1 trong 3 con số giống phương thức xác minh Google Prompt
  async function handleSelectIdentityNumber(chosenNumber) {
    setSelectedNum(chosenNumber);
    setSocialError("");
    setSocialLoading(true);

    try {
      const cleanEmail = socialEmail.trim().toLowerCase();
      const res = await authApi.verifySocialOtp(cleanEmail, chosenNumber, "Google");
      saveSession(res);
      setActiveModal(null);
    } catch (err) {
      setSocialError(err.message || `Số ${chosenNumber} không khớp với email! Vui lòng kiểm tra lại email.`);
    } finally {
      setSocialLoading(false);
    }
  }

  return (
    <div className="loc-shell-wrapper login-shell-wrapper">
      {/* Khung giao diện điện thoại / Sổ tay tài chính sinh viên */}
      <div className="loc-shell login-shell">
        <div className="login-content-container">
          
          {/* Header & Logo Thương hiệu EduFin */}
          <div className="login-brand-header">
            <div className="login-emblem">
              <GraduationCap size={28} strokeWidth={2.2} />
            </div>

            <span className="login-badge">
              🎓 Đề tài NCKH Sư phạm Tài chính
            </span>

            <h1 className="login-title">
              EduFin Sinh Viên
            </h1>

            <p className="login-subtitle">
              {mode === "login"
                ? "Nền tảng Giáo dục & Quản trị Tài chính Cá nhân Sinh viên"
                : "Tạo tài khoản để bắt đầu rèn luyện tư duy tự chủ tài chính"}
            </p>
          </div>

          {/* Tab chuyển đổi chế độ: Đăng nhập / Đăng ký */}
          <div className="login-mode-tabs">
            <button
              type="button"
              className={`login-tab-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`login-tab-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {/* Form Thẻ giấy phong cách Sổ tay (Card) */}
          <div className="login-card">
            <form className="login-form" onSubmit={handleSubmit}>
              {/* Trường Họ tên nếu đang ở chế độ Đăng ký */}
              {mode === "register" && (
                <div className="login-input-group">
                  <div className="login-input-icon">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Họ và tên của bạn"
                    className="login-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* Trường Email hoặc Tên đăng nhập */}
              <div className="login-input-group">
                <div className="login-input-icon">
                  {mode === "register" ? <Mail size={18} /> : <User size={18} />}
                </div>
                <input
                  type="text"
                  placeholder={mode === "register" ? "Địa chỉ Email" : "Tên đăng nhập hoặc Email"}
                  className="login-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </div>

              {/* Trường Mật khẩu */}
              <div className="login-input-group">
                <div className="login-input-icon">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="login-input"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  className="login-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Thông báo lỗi nếu có */}
              {error && (
                <div className="login-error-badge">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                  {mode === "register" && emailStatus?.exists && (
                    <div style={{ marginTop: 6, fontWeight: 600 }}>
                      <span
                        onClick={() => switchMode("login")}
                        style={{ color: "#1F6F63", cursor: "pointer", textDecoration: "underline" }}
                      >
                        👉 Bấm vào đây để chuyển sang Đăng nhập
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Hàng Ghi nhớ đăng nhập & Quên mật khẩu */}
              {mode === "login" && (
                <div className="login-controls-row">
                  <label className="login-remember" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`login-checkbox ${rememberMe ? "checked" : ""}`}>
                      {rememberMe && <Check size={12} strokeWidth={3.5} color="#FFFFFF" />}
                    </div>
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <span
                    className="login-forgot-link"
                    onClick={() => setActiveModal("forgot")}
                  >
                    Quên mật khẩu?
                  </span>
                </div>
              )}

              {/* Nút Đăng nhập / Đăng ký chính */}
              <button
                type="submit"
                className="login-submit-btn btn-teal"
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

            {/* Dòng chuyển đổi giữa Đăng nhập và Đăng ký (nằm ngay dưới nút chính) */}
            <div className="login-switch-prompt">
              {mode === "login" ? (
                <>
                  Chưa có tài khoản?
                  <span className="login-switch-link" onClick={() => switchMode("register")}>
                    Đăng ký ngay
                  </span>
                </>
              ) : (
                <>
                  Đã có tài khoản?
                  <span className="login-switch-link" onClick={() => switchMode("login")}>
                    Đăng nhập ngay
                  </span>
                </>
              )}
            </div>

            {/* Dải phân cách */}
            <div className="login-divider">
              <span>Hoặc tiếp tục với</span>
            </div>

            {/* Ô ĐĂNG NHẬP BẰNG GOOGLE PHÓNG TO HÌNH CHỮ NHẬT BO GÓC DƯỚI NÚT ĐĂNG KÝ */}
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleClick}
              title="Đăng nhập bảo mật với tài khoản Google"
            >
              <GoogleIcon size={20} />
              <span>Đăng nhập bằng Google</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Hướng dẫn Quên Mật Khẩu */}
      {activeModal === "forgot" && (
        <div className="login-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "#123F38" }}>
                <Lock size={18} color="#1F6F63" />
                <span>Khôi phục mật khẩu</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-close"
                style={{ background: "none", border: "none", color: "#5B6660", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#5B6660", lineHeight: 1.5, margin: "4px 0" }}>
              Vì lý do bảo mật dữ liệu ví tài chính cá nhân, vui lòng liên hệ trực tiếp Quản trị viên hệ thống qua email:
            </p>
            <div style={{
              background: "rgba(31, 111, 99, 0.08)",
              border: "1px solid rgba(31, 111, 99, 0.25)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 700,
              color: "#1F6F63",
              textAlign: "center",
              userSelect: "all",
            }}>
              tuannhut419@gmail.com
            </div>
            <p style={{ fontSize: 12, color: "#5B6660", margin: 0 }}>
              Kèm theo địa chỉ Email đăng ký tài khoản của bạn để được hỗ trợ cấp lại mật khẩu ngay lập tức.
            </p>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="login-submit-btn btn-teal"
              style={{ marginTop: 8, padding: "10px 0" }}
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Liên kết & Đăng nhập Google bằng Mã xác nhận OTP (Fallback) */}
      {activeModal === "social" && (
        <div className="login-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16, color: "#123F38" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFFFFF",
                  border: "1px solid #D9D3C1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <GoogleIcon size={18} />
                </div>
                <span>Xác minh tài khoản Google</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-close"
                style={{ background: "none", border: "none", color: "#5B6660", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {socialStep === 1 ? (
              <form onSubmit={handleSendSocialOtp} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <p style={{ fontSize: 13, color: "#5B6660", lineHeight: 1.5, margin: 0 }}>
                  Nhập địa chỉ email tài khoản <strong>Google</strong> của bạn để hệ thống gửi mã xác nhận liên kết đăng nhập.
                </p>

                <div className="login-input-group">
                  <div className="login-input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="Địa chỉ email Google"
                    className="login-input"
                    value={socialEmail}
                    onChange={(e) => setSocialEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {socialError && (
                  <div className="login-error-badge">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{socialError}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="login-submit-btn btn-teal"
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, color: "#20302C", lineHeight: 1.5 }}>
                  Đã gửi số xác minh danh tính đến email:
                  <div style={{ color: "#1F6F63", fontWeight: 700, wordBreak: "break-all", marginTop: 2 }}>
                    📧 {socialEmail}
                  </div>
                </div>

                <div style={{
                  fontSize: 12.5,
                  color: "#5B6660",
                  lineHeight: 1.45,
                  background: "rgba(31, 111, 99, 0.06)",
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(31, 111, 99, 0.15)"
                }}>
                  👉 Mở hộp thư email, kiểm tra con số được gửi và <strong>bấm chọn con số đó</strong> dưới đây:
                </div>

                {/* 3 nút số to nổi bật giống phương thức Google Prompt */}
                <div className="login-identity-options-row">
                  {socialOptions.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="login-identity-num-btn"
                      onClick={() => handleSelectIdentityNumber(num)}
                      disabled={socialLoading}
                      title={`Bấm chọn con số ${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {socialLoading && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: "#1F6F63",
                    fontSize: 13,
                    fontWeight: 600,
                    margin: "2px 0"
                  }}>
                    <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Đang xác minh số {selectedNum}...</span>
                  </div>
                )}

                {socialError && (
                  <div className="login-error-badge">
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{socialError}</span>
                    </div>
                  </div>
                )}

                {socialCorrectNumber && !emailSent && (
                  <div style={{
                    background: "rgba(217, 164, 65, 0.14)",
                    border: "1px dashed rgba(217, 164, 65, 0.45)",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 11.5,
                    color: "#8C6620",
                    lineHeight: 1.4
                  }}>
                    💡 <em>(Chưa điền SMTP_PASS Gmail):</em> Con số được gửi là <strong>{socialCorrectNumber}</strong>. Bấm vào số này ở trên để xác nhận!
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginTop: 2 }}>
                  <span
                    onClick={() => {
                      setSocialStep(1);
                      setSocialError("");
                    }}
                    style={{ color: "#5B6660", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ← Đổi email khác
                  </span>

                  {resendCountdown > 0 ? (
                    <span style={{ color: "#9CA3AF" }}>
                      Gửi lại sau {resendCountdown}s
                    </span>
                  ) : (
                    <span
                      onClick={handleSendSocialOtp}
                      style={{ color: "#1F6F63", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Gửi lại email
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Cấu hình Google OAuth 2.0 */}
      {activeModal === "oauth_config" && (
        <div className="login-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="login-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 16, color: "#123F38" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#FFFFFF",
                  border: "1px solid #D9D3C1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <GoogleIcon size={18} />
                </div>
                <span>Đăng nhập Google OAuth 2.0</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn-close"
                style={{ background: "none", border: "none", color: "#5B6660", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#5B6660", lineHeight: 1.5, margin: 0 }}>
              Để mở trang Google chính thức và tự động nhận diện danh sách tài khoản Google <strong>đang đăng nhập trên thiết bị của bạn</strong>, hệ thống cần Google Client ID:
            </p>

            <div style={{
              background: "rgba(31, 111, 99, 0.08)",
              border: "1px solid rgba(31, 111, 99, 0.22)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              lineHeight: 1.5,
              color: "#20302C"
            }}>
              1. Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: "#1F6F63", fontWeight: 700 }}>Google Cloud Console</a>.<br />
              2. Tạo <strong>OAuth Client ID</strong> (Web Application), thêm <code>{window.location.origin}</code> vào <em>Authorized JavaScript origins</em> & <em>Authorized redirect URIs</em>.<br />
              3. Dán <strong>Client ID</strong> vào ô bên dưới:
            </div>

            <form onSubmit={handleSaveAndRedirectOAuth} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="VD: 123456789-abc.apps.googleusercontent.com"
                  className="login-input"
                  style={{ fontSize: 12.5 }}
                  value={inputOAuthId}
                  onChange={(e) => setInputOAuthId(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="login-submit-btn btn-teal"
                disabled={!inputOAuthId.trim()}
                style={{ marginTop: 2 }}
              >
                MỞ TRANG GOOGLE OAUTH TRÊN THIẾT BỊ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
