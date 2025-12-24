import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "20px", color: "#333" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Last updated: December 12, 2025</p>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>1. Information We Collect</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We collect information you provide directly to us when you create an account, place an order, 
          or communicate with us. This may include your name, email address, phone number, delivery address, 
          and payment information.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>2. How We Use Your Information</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We use the information we collect to:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Process and fulfill your orders</li>
          <li>Send you order confirmations and updates</li>
          <li>Respond to your comments and questions</li>
          <li>Improve our services and user experience</li>
          <li>Detect and prevent fraud</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>3. Information Sharing</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We do not sell your personal information. We may share your information with:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Suppliers to fulfill your orders</li>
          <li>Service providers who assist in our operations</li>
          <li>Law enforcement when required by law</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>4. Data Security</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We implement appropriate security measures to protect your personal information from unauthorized 
          access, alteration, disclosure, or destruction. However, no method of transmission over the Internet 
          is 100% secure.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>5. Your Rights</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          You have the right to:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>6. Cookies</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We use cookies and similar technologies to enhance your experience, analyze site usage, 
          and assist in our marketing efforts. You can control cookies through your browser settings.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>7. Contact Us</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p style={{ lineHeight: "1.6", color: "#555", marginTop: "10px" }}>
          Email: <a href="mailto:namaste@rrnagar.com" style={{ color: "#1976d2" }}>namaste@rrnagar.com</a><br />
          Phone: 98440 07900
        </p>
      </section>
    </div>
  );
}
