import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/admin/users");
        const nextUsers = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
        console.log("[AdminUsers] loaded", nextUsers.length);
        if (mounted) {
          setUsers(nextUsers);
        }
      } catch (err) {
        console.error("[AdminUsers] load failed", err?.response?.data || err);
        if (mounted) {
          setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to load users");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-5">Users</h1>

      {error ? (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      ) : null}

      <table className="w-full border" style={{ tableLayout: "fixed" }}>
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2" style={{ width: "28%" }}>Name</th>
            <th className="border p-2" style={{ width: "28%" }}>Phone / Email</th>
            <th className="border p-2" style={{ width: "24%" }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="border p-2 text-center" colSpan={3}>Loading users...</td>
            </tr>
          ) : null}

          {!loading && users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.name || "Guest / Unnamed"}</td>
              <td className="border p-2">{user.mobile || user.email || "-"}</td>
              <td className="border p-2">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
              </td>
            </tr>
          ))}

          {!loading && !users.length ? (
            <tr>
              <td className="border p-2 text-center" colSpan={3}>No users found.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
