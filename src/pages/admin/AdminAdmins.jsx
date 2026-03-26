import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminAdmins() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "admin", autoApprove: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    try {
      setLoading(true);
      const res = await api.get("/admin/admins");
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        setAdmins(list);
        setError("");
        return;
      }

      if (admin) {
        setAdmins([{ ...admin, isApproved: true }]);
        setError("");
        return;
      }

      setAdmins([]);
      setError("");
    } catch (err) {
      console.error("Failed to load admins", err);
      if (admin) {
        setAdmins([{ ...admin, isApproved: true }]);
        setError("Showing current admin only");
      } else {
        setAdmins([]);
        setError(err.response?.data?.error || "Failed to load admins");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/admins", {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
        autoApprove: form.autoApprove
      });
      setForm({ name: "", email: "", phone: "", password: "", role: "admin", autoApprove: false });
      loadAdmins();
      alert('Admin created (may require super admin approval)');
    } catch (err) {
      console.error('Create admin failed', err);
      setError(err.response?.data?.error || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Manage Admins</h1>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h3>Create Admin</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
            <input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
            <input placeholder="Email (optional)" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
            <input placeholder="Mobile number (optional)" type="text" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
            <input placeholder="Password (paste generated password)" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
            <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={form.autoApprove} onChange={(e)=>setForm({...form,autoApprove:e.target.checked})} /> Auto-approve
            </label>
            <div>
              <button className="px-3 py-2 bg-green-600 text-white rounded" disabled={saving}>{saving ? 'Creating...' : 'Create Admin'}</button>
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </form>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Existing Admins</h3>
          {loading ? <div>Loading...</div> : (
            <table className="w-full border" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="p-2 border text-left">ID</th>
                  <th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-left">Email</th>
                  <th className="p-2 border text-left">Role</th>
                  <th className="p-2 border text-left">Approved</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td className="p-2 border">{a.id}</td>
                    <td className="p-2 border">{a.name}</td>
                    <td className="p-2 border">{a.email}</td>
                    <td className="p-2 border">{a.role}</td>
                    <td className="p-2 border">{a.isApproved ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
