import React from "react";

export default function Privacy() {
  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1>Privacy Notices</h1>
      <p>
        This page contains the privacy notices for RR ನಗರ. We collect minimal user data required to provide services,
        and we never sell user information. Below are the main points:
      </p>
      <ul>
        <li>We collect contact info (phone / email) when you submit forms.</li>
        <li>We use cookies only for essential site features and analytics.</li>
        <li>You may request deletion of your data by contacting us at hello@rrnagar.local.</li>
      </ul>

      <h2>Data retention</h2>
      <p>We retain data only as long as needed for the purpose it was collected or as required by law.</p>

      <h2>Contact</h2>
      <p>Questions about privacy? Email: <a href="mailto:hello@rrnagar.local">hello@rrnagar.local</a></p>
    </main>
  );
}
