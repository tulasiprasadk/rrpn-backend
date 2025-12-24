import React, { useEffect, useState } from "react";
import axios from "axios";
import SupplierFilterBar from "../../components/admin/supplier/SupplierFilterBar";
import OverviewCards from "../../components/admin/supplier/OverviewCards";
import SupplierTable from "../../components/admin/supplier/SupplierTable";
import PerformanceCharts from "../../components/admin/supplier/PerformanceCharts";

export default function SupplierPerformance() {
  const [rankings, setRankings] = useState([]);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    supplier_id: "all"
  });

  useEffect(() => {
    fetchKPIs();
  }, [filters]);

  const fetchKPIs = async () => {
    try {
      const res = await axios.get("/api/admin/suppliers/performance", {
        params: filters,
      });

      setRankings(res.data.data.rankings);
    } catch (err) {
      console.error(err);
    }
  };
<div className="flex gap-4 mb-4">
  <a
    href={`/api/admin/suppliers/export/csv?from=${filters.from}&to=${filters.to}&supplier_id=${filters.supplier_id}`}
    className="px-4 py-2 bg-blue-600 text-white rounded"
  >
    Export CSV
  </a>

  <a
    href={`/api/admin/suppliers/export/excel?from=${filters.from}&to=${filters.to}&supplier_id=${filters.supplier_id}`}
    className="px-4 py-2 bg-green-600 text-white rounded"
  >
    Export Excel
  </a>
</div>


  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Supplier Performance Dashboard</h1>

      <SupplierFilterBar filters={filters} setFilters={setFilters} />

      <OverviewCards rankings={rankings} />

      <SupplierTable rankings={rankings} />

      <PerformanceCharts rankings={rankings} />
    </div>
  );
}
