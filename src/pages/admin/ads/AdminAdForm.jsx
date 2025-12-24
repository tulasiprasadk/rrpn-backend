import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminAuth } from "../../../context/AdminAuthContext";

const AdminAdForm = ({ mode }) => {
  const { adminToken } = useAdminAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState("");

  // Load ad if in edit mode
  useEffect(() => {
    if (mode === "edit") {
      fetch(`/api/admin/ads/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
        .then(res => res.json())
        .then(ad => {
          setTitle(ad.title);
          setLink(ad.link);
          if (ad.image_url) {
            setPreview(`${ad.image_url}`);
          }
        })
        .catch(err => console.error("Failed loading ad:", err));
    }
  }, [mode, id]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("title", title);
    form.append("link", link);
    if (image) form.append("image", image);

    const method = mode === "edit" ? "PUT" : "POST";
    const url =
      mode === "edit"
        ? `/api/admin/ads/${id}`
        : `/api/admin/ads`;

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: form,
    });

    if (res.ok) {
      navigate("/admin/ads");
    } else {
      alert("Failed to save advertisement");
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-5">
        {mode === "edit" ? "Edit Advertisement" : "Create New Advertisement"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96">
        <input
          type="text"
          placeholder="Ad Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2"
          required
        />

        <input
          type="text"
          placeholder="Optional Link (https://...)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="border p-2"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImage(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
          }}
          className="border p-2"
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="w-60 rounded shadow"
          />
        )}

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          {mode === "edit" ? "Update Ad" : "Create Ad"}
        </button>
      </form>
    </div>
  );
};

export default AdminAdForm;
