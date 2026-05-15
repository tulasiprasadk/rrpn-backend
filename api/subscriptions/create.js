import { applyCors, getBody } from '../_utils';

export default async function handler(req, res) {
  // 1. Handle CORS Preflight
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Parse Body Safely
    const data = await getBody(req);

    // 3. Process your logic (Database, etc.)
    console.log("Subscription Data Received:", data);

    return res.status(201).json({ success: true, message: "Subscription created" });

  } catch (error) {
    console.error("Request Error:", error);
    return res.status(400).json({ error: error.message || "Bad Request" });
  }
}