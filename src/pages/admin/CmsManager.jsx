import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageEditor from '../../components/admin/PageEditor';
import BannerManager from '../../components/admin/BannerManager';

export default function CmsManager() {
  const [pages, setPages] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    const res = await axios.get('/api/admin/cms/pages');
    setPages(res.data.data || []);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4 font-semibold">Admin CMS</h1>

      <div className="grid grid-cols-3 gap-4">
        
        {/* LEFT PANEL – PAGE LIST */}
        <div className="col-span-1 space-y-2">
          {pages.map((p) => (
            <button
              key={p.id}
              className={`w-full text-left px-3 py-2 rounded border ${
                selected?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
              onClick={() => setSelected(p)}
            >
              {p.title}
            </button>
          ))}

          <button
            className="w-full mt-4 py-2 bg-green-600 text-white rounded"
            onClick={() => setSelected({ id: null, title: 'New Page' })}
          >
            + Add New Page
          </button>
        </div>

        {/* RIGHT PANEL – PAGE EDITOR */}
        <div className="col-span-2">
          {selected ? (
            <PageEditor page={selected} refresh={fetchPages} />
          ) : (
            <div className="p-6 text-gray-500 border rounded">
              Select a page to edit
            </div>
          )}

          {/* Banners Section */}
          <div className="mt-6">
            <BannerManager />
          </div>
        </div>

      </div>
    </div>
  );
}
