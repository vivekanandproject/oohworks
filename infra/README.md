# infra

Terraform for Google Cloud (asia-south1) and Cloudflare. Applied once a billing account exists; see `docs/ohworks-build-plan.md` section 1 and 8.

Planned layout:

- `bootstrap/`: Terraform state bucket in the shared project
- `modules/`: cloud-run-service, cloud-sql, memorystore, artifact-registry, wif, budgets, cloudflare-zone
- `envs/shared`, `envs/staging`, `envs/prod`
