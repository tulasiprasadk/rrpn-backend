# 🔄 Rebuild Cloud Run with Pre-Built Image

## Current Situation
Your Cloud Run is using a **pre-built container image** from:
```
asia-south1-docker.pkg.dev/rr-nagar-481003/cloud-run-source-deploy/rrw-backend/rrnagar-backend
```

This means Cloud Run is **not building from GitHub source** - it's using an already-built Docker image.

## Solution: Rebuild the Container Image

### Option 1: Trigger Cloud Build (If Connected to GitHub)

1. **Go to Cloud Build**
   - Open: https://console.cloud.google.com/cloud-build
   - Look for **"Triggers"** in the left menu
   - Find trigger for `rrnagar-backend` or `rrw-backend`

2. **Run Trigger Manually**
   - Click on the trigger
   - Click **"RUN"** button
   - Select branch: `main`
   - Click **"RUN"** to start build

3. **Wait for Build**
   - Build takes 3-5 minutes
   - Check build logs
   - New image will be pushed to Artifact Registry

4. **Redeploy Cloud Run**
   - Go back to Cloud Run
   - Click **"EDIT & DEPLOY NEW REVISION"**
   - Container image should auto-update to latest
   - Click **"Deploy"**

### Option 2: Build Image Manually with gcloud

If you have gcloud CLI installed:

```bash
cd D:\cursor\backend

# Build and push new image
gcloud builds submit --tag asia-south1-docker.pkg.dev/rr-nagar-481003/cloud-run-source-deploy/rrw-backend/rrnagar-backend:latest

# Deploy to Cloud Run
gcloud run deploy rrnagar-backend-github \
  --image asia-south1-docker.pkg.dev/rr-nagar-481003/cloud-run-source-deploy/rrw-backend/rrnagar-backend:latest \
  --region asia-south1
```

### Option 3: Change to Build from Source

1. **In Cloud Run Console** (where you are now)
   - Click **"EDIT & DEPLOY NEW REVISION"**
   - Look for **"Source"** section (might be at top or in settings)
   - OR look for **"Build"** option

2. **Connect to GitHub**
   - If you see **"Source"** or **"Build from source"** option
   - Select: **"GitHub"** or **"Cloud Source Repositories"**
   - Connect: `https://github.com/tulasiprasadk/rrpn-backend.git`
   - Branch: `main`
   - This will build from source on each deploy

3. **Deploy**
   - Click **"Deploy"**
   - Cloud Run will build from GitHub source
   - Takes 5-8 minutes first time

## Quick Check: Where is Source/Build?

Look for these in the Cloud Run deploy page:
- **"Source"** tab (at the top, next to "Containers")
- **"Build"** section (might be collapsed)
- **"Cloud Build"** link or button
- **"Build configuration"** in settings

## Recommended: Check Cloud Build Triggers

1. **Go to**: https://console.cloud.google.com/cloud-build/triggers
2. **Look for**: Trigger related to `rrnagar-backend` or `rrw-backend`
3. **Click**: **"RUN"** to manually trigger build
4. **Wait**: 3-5 minutes for build to complete
5. **Go back**: Cloud Run and deploy new revision

## Alternative: Update Image Tag

If you can't find source/build options:

1. **In Cloud Run** (where you are)
2. **Container image URL** field
3. **Change the tag** from `:latest` to `:v2` or add timestamp
4. **But first**: You need to build a new image with that tag

## What I Recommend

**Check Cloud Build Triggers first:**
1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Find your backend trigger
3. Click "RUN" to rebuild image
4. Then redeploy Cloud Run

This is the fastest way if you have a Cloud Build trigger set up!
