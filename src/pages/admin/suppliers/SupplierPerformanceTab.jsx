import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function SupplierPerformanceTab({ supplierId }) {
  const { adminToken } = useAdminAuth();
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    async function loadStats() {
      const res = await fetch(`/api/admin/suppliers/stats/${supplierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      setKpis(data.kpis);
    }
    loadStats();
  }, [supplierId, adminToken]);

  if (!kpis) return "Loading...";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Stat label="Performance Score" value={kpis.score} />
      <Stat label="Total Orders" value={kpis.totalOrders} />
      <Stat label="Delivered Orders" value={kpis.deliveredOrders} />
      <Stat label="On-Time Delivery" value={`${kpis.onTimeDeliveryPercent}%`} />
      <Stat
        label="Avg Fulfillment Time"
        value={`${kpis.averageFulfillmentTimeHours} hrs`}
      />
      <Stat label="Revenue" value={`₹${kpis.totalRevenue}`} />
      <Stat
        label="Cancelled Orders"
        value={`${kpis.cancelledOrders} (${kpis.cancellationRatePercent}%)`}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
