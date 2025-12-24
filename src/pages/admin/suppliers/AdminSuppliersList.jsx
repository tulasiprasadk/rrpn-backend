import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminSuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const res = await axios.get("/api/suppliers"); 
      setSuppliers(res.data?.data || res.data || []);
      console.log("Suppliers loaded:", res.data);
    } catch (err) {
      console.error("Error loading suppliers", err);
    }
  }

  async function approveSupplier(id) {
    try {
      await axios.post(`/api/suppliers/${id}/approve`);
      alert("Supplier approved!");
      fetchSuppliers();
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve supplier");
    }
  }

  async function rejectSupplier(id) {
    const reason = prompt("Rejection reason (optional):");
    try {
      await axios.post(`/api/suppliers/${id}/reject`, { reason });
      alert("Supplier rejected");
      fetchSuppliers();
    } catch (err) {
      console.error("Reject failed:", err);
      alert("Failed to reject supplier");
    }
  }

  async function deleteSupplier(id) {
    if (!confirm("Delete this supplier?")) return;
    try {
      await axios.delete(`/api/admin/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const filtered = suppliers.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Suppliers</h1>

      <input
        className="border p-2 mb-3 w-full"
        placeholder="Search suppliers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((sup) => (
            <tr key={sup.id}>
              <td className="p-2 border">{sup.id}</td>
              <td className="p-2 border">{sup.name}</td>
              <td className="p-2 border">{sup.email}</td>
              <td className="p-2 border">{sup.phone}</td>
              <td className="p-2 border">
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: sup.status === 'approved' ? '#d4edda' : sup.status === 'pending' ? '#fff3cd' : '#f8d7da',
                  color: sup.status === 'approved' ? '#155724' : sup.status === 'pending' ? '#856404' : '#721c24'
                }}>
                  {sup.status}
                </span>
              </td>
              <td className="p-2 border space-x-2">
                {sup.status === 'pending' && (
                  <>
                    <button
                      className="px-2 py-1 bg-green-500 text-white rounded"
                      onClick={() => approveSupplier(sup.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => rejectSupplier(sup.id)}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={() => navigate(`/admin/suppliers/${sup.id}`)}
                >
                  View
                </button>

                <button
                  className="px-2 py-1 bg-gray-500 text-white rounded"
                  onClick={() => deleteSupplier(sup.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="6" className="p-3 text-center text-gray-500">
                No suppliers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
