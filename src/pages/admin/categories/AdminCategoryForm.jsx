import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/client";

const AdminCategoryForm = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");

  useEffect(() => {
    if (mode === "edit") {
      api
        .get(`/admin/categories/${id}`)
        .then((res) => setName(res.data?.name || ""))
        .catch((err) => console.error("Failed to load category", err));
    }
  }, [mode, id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (mode === "edit") {
        await api.put(`/admin/categories/${id}`, { name });
      } else {
        await api.post("/admin/categories", { name });
      }
      navigate("/admin/categories");
    } catch (err) {
      console.error("Failed to save category", err);
      alert(err.response?.data?.error || "Failed to save category");
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
          onChange={(event) => setName(event.target.value)}
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
