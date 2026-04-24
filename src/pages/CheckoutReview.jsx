import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { trackEvent } from "../utils/analytics";
import { readPendingSubscriptionDraft } from "../components/SubscriptionWidget";
import { normalizeSubscriptionCategory } from "../components/subscription/subscriptionConfig";
import "./CheckoutReview.mobile.css";

export default function CheckoutReview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [defaultAddress, setDefaultAddress] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddressLine, setGuestAddressLine] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestState, setGuestState] = useState("");
  const [guestPincode, setGuestPincode] = useState("");
  const [guestSave, setGuestSave] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [inlinePhone, setInlinePhone] = useState("");
  const [inlineAddressLine, setInlineAddressLine] = useState("");
  const [inlineCity, setInlineCity] = useState("");
  const [inlinePincode, setInlinePincode] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [checkoutOffers, setCheckoutOffers] = useState([]);
  const [checkoutAds, setCheckoutAds] = useState([]);
  const selectedAddress = location.state?.selectedAddress || defaultAddress;
  const pendingSubscriptionDraft = readPendingSubscriptionDraft();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        
        // Load address
        try {
          const res = await api.get("/customer/address");
          const list = Array.isArray(res.data) ? res.data : [];
          let def = list.find((a) => a.isDefault) || list[0] || null;

          setDefaultAddress(def || null);
        } catch (addrErr) {
          console.error("Address loading error:", addrErr);
          if (addrErr.response?.status === 401) {
            // Not logged in — enable guest checkout inline and show guest form
            setIsGuest(true);
            setShowGuestForm(true);
            setDefaultAddress(null);
          } else if (addrErr.code === 'ERR_NETWORK') {
            setError("Cannot connect to server. Please check if the backend is running.");
          } else if (addrErr.response?.status === 404) {
            // No address found, but do not block checkout
            setDefaultAddress(null);
          } else {
            setError(`Failed to load address: ${addrErr.response?.data?.error || addrErr.message}`);
          }
        }

        // Load cart from localStorage (prefer `bag` produced by CrackerCartContext)
        const bag = JSON.parse(localStorage.getItem("bag") || "null");
        if (Array.isArray(bag) && bag.length) {
          setCart(bag.map(i => ({ ...i, quantity: i.quantity || i.qty || 1 })));
        } else {
          const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
          setCart(Array.isArray(cartData) ? cartData.map(i => ({ ...i, quantity: i.quantity || i.qty || 1 })) : []);
        }

        // Load checkout offers + ads (public CMS)
        try {
          const [offersRes, adsRes] = await Promise.all([
            api.get("/cms/checkout-offers"),
            api.get("/cms/checkout-ads")
          ]);
          setCheckoutOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
          setCheckoutAds(Array.isArray(adsRes.data) ? adsRes.data : []);
        } catch (cmsErr) {
          console.error("Checkout CMS load error:", cmsErr);
        }

        // Load session guest addresses (if any) to prefill guest form
        try {
          const g = await api.get('/customer/address/guest');
          if (Array.isArray(g.data) && g.data.length) {
            const latest = g.data[g.data.length - 1];
            setGuestName(latest.name || '');
            setGuestPhone(latest.phone || '');
            setGuestAddressLine(latest.addressLine || '');
            setGuestCity(latest.city || '');
            setGuestState(latest.state || '');
            setGuestPincode(latest.pincode || '');
            setGuestSave(true);
          }
        } catch (ge) {
          // ignore if not available
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const effectiveCartTotal = pendingSubscriptionDraft?.pricing?.totalPayable
    ? Number(pendingSubscriptionDraft.pricing.totalPayable)
    : cartTotal;
  const totalAfterDiscount = Math.max(effectiveCartTotal - discount, 0);
  const selectedAddressText = selectedAddress
    ? [
        selectedAddress.addressLine,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.pincode ? `- ${selectedAddress.pincode}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  useEffect(() => {
    if (!loading && cart.length > 0) {
      trackEvent("begin_checkout", {
        currency: "INR",
        value: totalAfterDiscount,
        items: cart.length
      });
    }
  }, [loading, cart.length, totalAfterDiscount]);

  const placeOrder = async () => {
    if (!selectedAddress && !isGuest) {
      alert("Please select a delivery address or checkout as guest");
      return;
    }

    try {
      // Get cart items from localStorage (prefer `bag`)
      const bag = JSON.parse(localStorage.getItem("bag") || "null");
      const cart = Array.isArray(bag) && bag.length ? bag.map(i => ({ ...i, quantity: i.quantity || i.qty || 1 })) : JSON.parse(localStorage.getItem("cart") || "[]");

      if (!Array.isArray(cart) || cart.length === 0) {
        alert("Your bag is empty");
        return;
      }

      // Create order with first item (cart items may use different id keys)
      const firstItem = cart[0];
      let productId = firstItem && (firstItem.id || firstItem.productId || firstItem.product_id || (firstItem.product && (firstItem.product.id || firstItem.product._id)) || firstItem._id || firstItem.sku);
      // Coerce to number when possible
      if (productId != null && !isNaN(Number(productId))) productId = Number(productId);
      if (!productId) {
        alert('Invalid product in bag. Please re-add the item from the product page.');
        return;
      }

        const subscriptionCandidates = cart
          .map((item) => ({
            productId: item.id || item.productId,
            title: item.title || item.productName || "Product",
          basePrice: Number(item.price || 0),
          quantity: Number(item.quantity || item.qty || 1),
          category: normalizeSubscriptionCategory(item.category || item.categoryName || item.Category?.name || ""),
          unit: item.unit || ""
          }))
          .filter((item) => item.productId)
          .filter((item) => ["flowers", "groceries", "ration", "pet_services"].includes(item.category));

      if (!isGuest) {
        const order = {
          productId: productId,
          qty: firstItem.quantity || firstItem.qty || 1,
          subscriptionDraftId: pendingSubscriptionDraft?.id || null,
          addressId: selectedAddress.id,
          customerName: selectedAddress.name || "",
          customerPhone: selectedAddress.phone || "",
          customerAddress: selectedAddressText,
          promoCode: promoCode || null,
          discount: discount || 0,
        };
        const res = await api.post("/orders/create", order);
        trackEvent("add_shipping_info", {
          method: "saved_address",
          city: selectedAddress?.city || "",
          value: totalAfterDiscount
        });
        // Clear bag
        localStorage.setItem("bag", JSON.stringify([]));
        localStorage.setItem("cart", JSON.stringify([]));
        navigate("/payment", {
          state: {
            orderId: res.data.orderId,
            orderDetails: res.data,
            subscriptionDraft: pendingSubscriptionDraft || null,
            cartItems: cart,
            subscriptionCandidates,
          },
        });
        return;
      }

      // Guest flow
      const guestAddr = `${guestAddressLine || ''}${guestCity ? ', ' + guestCity : ''}${guestState ? ', ' + guestState : ''}${guestPincode ? ' - ' + guestPincode : ''}`.trim();
      if (isGuest) {
        if (!guestName?.trim() || !guestPhone?.trim() || !guestAddressLine?.trim()) {
          alert('Please fill name, phone and address to continue as guest');
          return;
        }
      }
      const guestOrder = {
        productId: productId,
        qty: firstItem.quantity || firstItem.qty || 1,
        customerName: guestName,
        customerPhone: guestPhone,
        customerAddress: guestAddr,
        promoCode: promoCode || null,
        discount: discount || 0,
      };
      console.debug('Creating guest order payload:', guestOrder);
      // If user opted to save guest address for this device, call session-backed endpoint
      if (guestSave) {
        try {
          await api.post('/customer/address/guest', {
            name: guestName,
            phone: guestPhone,
            addressLine: guestAddressLine,
            city: guestCity,
            state: guestState,
            pincode: guestPincode
          });
        } catch (e) {
          console.warn('Failed to save guest address to session:', e);
        }
      }

      const gres = await api.post("/orders/create-guest", guestOrder);
      trackEvent("add_shipping_info", {
        method: guestSave ? "guest_saved_session" : "guest",
        city: guestCity || "",
        value: totalAfterDiscount
      });
      localStorage.setItem("bag", JSON.stringify([]));
      localStorage.setItem("cart", JSON.stringify([]));
      navigate("/payment", {
        state: {
          orderId: gres.data.orderId,
          orderDetails: gres.data,
          subscriptionDraft: pendingSubscriptionDraft || null,
          cartItems: cart,
          subscriptionCandidates,
        },
      });
      
    } catch (err) {
      console.error("Order creation error:", err);
      alert("Failed to create order: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div
      className="checkout-review-root"
      style={{ padding: 20, background: '#FFFDE7', minHeight: '100vh', borderRadius: '18px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
    >
      <h2 style={{ background: '#FFF9C4', padding: '12px 0', borderRadius: '10px', textAlign: 'center', marginBottom: 18 }}>Checkout</h2>

      {loading && <div style={{ color: "#666" }}>Loading...</div>}

      {error && (
        <div style={{ color: "crimson", marginBottom: 12, padding: 8, border: "1px solid crimson", borderRadius: 4, background: '#FFF9C4' }}>
          {error}
          {error.includes("log in") && (
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigate("/login")}>Go to Login</button>
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <>
          <h3 style={{ background: '#FFF9C4', padding: '8px 0', borderRadius: '8px', textAlign: 'center', marginBottom: 12 }}>Delivery Address</h3>

          {selectedAddress ? (
            <div
              className="checkout-review-address-card"
              style={{
                border: "1px solid #ddd",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
                background: '#FFF9C4'
              }}
            >
              <strong>{selectedAddress.name}</strong> ({selectedAddress.phone})
              <br />
              {selectedAddress.addressLine}, {selectedAddress.city},{" "}
              {selectedAddress.state} - {selectedAddress.pincode}
            </div>
          ) : (
            <div>
              <p style={{ color: "crimson" }}>No delivery address selected.</p>
              {!isGuest && (
                <div>
                  <div className="inline-address-card" style={{ marginBottom: 8, padding: 16, border: '1px solid #eee', borderRadius: 10, background: '#fff', maxWidth: 560 }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold' }}>Name</label>
                      <input className="inline-input" value={inlineName} onChange={(e) => setInlineName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold' }}>Phone</label>
                      <input className="inline-input" value={inlinePhone} onChange={(e) => setInlinePhone(e.target.value)} placeholder="Phone number" />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ display: 'block', fontWeight: 'bold' }}>Address</label>
                      <input className="inline-input" value={inlineAddressLine} onChange={(e) => setInlineAddressLine(e.target.value)} placeholder="Street / house / locality" />
                    </div>
                    <div className="inline-address-row" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input className="inline-input" value={inlineCity} onChange={(e) => setInlineCity(e.target.value)} placeholder="City" />
                      <input className="inline-input" value={inlinePincode} onChange={(e) => setInlinePincode(e.target.value)} placeholder="Pincode" />
                    </div>
                    <div className="inline-address-actions" style={{ display: 'flex', gap: 8 }}>
                      <button className="inline-save-btn" onClick={async () => {
                        try {
                          if (!inlineName.trim() || !inlinePhone.trim() || !inlineAddressLine.trim()) {
                            alert('Please fill name, phone and address');
                            return;
                          }
                          const payload = {
                            name: inlineName,
                            phone: inlinePhone,
                            addressLine: inlineAddressLine,
                            city: inlineCity,
                            state: '',
                            pincode: inlinePincode || ''
                          };
                          const resp = await api.post('/customer/address', payload);
                          if (resp.data && resp.data.address) {
                            setDefaultAddress(resp.data.address);
                            trackEvent("add_shipping_info", {
                              method: "saved_address",
                              city: resp.data.address.city || payload.city || "",
                              value: totalAfterDiscount
                            });
                            alert('Address saved');
                          } else if (resp.data && resp.data.ok) {
                            // Some backends return ok:true and address in different shape
                            setDefaultAddress(resp.data);
                            trackEvent("add_shipping_info", {
                              method: "saved_address",
                              city: resp.data.city || payload.city || "",
                              value: totalAfterDiscount
                            });
                            alert('Address saved');
                          } else {
                            setDefaultAddress(payload);
                            trackEvent("add_shipping_info", {
                              method: "saved_address",
                              city: payload.city || "",
                              value: totalAfterDiscount
                            });
                            alert('Address saved');
                          }
                        } catch (e) {
                          console.error('Save address error:', e);
                          trackEvent("address_save_failed", {
                            reason: e.response?.data?.error || e.message || "unknown"
                          });
                          alert(`Failed to save address: ${e.response?.data?.error || e.message}`);
                        }
                      }} style={{ padding: '8px 12px' }}>Save & Use</button>
                      <button className="inline-manage-btn" onClick={() => navigate('/address')} style={{ padding: '8px 12px' }}>Manage Addresses</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => { setIsGuest(true); setShowGuestForm(true); }}>Checkout as guest</button>
                  </div>
                </div>
              )}

              {isGuest && !showGuestForm && (
                <div>
                  <button onClick={() => setShowGuestForm(true)}>Continue as guest</button>
                </div>
              )}

              {isGuest && showGuestForm && (
                <div className="checkout-review-guest-form guest-form-card" style={{ marginTop: 8, padding: 16, border: '1px solid #eee', borderRadius: 10, background: '#fff', maxWidth: 560 }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Name</label>
                    <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Phone</label>
                    <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontWeight: 'bold' }}>Address</label>
                    <input value={guestAddressLine} onChange={(e) => setGuestAddressLine(e.target.value)} placeholder="Street / house / locality" />
                  </div>
                    <div className="checkout-review-guest-grid checkout-review-guest-grid-compact" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: 8, marginBottom: 8 }}>
                    <input className="guest-input" value={guestCity} onChange={(e) => setGuestCity(e.target.value)} placeholder="City" />
                    <input className="guest-input" value={guestState} onChange={(e) => setGuestState(e.target.value)} placeholder="State" />
                    <input className="guest-input" value={guestPincode} onChange={(e) => setGuestPincode(e.target.value)} placeholder="Pincode" />
                    </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={guestSave} onChange={(e) => setGuestSave(e.target.checked)} />
                      <span style={{ fontSize: 13 }}>Save this address for this device</span>
                    </label>
                  </div>
                  <div>
                    <button onClick={() => setShowGuestForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="checkout-review-address-actions" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => isGuest ? setShowGuestForm(true) : navigate("/address")}
              style={{
                padding: '10px 16px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Change Address
            </button>
            <div style={{ flex: 1 }} />
          </div>

          <h3 style={{ background: '#FFF9C4', padding: '8px 0', borderRadius: '8px', textAlign: 'center', marginBottom: 12 }}>Order Summary</h3>

          <div
            className="checkout-review-layout"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 0.9fr)',
              gap: 24,
              alignItems: 'start'
            }}
          >
            <div className="checkout-review-items" style={{ minWidth: 0 }}>
              {cart.length === 0 ? (
                <p style={{ color: "#999" }}>Your bag is empty</p>
              ) : (
                <div className="checkout-review-cart" style={{ marginBottom: 20, background: '#FFF9C4', borderRadius: 10, padding: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="checkout-review-item"
                      style={{
                        border: "1px solid #eee",
                        padding: 10,
                        marginBottom: 10,
                        borderRadius: 6,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: '#FFFDE7'
                      }}
                    >
                      <div style={{ maxWidth: '70%' }}>
                        <strong style={{ display: 'block' }}>
                          {item.title || item.productName || `Product #${item.id}`}
                        </strong>
                        <div style={{ color: '#666', fontSize: 13 }}>Quantity: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: "bold", color: "#28a745" }}>
                        ₹{item.price ? (item.price * item.quantity).toFixed(2) : "N/A"}
                      </div>
                    </div>
                  ))}

                  {discount > 0 && (
                    <div style={{ textAlign: 'right', paddingTop: 8, fontSize: 13, color: '#28a745' }}>
                      Discount ({promoCode}): -₹{discount.toFixed(2)}
                    </div>
                  )}
                  <div style={{ textAlign: 'right', paddingTop: 10, borderTop: '1px dashed #e0e0e0', fontWeight: 700 }}>
                    Total: ₹{totalAfterDiscount.toFixed(2)}
                  </div>
                </div>
              )}

              {pendingSubscriptionDraft?.pricing && (
                <div style={{ marginBottom: 16, background: '#fff6cc', borderRadius: 10, padding: 12, border: '1px solid #f2d060' }}>
                  <div style={{ fontWeight: 800, color: '#5A3A00' }}>Subscription attached</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: '#6b3f00' }}>
                    {pendingSubscriptionDraft.pricing.durationLabel}
                    {pendingSubscriptionDraft.pricing.frequencyLabel ? ` | ${pendingSubscriptionDraft.pricing.frequencyLabel}` : ''}
                    {pendingSubscriptionDraft.pricing.planLabel ? ` | ${pendingSubscriptionDraft.pricing.planLabel}` : ''}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#8b5e00' }}>
                    {pendingSubscriptionDraft.pricing.itemCount} item{pendingSubscriptionDraft.pricing.itemCount === 1 ? '' : 's'} | Save â‚¹{Number(pendingSubscriptionDraft.pricing.savings || 0).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Promo Code Section */}
              <div style={{ marginTop: 16, background: '#FFF9C4', borderRadius: 10, padding: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Promo Code / Reference Code</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., WELCOME10)"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
                  />
                  <button
                    onClick={() => {
                      const code = promoCode.trim().toUpperCase();
                      const total = effectiveCartTotal;
                      const matchedOffer = checkoutOffers.find((offer) => (offer.code || "").toUpperCase() === code);
                      if (matchedOffer) {
                        const type = (matchedOffer.type || "percent").toLowerCase();
                        const value = Number(matchedOffer.value || 0);
                        const computed = type === "flat" ? value : (total * value) / 100;
                        setDiscount(Math.max(0, computed));
                        alert(`Promo code ${code} applied!`);
                      } else if (code) {
                        setDiscount(0);
                        alert('Invalid promo code. Please try again.');
                      }
                    }}
                    style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Apply
                  </button>
                </div>
                {promoCode && discount === 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    💡 Try codes: {checkoutOffers.map((o) => o.code).filter(Boolean).join(", ") || "None"}
                  </div>
                )}
              </div>

              <div className="checkout-review-cta" style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  onClick={placeOrder}
                  disabled={!((selectedAddress || isGuest) && cart.length > 0)}
                  style={{
                    padding: '12px 20px',
                    background: (selectedAddress || isGuest) && cart.length > 0 ? 'linear-gradient(90deg,#28a745,#1e7e34)' : '#e0e0e0',
                    color: (selectedAddress || isGuest) && cart.length > 0 ? 'white' : '#888',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    minWidth: 200,
                    cursor: (selectedAddress || isGuest) && cart.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: (selectedAddress || isGuest) && cart.length > 0 ? '0 6px 18px rgba(46,125,50,0.18)' : 'none'
                  }}
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>

            <aside className="checkout-review-sidebar" style={{ minWidth: 0, position: 'sticky', top: 20 }}>
              <div style={{ background: 'white', padding: 16, borderRadius: 14, boxShadow: '0 8px 22px rgba(0,0,0,0.05)', marginBottom: 14 }}>
                <h4 style={{ margin: '0 0 12px' }}>Payable Now</h4>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>Products</span>
                    <strong>₹{cartTotal.toFixed(2)}</strong>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#2e7d32' }}>
                      <span>Discount</span>
                      <strong>-₹{discount.toFixed(2)}</strong>
                    </div>
                  )}
                  {pendingSubscriptionDraft?.pricing?.totalPayable ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#9a3412' }}>
                      <span>Subscription attached</span>
                      <strong>₹{Number(pendingSubscriptionDraft.pricing.totalPayable).toFixed(2)}</strong>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 10, borderTop: '1px dashed #e7c86f' }}>
                    <span style={{ fontWeight: 800 }}>Total</span>
                    <strong style={{ fontSize: 22, color: '#C8102E' }}>₹{totalAfterDiscount.toFixed(2)}</strong>
                  </div>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={!((selectedAddress || isGuest) && cart.length > 0)}
                  style={{
                    marginTop: 14,
                    width: '100%',
                    padding: '12px 16px',
                    background: (selectedAddress || isGuest) && cart.length > 0 ? 'linear-gradient(90deg,#28a745,#1e7e34)' : '#e0e0e0',
                    color: (selectedAddress || isGuest) && cart.length > 0 ? 'white' : '#888',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700
                  }}
                >
                  Proceed to Payment
                </button>
              </div>

              <div style={{ background: 'white', padding: 14, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 8px' }}>Special Offers</h4>
                {checkoutOffers.length === 0 ? (
                  <p style={{ margin: 0, color: '#555' }}>No active offers right now.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#555' }}>
                    {checkoutOffers.map((offer, idx) => (
                      <li key={`${offer.code || offer.title || idx}`} style={{ marginBottom: 6 }}>
                        <strong>{offer.title || offer.code}</strong>
                        {offer.description ? ` — ${offer.description}` : ""}
                        {offer.code ? (
                          <>
                            {" "}Use code <strong>{offer.code}</strong>.
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ background: '#fff8e1', padding: 14, borderRadius: 10, border: '1px solid #ffe082', marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 8px' }}>Advertisements</h4>
                {checkoutAds.length === 0 ? (
                  <div style={{ height: 120, background: 'linear-gradient(90deg,#ffd54f,#ffb300)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a2b00', fontWeight: 700 }}>
                    Advertise here — reach local customers
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {checkoutAds.map((ad, idx) => (
                      <a
                        key={`${ad.title || ad.image || idx}`}
                        href={ad.link || "#"}
                        target={ad.link ? "_blank" : undefined}
                        rel={ad.link ? "noreferrer" : undefined}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div style={{ background: '#fff3cd', borderRadius: 8, padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                          {ad.image ? (
                            <img src={ad.image} alt={ad.title || "Ad"} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 72, height: 72, background: '#ffe082', borderRadius: 6 }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 700 }}>{ad.title || "Advertisement"}</div>
                            <div style={{ color: "#5d4b00", fontSize: 12 }}>{ad.text || ""}</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: 'white', padding: 14, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 8px' }}>Quote of the day</h4>
                <blockquote style={{ margin: 0, color: '#444', fontStyle: 'italic' }}>
                  "Support local — small purchases, big impact." — RR Nagar
                </blockquote>
              </div>
            </aside>
          </div>

          <div className="checkout-review-mobile-cta">
            <div className="checkout-review-mobile-total">Total: ₹{totalAfterDiscount.toFixed(2)}</div>
            <button
              onClick={placeOrder}
              disabled={!((selectedAddress || isGuest) && cart.length > 0)}
            >
              Proceed to Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
}



