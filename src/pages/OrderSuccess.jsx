import { useSearchParams, Link } from "react-router-dom";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div>
      <h2>Order Placed Successfully 🎉</h2>
      <p>Your Order ID: <b>{orderId}</b></p>

      <Link to="/my-orders">View My Orders</Link>
    </div>
  );
}
