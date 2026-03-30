import React, { useMemo, useRef, useState } from "react";
import api from "../../../api/client";
import "./AdminBulkUpload.css";

const catalogSample = `title,variety,subVariety,price,unit,description,categoryId,categoryName
Red Roses Bouquet,Bouquets,Small Bouquet,150,piece,Beautiful small red roses bouquet perfect for gifting,,Flowers
Marigold Garland,Garlands,Large Garland,200,piece,Colorful marigold garland for decoration,,Flowers
`;

const priceSample = `id,price
101,155
102,210
`;

const normalizeCsv = (text) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const parseSimpleCsv = (text) => {
  const lines = normalizeCsv(text);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
};

export default function AdminBulkUpload() {
  const [mode, setMode] = useState("catalog");
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef(null);

  const sampleText = useMemo(() => (mode === "catalog" ? catalogSample : priceSample), [mode]);

  const loadSample = () => setCsvText(sampleText);

  const downloadSample = () => {
    const blob = new Blob([sampleText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = mode === "catalog" ? "sample_bulk_upload.csv" : "sample_price_update.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => setCsvText(loadEvent.target?.result || "");
    reader.readAsText(file);
  };

  const parseCatalogCsv = (text) =>
    parseSimpleCsv(text).map((row) => ({
      title: row.title,
      variety: row.variety || null,
      subVariety: row.subVariety || null,
      price: Number(row.price) || 0,
      unit: row.unit || null,
      description: row.description || null,
      CategoryId: row.categoryId ? Number(row.categoryId) : null,
      categoryName: row.categoryName || null
    }));

  const parsePriceCsv = (text) =>
    parseSimpleCsv(text).map((row) => ({
      id: row.id ? Number(row.id) : undefined,
      title: row.title || undefined,
      price: Number(row.price)
    }));

  const handleCatalogUpload = async () => {
    const products = parseCatalogCsv(csvText);
    const chunkSize = 100;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (let index = 0; index < products.length; index += chunkSize) {
      const chunk = products.slice(index, index + chunkSize);
      const { data } = await api.post(
        `/admin/products/bulk${replaceExisting ? "?mode=replace" : ""}`,
        { products: chunk }
      );

      totalCreated += data?.created || 0;
      totalUpdated += data?.updated || 0;
      totalErrors += data?.errors || 0;
    }

    return {
      created: totalCreated,
      updated: totalUpdated,
      errors: totalErrors
    };
  };

  const handlePriceUpload = async () => {
    const updates = parsePriceCsv(csvText);
    if (updates.length === 0) {
      throw new Error("Please provide at least one price row");
    }

    const invalidRow = updates.find((row) => (!row.id && !row.title) || !Number.isFinite(row.price) || row.price < 0);
    if (invalidRow) {
      throw new Error("Each price row needs id or title and a valid non-negative price");
    }

    const { data } = await api.post("/admin/products/prices/bulk", { updates });
    return {
      created: 0,
      updated: data?.updated || 0,
      errors: Array.isArray(data?.errors) ? data.errors.length : 0,
      details: data?.errors || []
    };
  };

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      alert("Please paste or upload CSV data");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const summary = mode === "catalog" ? await handleCatalogUpload() : await handlePriceUpload();
      setResult(summary);

      if (mode === "catalog") {
        alert(`Success! ${summary.created} products created, ${summary.updated} products updated, ${summary.errors} errors.`);
      } else {
        alert(`Price update finished. ${summary.updated} products updated, ${summary.errors} errors.`);
      }

      if (summary.errors === 0) {
        setCsvText("");
      }
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || error.message || "Server error during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <h1>{mode === "catalog" ? "Bulk Product Upload" : "Bulk Price Update"}</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className="admin-button"
          onClick={() => {
            setMode("catalog");
            setCsvText("");
            setResult(null);
          }}
          style={{ background: mode === "catalog" ? "#c8102e" : "#fff", color: mode === "catalog" ? "#fff" : "#333" }}
        >
          Catalog Upload
        </button>
        <button
          className="admin-button"
          onClick={() => {
            setMode("price");
            setCsvText("");
            setResult(null);
          }}
          style={{ background: mode === "price" ? "#c8102e" : "#fff", color: mode === "price" ? "#fff" : "#333" }}
        >
          Price Only Update
        </button>
      </div>

      <div
        style={{
          background: "#fff6bf",
          border: "1px solid #e6d36a",
          borderRadius: 10,
          padding: 14,
          marginBottom: 16,
          color: "#5f4a00"
        }}
      >
        {mode === "catalog"
          ? "Use this when you are adding or replacing product records."
          : "Use this when the product list is already correct and you only need to change prices in bulk."}
      </div>

      <div className="bulk-upload-actions">
        <button className="admin-button outline" onClick={downloadSample}>
          Download Sample CSV
        </button>
        <button className="admin-button outline" onClick={loadSample}>
          Load Sample CSV
        </button>
        <button
          className="admin-button outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose CSV File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          hidden
        />
      </div>

      <textarea
        value={csvText}
        onChange={(event) => setCsvText(event.target.value)}
        placeholder={mode === "catalog" ? "Paste catalog CSV data here..." : "Paste price update CSV data here..."}
        rows={15}
      />

      {mode === "catalog" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "12px 0",
            color: "#444"
          }}
        >
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(event) => setReplaceExisting(event.target.checked)}
          />
          Replace matching old products with the uploaded data
        </label>
      )}

      <button
        className="admin-button primary"
        onClick={handleSubmit}
        disabled={uploading}
      >
        {uploading ? "Processing..." : mode === "catalog" ? "Upload Products" : "Update Prices"}
      </button>

      {result && (
        <div className="bulk-upload-result">
          {mode === "catalog" && <p>Created: {result.created}</p>}
          <p>Updated: {result.updated || 0}</p>
          <p>Errors: {result.errors}</p>
          {Array.isArray(result.details) && result.details.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {result.details.slice(0, 10).map((detail, index) => (
                <p key={`${detail.reference || "row"}-${index}`}>
                  {(detail.reference || "Row")}: {detail.error || "Failed"}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
