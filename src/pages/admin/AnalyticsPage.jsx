// FRONTEND FILE
// Path: frontend/src/pages/admin/AnalyticsPage.jsx

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

import { useAdminAuth } from "../../context/AdminAuthContext";

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
  const { adminToken } = useAdminAuth();

  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [pages, setPages] = useState([]);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${adminToken}` };

    fetch("/api/admin/analytics/daily", { headers })
      .then(res => res.json())
      .then(data => setDaily(data));

    fetch("/api/admin/analytics/monthly", { headers })
      .then(res => res.json())
      .then(data => setMonthly(data));

    fetch("/api/admin/analytics/pages", { headers })
      .then(res => res.json())
      .then(data => setPages(data));

    fetch("/api/admin/analytics/sources", { headers })
      .then(res => res.json())
      .then(data => setSources(data));

  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Website Analytics</h1>

      {/* DAILY CHART */}
      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Daily Visits</h2>
        <Line
          data={{
            labels: daily.map(d => d.day),
            datasets: [
              {
                label: "Visits",
                data: daily.map(d => d.count),
                borderColor: "#007bff",
                backgroundColor: "rgba(0,123,255,0.3)",
              }
            ]
          }}
        />
      </div>

      {/* MONTHLY CHART */}
      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Monthly Visits</h2>
        <Bar
          data={{
            labels: monthly.map(m => `Month ${m.month}`),
            datasets: [
              {
                label: "Visits",
                data: monthly.map(m => m.count),
                backgroundColor: "rgba(255, 99, 132, 0.6)"
              }
            ]
          }}
        />
      </div>

      {/* PAGE VIEWS */}
      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Page Views</h2>
        <Bar
          data={{
            labels: pages.map(p => p.page),
            datasets: [
              {
                label: "Views",
                data: pages.map(p => p.views),
                backgroundColor: "rgba(255,165,0,0.7)"
              }
            ]
          }}
        />
      </div>

      {/* TRAFFIC SOURCES PIE CHART */}
      <div className="bg-white p-5 shadow rounded mb-8">
        <h2 className="text-xl mb-3 font-semibold">Traffic Sources</h2>
        <Pie
          data={{
            labels: sources.map(s => s.source || "Unknown"),
            datasets: [
              {
                data: sources.map(s => s.count),
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
