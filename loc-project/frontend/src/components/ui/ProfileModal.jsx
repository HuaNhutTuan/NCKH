import React, { useState, useRef, useEffect } from "react";
import {
  X, Camera, User, Flame, Lock, Eye, EyeOff, Save, LogOut,
  Calendar, Mail, ChevronDown, ChevronUp, Edit3
} from "lucide-react";
import { authApi } from "../../api";

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

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch { return dateStr; }
}

function toInputDate(dateStr) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  } catch { return ""; }
}

function AvatarCircle({ avatarUrl, name, size = 80, onClick }) {
  const initials = name
    ? name.trim().split(" ").filter(Boolean).slice(-2).map((w) => w[0].toUpperCase()).join("")
    : "?";
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", cursor: onClick ? "pointer" : "default",
        border: `3px solid ${T.teal}`,
        boxShadow: "0 4px 16px rgba(31,111,99,0.25)",
        position: "relative", flexShrink: 0,
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.36, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}>
          {initials}
        </span>
      )}
      {onClick && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,0.32)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.18s",
        }}
          className="avatar-overlay"
        >
          <Camera size={size * 0.28} color="#fff" />
        </div>
      )}
    </div>
  );
}

export default function ProfileModal({ user, token, onClose, onLogout, onUserUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthday, setBirthday] = useState(toInputDate(user?.birthday || ""));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const streak = user?.streak_count || 1;

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", msg: "Ảnh tối đa 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile() {
    if (!name.trim()) {
      setToast({ type: "error", msg: "Tên hiển thị không được để trống." });
      return;
    }
    setSaving(true);
    try {
      const data = await authApi.updateProfile(token, { name, email, birthday: birthday || null, avatar_url: avatarUrl || null });
      setToast({ type: "success", msg: "Đã lưu hồ sơ thành công!" });
      if (onUserUpdate && data.user) onUserUpdate(data.user);
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Có lỗi khi lưu hồ sơ." });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      setToast({ type: "error", msg: "Vui lòng điền đầy đủ các trường mật khẩu." });
      return;
    }
    if (newPw !== confirmPw) {
      setToast({ type: "error", msg: "Mật khẩu mới và xác nhận không khớp." });
      return;
    }
    if (newPw.length < 6) {
      setToast({ type: "error", msg: "Mật khẩu mới cần ít nhất 6 ký tự." });
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword(token, { currentPassword: currentPw, newPassword: newPw });
      setToast({ type: "success", msg: "Đã đổi mật khẩu thành công!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setShowPwSection(false);
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Có lỗi khi đổi mật khẩu." });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <>
      <style>{`
        .avatar-card:hover .avatar-overlay { opacity: 1 !important; }
        .profile-input {
          width: 100%; box-sizing: border-box;
          border-radius: 10px; border: 1.5px solid ${T.border};
          padding: 9px 12px; font-size: 13px; outline: none;
          background: ${T.card}; color: ${T.ink}; font-family: inherit;
          transition: border-color 0.18s;
        }
        .profile-input:focus { border-color: ${T.teal}; }
        .profile-input:disabled { opacity: 0.55; cursor: not-allowed; }
        .pw-toggle {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); background: none; border: none;
          cursor: pointer; color: ${T.inkSoft}; padding: 2px;
          display: flex; align-items: center;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 600px; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(18,63,56,0.55)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}
      >
        {/* Modal sheet — từ dưới lên */}
        <div
          style={{
            width: "100%", maxWidth: 420,
            background: T.paper,
            borderRadius: "22px 22px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.22)",
            maxHeight: "92dvh",
            overflowY: "auto",
            animation: "fadeInUp 0.28s cubic-bezier(0.2,0.8,0.2,1)",
            paddingBottom: "env(safe-area-inset-bottom, 12px)",
          }}
        >
          {/* Handle bar */}
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border }} />
          </div>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 18px 12px", borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.tealDark, fontFamily: "'Space Grotesk', sans-serif" }}>
              Hồ sơ cá nhân
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: T.inkSoft, padding: 4, borderRadius: 8,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 18px 10px" }}>

            {/* Toast */}
            {toast && (
              <div style={{
                marginBottom: 12, padding: "9px 14px", borderRadius: 10,
                background: toast.type === "success" ? "rgba(31,111,99,0.12)" : "rgba(174,76,59,0.12)",
                border: `1px solid ${toast.type === "success" ? T.teal : T.brick}`,
                color: toast.type === "success" ? T.teal : T.brick,
                fontSize: 12.5, fontWeight: 600,
              }}>
                {toast.type === "success" ? "✅ " : "⚠️ "}{toast.msg}
              </div>
            )}

            {/* Avatar + Tên + Streak */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <div className="avatar-card" style={{ position: "relative", marginBottom: 10 }}>
                <AvatarCircle
                  avatarUrl={avatarUrl}
                  name={name}
                  size={82}
                  onClick={() => fileInputRef.current?.click()}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Tên + streak badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 18, fontWeight: 700,
                  color: T.tealDark, fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {name || user?.name}
                </span>
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  background: "linear-gradient(135deg, #FF6B2B, #D9A441)",
                  borderRadius: 20, padding: "3px 9px",
                  boxShadow: "0 2px 8px rgba(217,164,65,0.45)",
                }}>
                  <Flame size={13} color="#fff" fill="#fff" />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff" }}>
                    {streak} ngày
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
                {streak > 1 ? `🎉 Chuỗi đăng nhập liên tiếp!` : "Bắt đầu chuỗi đăng nhập hôm nay!"}
              </span>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 8, display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(31,111,99,0.08)", border: `1px solid rgba(31,111,99,0.25)`,
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 11, color: T.teal, cursor: "pointer", fontWeight: 600,
                }}
              >
                <Camera size={11} />
                Đổi ảnh đại diện
              </button>
            </div>

            {/* Form thông tin */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Tên hiển thị */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                  <User size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Tên hiển thị
                </label>
                <input
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              {/* Ngày sinh */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                  <Calendar size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Ngày sinh
                </label>
                <input
                  className="profile-input"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {/* Email (tài khoản) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                  <Mail size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Tài khoản (Email)
                </label>
                <input
                  className="profile-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              {/* Đổi mật khẩu (collapsible) */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                <button
                  onClick={() => setShowPwSection((v) => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, width: "100%",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px 0", color: T.ink, fontWeight: 600, fontSize: 13,
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Lock size={13} color={T.teal} />
                    <span style={{ color: T.teal }}>Đổi mật khẩu</span>
                  </div>
                  {showPwSection ? <ChevronUp size={15} color={T.inkSoft} /> : <ChevronDown size={15} color={T.inkSoft} />}
                </button>

                {showPwSection && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, animation: "slideDown 0.22s ease" }}>
                    {/* Mật khẩu hiện tại */}
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                        Mật khẩu hiện tại
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          className="profile-input"
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          style={{ paddingRight: 36 }}
                        />
                        <button className="pw-toggle" onClick={() => setShowCurrentPw((v) => !v)} tabIndex={-1}>
                          {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                        Mật khẩu mới
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          className="profile-input"
                          type={showNewPw ? "text" : "password"}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          style={{ paddingRight: 36 }}
                        />
                        <button className="pw-toggle" onClick={() => setShowNewPw((v) => !v)} tabIndex={-1}>
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, display: "block", marginBottom: 5 }}>
                        Xác nhận mật khẩu mới
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          className="profile-input"
                          type={showConfirmPw ? "text" : "password"}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          style={{ paddingRight: 36 }}
                        />
                        <button className="pw-toggle" onClick={() => setShowConfirmPw((v) => !v)} tabIndex={-1}>
                          {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={savingPw}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 10,
                        background: T.teal, color: "#fff", border: "none",
                        fontSize: 13, fontWeight: 700, cursor: savingPw ? "not-allowed" : "pointer",
                        opacity: savingPw ? 0.7 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <Lock size={14} />
                      {savingPw ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                    </button>
                  </div>
                )}
              </div>

              {/* Nút Lưu hồ sơ */}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  width: "100%", padding: "11px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${T.teal}, ${T.tealDark})`,
                  color: "#fff", border: "none",
                  fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: "0 4px 14px rgba(31,111,99,0.35)",
                  marginTop: 4,
                }}
              >
                <Save size={15} />
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>

              {/* Phân cách */}
              <div style={{ borderTop: `1px solid ${T.border}`, margin: "6px 0" }} />

              {/* Nút Đăng xuất màu đỏ */}
              {!showLogoutConfirm ? (
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  style={{
                    width: "100%", padding: "11px", borderRadius: 12,
                    background: "rgba(174,76,59,0.08)",
                    color: T.brick, border: `1.5px solid rgba(174,76,59,0.35)`,
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    transition: "background 0.18s, border-color 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(174,76,59,0.15)";
                    e.currentTarget.style.borderColor = T.brick;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(174,76,59,0.08)";
                    e.currentTarget.style.borderColor = "rgba(174,76,59,0.35)";
                  }}
                >
                  <LogOut size={15} />
                  Đăng xuất tài khoản
                </button>
              ) : (
                /* Xác nhận đăng xuất */
                <div style={{
                  border: `1.5px solid ${T.brick}`, borderRadius: 12,
                  padding: "12px 14px",
                  background: "rgba(174,76,59,0.06)",
                  animation: "fadeInUp 0.2s ease",
                }}>
                  <p style={{
                    margin: "0 0 10px", fontSize: 13, color: T.brick, fontWeight: 600, textAlign: "center",
                  }}>
                    ⚠️ Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{
                        flex: 1, padding: "9px", borderRadius: 10,
                        background: T.card, color: T.ink,
                        border: `1px solid ${T.border}`,
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => { onLogout(); onClose(); }}
                      style={{
                        flex: 1, padding: "9px", borderRadius: 10,
                        background: T.brick, color: "#fff", border: "none",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}
                    >
                      <LogOut size={13} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Khoảng cách dưới */}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </>
  );
}
