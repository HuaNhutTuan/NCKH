import React, { useState } from "react";
import { Wallet, Calendar, ShieldCheck, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";

export default function OnboardingModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [initialBalance, setInitialBalance] = useState("");
  const [payday, setPayday] = useState(1);
  const [emergencyReserve, setEmergencyReserve] = useState("");

  if (!isOpen) return null;

  const quickAmounts = [500000, 1000000, 2000000, 3000000];

  function handleFinish() {
    onComplete({
      initialBalance: parseFloat(initialBalance) || 0,
      payday_day: parseInt(payday) || 1,
      emergency_reserve: parseFloat(emergencyReserve) || 0,
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 48, 44, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "#F1EEE3",
          border: "1px solid #D9D3C1",
          borderRadius: 18,
          padding: "24px 20px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
          fontFamily: "'Inter', sans-serif",
          animation: "scaleInModal 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#1F6F63",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 10px",
              boxShadow: "0 4px 12px rgba(31,111,99,0.3)",
            }}
          >
            <Sparkles size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#123F38", fontFamily: "'Space Grotesk', sans-serif" }}>
            Chào mừng đến với NCKH!
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5B6660" }}>
            Thiết lập nhanh 3 thông tin để kích hoạt hạn mức tiêu chuẩn xác mỗi ngày.
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? "#1F6F63" : "#D9D3C1",
                transition: "background-color 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Step 1: Initial Balance */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Wallet size={18} color="#1F6F63" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#20302C" }}>
                Số tiền bạn hiện có trong ví / tài khoản:
              </span>
            </div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type="number"
                placeholder="VD: 1500000"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #D9D3C1",
                  fontSize: 16,
                  fontWeight: 700,
                  backgroundColor: "#FBFAF4",
                  color: "#20302C",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#5B6660", fontWeight: 600 }}>
                đ
              </span>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialBalance(String(amt))}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 8,
                    border: "1px solid #D9D3C1",
                    background: "#FBFAF4",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#1F6F63",
                    cursor: "pointer",
                  }}
                >
                  {(amt / 1000).toLocaleString("vi-VN")}k
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                background: "#1F6F63",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "11px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              Tiếp theo <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Payday */}
        {step === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Calendar size={18} color="#D9A441" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#20302C" }}>
                Ngày nhận chu cấp / lương hàng tháng:
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: "#5B6660", margin: "0 0 12px" }}>
              Hệ thống sẽ tính toán số ngày còn lại đến ngày này để chia đều hạn mức tiêu.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "#5B6660", fontWeight: 600 }}>Ngày</span>
              <input
                type="number"
                min={1}
                max={31}
                value={payday}
                onChange={(e) => setPayday(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{
                  width: 70,
                  padding: "10px 8px",
                  borderRadius: 8,
                  border: "1px solid #D9D3C1",
                  fontSize: 16,
                  fontWeight: 700,
                  textAlign: "center",
                  backgroundColor: "#FBFAF4",
                  color: "#123F38",
                }}
              />
              <span style={{ fontSize: 13, color: "#5B6660", fontWeight: 600 }}>hàng tháng</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  background: "#FBFAF4",
                  border: "1px solid #D9D3C1",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#5B6660",
                  cursor: "pointer",
                }}
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1.5,
                  background: "#1F6F63",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                Tiếp theo <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Emergency Reserve */}
        {step === 3 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={18} color="#1F6F63" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#20302C" }}>
                Khoản giữ lại phòng thân (Quỹ khẩn cấp):
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: "#5B6660", margin: "0 0 12px" }}>
              Số tiền này sẽ được giữ lại, không chia vào hạn mức tiêu hàng ngày (VD: để sửa xe, ốm đau).
            </p>

            <div style={{ position: "relative", marginBottom: 20 }}>
              <input
                type="number"
                placeholder="VD: 300000 (để 0 nếu không cần)"
                value={emergencyReserve}
                onChange={(e) => setEmergencyReserve(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #D9D3C1",
                  fontSize: 15,
                  fontWeight: 700,
                  backgroundColor: "#FBFAF4",
                  color: "#20302C",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#5B6660", fontWeight: 600 }}>
                đ
              </span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  background: "#FBFAF4",
                  border: "1px solid #D9D3C1",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#5B6660",
                  cursor: "pointer",
                }}
              >
                Quay lại
              </button>
              <button
                onClick={handleFinish}
                style={{
                  flex: 1.8,
                  background: "#D9A441",
                  color: "#3A2A08",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(217,164,65,0.3)",
                }}
              >
                <CheckCircle2 size={16} /> Bắt đầu sử dụng
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 11.5, color: "#5B6660", cursor: "pointer", textDecoration: "underline" }}
          >
            Bỏ qua, tôi sẽ thiết lập sau
          </button>
        </div>
      </div>
    </div>
  );
}
