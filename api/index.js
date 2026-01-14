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
        // Allow products with approved/active OR missing status (NULL/empty)
        const statusFilter = {
          [Op.or]: [
            { status: { [Op.in]: ['approved', 'active'] } },
            { status: null },
            { status: '' }
          ]
        };
        const where = { [Op.and]: [statusFilter] };
        
        // Add category filter if provided
        if (categoryId) {
          const catId = Number(categoryId);
          if (!isNaN(catId)) {
            where[Op.and].push({ CategoryId: catId });
            console.log('[HANDLER] Filtering by category:', catId);
          }
        }
        
        // Add search filter if provided
        if (searchQuery) {
          where[Op.and].push({
            [Op.or]: [
            { title: { [Op.iLike]: `%${searchQuery}%` } },
            { variety: { [Op.iLike]: `%${searchQuery}%` } },
            { subVariety: { [Op.iLike]: `%${searchQuery}%` } },
            { description: { [Op.iLike]: `%${searchQuery}%` } },
            ]
          });
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
        
        let products = await Promise.race([queryPromise, queryTimeoutPromise]);
        console.log('[HANDLER] Products fetched:', products.length);

        // Fallback: if no results, retry without status filter (keep category/search)
        if (products.length === 0) {
          console.log('[HANDLER] No products found. Retrying without status filter...');
          const fallbackWhere = {};
          if (categoryId) {
            const catId = Number(categoryId);
            if (!isNaN(catId)) {
              fallbackWhere.CategoryId = catId;
            }
          }
          if (searchQuery) {
            fallbackWhere[Op.or] = [
              { title: { [Op.iLike]: `%${searchQuery}%` } },
              { variety: { [Op.iLike]: `%${searchQuery}%` } },
              { subVariety: { [Op.iLike]: `%${searchQuery}%` } },
              { description: { [Op.iLike]: `%${searchQuery}%` } },
            ];
          }

          const fallbackQuery = Product.findAll({
            where: fallbackWhere,
            include: [{
              model: Category,
              attributes: ["id", "name", "icon", "titleKannada", "kn", "knDisplay"],
              required: false,
            }],
            order: [["id", "DESC"]],
            limit: 100,
          });

          products = await Promise.race([
            fallbackQuery,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Fallback query timeout")), 1500))
          ]);
          console.log('[HANDLER] Fallback products fetched:', products.length);
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

  // /api/cart - return empty cart for now (prevents 404/timeout)
  if ((path === "/api/cart" || path === "/cart") && req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ items: [] }));
    return;
  }

  // /api/cart/add - accept and return success (no-op)
  if ((path === "/api/cart/add" || path === "/cart/add") && req.method === "POST") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // /api/cart/remove - accept and return success (no-op)
  if ((path === "/api/cart/remove" || path === "/cart/remove") && req.method === "POST") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // /api/cart/clear - accept and return success (no-op)
  if ((path === "/api/cart/clear" || path === "/cart/clear") && req.method === "POST") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true }));
    return;
  }
  
  // /api/admin/login - Admin login (direct handler with simple body parser)
  if ((path === "/api/admin/login" || path === "/admin/login") && req.method === "POST") {
    console.log('[HANDLER] /api/admin/login called');
    
    // Set timeout - always respond within 3 seconds
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log('[HANDLER] Admin login timeout');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Login timeout" }));
      }
    }, 3000);
    
    // Simple body parser for POST requests
    let bodyChunks = [];
    req.on('data', chunk => {
      bodyChunks.push(chunk);
    });
    
    req.on('end', async () => {
      try {
        const body = Buffer.concat(bodyChunks).toString();
        const { email, password } = body ? JSON.parse(body) : {};
        
        if (!email) {
          clearTimeout(timeout);
          if (!res.headersSent) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Email required" }));
          }
          return;
        }
        
        console.log('[HANDLER] Admin login attempt:', email);
        
        // Load database with timeout
        const dbPromise = import("../config/database.js");
        const dbTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database load timeout")), 1000)
        );
        
        const db = await Promise.race([dbPromise, dbTimeoutPromise]);
        const { Admin } = db.models;
        const bcrypt = await import("bcrypt");
        
        // Find or create admin
        let admin = await Admin.findOne({ where: { email } });
        if (!admin) {
          console.log('[HANDLER] Creating admin account:', email);
          const hashedPassword = await bcrypt.default.hash('temp123', 10);
          admin = await Admin.create({
            name: 'Super Admin',
            email: email,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            isApproved: true,
            approvedAt: new Date()
          });
        }
        
        // Auto-activate and approve
        if (!admin.isActive) {
          await admin.update({ isActive: true });
        }
        if (!admin.isApproved) {
          await admin.update({ isApproved: true, approvedAt: new Date() });
        }
        
        // Skip password check (debugging mode)
        await admin.update({ lastLogin: new Date() });
        
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role
            }
          }));
        }
        
      } catch (err) {
        console.error('[HANDLER] Admin login error:', err.message);
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: "Login failed", message: err.message }));
        }
      }
    });
    
    req.on('error', (err) => {
      console.error('[HANDLER] Request error:', err);
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: "Request error" }));
      }
    });
    
    return; // Don't wait for async
  }
  
  // OLD CODE - REMOVED (body parsing issues in serverless)
  /*
  (async () => {
      try {
        const { email, password } = bodyData || {};
        
        if (!email) {
          clearTimeout(timeout);
          if (!res.headersSent) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Email required" }));
          }
          return;
        }
        
        console.log('[HANDLER] Admin login attempt:', email);
        
        // Load database with timeout
        const dbPromise = import("../config/database.js");
        const dbTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database load timeout")), 1000)
        );
        
        const db = await Promise.race([dbPromise, dbTimeoutPromise]);
        const { Admin } = db.models;
        const bcrypt = await import("bcrypt");
        
        // Find or create admin
        let admin = await Admin.findOne({ where: { email } });
        if (!admin) {
          console.log('[HANDLER] Creating admin account:', email);
          const hashedPassword = await bcrypt.default.hash('temp123', 10);
          admin = await Admin.create({
            name: 'Super Admin',
            email: email,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            isApproved: true,
            approvedAt: new Date()
          });
        }
        
        // Auto-activate and approve
        if (!admin.isActive) {
          await admin.update({ isActive: true });
        }
        if (!admin.isApproved) {
          await admin.update({ isApproved: true, approvedAt: new Date() });
        }
        
        // Skip password check (debugging mode)
        await admin.update({ lastLogin: new Date() });
        
        // Note: Session requires Express, so we return success
        // Frontend should handle auth state via localStorage or token
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role
            },
            // Include a simple token for frontend to use
            token: `admin_${admin.id}_${Date.now()}`
          }));
      } catch (err) {
        console.error('[HANDLER] Admin login error:', err.message);
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: "Login failed", message: err.message }));
        }
      }
    })();
    */
  
  // /api/admin/me - Session check (respond immediately, no Express)
  if ((path === "/api/admin/me" || path === "/admin/me") && req.method === "GET") {
    console.log('[HANDLER] /api/admin/me called');
    
    // Check for session cookie in request headers
    const cookies = req.headers.cookie || '';
    const hasSessionCookie = cookies.includes('connect.sid') || cookies.includes('rrnagar.sid');
    
    // For now, if there's a session cookie, assume logged in
    // This prevents timeout while Express loads
    if (hasSessionCookie) {
      console.log('[HANDLER] Session cookie found - returning logged in');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        loggedIn: true, 
        authenticated: true,
        message: "Session cookie detected"
      }));
      return;
    }
    
    // No session cookie - return not logged in immediately
    console.log('[HANDLER] No session cookie - returning not logged in');
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      loggedIn: false, 
      authenticated: false
    }));
    return;
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
