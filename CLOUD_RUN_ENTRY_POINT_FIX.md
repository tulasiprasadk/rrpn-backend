# 🔧 Cloud Run Entry Point Fix

## Problem
Cloud Run is configured to use `./api/index.js` as the entry point and expects a named export `handler`, but there might be a module resolution issue.

## Solutions

### Option 1: Update Cloud Run Service Configuration
In Cloud Run console, check the **"Container"** tab and verify:
- **Container port**: `8080`
- **Entry point**: Leave empty (uses CMD from Dockerfile) OR set to: `node index.js`

### Option 2: Use Cloud Run Entry Point File
Created `cloudrun.js` as an alternative entry point that re-exports the handler.

Update Cloud Run service to use:
- **Entry point**: `node cloudrun.js`

### Option 3: Fix Package.json Start Script
Update `package.json` to use the correct entry point for Cloud Run:

```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

This is already correct, so Cloud Run should use `index.js`, not `api/index.js`.

## Most Likely Issue

Cloud Run service might be configured with a custom entry point pointing to `api/index.js`. 

**Check in Cloud Run Console:**
1. Go to your Cloud Run service
2. Click **"EDIT & DEPLOY NEW REVISION"**
3. Go to **"Container"** tab
4. Check **"Container port"** (should be 8080)
5. Check if there's a custom **"Entry point"** or **"Command"** set
6. If it's set to `node api/index.js`, change it to `node index.js` or remove it to use Dockerfile CMD

## Current File Structure

- `index.js` - Main entry point (exports app, runs server locally)
- `api/index.js` - Vercel serverless function (exports handler)
- `cloudrun.js` - Cloud Run entry point (re-exports handler)

## Recommended Fix

1. **In Cloud Run Console**, remove any custom entry point/command
2. Let it use the Dockerfile CMD: `npm start` → `node index.js`
3. OR update Dockerfile CMD to: `node cloudrun.js` if you want to use the Cloud Run-specific entry point

## Verify Export

The `api/index.js` file now has:
```javascript
export default serverless(app);
export const handler = serverless(app);
```

This should work, but Cloud Run might need to use `index.js` instead of `api/index.js`.
