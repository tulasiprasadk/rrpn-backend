import React, { useState } from "react";
import axios from "axios";
import "./SupplierAddProduct.css";

const API = "/api";

function SupplierAddProduct() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [varieties, setVarieties] = useState([]);

  const addVariety = () => {
    setVarieties([...varieties, { name: "", price: 0, sub_varieties: [] }]);
  };

  const addSubVariety = (vIndex) => {
    const updated = [...varieties];
    updated[vIndex].sub_varieties.push({ name: "", price: 0 });
    setVarieties(updated);
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        `${API}/products`,
        {
          name,
          category,
          description,
          images,
          varieties,
        },
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      alert("Product added!");
      window.location.href = "/supplier/products";
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  return (
    <div className="add-product">
      <h2>Add Product</h2>

      <input
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        placeholder="Image URL (comma separated)"
        onChange={(e) => setImages(e.target.value.split(","))}
      />

      <button onClick={addVariety}>+ Add Variety</button>

      {varieties.map((v, i) => (
        <div key={i} className="variety-box">
          <input
            placeholder="Variety Name"
            value={v.name}
            onChange={(e) => {
              const updated = [...varieties];
              updated[i].name = e.target.value;
              setVarieties(updated);
            }}
          />

          <input
            placeholder="Price"
            type="number"
            value={v.price}
            onChange={(e) => {
              const updated = [...varieties];
              updated[i].price = Number(e.target.value);
              setVarieties(updated);
            }}
          />

          <button onClick={() => addSubVariety(i)}>+ Add Sub-Variety</button>

          {v.sub_varieties.map((sv, j) => (
            <div key={j} className="subvariety-box">
              <input
                placeholder="Sub-variety Name"
                value={sv.name}
                onChange={(e) => {
                  const updated = [...varieties];
                  updated[i].sub_varieties[j].name = e.target.value;
                  setVarieties(updated);
                }}
              />

              <input
                placeholder="Price"
                type="number"
                value={sv.price}
                onChange={(e) => {
                  const updated = [...varieties];
                  updated[i].sub_varieties[j].price = Number(e.target.value);
                  setVarieties(updated);
                }}
              />
            </div>
          ))}
        </div>
      ))}

      <button className="save-btn" onClick={handleSubmit}>
        Save Product
      </button>
    </div>
  );
}

export default SupplierAddProduct;
