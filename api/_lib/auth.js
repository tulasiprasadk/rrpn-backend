import crypto from "node:crypto";

const DEFAULT_FRONTEND_URL = "https://rrpn-frontend.vercel.app";

export function getFrontendUrl() {
  return env("FRONTEND_URL", "NEXT_PUBLIC_FRONTEND_URL") || DEFAULT_FRONTEND_URL;
}

export function getBackendUrl(req) {
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  const currentHostUrl = host ? `https://${host}` : "";
  const configured = env("BACKEND_URL", "VITE_API_URL");
  return normalizeBaseUrl(currentHostUrl || configured || "https://rrpn-backend.vercel.app");
}

export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).end(JSON.stringify(body));
}

export function setCors(req, res) {
  const allowedOrigins = new Set([
    getFrontendUrl(),
    "https://rrpn-frontend.vercel.app",
    "https://rrnagar.com",
    "https://www.rrnagar.com",
    "http://localhost:5173",
    "http://localhost:3000",
  ]);
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

export function signToken(payload) {
  const secret = env("JWT_SECRET", "SESSION_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
    ...payload,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyToken(token) {
  const secret = env("JWT_SECRET", "SESSION_SECRET");
  if (!secret || !token) return null;

  const [encodedHeader, encodedBody, signature] = token.split(".");
  if (!encodedHeader || !encodedBody || !signature) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");

  if (!timingSafeEqual(signature, expected)) return null;

  const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

export function env(...names) {
  for (const name of names) {
    const value = stripWrappingQuotes(process.env[name]?.trim() || "");
    if (value) return value;
  }
  return "";
}

export function isConfiguredSecret(value) {
  return Boolean(value && !/placeholder|replace-with|your-/i.test(value));
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
