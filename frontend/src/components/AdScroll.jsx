import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../api/client";
import "./AdScroll.css";

export default function AdScroll() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
  axios
    .get(`${API_BASE}/ads`, { withCredentials: true })
    .then((res) => {
      if (!Array.isArray(res.data)) {
        setAds([]);
        return;
      }

      // ✅ automation rules
      const automatedAds = res.data
        .filter(
          (ad) =>
            ad.isActive !== false &&
            ad.position === "grid" &&
            ad.imageUrl
        )
        .slice(0, 5); // 🔒 max 5 ads

      setAds(automatedAds);
    })
    .catch((err) => {
      console.error("Failed to load ads:", err);
      setAds([]);
    });
}, []);

  // If still no ads, show nothing (expected)
  if (ads.length === 0) return null;

  return (
    <div className="ad-scroll-container">
      <div className="ad-track">
        {ads.map((ad) => (
          <div key={ad.id} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: 180 }}>
            <a
              href={ad.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              <img
                src={
                  ad.imageUrl.startsWith("/")
                    ? ad.imageUrl
                    : `/${ad.imageUrl}`
                }
                alt={ad.title || "Advertisement"}
                className="ad-banner"
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
