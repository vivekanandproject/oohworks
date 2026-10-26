# infra

- `terraform/`: Google Cloud (asia-south1) for the `shared`, `staging` and `prod` projects. How to apply it is in `terraform/README.md`.
- `ci/github-actions-ci.yml`: checks on every pull request and push. `ci/github-actions-deploy.yml`: deploys `main` to staging and `v*` tags to production. Both are parked here until a GitHub token may push files under `.github/workflows/`.
- `deploy.sh` with `cloudbuild.yaml`: deploys the current checkout from a machine until the GitHub workflow is in place. Builds both images on Cloud Build (as the `cloud-build` account from `terraform/envs/shared`), runs the `release` job, then moves the `web` service to the new image.
- `cloudflare/worker.js`: the Worker `oohworks-origin` that puts oohworks.co in front of Cloud Run (the Free plan cannot rewrite the Host header). It adds `X-Origin-Secret`, keeps the visitor's IP headers and sends www to oohworks.co.

## What runs today (26 Oct 2026)

Lean production only, with `shared` and `prod` both in the one project `oohworks`: Cloud SQL `db-g1-small` (Enterprise edition), the `web` service scaling to zero, a budget of MYR 150 a month (the billing account bills in ringgit). DNS is on Cloudflare (zone oohworks.co, nameservers moved from Squarespace), with DNSSEC signed by Cloudflare. `origin_check` is on, so the run.app address answers 403 to everything but `/api/health/` and `/api/jobs/`. The values for real traffic are in the comment in `terraform/envs/prod/main.tf`.

See `docs/ohworks-build-plan.md` sections 1 and 8, and `docs/oohworks-product-roadmap.md` phase 0.
