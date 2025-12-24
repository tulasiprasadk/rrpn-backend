import { useEffect, useState } from "react";
import axios from "axios";

export default function PricingSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await axios.get("/api/admin/pricing");
      setSettings(res.data.settings);
    } catch (err) {
      console.error("Failed to load pricing settings:", err);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      await axios.put("/api/admin/pricing", {
        minimum_order_amount: settings.minimum_order_amount,
      });

      alert("Pricing settings updated!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to update settings.");
    }
    setSaving(false);
  }

  if (!settings) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Pricing Settings</h1>

      <div className="admin-card p-4 max-w-md">
        <label className="block font-medium mb-1">Minimum Order Amount (₹)</label>
        <input
          type="number"
          className="admin-input"
          value={settings.minimum_order_amount}
          onChange={(e) =>
            setSettings({ ...settings, minimum_order_amount: e.target.value })
          }
        />

        <button
          className="admin-button primary mt-4"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
