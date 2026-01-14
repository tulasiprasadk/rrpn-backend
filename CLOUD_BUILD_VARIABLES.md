# 📋 Cloud Build Substitution Variables - What to Keep/Change

## Current Variables (From Your Screen)

### ✅ Keep These (Correct):

1. **`_AR_HOSTNAME`** = `asia-south1-docker.pkg.dev`
   - ✅ Correct - Artifact Registry hostname for your region
   - **Keep as is**

2. **`_AR_PROJECT_ID`** = `rr-nagar-481003`
   - ✅ Correct - Your Google Cloud project ID
   - **Keep as is**

3. **`_AR_REPOSITORY`** = `cloud-run-source-deploy`
   - ✅ Correct - Artifact Registry repository name
   - **Keep as is**

4. **`_DEPLOY_REGION`** = `asia-south1`
   - ✅ Correct - Your Cloud Run region
   - **Keep as is**

5. **`_PLATFORM`** = `managed`
   - ✅ Correct - Cloud Run platform type
   - **Keep as is**

6. **`_SERVICE_NAME`** = `rrnagar-backend-github`
   - ✅ Correct - Your Cloud Run service name
   - **Keep as is**

7. **`_TRIGGER_ID`** = `2265b84a-e54b-4265-8fee-...`
   - ✅ Auto-generated - Unique trigger identifier
   - **Keep as is**

### ❌ Change This One:

8. **`REPO_NAME`** = `rrw-backend` ❌
   - ❌ **WRONG** - This is the old repository name
   - ✅ **CHANGE TO**: `rrpn-backend`
   - This tells Cloud Build which repository to build from

## What to Do

### Step 1: Change REPO_NAME
1. Find **Variable 8**: `REPO_NAME`
2. Click the **edit icon** (pencil) next to **Value 8**
3. Change from: `rrw-backend`
4. To: `rrpn-backend`
5. Click **Save** or press Enter

### Step 2: Save the Trigger
1. Scroll to bottom of the page
2. Click **"UPDATE"** or **"SAVE"** button

### Step 3: Run the Build
1. Go back to Triggers list
2. Click **"RUN"** button
3. Select branch: `main`
4. Click **"RUN"**

## Summary

**Keep Default (7 variables):**
- ✅ `_AR_HOSTNAME`
- ✅ `_AR_PROJECT_ID`
- ✅ `_AR_REPOSITORY`
- ✅ `_DEPLOY_REGION`
- ✅ `_PLATFORM`
- ✅ `_SERVICE_NAME`
- ✅ `_TRIGGER_ID`

**Change This (1 variable):**
- ❌ `REPO_NAME`: `rrw-backend` → `rrpn-backend`

That's it! Just change the `REPO_NAME` variable and you're done!
