import React, { useEffect, useState } from 'react';

/*
  Props:
    initial = product object or null
    onSubmit(product) -> Promise
    onCancel()
*/
export default function AdminProductForm({ initial = null, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        price: initial.price != null ? String(initial.price) : '',
        imageUrl: initial.imageUrl || '',
      });
    } else {
      setForm({ name: '', description: '', price: '', imageUrl: '' });
    }
  }, [initial]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: form.price === '' ? null : Number(form.price),
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <label>
        Name
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </label>

      <label>
        Description
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>

      <label>
        Price (number)
        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </label>

      <label>
        Image URL
        <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      </label>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={saving} type="submit">{initial ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
