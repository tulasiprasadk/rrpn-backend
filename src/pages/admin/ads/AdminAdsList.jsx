import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/client";
import { DEFAULT_ADMIN_ADS } from "../../../constants/defaultAds";

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
  const [usingFallback, setUsingFallback] = useState(false);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/ads");
      const normalized = normalizeAds(res.data?.data || res.data, "advertisements");
      if (normalized.length === 0) {
        setAds(DEFAULT_ADMIN_ADS);
        setUsingFallback(true);
      } else {
        setAds(normalized);
        setUsingFallback(false);
      }
    } catch (err) {
      console.error("Failed loading ads:", err);
      setAds(DEFAULT_ADMIN_ADS);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const deleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;

    if (String(id).startsWith("fallback:")) {
      alert("This ad is coming from the current site default set. Create a new ad to replace it, or we can finish the backend persistence path next.");
      return;
    }

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

      {usingFallback ? (
        <div className="mb-4 rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-900">
          Showing the current site default ads because the live stored ad inventory is still empty.
        </div>
      ) : null}

      <table className="w-full border" style={{ tableLayout: "fixed" }}>
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2" style={{ width: "18%" }}>Ad</th>
            <th className="border p-2" style={{ width: "20%" }}>Title</th>
            <th className="border p-2" style={{ width: "14%" }}>Image</th>
            <th className="border p-2" style={{ width: "12%" }}>Link</th>
            <th className="border p-2" style={{ width: "16%" }}>Placement</th>
            <th className="border p-2" style={{ width: "10%" }}>Status</th>
            <th className="border p-2" style={{ width: "10%" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {ads.map((ad) => (
            <tr key={`${ad.source || "ad"}-${ad.id}`}>
              <td className="border p-2">
                <div className="font-medium" style={{ wordBreak: "break-word", fontSize: 13 }}>{ad.id}</div>
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
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      display: "block",
                      background: "#fff"
                    }}
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
                  className={`mr-3 ${String(ad.id).startsWith("fallback:") ? "pointer-events-none text-gray-400" : "text-blue-600"}`}
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
