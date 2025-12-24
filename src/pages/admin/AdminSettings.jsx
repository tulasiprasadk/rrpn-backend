import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminSettings() {
  const [kycEnabled, setKycEnabled] = useState(true);

  useEffect(() => {
    axios.get("/api/admin/settings/kyc-toggle").then((res) => {
      setKycEnabled(res.data.onlineKycEnabled);
    });
  }, []);

  const toggleKyc = async () => {
    const newValue = !kycEnabled;
    await axios.post("/api/admin/settings/kyc-toggle", { enabled: newValue });
    setKycEnabled(newValue);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin Settings</h1>

      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Vendor KYC Settings</h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={kycEnabled} onChange={toggleKyc} />
          <span>Enable Online KYC</span>
        </label>

        <p className="text-gray-500 text-sm mt-2">
          {kycEnabled
            ? "Vendors can upload documents online."
            : "KYC is handled offline — vendors cannot upload documents."}
        </p>
      </div>
    </div>
  );
}
