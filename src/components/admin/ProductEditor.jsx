import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProductEditor({ product, onSaved }) {
  const empty = { id:null, vendor_id:'', title:'', slug:'', description:'', price:0, mrp:0, stock:0, sku:'', category_id:'', subcategory_id:'', images:[], status:'pending', featured:0 };
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState([]);

  useEffect(()=> {
    if (product) {
      // if product passed as object from list (lighter), fetch full product
      if (product.id && (!product.description || typeof product.images === 'undefined')) {
        axios.get(`/api/admin/products/${product.id}`).then(r => {
          setForm(r.data.data || empty);
        }).catch(()=> setForm(product));
      } else {
        setForm(product || empty);
      }
    } else setForm(empty);
    setFiles([]);
  }, [product]);

  function onFileChange(e){
    setFiles([...files, ...Array.from(e.target.files)]);
  }

  async function uploadFilesIfAny(productId){
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    await axios.put(`/api/admin/products/${productId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  async function save(){
    try {
      if (form.id) {
        // update
        await axios.put(`/api/admin/products/${form.id}`, {
          title: form.title, slug: form.slug, description: form.description,
          price: form.price, mrp: form.mrp, stock: form.stock, sku: form.sku,
          category_id: form.category_id, subcategory_id: form.subcategory_id,
          status: form.status, featured: form.featured
        });
        await uploadFilesIfAny(form.id);
      } else {
        // create (if uploading images with create, send as form-data)
        const fd = new FormData();
        fd.append('vendor_id', form.vendor_id);
        fd.append('title', form.title);
        fd.append('slug', form.slug);
        fd.append('description', form.description);
        fd.append('price', form.price);
        fd.append('mrp', form.mrp);
        fd.append('stock', form.stock);
        fd.append('sku', form.sku);
        fd.append('category_id', form.category_id || '');
        fd.append('subcategory_id', form.subcategory_id || '');
        fd.append('status', form.status || 'pending');
        fd.append('featured', form.featured ? 1 : 0);
        files.forEach(f => fd.append('images', f));
        const res = await axios.post('/api/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        // if created successfully - optionally reload or call onSaved
      }

      alert('Saved');
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    }
  }

  async function removeImage(imageUrl){
    if (!confirm('Remove this image?')) return;
    try {
      await axios.post(`/api/admin/products/${form.id}/remove-image`, { imageUrl });
      // update local images
      setForm({ ...form, images: (form.images || []).filter(i => i !== imageUrl) });
    } catch (err) { console.error(err); alert('Error removing image'); }
  }

  return (
    <div>
      <h2 className="text-xl mb-2">{form.id ? 'Edit Product' : 'Create Product'}</h2>

      <label>Vendor ID</label>
      <input value={form.vendor_id || ''} onChange={e=>setForm({...form, vendor_id: e.target.value})} placeholder="Vendor ID" />

      <label>Title</label>
      <input value={form.title || ''} onChange={e=>setForm({...form, title: e.target.value})} />

      <label>Slug</label>
      <input value={form.slug || ''} onChange={e=>setForm({...form, slug: e.target.value})} />

      <label>Description</label>
      <textarea value={form.description || ''} onChange={e=>setForm({...form, description: e.target.value})} />

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label>Price</label>
          <input type="number" value={form.price || 0} onChange={e=>setForm({...form, price: e.target.value})} />
        </div>
        <div>
          <label>MRP</label>
          <input type="number" value={form.mrp || 0} onChange={e=>setForm({...form, mrp: e.target.value})} />
        </div>
        <div>
          <label>Stock</label>
          <input type="number" value={form.stock || 0} onChange={e=>setForm({...form, stock: e.target.value})} />
        </div>
      </div>

      <label>SKU</label>
      <input value={form.sku || ''} onChange={e=>setForm({...form, sku: e.target.value})} />

      <label>Category ID</label>
      <input value={form.category_id || ''} onChange={e=>setForm({...form, category_id: e.target.value})} />
      <label>Subcategory ID</label>
      <input value={form.subcategory_id || ''} onChange={e=>setForm({...form, subcategory_id: e.target.value})} />

      <label>Featured</label>
      <input type="checkbox" checked={!!form.featured} onChange={e=>setForm({...form, featured: e.target.checked ? 1 : 0})} />

      <label>Status</label>
      <select value={form.status || 'pending'} onChange={e=>setForm({...form, status: e.target.value})}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="disabled">Disabled</option>
      </select>

      <div className="my-2">
        <label>Upload images (you can add multiple)</label>
        <input type="file" multiple onChange={onFileChange} />
      </div>

      <div className="grid grid-cols-6 gap-2">
        {(form.images || []).map(img => (
          <div key={img} className="p-1">
            <img src={img} alt="product" style={{width:120}} />
            <div>
              <button onClick={()=>removeImage(img)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button onClick={save} className="btn">Save Product</button>
      </div>
    </div>
  );
}
