# ✅ Cloud Run Deploy Checklist

## On the "Settings" Tab (Current Screen)

### ✅ Already Correct:
- [x] Container port: `8080`
- [x] Container command: EMPTY
- [x] Container arguments: EMPTY

### ⚠️ Check These:

1. **Container Image Source**
   - Is it building from GitHub source? ✅
   - OR using a pre-built image? (needs to be latest)

2. **Scroll Down** - Look for:
   - "Container image URL" - should point to latest
   - "Source" - should be your GitHub repo

## Next: Go to "Variables & Secrets" Tab

Click on **"Variables & Secrets"** tab and verify:

### Required Environment Variables:
- [ ] `GOOGLE_CLIENT_ID` = `223551238790-uov1qn03drl83lp9nptd6ucth1m44qcg.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET` = [your secret]
- [ ] `JWT_SECRET` = [random 32-char string]
- [ ] `NODE_ENV` = `production`
- [ ] `FRONTEND_URL` = `https://rrpn-frontend.vercel.app`

### Remove Duplicates:
- [ ] Delete duplicate `GOOGLE_SUPPLIER_CALLBACK_URL`
- [ ] Delete duplicate `GOOGLE_CUSTOMER_CALLBACK_URL`
- [ ] Delete lowercase `frontend_url` (keep `FRONTEND_URL`)

## Then: Deploy

1. Go back to **"Settings"** tab
2. Click blue **"Deploy"** button
3. Wait 3-5 minutes
4. Check logs for success

## Expected Result

✅ Container starts  
✅ No "handler" export error  
✅ Service running on port 8080  
