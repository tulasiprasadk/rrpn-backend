# Contributing & Deploy Policy

This repository follows a staging-first workflow with manual controls for production deploys.

Principles
- Always test changes in `staging` before deploying to production.
- Protect `main`/`production` branches with reviews and passing CI checks.
- Production deploys are manual or tag-based and require explicit approval.

Local development
1. See `backend/README_DEV.md` for backend setup and seeding.
2. Use `node scripts/create-approved-admin.js` to create a local approved admin for testing.

Branch strategy
- `main`: integration branch — protected; requires PR review and passing CI.
- `staging`: deploy candidate branch — push triggers staging workflow.
- `production`: production branch — protected and only updated via approved release process.

CI & PRs
- PRs must pass `pr-checks.yml` (lint/build/tests) before merging.
- Use the PR template to list QA steps and deployment notes.

Deploy rules
- Staging: pushes to `staging` or manual `workflow_dispatch` trigger the staging workflow.
- Production: only deploy via:
  - GitHub Actions `workflow_dispatch` on `deploy-prod.yml`, or
  - Pushing a release tag matching `v*` (e.g., `v1.2.3`).
- To prevent accidental production deploys, scripts/commands that deploy to production require `ALLOW_PROD_DEPLOY=true` in the local environment and the GitHub Action deploy step remains a manual placeholder until explicitly configured.

Rollback & DB
- Always create a DB backup before destructive changes. Use SQL `CREATE TABLE backup AS SELECT * FROM ...` or provider snapshots.

Security
- Never commit secrets. Use repository secrets for CI and hosting provider secrets for deploys.

If you are unsure about a deploy, stop and ask a maintainer for approval.
