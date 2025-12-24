import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import JoditEditor from "jodit-react";

export default function PageEditor({ page, refresh }) {
  const editor = useRef(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (page?.id) {
      loadPage(page.id);
    } else {
      setTitle("");
      setSlug("");
      setContent("");
    }
  }, [page]);

  async function loadPage(id) {
    const res = await axios.get(`/api/admin/cms/pages/${id}`);
    const p = res.data.data;
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content);
  }

  async function savePage() {
    if (!title || !slug) {
      alert("Title and slug are required");
      return;
    }

    const payload = { title, slug, content };

    if (page?.id) {
      await axios.put(`/api/admin/cms/pages/${page.id}`, payload);
      alert("Page updated successfully");
    } else {
      await axios.post(`/api/admin/cms/pages`, payload);
      alert("Page created successfully");
    }

    refresh();
  }

  async function deletePage() {
    if (!page?.id) return;

    if (!window.confirm("Delete this page permanently?")) return;

    await axios.delete(`/api/admin/cms/pages/${page.id}`);
    alert("Page deleted");
    refresh();
  }

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-xl mb-4 font-semibold">
        {page?.id ? "Edit Page" : "Create New Page"}
      </h2>

      {/* Title */}
      <input
        type="text"
        className="w-full border p-2 rounded mb-3"
        placeholder="Page Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Slug */}
      <input
        type="text"
        className="w-full border p-2 rounded mb-3"
        placeholder="Slug (example: about-us)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      {/* Content Editor */}
      <JoditEditor
        ref={editor}
        value={content}
        onChange={(newContent) => setContent(newContent)}
      />

      <div className="flex gap-4 mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={savePage}
        >
          Save Page
        </button>

        {page?.id && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={deletePage}
          >
            Delete Page
          </button>
        )}
      </div>
    </div>
  );
}
