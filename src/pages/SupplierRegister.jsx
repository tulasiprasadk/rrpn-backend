import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SupplierRegister.css";

export default function SupplierRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    bankDetails: {
      accountNumber: "",
      ifsc: "",
      bankName: ""
    },
    acceptedTnC: false
  });

  const [files, setFiles] = useState({
    businessLicense: null,
    gstCertificate: null,
    idProof: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: fileList[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validation
      if (!form.name || !form.phone || !form.email) {
        throw new Error("Please fill all required fields");
      }

      if (!form.businessName) {
        throw new Error("Shop/Business name is mandatory");
      }

      if (!files.idProof) {
        throw new Error("Aadhaar card upload is mandatory");
      }

      if (!form.acceptedTnC) {
        throw new Error("Please accept Terms & Conditions");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("businessName", form.businessName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("gstNumber", form.gstNumber);
      formData.append("panNumber", form.panNumber);
      formData.append("bankDetails", JSON.stringify(form.bankDetails));
      formData.append("acceptedTnC", form.acceptedTnC);

      // Append files
      if (files.businessLicense) {
        formData.append("businessLicense", files.businessLicense);
      }
      if (files.gstCertificate) {
        formData.append("gstCertificate", files.gstCertificate);
      }
      if (files.idProof) {
        formData.append("idProof", files.idProof);
      }

      const response = await axios.post("/api/suppliers/register", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess(response.data.message || "Registration successful! Please wait for admin approval.");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/supplier/login");
      }, 3000);

    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.error || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-register">
      <div className="register-container">
        <h1>Supplier Registration</h1>
        <p className="subtitle">Register your business with RR Nagar</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Owner Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Shop/Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                placeholder="Enter business/shop name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Business Address *</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter complete business address"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Business Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="form-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Bank Details</h3>
            
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankDetails.bankName}
                onChange={handleBankDetailsChange}
                placeholder="Enter bank name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.bankDetails.accountNumber}
                  onChange={handleBankDetailsChange}
                  placeholder="Enter account number"
                />
              </div>

              <div className="form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifsc"
                  value={form.bankDetails.ifsc}
                  onChange={handleBankDetailsChange}
                  placeholder="SBIN0001234"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>KYC Documents</h3>
            <p className="info-text">Upload clear images or PDF (max 5MB each)</p>
            
            <div className="form-group">
              <label>Aadhaar Card (Soft Copy) *</label>
              <input
                type="file"
                name="idProof"
                onChange={handleFileChange}
                accept="image/*,.pdf"
                required
              />
              <small style={{ color: "#666", display: "block", marginTop: 5 }}>Mandatory - Upload clear copy of Aadhaar card</small>
            </div>

            <div className="form-group">
              <label>Business License</label>
              <input
                type="file"
                name="businessLicense"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
            </div>

            <div className="form-group">
              <label>GST Certificate</label>
              <input
                type="file"
                name="gstCertificate"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="acceptedTnC"
                  checked={form.acceptedTnC}
                  onChange={handleChange}
                  required
                />
                <span>I accept the Terms & Conditions and Privacy Policy *</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Register"}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate("/supplier/login")}
            >
              Already Registered? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
