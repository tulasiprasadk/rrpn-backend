// src/pages/Groceries.jsx

import { useEffect, useMemo, useState } from "react";
import { getProducts, getCategories } from "../api";
import ProductCard from "../components/ProductCard";
import CategoryIcon from "../components/CategoryIcon";
import CartPanel from "../components/CartPanel";

function normalizeVariety(value) {
  return (value || "Others").toString().trim() || "Others";
}

function cleanTitle(product) {
  const rawTitle = (product.title || "").trim();
  if (!rawTitle) return "Product";

  if (product.variety) {
    return rawTitle;
  }

  const [name] = rawTitle.split(" - ");
  return (name || rawTitle).trim();
}

export default function Groceries() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariety, setSelectedVariety] = useState("All");
  const [isCompactLayout, setIsCompactLayout] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1180 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => {
      setIsCompactLayout(window.innerWidth < 1180);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        let groceriesCat = null;
        try {
          const cats = await getCategories();
          groceriesCat = cats.find((c) => (c.name || "").toLowerCase().includes("groc")) || null;
        } catch (err) {
          console.warn("Groceries page - categories lookup failed, falling back:", err);
        }

        let data = [];
        if (groceriesCat?.id) {
          data = await getProducts("", groceriesCat.id);
        } else {
          data = await getProducts();
        }

        let groceries = Array.isArray(data) ? data : [];
        if (!groceriesCat) {
          groceries = groceries.filter(
            (product) => product.Category && (product.Category.name || "").toLowerCase().includes("groc")
          );
          if (groceries.length === 0) {
            groceries = Array.isArray(data) ? data : [];
          }
        }

        if (mounted) {
          setProducts(groceries);
        }
      } catch (error) {
        console.error("Groceries page - load error:", error);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const preparedProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        title: cleanTitle(product),
        displayVariety: normalizeVariety(product.variety),
      })),
    [products]
  );

  const varietyCounts = useMemo(() => {
    const counts = new Map();
    preparedProducts.forEach((product) => {
      const key = product.displayVariety;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, count]) => ({ name, count }));
  }, [preparedProducts]);

  const filteredProducts = useMemo(() => {
    const list =
      selectedVariety === "All"
        ? preparedProducts
        : preparedProducts.filter((product) => product.displayVariety === selectedVariety);

    return list.slice().sort((left, right) => {
      const varietyCompare = left.displayVariety.localeCompare(right.displayVariety);
      if (varietyCompare !== 0) return varietyCompare;
      return (left.title || "").localeCompare(right.title || "");
    });
  }, [preparedProducts, selectedVariety]);

  const selectedCount = selectedVariety === "All" ? preparedProducts.length : filteredProducts.length;

  const varietySelector = (
    <div
      style={{
        display: isCompactLayout ? "flex" : "grid",
        gap: 8,
        overflowX: isCompactLayout ? "auto" : "visible",
        paddingBottom: isCompactLayout ? 4 : 0,
      }}
    >
      <button
        type="button"
        onClick={() => setSelectedVariety("All")}
        style={{
          flex: isCompactLayout ? "0 0 auto" : undefined,
          minWidth: isCompactLayout ? 140 : undefined,
          border: selectedVariety === "All" ? "2px solid #C8102E" : "1px solid #E6D36A",
          background: selectedVariety === "All" ? "#fff" : "#FFFDF0",
          color: "#5A3A00",
          borderRadius: 12,
          padding: "10px 12px",
          textAlign: "left",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        All Varieties
        <div style={{ fontSize: 12, color: "#8b5e00", marginTop: 4 }}>{preparedProducts.length} items</div>
      </button>

      {varietyCounts.map((variety) => (
        <button
          key={variety.name}
          type="button"
          onClick={() => setSelectedVariety(variety.name)}
          style={{
            flex: isCompactLayout ? "0 0 auto" : undefined,
            minWidth: isCompactLayout ? 140 : undefined,
            border: selectedVariety === variety.name ? "2px solid #C8102E" : "1px solid #E6D36A",
            background: selectedVariety === variety.name ? "#fff" : "#FFFDF0",
            color: "#5A3A00",
            borderRadius: 12,
            padding: "10px 12px",
            textAlign: "left",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {variety.name}
          <div style={{ fontSize: 12, color: "#8b5e00", marginTop: 4 }}>{variety.count} items</div>
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="with-cart-panel"
      style={{
        minHeight: "100vh",
        background: "#FFFDE7",
        display: isCompactLayout ? "flex" : "grid",
        gridTemplateColumns: isCompactLayout ? undefined : "160px minmax(0, 1fr) 320px",
        alignItems: "flex-start",
        gap: isCompactLayout ? 16 : 18,
        flexDirection: isCompactLayout ? "column" : undefined,
        padding: isCompactLayout ? "16px 12px 24px" : "0 16px",
      }}
    >
      {!isCompactLayout && (
        <aside
          style={{
            width: 160,
            minWidth: 160,
            position: "sticky",
            top: 24,
            alignSelf: "flex-start",
            background: "#FFF9C4",
            border: "1px solid #F2D060",
            borderRadius: 16,
            padding: 16,
            maxHeight: "calc(100vh - 48px)",
            overflow: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C8102E", fontWeight: 800, marginBottom: 12 }}>
            <CategoryIcon category="groceries" size={18} />
            Variety View
          </div>
          {varietySelector}
        </aside>
      )}

      <div
        style={{
          minWidth: 0,
          width: "100%",
          padding: isCompactLayout ? 0 : "24px 0",
        }}
      >
        <div
          style={{
            background: "#FFF9C4",
            borderRadius: 16,
            padding: "18px 20px",
            border: "1px solid #F2D060",
            marginBottom: 20,
          }}
        >
          <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, color: "#C8102E" }}>
            <CategoryIcon category="groceries" size={22} />
            Groceries
          </h1>
          <p style={{ margin: "8px 0 0", color: "#7a2034", fontWeight: 700 }}>
            Browse by variety on the left and keep an eye on your bag on the right.
          </p>
          <div style={{ marginTop: 10, color: "#5A3A00", fontWeight: 700 }}>
            {selectedVariety === "All" ? `Showing ${preparedProducts.length} grocery products` : `Showing ${selectedCount} products in ${selectedVariety}`}
          </div>
        </div>

        {isCompactLayout && (
          <div
            style={{
              background: "#FFF9C4",
              borderRadius: 16,
              padding: 12,
              border: "1px solid #F2D060",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C8102E", fontWeight: 800, marginBottom: 10 }}>
              <CategoryIcon category="groceries" size={18} />
              Browse By Variety
            </div>
            {varietySelector}
          </div>
        )}

        {loading && <p>Loading groceries...</p>}
        {!loading && preparedProducts.length === 0 && <p>No groceries available.</p>}

        {!loading && selectedVariety !== "All" && (
          <div
            style={{
              marginBottom: 16,
              background: "#FFF9C4",
              borderRadius: 14,
              padding: "12px 16px",
              border: "1px solid #F2D060",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#C8102E", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <CategoryIcon category="groceries" variety={selectedVariety} size={18} />
              {selectedVariety}
            </div>
            <button
              type="button"
              onClick={() => setSelectedVariety("All")}
              style={{
                background: "#C8102E",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Show All
            </button>
          </div>
        )}

        {!loading && (
          <div
            className="product-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isCompactLayout
                ? "repeat(auto-fill, minmax(140px, 1fr))"
                : "repeat(auto-fill, minmax(150px, 1fr))",
              gap: isCompactLayout ? 14 : 18,
            }}
          >
            {filteredProducts.map((product) => (
              <div key={product.id} style={{ minWidth: 0, display: "flex" }}>
                <ProductCard product={product} iconSize={20} style={{ minHeight: isCompactLayout ? 210 : 230 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          width: isCompactLayout ? "100%" : 320,
          minWidth: isCompactLayout ? 0 : 320,
          maxWidth: isCompactLayout ? "100%" : 320,
          position: isCompactLayout ? "static" : "sticky",
          top: 24,
          alignSelf: "flex-start",
        }}
      >
        <CartPanel orderType="GROCERIES" />
      </div>
    </div>
  );
}
