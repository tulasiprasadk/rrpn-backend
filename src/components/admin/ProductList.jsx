import React from 'react';
import axios from 'axios';

export default function ProductList({ products = [], onEdit, onRefresh }){

  async function doStatus(id, status){
    if (!confirm(`Change status to "${status}"?`)) return;
    try {
      await axios.put(`/api/admin/products/${id}`, { status });
      onRefresh && onRefresh();
    } catch (err) { console.error(err); alert('Error changing status'); }
  }

  async function removeProd(id){
    if (!confirm('Delete product?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      onRefresh && onRefresh();
    } catch (err) { console.error(err); alert('Error deleting'); }
  }

  return (
    <div>
      <ul>
        {products.map(p => (
          <li key={p.id} className="border-b py-2 flex justify-between items-center">
            <div onClick={()=>onEdit(p)} className="cursor-pointer">
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm">Vendor: {p.vendor_name || '—'}</div>
              <div className="text-sm">Price: ₹{p.price} • Stock: {p.stock} • Status: {p.status}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-sm" onClick={()=>doStatus(p.id, p.status === 'approved' ? 'disabled' : 'approved')}>
                {p.status === 'approved' ? 'Disable' : 'Approve'}
              </button>
              <button className="btn-sm" onClick={()=>onEdit(p)}>Edit</button>
              <button className="btn-danger" onClick={()=>removeProd(p.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
