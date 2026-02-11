## Summary

Describe the change and why it is needed.

---

## Checklist
- [ ] Tests added or existing tests updated
- [ ] Lint passes locally
- [ ] Build succeeds locally
- [ ] Changes documented in `CONTRIBUTING.md` if they affect deploys or infra

## QA / Testing steps
1. Merge to `staging` or run the staging workflow via `workflow_dispatch`.
2. Verify admin/supplier/product flows in staging.

## Deployment notes
- Production deploys require manual approval and must follow `CONTRIBUTING.md`.
- Do not set `ALLOW_PROD_DEPLOY` in CI; use manual run or tag with `v*`.
