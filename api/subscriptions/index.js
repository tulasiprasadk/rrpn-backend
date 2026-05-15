import { json, setCors } from "../_lib/auth.js";

export default function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  return json(res, 200, { subscriptions: [], value: [] });
}
