// frontend/src/pages/Home.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { useQuickCart } from "../context/QuickCartContext";
import { API_BASE } from "../api/client";
import "./Home.css";

import ExploreItem from "../components/ExploreItem";
import DiscoverPopup from "../components/DiscoverPopup";
import MegaAd from "../components/MegaAd";
import AdScroll from "../components/AdScroll";

/* ================= HERO IMAGES ================= */
import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3 from "../assets/hero-3.jpg";

/* ================= FALLBACK CATEGORIES ================= */
const defaultCategories = [
  { id: 22, name: "Groceries", icon: "🛒", kannada: "ದಿನಸಿ ವಸ್ತುಗಳು" },
  { id: 29, name: "Flowers", icon: "🌸", kannada: "ಹೂವುಗಳು" },
  { id: 27, name: "Crackers", icon: "🎆", kannada: "ಪಟಾಕಿಗಳು" },
  { id: 28, name: "Pet services", icon: "🐾", kannada: "ಪಶು ಸೇವೆಗಳು" },
  { id: 24, name: "Local Services", icon: "🛠️", kannada: "ಸ್ಥಳೀಯ ಸೇವೆಗಳು" },
  { id: 25, name: "Consultancy", icon: "📑", kannada: "ಸಲಹಾ ಸೇವೆಗಳು" }
];

export default function Home() {
  const navigate = useNavigate();
  const { addItem } = useQuickCart();

  /* ================= SEARCH ================= */
  const [searchText, setSearchText] = useState("");

  /* ================= CORE STATE ================= */
const [products, setProducts] = useState([]);
const [categories, setCategories] = useState([]);
const [selectedDiscover, setSelectedDiscover] = useState(null);
const [popupAnchor, setPopupAnchor] = useState(null);

const categoriesReady = categories.length > 0;


  /* ================= HERO ================= */
  const heroImages = [hero1, hero2, hero3];
  const [heroIndex, setHeroIndex] = useState(0);

  /* ================= HERO ROTATION ================= */
  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => {
        if (Array.isArray(res.data)) setCategories(res.data);
      })
      .catch(() => setCategories(defaultCategories));

    axios
      .get(`${API_BASE}/products`)
      .then((res) => {
        if (Array.isArray(res.data)) setProducts(res.data);
      })
      .catch(() => setProducts([]));
  }, []);

  /* ================= HELPERS ================= */
  const productIcons = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.icon;
    });
    return map;
  }, [categories]);

  const getProductIcon = (product) => {
    if (product.icon) return product.icon;
    return productIcons[product.categoryId || product.category] || "🛍️";
  };

  const displayedProducts = products.slice(0, 12);

  /* ================= RENDER ================= */
  return (
    <>
      <main style={{ display: "flex", alignItems: "flex-start" }}>
        {/* LEFT SIDEBAR */}
        <aside style={{ marginRight: 24 }}>
          <MegaAd image="/ads/mega-left.png" position="left" />
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* HERO */}
          <section className="hero">
            <img src={heroImages[heroIndex]} alt="RR Nagar" />

            <div className="hero-text">
              <h1>ನಮ್ಮಿಂದ ನಿಮಗೆ — ನಿಮ್ಮಷ್ಟೇ ಹತ್ತಿರ</h1>
              <p>Shop local. Support local.</p>

              <div className="hero-search">
                <input
                  type="text"
                  placeholder="Search in RR Nagar"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchText.trim()) {
                      navigate(`/browse?q=${encodeURIComponent(searchText)}`);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (!searchText.trim()) return;
                    navigate(`/browse?q=${encodeURIComponent(searchText)}`);
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section className="section">
            <h2>Popular Categories</h2>
            <div
              className="cat-row"
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "nowrap",
                overflowX: "auto"
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cat-card"
                  onClick={() => navigate(`/browse?category=${cat.id}`)}
                  style={{ flex: "0 0 auto" }}
                >
                  <div className="cat-icon">{cat.icon || "🛍️"}</div>
                  <div className="cat-name">{cat.name}</div>
                </div>
              ))}
            </div>
          </section>

          <AdScroll />

          {/* ADS GRID */}
          <section className="ads-grid-section">
            <h2>What's New in RR Nagar!</h2>
            <div className="ads-grid">
              <div className="ad-item"><img src="/ads/rrnagar.jpg" alt="RR Nagar" /></div>
              <div className="ad-item"><img src="/ads/vchase.png" alt="V Chase" /></div>
              <div className="ad-item"><img src="/ads/ichase.jpg" alt="I Chase" /></div>
            </div>
          </section>

          {/* DISCOVER */}
          <section className="section">
            <h2>Discover Around You</h2>
            <div className="discover-scroll">
              <div className="discover-track">
                {[1, 2].map((_, i) => {
                  const ref1 = useRef();
                  const ref2 = useRef();
                  const ref3 = useRef();

                  return (
                    <React.Fragment key={i}>
                      <ExploreItem
                        icon="🛕"
                        title="Temples"
                        titleKannada="ದೇವಾಲಯಗಳು"
                        ref={ref1}
                        onClick={() => {
                          setSelectedDiscover({
                            icon: "🛕",
                            title: "Temples",
                            titleKannada: "ದೇವಾಲಯಗಳು",
                            longInfo:
                              "Temples in RR Nagar are peaceful places for worship."
                          });
                          setPopupAnchor(ref1);
                        }}
                      />
                      <ExploreItem
                        icon="🌳"
                        title="Parks"
                        titleKannada="ಉದ್ಯಾನಗಳು"
                        ref={ref2}
                        onClick={() => {
                          setSelectedDiscover({
                            icon: "🌳",
                            title: "Parks",
                            titleKannada: "ಉದ್ಯಾನಗಳು",
                            longInfo:
                              "RR Nagar parks are green spaces for relaxation."
                          });
                          setPopupAnchor(ref2);
                        }}
                      />
                      <ExploreItem
                        icon="💻"
                        title="IT Park"
                        titleKannada="ಐಟಿ ಪಾರ್ಕ್"
                        ref={ref3}
                        onClick={() => {
                          setSelectedDiscover({
                            icon: "💻",
                            title: "IT Park",
                            titleKannada: "ಐಟಿ ಪಾರ್ಕ್",
                            longInfo:
                              "IT Park has tech companies and startups."
                          });
                          setPopupAnchor(ref3);
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </section>

          {/* PRODUCTS */}
          <section className="section">
            <h2 className="section-title">Fresh Picks for You</h2>
            <div className="products-grid">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => addItem(product, 1)}
                >
                  <img
                    src={product.image || "/images/product-placeholder.png"}
                    alt={product.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/product-placeholder.png";
                    }}
                  />
                  <div style={{ fontSize: "2rem", margin: "8px 0", lineHeight: "1" }}>
  {categoriesReady ? getProductIcon(product) : null}
</div>

                  <h3>{product.title || "No Title"}</h3>
                  <p>₹{product.price ?? "--"}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside style={{ marginLeft: 24 }}>
          <MegaAd image="/ads/mega-right.png" position="right" />
        </aside>
      </main>

      <DiscoverPopup
        item={selectedDiscover}
        anchorRef={popupAnchor}
        onClose={() => {
          setSelectedDiscover(null);
          setPopupAnchor(null);
        }}
      />
    </>
  );
}
