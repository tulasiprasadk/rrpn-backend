import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./EditProduct.css";

export default function EditProduct() {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const res = await fetch(
        `/supplier/products/${productId}`
      );

      const data = await res.json();
      if (res.ok) setProduct(data.product);
    } catch (err) {
      console.error("Error loading product:", err);
    }
  };

  const saveChanges = async () => {
    setSaving(true);

    try {
      const res = await fetch(
        `/supplier/products/${productId}/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        alert(data.message);
        setSaving(false);
        return;
      }

      alert("Product Updated!");
      setSaving(false);
    } catch (err) {
      console.error(err);
      alert("Server Error");
      setSaving(false);
    }
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="ep-container">
      <h1>Edit Product</h1>

      <input
        value={product.name}
        onChange={(e) =>
          setProduct({ ...product, name: e.target.value })
        }
      />

      <input
        value={product.price}
        onChange={(e) =>
          setProduct({ ...product, price: e.target.value })
        }
      />

      <textarea
        value={product.description}
        onChange={(e) =>
          setProduct({ ...product, description: e.target.value })
        }
      />

      <button onClick={saveChanges}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
