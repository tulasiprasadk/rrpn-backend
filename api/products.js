import { getProducts } from "./_lib/catalog.js";
import { json, setCors } from "./_lib/auth.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const products = await getProducts(req.query || {});
    return json(res, 200, { value: products, products });
  } catch (err) {
    return json(res, 500, { error: "Failed to load products" });
  }
}
