import { getBearerToken, json, setCors, verifyToken } from "../_lib/auth.js";

export default function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const payload = verifyToken(getBearerToken(req));
  if (!payload) {
    return json(res, 401, { loggedIn: false });
  }

  return json(res, 200, {
    loggedIn: true,
    customer: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role: payload.role || "user",
    },
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role: payload.role || "user",
    },
  });
}
