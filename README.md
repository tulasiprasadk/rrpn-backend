# RR Nagar Marketplace

Full-stack marketplace application with React frontend and Node.js backend.

## Project Structure

```
D:\RRPN\
  ├── api\              # Vercel serverless entry point
  ├── backend\          # Backend API (Node.js + Express + Sequelize)
  ├── frontend\         # Frontend (React + Vite)
  ├── docs\             # Documentation
  └── package.json      # Root package.json
```

## Quick Start

### Backend
```powershell
cd backend
npm install
npm start
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Deployment

- **Backend**: Deployed on Vercel (serverless functions)
- **Frontend**: Deployed on Vercel (static site)

## Git Repositories

- Backend: `tulasiprasadk/rrnagarfinal-backend` (or `rrw-backend`)
- Frontend: `tulasiprasadk/rrnagarfinal-frontend` (or `RRN-frontend`)

## Environment Variables

See `docs/` folder for setup guides:
- `VERCEL_ENV_VARS.md` - Environment variables checklist
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth configuration
- `FIX_FRONTEND_BACKEND_CONNECTION.md` - Frontend-backend connection

---

**Project migrated from D:\RRN to D:\RRPN for clean organization.**
