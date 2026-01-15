import "dotenv/config";
import fs from "fs";
import path from "path";
import { models } from "../config/database.js";
import { Pool } from "pg";

function parseTsv(raw) {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split("\t").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row = {};
    header.forEach((key, idx) => {
      row[key] = (cols[idx] || "").trim();
    });
    return row;
  });
}

async function main() {
  const filePath = process.argv[2] || "data/groceries2.tsv";
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const rows = parseTsv(raw);
  if (rows.length === 0) {
    console.error("No rows found in TSV.");
    process.exit(1);
  }

  const { Product, Category } = models;
  if (!Product || !Category) {
    console.error("Models not available.");
    process.exit(1);
  }

  const categoryName = rows[0].categoryName || "Groceries";
  let category = await Category.findOne({ where: { name: categoryName } });
  if (!category) {
    category = await Category.create({ name: categoryName, icon: "🛒" });
  }

  const products = [];
  const skipped = [];

  rows.forEach((r, idx) => {
    const title = (r.title || r.name || "").trim();
    const price = Number(r.price);
    if (!title || Number.isNaN(price)) {
      skipped.push({ row: idx + 2, title, price: r.price });
      return;
    }

    products.push({
      title,
      price,
      variety: r.variety || null,
      subVariety: r.subVariety || null,
      unit: r.unit || null,
      description: r.description || null,
      CategoryId: category.id,
      status: "active",
      isService: false,
      deliveryAvailable: true,
      isTemplate: true,
    });
  });

  if (products.length === 0) {
    console.error("No valid rows to import.");
    process.exit(1);
  }

  // Use raw SQL upsert to avoid unique constraint failures on title
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    max: 5,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateSql = `
        UPDATE public."Products"
        SET
          "price" = $2,
          "variety" = $3,
          "subVariety" = $4,
          "unit" = $5,
          "description" = $6,
          "CategoryId" = $7,
          "status" = $8,
          "isService" = $9,
          "deliveryAvailable" = $10,
          "isTemplate" = $11,
          "updatedAt" = NOW()
        WHERE "title" = $1
      `;

      const insertSql = `
        INSERT INTO public."Products"
          ("title", "price", "variety", "subVariety", "unit", "description",
           "CategoryId", "status", "isService", "deliveryAvailable", "isTemplate", "createdAt", "updatedAt")
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `;

      for (const p of products) {
        const params = [
          p.title,
          p.price,
          p.variety,
          p.subVariety,
          p.unit,
          p.description,
          p.CategoryId,
          p.status,
          p.isService,
          p.deliveryAvailable,
          p.isTemplate,
        ];

        const updateRes = await client.query(updateSql, params);
        if (updateRes.rowCount === 0) {
          await client.query(insertSql, params);
        }
      }

      await client.query("COMMIT");
      console.log(`Imported ${products.length} products into category ${category.name} (${category.id}).`);
      if (skipped.length > 0) {
        console.warn(`Skipped ${skipped.length} rows due to invalid title/price.`);
        console.warn(skipped.slice(0, 5));
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Bulk import failed:", err?.message || err);
      console.log("Sample rows:", products.slice(0, 3));
      process.exit(1);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Import failed:", err.message || err);
  process.exit(1);
});
