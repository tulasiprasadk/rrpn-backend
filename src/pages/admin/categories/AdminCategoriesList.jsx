import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/client";

const AdminCategoriesList = () => {
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      let list = Array.isArray(res.data) ? res.data : res.data?.categories || [];
      if (list.length === 0) {
        const fallback = await api.get("/categories");
        list = Array.isArray(fallback.data) ? fallback.data : [];
      }
      setCategories(list);
    } catch (err) {
      console.error("Failed to load categories", err);
      try {
        const fallback = await api.get("/categories");
        setCategories(Array.isArray(fallback.data) ? fallback.data : []);
      } catch (fallbackErr) {
        console.error("Fallback category load failed", fallbackErr);
        setCategories([]);
      }
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await api.delete(`/admin/categories/${id}`);
      loadCategories();
    } catch (err) {
      console.error("Delete category failed", err);
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
        Add Category
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
          {categories.map((category) => (
            <tr key={category.id}>
              <td className="border p-2">{category.id}</td>
              <td className="border p-2">{category.name}</td>
              <td className="border p-2">
                <Link
                  to={`/admin/categories/${category.id}/edit`}
                  className="text-blue-600 mr-3"
                >
                  Edit
                </Link>
                <button
                  onClick={() => deleteCategory(category.id)}
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
