import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
const API = process.env.REACT_APP_API_BASE;

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  useEffect(()=>{
    fetch(`${API}/products/${id}`).then(r=>r.json()).then(setProduct).catch(console.error);
  },[id]);

  if (!product) return <div>Loading…</div>;
  const variant = product.variants?.[selectedVariantIndex] || {};
  return (
    <div style={{ padding:16, maxWidth:900, margin:'0 auto' }}>
      <h1>{product.name}</h1>
      <div style={{ display:'flex', gap:20 }}>
        <img src={product.images?.[0]} alt="" style={{ width:320, height:320, objectFit:'cover' }} loading="lazy" />
        <div>
          <p>{product.description}</p>
          <p>Price: ₹{variant.price ?? product.basePrice}</p>
          <div>
            <label>Variants</label>
            {product.variants?.map((v, i) => (
              <button key={i} onClick={() => setSelectedVariantIndex(i)} style={{ margin:4 }}>
                {v.name} {v.stock === 0 ? '(OUT)' : ''}
              </button>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <button disabled={variant.stock === 0}>Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
