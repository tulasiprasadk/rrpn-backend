# RR Nagar Marketplace - Deployment Guide

## Live URLs
- **Frontend**: https://www.rrnagar.com (Vercel)
- **Backend API**: Hosted on Render
- **GitHub Repo**: https://github.com/tulasiprasadk/rrnagar-coming-soon

---

## Frontend Deployment (Vercel)

### Environment Variables (`.env`)
```
VITE_API_BASE_URL=https://your-render-backend-url.com
```

### Deployment Steps
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-deploys on push to main

### Domain
- Custom domain: `www.rrnagar.com`
- Configure DNS with Vercel nameservers

---

## Backend Deployment (Render)

### Environment Variables (`.env`)
```
NODE_ENV=production
PORT=4000
SESSION_SECRET=your-secure-session-secret-here
DB_PATH=./data/rrnagar.sqlite
CORS_ORIGINS=https://www.rrnagar.com,https://rrnagar.com
```

### Deployment Steps
1. Connect GitHub repo to Render
2. Create Web Service with:
   - Build command: `npm install`
   - Start command: `node index.js`
3. Set environment variables in Render dashboard
4. Auto-deploys on push to main

### Database
- SQLite database stored in `./data/` directory
- Persists between deployments
- Seed with: `npm run seed` (if available)

### Important Notes
- Use HTTPS_ONLY in production
- Enable auto-deploy on GitHub push
- Monitor logs in Render dashboard
- Backup SQLite database regularly

---

## Local Development

### Setup
```bash
# Backend
cd backend
npm install
node index.js

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Testing
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## Key Features
- ✅ Kannada + English bilingual support
- ✅ OTP-based customer authentication
- ✅ Address management & storage
- ✅ Admin payment approval UI
- ✅ Supplier order management
- ✅ Product inventory tracking

---

## Support
For issues or questions, check the respective deployment platform dashboards.
