import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SupplierProducts.css";

const API = "/api";

function SupplierProducts() {
  const [products, setProducts] = useState([]);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API}/products?supplier=true`, {
        withCredentials: true
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API}/products/${id}`, {
        withCredentials: true
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="supplier-products">
      <h2>Your Products</h2>
      <button
        className="add-btn"
        onClick={() => (window.location.href = "/supplier/products/add")}
      >
        + Add New Product
      </button>

      {products.map((p) => (
        <div key={p.id} className="product-card">
          <img src={p.image || '/placeholder.png'} alt={p.title ? `Product image of ${p.title}` : 'Product image'} loading="lazy" />
          <div className="info">
            <h3>{p.title}</h3>
            <p>Price: ₹{p.price}</p>
            <p>{p.description}</p>
          </div>

          <div className="actions">
            <button onClick={() => (window.location.href = `/supplier/products/${p.id}/edit`)}>
              Edit
            </button>
            <button className="del" onClick={() => deleteProduct(p.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SupplierProducts;
