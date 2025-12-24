import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import ProductSuppliers from "./ProductSuppliers";
import "./AdminProductsList.css";

const AdminProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managingProductId, setManagingProductId] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/products");
      setProducts(res.data);
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

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await axios.delete(`/api/products/${id}`, {
        withCredentials: true
      });
      loadProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product");
    }
  };

  return (
    <div style={{ padding: '20px', background: '#ffd600', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>All Products</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Link
          to="/admin/products/bulk"
          className="admin-button primary"
        >
          📊 Bulk Upload
        </Link>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>No products found. Upload some products using bulk upload!</p>
          <Link to="/admin/products/bulk" className="admin-button primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            📊 Go to Bulk Upload
          </Link>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#e31e24', color: 'white' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Variety</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Sub-Variety</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Unit</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p, index) => (
                <tr key={p.id} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.title}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.variety || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.subVariety || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>₹{p.price}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.unit}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{p.Category?.name || '-'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setManagingProductId(p.id)}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        👥 Suppliers
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Suppliers Modal */}
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
