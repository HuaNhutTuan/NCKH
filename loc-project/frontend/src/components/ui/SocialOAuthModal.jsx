import React, { useState } from "react";
import { User, X, Plus, Loader2, ArrowLeft } from "lucide-react";
import { authApi } from "../../api";

// Logo Google 4 màu chính hãng
function GoogleMultiColorIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// Logo Facebook
function FacebookLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

// Danh sách tài khoản mẫu từ ảnh thực tế của người dùng
const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: "Huanhuttuan Tuan",
    email: "tuannhut419@gmail.com",
    avatarBg: "#3c4043",
    avatarLetter: "H",
  },
  {
    name: "Nhi hk",
    email: "nhihk3856@gmail.com",
    avatarBg: "#0288d1",
    avatarLetter: "N",
  },
  {
    name: "Teacher Team",
    email: "teacherteam.uranus@gmail.com",
    avatarBg: "#f9a825",
    avatarLetter: "T",
  },
  {
    name: "Tuấn Hứa Nhựt",
    email: "tuanhn.math.ta.uranus@gmail.com",
    avatarBg: "#2e7d32",
    avatarLetter: "T",
  },
  {
    name: "Nhi Uyên",
    email: "toilamotconlua207@gmail.com",
    avatarBg: "#d81b60",
    avatarLetter: "N",
  },
];

export default function SocialOAuthModal({ provider = "Google", onClose, onSuccess }) {
  const [loadingAccount, setLoadingAccount] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");

  const appDomain = typeof window !== "undefined" ? window.location.host : "hoang-anh-web-demo.workers.dev";

  async function handleSelectAccount(acc) {
    setLoadingAccount(acc.email);
    setError("");
    try {
      const res = await authApi.socialDirectLogin({
        email: acc.email,
        name: acc.name,
        provider,
      });
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message || "Không thể đăng nhập bằng tài khoản này. Vui lòng thử lại.");
      setLoadingAccount(null);
    }
  }

  async function handleCustomSubmit(e) {
    e.preventDefault();
    if (!customEmail || !customEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    const name = customName.trim() || customEmail.split("@")[0];
    handleSelectAccount({ name, email: customEmail.trim().toLowerCase() });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 33, 36, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28)",
          overflow: "hidden",
          position: "relative",
          animation: "oauthModalFadeIn 0.22s ease-out",
          fontFamily: "'Roboto', 'Segoe UI', Arial, sans-serif",
          color: "#1f1f1f",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh loading tiến trình trên cùng nếu đang xử lý */}
        {loadingAccount && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              backgroundColor: provider === "Google" ? "#e8f0fe" : "#ebedf0",
              overflow: "hidden",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: "45%",
                height: "100%",
                backgroundColor: provider === "Google" ? "#1a73e8" : "#1877F2",
                animation: "googleBar 1.2s infinite ease-in-out",
              }}
            />
          </div>
        )}

        {/* Nút đóng góc phải */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            color: "#5f6368",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f3f4")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          title="Đóng"
        >
          <X size={20} />
        </button>

        {/* Nội dung chính dạng 2 cột chuẩn Google OAuth */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            minHeight: "440px",
            padding: "36px 40px",
            boxSizing: "border-box",
            gap: "24px",
          }}
        >
          {/* CỘT BÊN TRÁI: Logo, Tiêu đề, App Domain & Chính sách */}
          <div
            style={{
              flex: "1 1 300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingRight: "16px",
              boxSizing: "border-box",
            }}
          >
            <div>
              {/* Header: Logo Google / Facebook */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                {provider === "Google" ? <GoogleMultiColorIcon size={22} /> : <FacebookLogo size={22} />}
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f1f1f" }}>
                  Đăng nhập bằng {provider}
                </span>
              </div>

              {/* Tiêu đề & Phụ đề */}
              <h1
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#1f1f1f",
                  lineHeight: 1.25,
                }}
              >
                Chọn tài khoản
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  color: "#1f1f1f",
                  lineHeight: 1.5,
                }}
              >
                Tiếp tục tới{" "}
                <span style={{ color: "#0b57d0", fontWeight: 500 }}>
                  {appDomain}
                </span>
              </p>
            </div>

            {/* Footer chính sách quyền riêng tư */}
            <div
              style={{
                marginTop: "32px",
                fontSize: "12px",
                color: "#444746",
                lineHeight: 1.5,
              }}
            >
              Trước khi sử dụng {appDomain}, bạn có thể xem{" "}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#0b57d0", textDecoration: "none", fontWeight: 500 }}>
                Chính sách quyền riêng tư
              </a>{" "}
              và{" "}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#0b57d0", textDecoration: "none", fontWeight: 500 }}>
                Điều khoản dịch vụ
              </a>{" "}
              của ứng dụng này.
            </div>
          </div>

          {/* CỘT BÊN PHẢI: Danh sách tài khoản đã đăng nhập */}
          <div
            style={{
              flex: "1 1 360px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            {error && (
              <div
                style={{
                  backgroundColor: "#fce8e6",
                  color: "#c5221f",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "14px",
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            {!showCustomInput ? (
              /* Danh sách tài khoản Google chuẩn hình ảnh */
              <div style={{ display: "flex", flexDirection: "column" }}>
                {DEFAULT_GOOGLE_ACCOUNTS.map((acc, index) => {
                  const isLoading = loadingAccount === acc.email;
                  return (
                    <div
                      key={acc.email}
                      onClick={() => !loadingAccount && handleSelectAccount(acc)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        cursor: loadingAccount ? "not-allowed" : "pointer",
                        transition: "background-color 0.15s ease",
                        borderBottom: index < DEFAULT_GOOGLE_ACCOUNTS.length - 1 ? "1px solid #e0e2ec" : "none",
                        opacity: loadingAccount && !isLoading ? 0.45 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingAccount) e.currentTarget.style.backgroundColor = "#f0f4f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: acc.avatarBg,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 500,
                          fontSize: "15px",
                          flexShrink: 0,
                        }}
                      >
                        {acc.avatarLetter}
                      </div>

                      {/* Tên và Email */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#1f1f1f",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {acc.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12.5px",
                            color: "#444746",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {acc.email}
                        </div>
                      </div>

                      {/* Spinner nếu đang bấm */}
                      {isLoading && (
                        <Loader2
                          size={18}
                          color="#0b57d0"
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Phân cách và Nút "Sử dụng một tài khoản khác" */}
                <div style={{ borderTop: "1px solid #e0e2ec", marginTop: "4px" }} />

                <div
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "13px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    marginTop: "2px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f4f9")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: "1px solid #747775",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#444746",
                      flexShrink: 0,
                    }}
                  >
                    <User size={19} />
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f1f1f" }}>
                    Sử dụng một tài khoản khác
                  </div>
                </div>
              </div>
            ) : (
              /* Màn hình nhập tài khoản tùy chỉnh */
              <form onSubmit={handleCustomSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setError("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      color: "#444746",
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>Nhập tài khoản {provider}</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#444746", marginBottom: "6px" }}>
                    Email {provider}:
                  </label>
                  <input
                    type="email"
                    placeholder="vidu@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: "1px solid #747775",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", color: "#444746", marginBottom: "6px" }}>
                    Tên hiển thị (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên của bạn"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "14px",
                      borderRadius: "8px",
                      border: "1px solid #c4c7c5",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAccount !== null}
                  style={{
                    backgroundColor: "#0b57d0",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "20px",
                    padding: "11px 24px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    alignSelf: "flex-end",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {loadingAccount ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>Đang tiếp tục...</span>
                    </>
                  ) : (
                    "Tiếp theo"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes oauthModalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes googleBar {
          0% { margin-left: 0%; width: 30%; }
          50% { margin-left: 40%; width: 50%; }
          100% { margin-left: 100%; width: 10%; }
        }
      `}</style>
    </div>
  );
}
