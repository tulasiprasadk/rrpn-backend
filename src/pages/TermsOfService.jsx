import React from "react";

export default function TermsOfService() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "20px", color: "#333" }}>Terms of Service</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Last updated: December 12, 2025</p>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>1. Acceptance of Terms</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          By accessing and using RR Nagar's services, you accept and agree to be bound by the terms and 
          provisions of this agreement. If you do not agree to these terms, please do not use our services.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>2. User Accounts</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Provide accurate and complete information</li>
          <li>Update your information to keep it current</li>
          <li>Not share your account credentials</li>
          <li>Notify us immediately of any unauthorized use</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>3. Orders and Payments</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. 
          Prices are subject to change without notice. Payment must be made at the time of order placement or delivery 
          as specified.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>4. Delivery</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We strive to deliver products within the specified timeframe. However, delivery times are estimates and 
          not guaranteed. Risk of loss and title for products pass to you upon delivery to the carrier.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>5. Returns and Refunds</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          Returns and refunds are handled on a case-by-case basis. Please contact customer service within 24 hours 
          of delivery for any issues with your order. Perishable items may have different return policies.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>6. Supplier Terms</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          Suppliers agree to:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Provide accurate product information and pricing</li>
          <li>Maintain product quality and safety standards</li>
          <li>Fulfill orders in a timely manner</li>
          <li>Comply with all applicable laws and regulations</li>
          <li>Complete KYC verification and maintain valid documentation</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>7. Prohibited Activities</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          You agree not to:
        </p>
        <ul style={{ lineHeight: "1.8", color: "#555", marginLeft: "20px" }}>
          <li>Use the service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with the proper working of the service</li>
          <li>Submit false or misleading information</li>
          <li>Harass or harm other users or suppliers</li>
        </ul>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>8. Intellectual Property</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          All content on this platform, including text, graphics, logos, and images, is the property of RR Nagar 
          or its suppliers and is protected by copyright and trademark laws.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>9. Limitation of Liability</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          RR Nagar shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
          resulting from your use or inability to use the service.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>10. Changes to Terms</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          We reserve the right to modify these terms at any time. Your continued use of the service after changes 
          are posted constitutes acceptance of the modified terms.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>11. Governing Law</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall 
          be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
        </p>
      </section>

      <section style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "15px", color: "#444" }}>12. Contact Information</h2>
        <p style={{ lineHeight: "1.6", color: "#555" }}>
          For questions about these Terms of Service, please contact us at:
        </p>
        <p style={{ lineHeight: "1.6", color: "#555", marginTop: "10px" }}>
          Email: <a href="mailto:namaste@rrnagar.com" style={{ color: "#1976d2" }}>namaste@rrnagar.com</a><br />
          Phone: 98440 07900
        </p>
      </section>
    </div>
  );
}
