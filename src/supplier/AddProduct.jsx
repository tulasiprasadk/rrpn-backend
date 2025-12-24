import React, { useState } from 'react';

export default function AddProduct() {
  const [name,setName] = useState('');
  const [basePrice,setBasePrice] = useState('');
  const [images,setImages] = useState([]);
  const [variants,setVariants] = useState([{ name:'Default', price:'', stock:0 }]);
  const API = process.env.REACT_APP_API_BASE;

  const addVariantRow = () => setVariants([...variants, { name:'', price:'', stock:0 }]);
  const updateVariant = (i, key, val) => {
    const copy = [...variants]; copy[i][key] = val; setVariants(copy);
  };

  const submit = async (e) => {
    e.preventDefault();
    // minimal validation
    if (!name || !basePrice) return alert('name & price required');
    const payload = {
      shopId: '000000000000000000000001', // replace with real shop id (or derive from logged in user)
      name, basePrice: Number(basePrice), images, variants: variants.map(v => ({ name:v.name, price: Number(v.price), stock: Number(v.stock) }))
    };
    const token = localStorage.getItem('token'); // expect supplier JWT
    const res = await fetch(`${API}/products`, { method:'POST', headers: { 'Content-Type':'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
    if (res.ok) {
      alert('Product submitted');
      setName(''); setBasePrice(''); setVariants([{ name:'Default', price:'', stock:0 }]);
    } else {
      const err = await res.json();
      alert('Error: ' + (err.message || 'unknown'));
    }
  };

  return (
    <div style={{ maxWidth:800, margin:20 }}>
      <h2>Add Product</h2>
      <form onSubmit={submit}>
        <div><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
        <div><label>Base price</label><input type="number" value={basePrice} onChange={e=>setBasePrice(e.target.value)} /></div>
        <div>
          <label>Variants</label>
          {variants.map((v,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input placeholder="Variant name" value={v.name} onChange={e=>updateVariant(i,'name',e.target.value)} />
              <input placeholder="Price" type="number" value={v.price} onChange={e=>updateVariant(i,'price',e.target.value)} />
              <input placeholder="Stock" type="number" value={v.stock} onChange={e=>updateVariant(i,'stock',e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addVariantRow}>Add variant</button>
        </div>
        <div style={{ marginTop:12 }}>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}
