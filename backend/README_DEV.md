# Local Development — Backend

This document explains how to run the backend locally and create an approved admin for testing.

1. Install dependencies

```bash
cd backend
npm install
```

2. Create a `.env.local` file (example)

```
NODE_ENV=development
PORT=3000
SESSION_SECRET=dev-secret
FRONTEND_URL=http://localhost:5173
# Optional: Postgres local
# DATABASE_URL=postgres://user:pass@localhost:5432/rrpn
```

3. Seed sample data (categories + products)

```bash
node seed.js
```

4. Create an approved admin for local testing

You can set environment variables or rely on defaults:

```bash
# Example with env vars
ADMIN_EMAIL=admin@local ADMIN_PASSWORD=devpass123 node scripts/create-approved-admin.js

# Or simply run with defaults
node scripts/create-approved-admin.js
```

This will create or update the admin and mark `isApproved=true` so you can login via `/api/admin/login`.

5. Start backend

```bash
npm run dev
```

6. Frontend

Start the frontend dev server from repository root `frontend` folder.

```bash
cd ../frontend
npm install
npm run dev
```

Notes:
- Use `ALLOW_DEBUG_AUTH=true` only for very specific local debug cases. Prefer creating an approved admin instead.
- Never set `ALLOW_DEBUG_AUTH` in production.
