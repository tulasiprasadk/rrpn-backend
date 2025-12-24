import React from "react";

function OrderSuccess() {
  const params = new URLSearchParams(window.location.search);
  const ids = params.get("ids");

  return (
    <div className="order-success">
      <h2>🎉 Order Placed Successfully!</h2>
      <p>Your order IDs:</p>
      <p>{ids}</p>

      <a href="/orders" className="go-orders">View Orders</a>
    </div>
  );
}

export default OrderSuccess;
