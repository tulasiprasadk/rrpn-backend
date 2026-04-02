import React from "react";
import { useCrackerCart } from "../context/CrackerCartContext";
import CategoryIcon from "./CategoryIcon";


// Emoji mapping consolidated in `CategoryIcon` — removed local unused map

export default function ProductCard({ product, onClick, variant, iconSize, style }) {
  const { addItem } = useCrackerCart();
  if (!product) return null;
  const {
    id: _id,
    name,
    title,
    kn,
    knDisplay,
    emoji: _emoji,
    titleKannada,
    price,
    image,
    imageUrl,
    image_url,
    description,
    variety,
    category,
    Category,
  } = product;
  const displayName = name || title || "Product";
  const displayImage = image || imageUrl || image_url || "";
  // Extract category name and icon (support both Category object and string)
  const categoryName = Category?.name || category || "";
  const categoryIcon = Category?.icon || null;
  // Debug: Log product data for icon matching
  // console.log('ProductCard icon data:', { displayName, categoryName, categoryIcon, variety });
  // ensure title/desc wrappers have no unexpected border/background
  const titleStyle = { margin: 0, fontSize: 11, fontWeight: 600, color: "#b00018", textAlign: 'center', background: 'transparent', border: 'none' };
  const knStyle = { color: "#b00018", fontSize: 10, fontFamily: 'Noto Sans Kannada, Tunga, Arial, sans-serif', fontWeight: 600, textAlign: 'center', background: 'transparent', border: 'none' };
  const iconSizeBase = (iconSize || 28) + 25;
  let displayPrice = null;
  if (price === null || price === undefined) {
    displayPrice = null;
  } else if (typeof price === "number") {
    displayPrice = price;
  } else if (typeof price === "string") {
    // Accept numeric string like "0", "150" or currency formatted strings like "₹150" or "150.00"
    const cleaned = price.replace(/[^0-9.\-]+/g, "");
    const n = parseFloat(cleaned);
    displayPrice = Number.isFinite(n) ? n : null;
  } else {
    try {
      const n = Number(price);
      displayPrice = Number.isFinite(n) ? n : null;
    } catch (e) {
      displayPrice = null;
    }
  }
  // If still no displayPrice, try common alternate fields that backends sometimes use
  if (displayPrice === null) {
    const alt = product.basePrice ?? product.priceFrom ?? product.minPrice ?? product.maxPrice ?? product.priceRange ?? null;
    if (alt !== null && alt !== undefined) {
      const cleanedAlt = ("" + alt).replace(/[^0-9.\-]+/g, "");
      const nAlt = parseFloat(cleanedAlt);
      displayPrice = Number.isFinite(nAlt) ? nAlt : null;
    }
  }
  // Try nested/variant fields commonly used by different data shapes
  if (displayPrice === null) {
    const nested = (
      product.variants && product.variants[0]
        ? [product.variants[0].price, product.variants[0].sellingPrice, product.variants[0].mrp]
        : []
    ).concat(
      product.prices && product.prices[0] ? [product.prices[0].price, product.prices[0].sellingPrice] : []
    ).concat([
      product.pricing?.price,
      product.sku?.price,
      product.sku?.sellingPrice,
      product.mrp,
      product.selling_price,
      product.listPrice,
      product.sellingPrice,
    ]);

    for (const candidate of nested) {
      if (candidate === null || candidate === undefined) continue;
      const cleaned = ("" + candidate).replace(/[^0-9.\-]+/g, "");
      const n = parseFloat(cleaned);
      if (Number.isFinite(n)) {
        displayPrice = n;
        break;
      }
    }
  }
  const displayKn = knDisplay || kn || titleKannada;
  const showKannada = Boolean(displayKn) && displayKn !== displayName;
  // Keep backward-compatibility: emoji prop still considered, otherwise use category/variety
  // emoji helper removed — centralized emoji rendering via `CategoryIcon`

  const addToBag = () => {
    const productToAdd = {
      ...product,
      id: product.id || product._id,
      price: displayPrice ?? 0,
      qty: 1,
      quantity: 1
    };
    addItem(productToAdd);
  };

  const handleClick = (e) => {
    // Prevent navigation if clicking on the card itself
    e.preventDefault();
    e.stopPropagation();
    
    if (onClick) {
      onClick(product);
      return;
    }
    addToBag();
    window.dispatchEvent(new Event("cart-updated"));
  };
  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToBag();
  };
  const baseStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    margin: 4,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
    cursor: "default",
    transition: "all 0.2s ease",
    aspectRatio: '1 / 1',
    padding: 0,
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 180,
    height: "100%",
  };

  const freshOverrides = {
    border: '1px solid rgba(0,255,198,0.12)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.94))',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 8
  };

  const mergedStyle = variant === 'fresh' ? { ...baseStyle, ...freshOverrides } : baseStyle;
  const finalStyle = { ...mergedStyle, ...style };

  return (
    <div
      className="product-card pc-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
      style={finalStyle}
    >
      {/* IMAGE + EMOJI */}
      <div
        className="pc-image"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleImageClick(e)}
        style={{
          width: "100%",
          aspectRatio: '1 / 1',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
          background: "#f6f6f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer"
        }}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={displayName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            {/* Centered icon overlay to match category icon style */}
            <span style={{
              position: "absolute",
              inset: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.2)'
            }}>
              <CategoryIcon name={displayName} category={categoryName} variety={variety} size={iconSizeBase} />
            </span>
          </>
        ) : (
          // Show icon large if no image
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CategoryIcon name={displayName} category={categoryName} variety={variety} size={iconSizeBase} />
          </div>
        )}
      </div>

      {/* NAME */}
      <h3 className="pc-title" style={titleStyle}>{displayName}</h3>

      {/* KANNADA NAME - show only when different to avoid duplicates */}
      {showKannada && <div className="pc-kn" style={knStyle}>{displayKn}</div>}

      {/* DESCRIPTION */}
      {description && (
        <p className="pc-desc" style={{ margin: 0, fontSize: 10, color: "#c8102e", textAlign: 'center' }}>
          {description}
        </p>
      )}

      {/* PRICE */}
      <div
        className="pc-price"
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#c8102e",
          textAlign: 'center',
          width: '100%'
        }}
      >
        {displayPrice !== null ? `₹${displayPrice}` : "—"}
      </div>
    </div>
  );
}



