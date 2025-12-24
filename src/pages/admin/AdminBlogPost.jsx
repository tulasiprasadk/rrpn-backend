import React, { useState } from "react";

export default function AdminBlogPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Replace with real API call
    setMessage("Blog post submitted (stub, connect to backend API)");
    setTitle("");
    setContent("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>Post a New Blog</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={8}
            style={{ width: "100%", marginBottom: 12 }}
          />
        </div>
        <button type="submit">Post Blog</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}
