# 🔄 Force Cloud Run to Rebuild from Latest Code

## Problem
Cloud Run is using **cached/old code** that still has the bad `export { handler } from './api/index.js'` line, even though we've pushed the fix.

## Solution: Force Fresh Build

### Option 1: Clear Build Cache (Recommended)

1. **Go to Cloud Run Console**
   - Navigate to your service
   - Click **"EDIT & DEPLOY NEW REVISION"**

2. **Check Build Settings**
   - Look for **"Build"** or **"Source"** section
   - If using Cloud Build, look for **"Build configuration"**

3. **Force Rebuild**
   - Look for **"Build options"** or **"Advanced settings"**
   - Enable **"Clear build cache"** or **"No cache"**
   - OR add build argument: `--no-cache`

4. **Deploy**

### Option 2: Update Dockerfile to Force Rebuild

Add this to Dockerfile to bust cache:

```dockerfile
# Add cache-busting line
ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST"
```

Then in Cloud Run deployment, set build arg: `CACHE_BUST=$(date +%s)`

### Option 3: Change Source Reference

If Cloud Run is building from a specific commit/tag:
1. Update to use **latest commit** from `main` branch
2. Or create a new tag and point to it

### Option 4: Manual Docker Build & Push

If Cloud Run is using a pre-built image:

1. **Build fresh image:**
   ```bash
   docker build --no-cache -t gcr.io/PROJECT_ID/rrnagar-backend:latest .
   ```

2. **Push to registry:**
   ```bash
   docker push gcr.io/PROJECT_ID/rrnagar-backend:latest
   ```

3. **Update Cloud Run** to use this image

## Verify Current Code

The current `index.js` should have:
- ✅ Line 4: `import bodyParser from "body-parser";`
- ✅ Line 91-94: `app.listen(PORT, ...)`
- ❌ NO `export { handler } from './api/index.js'`

## Quick Check

Run this locally to verify:
```bash
cd D:\cursor\backend
head -n 10 index.js
```

Should show:
```
import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
```

NOT:
```
export { handler } from './api/index.js';
```

## Most Likely Fix

**Cloud Run is using a cached Docker image.** You need to:
1. Force rebuild without cache
2. OR update the source reference to latest commit
3. OR manually rebuild and push Docker image
