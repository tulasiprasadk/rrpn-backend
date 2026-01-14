# Backend Rebuild Plan - Step by Step

## ✅ STEP 1: Minimal Handler (COMPLETE)
**File**: `api/index.js`
- No Express, no database, no imports
- `/api/products` returns `[]` immediately
- Health endpoints work
- **Test**: `GET /api/products` should return `[]` instantly

---

## STEP 2: Test Step 1
- Deploy and test `/api/products`
- If it works → proceed to Step 3
- If it fails → check Vercel logs

---

## STEP 3: Add Database Connection (If Step 2 works)
**File**: `api/index.js`
- Add lazy database import
- Test connection with 2-second timeout
- Return `[]` if connection fails
- **Test**: `/api/products` should still return `[]` (no query yet)

---

## STEP 4: Add Model Loading (If Step 3 works)
**File**: `api/index.js`
- Load Product and Category models
- Add 1-second timeout
- Return `[]` if models fail
- **Test**: `/api/products` should still return `[]` (no query yet)

---

## STEP 5: Add Simple Query (If Step 4 works)
**File**: `api/index.js`
- Query all products (no filters)
- Add 2-second query timeout
- Return `[]` if query fails
- **Test**: `/api/products` should return products or `[]`

---

## STEP 6: Add Category Filter (If Step 5 works)
**File**: `api/index.js`
- Parse `categoryId` query parameter
- Filter products by category
- **Test**: `/api/products?categoryId=8` should return filtered products

---

## STEP 7: Add Search Filter (If Step 6 works)
**File**: `api/index.js`
- Parse `q` query parameter
- Search in title, variety, description
- **Test**: `/api/products?q=apple` should return matching products

---

## STEP 8: Move to Express (If Step 7 works)
**File**: `api/express-app.js`
- Create minimal Express app
- Move `/api/products` to Express router
- Keep same timeout logic
- **Test**: `/api/products` should still work

---

## STEP 9: Add Other Routes (If Step 8 works)
- Add categories, orders, etc. one by one
- Test each route before adding next

---

## STEP 10: Add Middleware (If Step 9 works)
- Add CORS, session, body parser
- Test that routes still work

---

## Current Status: STEP 1 COMPLETE
**Next**: Test `/api/products` endpoint
