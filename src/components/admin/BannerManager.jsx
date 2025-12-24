import React, { useEffect, useState } from "react";
import axios from "axios";

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    const res = await axios.get("/api/admin/cms/banners");
    setBanners(res.data.data || []);
  }

  async function uploadBanner() {
    if (!image) return alert("Select an image");

    const form = new FormData();
    form.append("image", image);
    form.append("link", link);

    await axios.post("/api/admin/cms/banners", form);
    setImage(null);
    setLink("");
    loadBanners();
  }

  async function deleteBanner(id) {
    if (!window.confirm("Delete this banner?")) return;

    await axios.delete(`/api/admin/cms/banners/${id}`);
    loadBanners();
  }

  return (
    <div className="p-4 border rounded bg-white shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Banner Manager</h2>

      {/* Upload Section */}
      <div className="flex gap-4 items-center mb-6">
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Banner link"
          className="border p-2 rounded w-64"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={uploadBanner}
        >
          Upload
        </button>
      </div>

      {/* Banner List */}
      <div className="grid grid-cols-3 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="border rounded p-2 shadow">
            <img
              src={`/uploads/${b.image}`}
              className="w-full h-32 object-cover rounded"
            />
            <p className="text-sm text-gray-600 mt-2">{b.link}</p>
            <button
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
              onClick={() => deleteBanner(b.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
