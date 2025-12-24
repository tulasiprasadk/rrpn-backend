import { useEffect, useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AnalyticsWidget = () => {
  const { adminToken } = useAdminAuth();
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    fetch("/api/admin/analytics/visits", {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => res.json())
      .then((data) => setVisits(data.visits))
      .catch(() => {});
  }, []);

  return (
    <div className="mt-6 p-3 bg-gray-900 text-white rounded-lg shadow-lg">
      <h3 className="text-sm font-semibold text-gray-300">Site Analytics</h3>

      <div className="mt-2">
        <p className="text-xl font-bold">{visits}</p>
        <p className="text-xs text-gray-400">Total Visits</p>
      </div>

      <button
        className="mt-3 w-full bg-blue-600 text-white py-1 rounded text-sm"
        onClick={() => (window.location.href = "/admin")}
      >
        View Dashboard
      </button>
    </div>
  );
};

export default AnalyticsWidget;
