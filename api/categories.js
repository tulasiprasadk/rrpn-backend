import { applyCors } from './_utils';

export default async function handler(req, res) {
  // Handle CORS and OPTIONS preflight
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const categories = [
    { id: 1, name: "Technology" },
    { id: 2, name: "Environment" }
  ];

  return res.status(200).json(categories);
}