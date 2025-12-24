// Overwrite the bulk upload to compute supplier/platform prices before upload
import React, { useState } from "react";
import { post, API_BASE } from "../api/client";
import { parsePrice, applyMargin, formatPrice } from "../utils/price";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Save as: src/pages/SupplierBulkUpload.jsx
 * Modified to compute platform_price (15%) for each row before upload.
 */
export default function SupplierBulkUpload() {
  const [rows, setRows] = useState(null);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const TEMPLATE_HEADERS = ["title", "price", "description", "category", "sku", "stock"];

  function downloadTemplate() {
    const example = [
      { title: "Rice (5kg)", price: "400", description: "Basmati rice 5kg", category: "Grocery", sku: "RICE-5KG", stock: 20 }
    ];
    const ws = XLSX.utils.json_to_sheet(example, { header: TEMPLATE_HEADERS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "template");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "rrnagar-supplier-template.xlsx");
  }

  function handleFile(e) {
    setRows(null);
    setErrors([]);
    setMessage("");
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const normalized = json.map((r, i) => {
          const item = {
            title: (r.title || r["product name"] || "").toString().trim(),
            price_raw: (r.price || "").toString().trim(),
            description: (r.description || "").toString().trim(),
            category: (r.category || "").toString().trim(),
            sku: (r.sku || "").toString().trim(),
            stock: (r.stock || "").toString().trim(),
            __row: i + 2,
          };
          // compute numeric and platform prices
          const supplierNum = parsePrice(item.price_raw || "");
          item.supplier_price = supplierNum;
          item.platform_price = parsePrice(applyMargin(supplierNum, 15));
          return item;
        });
        // basic validation
        const errs = [];
        normalized.forEach((it) => {
          if (!it.title) errs.push(`Row ${it.__row}: title is required`);
          if (it.price_raw && Number.isNaN(it.supplier_price)) errs.push(`Row ${it.__row}: invalid price`);
        });
        if (errs.length) {
          setErrors(errs);
          setRows(null);
        } else {
          setErrors([]);
          setRows(normalized);
        }
      } catch (err) {
        setErrors([`Failed to parse file: ${err.message || err}`]);
      }
    };
    reader.readAsArrayBuffer(f);
    e.target.value = "";
  }

  async function uploadAll() {
    if (!rows || rows.length === 0) return;
    setBusy(true);
    setMessage("");
    const results = [];
    for (const r of rows) {
      try {
        const payload = {
          title: r.title,
          supplier_price: r.supplier_price,
          platform_price: r.platform_price,
          price: r.supplier_price,
          description: r.description,
          category: r.category,
          sku: r.sku,
          stock: r.stock ? Number(r.stock) : undefined,
        };
        await post("/admin/products", payload, "supplier");
        results.push({ row: r.__row, ok: true });
      } catch (err) {
        results.push({ row: r.__row, ok: false, error: err.message || String(err) });
      }
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      setMessage(`All ${rows.length} listings uploaded successfully.`);
      setRows([]);
    } else {
      setErrors(failed.map((f) => `Row ${f.row}: ${f.error || "failed"}`));
    }
    setBusy(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1>Bulk upload listings</h1>
      <p>Download the template, fill rows and upload. Platform margin 15% will be computed for each row.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={downloadTemplate} style={{ padding: "8px 12px", background: "#ffd600", border: "none", borderRadius: 6 }}>
          Download Excel template
        </button>
        <label style={{ display: "inline-block", padding: "8px 12px", background: "#222", borderRadius: 6, cursor: "pointer" }}>
          Choose file
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>

      {errors && errors.length > 0 && (
        <div style={{ background: "#2b0000", color: "#ffb4b4", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <strong>Errors:</strong>
          <ul>
            {errors.map((e, idx) => <li key={idx}>{e}</li>)}
          </ul>
        </div>
      )}

      {rows && rows.length > 0 && (
        <section>
          <h2>Preview ({rows.length})</h2>
          <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 6 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#111" }}>
                  <th style={{ padding: 8 }}>Row</th>
                  <th style={{ padding: 8 }}>Title</th>
                  <th style={{ padding: 8 }}>Supplier</th>
                  <th style={{ padding: 8 }}>Platform</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: 8 }}>{r.__row}</td>
                    <td style={{ padding: 8 }}>{r.title}</td>
                    <td style={{ padding: 8 }}>{formatPrice(r.supplier_price)}</td>
                    <td style={{ padding: 8 }}>{formatPrice(r.platform_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
            <button onClick={uploadAll} disabled={busy} style={{ padding: "8px 12px", background: "#ffd600", border: "none", borderRadius: 6 }}>
              {busy ? "Uploading..." : `Upload ${rows.length} listings`}
            </button>
          </div>
        </section>
      )}

      {message && <div style={{ color: "#88c28a", marginTop: 12 }}>{message}</div>}
    </main>
  );
}
