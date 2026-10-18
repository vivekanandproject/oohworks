# infra

- `terraform/`: Google Cloud (asia-south1) for the `shared`, `staging` and `prod` projects. How to apply it is in `terraform/README.md`.
- `ci/github-actions-ci.yml`: checks on every pull request and push. `ci/github-actions-deploy.yml`: deploys `main` to staging and `v*` tags to production. Both are parked here until a GitHub token may push files under `.github/workflows/`.

See `docs/ohworks-build-plan.md` sections 1 and 8, and `docs/oohworks-product-roadmap.md` phase 0.
