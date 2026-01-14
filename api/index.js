// ============================================
// STEP 1: Minimal serverless handler
// Returns response immediately - NO imports, NO async
// ============================================

export default function handler(req, res) {
  // Extract path
  let path = '/';
  try {
    if (req.url) {
      path = String(req.url).split('?')[0];
    } else if (req.path) {
      path = String(req.path);
    }
  } catch (e) {
    path = '/';
  }
  
  console.log('[HANDLER] Request:', { path, method: req.method });
  
  // Health check - respond immediately
  if (path === "/api/ping" || path === "/ping") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end("pong");
    return;
  }
  
  if (path === "/api/health" || path === "/health") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }));
    return;
  }
  
  // Root endpoint
  if (path === "/" || path === "") {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      message: "RR Nagar Backend API", 
      version: "1.0.0",
      status: "running" 
    }));
    return;
  }
  
  // /api/products - return empty array immediately
  if (path === "/api/products" || path === "/products") {
    console.log('[HANDLER] /api/products called');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify([]));
    return;
  }
  
  // Not found
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: "Not found", path }));
}
