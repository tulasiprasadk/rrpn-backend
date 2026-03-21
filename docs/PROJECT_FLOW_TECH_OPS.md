# RRPN Project Flow (Technical + Operational)
Updated: 2026-03-20

## 1. Customer Flow
1. Customer lands on the home page and browses via category, search, or dashboard search.
2. Customer adds products to bag.
3. Customer logs in through Google OAuth for now.
4. Customer selects an existing saved address or adds a new one.
5. Customer reaches checkout, reviews offers, and enters promo/reference code if available.
6. Order is created.
7. Customer submits payment details.
8. Customer tracks the order from My Orders.

## 2. Supplier Flow
1. Supplier signs in.
2. New supplier completes registration and KYC.
3. Admin reviews and approves supplier.
4. Supplier uses dashboard/sidebar to manage products and view incoming orders.
5. Supplier processes and fulfills orders.

## 3. Admin Flow
1. Admin signs in.
2. Admin reviews dashboard metrics and notifications.
3. Admin manages suppliers, products, categories, varieties, ads, checkout content, and orders.
4. Admin reviews payments and operational activity.
5. Admin updates catalog, content, pricing logic, and launch settings.

## 4. Technical Architecture
- Frontend: React + Vite in [frontend](/d:/RRPN/frontend)
- Backend: Express + Sequelize in [backend](/d:/RRPN/backend)
- Database: Sequelize models, currently with local SQLite support plus deployment DB support
- Auth: mixed session + token fallback model across customer, supplier, and admin areas
- Deployment: Vercel-oriented config exists for frontend and backend
- App shell: Capacitor Android project exists in [frontend/android](/d:/RRPN/frontend/android)
- Analytics hooks: frontend tracking utilities already exist, but production config still needs final activation

## 5. Environment Variables And Platform Inputs
Keep these in secure environment managers only.

### Frontend
- `VITE_API_BASE_URL`
- `VITE_BASE_URL` if serving under a subpath
- `VITE_GA4_MEASUREMENT_ID`

### Backend
- `JWT_SECRET`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `BACKEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` if used directly
- `DATABASE_URL` or equivalent DB connection variables
- Email/SMS/notification provider keys if those flows are active

### Google Cloud Console
- OAuth consent screen details
- Authorized JavaScript origins
- Authorized redirect URIs for customer and supplier login callbacks

### Supabase
- Project URL
- Public/anon key
- Service-role key
- Any storage bucket or auth settings if used by deployment/runtime

### Vercel
- Frontend project environment variables
- Backend project environment variables
- Domain attachment and redirect settings

### GitHub
- Deployment-related Actions secrets
- Repository environment secrets
- Branch protection and deployment approvals if used

## 6. Security Dos And Don'ts

### Do
- Store secrets only in platform secret managers or environment settings.
- Use separate dev, staging, and production credentials.
- Rotate secrets immediately if they may have been exposed.
- Use least-privilege keys wherever possible.
- Review logs before sharing them externally.

### Don't
- Do not share passwords, private keys, OAuth secrets, service-role keys, DB URLs, session secrets, or JWT secrets.
- Do not paste secrets into code, screenshots, chat history, issue comments, PR descriptions, or docs.
- Do not expose admin tokens in frontend logs or browser console output.
- Do not confuse public/anon keys with server-side secrets; even "public" keys should still be handled carefully and only used where intended.

## 7. Operational Launch Checklist
1. Verify Google OAuth redirect URIs against the real production domain.
2. Verify customer login -> dashboard -> address -> checkout -> payment -> my orders.
3. Verify supplier login -> dashboard -> orders -> products.
4. Verify admin login -> dashboard -> orders -> products -> offers.
5. Verify saved address creation, edit, and default-address reuse.
6. Verify promo/reference code display on checkout.
7. Verify supplier receives placed orders.
8. Verify admin can review payments and orders.
9. Verify analytics is receiving production traffic.
10. Verify responsive behavior on mobile, tablet, laptop, and desktop.
11. Verify product icon/name/Kannada content consistency on a representative product sample.
12. Run bulk replace on a safe test dataset before doing it for the full live catalog.

## 8. Current Known Gaps Before Public Go-Live
- Full-site Kannada conversion is not complete yet.
- Promo discount persistence at order-model level is not complete yet.
- Subscription prompt expansion and grocery bundle upsell are not complete yet.
- Product data normalization for icons and Kannada names still needs a final content pass.
- Final production UAT is still required after domain setup.
