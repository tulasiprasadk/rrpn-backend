import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SupplierEditProduct.css";

const API = "/api";

function SupplierEditProduct() {
  const id = window.location.pathname.split("/").pop();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [varieties, setVarieties] = useState([]);

  const loadProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`);
      const p = res.data;

      setName(p.name);
      setCategory(p.category);
      setDescription(p.description || "");
      setImages(p.images || []);
      setVarieties(p.varieties || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load product");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProduct();
  }, []);

  const addVariety = () => {
    setVarieties([...varieties, { name: "", price: 0, sub_varieties: [] }]);
  };

  const addSubVariety = (vIndex) => {
    const updated = [...varieties];
    updated[vIndex].sub_varieties.push({ name: "", price: 0 });
    setVarieties(updated);
  };

  const updateProduct = async () => {
    try {
      await axios.put(
        `${API}/products/${id}`,
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

      alert("Product updated successfully!");
      window.location.href = "/supplier/products";
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    }
  };

  if (loading) return <div>Loading product...</div>;

  return (
    <div className="edit-product">
      <h2>Edit Product</h2>

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
        placeholder="Image URLs (comma separated)"
        value={images.join(",")}
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

      <button className="save-btn" onClick={updateProduct}>
        Update Product
      </button>
    </div>
  );
}

export default SupplierEditProduct;
