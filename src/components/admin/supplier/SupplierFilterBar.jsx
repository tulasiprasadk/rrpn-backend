import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SupplierFilterBar({ filters, setFilters }) {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const res = await axios.get("/api/admin/suppliers/list");
    setSuppliers(res.data.suppliers);
  };

  const applyQuickRange = (days) => {
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - days);

    setFilters({
      ...filters,
      from: from.toISOString().split("T")[0],
      to: today.toISOString().split("T")[0],
    });
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6 flex flex-wrap gap-4 items-center">

      {/* Date Range Selector */}
      <div className="flex gap-4 items-center">
        <label className="font-semibold text-sm">Date:</label>
        
        <button className="filter-btn" onClick={() => applyQuickRange(0)}>
          Today
        </button>
        <button className="filter-btn" onClick={() => applyQuickRange(7)}>
          Last 7 days
        </button>
        <button className="filter-btn" onClick={() => applyQuickRange(30)}>
          Last 30 days
        </button>

        <input
          type="date"
          value={filters.from}
          onChange={(e) =>
            setFilters({ ...filters, from: e.target.value })
          }
          className="border p-1 rounded"
        />

        <span>→</span>

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          className="border p-1 rounded"
        />
      </div>

      {/* Supplier Selector */}
      <div className="flex gap-2 items-center ml-auto">
        <label className="font-semibold text-sm">Supplier:</label>

        <select
          className="border p-2 rounded"
          value={filters.supplier_id}
          onChange={(e) =>
            setFilters({ ...filters, supplier_id: e.target.value })
          }
        >
          <option value="all">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}
