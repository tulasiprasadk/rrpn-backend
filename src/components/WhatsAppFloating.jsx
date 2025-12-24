import React from "react";
import { useLocation } from "react-router-dom";

/**
 * WhatsApp floating icon button (PRODUCTION SAFE).
 *
 * - Phone must be digits-only for wa.me
 * - Works in Vite + Vercel
 * - No build-breaking syntax
 */

const DEFAULT_PHONE =
  (import.meta.env?.VITE_WHATSAPP_NUMBER || "919844007900").toString();

const DEFAULT_MESSAGE =
  import.meta.env?.VITE_WHATSAPP_MESSAGE ||
  "Hi, I need help with RR Nagar";

export default function WhatsAppFloating({
  phone = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
  hideOn = ["/admin"],
}) {
  let location;

  try {
    location = useLocation();
  } catch {
    location = { pathname: "/" };
  }

  const pathname =
    location?.pathname ||
    (typeof window !== "undefined" ? window.location.pathname : "/");

  if (Array.isArray(hideOn) && hideOn.includes(pathname)) {
    return null;
  }

  // Digits-only phone number
  const phoneDigits = phone.replace(/[^0-9]/g, "");
  const encodedMessage = encodeURIComponent(message);

  // ✅ CORRECT WhatsApp URL
  const href = `https://wa.me/${phoneDigits}?text=${encodedMessage}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 9999,
        width: 56,
        height: 56,
        borderRadius: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#25D366",
        color: "#fff",
        boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        textDecoration: "none",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          fill="#ffffff"
          d="M20.52 3.48A11.91 11.91 0 0 0 12 0C5.373 0 .04 5.373.04 12c0 2.115.552 4.18 1.6 6.02L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.2-1.25-6.19-3.48-8.52z"
        />
        <path
          fill="#ffffff"
          d="M17.472 14.382c-.297-.148-1.756-.867-2.03-.967-.273-.1-.473-.148-.673.15-.198.297-.767.967-.94 1.165-.173.198-.347.223-.644.074-.297-.148-1.255-.463-2.39-1.477-.884-.788-1.48-1.761-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.15-.173.198-.297.298-.495.1-.198.05-.372-.025-.52-.074-.148-.673-1.62-.923-2.21-.242-.58-.487-.5-.673-.51l-.576-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.475 1.065 2.873 1.213 3.074c.148.198 2.095 3.2 5.077 4.487 0 0 .688.297 1.24.454.52.148.99.125 1.36.076.414-.056 1.756-.72 2.005-1.414.248-.694.248-1.288.173-1.414-.074-.125-.272-.198-.57-.347z"
        />
      </svg>
    </a>
  );
}
