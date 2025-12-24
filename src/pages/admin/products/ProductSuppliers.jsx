import { useState, useEffect } from 'react';
import './ProductSuppliers.css';

function ProductSuppliers({ productId, onClose }) {
  const [suppliers, setSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    fetchProductSuppliers();
    fetchAllSuppliers();
  }, [productId]);

  const fetchProductSuppliers = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/products/${productId}/suppliers`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching product suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSuppliers = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        // Only show approved suppliers
        setAllSuppliers(data.filter(s => s.status === 'approved'));
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/admin/products/${productId}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          price: price || null,
          stock: stock || 0
        })
      });

      if (res.ok) {
        alert('Supplier assigned successfully');
        fetchProductSuppliers();
        setSelectedSupplier('');
        setPrice('');
        setStock('');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to assign supplier'}`);
      }
    } catch (error) {
      console.error('Error assigning supplier:', error);
      alert('Failed to assign supplier');
    }
  };

  const handleRemove = async (supplierId) => {
    if (!confirm('Remove this supplier from the product?')) return;

    try {
      const res = await fetch(
        `http://localhost:4000/api/admin/products/${productId}/suppliers/${supplierId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        alert('Supplier removed');
        fetchProductSuppliers();
      } else {
        alert('Failed to remove supplier');
      }
    } catch (error) {
      console.error('Error removing supplier:', error);
      alert('Failed to remove supplier');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Manage Product Suppliers</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Current Suppliers */}
            <div className="current-suppliers">
              <h3>Current Suppliers ({suppliers.length})</h3>
              {suppliers.length === 0 ? (
                <p className="no-suppliers">No suppliers assigned yet</p>
              ) : (
                <div className="suppliers-list">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="supplier-card">
                      <div className="supplier-info">
                        <strong>{supplier.name}</strong>
                        <span className="supplier-phone">{supplier.phone}</span>
                        {supplier.ProductSupplier?.price && (
                          <span className="supplier-price">
                            Price: ₹{supplier.ProductSupplier.price}
                          </span>
                        )}
                        {supplier.ProductSupplier?.stock !== undefined && (
                          <span className="supplier-stock">
                            Stock: {supplier.ProductSupplier.stock}
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemove(supplier.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Supplier */}
            <div className="add-supplier">
              <h3>Assign New Supplier</h3>
              <div className="form-group">
                <label>Supplier:</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select a supplier...</option>
                  {allSuppliers
                    .filter((s) => !suppliers.find((ps) => ps.id === s.id))
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.phone}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Custom Price (optional):</label>
                <input
                  type="number"
                  placeholder="Leave blank to use product price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Stock:</label>
                <input
                  type="number"
                  placeholder="Initial stock quantity"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <button className="btn-assign" onClick={handleAssign}>
                Assign Supplier
              </button>
            </div>
          </>
        )}

        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ProductSuppliers;
