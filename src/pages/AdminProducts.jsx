import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { API_BASE } from "../api/client";

const AdminProductsList = () => {
  const { adminToken } = useAdminAuth();
  const [products, setProducts] = useState([]);

  const loadProducts = () => {
    fetch(`${API_BASE}/admin/products`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((res) => res.json())
      .then(setProducts);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (res.ok) loadProducts();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Products</h1>

      <Link
        to="/admin/products/new"
        className="bg-blue-600 text-white px-4 py-2 rounded mb-5 inline-block"
      >
        ? Add Product
      </Link>

      <table className="w-full border mt-4">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Image</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">?{p.price}</td>
              <td className="border p-2">{p.stock}</td>
              <td className="border p-2">
                {p.image_url && (
                  <img
                    src={`${p.image_url}`}
                    className="w-20"
                  />
                )}
              </td>
              <td className="border p-2">
                <Link
                  to={`/admin/products/${p.id}/edit`}
                  className="text-blue-600 mr-3"
                >
                  Edit
                </Link>

                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminProductsList;
