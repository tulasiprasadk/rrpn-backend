import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/client";
import ProductSuppliers from "./ProductSuppliers";
import "./AdminProductsList.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const AdminProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managingProductId, setManagingProductId] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/products");
      const list = Array.isArray(res.data) ? res.data : res.data?.products || [];
      setProducts(list);
      setPriceDrafts(
        list.reduce((acc, product) => {
          acc[product.id] = product.price ?? "";
          return acc;
        }, {})
      );
    } catch (err) {
      console.error("Failed to load products", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const haystack = [
        product.title,
        product.variety,
        product.subVariety,
        product.Category?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [products, search]);

  const setDraftPrice = (id, value) => {
    setPriceDrafts((current) => ({ ...current, [id]: value }));
  };

  const savePrice = async (id) => {
    const nextPrice = Number.parseFloat(priceDrafts[id]);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      alert("Enter a valid non-negative price");
      return;
    }

    try {
      setSavingId(id);
      await api.patch(`/admin/products/${id}/price`, { price: nextPrice });
      setProducts((current) =>
        current.map((product) =>
          product.id === id ? { ...product, price: nextPrice } : product
        )
      );
    } catch (err) {
      console.error("Failed to update price", err);
      alert(err?.response?.data?.error || "Failed to update price");
    } finally {
      setSavingId(null);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await api.delete(`/admin/products/${id}`);
      loadProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product");
    }
  };

  return (
    <div style={{ padding: 20, background: "#ffd600", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, color: "#333" }}>
        Product Catalog and Price Desk
      </h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Link to="/admin/products/bulk" className="admin-button primary">
          Bulk Catalog and Price Update
        </Link>
        <Link
          to="/admin/products/new"
          className="admin-button"
          style={{
            background: "#28a745",
            color: "white",
            padding: "8px 12px",
            borderRadius: 6,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          Add Product
        </Link>
        <input
          type="search"
          placeholder="Search product, variety, category"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            minWidth: 280,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d8b400"
          }}
        />
      </div>

      <div
        style={{
          background: "#fff8d1",
          border: "1px solid #f0cc4f",
          borderRadius: 10,
          padding: 14,
          marginBottom: 18,
          color: "#5f4a00"
        }}
      >
        Use the inline price box to update one product quickly. Use Bulk Catalog and Price Update when market prices change for many products together.
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <div style={{ background: "white", padding: 40, borderRadius: 8, textAlign: "center" }}>
          <p style={{ fontSize: 18, color: "#666" }}>No matching products found.</p>
          <Link to="/admin/products/bulk" className="admin-button primary" style={{ marginTop: 20, display: "inline-block" }}>
            Go to Bulk Upload
          </Link>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 8, overflow: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead style={{ background: "#e31e24", color: "white" }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left" }}>ID</th>
                <th style={{ padding: 12, textAlign: "left" }}>Title</th>
                <th style={{ padding: 12, textAlign: "left" }}>Variety</th>
                <th style={{ padding: 12, textAlign: "left" }}>Sub-Variety</th>
                <th style={{ padding: 12, textAlign: "left" }}>Current Price</th>
                <th style={{ padding: 12, textAlign: "left" }}>Quick Price Update</th>
                <th style={{ padding: 12, textAlign: "left" }}>Unit</th>
                <th style={{ padding: 12, textAlign: "left" }}>Category</th>
                <th style={{ padding: 12, textAlign: "left" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} style={{ background: index % 2 === 0 ? "#f9f9f9" : "white" }}>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{product.id}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 600 }}>{product.title}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{product.variety || "-"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{product.subVariety || "-"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{formatCurrency(product.price)}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={priceDrafts[product.id] ?? ""}
                        onChange={(event) => setDraftPrice(product.id, event.target.value)}
                        style={{ width: 120, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                      />
                      <button
                        onClick={() => savePrice(product.id)}
                        disabled={savingId === product.id}
                        style={{
                          background: savingId === product.id ? "#9ca3af" : "#1f7a1f",
                          color: "white",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: 6,
                          cursor: savingId === product.id ? "not-allowed" : "pointer"
                        }}
                      >
                        {savingId === product.id ? "Saving..." : "Save Price"}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{product.unit || "-"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>{product.Category?.name || "-"}</td>
                  <td style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="admin-button"
                        style={{
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          textDecoration: "none"
                        }}
                      >
                        Full Edit
                      </Link>
                      <button
                        onClick={() => setManagingProductId(product.id)}
                        style={{
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 4,
                          cursor: "pointer"
                        }}
                      >
                        Suppliers
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        style={{
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 4,
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {managingProductId && (
        <ProductSuppliers
          productId={managingProductId}
          onClose={() => setManagingProductId(null)}
        />
      )}
    </div>
  );
};

export default AdminProductsList;
