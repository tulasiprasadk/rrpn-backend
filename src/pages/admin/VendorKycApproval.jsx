import React, { useEffect, useState } from "react";
import axios from "axios";
import ViewKycModal from "../../components/admin/vendor/ViewKycModal";

export default function VendorKycApproval() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const res = await axios.get("/api/admin/vendors/kyc");
    setVendors(res.data.vendors);
  };

  const openVendor = async (id) => {
    const res = await axios.get(`/api/admin/vendors/kyc/${id}`);
    setSelectedVendor(res.data.vendor);
  };

  const closeModal = () => setSelectedVendor(null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Vendor KYC Approval</h1>

      <div className="bg-white shadow rounded-lg overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b">
                <td className="p-3 font-semibold">{v.name}</td>
                <td className="p-3">{v.phone}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-white ${
                      v.kyc_status === "approved"
                        ? "bg-green-600"
                        : v.kyc_status === "rejected"
                        ? "bg-red-600"
                        : v.kyc_status === "offline"
                        ? "bg-blue-600"
                        : "bg-yellow-500"
                    }`}
                  >
                    {v.kyc_status}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => openVendor(v.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    View KYC
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedVendor && (
        <ViewKycModal vendor={selectedVendor} close={closeModal} reload={loadVendors} />
      )}
    </div>
  );
}
