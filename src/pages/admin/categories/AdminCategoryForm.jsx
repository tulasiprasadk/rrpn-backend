import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

const AdminCategoryForm = ({ mode }) => {
  const { adminToken } = useAdminAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");

  useEffect(() => {
    if (mode === "edit") {
      fetch(`/api/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => res.json())
        .then((data) => setName(data.name))
        .catch((err) => console.error("Failed to load category", err));
    }
  }, [mode, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = mode === "edit" ? "PUT" : "POST";
    const url =
      mode === "edit"
        ? `/api/admin/categories/${id}`
        : "/api/admin/categories";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      navigate("/admin/categories");
    } else {
      alert("Failed to save category");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">
        {mode === "edit" ? "Edit Category" : "Add Category"}
      </h1>

      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Category Name"
          className="border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          {mode === "edit" ? "Update Category" : "Create Category"}
        </button>
      </form>
    </div>
  );
};

export default AdminCategoryForm;
