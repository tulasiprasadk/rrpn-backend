import { getProducts } from "../_lib/catalog.js";
import { setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader("X-API-Source", "NEW_HANDLER_V2");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const products = await getProducts(req.query || {});
    return res.status(200).json(products);
  } catch (err) {
    console.error("Products error:", err);
    return res.status(500).json({ error: "Failed to load products" });
  }
}