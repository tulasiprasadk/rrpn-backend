
import React, { useMemo, useState } from "react";
import consultancies from "../data/consultancy.json";
import ProductCard from "../components/ProductCard";
import CategoryLayout from "../components/CategoryLayout";
import { useCrackerCart } from "../context/CrackerCartContext";

export default function Consultancy() {
  const { addItem } = useCrackerCart();
  const [selectedVariety, setSelectedVariety] = useState("All");

  // Flatten all consultancies into a single array, add category
  const allConsultancies = useMemo(() =>
    consultancies.flatMap(cat => cat.items.map(service => ({ ...service, category: cat.category }))),
    [consultancies]
  );

  // Group by subCategory (or category if missing)
  const grouped = useMemo(() => {
    const out = {};
    allConsultancies.forEach((s) => {
      const v = s.subCategory || s.category || "Other";
      if (!out[v]) out[v] = [];
      out[v].push(s);
    });
    return out;
  }, [allConsultancies]);

  const varietyCounts = useMemo(() => {
    const entries = Object.keys(grouped).sort();
    return [
      { name: "All", count: allConsultancies.length },
      ...entries.map((k) => ({ name: k, count: (grouped[k] || []).length })),
    ];
  }, [grouped, allConsultancies]);

  const left = (
    <div style={{ display: "grid", gap: 8 }}>
      {varietyCounts.map((v) => (
        <button
          key={v.name}
          type="button"
          onClick={() => setSelectedVariety(v.name)}
          style={{
            display: "block",
            width: "100%",
            border: selectedVariety === v.name ? "2px solid #C8102E" : "1px solid #E6D36A",
            background: selectedVariety === v.name ? "#fff" : "#FFFDF0",
            color: "#5A3A00",
            borderRadius: 12,
            padding: "10px 12px",
            textAlign: "left",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {v.name}
          <div style={{ fontSize: 12, color: "#8b5e00", marginTop: 4 }}>{v.count} items</div>
        </button>
      ))}
    </div>
  );

  function addItemToBag(service) {
    addItem({
      id: service.id,
      title: service.name,
      titleKannada: service.kn,
      knDisplay: service.kn,
      price: service.price,
      image: service.image,
      emoji: service.emoji,
      category: service.category,
      description: service.priceType ? `${service.priceType}${service.price ? `: ₹${service.price}` : ''}` : undefined,
    }, 1);
  }

  return (
    <CategoryLayout title={"Consultancy"} category="consultancy" orderType="CONSULTANCY" left={left}>
      <div style={{ padding: "24px 32px" }}>
        <h1 style={{ marginBottom: 8, color: "#C8102E", textAlign: 'center' }}>
          🗃️ Consultancy Services
        </h1>
        <p style={{ color: "#C8102E", marginBottom: 24, textAlign: 'center' }}>
          Book expert consultancy services. Online, offline, or hybrid modes available.
        </p>
        {Object.entries(grouped)
          .filter(([variety]) => selectedVariety === "All" || selectedVariety === variety)
          .map(([variety, items]) => (
            <div key={variety} style={{ marginBottom: 32, background: '#FFF9C4', borderRadius: 12, padding: 12 }}>
              <h2 style={{ borderBottom: '2px solid #C8102E', paddingBottom: 6, color: '#C8102E', fontSize: 20, textAlign: 'center' }}>{variety}</h2>
              <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 20, marginTop: 12, alignItems: 'stretch' }}>
                {items.map((service) => (
                  <ProductCard
                    key={service.id}
                    product={{
                      id: service.id,
                      title: service.name,
                      titleKannada: service.kn,
                      knDisplay: service.kn,
                      price: service.price,
                      image: service.image,
                      emoji: service.emoji,
                      category: service.category,
                      description: service.priceType ? `${service.priceType}${service.price ? `: ₹${service.price}` : ''}` : undefined,
                    }}
                    onClick={() => addItemToBag(service)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </CategoryLayout>
  );
}



