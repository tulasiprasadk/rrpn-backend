import React, { useEffect, useState } from 'react';
const API = process.env.REACT_APP_API_BASE;

export default function ProductList() {
  const [items,setItems] = useState([]);
  useEffect(()=> {
    fetch(`${API}/products`)
      .then(r=>r.json()).then(setItems).catch(console.error);
  },[]);
  return (
    <div style={{ padding:16 }}>
      <h2>Products</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
        {items.map(p => (
          <div key={p._id} style={{ border:'1px solid #eee', padding:12 }}>
            <img src={p.images?.[0]} alt={p.name ? `Product image of ${p.name}` : 'Product image'} style={{ width:'100%', height:140, objectFit:'cover' }} />
            <h4>{p.name}</h4>
            <p>From ₹{p.basePrice}</p>
            <a href={`/product/${p._id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  );
}
