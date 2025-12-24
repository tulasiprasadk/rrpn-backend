import React, { useState, useRef } from "react";
import "./AdminBulkUpload.css";

export default function AdminBulkUpload() {
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const sampleCSV = `title,variety,subVariety,price,unit,description,categoryId,categoryName
Red Roses Bouquet,Bouquets,Small Bouquet,150,piece,Beautiful small red roses bouquet perfect for gifting,4,Flowers
Marigold Garland,Garlands,Large Garland,200,piece,Colorful marigold garland for decoration,4,Flowers
Flower Pots Small,GROUND CRACKERS,,120,box,,8,Crackers
Flower Pots Big,GROUND CRACKERS,,250,box,,8,Crackers
Sparklers 7cm,SPARKLERS,,90,box,,8,Crackers
`;

  const loadSample = () => setCsvText(sampleCSV);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setCsvText(event.target.result);
    reader.readAsText(file);
  };

  /* =========================
     CSV → products[] parser
  ========================== */
  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj = {};

      headers.forEach((header, i) => {
        obj[header] = values[i] || "";
      });

      return {
        title: obj.title,
        variety: obj.variety || null,
        subVariety: obj.subVariety || null,
        price: Number(obj.price) || 0,
        unit: obj.unit || null,
        description: obj.description || null,
        CategoryId: obj.categoryId ? Number(obj.categoryId) : null,
        categoryName: obj.categoryName || null,
      };
    });
  };

  const handleBulkUpload = async () => {
    if (!csvText.trim()) {
      alert("Please paste or upload CSV data");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const products = parseCSV(csvText);

      console.log("Uploading products:", products.length);

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Bulk upload failed");
        return;
      }

      setResult(data);
      alert(`Success! ${data.created} products created, ${data.errors} errors.`);

      if (data.errors === 0) {
        setCsvText("");
      }
    } catch (err) {
      console.error(err);
      alert("Server error during bulk upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <h1>Bulk Product Upload</h1>

      <div className="bulk-upload-actions">
        <button className="admin-button outline" onClick={loadSample}>
          📝 Load Sample CSV
        </button>
        <button
          className="admin-button outline"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Choose CSV File
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
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="Paste CSV data here..."
        rows={15}
      />

      <button
        className="admin-button primary"
        onClick={handleBulkUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Products"}
      </button>

      {result && (
        <div className="bulk-upload-result">
          <p>✅ {result.created} products created</p>
          <p>⚠️ {result.errors} errors</p>
        </div>
      )}
    </div>
  );
}
