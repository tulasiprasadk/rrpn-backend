# Products Route Rebuild Plan

## Step 1: ✅ COMPLETE - Minimal Route (No DB)
- Route returns empty array `[]` immediately
- No database, no async, no imports
- **Test**: `/api/products` should return `[]` instantly

## Step 2: Add Database Connection (If Step 1 works)
- Add lazy database import
- Test connection with timeout
- Return `[]` if connection fails

## Step 3: Add Model Loading (If Step 2 works)
- Load Product and Category models
- Add timeout protection
- Return `[]` if models fail to load

## Step 4: Add Simple Query (If Step 3 works)
- Query products without filters
- Add timeout protection
- Return `[]` if query fails

## Step 5: Add Category Filter (If Step 4 works)
- Add `categoryId` query parameter support
- Test with `?categoryId=8`

## Step 6: Add Search Filter (If Step 5 works)
- Add `q` query parameter support
- Test search functionality

## Step 7: Add Response Transformation (If Step 6 works)
- Add Kannada name mapping
- Add basePrice field
- Finalize response format

## Step 8: Restore Bulk Upload (If Step 7 works)
- Re-add bulk upload endpoint
- Test with sample data

---

**Current Status**: Step 1 - Testing minimal route
