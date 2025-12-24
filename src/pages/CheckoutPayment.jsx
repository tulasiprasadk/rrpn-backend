import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Payment.css";

export default function CheckoutPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  // get order amount passed from previous step
  const amount = location.state?.amount || 0;
  const orderId = location.state?.orderId;

  const [unr, setUnr] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // HANDLE SCREENSHOT UPLOAD
  const handleImage = (e) => {
    const img = e.target.files[0];
    if (!img) return;

    // preview
    setPreview(URL.createObjectURL(img));
    setFile(img);
  };

  // SUBMIT PAYMENT
  const handleSubmit = async () => {
    if (!unr || unr.length < 6) {
      alert("Please enter a valid UNR number (min 6 chars).");
      return;
    }

    if (!file) {
      alert("Please upload your payment screenshot.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("paymentScreenshot", file);
    formData.append("unr", unr);
    if (orderId) formData.append("orderId", String(orderId));

    try {
      const res = await axios.post(
        "/api/orders/submit-payment",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Redirect to success screen
      navigate("/payment/submitted", {
        state: {
          unr,
          screenshot: preview,
          amount,
        },
      });

    } catch (err) {
      console.error(err);
      alert("Something went wrong while submitting payment.");
    }

    setLoading(false);
  };

  return (
    <div className="payment-page">

      <h2>Complete Your Payment</h2>

      {/* PAYMENT INSTRUCTIONS */}
      <div className="payment-instructions">
        <h3>Step 1: Make Payment</h3>

        <p>Use the UPI ID below or scan the QR:</p>

        <div className="upi-box">
          <strong>UPI ID:</strong> rrnagar@upi
        </div>

        <img src="/qr.png" alt="QR Code" className="qr-img" />

        <p className="note">
          After payment, upload the screenshot and enter the UNR number.
        </p>
      </div>

      {/* UNR INPUT */}
      <div className="unr-box">
        <label>Enter UNR Number*</label>
        <input
          type="text"
          placeholder="Enter UNR number"
          value={unr}
          onChange={(e) => setUnr(e.target.value)}
        />
      </div>

      {/* SCREENSHOT UPLOAD */}
      <div className="screenshot-box">
        <label>Upload Screenshot*</label>

        {preview ? (
          <div className="preview-block">
            <img src={preview} className="preview-img" />
            <button
              type="button"
              className="upload-again"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
            >
              Upload Again
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
          />
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="submit-payment-btn"
      >
        {loading ? "Submitting..." : "Submit Payment"}
      </button>
    </div>
  );
}
