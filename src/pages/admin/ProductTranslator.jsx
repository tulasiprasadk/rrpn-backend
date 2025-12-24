import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductTranslator() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingEnglish, setSavingEnglish] = useState(false);
  const [message, setMessage] = useState('');
  const [editEnglish, setEditEnglish] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products', { withCredentials: true });
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setMessage('Error loading products');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleTranslate = async () => {
    if (selectedIds.length === 0) {
      setMessage('Please select products to translate');
      return;
    }

    setLoading(true);
    setMessage('Translating...');

    try {
      const res = await axios.post('/api/admin/products/translate', {
        productIds: selectedIds
      }, { withCredentials: true });

      setTranslations(res.data.translations);
      setMessage(`Translated ${res.data.translations.length} products. Review and save.`);
    } catch (err) {
      console.error('Translation error:', err);
      setMessage('Translation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (translations.length === 0) {
      setMessage('No translations to save');
      return;
    }

    setSaving(true);
    setMessage('Saving...');

    try {
      const updates = translations.map(t => ({
        id: t.id,
        titleKannada: t.titleKannada,
        descriptionKannada: t.descriptionKannada
      }));

      const res = await axios.put('/api/admin/products/save-translation', {
        updates
      }, { withCredentials: true });

      const successCount = res.data.results.filter(r => r.success).length;
      setMessage(`Saved ${successCount} translations successfully!`);
      
      // Refresh products and clear selections
      await fetchProducts();
      setTranslations([]);
      setSelectedIds([]);
    } catch (err) {
      console.error('Save error:', err);
      setMessage('Save failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEnglish = async () => {
    if (translations.length === 0) {
      setMessage('No translations to save');
      return;
    }

    setSavingEnglish(true);
    setMessage('Saving English...');

    try {
      const updates = translations.map(t => ({
        id: t.id,
        title: t.titleOriginal,
        description: t.descriptionOriginal
      }));

      const res = await axios.put('/api/admin/products/save-english', {
        updates
      }, { withCredentials: true });

      const successCount = res.data.results.filter(r => r.success).length;
      setMessage(`Saved English for ${successCount} products!`);

      await fetchProducts();
    } catch (err) {
      console.error('Save English error:', err);
      setMessage('Save English failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingEnglish(false);
    }
  };

  const updateTranslation = (id, field, value) => {
    setTranslations(prev =>
      prev.map(t => t.id === id ? { ...t, [field]: value } : t)
    );
  };

  return (
    <div className="admin-products-container">
      <h2>🌐 Product Translator (English → Kannada)</h2>
      
      {message && (
        <div className={`message ${message.includes('Error') || message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleTranslate}
          disabled={loading || selectedIds.length === 0}
          style={{
            padding: '10px 20px',
            background: selectedIds.length === 0 ? '#ccc' : '#e31e24',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Translating...' : `Translate ${selectedIds.length} Selected`}
        </button>

        <button
          onClick={() => setEditEnglish(v => !v)}
          style={{
            padding: '10px 20px',
            background: editEnglish ? '#ffd600' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            fontWeight: '600'
          }}
        >
          {editEnglish ? 'English Editing: ON' : 'Enable English Editing'}
        </button>

        {translations.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {saving ? 'Saving...' : `Save ${translations.length} Translations`}
          </button>
        )}

        {translations.length > 0 && editEnglish && (
          <button
            onClick={handleSaveEnglish}
            disabled={savingEnglish}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: savingEnglish ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {savingEnglish ? 'Saving English...' : `Save English (${translations.length})`}
          </button>
        )}
      </div>

      {translations.length === 0 ? (
        <div>
          <h3>Select Products to Translate</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', width: '50px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(products.map(p => p.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr
                    key={product.id}
                    style={{
                      borderBottom: '1px solid #eee',
                      background: selectedIds.includes(product.id) ? '#fff3cd' : 'white'
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td style={{ padding: '10px', fontWeight: '600' }}>{product.title}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {product.description || '—'}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>
                      {product.Category?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h3>Review & Edit Translations</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            ✏️ Edit any translation before saving. Click "Save Translations" when ready.
          </p>
          <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
            {translations.map(trans => (
              <div
                key={trans.id}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #eee',
                  background: 'white'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                      English Title {editEnglish ? '✏️' : ''}
                    </label>
                    <input
                      type="text"
                      value={trans.titleOriginal || ''}
                      disabled={!editEnglish}
                      onChange={(e) => updateTranslation(trans.id, 'titleOriginal', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: editEnglish ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#f9f9f9',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '12px', color: '#e31e24', display: 'block', marginBottom: '5px' }}>
                      Kannada Title ✏️
                    </label>
                    <input
                      type="text"
                      value={trans.titleKannada || ''}
                      onChange={(e) => updateTranslation(trans.id, 'titleKannada', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e31e24',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>
                      English Description {editEnglish ? '✏️' : ''}
                    </label>
                    <textarea
                      value={trans.descriptionOriginal || ''}
                      disabled={!editEnglish}
                      onChange={(e) => updateTranslation(trans.id, 'descriptionOriginal', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: editEnglish ? '2px solid #007bff' : '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#f9f9f9',
                        fontSize: '13px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '12px', color: '#e31e24', display: 'block', marginBottom: '5px' }}>
                      Kannada Description ✏️
                    </label>
                    <textarea
                      value={trans.descriptionKannada || ''}
                      onChange={(e) => updateTranslation(trans.id, 'descriptionKannada', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '2px solid #e31e24',
                        borderRadius: '4px',
                        fontSize: '13px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
