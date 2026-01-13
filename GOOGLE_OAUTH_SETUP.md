# Google OAuth Setup Guide

## 📋 Prerequisites

1. Google Cloud Console account
2. OAuth 2.0 Client ID credentials
3. Backend and frontend URLs configured

## 🔧 Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: RR Nagar OAuth
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (local)
     - `https://rrpn-backend.vercel.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/customers/auth/google/callback` (local)
     - `https://rrpn-backend.vercel.app/api/customers/auth/google/callback` (production)
     - `http://localhost:3000/api/suppliers/auth/google/callback` (local supplier)
     - `https://rrpn-backend.vercel.app/api/suppliers/auth/google/callback` (production supplier)
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## 🔐 Step 2: Configure Environment Variables

### Local Development (.env file)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Callback URLs (optional - will use defaults if not set)
GOOGLE_CUSTOMER_CALLBACK_URL=http://localhost:3000/api/customers/auth/google/callback
GOOGLE_SUPPLIER_CALLBACK_URL=http://localhost:3000/api/suppliers/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Session Secret (for OAuth sessions)
SESSION_SECRET=your-random-secret-key-here
```

### Production (Vercel Environment Variables)

Set these in Vercel Dashboard > Settings > Environment Variables:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://rrpn-backend.vercel.app/api/customers/auth/google/callback
FRONTEND_URL=https://rrpn-frontend.vercel.app
SESSION_SECRET=your-random-secret-key-here
```

## 🧪 Step 3: Test OAuth

### 1. Check OAuth Status

```bash
# Local
curl http://localhost:3000/api/auth/status

# Production
curl https://rrpn-backend.vercel.app/api/auth/status
```

Expected response:
```json
{
  "googleConfigured": true
}
```

### 2. Test OAuth Flow

1. Open frontend: `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, should redirect back to dashboard

## 🔍 Troubleshooting

### Issue: "Google OAuth not configured"
- **Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify: `GET /api/auth/status` should return `googleConfigured: true`

### Issue: "redirect_uri_mismatch"
- **Solution**: Ensure callback URL in Google Console matches exactly:
  - Local: `http://localhost:3000/api/customers/auth/google/callback`
  - Production: `https://rrpn-backend.vercel.app/api/customers/auth/google/callback`

### Issue: OAuth redirects but session not saved
- **Solution**: Check `SESSION_SECRET` is set
- Verify cookies are enabled in browser
- Check CORS configuration allows credentials

### Issue: "OAuth error" or "Failed to initiate Google OAuth"
- **Solution**: 
  - Check backend logs for detailed error
  - Verify passport.js is loading correctly
  - Ensure session middleware is configured

## 📝 Routes

### Customer OAuth
- **Initiate**: `GET /api/customers/auth/google`
- **Callback**: `GET /api/customers/auth/google/callback`
- **Status**: `GET /api/auth/status`

### Supplier OAuth
- **Initiate**: `GET /api/suppliers/auth/google`
- **Callback**: `GET /api/suppliers/auth/google/callback`

## ✅ Verification Checklist

- [ ] Google OAuth credentials created
- [ ] Callback URLs added to Google Console
- [ ] Environment variables set (local and production)
- [ ] `/api/auth/status` returns `googleConfigured: true`
- [ ] Frontend login page shows "Sign in with Google" button
- [ ] OAuth flow completes successfully
- [ ] User redirected to dashboard after login
- [ ] Session persists after OAuth

## 🔒 Security Notes

1. **Never commit** `.env` files with real credentials
2. Use strong `SESSION_SECRET` (random 32+ character string)
3. In production, ensure `secure: true` for cookies (HTTPS only)
4. Regularly rotate OAuth credentials
5. Monitor OAuth usage in Google Cloud Console
