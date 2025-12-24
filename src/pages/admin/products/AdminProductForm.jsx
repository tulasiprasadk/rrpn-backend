import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

const AdminProductForm = ({ mode }) => {
  const { adminToken } = useAdminAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    categoryId: "",
    supplierId: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Load product when editing
  useEffect(() => {
    if (mode === "edit") {
      fetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setProduct({
            name: data.name ?? "",
            price: data.price ?? "",
            stock: data.stock ?? "",
            description: data.description ?? "",
            categoryId: data.categoryId ?? "",
            supplierId: data.supplierId ?? "",
          });
          if (data.image_url) {
            setPreview(`${data.image_url}`);
          }
        })
        .catch((err) => console.error("Failed to load product", err));
    }
  }, [mode, id]);

  const handleChange = (field) => (e) => {
    setProduct({ ...product, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    Object.entries(product).forEach(([key, value]) =>
      form.append(key, value)
    );
    if (image) form.append("image", image);

    const method = mode === "edit" ? "PUT" : "POST";
    const url =
      mode === "edit"
        ? `/api/admin/products/${id}`
        : "/api/admin/products";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: form,
    });

    if (res.ok) {
      navigate("/admin/products");
    } else {
      alert("Failed to save product");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">
        {mode === "edit" ? "Edit Product" : "Add Product"}
      </h1>

      <form className="flex flex-col gap-4 w-96" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          className="border p-2"
          value={product.name}
          onChange={handleChange("name")}
          required
        />

        <input
          type="number"
          placeholder="Price"
          className="border p-2"
          value={product.price}
          onChange={handleChange("price")}
          required
        />

        <input
          type="number"
          placeholder="Stock"
          className="border p-2"
          value={product.stock}
          onChange={handleChange("stock")}
          required
        />

        <textarea
          placeholder="Description"
          className="border p-2"
          value={product.description}
          onChange={handleChange("description")}
        />

        {/* for now just raw IDs; later we can make dropdowns */}
        <input
          type="number"
          placeholder="Category ID"
          className="border p-2"
          value={product.categoryId}
          onChange={handleChange("categoryId")}
        />

        <input
          type="number"
          placeholder="Supplier ID"
          className="border p-2"
          value={product.supplierId}
          onChange={handleChange("supplierId")}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            setImage(file);
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />

        {preview && (
          <img src={preview} alt="Preview" className="w-40 rounded shadow" />
        )}

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          {mode === "edit" ? "Update Product" : "Create Product"}
        </button>
      </form>
    </div>
  );
};

export default AdminProductForm;
