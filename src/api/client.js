// frontend/src/api/client.js

const API_BASE = '/api';

export { API_BASE };

export async function post(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.status);
  }

  return res.json();
}

export async function get(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
  });

  if (!res.ok) throw new Error(res.status);
  return res.json();
}
