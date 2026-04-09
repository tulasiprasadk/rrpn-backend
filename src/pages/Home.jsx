// Home page – hero, categories, ads, discover & products (FINAL CLEAN, LOCKED)

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";
import ExploreItem from "../components/ExploreItem";
import DiscoverPopup from "../components/DiscoverPopup";
import MegaAd from "../components/MegaAd";
import api from "../api/client";
import ProductCard from "../components/ProductCard";
import CartPanel from "../components/CartPanel";
import CategoryIcon from "../components/CategoryIcon";
import { useCrackerCart } from "../context/CrackerCartContext";

/* ================= HERO IMAGES ================= */
import hero1_400 from "../assets/hero-1-400.jpg";
import hero1_800 from "../assets/hero-1-800.jpg";
import hero1 from "../assets/hero-1.jpg";
import hero2_400 from "../assets/hero-2-400.jpg";
import hero2_800 from "../assets/hero-2-800.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3_400 from "../assets/hero-3-400.jpg";
import hero3_800 from "../assets/hero-3-800.jpg";
import hero3 from "../assets/hero-3.jpg";
import hero4_400 from "../assets/hero-4-400.jpg";
import hero4_800 from "../assets/hero-4-800.jpg";
import hero4 from "../assets/hero-4.jpg";

/* ================= FALLBACK CATEGORIES (desired order) ================= */
// Known emoji mapping (use these instead of DB icons when possible)
const emojiMap = {
  crackers: "🧨",
  flowers: "💐",
  groceries: "🧺",
  localservices: "🛠️",
  petservices: "🐶",
  consultancy: "📋",
};

const defaultCategories = [
  { id: 3, name: "Crackers", nameKannada: "ಪಟಾಕಿಗಳು", icon: emojiMap.crackers },
  { id: 1, name: "Flowers", nameKannada: "ಹೂವುಗಳು", icon: emojiMap.flowers },
  { id: 2, name: "Groceries", nameKannada: "ಕಿರಾಣಿ ವಸ್ತುಗಳು", icon: emojiMap.groceries },
  { id: 6, name: "Local Services", nameKannada: "ಸ್ಥಳೀಯ ಸೇವೆಗಳು", icon: emojiMap.localservices },
  { id: 4, name: "Pet Services", nameKannada: "ಪೆಟ್ ಸೇವೆಗಳು", icon: emojiMap.petservices },
  { id: 5, name: "Consultancy", nameKannada: "ಸಲಹಾ ಸೇವೆಗಳು", icon: emojiMap.consultancy },
];

export default function Home() {
  const navigate = useNavigate();
  const fallbackScrollingAds = [
    { image: "/images/ads/ichase.png", title: "iChase Fitness", link: "https://vchase.in" },
    { image: "/images/ads/vchase.png", title: "VChase Marketing", link: "https://vchase.in" },
    { image: "/images/ads/rrnagar.png", title: "RR Nagar", link: "https://rrnagar.com" },
    { image: "/images/ads/reneevet.png", title: "Renee Vet", link: "https://thevetbuddy.com" },
  ];
  const fallbackMegaLeft = [
    { image: "/images/ads/ichase.png", title: "iChase Fitness", link: "https://vchase.in" },
    { image: "/images/ads/rrnagar.png", title: "RR Nagar", link: "https://rrnagar.com" },
  ];
  const fallbackMegaRight = [
    { image: "/images/ads/vchase.png", title: "VChase Marketing", link: "https://vchase.in" },
    { image: "/images/ads/reneevet.png", title: "Renee Vet", link: "https://thevetbuddy.com" },
    { image: "/images/ads/gephyr.png", title: "Gephyr", link: "https://rrnagar.com" },
  ];

  /* ================= HERO SLIDER ================= */
  const heroImages = [
    { src: hero1_800, srcSet: `${hero1_400} 400w, ${hero1_800} 800w, ${hero1} 1600w` },
    { src: hero2_800, srcSet: `${hero2_400} 400w, ${hero2_800} 800w, ${hero2} 1600w` },
    { src: hero3_800, srcSet: `${hero3_400} 400w, ${hero3_800} 800w, ${hero3} 1600w` },
    { src: hero4_800, srcSet: `${hero4_400} 400w, ${hero4_800} 800w, ${hero4} 1600w` },
  ];
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSrc, setHeroSrc] = useState(heroImages[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setHeroSrc(heroImages[heroIndex]);
  }, [heroIndex]);

  /* ================= HERO SEARCH (PURE NAVIGATION) ================= */
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchClick() {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/browse?q=${encodeURIComponent(q)}`);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleSearchClick();
  }

  /* ================= PRODUCTS ================= */
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await api.get(`/products`);
      const pdata = res && res.data ? res.data : [];
      const productsArray = pdata && pdata.value ? pdata.value : Array.isArray(pdata) ? pdata : [];
      setProducts(productsArray);
    } catch (err) {
      setProducts([]);
      setProductsError(err.message || "Failed to load products");
      console.error("Error loading products:", err);
    } finally {
      setProductsLoading(false);
    }
  }

  

  /* ================= CATEGORIES ================= */
  const [categories, setCategories] = useState(defaultCategories); // Start with defaults for instant display
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await api.get(`/categories`);
      const pdata = res && res.data ? res.data : [];
      const data = pdata && pdata.value ? pdata.value : Array.isArray(pdata) ? pdata : [];

      if (!data.length) {
        setCategories(defaultCategories);
        return;
      }

      const normalize = (value) => (value || "").replace(/\s+/g, "").toLowerCase();
      const allowed = new Map(defaultCategories.map((c) => [normalize(c.name), c]));

      // Only keep the approved default categories; ignore any extras
      const mapped = data
        .map((cat) => {
          const norm = normalize(cat.name);
          const def = allowed.get(norm);
          if (!def) return null;
          return {
            ...cat,
            icon: def.icon || emojiMap[norm] || cat.icon || "🛍️",
            nameKannada: def.nameKannada || cat.nameKannada || "",
          };
        })
        .filter(Boolean);

      // Preserve the default order, while keeping backend IDs when present
      const ordered = defaultCategories.map((def) => {
        const norm = normalize(def.name);
        return mapped.find((m) => normalize(m.name) === norm) || def;
      });

      setCategories(ordered);
    } catch (err) {
      setCategoriesError(err.message || "Failed to load categories");
      console.error("Error loading categories:", err);
      // Keep default categories on error
    } finally {
      setCategoriesLoading(false);
    }
  }

  function handleCategoryClick(id, providedName) {
    const category = categories.find((c) => c.id === id) || {};
    const normalizedName = (providedName || category.name || "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();

    if (normalizedName.includes("consult")) return navigate("/consultancy");
    if (normalizedName.includes("localservice") || normalizedName === "local") return navigate("/localservices");
    if (normalizedName.includes("petservice") || normalizedName === "pet") return navigate("/petservices");
    if (normalizedName.includes("groc")) return navigate("/groceries");
    if (normalizedName.includes("cracker")) return navigate("/crackers");
    if (normalizedName.includes("flower")) return navigate("/flowers");

    navigate(`/browse?categoryId=${id}`);
  }

  /* ================= ADS ================= */
  const [scrollingAds, setScrollingAds] = useState(fallbackScrollingAds);
  const [megaLeftAds, setMegaLeftAds] = useState(fallbackMegaLeft);
  const [megaRightAds, setMegaRightAds] = useState(fallbackMegaRight);

  useEffect(() => {
    async function loadAds() {
      try {
        const [scrollRes, leftRes, rightRes] = await Promise.all([
          api.get("/cms/scrolling-ads"),
          api.get("/cms/mega-ads/left"),
          api.get("/cms/mega-ads/right")
        ]);

        const normalizeAd = (item) => ({
          image: item.image || item.imageUrl || item.image_url || item.src || "",
          title: item.title || item.name || item.text || "Advertisement",
          link: item.link || item.targetUrl || item.href || ""
        });

        const nextScroll = Array.isArray(scrollRes.data) ? scrollRes.data.map(normalizeAd).filter((item) => item.image) : [];
        const nextLeft = Array.isArray(leftRes.data) ? leftRes.data.map(normalizeAd).filter((item) => item.image) : [];
        const nextRight = Array.isArray(rightRes.data) ? rightRes.data.map(normalizeAd).filter((item) => item.image) : [];

        if (nextScroll.length) setScrollingAds(nextScroll);
        if (nextLeft.length) setMegaLeftAds(nextLeft);
        if (nextRight.length) setMegaRightAds(nextRight);
      } catch (err) {
        console.error("Error loading homepage ads:", err);
      }
    }

    loadAds();
  }, []);

  const adsLoop = [...scrollingAds, ...scrollingAds];
  const megaAds = [...megaLeftAds, ...megaRightAds].map((item) => ({
    image: item.image,
    link: item.link,
    alt: item.title
  }));

  // Track whether we are rendering desktop layout (columns) or mobile layout (grid)
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    try { return typeof window !== 'undefined' ? window.innerWidth > 1200 : true; } catch (e) { return true; }
  });

  useEffect(() => {
    function onResize() {
      setIsDesktopLayout(window.innerWidth > 1200);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ================= DISCOVER ================= */
  const discover = [
    { title: "Temples", titleKannada: "ದೇವಾಲಯಗಳು", desc: "Spiritual places", icon: "🛕", longInfo: "Temples are a vital part of RR Nagar's culture, offering spiritual solace and community events.", longInfoKannada: "ದೇವಾಲಯಗಳು ಆರ್ ಆರ್ ನಗರದಲ್ಲಿ ಆಧ್ಯಾತ್ಮಿಕತೆ ಮತ್ತು ಸಮುದಾಯದ ಕೇಂದ್ರಗಳಾಗಿವೆ." },
    { title: "Parks", titleKannada: "ಉದ್ಯಾನಗಳು", desc: "Green spaces", icon: "🌳", longInfo: "RR Nagar is home to several parks, perfect for morning walks, play, and relaxation.", longInfoKannada: "ಆರ್ ಆರ್ ನಗರದಲ್ಲಿ ಹಲವಾರು ಉದ್ಯಾನಗಳು ಇವೆ, ವಿಶ್ರಾಂತಿ ಮತ್ತು ಆಟಕ್ಕೆ ಸೂಕ್ತವಾದವು." },
    { title: "IT Parks", titleKannada: "ಐಟಿ ಉದ್ಯಾನಗಳು", desc: "Tech hubs", icon: "💻", longInfo: "IT Parks in RR Nagar drive innovation and provide jobs to many residents.", longInfoKannada: "ಐಟಿ ಉದ್ಯಾನಗಳು ಆರ್ ಆರ್ ನಗರದಲ್ಲಿ ಉದ್ಯೋಗ ಮತ್ತು ನವೀನತೆಗೆ ಕಾರಣವಾಗಿವೆ." },
    { title: "Education", titleKannada: "ಶಿಕ್ಷಣ", desc: "Schools & colleges", icon: "🎓", longInfo: "RR Nagar has top schools and colleges, making it a hub for quality education.", longInfoKannada: "ಆರ್ ಆರ್ ನಗರದಲ್ಲಿ ಉತ್ತಮ ಶಾಲೆಗಳು ಮತ್ತು ಕಾಲೇಜುಗಳಿವೆ." },
    { title: "Entertainment", titleKannada: "ಮನರಂಜನೆ", desc: "Fun places", icon: "🎭", longInfo: "Enjoy movies, events, and fun activities in RR Nagar's entertainment spots.", longInfoKannada: "ಆರ್ ಆರ್ ನಗರದಲ್ಲಿ ಮನರಂಜನೆಗೆ ಹಲವಾರು ಅವಕಾಶಗಳಿವೆ." },
  ];
  // Discover popup state
  const [popup, setPopup] = useState({ open: false, item: null, anchor: null });
  const discoverItemRefs = useRef([]);

  const discoverRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const popupCloseTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (popupCloseTimer.current) {
        clearTimeout(popupCloseTimer.current);
        popupCloseTimer.current = null;
      }
    };
  }, []);

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

  const featuredProducts = products.slice(0, 16);

  const { addItem } = useCrackerCart();

  const handleAddFromGrid = (product) => {
    const price = product.price ?? product.basePrice ?? 0;
    addItem({ id: product.id, title: product.title || product.name, name: product.name, price, qty: 1 });
    window.dispatchEvent(new Event('cart-updated'));
    alert(`✓ ${product.title || product.name} added to bag`);
  };

  return (
    <main className="home" style={{ display: "flex", width: "100vw", margin: 0, padding: 0, alignItems: "flex-start" }}>
      {isDesktopLayout && (
        <div className="mega-column mega-column-left" style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'stretch', alignSelf: 'flex-start' }}>
          {megaLeftAds.map((item, i) => (
            <MegaAd key={`left-${i}`} image={item.image} link={item.link} position="left" />
          ))}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 1200, margin: '0 auto' }}>
        {/* HERO */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-image">
              <img
                src={heroSrc.src}
                srcSet={heroSrc.srcSet}
                sizes="(max-width: 800px) 100vw, 1200px"
                alt="RR Nagar"
                loading="eager"
                decoding="async"
                onError={(e)=>{ e.currentTarget.src = '/no-image.png'; e.currentTarget.style.objectFit='cover'; }}
              />
            </div>

            <div className="hero-text">
              <h1>ನಮ್ಮಿಂದ ನಿಮಗೆ — ನಿಮ್ಮಷ್ಟೇ ಹತ್ತಿರ.</h1>
              <p>From Us To You — As Close As You Need Us.</p>

              <div className="hero-search">
                <input
                  placeholder="Search groceries, flowers, products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={handleSearchClick}>Search</button>
              </div>
            </div>
          </div>
        </section>

        {/* MEGA GRID moved below categories to preserve content order on mobile */}

        {/* CATEGORIES */}
        <section className="section">
          <h2 className="section-title">Popular Categories</h2>
          {categoriesLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Loading categories...
            </div>
          )}
          {categoriesError && (
            <div style={{ textAlign: 'center', padding: '10px', color: '#d32f2f', fontSize: '14px' }}>
              {categoriesError} (Using default categories)
            </div>
          )}
          <div className="cat-row">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="cat-card"
                onClick={() => handleCategoryClick(cat.id, cat.name)}
              >
                <span className="icon"><CategoryIcon category={cat.name} size={40} /></span>
                <span className="label">{cat.name}</span>
                <span className="label-kannada">{cat.nameKannada}</span>
              </div>
            ))}
          </div>
        </section>

        {/* MEGA GRID (mobile/tablet) — moved below categories, no title, left-aligned */}
        {!isDesktopLayout && (
          <section className="section mega-grid-section">
            <div className="mega-grid mega-grid--left">
              {megaAds.map((item, index) => (
                <MegaAd
                  key={`${item.alt || item.image}-${index}`}
                  image={item.image}
                  link={item.link}
                  alt={item.alt}
                  position="grid"
                />
              ))}
            </div>
          </section>
        )}

        {/* ADS */}
        <section className="section">
          <h2 className="section-title">What’s New in RR Nagar</h2>
          <div className="ads-viewport">
            <div className="ads-track">
              {adsLoop.map((ad, i) => (
                <a key={i} href={ad.link} target="_blank" rel="noreferrer" className="ad-item">
                  <div className="ad-title">{ad.title}</div>
                  <img src={ad.image} alt={ad.title} />
                  <div className="ad-cta">Tap to view</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* DISCOVER */}
        <section className="section">
          <h2 className="section-title">Discover Around You</h2>
          <div className="discover-viewport">
            <div
              ref={discoverRef}
              className="discover-track"
              style={{ "--scroll-width": `${scrollWidth}px` }}
            >
              {[...discover, ...discover].map((item, i) => (
                <div
                  className="discover-item"
                  key={i}
                  onMouseEnter={() => {
                    if (popupCloseTimer.current) {
                      clearTimeout(popupCloseTimer.current);
                      popupCloseTimer.current = null;
                    }
                    setPopup({ open: true, item, anchor: { current: discoverItemRefs.current[i] }, source: 'hover' });
                  }}
                  onMouseLeave={() => {
                    // schedule close to allow mouse to travel to popup, only for hover-sourced popups
                    if (popup?.source === 'hover') {
                      if (popupCloseTimer.current) clearTimeout(popupCloseTimer.current);
                      popupCloseTimer.current = setTimeout(() => setPopup({ open: false, item: null, anchor: null, source: null }), 220);
                    }
                  }}
                >
                  <ExploreItem
                    {...item}
                    ref={el => discoverItemRefs.current[i] = el}
                    onClick={() => setPopup({ open: true, item, anchor: { current: discoverItemRefs.current[i] }, source: 'click' })}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Render popup outside the discover-track to avoid clipping from transforms */}
        {popup.open && (
          <>
            {popup.source === 'click' && (
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.08)' }}
                onClick={() => setPopup({ open: false, item: null, anchor: null, source: null })}
              />
            )}
            <DiscoverPopup
              item={popup.item}
              anchorRef={popup.anchor}
              onClose={() => setPopup({ open: false, item: null, anchor: null, source: null })}
              onMouseEnter={() => {
                if (popupCloseTimer.current) {
                  clearTimeout(popupCloseTimer.current);
                  popupCloseTimer.current = null;
                }
              }}
              onMouseLeave={() => {
                if (popup?.source === 'hover') {
                  if (popupCloseTimer.current) clearTimeout(popupCloseTimer.current);
                  popupCloseTimer.current = setTimeout(() => setPopup({ open: false, item: null, anchor: null, source: null }), 220);
                }
              }}
            />
          </>
        )}

        {/* PRODUCTS */}
        <section className="section fresh-picks">
          <h2 className="section-title">Fresh Picks for You</h2>
          {productsLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading products...</div>
              <div style={{ fontSize: '14px' }}>Please wait while we fetch the latest items</div>
            </div>
          )}
          {productsError && !productsLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>⚠️ Unable to load products</div>
              <div style={{ fontSize: '14px', marginBottom: '20px' }}>{productsError}</div>
              <button 
                onClick={loadProducts}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Try Again
              </button>
            </div>
          )}
          {!productsLoading && !productsError && featuredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '18px' }}>No products available at the moment</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>Check back soon for new items!</div>
            </div>
          )}
          {!productsLoading && !productsError && featuredProducts.length > 0 && (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-tile"
                  onClick={() => handleAddFromGrid(product)}
                  style={{ cursor: 'pointer' }}
                >
                  <ProductCard variant="fresh" product={products.find(p => p.id === product.id) || product} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
      {isDesktopLayout && (
        <div className="mega-column mega-column-right" style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'stretch', alignSelf: 'flex-start' }}>
          <CartPanel />
          {megaRightAds.map((item, i) => (
            <MegaAd key={`right-${i}`} image={item.image} link={item.link} position="right" />
          ))}
        </div>
      )}
    </main>
    
  );
}



