// Minimal health check endpoint - no dependencies
export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
