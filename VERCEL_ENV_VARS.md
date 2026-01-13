# Vercel Environment Variables for Backend

## Required Variables

Copy these to Vercel Dashboard → Settings → Environment Variables

```
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
FRONTEND_URL=https://rrpn-frontend.vercel.app
SESSION_SECRET=generate-a-strong-random-32-character-string
JWT_SECRET=generate-a-strong-random-32-character-string
NODE_ENV=production
```

## Optional Variables (if using PostgreSQL)

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_SSL=true
```

## How to Set in Vercel

1. Go to: https://vercel.com/dashboard
2. Select your backend project (rrpn-backend)
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Make sure to select **Production** environment
6. Click **Save**

## Generate Random Secrets

Use PowerShell:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use: https://randomkeygen.com/

## Important Notes

- ⚠️ Use **different secrets** for production than development
- ⚠️ Never commit these values to git
- ⚠️ Update Google OAuth callback URLs to production URLs
