import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../config/api";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function CustomerSubscriptionsPanel({ compact = false }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renewingId, setRenewingId] = useState(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("customerToken");
      const res = await fetch(`${API_BASE}/subscriptions`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load subscriptions");
      }
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load subscriptions");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const expiringSubscriptions = useMemo(
    () =>
      subscriptions.filter((subscription) => {
        const daysLeft = getDaysLeft(subscription.endDate);
        return subscription.status === "active" && daysLeft !== null && daysLeft <= 7;
      }),
    [subscriptions]
  );

  const renewSubscription = async (subscription) => {
    const productId = subscription?.Product?.id || subscription?.productId;
    if (!productId || !subscription?.period) {
      alert("This subscription cannot be renewed yet.");
      return;
    }

    setRenewingId(subscription.id);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("customerToken");
      const res = await fetch(`${API_BASE}/subscriptions`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId,
          period: subscription.period,
          renewExisting: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to renew subscription");
      }

      alert("Subscription renewed successfully.");
      await loadSubscriptions();
    } catch (err) {
      alert(err.message || "Failed to renew subscription");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div
      style={{
        marginTop: compact ? 16 : 24,
        marginBottom: compact ? 16 : 24,
        padding: compact ? 16 : 22,
        borderRadius: 18,
        background: "#fffdf0",
        border: "1px solid #f2d060",
        boxShadow: "0 10px 30px rgba(194, 120, 0, 0.08)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#5A3A00" }}>My Subscriptions</div>
          <div style={{ color: "#6b3f00", marginTop: 4 }}>
            Track start date, end date, active status, and renew before the cycle closes.
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "#fff3cd",
            color: "#8b5e00",
            fontWeight: 800
          }}
        >
          {subscriptions.length} active or past subscriptions
        </div>
      </div>

      {expiringSubscriptions.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 14,
            background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
            border: "1px solid rgba(200, 16, 46, 0.15)"
          }}
        >
          <div style={{ fontWeight: 900, color: "#9f1239", fontSize: 18 }}>Renew Before It Ends</div>
          <div style={{ color: "#7a2034", marginTop: 6, lineHeight: 1.6 }}>
            One or more subscriptions are close to expiry. Renew now so delivery continues without interruption.
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {expiringSubscriptions.map((subscription) => {
              const daysLeft = getDaysLeft(subscription.endDate);
              return (
                <div
                  key={`renew-${subscription.id}`}
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "#5A3A00" }}>
                      {subscription?.Product?.title || subscription?.Product?.name || "Subscription"}
                    </div>
                    <div style={{ color: "#7a2034", marginTop: 4 }}>
                      {daysLeft <= 0 ? "Expired recently" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`} | Ends on {formatDate(subscription.endDate)}
                    </div>
                  </div>
                  <button
                    onClick={() => renewSubscription(subscription)}
                    disabled={renewingId === subscription.id}
                    style={{
                      background: "#C8102E",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontWeight: 800,
                      cursor: renewingId === subscription.id ? "not-allowed" : "pointer"
                    }}
                  >
                    {renewingId === subscription.id ? "Renewing..." : "Renew Now"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {loading && <div style={{ color: "#6b3f00" }}>Loading subscriptions...</div>}
        {!loading && error && <div style={{ color: "#C8102E" }}>{error}</div>}
        {!loading && !error && subscriptions.length === 0 && (
          <div style={{ color: "#6b3f00" }}>No subscriptions yet. Your recurring deliveries will appear here once activated.</div>
        )}

        {!loading && !error && subscriptions.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {subscriptions.map((subscription) => {
              const daysLeft = getDaysLeft(subscription.endDate);
              return (
                <div
                  key={subscription.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    padding: 16,
                    border: "1px solid #f0e0a4",
                    display: "grid",
                    gridTemplateColumns: compact ? "1fr" : "minmax(220px, 1.2fr) minmax(150px, 0.7fr) minmax(150px, 0.7fr) minmax(150px, 0.7fr)",
                    gap: 12,
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#5A3A00" }}>
                      {subscription?.Product?.title || subscription?.Product?.name || "Subscription"}
                    </div>
                    <div style={{ color: "#8b5e00", marginTop: 4 }}>
                      {subscription.period?.replace("_", " ") || "Plan"} | Rs {Number(subscription.price || 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8b5e00", fontWeight: 800 }}>Start Date</div>
                    <div style={{ fontWeight: 700, color: "#5A3A00" }}>{formatDate(subscription.startDate)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8b5e00", fontWeight: 800 }}>End Date</div>
                    <div style={{ fontWeight: 700, color: "#5A3A00" }}>{formatDate(subscription.endDate)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8b5e00", fontWeight: 800 }}>Status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: subscription.status === "active" ? "#dcfce7" : "#f3f4f6",
                          color: subscription.status === "active" ? "#166534" : "#374151",
                          fontWeight: 800,
                          fontSize: 12,
                          textTransform: "capitalize"
                        }}
                      >
                        {subscription.status || "unknown"}
                      </span>
                      {daysLeft !== null && (
                        <span style={{ color: "#8b5e00", fontSize: 13 }}>
                          {daysLeft <= 0 ? "Cycle ended" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
