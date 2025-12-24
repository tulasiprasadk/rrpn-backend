import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

export default function SupplierDetail() {
  const { id } = useParams(); // supplier_id from URL
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const res = await axios.get(`/api/admin/suppliers/${id}/detail`);
      setSupplier(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!supplier) return <div className="p-6">Supplier not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <Link className="text-blue-500" to="/admin/supplier-performance">
        ← Back to Supplier Performance
      </Link>

      <h1 className="text-3xl font-bold">{supplier.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Revenue" value={`₹${supplier.revenue.toLocaleString()}`} />
        <Card title="Orders" value={supplier.ordersCount} />
        <Card title="Score" value={supplier.score} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend" data={supplier.revenueHistory} />
        <ChartCard title="Fulfillment Trend" data={supplier.fulfillmentHistory} />
      </div>

      <ItemsSold items={supplier.itemsSold} />
      <OrdersList orders={supplier.orders} />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

function ChartCard({ title, data }) {
  if (!data?.labels?.length) return null;

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      {/* You can use Bar/Line chart here */}
      <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function ItemsSold({ items }) {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h3 className="text-xl font-bold mb-4">Items Sold</h3>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Qty Sold</th>
            <th className="p-2 text-left">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">{i.name}</td>
              <td className="p-2">{i.qty}</td>
              <td className="p-2">₹{i.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersList({ orders }) {
  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h3 className="text-xl font-bold mb-4">Orders</h3>

      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Order ID</th>
            <th className="p-2">Date</th>
            <th className="p-2">Status</th>
            <th className="p-2">Revenue</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o, idx) => (
            <tr key={idx} className="border-b">
              <td className="p-2">{o.id}</td>
              <td className="p-2">{o.created_at}</td>
              <td className="p-2">{o.status}</td>
              <td className="p-2">₹{o.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
