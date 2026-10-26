#!/usr/bin/env bash
# Deploys the current checkout to Cloud Run from this machine, the way infra/ci/github-actions-deploy.yml
# does from GitHub: build both images on Cloud Build, run the release job (migrations, first users),
# then send the web service to the new image once its health check answers.
#
#   infra/deploy.sh                 # project oohworks
#   PROJECT=oohworks-prod infra/deploy.sh
set -euo pipefail

PROJECT="${PROJECT:-oohworks}"
REGISTRY_PROJECT="${REGISTRY_PROJECT:-$PROJECT}"
REGION="${REGION:-asia-south1}"
REGISTRY="$REGION-docker.pkg.dev/$REGISTRY_PROJECT/oohworks"
TAG="$(git rev-parse --short=12 HEAD)$(git diff --quiet HEAD || echo -dirty)-production"

cd "$(git rev-parse --show-toplevel)"

# Browser error reports: the DSN Terraform gave the service (public by design), built into the page.
SENTRY_DSN="${SENTRY_DSN:-$(gcloud run services describe web --region "$REGION" --project "$PROJECT" \
  --format=json | python3 -c 'import json,sys; e=json.load(sys.stdin)["spec"]["template"]["spec"]["containers"][0].get("env",[]); print(next((x.get("value","") for x in e if x["name"]=="SENTRY_DSN"),""))')}"

echo "Building $TAG on Cloud Build"
# As the build account and source bucket from infra/terraform/envs/shared.
gcloud builds submit --project "$REGISTRY_PROJECT" --region "$REGION" --config infra/cloudbuild.yaml \
  --service-account "projects/$REGISTRY_PROJECT/serviceAccounts/cloud-build@$REGISTRY_PROJECT.iam.gserviceaccount.com" \
  --gcs-source-staging-dir "gs://$REGISTRY_PROJECT-build-source/source" \
  --substitutions "_REGISTRY=$REGISTRY,_TAG=$TAG,_SENTRY_DSN=$SENTRY_DSN" .

echo "Preparing the database"
gcloud run jobs update release --image "$REGISTRY/release:$TAG" --region "$REGION" --project "$PROJECT" --quiet
gcloud run jobs execute release --wait --region "$REGION" --project "$PROJECT"

echo "Deploying the web service"
gcloud run deploy web --image "$REGISTRY/web:$TAG" --region "$REGION" --project "$PROJECT" --quiet
URL=$(gcloud run services describe web --region "$REGION" --project "$PROJECT" --format='value(status.url)')
curl -sf "$URL/api/health/" > /dev/null && echo "Live at $URL"
# Rolling back is one command: gcloud run services update-traffic web --to-revisions=<previous>=100
