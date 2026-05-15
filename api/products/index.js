    import { applyCors } from '../_utils';

export default function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 👉 Replace this with your real data source
  const products = [
    { id: 1, name: "Rice", price: 120 },
    { id: 2, name: "Wheat", price: 80 }
  ];

  return res.status(200).json(products);
}