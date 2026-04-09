import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/client";

const AdminAdForm = ({ mode }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [sourceType, setSourceType] = useState("cms");
  const [placement, setPlacement] = useState("checkout_ads");
  const [active, setActive] = useState(true);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const isEditing = mode === "edit";

  const placementOptions = {
    cms: [
      { value: "checkout_ads", label: "Checkout Ads" },
      { value: "mega_ads_left", label: "Mega Ads Left" },
      { value: "mega_ads_right", label: "Mega Ads Right" },
      { value: "scrolling_ads", label: "Scrolling Ads" }
    ],
    legacy: [{ value: "public_ads", label: "Public Ads" }],
    featured: [
      { value: "featured_mega", label: "Featured Mega" },
      { value: "featured_scroll", label: "Featured Scroll" }
    ]
  };

  // Load ad if in edit mode
  useEffect(() => {
    if (mode === "edit") {
      api.get(`/admin/ads/${id}`)
        .then((res) => res.data)
        .then(ad => {
          setTitle(ad.title || ad.name || "");
          setTargetUrl(ad.link || ad.targetUrl || "");
          setSourceType(ad.sourceType || "cms");
          if (ad.sourceType === "featured" && (ad.placement === "mega" || ad.placement === "scroll")) {
            setPlacement(ad.placement === "scroll" ? "featured_scroll" : "featured_mega");
          } else {
            setPlacement(ad.placement || "checkout_ads");
          }
          setActive(Object.prototype.hasOwnProperty.call(ad, "active") ? Boolean(ad.active) : true);
          setText(ad.text || "");
          const imageUrl = ad.imageUrl || ad.image_url || ad.image || ad.url || ad.src;
          if (imageUrl) {
            setPreview(imageUrl);
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
    form.append("targetUrl", targetUrl);
    form.append("sourceType", sourceType);
    form.append("placement", placement);
    form.append("active", String(active));
    form.append("text", text);
    if (image) form.append("image", image);

    try {
      if (mode === "edit") {
        await api.put(`/admin/ads/${id}`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/admin/ads", form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      navigate("/admin/ads");
    } catch (_err) {
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
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="border p-2"
        />

        <textarea
          placeholder="Optional helper text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border p-2 min-h-24"
        />

        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="border p-2"
          disabled={isEditing}
        >
          <option value="cms">CMS Advertisement</option>
          <option value="legacy">Legacy/Public Advertisement</option>
          <option value="featured">Featured Advertisement</option>
        </select>

        <select
          value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="border p-2"
        >
          {(placementOptions[sourceType] || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isEditing ? (
          <div className="text-xs text-gray-500">
            Source type stays locked while editing so the existing ad record remains connected to the live placement.
          </div>
        ) : null}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const nextFile = e.target.files?.[0];
            setImage(nextFile || null);
            if (nextFile) {
              setPreview(URL.createObjectURL(nextFile));
            }
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



