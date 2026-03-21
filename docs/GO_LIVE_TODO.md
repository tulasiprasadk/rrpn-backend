# Go-Live Todo Tracker
Updated: 2026-03-20

## Legend
- `DONE`: Implemented in code and rechecked in this pre-launch pass.
- `PARTIAL`: Implemented in code, but still needs UAT, content completion, or live-config validation.
- `PENDING`: Not implemented yet.
- `BLOCKED`: Needs production credentials, external platform setup, or business inputs.

## Appreciation
AI-assisted tooling played a major role in getting the project across the finish line faster by helping with implementation, debugging, cross-checking, and launch-readiness reviews.

## Login
- `DONE` Customer login CTA now clearly routes through Google so the temporary email button does not feel broken.
- `DONE` Customer protected routes now send users to `/login`, not admin login, and customer auth continuity is stronger across refreshes.
- `PARTIAL` Supplier and admin login flows are rechecked in code, but still need production smoke testing with real deployed callbacks/sessions.
- `PENDING` Native direct email / phone login for customers.

## Sales Cycle
- `PARTIAL` Promo/reference code input and checkout offer visibility are present on checkout.
- `PENDING` Promo/discount persistence at backend order-model level.
- `PARTIAL` Saved address flow is present and reworked with a tighter, compact form layout.
- `PARTIAL` Address persistence relies on customer auth/session or JWT continuity and needs one real end-to-end checkout UAT on production.
- `PARTIAL` Search-result product cards add to bag through the shared cart flow; this pass also tightened token-backed cart sync.
- `PARTIAL` My Orders should now benefit from the customer route/auth fixes, but full order lifecycle UAT is still required.
- `PARTIAL` Order success page now fetches subscription/order data with token fallback too.

## Dashboards
- `DONE` Customer dashboard sidebar layout remains constant via shared dashboard layout.
- `DONE` Supplier sidebar already includes View Orders, Manage Products, and Add Products.
- `DONE` Header dashboard link stays role-aware for customer vs supplier sessions.
- `PARTIAL` Customer dashboard link relogin loop should be resolved by the route/auth guard fixes in this pass.
- `PARTIAL` Admin login redirect logic points to `/admin/dashboard`, but still needs live verification against deployed backend/session behavior.
- `DONE` Admin Kannada label mapping exists and is readable.
- `PARTIAL` A customer-facing Kannada button now exists in the header, but it currently covers header-level language switching only, not the whole site content.

## Products
- `PARTIAL` Shared product cards remain the common rendering path for browse/search/category listings, helping keep box sizing more uniform.
- `PENDING` Full icon-to-product audit so each emoji/icon truly matches the product.
- `PENDING` Kannada names for all products with a uniform content standard.
- `PENDING` Final catalog-wide consistency pass for product card sizing across all categories and search contexts.

## Generic / Platform
- `PARTIAL` Technical and operational documentation exists and has been refreshed for go-live review.
- `PARTIAL` Secret/env guidance is documented for Google Console, Supabase, Vercel, and GitHub, but actual production values still need final validation.
- `PARTIAL` Analytics hooks exist in code; production measurement ID setup and dashboard verification are still pending.
- `PARTIAL` Android app shell exists in `frontend/android/`; app packaging and release work remain pending.
- `DONE` Bulk upload replace behavior is supported for updating older product data with newer uploads.
- `DONE` Footer left-edge spacing is intentionally kept minimal.
- `PARTIAL` Responsive polish has improved in touched flows, but full mobile/tablet/desktop QA is still pending.

## Requested Features Still Pending
- `PENDING` Full-site Kannada mode for all customer-facing content, with fallback transliteration where translation is missing.
- `PENDING` Subscription upsell expansion for monthly, quarterly, half-yearly, and yearly plans with editable discounts from admin.
- `PENDING` Grocery bundle upsell flow driven by admin-managed bundle data.
- `PENDING` Customer notification prompt after purchase for subscription/bundle choices.
- `PENDING` Final live domain cutover checklist and production smoke test after domain attachment.

## Go-Live Recommendation
- `PARTIAL` Safe for another focused UAT round.
- `PENDING` Do not do final public go-live until the end-to-end live journey is revalidated:
1. Customer login -> add to bag -> checkout -> payment -> my orders
2. Supplier login -> dashboard -> orders
3. Admin login -> dashboard -> orders / products / offers
