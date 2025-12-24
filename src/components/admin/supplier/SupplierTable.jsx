export function SupplierTable({ rankings }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Supplier Rankings</h2>

      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Supplier</th>
            <th className="p-3 text-left">Revenue</th>
            <th className="p-3 text-left">Orders</th>
            <th className="p-3 text-left">Fulfillment</th>
            <th className="p-3 text-left">On-Time</th>
            <th className="p-3 text-left">Score</th>
          </tr>
        </thead>
<td className="p-3 font-semibold text-blue-600 cursor-pointer">
  <a href={`/admin/supplier/${s.supplier_id}`}>
    {s.name || "Unknown"}
  </a>
</td>


        <tbody>
          {rankings.map((s, i) => (
            <tr key={s.supplier_id} className="border-b hover:bg-gray-50">
              <td className="p-3">{i + 1}</td>
              <td className="p-3 font-semibold">{s.name || "Unknown"}</td>
              <td className="p-3">₹{s.revenue.toLocaleString()}</td>
              <td className="p-3">{s.ordersCount}</td>
              <td className="p-3">{(s.fulfillmentRate * 100).toFixed(1)}%</td>
              <td className="p-3">{(s.ontimeRate * 100).toFixed(1)}%</td>
              <td className="p-3 font-bold">{s.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
