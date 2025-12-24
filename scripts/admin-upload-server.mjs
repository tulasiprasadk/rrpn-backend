import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const PORT = process.env.ADMIN_UPLOAD_PORT || 5002;
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const METADATA_FILE = path.resolve(__dirname, "..", "images.json");
const PRODUCTS_FILE = path.resolve(__dirname, "..", "products.json");

// ensure folders & metadata files
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2), "utf8");
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), "utf8");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, safe);
  },
});
const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEVELOPMENT CSP middleware (permissive for local dev)
app.use((req, res, next) => {
  const csp = [
    "default-src 'self'",
    "connect-src 'self' http://localhost:5173 http://localhost:5002 ws://localhost:5173 ws://localhost:5002",
    "img-src 'self' data: http://localhost:5173 http://localhost:5002",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  ].join("; ");
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// helpers
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
function genId(prefix = "") {
  return prefix + Date.now().toString(36) + "-" + Math.floor(Math.random()*10000).toString(36);
}

/* ---------- Uploads / Images ---------- */

app.get("/admin/uploads", (req, res) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Admin Media</title></head><body>
  <h1>Admin Media</h1>
  <form id="uform" enctype="multipart/form-data">
    <input type="file" id="file" name="file" accept="image/*" />
    <input id="title" name="title" placeholder="Title" />
    <input id="alt" name="alt" placeholder="Alt text" />
    <select id="role" name="role"><option>image</option><option>hero</option><option>logo</option></select>
    <button type="button" id="upload">Upload</button>
  </form>
  <pre id="msg"></pre>
  <script>
    async function fetchImages(){ const r = await fetch('/admin/images'); const data = await r.json(); document.getElementById('msg').textContent = JSON.stringify(data, null, 2); }
    document.getElementById('upload').addEventListener('click', async ()=> {
      const f = document.getElementById('file').files[0];
      if(!f) return alert('pick file');
      const fd = new FormData();
      fd.append('file', f);
      fd.append('title', document.getElementById('title').value);
      fd.append('alt', document.getElementById('alt').value);
      fd.append('role', document.getElementById('role').value);
      const r = await fetch('/admin/uploads', { method:'POST', body: fd });
      const j = await r.json();
      alert(r.ok ? 'uploaded' : 'failed: ' + JSON.stringify(j));
      fetchImages();
    });
    fetchImages();
  </script>
  </body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get("/admin/images", (req, res) => {
  res.json(readJson(METADATA_FILE));
});

app.post("/admin/uploads", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const body = req.body || {};
    const id = genId("img-");
    const record = {
      id,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      title: body.title || "",
      alt: body.alt || "",
      role: body.role || "image",
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy || "admin",
    };
    const arr = readJson(METADATA_FILE);
    arr.unshift(record);
    writeJson(METADATA_FILE, arr);
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/admin/uploads/:id", (req, res) => {
  try {
    const id = req.params.id;
    let arr = readJson(METADATA_FILE);
    const idx = arr.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const [removed] = arr.splice(idx, 1);
    writeJson(METADATA_FILE, arr);
    const fpath = path.join(UPLOADS_DIR, removed.filename);
    if (fs.existsSync(fpath)) { try { fs.unlinkSync(fpath); } catch(e) { console.warn('unlink failed', e); } }
    res.json({ ok: true, removed });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

/* ---------- Products API & UI ---------- */

app.get("/admin/products/ui", (req, res) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Admin Products</title></head><body>
  <h1>Products (Admin UI)</h1>
  <pre id="out"></pre>
  <script>
    async function load(){ const r = await fetch('/admin/products'); const j = await r.json(); document.getElementById('out').textContent = JSON.stringify(j, null, 2); }
    load();
  </script>
  </body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Public products list (frontend should fetch this)
app.get("/admin/products", (req, res) => {
  res.json(readJson(PRODUCTS_FILE));
});

// Create product
app.post("/admin/products", (req, res) => {
  try {
    const b = req.body || {};
    const id = genId("prod-");
    const product = {
      id,
      title: b.title || "Untitled",
      description: b.description || "",
      sku: b.sku || "",
      price: typeof b.price === "number" ? b.price : Number(b.price) || 0,
      stock: typeof b.stock === "number" ? b.stock : parseInt(b.stock) || 0,
      imageUrl: b.imageUrl || "",
      category: b.category || "",
      createdAt: new Date().toISOString()
    };
    const arr = readJson(PRODUCTS_FILE);
    arr.unshift(product);
    writeJson(PRODUCTS_FILE, arr);
    res.json(product);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Update product
app.put("/admin/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    let arr = readJson(PRODUCTS_FILE);
    const idx = arr.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const body = req.body || {};
    const p = arr[idx];
    p.title = body.title ?? p.title;
    p.description = body.description ?? p.description;
    p.sku = body.sku ?? p.sku;
    p.price = typeof body.price === "number" ? body.price : Number(body.price) || p.price;
    p.stock = typeof body.stock === "number" ? body.stock : parseInt(body.stock) || p.stock;
    p.imageUrl = body.imageUrl ?? p.imageUrl;
    p.category = body.category ?? p.category;
    p.updatedAt = new Date().toISOString();
    arr[idx] = p;
    writeJson(PRODUCTS_FILE, arr);
    res.json(p);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Delete product
app.delete("/admin/products/:id", (req, res) => {
  try {
    const id = req.params.id;
    let arr = readJson(PRODUCTS_FILE);
    const idx = arr.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const [removed] = arr.splice(idx, 1);
    writeJson(PRODUCTS_FILE, arr);
    res.json({ ok: true, removed });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

/* ---------- Static uploads ---------- */
app.use("/uploads", express.static(UPLOADS_DIR));

/* ---------- Start ---------- */
app.listen(PORT, () => {
  console.log(`Admin upload server listening on http://localhost:${PORT}`);
  console.log(`Uploads dir: ${UPLOADS_DIR}`);
  console.log(`Images metadata file: ${METADATA_FILE}`);
  console.log(`Products file: ${PRODUCTS_FILE}`);
});
