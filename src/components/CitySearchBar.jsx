// src/components/CitySearchBar.jsx
import "./CitySearchBar.css";

export default function CitySearchBar() {
  return (
    <div className="search-wrapper">
      <div className="search-title">Search RR Nagar</div>

      <div className="search-bar">
        <input 
          type="text" 
          ="Search groceries, flowers, services, restaurants…" 
        />
        <button>Search</button>
      </div>
    </div>
  );
}
