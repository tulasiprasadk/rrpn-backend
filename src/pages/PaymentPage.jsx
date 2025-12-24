import { useState } from "react";
import axios from "axios";
import imageCompression from "browser-image-compression";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const [method, setMethod] = useState("upi");
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderId = state?.orderId;
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState(null);
  const [uploadedPath, setUploadedPath] = useState("");

  // ------------------------------
  // Compress Image Before Upload
  // ------------------------------
  const compressImage = async (imageFile) => {
    const options = {
      maxSizeMB: 0.4,        // 400 KB max (you can adjust)
      maxWidthOrHeight: 1280, // Resize to reasonable resolution
      useWebWorker: true
    };

    try {
      const compressed = await imageCompression(imageFile, options);
      console.log(
        "Original Size:",
        (imageFile.size / 1024 / 1024).toFixed(2),
        "MB"
      );
      console.log(
        "Compressed Size:",
        (compressed.size / 1024 / 1024).toFixed(2),
        "MB"
      );
      return compressed;
    } catch (err) {
      console.error("Compression failed:", err);
      return imageFile; // fallback if compression fails
    }
  };


  // ------------------------------
  // Submit Payment (Screenshot or UNR)
  // ------------------------------
  const submitPayment = async () => {
    if (!file && !txnId) {
      alert("Please provide either a payment screenshot or a transaction ID.");
      return;
    }

    const form = new FormData();
    form.append("orderId", orderId);
    if (file) {
      // Compress image before upload
      const compressed = await compressImage(file);
      form.append("paymentScreenshot", compressed);
    }
    if (txnId) {
      form.append("unr", txnId);
    }

    try {
      await axios.post("/api/orders/submit-payment", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      navigate("/payment-success", {
        state: {
          orderId: orderId,
          txnId: txnId,
          screenshot: file ? URL.createObjectURL(file) : "",
          paymentMethod: method
        }
      });
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert(
        error?.response?.data?.msg || "Failed to submit payment. Please try again."
      );
    }
  };

  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      background: '#fff',
      minHeight: '80vh'
    }}>

      <h2 style={{ 
        color: '#333', 
        marginBottom: '10px',
        fontSize: '28px'
      }}>
        Complete Your Payment
      </h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 17, marginRight: 18 }}>
          <input type="radio" value="upi" checked={method === "upi"} onChange={() => setMethod("upi")}/> UPI
        </label>
        <label style={{ fontWeight: 600, fontSize: 17 }}>
          <input type="radio" value="pi" checked={method === "pi"} onChange={() => setMethod("pi")}/> Pi Network
        </label>
      </div>

      {method === "upi" && (
        <div style={{ background: '#e6f7ff', padding: 18, borderRadius: 10, marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Pay via UPI</h3>
          <div style={{ margin: '12px 0' }}>
            <img src="/upi-qr-placeholder.png" alt="UPI QR" style={{ width: 160, height: 160, borderRadius: 8, border: '1.5px solid #007bff' }} />
          </div>
          <div style={{ fontSize: 16, marginBottom: 6 }}>UPI ID: <b>yourupi@bank</b> <button style={{ marginLeft: 8, fontSize: 13 }} onClick={() => {navigator.clipboard.writeText('yourupi@bank');}}>Copy</button></div>
          <div style={{ fontSize: 14, color: '#555' }}>Scan the QR or pay to the UPI ID above. Then upload your payment screenshot and enter the UPI transaction ID below.</div>
        </div>
      )}
      {method === "pi" && (
        <div style={{ background: '#f3e6ff', padding: 18, borderRadius: 10, marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Pay via Pi Network</h3>
          <div style={{ fontSize: 16, margin: '12px 0' }}>Send payment to: <b>your-pi-username</b></div>
          <div style={{ fontSize: 14, color: '#555' }}>Open the Pi Network app, send the payment, then upload your screenshot and enter the Pi transaction ID below.</div>
        </div>
      )}

      <div style={{ 
        background: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '12px',
        marginBottom: '25px'
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Step 1: Upload Payment Screenshot</h3>
        
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{
            padding: '10px',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            width: '100%',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
        />


      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '25px', 
        borderRadius: '12px'
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Step 2: Enter Transaction ID</h3>
        <input
          type="text"
          placeholder={method === 'upi' ? 'Enter UPI Transaction ID' : 'Enter Pi Transaction ID'}
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={{ 
            padding: '12px', 
            width: '100%',
            border: '2px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px',
            marginBottom: '15px'
          }}
        />
        <button 
          onClick={submitPayment} 
          style={{ 
            padding: '14px 28px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          ✅ Submit Payment
        </button>
      </div>

      <div style={{ 
        marginTop: '25px', 
        padding: '15px', 
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
          💡 <strong>Tip:</strong> Make sure your UNR number is correct. You will receive confirmation once payment is verified.
        </p>
      </div>
    </div>
  );
}
