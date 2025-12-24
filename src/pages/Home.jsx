// frontend/src/pages/Home.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  { id: 25, name: "Consultancy", icon: "📑", kannada: "ಸಲಹಾ ಸೇವೆಗಳು" },
];
];

export default function Home() {
  const navigate = useNavigate();

  /* ================= HERO ================= */
  const heroImages = [hero1, hero2, hero3];
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* ================= STATE ================= */
  const [categories, setCategories] = useState(defaultCategories);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ DISCOVER POPUP STATE (ONLY ONCE)
  const [selectedDiscover, setSelectedDiscover] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState(null);

  /* ================= LOAD CATEGORIES ================= */
  useEffect(() => {
    axios
      .get(`${API_BASE}/categories`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        setCategories(defaultCategories);
      });
  }, []);

  function handleSearchClick() {
// ...existing code...
    setHasSearched(true);
    if (!searchQuery.trim()) {
      setFilteredProducts(products.slice(0, 12));
    } else {
      const q = searchQuery.trim().toLowerCase();
      if (["flowers", "flower", "ಹೂವುಗಳು", "ಹೂವು"].includes(q)) {
        navigate("/flowers");
      } else if (["crackers", "cracker", "ಪಟಾಕಿಗಳು", "ಪಟಾಕಿ"].includes(q)) {
        navigate("/crackers");
      } else if (["groceries", "grocery", "ಕಿರಾಣಿ", "ಕಿರಾಣಿ ವಸ್ತುಗಳು"].includes(q)) {
        navigate("/groceries");
      } else if (["pet services", "pet", "pets", "ಪೆಟ್", "ಪೆಟ್ ಸೇವೆ"].includes(q)) {
        navigate("/petservices");
      } else if (["local services", "local", "services", "ಸ್ಥಳೀಯ", "ಸ್ಥಳೀಯ ಸೇವೆಗಳು"].includes(q)) {
        navigate("/localservices");
      } else if (["consultancy", "consultant", "consulting", "ಸಲಹಾ", "ಸಲಹಾ ಸೇವೆಗಳು"].includes(q)) {
        navigate("/consultancy");
      } else {
        navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
      }
    }
// ...existing code...
    if (!searchQuery.trim()) return;
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
// ...existing code...
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleSearchClick();
  }

<<<<<<< HEAD
  /* ================= CATEGORIES ================= */
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      const data = res.data || [];

      if (!data.length) {
        setCategories(defaultCategories);
        return;
      }

      setCategories(
        data.map((cat) => {
          const def = defaultCategories.find(
            (d) =>
              d.name.replace(/\s+/g, "").toLowerCase() ===
              (cat.name || "").replace(/\s+/g, "").toLowerCase()
          );
          return {
            ...cat,
            icon: def?.icon || cat.icon || "🛍️",
            nameKannada: def?.nameKannada || cat.nameKannada || "",
          };
        })
      );
    } catch {
      setCategories(defaultCategories);
    }
  }

  /* 🔑 ONLY MODIFIED FUNCTION */
  function handleCategoryClick(id) {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    const name = category.name?.toLowerCase() || "";
    if (name.includes("flower")) {
      navigate("/flowers");
      return;
    }
    if (name.includes("cracker")) {
      navigate("/crackers");
      return;
    }
    if (name.includes("groceries")) {
      navigate("/groceries");
      return;
    }
    if (name.includes("grocery")) {
      navigate("/groceries");
      return;
    }
    if (name.includes("pet")) {
      navigate("/petservices");
      return;
    }
    if (name.includes("local")) {
      navigate("/localservices");
      return;
    }
    if (name.includes("consult")) {
      navigate("/consultancy");
      return;
    }
    navigate(`/browse?category=${id}`);
  }

  /* ================= ADS ================= */
  const ads = [
    { image: ad1, title: "iChase Fitness", link: "https://vchase.in" },
    { image: ad2, title: "Marketing", link: "https://vchase.in" },
    { image: ad3, title: "Crackers", link: "https://rrnagar.com" },
    { image: ad4, title: "Pet Services", link: "https://thevetbuddy.com" },
  ];
  const adsLoop = [...ads, ...ads];

  /* ================= DISCOVER ================= */
  const discover = [
    { title: "Temples", titleKannada: "ದೇವಾಲಯಗಳು", desc: "Spiritual places", icon: "🛕" },
    { title: "Parks", titleKannada: "ಉದ್ಯಾನಗಳು", desc: "Green spaces", icon: "🌳" },
    { title: "IT Parks", titleKannada: "ಐಟಿ ಉದ್ಯಾನಗಳು", desc: "Tech hubs", icon: "💻" },
    { title: "Education", titleKannada: "ಶಿಕ್ಷಣ", desc: "Schools & colleges", icon: "🎓" },
    { title: "Entertainment", titleKannada: "ಮನರಂಜನೆ", desc: "Fun places", icon: "🎭" },
  ];

  const discoverRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    if (!discoverRef.current) return;
    const calcWidth = () => {
      let total = 0;
      discoverRef.current.querySelectorAll(".discover-item").forEach((item) => {
        const style = window.getComputedStyle(item);
        total += item.offsetWidth + parseFloat(style.marginRight || "0");
      });
      setScrollWidth(total);
    };
    calcWidth();
    window.addEventListener("resize", calcWidth);
    return () => window.removeEventListener("resize", calcWidth);
  }, []);

  const featuredProducts = products.slice(0, 8);
  const displayedProducts = hasSearched ? filteredProducts : featuredProducts;

  return (
    <main className="home" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
      {/* Left Mega Ad */}
      <MegaAd position="left" image="/ads/mega-left.png" link="#" />

      {/* Main Content */}
      <div style={{ flex: 1, maxWidth: 1200 }}>
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-image">
              <img
                src={heroSrc}
                alt="RR Nagar"
                loading="lazy"
                onError={(e) => (e.currentTarget.src = hero1)}
              />
            </div>
=======
  return (
    <>
      <main className="home" style={{ display: "flex", width: "100%" }}>
        {/* LEFT SIDEBAR */}
        <aside style={{ marginRight: 24 }}>
          <MegaAd image="/ads/mega-left.png" position="left" />
        </aside>
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* HERO */}
          <section className="hero">
            <img src={heroImages[heroIndex]} alt="RR Nagar" />
            <div className="hero-text">
              <h1>ನಮ್ಮಿಂದ ನಿಮಗೆ — ನಿಮ್ಮಷ್ಟೇ ಹತ್ತಿರ</h1>
              <p>Shop local. Support local.</p>
              <div className="hero-search">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Search groceries, flowers, services…"
                />
                <button onClick={handleSearchClick}>Search</button>
              </div>
            </div>
          </section>

          {/* CATEGORIES GRID */}
          <section className="section">
            <h2>Popular Categories</h2>
            <div className="cat-row">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="cat-card"
                  onClick={() => navigate(`/browse?category=${cat.id}`)}
                >
                  <div className="cat-icon">{cat.icon || "🛍️"}</div>
                  <div className="cat-name">{cat.name}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ADS */}
<<<<<<< HEAD
          <section className="section">
            <h2 className="section-title">What’s New in RR Nagar</h2>
            <div className="ads-viewport">
              <div className="ads-track">
                {adsLoop.map((ad, i) => (
                  <a
                    key={i}
                    href={ad.link}
                    target="_blank"
                    rel="noreferrer"
                    className="ad-item"
                  >
                    <div className="ad-title">{ad.title}</div>
                    <img src={ad.image} alt={ad.title} loading="lazy" />
                    <div className="ad-cta">Tap to view</div>
                  </a>
                ))}
              </div>
            </div>
          </section>
=======
          <AdScroll />
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)

          {/* DISCOVER */}
          <section className="section">
            <h2>Discover Around You</h2>
            <div className="discover-scroll">
              <div className="discover-track">
                {[1, 2].map((_, i) => {
                  // Refs for each card
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
                        onClick={e => {
                          setSelectedDiscover({
                            icon: "🛕",
                            title: "Temples",
                            titleKannada: "ದೇವಾಲಯಗಳು",
                            longInfo:
                              "Temples in RR Nagar are peaceful places for worship, festivals, and community gatherings.",
                            longInfoKannada:
                              "ದೇವಾಲಯಗಳು ಪೂಜೆ, ಹಬ್ಬ ಮತ್ತು ಸಮುದಾಯ ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಪ್ರಸಿದ್ಧ.",
                          });
                          setPopupAnchor(ref1);
                        }}
                      />
                      <ExploreItem
                        icon="🌳"
                        title="Parks"
                        titleKannada="ಉದ್ಯಾನಗಳು"
                        ref={ref2}
                        onClick={e => {
                          setSelectedDiscover({
                            icon: "🌳",
                            title: "Parks",
                            titleKannada: "ಉದ್ಯಾನಗಳು",
                            longInfo:
                              "RR Nagar parks are green spaces for walks, play, relaxation, and community events.",
                            longInfoKannada:
                              "ಉದ್ಯಾನಗಳು ವಿಶ್ರಾಂತಿ, ಆಟ ಮತ್ತು ಸಮುದಾಯ ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ.",
                          });
                          setPopupAnchor(ref2);
                        }}
                      />
                      <ExploreItem
                        icon="💻"
                        title="IT Park"
                        titleKannada="ಐಟಿ ಪಾರ್ಕ್"
                        ref={ref3}
                        onClick={e => {
                          setSelectedDiscover({
                            icon: "💻",
                            title: "IT Park",
                            titleKannada: "ಐಟಿ ಪಾರ್ಕ್",
                            longInfo:
                              "IT Park in RR Nagar has tech companies, startups, and innovation.",
                            longInfoKannada:
                              "ಐಟಿ ಪಾರ್ಕ್ ಉದ್ಯೋಗ ಮತ್ತು ಹೊಸ ಆವಿಷ್ಕಾರಗಳಿಗೆ ಪ್ರಸಿದ್ಧ.",
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
<<<<<<< HEAD

          {/* PRODUCTS */}
          <section className="section">
            <h2 className="section-title">Fresh Picks for You</h2>
            <div className="products-grid">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <img
                    src={product.image || "/images/product-placeholder.png"}
                    alt={product.title}
                    loading="lazy"
                  />
                  <h3>{product.title}</h3>
                  <p>₹{product.price}</p>
                  <button
                    disabled={addingToCart === product.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    {addingToCart === product.id ? "Adding…" : "Add to cart"}
                  </button>
                </div>
              ))}
            </div>
          </section>
=======
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)
        </div>

        {/* RIGHT SIDEBAR */}
        <aside style={{ marginLeft: 24 }}>
          <MegaAd image="/ads/mega-right.png" position="right" />
        </aside>
      </main>

      {/* ✅ DISCOVER POPUP */}
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
