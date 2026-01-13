# RR Nagar – Vercel + Render Deployment

This repo is configured for:
- Frontend on Vercel (domain: https://www.rrnagar.com)
- Backend API on Render (URL: https://rrw-backend.onrender.com)

## Frontend (Vercel)

Environment Variables (Project Settings → Environment Variables):
- VITE_BASE_PATH = /
- VITE_API_BASE_URL = https://rrnagar-coming-soon.onrender.com/api
- VITE_BACKEND_ORIGIN = https://rrw-backend.onrender.com

Build settings:
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`

Routing:
- `vercel.json` is already present to rewrite SPA routes to `/index.html`.

Domains:
- Add `www.rrnagar.com` (and optionally apex `rrnagar.com`) to the project.
- Follow Vercel DNS instructions and wait for propagation.

## Backend (Render)

Service:
- Web Service → Node
- Build Command: `npm install`
- Start Command: `node index.js`

Environment Variables:
- NODE_ENV = production
- SESSION_SECRET = <strong random string>
- CORS_ORIGINS = https://www.rrnagar.com, https://rrnagar.com, https://<your-vercel-project>.vercel.app, https://tulasiprasadk.github.io
- SMTP_HOST = smtp.zoho.in
- SMTP_PORT = 465
- SMTP_USER = namaste@rrnagar.com
- SMTP_PASS = <app password>
- SMTP_FROM = namaste@rrnagar.com

Notes:
- The server binds to `process.env.PORT` (Render provides this automatically).
- Session cookies are configured for cross-site usage in production (`SameSite=None; Secure`).

## Smoke Test

1) Open https://www.rrnagar.com
- Categories and images render without console errors

2) Customer login (OTP via email)
- Request OTP, check email delivery (Zoho SMTP)
- Authenticated requests persist across page reloads

3) Admin/Supplier panels
- OTP email delivery works; pages load data

If CORS errors appear, confirm the exact origin is listed in `CORS_ORIGINS` on Render.
