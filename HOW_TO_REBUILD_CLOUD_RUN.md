# 🔄 How to Rebuild Cloud Run - Step by Step

## Quick Answer
**You can rebuild NOW** - it only takes 2-5 minutes. No need to wait hours!

## Method 1: Manual Rebuild (Recommended - Fastest)

### Step-by-Step Instructions:

1. **Go to Cloud Run Console**
   - Open: https://console.cloud.google.com/run
   - Make sure you're in the correct project: **RR Nagar**

2. **Find Your Service**
   - Look for: **`rrnagar-backend-github`**
   - Click on the service name

3. **Start New Deployment**
   - Click the blue **"EDIT & DEPLOY NEW REVISION"** button (top right)

4. **Go to "Source" or "Build" Tab**
   - At the top, you'll see tabs: "Settings", "Variables & Secrets", "Volumes"
   - Look for **"Source"** or **"Build"** tab
   - Click on it

5. **Force Rebuild**
   - Look for **"Build options"** or **"Advanced settings"**
   - Find **"Clear build cache"** or **"No cache"** checkbox
   - ✅ **Check it** (enable it)
   - OR look for **"Build arguments"** and add: `--no-cache`

6. **Deploy**
   - Scroll to bottom
   - Click blue **"Deploy"** button
   - Wait 2-5 minutes for build to complete

## Method 2: Auto-Rebuild (If Connected to GitHub)

If Cloud Run is connected to your GitHub repo:

1. **Check Connection**
   - Go to Cloud Run service
   - Look for **"Source"** section
   - Should show: `https://github.com/tulasiprasadk/rrpn-backend.git`

2. **Wait for Auto-Deploy**
   - Cloud Run detects new commits
   - Automatically rebuilds (usually 2-3 minutes after push)
   - Check **"Revisions"** tab to see new deployment

3. **If Not Auto-Deploying**
   - Go to **"Source"** tab
   - Click **"Connect repository"** or **"Redeploy"**
   - Select your GitHub repo and branch (`main`)

## Method 3: Using gcloud CLI (If You Have It)

```bash
# Navigate to backend directory
cd D:\cursor\backend

# Deploy with no cache
gcloud run deploy rrnagar-backend-github \
  --source . \
  --region asia-south1 \
  --no-cache
```

## What Happens During Rebuild

1. **Build Phase** (1-2 minutes)
   - Pulls latest code from GitHub
   - Builds Docker image (with no cache)
   - Installs dependencies

2. **Deploy Phase** (1-2 minutes)
   - Creates new revision
   - Starts container
   - Health checks

3. **Complete** (Total: 2-5 minutes)
   - Service is live with latest code
   - Old cached code is gone

## How to Verify Rebuild Worked

### Check Logs:
1. Go to Cloud Run service
2. Click **"Logs"** tab
3. Look for latest logs
4. Should see:
   ```
   > node index.js
   🚀 Cloud Run backend running on port 8080
   ```
5. **NOT** the error about `export { handler }`

### Check Revision:
1. Go to **"Revisions"** tab
2. Latest revision should show:
   - Status: ✅ **Active**
   - Age: Just now (or few minutes ago)
   - Image: Latest build

## Troubleshooting

### If Rebuild Still Shows Old Code:
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Wait 1 more minute** - sometimes logs are delayed
3. **Check revision number** - should be higher than before
4. **Try Method 1** (manual rebuild with cache cleared)

### If Build Fails:
1. Check **"Logs"** tab for build errors
2. Verify environment variables are set
3. Check Dockerfile is correct
4. Verify GitHub connection

## Recommendation

**Do it NOW** - Manual rebuild takes only 2-5 minutes:
1. ✅ Faster than waiting
2. ✅ You can see the progress
3. ✅ Immediate feedback if there are issues
4. ✅ Cache will be cleared

## After Rebuild

Once you see `🚀 Cloud Run backend running on port 8080` in logs:
- ✅ Service is running
- ✅ Latest code is deployed
- ✅ No more export errors
- ✅ Ready to test!
