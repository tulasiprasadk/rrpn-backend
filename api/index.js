// ============================================
// CRITICAL: Health endpoints respond BEFORE any imports
// NO top-level imports - handler loads instantly
// ============================================

// Handler function - NO imports at top level
async function handler(req, res) {
  // Extract path - handle both Vercel and standard formats
  let path = '/';
  if (req.url) {
    path = req.url.split('?')[0];
  } else if (req.path) {
    path = req.path;
  } else if (req.rawPath) {
    path = req.rawPath;
  }
  
  // Health endpoints - respond IMMEDIATELY, no async imports
  if (path === "/api/ping" || path === "/ping") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end("pong");
    return;
  }
  
  if (path === "/api/health" || path === "/health") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }
  
  if (path === "/api/auth/status" || path === "/auth/status") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    }));
    return;
  }
  
  if (path === "/" || path === "") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      message: "RR Nagar Backend API",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Not a health endpoint - lazy load Express (only for non-health routes)
  const expressApp = await import('./express-app.js');
  return expressApp.default(req, res);
}

// Export for Vercel
export default handler;
export { handler };
