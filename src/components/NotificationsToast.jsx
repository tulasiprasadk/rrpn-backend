import React, { useEffect, useState } from "react";
import { useNotifications } from "../context/NotificationContext";

/**
 * Enhanced notification toast stack (top-right)
 * - Supports longer messages (15-25 words)
 * - Better color coding and styling
 */
export default function NotificationsToast() {
  const { toasts, removeToast } = useNotifications();

  return (
    <div style={containerStyle}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration === 0) return; // Don't auto-close if duration is 0

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(), 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const bgColor = getBgColor(toast.type);
  const borderColor = getBorderColor(toast.type);

  return (
    <div
      style={{
        ...toastStyle,
        background: bgColor,
        borderLeft: `5px solid ${borderColor}`,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateX(400px)" : "translateX(0)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 18 }}>{getIcon(toast.type)}</span>
          <strong style={titleStyle}>{toast.title || getTitleForType(toast.type)}</strong>
        </div>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close notification">
          ✕
        </button>
      </div>
      {toast.message && (
        <div style={messageStyle}>{toast.message}</div>
      )}
    </div>
  );
}

function getTitleForType(type) {
  if (type === "error") return "Error";
  if (type === "success") return "Success";
  if (type === "warning") return "Warning";
  if (type === "info") return "Information";
  return "Notification";
}

function getIcon(type) {
  if (type === "error") return "❌";
  if (type === "success") return "✅";
  if (type === "warning") return "⚠️";
  if (type === "info") return "ℹ️";
  return "📢";
}

function getBgColor(type) {
  if (type === "error") return "#fee2e2";
  if (type === "success") return "#dcfce7";
  if (type === "warning") return "#fef3c7";
  if (type === "info") return "#dbeafe";
  return "#f3f4f6";
}

function getBorderColor(type) {
  if (type === "error") return "#dc2626";
  if (type === "success") return "#16a34a";
  if (type === "warning") return "#ea580c";
  if (type === "info") return "#0284c7";
  return "#6b7280";
}

const containerStyle = {
  position: "fixed",
  top: 20,
  right: 20,
  zIndex: 99999,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  maxWidth: 400,
  pointerEvents: "auto",
};

const toastStyle = {
  background: "#fff",
  padding: "14px 16px",
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  animation: "slideIn 0.3s ease-out",
  minHeight: "50px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 8,
  gap: 10,
};

const titleStyle = {
  fontSize: "14px",
  fontWeight: "600",
  margin: 0,
  color: "#1f2937",
};

const messageStyle = {
  fontSize: "13px",
  color: "#4b5563",
  lineHeight: "1.5",
  margin: 0,
  wordWrap: "break-word",
};

const closeBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 16,
  color: "#999",
  padding: 0,
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
  transition: "0.2s",
  flexShrink: 0,
};

// Add CSS animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(400px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}
