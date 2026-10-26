# infra

- `terraform/`: Google Cloud (asia-south1) for the `shared`, `staging` and `prod` projects. How to apply it is in `terraform/README.md`.
- `.github/workflows/ci.yml` (at the repository root): checks on every pull request and push to `main`. `.github/workflows/deploy.yml`: a tag `v*` deploys to production, 10% first. `main` is not deployed on every push while there is no staging. Its repository variables are listed at the top of the file.
- `deploy.sh` with `cloudbuild.yaml`: the same deploy from a machine. Builds both images on Cloud Build (as the `cloud-build` account from `terraform/envs/shared`), runs the `release` job, then moves the `web` service to the new image.
- `cloudflare/worker.js`: the Worker `oohworks-origin` that puts oohworks.co in front of Cloud Run (the Free plan cannot rewrite the Host header). It adds `X-Origin-Secret`, keeps the visitor's IP headers and sends www to oohworks.co.

## What runs today (26 Oct 2026)

Lean production only, with `shared` and `prod` both in the one project `oohworks`: Cloud SQL `db-g1-small` (Enterprise edition), the `web` service scaling to zero, a budget of MYR 150 a month (the billing account bills in ringgit). DNS is on Cloudflare (zone oohworks.co, nameservers moved from Squarespace), with DNSSEC signed by Cloudflare. `origin_check` is on, so the run.app address answers 403 to everything but `/api/health/` and `/api/jobs/`. Alerts email `alert_email` when the health check fails from more than one region for five minutes, or the service answers more than ten 5xx errors in five minutes. `GA_MEASUREMENT_ID` and `INDEXNOW_KEY` are plain settings (both are public by design). The values for real traffic are in the comment in `terraform/envs/prod/main.tf`.

See `docs/ohworks-build-plan.md` sections 1 and 8, and `docs/oohworks-product-roadmap.md` phase 0.
