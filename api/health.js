import { json, setCors } from "./_lib/auth.js";

export default function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  return json(res, 200, {
    ok: true,
    status: "connected",
    timestamp: new Date().toISOString(),
  });
}
