import React, { useState } from "react";

/**
 * Lightweight modal (no external dependency) to compose and send a message.
 * Props:
 * - open (bool)
 * - onClose (fn)
 * - onSend (fn) receives message payload and returns a Promise
 * - recipientId, recipientName, senderId (optional)
 */
export default function MessagingModal({ open, onClose, onSend, recipientId, recipientName, senderId }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    if (!recipientId) {
      setError("No recipient specified");
      return;
    }
    setLoading(true);
    try {
      await onSend({
        fromId: senderId || null,
        toId: recipientId,
        subject,
        body,
      });
      setSubject("");
      setBody("");
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <strong>Message {recipientName || "user"}</strong>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} />
          </label>

          <label style={styles.label}>
            Message
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} style={styles.textarea} />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.secondary}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.primary}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    width: 520,
    maxWidth: "95%",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    padding: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
  },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { display: "flex", flexDirection: "column", fontSize: 13, gap: 6 },
  input: {
    padding: "8px 10px",
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  textarea: {
    padding: 10,
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ddd",
    fontFamily: "inherit",
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 },
  primary: {
    background: "#0b5fff",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  secondary: {
    background: "#f5f5f5",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: { color: "crimson", fontSize: 13 },
};
