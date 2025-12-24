import React, { useState } from "react";

export default function BulkUpload({ supplierId }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/products/bulk-upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      setRows(data.rows);
    } else {
      alert(data.message);
    }
  };

  const saveProducts = async () => {
    const res = await fetch(`/api/admin/products/bulk-save/${supplierId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    const data = await res.json();
    if (data.success) {
      alert(`Uploaded ${data.count} products.`);
      setRows([]);
    } else {
      alert(data.error);
    }
  };

  return (
    <div>
      <h2>Bulk Upload Products</h2>

      <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} />

      <p><b>{fileName}</b></p>

      {rows.length > 0 && (
        <div>
          <h3>Preview ({rows.length} rows)</h3>

          <table border="1" cellPadding="5">
            <thead>
              <tr>
                {Object.keys(rows[0]).map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={saveProducts}>Save All Products</button>
        </div>
      )}
    </div>
  );
}
