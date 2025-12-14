// Home page – hero, categories, ads, discover & products (final clean version)

import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import ExploreItem from "../components/ExploreItem";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ================= HERO IMAGES (imported from assets) ================= */
import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3 from "../assets/hero-3.jpg";
import hero4 from "../assets/hero-4.jpg";

/* ================= ADS ================= */
import ad1 from "../assets/ads/ad1.jpg";
import ad2 from "../assets/ads/ad2.jpg";
import ad3 from "../assets/ads/ad3.jpg";
import ad4 from "../assets/ads/ad4.jpg";

export default function Home() {
  const navigate = useNavigate();

  /* ================= HERO SLIDER ================= */
  const heroImages = [hero1, hero2, hero3, hero4];
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

  /* ================= PRODUCTS ================= */
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  }

  async function addToCart(product) {
    setAddingToCart(product.id);
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((i) => i.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      alert(`✓ ${product.title} added to cart`);
    } catch (err) {
      alert("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  }

  function handleSearchClick() {
    setHasSearched(true);
    if (!searchQuery.trim()) {
      setFilteredProducts(products.slice(0, 12));
    } else {
      navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") handleSearchClick();
  }

  /* ================= CATEGORIES ================= */
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data || []);
    } catch {
      setCategories([
        { id: 1, name: "Flowers", icon: "🌸" },
        { id: 2, name: "Crackers", icon: "🎆" },
        { id: 3, name: "Vegetables", icon: "🥬" },
        { id: 4, name: "Fruits", icon: "🍎" },
        { id: 5, name: "Milk Products", icon: "🥛" },
        { id: 6, name: "Groceries", icon: "🛒" },
      ]);
    }
  }

  function handleCategoryClick(id) {
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
    { title: "Temples", desc: "Spiritual places", icon: "🛕" },
    { title: "Parks", desc: "Green spaces", icon: "🌳" },
    { title: "IT Parks", desc: "Tech hubs", icon: "💻" },
    { title: "Education", desc: "Schools & colleges", icon: "🎓" },
    { title: "Entertainment", desc: "Fun places", icon: "🎭" },
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

  /* ================= DERIVED ================= */
  const featuredProducts = products.slice(0, 8);
  const displayedProducts = hasSearched ? filteredProducts : featuredProducts;

  /* ================= UI ================= */
  return (
    <main className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-image">
            <img
              src={heroSrc}
              alt="RR Nagar"
              onError={(e) => (e.currentTarget.src = fallbackHero)}
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

      <div className="content">
        {/* CATEGORIES */}
        <section className="section">
          <h2 className="section-title">Popular Categories</h2>
          <div className="cat-row">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="cat-card"
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className="icon">{cat.icon || "🛍️"}</span>
                <span className="label">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ADS */}
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
                <div className="discover-item" key={i}>
                  <ExploreItem {...item} longInfo={item.desc} />
                </div>
              ))}
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
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img
                  src={product.image || "/images/product-placeholder.png"}
                  alt={product.title}
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
      </div>
    </main>
  );
}
