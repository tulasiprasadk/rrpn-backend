import fs from "fs";
import readline from "readline";
import { Op } from "sequelize";
import dotenv from "dotenv";
import { sequelize, models } from "../config/database.js";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node import_groceries_tsv.js <path-to-tsv-or-csv>");
  process.exit(1);
}

const DEFAULT_CATEGORY = "Groceries";
const CHUNK_SIZE = 500;

const normalizeHeader = (value) => String(value || "").trim().toLowerCase();
const normalizeText = (value) => String(value || "").trim();
const parsePrice = (value) => {
  if (value == null) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const headerMap = {
  product: ["product", "title", "name"],
  variety: ["variety", "category", "group"],
  subVariety: ["sub variety", "subvariety", "sub_category", "subcategory"],
  price: ["sale_price", "price", "mrp", "selling_price"],
  category: ["category", "main_category"],
};

const resolveColumnIndex = (headers, aliases) => {
  const headerIndex = headers.findIndex((h) => aliases.includes(normalizeHeader(h)));
  return headerIndex === -1 ? null : headerIndex;
};

const getColumnValue = (row, index) => {
  if (index == null || index >= row.length) return "";
  return row[index];
};

async function ensureCategories(names) {
  const uniqueNames = [...new Set(names.map((n) => normalizeText(n)).filter(Boolean))];
  if (uniqueNames.length === 0) return;

  const existing = await models.Category.findAll({
    where: { name: { [Op.in]: uniqueNames } },
    attributes: ["id", "name"],
  });

  const existingMap = new Map(existing.map((c) => [c.name, c.id]));
  uniqueNames.forEach((name) => {
    if (existingMap.has(name)) {
      categoryCache.set(name, existingMap.get(name));
    }
  });

  const toCreate = uniqueNames.filter((name) => !existingMap.has(name));
  if (toCreate.length) {
    const created = await models.Category.bulkCreate(
      toCreate.map((name) => ({ name })),
      { returning: true }
    );
    created.forEach((c) => categoryCache.set(c.name, c.id));
  }
}

const categoryCache = new Map();

async function flushChunk(records) {
  if (records.length === 0) return { inserted: 0, skipped: 0 };

  const categoryNames = records.map((r) => r.categoryName || DEFAULT_CATEGORY);
  await ensureCategories(categoryNames);

  const prepared = records.map((r) => {
    const categoryName = normalizeText(r.categoryName || DEFAULT_CATEGORY) || DEFAULT_CATEGORY;
    const CategoryId = categoryCache.get(categoryName);
    return {
      title: normalizeText(r.title),
      variety: normalizeText(r.variety) || null,
      subVariety: normalizeText(r.subVariety) || null,
      price: parsePrice(r.price),
      CategoryId,
      status: "approved",
      isService: false,
      deliveryAvailable: true,
    };
  });

  const titles = prepared.map((p) => p.title).filter(Boolean);
  if (titles.length === 0) return { inserted: 0, skipped: records.length };

  const existing = await models.Product.findAll({
    where: { title: { [Op.in]: titles } },
    attributes: ["title"],
  });
  const existingSet = new Set(existing.map((p) => p.title.toLowerCase()));

  const newProducts = prepared.filter((p) => !existingSet.has(p.title.toLowerCase()));
  if (newProducts.length === 0) return { inserted: 0, skipped: prepared.length };

  await models.Product.bulkCreate(newProducts);

  return { inserted: newProducts.length, skipped: prepared.length - newProducts.length };
}

async function run() {
  const { Product, Category } = models;
  if (!Product || !Category) {
    throw new Error("Models not initialized. Check database config.");
  }

  await sequelize.authenticate();

  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;
  let delimiter = "\t";

  let total = 0;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  let chunk = [];

  for await (const line of rl) {
    if (!headers) {
      delimiter = line.includes("\t") ? "\t" : ",";
      headers = line.split(delimiter);
      continue;
    }

    const raw = line.split(delimiter);
    if (raw.length <= 1) continue;

    try {
      const titleIdx = resolveColumnIndex(headers, headerMap.product);
      const varietyIdx = resolveColumnIndex(headers, headerMap.variety);
      const subVarietyIdx = resolveColumnIndex(headers, headerMap.subVariety);
      const priceIdx = resolveColumnIndex(headers, headerMap.price);
      const categoryIdx = resolveColumnIndex(headers, headerMap.category);

      const title = normalizeText(getColumnValue(raw, titleIdx));
      if (!title) {
        errors += 1;
        continue;
      }

      chunk.push({
        title,
        variety: getColumnValue(raw, varietyIdx),
        subVariety: getColumnValue(raw, subVarietyIdx),
        price: getColumnValue(raw, priceIdx),
        categoryName: getColumnValue(raw, categoryIdx) || DEFAULT_CATEGORY,
      });
      total += 1;

      if (chunk.length >= CHUNK_SIZE) {
        const result = await flushChunk(chunk);
        inserted += result.inserted;
        skipped += result.skipped;
        chunk = [];

        if (total % 2000 === 0) {
          console.log(`Processed ${total} rows... inserted ${inserted}, skipped ${skipped}`);
        }
      }
    } catch (err) {
      errors += 1;
      console.error("Row parse error:", err.message || err);
    }
  }

  if (chunk.length) {
    const result = await flushChunk(chunk);
    inserted += result.inserted;
    skipped += result.skipped;
  }

  console.log("Import complete.");
  console.log(`Rows read: ${total}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Errors: ${errors}`);

  await sequelize.close();
}

run().catch((err) => {
  console.error("Import failed:", err.message || err);
  process.exit(1);
});
