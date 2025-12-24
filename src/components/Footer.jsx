import React, { useState } from "react";
import { Link } from "react-router-dom";
import PartnerModal from "./PartnerModal";
import "../components/Footer.css";

export default function Footer() {
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  return (
    <>
      <footer className="rn-footer">
        <div className="rn-footer-inner">

          {/* LEFT */}
          <div className="left">
            <div className="contact">
              Contact: Abhishek V, 98440 07900{" "}
              <a href="mailto:namaste@rrnagar.com">namaste@rrnagar.com</a> •
            </div>
          </div>

          {/* CENTER */}
          <div className="copyright">
            © {new Date().getFullYear()} RR Nagar. All rights reserved.
          </div>

          {/* RIGHT */}
          <div className="right">
            <a href="mailto:namaste@rrnagar.com" className="muted">Message</a>
            <Link to="/supplier/login" className="muted">Supplier</Link>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="muted partner-link-btn"
            >
              Partner
            </button>
            <Link to="/privacy" className="muted">Privacy</Link>
            <Link to="/terms" className="muted">Terms</Link>
          </div>

        </div>
      </footer>

      <PartnerModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </>
  );
}
