import React from "react";
import { AlertTriangle, Info, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Xác nhận",
  message,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  isDanger = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 48, 44, 0.65)",
        backdropFilter: "blur(3px)",
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
          maxWidth: 360,
          backgroundColor: "#F1EEE3",
          border: "1px solid #D9D3C1",
          borderRadius: 16,
          padding: "20px 18px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          fontFamily: "'Inter', sans-serif",
          animation: "scaleInModal 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDanger ? "rgba(174, 76, 59, 0.15)" : "rgba(31, 111, 99, 0.15)",
              color: isDanger ? "#AE4C3B" : "#1F6F63",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isDanger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: "#20302C" }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "#5B6660",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "#5B6660", lineHeight: 1.5, marginBottom: 18 }}>
          {message}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {cancelText && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "1px solid #D9D3C1",
                backgroundColor: "#FBFAF4",
                color: "#5B6660",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 1.3,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              backgroundColor: isDanger ? "#AE4C3B" : "#1F6F63",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isDanger
                ? "0 2px 8px rgba(174, 76, 59, 0.3)"
                : "0 2px 8px rgba(31, 111, 99, 0.3)",
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scaleInModal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
