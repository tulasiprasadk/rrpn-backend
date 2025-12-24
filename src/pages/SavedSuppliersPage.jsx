import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import "./SavedSuppliersPage.css";
import { Link } from "react-router-dom";

export default function SavedSuppliersPage() {
  // Dummy suppliers (Phase 1) — will be fetched from backend in Phase 2
  const suppliers = [
    {
      id: 1,
      name: "Super Grocery Store",
      category: "Groceries",
      location: "RR Nagar",
    },
    {
      id: 2,
      name: "RR Nagar Fresh Flowers",
      category: "Flowers",
      location: "BEML Layout",
    },
    {
      id: 3,
      name: "Pet Care Hospital",
      category: "Pet Services",
      location: "Ideal Homes",
    }
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">

        <h1 className="saved-title">❤️ Saved Suppliers</h1>

        <div className="suppliers-list">
          {suppliers.map(supplier => (
            <div key={supplier.id} className="supplier-card">
              
              <div className="supplier-info">
                <h2>{supplier.name}</h2>
                <p className="supplier-category">{supplier.category}</p>
                <p className="supplier-location">{supplier.location}</p>
              </div>

              <div className="supplier-actions">
                <Link to={`/supplier/${supplier.id}`} className="view-btn">
                  View →
                </Link>

                <button className="remove-btn">
                  Remove
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
