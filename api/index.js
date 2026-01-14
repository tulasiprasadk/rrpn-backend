// ============================================
// CRITICAL: Health endpoints - ZERO imports, instant response
// This handler responds BEFORE any module loading
// ============================================

export default function handler(req, res) {
  // Extract path - handle Vercel request format
  let path = '/';
  if (req.url) {
    path = req.url.split('?')[0];
  } else if (req.path) {
    path = req.path;
  } else if (req.rawPath) {
    path = req.rawPath;
  }
  
  // Health endpoints - respond IMMEDIATELY with NO imports
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
  
  // Not a health endpoint - lazy load Express (async, non-blocking)
  // This import only happens for non-health routes
  import('./express-app.js')
    .then(expressApp => {
      const handler = expressApp.default;
      if (typeof handler === 'function') {
        handler(req, res);
      } else {
        throw new Error('Express handler not found');
      }
    })
    .catch(err => {
      console.error('Failed to load Express app:', err);
      if (!res.headersSent) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          error: 'Service temporarily unavailable',
          message: err.message 
        }));
      }
    });
}

export { handler };
