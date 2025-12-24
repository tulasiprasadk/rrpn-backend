import React, { useEffect, useState } from "react";
import { get, post } from "../api/client";
import { logoutSupplier, getSupplierToken } from "../supplier/auth";
import { parsePrice, applyMargin, formatPrice } from "../utils/price";

/**
 * Updated SupplierDashboard: redirect to /supplier/kyc if KYC incomplete.
 * Fallback: also respect localStorage flag "rrnagar_supplier_kyc_done" === "1"
 * so demo KYC (client-only) works during local development.
 */
export default function SupplierDashboard() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ title: "", price: "" });
  const [busy, setBusy] = useState(false);
  const [kycCompleted, setKycCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const profileRes = await get("/supplier/me");
        const profile = profileRes && (profileRes.data || profileRes) ? (profileRes.data || profileRes) : profileRes;
        if (!mounted) return;

        // Respect server-side kycCompleted OR local dev flag rrnagar_supplier_kyc_done === "1"
        const kyc = Boolean(profile?.kycCompleted) || (typeof window !== "undefined" && localStorage.getItem("rrnagar_supplier_kyc_done") === "1");
        setKycCompleted(kyc);

        if (!kyc) {
          // redirect supplier to KYC page if not completed
          window.location.href = "/supplier/kyc";
          return;
        }

        const res = await get("/supplier/products");
        const data = res && (res.data || res) ? (res.data || res) : [];
        const normalized = (Array.isArray(data) ? data : []).map((it) => {
          const supplierNum = parsePrice(it.supplier_price ?? it.price ?? it.price_display ?? it);
          const platformNum = applyMargin(supplierNum, 15);
          return { ...it, supplier_price: supplierNum, platform_price: platformNum };
        });
        setItems(normalized);
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load");
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  function handleLogout() {
    logoutSupplier();
    window.location.href = "/";
  }

  async function addListing(e) {
    e.preventDefault();
    if (!form.title.trim()) return alert("Enter title");
    setBusy(true);
    try {
      const supplierNum = parsePrice(form.price || "");
      const platformNum = applyMargin(supplierNum, 15);
      const payload = {
        title: form.title,
        supplier_price: supplierNum,
        platform_price: platformNum,
        price: supplierNum,
      };
      await post("/admin/products", payload, "supplier");

      // refresh
      const res = await get("/supplier/products");
      const data = res && (res.data || res) ? (res.data || res) : [];
      const normalized = (Array.isArray(data) ? data : []).map((it) => {
        const sNum = parsePrice(it.supplier_price ?? it.price ?? it);
        return { ...it, supplier_price: sNum, platform_price: applyMargin(sNum, 15) };
      });
      setItems(normalized);
      setForm({ title: "", price: "" });
    } catch (ex) {
      alert(ex.message || "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 980 }}>
      <h1>Supplier Portal</h1>

      {err && <div style={{ color: "#ffb4b4", marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "#ddd" }}>Token (demo):</div>
        <code style={{ background: "#0b0b0b", padding: "6px 10px", borderRadius: 6 }}>{getSupplierToken() || "not logged in"}</code>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={handleLogout} style={{ padding: "8px 12px", background: "#c8102e", color: "#fff", border: "none", borderRadius: 6 }}>
            Logout
          </button>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2>Your Listings</h2>
        {!items ? <p>Loading…</p> : items.length === 0 ? <p>No listings yet.</p> : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {items.map((it) => (
              <li key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#141414", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <strong>{it.title}</strong>
                  <div style={{ color: "#ddd" }}>
                    Supplier price: {formatPrice(it.supplier_price)} • Platform price (forecast): <strong>{formatPrice(it.platform_price)}</strong>
                  </div>
                </div>
                <div>{/* Edit/delete UI kept simple; not shown here */}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>Add Listing</h2>
        <form onSubmit={addListing} style={{ maxWidth: 520 }}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", padding: 8, marginBottom: 8 }} required />
          <input placeholder="Price (numeric or ₹...)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <div>
            <button type="submit" disabled={busy} style={{ padding: "8px 14px", background: "#ffd600", border: "none", cursor: "pointer" }}>
              {busy ? "Adding..." : "Add Listing"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
