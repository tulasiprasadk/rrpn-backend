import React, { useState } from "react";
import MessagingModal from "./MessagingModal";
import { sendWhatsAppMessage } from "../api/whatsapp";

/**
 * MessageButton relays the composed message to your configured WhatsApp number.
 * Props:
 * - recipientId, recipientName, senderId
 *
 * Usage:
 * <MessageButton recipientId={user.id} recipientName={user.name} senderId={currentUser?.id} />
 */
export default function MessageButton({ recipientId, recipientName, senderId, children, className }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(payload) {
    setError("");
    setBusy(true);
    try {
      // include context for your WhatsApp message
      const bodyPayload = {
        fromName: payload.fromName || "Website user",
        fromId: payload.fromId || senderId || null,
        subject: payload.subject || "",
        body: (payload.body || "") + `\n\n(Recipient: ${recipientName || recipientId || "N/A"})`,
        // toNumber left empty to use WHATSAPP_TARGET_NUMBER from server env
      };
      const result = await sendWhatsAppMessage(bodyPayload);
      setBusy(false);
      return result;
    } catch (err) {
      setBusy(false);
      setError(err.message || "Failed to send");
      throw err;
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
        style={{
          background: "transparent",
          border: "1px solid #e6e6e6",
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
        }}
        title={`Message ${recipientName || "user"}`}
      >
        {children || "Message"}
      </button>

      <MessagingModal
        open={open}
        onClose={() => setOpen(false)}
        onSend={handleSend}
        recipientId={recipientId}
        recipientName={recipientName}
        senderId={senderId}
      />

      {busy && <div style={{ fontSize: 12, color: "#666" }}>Sending to WhatsApp...</div>}
      {error && <div style={{ color: "crimson", fontSize: 12 }}>{error}</div>}
    </>
  );
}
