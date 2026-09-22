import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X, RotateCcw } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = "success", onUndo, undoLabel = "Hoàn tác", duration = 5000 } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration) return;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: "#1F6F63",
    error: "#AE4C3B",
    warning: "#D9A441",
    info: "#20302C",
  };

  const Icon = type === "error" || type === "warning" ? AlertTriangle : type === "info" ? Info : CheckCircle2;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 82, // Vừa vặn bên trên Bottom Navigation Bar
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "90%",
        maxWidth: 380,
        backgroundColor: bgColors[type] || bgColors.success,
        color: "#FAF8F2",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        animation: "slideUpToast 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <Icon size={18} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, wordBreak: "break-word" }}>
          {message}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {onUndo && (
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              padding: "4px 9px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RotateCcw size={12} /> {undoLabel}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar countdown */}
      {duration && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 3,
            width: `${progress}%`,
            background: "rgba(255,255,255,0.5)",
            transition: "width 50ms linear",
          }}
        />
      )}

      <style>{`
        @keyframes slideUpToast {
          from { opacity: 0; transform: translate(-50%, 15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
