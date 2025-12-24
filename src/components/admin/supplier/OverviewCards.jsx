export function OverviewCards({ rankings }) {
  const totalSuppliers = rankings.length;

  const avgScore =
    rankings.reduce((s, x) => s + x.score, 0) / (rankings.length || 1);

  const totalRevenue = rankings.reduce((s, x) => s + x.revenue, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Total Suppliers" value={totalSuppliers} />
      <Card title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
      <Card title="Average Score" value={avgScore.toFixed(2)} />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}
