# Cloud Run Environment Variables

Set these environment variables in Cloud Run (Console or CLI):

- NODE_ENV
- PORT (Cloud Run sets this automatically, use process.env.PORT)
- DB_STORAGE or DATABASE_URL (for SQLite or PostgreSQL)
- SESSION_SECRET
- SMS_PROVIDER
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (if using Twilio)
- MSG91 config (if using MSG91)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (for email)

Refer to .env.example for all options. Use `--set-env-vars` in gcloud CLI or Cloud Console UI.
