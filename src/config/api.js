const CANONICAL_HOSTS = {
  "rrnagar.com": "https://www.rrnagar.com",
};

function getCanonicalOrigin() {
  if (typeof window === "undefined") {
    return "";
  }

  const mapped = CANONICAL_HOSTS[window.location.hostname];
  return mapped || window.location.origin;
}

const ENV_API_URL =
  import.meta.env.NEXT_PUBLIC_API_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "";

const RUNTIME_API_URL =
  typeof window !== "undefined" && typeof window.__RRN_API_BASE === "string"
    ? window.__RRN_API_BASE.trim()
    : "";

const BASE =
  import.meta.env.VITE_API_URL ||
  "https://rrpn-backend.vercel.app";

export const BACKEND_BASE = BASE;
export const API_BASE = `${BACKEND_BASE}/api`;

const API_PREFIXES = [
  "/api",
  "/auth",
  "/orders",
  "/payments",
  "/products",
  "/categories",
  "/customer",
  "/customers",
  "/supplier",
  "/suppliers",
  "/admin",
  "/ads",
  "/blogs",
  "/cms",
  "/subscription",
  "/subscriptions",
  "/partner-inquiry",
  "/cart",
  "/shops",
];

export function resolveBackendUrl(path = "") {
  if (!path) {
    return BACKEND_BASE;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!path.startsWith("/")) {
    return `${API_BASE}/${path.replace(/^\/+/, "")}`;
  }

  if (path === "/api" || path.startsWith("/api/")) {
    return `${BACKEND_BASE}${path}`;
  }

  if (isBackendPath(path)) {
    return `${API_BASE}${path}`;
  }

  return `${BACKEND_BASE}${path}`;
}

export function isBackendPath(path = "") {
  return API_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function resolveApiRequestUrl(input) {
  const raw = typeof input === "string" ? input : input?.url;
  if (!raw || /^https?:\/\//i.test(raw) || !raw.startsWith("/")) {
    return raw;
  }

  if (!isBackendPath(raw)) {
    return raw;
  }

  return resolveBackendUrl(raw);
}

export function sanitizeBase64DataUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(trimmed)
    ? trimmed
    : null;
}
