import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

const AdminCategoriesList = () => {
  const { adminToken } = useAdminAuth();
  const [categories, setCategories] = useState([]);

  const loadCategories = () => {
    fetch("/api/admin/categories", {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories", err));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    const res = await fetch(
      `/api/admin/categories/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    if (res.ok) {
      loadCategories();
    } else {
      alert("Failed to delete category");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Categories</h1>

      <Link
        to="/admin/categories/new"
        className="bg-blue-600 text-white px-4 py-2 rounded inline-block mb-4"
      >
        ➕ Add Category
      </Link>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.id}</td>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">
                <Link
                  to={`/admin/categories/${c.id}/edit`}
                  className="text-blue-600 mr-3"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {categories.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={3}>
                No categories yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCategoriesList;
