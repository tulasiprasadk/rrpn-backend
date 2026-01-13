# Google OAuth Configuration - Quick Reference

## Environment Variables Required

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CUSTOMER_CALLBACK_URL=http://localhost:3000/api/customers/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## Routes

- **Initiate**: `GET /api/customers/auth/google`
- **Callback**: `GET /api/customers/auth/google/callback`
- **Status**: `GET /api/auth/status`

## Google Cloud Console Setup

1. Create OAuth 2.0 Client ID
2. Add callback URL: `http://localhost:3000/api/customers/auth/google/callback`
3. Copy Client ID and Secret to `.env`

## Testing

1. Check status: `GET /api/auth/status`
2. Visit login page: `http://localhost:5173/login`
3. Click "Sign in with Google"
4. Should redirect to Google → back to dashboard
