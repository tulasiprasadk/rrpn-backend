// ============================================
// CRITICAL: Health endpoints - ZERO top-level code execution
// Handler responds BEFORE any module initialization
// ============================================

// Synchronous handler - NO async, NO imports, NO top-level code
function handler(req, res) {
  // Extract path from request
  let path = '/';
  try {
    if (req.url) {
      path = String(req.url).split('?')[0];
    } else if (req.path) {
      path = String(req.path);
    } else if (req.rawPath) {
      path = String(req.rawPath);
    }
  } catch (e) {
    path = '/';
  }
  
  // Health endpoints - respond IMMEDIATELY, no async, no imports
  if (path === "/api/ping" || path === "/ping") {
    try {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end("pong");
    } catch (e) {
      // Fallback if headers already sent
    }
    return;
  }
  
  if (path === "/api/health" || path === "/health") {
    try {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
    } catch (e) {
      // Fallback
    }
    return;
  }
  
  if (path === "/api/auth/status" || path === "/auth/status") {
    try {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      }));
    } catch (e) {
      // Fallback
    }
    return;
  }
  
  if (path === "/" || path === "") {
    try {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        message: "RR Nagar Backend API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      // Fallback
    }
    return;
  }
  
  // Not a health endpoint - lazy load Express (non-blocking)
  // This import only happens for non-health routes
  import('./express-app.js')
    .then(expressApp => {
      const expressHandler = expressApp.default;
      if (typeof expressHandler === 'function') {
        expressHandler(req, res);
      } else {
        throw new Error('Express handler not found');
      }
    })
    .catch(err => {
      console.error('Failed to load Express app:', err);
      if (!res.headersSent) {
        try {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: 'Service temporarily unavailable',
            message: err.message 
          }));
        } catch (e) {
          // Headers already sent
        }
      }
    });
}

// Export for Vercel - default export
export default handler;

// Named export for compatibility
export { handler };
