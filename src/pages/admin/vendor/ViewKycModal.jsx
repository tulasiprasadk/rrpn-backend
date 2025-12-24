import React, { useState } from "react";
import axios from "axios";

export default function ViewKycModal({ vendor, close, reload }) {
  const [notes, setNotes] = useState("");

  const approve = async () => {
    await axios.post(`/api/admin/vendors/kyc/${vendor.id}/approve`, { notes });
    reload();
    close();
  };

  const reject = async () => {
    await axios.post(`/api/admin/vendors/kyc/${vendor.id}/reject`, { notes });
    reload();
    close();
  };

  const markOffline = async () => {
    await axios.post(`/api/admin/vendors/kyc/${vendor.id}/offline`, { notes });
    reload();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Vendor KYC Details</h2>

        <p><strong>Name:</strong> {vendor.name}</p>
        <p><strong>Phone:</strong> {vendor.phone}</p>
        <p><strong>Status:</strong> {vendor.kyc_status}</p>

        {/* Documents */}
        <div className="space-y-2">
          {vendor.kyc_document_url && (
            <div>
              <p className="font-semibold">ID Proof:</p>
              <img src={vendor.kyc_document_url} alt="ID Proof" className="w-32 h-auto rounded border" />
            </div>
          )}

          {vendor.shop_photo_url && (
            <div>
              <p className="font-semibold">Shop Photo:</p>
              <img src={vendor.shop_photo_url} alt="Shop" className="w-32 h-auto rounded border" />
            </div>
          )}
        </div>

        {/* Admin Notes */}
        <textarea
          className="w-full border rounded p-2 text-sm"
          placeholder="Admin notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 bg-gray-300 rounded" onClick={close}>
            Close
          </button>

          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={markOffline}>
            Mark Offline
          </button>

          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={reject}>
            Reject
          </button>

          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={approve}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
