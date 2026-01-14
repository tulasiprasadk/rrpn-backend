// ============================================
// CRITICAL: Health endpoints respond BEFORE any imports
// This is the ONLY way to guarantee instant response
// ============================================

// Export handler that checks health endpoints FIRST
export default async (req, res) => {
  // Extract path from request
  const url = req.url || req.path || '/';
  const path = url.split('?')[0];
  
  // Health endpoints - respond IMMEDIATELY, no imports, no Express
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
  
  // Not a health endpoint - lazy load Express and handle normally
  // This ensures health endpoints never wait for Express to load
  const { default: expressHandler } = await import('./express-app.js');
  return expressHandler(req, res);
};

export const handler = async (req, res) => {
  return (await import('./index.js')).default(req, res);
};
