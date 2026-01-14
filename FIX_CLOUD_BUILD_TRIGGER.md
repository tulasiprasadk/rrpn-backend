# 🔧 Fix Cloud Build Trigger - Step by Step

## Problem
Your Cloud Build trigger is connected to:
- ❌ `tulasiprasadk/RRW-backend` (old repo)
- ✅ Should be: `tulasiprasadk/rrpn-backend` (current repo)

## Solution: Update or Create New Trigger

### Option 1: Update Existing Trigger (Recommended)

#### Step 1: Open the Trigger
1. On the Cloud Build Triggers page (where you are now)
2. Click on the trigger name: `rmgpgab-rrnagar-backend-github-asia-south1-tulasiprasadk-RRWnmn`
3. This opens the trigger details page

#### Step 2: Edit the Trigger
1. Click the **"EDIT"** button (top right)
2. Scroll down to **"Source"** section

#### Step 3: Change Repository
1. Find **"Repository"** dropdown or field
2. Click on it
3. Look for **"tulasiprasadk/rrpn-backend"** in the list
4. If not listed:
   - Click **"Connect repository"** or **"Manage repositories"**
   - Connect: `https://github.com/tulasiprasadk/rrpn-backend.git`
   - Authorize GitHub if needed
   - Then select it

#### Step 4: Update Branch
1. Find **"Branch"** or **"Event"** section
2. Set to: `^main$` or `main`
3. This ensures it builds from main branch

#### Step 5: Save
1. Scroll to bottom
2. Click **"UPDATE"** or **"SAVE"** button

#### Step 6: Run the Trigger
1. Go back to Triggers list
2. Find your updated trigger
3. Click **"RUN"** button
4. Select branch: `main`
5. Click **"RUN"** to start build
6. Wait 3-5 minutes for build to complete

### Option 2: Create New Trigger (If Update Doesn't Work)

#### Step 1: Create New Trigger
1. On Cloud Build Triggers page
2. Click **"+ Create trigger"** button (top left)

#### Step 2: Name the Trigger
1. **Name**: `rrnagar-backend-github` (or any name you like)
2. **Description**: `Build and deploy rrpn-backend to Cloud Run`

#### Step 3: Connect Repository
1. Under **"Source"** section
2. Click **"Connect repository"** or **"Select repository"**
3. If `rrpn-backend` not listed:
   - Click **"Connect new repository"**
   - Select **"GitHub"**
   - Authorize Google Cloud to access GitHub
   - Select: `tulasiprasadk/rrpn-backend`
   - Click **"Connect"**

#### Step 4: Configure Event
1. **Event**: Select **"Push to a branch"**
2. **Branch**: Enter `^main$` (or just `main`)
3. This triggers on every push to main branch

#### Step 5: Configure Build
1. **Build configuration**: Select **"Cloud Build configuration file (yaml or json)"**
2. **Location**: Leave as `cloudbuild.yaml` or check if you have one
3. **OR** select **"Inline"** and configure manually

#### Step 6: Cloud Run Configuration
1. Scroll to **"Service account"** or **"Advanced"** section
2. Look for **"Cloud Run"** or **"Deployment"** settings
3. **Service name**: `rrnagar-backend-github`
4. **Region**: `asia-south1`
5. **Image**: Will be auto-generated

#### Step 7: Create and Run
1. Click **"CREATE"** button
2. After creation, click **"RUN"** button
3. Select branch: `main`
4. Click **"RUN"** to start first build

### Option 3: Quick Manual Build (Temporary Fix)

If you just want to rebuild NOW without fixing the trigger:

#### Step 1: Use gcloud CLI (If Installed)
```bash
cd D:\cursor\backend

# Build and push image
gcloud builds submit --tag asia-south1-docker.pkg.dev/rr-nagar-481003/cloud-run-source-deploy/rrw-backend/rrnagar-backend:latest

# Deploy to Cloud Run
gcloud run deploy rrnagar-backend-github \
  --image asia-south1-docker.pkg.dev/rr-nagar-481003/cloud-run-source-deploy/rrw-backend/rrnagar-backend:latest \
  --region asia-south1
```

#### Step 2: Or Use Cloud Shell
1. Open Cloud Shell (icon in top right of Google Cloud Console)
2. Run the commands above

## Recommended: Update Existing Trigger

**I recommend Option 1** - Update the existing trigger:
1. ✅ Keeps your current setup
2. ✅ Just changes the repository
3. ✅ Faster than creating new one
4. ✅ Maintains your Cloud Run connection

## After Trigger is Fixed

Once you run the trigger:
1. **Wait 3-5 minutes** for build
2. **Check build logs** for success
3. **Go to Cloud Run** service
4. **New revision** should be created automatically
5. **Check logs** - should see: `🚀 Cloud Run backend running on port 8080`

## Verification

After build completes:
- ✅ New Docker image in Artifact Registry
- ✅ Cloud Run revision updated
- ✅ Latest code deployed
- ✅ No more export errors
