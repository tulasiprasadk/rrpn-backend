import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { logout } = useAuth();
  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin Dashboard</h2>
        <div>
          <button onClick={logout} style={{ marginLeft: 8 }}>Sign out</button>
        </div>
      </header>

      <main style={{ marginTop: 20 }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/products">Manage Products</Link>
        </nav>

        <section style={{ marginTop: 20 }}>
          <p>Use the links above to manage products.</p>
        </section>
      </main>
    </div>
  );
}
