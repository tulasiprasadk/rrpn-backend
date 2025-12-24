import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import SupplierPerformanceTab from "./SupplierPerformanceTab";
import BulkUpload from "../../../components/admin/products/BulkUpload";

export default function AdminSupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========= PRODUCTS STATE =========
  const [products, setProducts] = useState([]);

  // for tabs
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadSupplier();
  }, [id]);

  async function loadSupplier() {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/suppliers/${id}`);
      // some endpoints return { data: ... } while others return direct object
      setSupplier(res.data?.data || res.data);
    } catch (err) {
      console.error("Error fetching supplier", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplierProducts() {
    try {
      const res = await axios.get(`/api/admin/suppliers/${id}/products`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error loading products", err);
      setProducts([]);
    }
  }

  useEffect(() => {
    if (id) loadSupplierProducts();
  }, [id]);

  async function updateStatus(newStatus) {
    try {
      // Prefer explicit endpoints if backend exposes them
      if (newStatus === "approved") {
        await axios.put(`/api/admin/suppliers/${id}/verify`);
      } else if (newStatus === "rejected") {
        await axios.put(`/api/admin/suppliers/${id}/reject`);
      } else {
        // fallback: send generic update if exists server-side
        await axios.put(`/api/admin/suppliers/${id}`, { status: newStatus });
      }
      await loadSupplier(); // refresh supplier data
    } catch (err) {
      console.error("Status update failed", err);
    }
  }

  async function deleteSupplier() {
    if (!confirm("Do you really want to delete this supplier?")) return;
    try {
      await axios.delete(`/api/admin/suppliers/${id}`);
      navigate("/admin/suppliers");
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  if (loading) {
    return <div className="p-4">Loading supplier details...</div>;
  }

  if (!supplier) {
    return (
      <div className="p-4">
        <button className="admin-button outline" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <p className="mt-4">Supplier not found.</p>
      </div>
    );
  }

  const canApprove = supplier.status === "pending";

  return (
    <div className="p-4">
      <button className="admin-button outline" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className="text-xl font-semibold mt-4">{supplier.name}</h1>
      <p className="text-sm text-gray-500">Supplier ID: {supplier.id}</p>

      {/* Overview Cards */}
      <div className="admin-grid mt-4">
        <div className="admin-card">
          <div className="admin-card-title">Owner Name</div>
          <div className="admin-card-value">{supplier.ownerName || "N/A"}</div>
          <div className="text-sm mt-1">Phone: {supplier.phone}</div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Status</div>

          <span className={`admin-badge ${supplier.status}`}>
            {supplier.status}
          </span>

          <div className="text-sm mt-2">
            Products listed: <b>{supplier.productsCount || products.length || 0}</b>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">Store Address</div>
          <div className="text-sm">{supplier.address || "No address added"}</div>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div className="border-b mt-6 flex gap-6">
        <button
          className={`pb-2 ${activeTab === "overview" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        <button
          className={`pb-2 ${activeTab === "performance" ? "border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("performance")}
        >
          Performance
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="mt-4">
          <p>This is the supplier overview section.</p>
        </div>
      )}

      {activeTab === "performance" && <SupplierPerformanceTab supplierId={id} />}

      {/* STATUS ACTIONS */}
      {canApprove && (
        <div className="mt-6">
          <div className="admin-card-title mb-2">Actions</div>
          <div className="admin-form-actions">
            <button className="admin-button primary" onClick={() => updateStatus("approved")}>
              Approve Supplier
            </button>

            <button className="admin-button" onClick={() => updateStatus("rejected")}>
              Reject Supplier
            </button>
          </div>
        </div>
      )}

      {/* DELETE */}
      <button className="admin-button mt-6 bg-red-600 text-white" onClick={deleteSupplier}>
        Delete Supplier
      </button>

      {/* ================= PRODUCTS SECTION ================= */}
      <div className="mt-10 p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Products ({products.length})</h2>
          <div className="flex gap-2">
            <button className="admin-button" onClick={loadSupplierProducts}>
              Refresh products
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-gray-500">No products found for this supplier.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Title</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Service</th>
                  <th className="p-2 border">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{p.title}</td>
                    <td className="p-2 border">₹{p.price}</td>
                    <td className="p-2 border">{p.isService ? "Yes" : "No"}</td>
                    <td className="p-2 border">{p.deliveryAvailable ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= BULK UPLOAD SECTION ================= */}
      <div className="mt-10 p-4 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Bulk Upload Products</h2>
        <BulkUpload supplierId={id} />
        <div className="mt-4">
          <button
            className="admin-button"
            onClick={() => {
              // reload products after admin uses BulkUpload -> save
              // manual refresh is provided; call loader to be safe
              loadSupplierProducts();
            }}
          >
            Refresh products after upload
          </button>
        </div>
      </div>
    </div>
  );
}
