import "./HeroBanner.css";
import heroImg from "../assets/hero.png"; // Replace with your hero image

export default function HeroBanner() {
  return (
    <section className="hero-container">

      {/* Advertise Strip */}
      <div className="ad-strip">
        <div className="ad-scroll">
          🟡🔴 Advertise your shop • Deliver to all RR Nagar • Affordable pricing • 
          New businesses get 50% OFF on first month • Call us today! 🔴🟡
        </div>
      </div>

      {/* Main Banner */}
      <div className="hero-content">
        <div className="hero-left">
          <h1 className="hero-title">
            Welcome to <span>RR Nagar</span>
          </h1>

          <p className="hero-sub">
            Shop Local • Support Local • Discover everything in RR Nagar
          </p>

          {/* Search Bar */}
          <div className="hero-search">
            <input type="text" placeholder="Search for groceries, flowers, hotels..." />
            <button>Search</button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-right">
          <img src={heroImg} alt="RR Nagar Market" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
