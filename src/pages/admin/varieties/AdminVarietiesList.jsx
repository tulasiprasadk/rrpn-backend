// frontend/src/pages/admin/varieties/AdminVarietiesList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./AdminVarietiesList.css";

export default function AdminVarietiesList() {
  const [varieties, setVarieties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    loadVarieties();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadVarieties(selectedCategory);
    } else {
      loadVarieties();
    }
  }, [selectedCategory]);

  async function loadCategories() {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  async function loadVarieties(categoryId = null) {
    try {
      setLoading(true);
      const url = categoryId
        ? `/api/varieties/category/${categoryId}`
        : '/api/varieties';
      const res = await axios.get(url);
      setVarieties(res.data);
    } catch (err) {
      console.error('Error loading varieties:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteVariety(id) {
    if (!confirm('Are you sure you want to delete this variety?')) return;
    
    try {
      await axios.delete(`/api/varieties/${id}`);
      loadVarieties(selectedCategory);
      alert('Variety deleted successfully!');
    } catch (err) {
      console.error('Error deleting variety:', err);
      alert('Failed to delete variety');
    }
  }

  return (
    <div className="admin-varieties">
      <div className="varieties-header">
        <h1>🏷 Variety Management</h1>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/varieties/new')}
        >
          + Add New Variety
        </button>
      </div>

      <div className="varieties-filters">
        <label>Filter by Category:</label>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading varieties...</div>
      ) : varieties.length === 0 ? (
        <div className="empty-state">
          <p>No varieties found.</p>
          <button onClick={() => navigate('/admin/varieties/new')}>
            Add your first variety
          </button>
        </div>
      ) : (
        <div className="varieties-grid">
          {varieties.map(variety => (
            <div key={variety.id} className="variety-card">
              <div className="variety-header">
                <h3>{variety.name}</h3>
                {variety.Category && (
                  <span className="category-badge">
                    {variety.Category.icon} {variety.Category.name}
                  </span>
                )}
              </div>
              
              <div className="variety-body">
                <p className="sub-varieties-label">Sub-varieties:</p>
                <div className="sub-varieties-list">
                  {variety.subVarieties && variety.subVarieties.length > 0 ? (
                    variety.subVarieties.map((sub, idx) => (
                      <span key={idx} className="sub-variety-tag">{sub}</span>
                    ))
                  ) : (
                    <span className="no-subs">No sub-varieties</span>
                  )}
                </div>
                
                {variety.metadata && Object.keys(variety.metadata).length > 0 && (
                  <div className="variety-metadata">
                    {variety.metadata.units && (
                      <p><strong>Units:</strong> {variety.metadata.units.join(', ')}</p>
                    )}
                    {variety.metadata.priceRange && (
                      <p><strong>Price Range:</strong> ₹{variety.metadata.priceRange[0]} - ₹{variety.metadata.priceRange[1]}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="variety-actions">
                <button
                  className="btn-edit"
                  onClick={() => navigate(`/admin/varieties/edit/${variety.id}`)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => deleteVariety(variety.id)}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
