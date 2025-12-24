import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SupplierCompare() {
  const [suppliers, setSuppliers] = useState([]);
  const [selected, setSelected] = useState([]); // multiple selection
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const res = await axios.get("/api/admin/suppliers/list");
    setSuppliers(res.data.suppliers);
  };

  const toggleSupplier = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const loadComparison = async () => {
    if (selected.length === 0) return;

    const res = await axios.post("/api/admin/suppliers/compare-multi", {
      supplier_ids: selected,
    });

    setData(res.data.data);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Compare Multiple Suppliers</h1>

      {/* Supplier Multi-Select */}
      <div className="bg-white shadow p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Select suppliers to compare:</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {suppliers.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={() => toggleSupplier(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>

        <button
          onClick={loadComparison}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Compare Selected Suppliers
        </button>
      </div>

      {/* Comparison Table */}
      {data.length > 0 && (
        <>
          <ComparisonTable data={data} />
        </>
      )}
    </div>
  );
}

/* Comparison Table */
function ComparisonTable({ data }) {
  const kpIs = [
    { key: "revenue", label: "Revenue (₹)" },
    { key: "ordersCount", label: "Orders" },
    { key: "fulfillmentRate", label: "Fulfillment %" },
    { key: "ontimeRate", label: "On-Time %" },
    { key: "avgDeliveryTime", label: "Avg Delivery (Days)" },
    { key: "score", label: "Score" },
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">KPI</th>
            {data.map((s) => (
              <th key={s.supplier_id} className="p-3 text-left">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {kpIs.map((kpi) => (
            <tr key={kpi.key} className="border-b">
              <td className="p-3 font-semibold">{kpi.label}</td>

              {data.map((s) => (
                <td key={s.supplier_id} className="p-3">
                  {formatKPI(s[kpi.key], kpi.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
{data.length > 0 && (
  <AISummary data={data} />
)}


function formatKPI(value, key) {
  if (key.includes("Rate")) return (value * 100).toFixed(1) + "%";
  if (key === "revenue") return "₹" + value.toLocaleString();
  if (key === "avgDeliveryTime")
    return value ? value.toFixed(2) : "N/A";
  return value;
}
