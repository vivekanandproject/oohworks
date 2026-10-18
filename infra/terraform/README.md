# Google Cloud for ohworks

Terraform for the three projects in `docs/ohworks-build-plan.md`: `shared` (image registry, Terraform state, GitHub's deploy identity), `staging` and `prod`. Region `asia-south1` (Mumbai). Validated with Terraform 1.16 and the Google provider 8.7 on 18 Oct 2026; not yet applied, because the accounts do not exist yet.

```
modules/environment   one environment: network, Cloud SQL, secrets, Cloud Run `web`, the `release` job, budget
envs/shared           Artifact Registry, state bucket, Workload Identity for GitHub, the deploy account
envs/staging          staff only, behind Google sign-in; scales to zero
envs/prod             public, behind Cloudflare; one warm instance; backups with point-in-time recovery
```

## What each environment runs

- **Cloud Run `web`**: the container from the `Dockerfile`. `SITE_ENV` is `staging` or `production`. Secrets arrive as environment variables from Secret Manager. Reaches the database over its private address only. At most one instance until Redis lands (roadmap 2.6).
- **Cloud Run job `release`**: the Dockerfile's `release` target. Runs the migrations, then the first users and reference data. The deploy workflow runs it before every deploy.
- **Cloud SQL Postgres 16**: private address only, daily backups kept 14 days; production adds seven days of point-in-time recovery and deletion protection.
- **Secrets**: `DATABASE_URL`, `PAYLOAD_SECRET` and `ORIGIN_SECRET` are made by Terraform. `SUPER_ADMIN_EMAILS` and `SUPER_ADMIN_PASSWORD` are yours to fill (the release refuses to finish without them). Any other key (`RESEND_API_KEY`, `EMAIL_FROM`, `ANTHROPIC_API_KEY`, `GOOGLE_MAPS_API_KEY`, `MAP_STYLE_URL`, the `R2_*` settings, `SENTRY_DSN`) is mounted once you list it in `optional_secrets`.
- **Who can open it**: staging answers only to the Google accounts in `staff`, through Identity-Aware Proxy. Production is open, and the app refuses any request without Cloudflare's `X-Origin-Secret`.

## Applying it, once

You need: a Google Cloud organisation and billing account, three empty projects (`ohworks-shared`, `ohworks-staging`, `ohworks-prod`) linked to it, `gcloud` signed in as an owner, and Terraform.

```bash
# 1. Shared project, with local state first.
cd infra/terraform/envs/shared
terraform init
terraform apply -var project_id=ohworks-shared -var 'environment_projects=["ohworks-staging","ohworks-prod"]'
# Move its state into the bucket it just made.
cat > backend.tf <<'TF'
terraform {
  backend "gcs" { prefix = "shared" }
}
TF
terraform init -migrate-state -backend-config="bucket=ohworks-shared-terraform-state"

# 2. The super admin settings for each environment (values never go in git).
for p in ohworks-staging ohworks-prod; do
  gcloud services enable secretmanager.googleapis.com --project $p
done
# (Terraform creates the empty secrets; fill them after step 3's first apply, then apply again.)

# 3. Staging. Copy terraform.tfvars.example to terraform.tfvars and fill it in.
cd ../staging
terraform init -backend-config="bucket=ohworks-shared-terraform-state"
terraform apply
printf 'you@example.com' | gcloud secrets versions add SUPER_ADMIN_EMAILS --data-file=- --project ohworks-staging
printf '<a first password, 12 characters or more>' | gcloud secrets versions add SUPER_ADMIN_PASSWORD --data-file=- --project ohworks-staging

# 4. Production, the same way, in envs/prod.
```

Then, for GitHub (Settings → Secrets and variables → Actions), from `terraform output` in `envs/shared`:

| Kind     | Name                             | Value                        |
| -------- | -------------------------------- | ---------------------------- |
| Secret   | `GCP_WORKLOAD_IDENTITY_PROVIDER` | `workload_identity_provider` |
| Secret   | `GCP_DEPLOY_SERVICE_ACCOUNT`     | `deploy_service_account`     |
| Variable | `GCP_SHARED_PROJECT`             | `ohworks-shared`             |
| Variable | `GCP_STAGING_PROJECT`            | `ohworks-staging`            |
| Variable | `GCP_PROD_PROJECT`               | `ohworks-prod`               |

Finally move `infra/ci/github-actions-ci.yml` and `infra/ci/github-actions-deploy.yml` to `.github/workflows/` and push with a token that has the workflow permission. The first push to `main` deploys staging.

## Adding a key later

```bash
printf '%s' "$VALUE" | gcloud secrets versions add RESEND_API_KEY --data-file=- --project ohworks-staging
```

then add `"RESEND_API_KEY"` to `optional_secrets` in that environment's `terraform.tfvars` and `terraform apply`. A name listed before it has a value stops the deploy.

## Still to decide or build

- **Addresses.** Cloud Run domain mappings are not offered in every region. The plan is Cloudflare in front of production's `run.app` address, with a Transform Rule adding `X-Origin-Secret` (the value of the `ORIGIN_SECRET` secret) and an Origin Rule rewriting the Host header; if the Cloudflare plan cannot rewrite Host, a global load balancer with a serverless network endpoint group does the same for about 18 USD a month. `staging.ohworks.com` needs the same, or staff use the `run.app` address.
- **One build per environment.** `NEXT_PUBLIC_SITE_URL` is written into the build, so the deploy workflow builds a commit once for staging and again for production. Reading the address at run time instead would let one image serve both, and is needed before previews (each preview has its own address): that is a code change in the app, not here.
- **Previews per pull request** with their own database (`docs/ohworks-preview-and-api-plan.md` section 5) need a job that creates the database inside the private network; not built yet.
- **Owner documents** are still written to the container's disk, which Cloud Run does not keep. They move to a private R2 bucket before production (roadmap 0.3).
- **State holds secrets.** The database password and the generated secrets are in Terraform's state; the state bucket is private, versioned and in the shared project only.
