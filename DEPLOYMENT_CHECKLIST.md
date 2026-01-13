# Deployment Checklist - RR Nagar Final

## ✅ Code Fixes Completed
- [x] Fixed duplicate dotenv import in `api/index.js`
- [x] Added missing dotenv import in `index.js`
- [x] Fixed hardcoded session secret (now uses environment variable with fallback)
- [x] Fixed model imports in `routes/admin-payments.js` and `routes/orders.js`
- [x] Added SESSION_SECRET fallback for safety
- [x] Added health endpoint at `/api/health`

## 🚀 GitHub Repositories
- **Backend**: `tulasiprasadk/rrnagarfinal-backend` ✅ Pushed
- **Frontend**: `tulasiprasadk/rrnagarfinal-frontend` ✅ Pushed

## 📋 Backend Deployment Configuration

### Environment Variables Required

#### For Vercel (Serverless):
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
DB_SSL=true
SESSION_SECRET=<generate-strong-secret>
NODE_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_SUPPLIER_CALLBACK_URL=https://your-backend.vercel.app/api/suppliers/auth/google/callback
GOOGLE_CUSTOMER_CALLBACK_URL=https://your-backend.vercel.app/api/customers/auth/google/callback
```

#### For Render:
```
DATABASE_URL=<render-postgres-url>
SESSION_SECRET=<generate-strong-secret>
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://your-frontend.vercel.app
SMTP_HOST=smtp.zoho.in
SMTP_PORT=465
SMTP_USER=your-email@domain.com
SMTP_PASS=<app-password>
SMTP_FROM=your-email@domain.com
```

### Vercel Configuration
- Root Directory: `.` (root) or `api/` (if deploying only API)
- Build Command: `npm install` (or leave empty for serverless)
- Output Directory: (not needed for serverless)
- Framework: Other
- Entry Point: `api/index.js` for serverless functions

### Render Configuration
- Service Type: Web Service
- Environment: Node
- Build Command: `npm install`
- Start Command: `node index.js`
- Port: Auto-detected from `process.env.PORT`

### Health Check Endpoints
- `GET /api/health` - Simple health check (returns `{ ok: true }`)
- Use these for deployment platform health checks

## 📋 Frontend Deployment Configuration

### Environment Variables Required (Vercel)
```
VITE_API_BASE_URL=https://your-backend.vercel.app/api
VITE_BACKEND_ORIGIN=https://your-backend.vercel.app
```

### Vercel Configuration
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework Preset: Vite

## ✅ Post-Deployment Verification

### Backend Health Checks
1. Test health endpoint:
   ```bash
   curl https://your-backend.vercel.app/api/health
   # Should return: {"ok":true,"timestamp":"..."}
   ```

2. Test database connection:
   ```bash
   curl https://your-backend.vercel.app/api/db-test
   # Should return: {"ok":true}
   ```

### Frontend Verification
1. Check if frontend loads: `https://your-frontend.vercel.app`
2. Verify API calls work (check browser console)
3. Test authentication flow
4. Test OAuth login (if configured)

### OAuth Configuration
1. Update Google OAuth Console:
   - Add redirect URIs:
     - `https://your-backend.vercel.app/api/suppliers/auth/google/callback`
     - `https://your-backend.vercel.app/api/customers/auth/google/callback`
   - Ensure authorized JavaScript origins include your backend URL

## 🔒 Security Checklist
- [ ] SESSION_SECRET is set to a strong random string (not the fallback)
- [ ] All environment variables are set in deployment platform
- [ ] CORS_ORIGINS includes only your frontend URLs
- [ ] Database credentials are secure
- [ ] OAuth credentials are configured correctly
- [ ] HTTPS is enabled (Vercel/Render provide this automatically)

## 📝 Notes
- The `SESSION_SECRET` fallback is only for development. **Always set a proper secret in production.**
- Health endpoints are available for deployment platform monitoring.
- Both backend entry points (`index.js` and `api/index.js`) are configured and ready.
- If deploying to Vercel, use `api/index.js` as the entry point for serverless functions.
- If deploying to Render/Cloud Run, use `index.js` as the entry point.
