import { getProducts } from "../_lib/catalog.js";
import { json, setCors } from "../_lib/auth.js";

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const plans = await getProducts({ limit: 50000 });
  const monthly = plans.filter((product) =>
    ["flowers", "pet services", "groceries", "ration"].some((name) =>
      String(product.Category?.name || product.category || "").toLowerCase().includes(name)
    )
  );

  return json(res, 200, { plans, monthly });
}
