import React, { useState, useEffect } from "react";
import "./AddProduct.css";

export default function AddProduct() {
  const [mode, setMode] = useState("manual"); // "manual" or "template"
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [variety, setVariety] = useState("");
  const [subVariety, setSubVariety] = useState("");
  const [unit, setUnit] = useState("piece");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch product templates
    fetch("/api/products/templates/all", { credentials: "include" })
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error("Error loading templates:", err));
  }, []);

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.id === parseInt(templateId));
    
    if (template) {
      setSelectedTemplate(template);
      setName(template.title);
      setDescription(template.description || "");
      setVariety(template.variety || "");
      setSubVariety(template.subVariety || "");
      setUnit(template.unit || "piece");
      setImageUrl(template.image || "");
    } else {
      setSelectedTemplate(null);
      setName("");
      setDescription("");
      setVariety("");
      setSubVariety("");
      setUnit("piece");
      setImageUrl("");
    }
  };

  const submitProduct = async () => {
    if (!name || !price) {
      alert("Name and price are required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          price,
          description,
          image_url: imageUrl,
          variety,
          subVariety,
          unit,
          templateId: selectedTemplate?.id || null
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || data.message || "Failed to add product");
        setSaving(false);
        return;
      }

      alert("Product added successfully!");
      setSaving(false);

      setName("");
      setPrice("");
      setDescription("");
      setImageUrl("");
      setVariety("");
      setSubVariety("");
      setUnit("piece");
      setSelectedTemplate(null);

    } catch (err) {
      console.error(err);
      alert("Server Error");
      setSaving(false);
    }
  };

  return (
    <div className="ap-container">
      <h1>Add Product</h1>

      <div className="ap-mode-selector">
        <button 
          className={mode === "manual" ? "active" : ""}
          onClick={() => setMode("manual")}
        >
          Manual Entry
        </button>
        <button 
          className={mode === "template" ? "active" : ""}
          onClick={() => setMode("template")}
        >
          From Template
        </button>
      </div>

      <div className="ap-form">
        {mode === "template" && (
          <div className="ap-field">
            <label>Select Product Template</label>
            <select onChange={handleTemplateSelect} value={selectedTemplate?.id || ""}>
              <option value="">-- Choose a template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.variety ? `(${t.variety})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ap-field">
          <label>Product Name *</label>
          <input
            type="text"
            placeholder="e.g., Flowers, Vegetables"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="ap-field">
          <label>Variety</label>
          <input
            type="text"
            placeholder="e.g., Bound, Unbound, Rose, Lily"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
          />
        </div>

        <div className="ap-field">
          <label>Sub-Variety</label>
          <input
            type="text"
            placeholder="e.g., Packaged, Loose, Red, White"
            value={subVariety}
            onChange={(e) => setSubVariety(e.target.value)}
          />
        </div>

        <div className="ap-field">
          <label>Price *</label>
          <input
            type="number"
            placeholder="Product Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="ap-field">
          <label>Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="piece">Piece</option>
            <option value="kg">Kilogram (kg)</option>
            <option value="gram">Gram (g)</option>
            <option value="liter">Liter (L)</option>
            <option value="bundle">Bundle</option>
            <option value="packet">Packet</option>
            <option value="box">Box</option>
          </select>
        </div>

        <div className="ap-field">
          <label>Description</label>
          <textarea
            placeholder="Product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          />
        </div>

        <div className="ap-field">
          <label>Image URL</label>
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <button className="ap-submit" onClick={submitProduct} disabled={saving}>
          {saving ? "Saving..." : "Add Product"}
        </button>
      </div>
    </div>
  );
}
