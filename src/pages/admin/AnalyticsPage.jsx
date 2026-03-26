import { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../../api/client";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [orders, setOrders] = useState([]);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats").catch(() => ({ data: null })),
      api.get("/admin/charts/revenue").catch(() => ({ data: [] })),
      api.get("/admin/charts/orders").catch(() => ({ data: [] })),
      api.get("/admin/analytics/visits").catch(() => ({ data: { visits: 0 } }))
    ]).then(([statsRes, revenueRes, ordersRes, visitsRes]) => {
      setStats(statsRes.data);
      setRevenue(Array.isArray(revenueRes.data) ? revenueRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setVisits(Number(visitsRes.data?.visits || 0));
    });
  }, []);

  if (!stats) {
    return <div>Loading analytics...</div>;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Website Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 shadow rounded">
          <h2 className="text-lg font-semibold">Site Visits</h2>
          <p className="text-3xl font-bold mt-2">{visits}</p>
        </div>
        <div className="bg-white p-5 shadow rounded">
          <h2 className="text-lg font-semibold">Orders</h2>
          <p className="text-3xl font-bold mt-2">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white p-5 shadow rounded">
          <h2 className="text-lg font-semibold">Revenue</h2>
          <p className="text-3xl font-bold mt-2">Rs {stats.totalRevenue || 0}</p>
        </div>
        <div className="bg-white p-5 shadow rounded">
          <h2 className="text-lg font-semibold">Customers</h2>
          <p className="text-3xl font-bold mt-2">{stats.totalCustomers || 0}</p>
        </div>
      </div>

      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Monthly Revenue</h2>
        <Line
          data={{
            labels: revenue.map((item) => `${months[(Number(item.month) || 1) - 1]} ${item.year || ""}`.trim()),
            datasets: [
              {
                label: "Revenue",
                data: revenue.map((item) => item.total || 0),
                borderColor: "#007bff",
                backgroundColor: "rgba(0,123,255,0.3)",
              }
            ]
          }}
        />
      </div>

      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Orders Per Month</h2>
        <Bar
          data={{
            labels: orders.map((item) => `${months[(Number(item.month) || 1) - 1]} ${item.year || ""}`.trim()),
            datasets: [
              {
                label: "Orders",
                data: orders.map((item) => item.count || 0),
                backgroundColor: "rgba(255, 99, 132, 0.6)"
              }
            ]
          }}
        />
      </div>

      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Business Mix</h2>
        <Pie
          data={{
            labels: ["Suppliers", "Products", "Advertisements", "Pending Suppliers"],
            datasets: [
              {
                data: [
                  stats.totalSuppliers || 0,
                  stats.totalProducts || 0,
                  stats.totalAds || 0,
                  stats.pendingSuppliers || 0
                ],
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]
              }
            ]
          }}
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;
