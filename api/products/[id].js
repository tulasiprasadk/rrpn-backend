import { getProductById } from "../_lib/catalog.js";
import { json, setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const product = await getProductById(req.query?.id);
  if (!product) return json(res, 404, { error: "Product not found" });
  return json(res, 200, { value: product, product });
}
