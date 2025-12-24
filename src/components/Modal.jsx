import React from "react";

/**
 * Minimal, accessible modal used by supplier dashboard for editing items.
 * Save as: src/components/Modal.jsx
 *
 * Usage:
 * <Modal open={open} onClose={() => setOpen(false)}>
 *   <div>modal content</div>
 * </Modal>
 */
export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onClose && onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#141414",
          color: "#fff",
          borderRadius: 8,
          width: "100%",
          maxWidth: 720,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          padding: 18,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 id="modal-title" style={{ margin: 0, color: "#ffd600" }}>{title || "Edit"}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}
