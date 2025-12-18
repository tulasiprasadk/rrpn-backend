import React from "react";
import services from "../data/local_services.json";
import CartPanel from "../components/CartPanel";
import { CrackerCartProvider, useCrackerCart } from "../context/CrackerCartContext";

export default function LocalServices() {
  const { addItem } = useCrackerCart();
  return (
    <CrackerCartProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#FFF8E1" }}>
        {/* LEFT: SERVICES */}
        <div style={{ flex: 1, padding: "24px 32px" }}>
          <h1 style={{ marginBottom: 8, color: "#C8102E" }}>
            🛠️ Local Services
          </h1>
          <p style={{ color: "#555", marginBottom: 24 }}>
            Book trusted local services in RR Nagar. Inspection-based or fixed pricing.
          </p>
          {services.map((cat) => (
            <div key={cat.category} style={{ marginBottom: 32 }}>
              <h2 style={{ borderBottom: "2px solid #C8102E", paddingBottom: 6 }}>{cat.category}</h2>
              <div className="product-grid" style={{ display: "grid", gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginTop: 16 }}>
                {cat.items.map((service) => (
                  <div
                    key={service.id}
                    style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 110, cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 0 0 rgba(0,0,0,0)', textAlign: 'center' }}
                    onClick={() => addItem({ id: `${cat.category}-${service.name}`, name: service.name, price: service.price, unit: service.unit })}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(200,16,46,0.08)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)'}
                  >
                    <span style={{ fontSize: 32 }}>{service.emoji || "🛠️"}</span>
                    <span style={{ fontWeight: 700 }}>{service.name}</span>
                    {service.kn && (
                      <span style={{ color: '#C8102E', fontSize: 14, fontWeight: 600, fontFamily: 'Noto Sans Kannada, sans-serif' }}>{service.kn}</span>
                    )}
                    {service.subCategory && (
                      <span style={{ color: '#888', fontSize: 13, fontWeight: 500 }}>{service.subCategory}</span>
                    )}
                    <span style={{ fontSize: 13, color: '#555' }}>{service.priceType} {service.price ? `₹${service.price}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* RIGHT: CART */}
        <CartPanel orderType="LOCAL_SERVICES" />
      </div>
    </CrackerCartProvider>
  );
}
