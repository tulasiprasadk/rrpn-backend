import React from "react";
import "./MegaAd.css";

export default function MegaAd({ image, link, alt = "Ad", children, position = "left" }) {
  return (
    <div className={`mega-ad mega-ad-${position}`}>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {image ? <img src={image} alt={alt} loading="lazy" /> : children}
        </a>
      ) : image ? (
        <img src={image} alt={alt} loading="lazy" />
      ) : (
        children
      )}
    </div>
  );
}
