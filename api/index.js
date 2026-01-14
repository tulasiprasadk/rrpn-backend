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
  
  // /api/products - Step 3: Add category filter and search
  if (path === "/api/products" || path === "/products") {
    console.log('[HANDLER] /api/products called', req.query);
    
    // Parse query parameters
    const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
    const categoryId = urlParams.get('categoryId');
    const searchQuery = urlParams.get('q');
    
    // Set timeout - always respond within 3 seconds
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log('[HANDLER] Timeout - returning empty array');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify([]));
      }
    }, 3000);
    
    // Try to load database and query
    (async () => {
      try {
        console.log('[HANDLER] Loading database...');
        
        // Load database with 1 second timeout
        const dbPromise = import("../config/database.js");
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database load timeout")), 1000)
        );
        
        const db = await Promise.race([dbPromise, timeoutPromise]);
        console.log('[HANDLER] Database loaded');
        
        // Get models
        const Product = db.models?.Product;
        const Category = db.models?.Category;
        const { Op } = await import("sequelize");
        
        if (!Product || !Category) {
          throw new Error("Models not available");
        }
        
        // Build where clause
        const where = {
          status: { [Op.in]: ['approved', 'active'] }
        };
        
        // Add category filter if provided
        if (categoryId) {
          const catId = Number(categoryId);
          if (!isNaN(catId)) {
            where.CategoryId = catId;
            console.log('[HANDLER] Filtering by category:', catId);
          }
        }
        
        // Add search filter if provided
        if (searchQuery) {
          where[Op.or] = [
            { title: { [Op.iLike]: `%${searchQuery}%` } },
            { variety: { [Op.iLike]: `%${searchQuery}%` } },
            { subVariety: { [Op.iLike]: `%${searchQuery}%` } },
            { description: { [Op.iLike]: `%${searchQuery}%` } },
          ];
          console.log('[HANDLER] Searching for:', searchQuery);
        }
        
        // Query products with 1.5 second timeout
        console.log('[HANDLER] Querying products...');
        const queryPromise = Product.findAll({
          where,
          include: [{
            model: Category,
            attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
            required: false,
          }],
          order: [["id", "DESC"]],
          limit: 100,
        });
        
        const queryTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Query timeout")), 1500)
        );
        
        const products = await Promise.race([queryPromise, queryTimeoutPromise]);
        console.log('[HANDLER] Products fetched:', products.length);
        
        // Log query details for debugging
        if (products.length === 0) {
          console.log('[HANDLER] No products found. Query params:', { categoryId, searchQuery, where });
        }
        
        // Transform products
        const productsData = products.map((p) => {
          const obj = p.toJSON();
          obj.basePrice = obj.price;
          if (!obj.knDisplay && obj.titleKannada) {
            obj.knDisplay = obj.titleKannada;
          }
          if (!obj.kn && obj.titleKannada) {
            obj.kn = obj.titleKannada;
          }
          return obj;
        });
        
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(productsData));
        }
        
      } catch (err) {
        console.error('[HANDLER] Error:', err.message);
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify([])); // Return empty array on error
        }
      }
    })();
    
    return; // Don't wait for async
  }
  
  // /api/admin/me - Session check (try Express first, fallback to false)
  if ((path === "/api/admin/me" || path === "/admin/me") && req.method === "GET") {
    console.log('[HANDLER] /api/admin/me called - trying Express first');
    
    // Try to load Express quickly (500ms timeout)
    const expressTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log('[HANDLER] Express timeout for /admin/me - returning false');
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          loggedIn: false, 
          authenticated: false
        }));
      }
    }, 500);
    
    // Try Express
    import('./express-app.js')
      .then(expressApp => {
        clearTimeout(expressTimeout);
        const expressHandler = expressApp.default;
        if (typeof expressHandler === 'function' && !res.headersSent) {
          expressHandler(req, res);
        } else if (!res.headersSent) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ loggedIn: false, authenticated: false }));
        }
      })
      .catch(err => {
        clearTimeout(expressTimeout);
        console.error('[HANDLER] Express load failed for /admin/me:', err);
        if (!res.headersSent) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ loggedIn: false, authenticated: false }));
        }
      });
    
    return; // Don't continue to other handlers
  }
  
  // Favicon - return 204 (No Content) to prevent 404 errors
  if (path === "/favicon.ico") {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // All other routes (including admin login) - load Express app
  // Express handles: admin login, categories, orders, etc.
  import('./express-app.js')
    .then(expressApp => {
      const expressHandler = expressApp.default;
      if (typeof expressHandler === 'function') {
        expressHandler(req, res);
      } else {
        if (!res.headersSent) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: "Not found", path }));
        }
      }
    })
    .catch(err => {
      console.error('Failed to load Express app:', err);
      if (!res.headersSent) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          error: "Service unavailable", 
          message: err.message,
          path 
        }));
      }
    });
}
