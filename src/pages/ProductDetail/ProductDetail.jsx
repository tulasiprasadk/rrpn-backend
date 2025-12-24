import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [selectedSubVariety, setSelectedSubVariety] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // Fetch Product by ID
  // ===============================
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `/products/${productId}` // <-- Update backend port if needed
        );
        const data = await res.json();

        if (!res.ok) {
          return setError(data.message || "Failed to load product");
        }

        setProduct(data);

        // Pre-select first variety (if available)
        if (data.varieties && data.varieties.length > 0) {
          setSelectedVariety(data.varieties[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Server error while loading product.");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // ===============================
  // Add to Cart
  // ===============================
  const handleAddToCart = async () => {
    if (!selectedVariety) {
      alert("Please select a variety");
      return;
    }

    const payload = {
      productId: product.id,
      varietyId: selectedVariety.id,
      subVarietyId: selectedSubVariety ? selectedSubVariety.id : null,
      quantity,
    };

    try {
      const res = await fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Error adding to cart");
        return;
      }

      alert("Added to cart!");
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // ===============================
  // UI: If loading
  // ===============================
  if (loading) {
    return (
      <div className="pd-container">
        <div className="pd-skeleton"></div>
      </div>
    );
  }

  // UI: If error
  if (error) {
    return <div className="pd-error">{error}</div>;
  }

  // ===============================
  // Render Product Detail
  // ===============================
  return (
    <div className="pd-container">
      {/* IMAGE SECTION */}
      <div className="pd-images">
        <img src={product.image_url} alt={product.name} className="pd-main-img" />

        {/* Future: Add thumbnails if multiple images */}
      </div>

      {/* DETAILS SECTION */}
      <div className="pd-info">
        <h1 className="pd-title">{product.name}</h1>

        <p className="pd-description">{product.description}</p>

        {/* PRICE */}
        <div className="pd-price">
          ₹ {selectedVariety?.price || product.price}
        </div>

        {/* VARIETIES */}
        {product.varieties?.length > 0 && (
          <div className="pd-section">
            <h4>Choose Variety</h4>
            <div className="pd-varieties">
              {product.varieties.map((v) => (
                <button
                  key={v.id}
                  className={`pd-var-btn ${
                    selectedVariety?.id === v.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedVariety(v);
                    setSelectedSubVariety(null);
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUB-VARIETIES */}
        {selectedVariety?.subVarieties?.length > 0 && (
          <div className="pd-section">
            <h4>Select Option</h4>
            <div className="pd-varieties">
              {selectedVariety.subVarieties.map((sv) => (
                <button
                  key={sv.id}
                  className={`pd-var-btn ${
                    selectedSubVariety?.id === sv.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedSubVariety(sv)}
                >
                  {sv.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* QUANTITY */}
        <div className="pd-qty">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity((q) => q + 1)}>+</button>
        </div>

        {/* ADD TO CART */}
        <button className="pd-add-btn" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
