import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSubmitted.css";

export default function PaymentSubmitted() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <div className="payment-submitted-page">
      <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
        
        <h2 style={{ color: '#28a745', marginBottom: '20px', fontSize: '28px' }}>
          Thank You for Your Order!
        </h2>

        <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          Your payment has been submitted successfully and is under review.
        </p>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '25px', 
          borderRadius: '12px',
          border: '2px solid #e9ecef',
          marginBottom: '30px'
        }}>
          {state?.orderId && (
            <p style={{ marginBottom: '15px' }}>
              <strong>Order ID:</strong> <span style={{ color: '#007bff' }}>#{state.orderId}</span>
            </p>
          )}
          
          {state?.unr && (
            <p style={{ marginBottom: '15px' }}>
              <strong>UNR Number:</strong> <span style={{ color: '#007bff' }}>{state.unr}</span>
            </p>
          )}

          {state?.screenshot && (
            <div style={{ marginTop: '20px' }}>
              <img 
                src={state.screenshot} 
                alt="Payment proof" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }} 
              />
            </div>
          )}
        </div>

        <div style={{ 
          background: '#fff3cd', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #ffc107',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '15px', fontSize: '18px' }}>📦 What Happens Next?</h3>
          <ul style={{ color: '#856404', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Once your payment is confirmed, we will process your order immediately</li>
            <li>You will receive a notification when payment is verified</li>
            <li>Our team will ensure your products/services are delivered as per schedule</li>
            <li>You can track your order status in the "My Orders" section</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: '12px 30px',
              background: '#ffd600',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#333'
            }}
          >
            🏠 Go to Home
          </button>
          
          <button
            onClick={() => navigate("/my-orders")}
            style={{
              padding: '12px 30px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📋 View My Orders
          </button>
        </div>

        <p style={{ marginTop: '30px', color: '#999', fontSize: '14px' }}>
          Need help? Contact us at support@rrnagar.com
        </p>
      </div>
    </div>
  );
}
