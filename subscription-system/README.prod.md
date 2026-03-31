Production quickstart

1. Build the backend Docker image:

```bash
cd subscription-system
docker compose build
docker compose up -d
```

2. Verify the API is running:

```bash
curl -X POST http://localhost:4000/subscription/create -H 'Content-Type: application/json' -d @examples/subscription-example.json
```

3. Run the smoke test (from repository root):

```bash
node subscription-system/backend/src/scripts/smoke-test.js
```

Notes:
- Replace SQLite with Postgres for production; update `db.js` and migrations.
- Configure a process manager or container orchestrator for production reliability.

CI / Deployment (GitHub Actions)
- A workflow is included at `.github/workflows/docker-publish.yml` which builds the backend image and pushes to GitHub Container Registry (`ghcr.io/<owner>/rrpn-subscription-engine`).
- Provide `GITHUB_TOKEN` or a PAT with `packages:write` if using a separate account.

Production tips
- Use a managed Postgres instance and set `DATABASE_URL`.
- Set `ALLOWED_ORIGINS` to your frontend domain(s) (comma-separated) to lock down CORS.
- Rotate any credentials and store them in the host/container secret manager or GitHub Secrets.
