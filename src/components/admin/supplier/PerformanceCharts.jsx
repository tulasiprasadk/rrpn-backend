import { Bar, Line } from "react-chartjs-2";

export function PerformanceCharts({ rankings }) {
  const labels = rankings.map((s) => s.name || "Unknown");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-white shadow rounded-lg">
        <h3 className="text-lg font-bold mb-2">Revenue by Supplier</h3>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Revenue",
                data: rankings.map((s) => s.revenue),
              },
            ],
          }}
        />
      </div>

      <div className="p-6 bg-white shadow rounded-lg">
        <h3 className="text-lg font-bold mb-2">On-Time Delivery %</h3>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "On-Time %",
                data: rankings.map((s) => (s.ontimeRate * 100).toFixed(1)),
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
