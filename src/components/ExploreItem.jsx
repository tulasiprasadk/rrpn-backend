// frontend/src/components/ExploreItem.jsx
import "./ExploreItem.css";

import React from "react";

const ExploreItem = React.forwardRef(function ExploreItem(
  { icon, title, titleKannada, onClick },
  ref
) {
  return (
    <div
      className="explore-card"
      onClick={onClick}
      ref={ref}
      style={{ cursor: "pointer" }}
    >
      <span className="explore-icon">{icon}</span>
      <h3 className="explore-title">{title}</h3>
      <div
        style={{
          color: "#c8102e",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {titleKannada}
      </div>
    </div>
  );
});

export default ExploreItem;
