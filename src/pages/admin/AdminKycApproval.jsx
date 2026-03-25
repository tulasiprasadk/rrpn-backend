import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { BACKEND_BASE } from "../../config/api";
import "./AdminKycApproval.css";

export default function AdminKycApproval() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPendingSuppliers();
  }, []);

  const fetchPendingSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/suppliers");
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.suppliers)
          ? data.suppliers
          : [];
      setSuppliers(list.filter((supplier) => supplier?.status === "kyc_submitted"));
      setError("");
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError("You do not have permission to view pending suppliers.");
      } else {
        setError("Failed to load pending suppliers");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (supplierId) => {
    if (!confirm("Are you sure you want to approve this supplier?")) return;

    try {
      setActionLoading(true);
      await api.post(`/admin/suppliers/${supplierId}/approve`);
      alert("Supplier approved successfully!");
      setSelectedSupplier(null);
      fetchPendingSuppliers();
    } catch (err) {
      console.error("Error approving supplier:", err);
      alert(err.response?.data?.error || "Failed to approve supplier");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (supplierId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!confirm("Are you sure you want to reject this supplier?")) return;

    try {
      setActionLoading(true);
      await api.post(`/admin/suppliers/${supplierId}/reject`, {
        reason: rejectionReason
      });
      alert("Supplier rejected successfully!");
      setSelectedSupplier(null);
      setRejectionReason("");
      fetchPendingSuppliers();
    } catch (err) {
      console.error("Error rejecting supplier:", err);
      alert(err.response?.data?.error || "Failed to reject supplier");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="kyc-approval-container">
        <h1>KYC Approval</h1>
        <div className="loading">Loading pending suppliers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kyc-approval-container">
        <h1>KYC Approval</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="kyc-approval-container">
      <h1>KYC Approval Dashboard</h1>
      <p className="subtitle">Review and approve supplier registrations</p>

      {suppliers.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Approvals</h3>
          <p>All supplier registrations have been processed.</p>
        </div>
      ) : (
        <div className="suppliers-grid">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="supplier-card">
              <div className="card-header">
                <h3>{supplier.name}</h3>
                <span className="status-badge status-pending">Pending</span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <strong>Business Name:</strong>
                  <span>{supplier.businessName || "N/A"}</span>
                </div>

                <div className="info-row">
                  <strong>Phone:</strong>
                  <span>{supplier.phone}</span>
                </div>

                <div className="info-row">
                  <strong>Email:</strong>
                  <span>{supplier.email || "N/A"}</span>
                </div>

                <div className="info-row">
                  <strong>GST Number:</strong>
                  <span>{supplier.gstNumber || "N/A"}</span>
                </div>

                <div className="info-row">
                  <strong>PAN Number:</strong>
                  <span>{supplier.panNumber || "N/A"}</span>
                </div>

                <div className="info-row">
                  <strong>Registered:</strong>
                  <span>{formatDate(supplier.createdAt)}</span>
                </div>

                <div className="info-row">
                  <strong>Address:</strong>
                  <span>{supplier.address || "N/A"}</span>
                </div>

                {supplier.bankDetails && (
                  <div className="info-section">
                    <strong>Bank Details:</strong>
                    <div className="bank-details">
                      <span>Bank: {supplier.bankDetails.bankName || "N/A"}</span>
                      <span>A/C: {supplier.bankDetails.accountNumber || "N/A"}</span>
                      <span>IFSC: {supplier.bankDetails.ifsc || "N/A"}</span>
                    </div>
                  </div>
                )}

                <div className="documents-section">
                  <strong>KYC Documents:</strong>
                  <div className="documents-grid">
                    {supplier.businessLicense && (
                      <a 
                        href={`${BACKEND_BASE}/${supplier.businessLicense}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        📄 Business License
                      </a>
                    )}
                    {supplier.gstCertificate && (
                      <a 
                        href={`${BACKEND_BASE}/${supplier.gstCertificate}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        📄 GST Certificate
                      </a>
                    )}
                    {supplier.idProof && (
                      <a 
                        href={`${BACKEND_BASE}/${supplier.idProof}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        📄 ID Proof
                      </a>
                    )}
                    {!supplier.businessLicense && !supplier.gstCertificate && !supplier.idProof && (
                      <span className="no-docs">No documents uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="btn btn-view"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  Review Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSupplier && (
        <div className="modal-overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedSupplier(null)}
            >
              ×
            </button>

            <h2>Review Supplier Application</h2>
            <h3>{selectedSupplier.name}</h3>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <p><strong>Business Name:</strong> {selectedSupplier.businessName || "N/A"}</p>
                <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
                <p><strong>Email:</strong> {selectedSupplier.email || "N/A"}</p>
                <p><strong>Address:</strong> {selectedSupplier.address || "N/A"}</p>
              </div>

              <div className="detail-section">
                <h4>Business Details</h4>
                <p><strong>GST Number:</strong> {selectedSupplier.gstNumber || "N/A"}</p>
                <p><strong>PAN Number:</strong> {selectedSupplier.panNumber || "N/A"}</p>
              </div>

              {selectedSupplier.bankDetails && (
                <div className="detail-section">
                  <h4>Bank Details</h4>
                  <p><strong>Bank Name:</strong> {selectedSupplier.bankDetails.bankName || "N/A"}</p>
                  <p><strong>Account Number:</strong> {selectedSupplier.bankDetails.accountNumber || "N/A"}</p>
                  <p><strong>IFSC Code:</strong> {selectedSupplier.bankDetails.ifsc || "N/A"}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>KYC Documents</h4>
                <div className="documents-preview">
                  {selectedSupplier.businessLicense && (
                    <div className="doc-preview">
                      <strong>Business License</strong>
                      <a 
                        href={`${BACKEND_BASE}/${selectedSupplier.businessLicense}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="preview-link"
                      >
                        View Document →
                      </a>
                    </div>
                  )}
                  {selectedSupplier.gstCertificate && (
                    <div className="doc-preview">
                      <strong>GST Certificate</strong>
                      <a 
                        href={`${BACKEND_BASE}/${selectedSupplier.gstCertificate}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="preview-link"
                      >
                        View Document →
                      </a>
                    </div>
                  )}
                  {selectedSupplier.idProof && (
                    <div className="doc-preview">
                      <strong>ID Proof</strong>
                      <a 
                        href={`${BACKEND_BASE}/${selectedSupplier.idProof}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="preview-link"
                      >
                        View Document →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="action-section">
                <h4>Take Action</h4>
                
                <button
                  className="btn btn-approve"
                  onClick={() => handleApprove(selectedSupplier.id)}
                  disabled={actionLoading}
                >
                  ✓ Approve Supplier
                </button>

                <div className="reject-section">
                  <textarea
                    placeholder="Reason for rejection (required)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="rejection-textarea"
                  />
                  <button
                    className="btn btn-reject"
                    onClick={() => handleReject(selectedSupplier.id)}
                    disabled={actionLoading || !rejectionReason.trim()}
                  >
                    ✗ Reject Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



