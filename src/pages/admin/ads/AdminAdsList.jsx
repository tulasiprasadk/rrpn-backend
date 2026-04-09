import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/client";

const normalizeAds = (items, source, startingIndex = 0) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    id: item.id || `${source}-${startingIndex + index + 1}`,
    title: item.title || item.name || item.text || `${source} ${startingIndex + index + 1}`,
    imageUrl: item.imageUrl || item.image_url || item.image || item.url || item.src || "",
    targetUrl: item.targetUrl || item.link || item.href || "",
    sourceType: item.sourceType || source,
    placement: item.placement || item.type || "",
    active: Object.prototype.hasOwnProperty.call(item, "active") ? Boolean(item.active) : true,
    text: item.text || ""
  }));

const placementLabels = {
  checkout_ads: "Checkout Ads",
  mega_ads_left: "Mega Ads Left",
  mega_ads_right: "Mega Ads Right",
  scrolling_ads: "Scrolling Ads",
  public_ads: "Public Ads",
  featured_mega: "Featured Mega",
  featured_scroll: "Featured Scroll",
  mega: "Featured Mega",
  scroll: "Featured Scroll"
};

const AdminAdsList = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSeededDefaults, setHasSeededDefaults] = useState(false);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/ads");
      const normalized = normalizeAds(res.data, "advertisements");

      if (normalized.length === 0 && !hasSeededDefaults) {
        await api.post("/admin/ads/seed-defaults");
        setHasSeededDefaults(true);
        const retry = await api.get("/admin/ads");
        setAds(normalizeAds(retry.data, "advertisements"));
        return;
      }

      setAds(normalized);
    } catch (err) {
      console.error("Failed loading ads:", err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [hasSeededDefaults]);

  const deleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    try {
      await api.delete(`/admin/ads/${encodeURIComponent(id)}`);
      loadAds();
    } catch (err) {
      console.error("Delete ad failed", err);
      alert("Failed to delete ad");
    }
  };

  const summary = useMemo(() => {
    return ads.reduce((acc, ad) => {
      const key = ad.placement || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [ads]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Advertisements</h1>

      <Link
        to="/admin/ads/new"
        className="bg-blue-600 text-white px-4 py-2 rounded inline-block mb-5"
      >
        Create New Ad
      </Link>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <div className="rounded bg-white px-3 py-2 shadow-sm">
          Total: <strong>{ads.length}</strong>
        </div>
        {Object.entries(summary).map(([placement, count]) => (
          <div key={placement} className="rounded bg-white px-3 py-2 shadow-sm">
            {placementLabels[placement] || placement}: <strong>{count}</strong>
          </div>
        ))}
      </div>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Ad</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Image</th>
            <th className="border p-2">Link</th>
            <th className="border p-2">Placement</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {ads.map((ad) => (
            <tr key={`${ad.source || "ad"}-${ad.id}`}>
              <td className="border p-2">
                <div className="font-medium">{ad.id}</div>
                <div className="text-xs text-gray-500">{ad.sourceType || "advertisement"}</div>
              </td>
              <td className="border p-2">
                <div>{ad.title || "Untitled"}</div>
                {ad.text ? <div className="text-xs text-gray-500">{ad.text}</div> : null}
              </td>
              <td className="border p-2">
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title || "ad"}
                    className="w-32 rounded"
                  />
                ) : (
                  "-"
                )}
              </td>
              <td className="border p-2">
                {ad.targetUrl ? (
                  <a
                    href={ad.targetUrl}
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
              <td className="border p-2">{placementLabels[ad.placement] || ad.placement || "-"}</td>
              <td className="border p-2">
                <span className={ad.active ? "text-green-700" : "text-red-700"}>
                  {ad.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="border p-2">
                <Link
                  to={`/admin/ads/${encodeURIComponent(ad.id)}/edit`}
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

          {!loading && ads.length === 0 && (
            <tr>
              <td className="border p-2 text-center" colSpan={7}>
                No advertisements found.
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td className="border p-2 text-center" colSpan={7}>
                Loading advertisements...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAdsList;
