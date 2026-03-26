import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/client";

const AdminAdsList = () => {
  const [ads, setAds] = useState([]);

  const loadAds = async () => {
    try {
      const res = await api.get("/admin/ads");
      let list = Array.isArray(res.data) ? res.data : [];
      if (list.length === 0) {
        const fallback = await api.get("/ads");
        list = Array.isArray(fallback.data) ? fallback.data : [];
      }
      setAds(list);
    } catch (err) {
      console.error("Failed loading ads:", err);
      try {
        const fallback = await api.get("/ads");
        setAds(Array.isArray(fallback.data) ? fallback.data : []);
      } catch (fallbackErr) {
        console.error("Fallback ads load failed", fallbackErr);
        setAds([]);
      }
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const deleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    try {
      await api.delete(`/admin/ads/${id}`);
      loadAds();
    } catch (err) {
      console.error("Delete ad failed", err);
      alert("Failed to delete ad");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Advertisements</h1>

      <Link
        to="/admin/ads/new"
        className="bg-blue-600 text-white px-4 py-2 rounded inline-block mb-5"
      >
        Create New Ad
      </Link>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Image</th>
            <th className="border p-2">Link</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {ads.map((ad) => (
            <tr key={`${ad.source || "ad"}-${ad.id}`}>
              <td className="border p-2">{ad.id}</td>
              <td className="border p-2">{ad.title || "Untitled"}</td>
              <td className="border p-2">
                {(ad.imageUrl || ad.image_url || ad.image || ad.url || ad.src) ? (
                  <img
                    src={ad.imageUrl || ad.image_url || ad.image || ad.url || ad.src}
                    alt={ad.title || "ad"}
                    className="w-32 rounded"
                  />
                ) : (
                  "-"
                )}
              </td>
              <td className="border p-2">
                {(ad.targetUrl || ad.link) ? (
                  <a
                    href={ad.targetUrl || ad.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    Visit
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="border p-2">
                <Link
                  to={`/admin/ads/${ad.id}/edit`}
                  className="text-blue-600 mr-3"
                >
                  Edit
                </Link>

                <button
                  onClick={() => deleteAd(ad.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {ads.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={5}>
                No advertisements found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAdsList;
