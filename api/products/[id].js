import { getProductById } from "../_lib/catalog.js";
import { setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const product = await getProductById(req.query?.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  return res.status(200).json(product);
}
