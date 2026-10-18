# The shared project: the image registry, the bucket holding Terraform's state, and the identity
# GitHub Actions deploys with. No keys anywhere: GitHub proves who it is with Workload Identity.
#
# Applied first, with local state (`terraform init` with no backend), then moved into the bucket it
# makes: see infra/terraform/README.md.

terraform {
  required_version = ">= 1.9"
  required_providers {
    google = { source = "hashicorp/google", version = ">= 6.20" }
  }
}

variable "project_id" {
  description = "The shared project, such as ohworks-shared."
  type        = string
}

variable "region" {
  type    = string
  default = "asia-south1"
}

variable "github_repository" {
  description = "owner/name of the repository allowed to deploy."
  type        = string
  default     = "vivekanandproject/oohworks"
}

variable "environment_projects" {
  description = "The projects GitHub may deploy to, such as [\"ohworks-staging\", \"ohworks-prod\"]."
  type        = list(string)
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "this" {
  project_id = var.project_id
}

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "storage.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "state" {
  name                        = "${var.project_id}-terraform-state"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  versioning {
    enabled = true
  }
  depends_on = [google_project_service.apis]
}

resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = "ohworks"
  format        = "DOCKER"
  description   = "The web and release images."
  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 30
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # Only this repository can use the pool at all.
  attribute_condition = "assertion.repository == '${var.github_repository}'"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "deploy" {
  account_id   = "github-deploy"
  display_name = "GitHub Actions deploys"
}

resource "google_service_account_iam_member" "github" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_artifact_registry_repository_iam_member" "push" {
  location   = google_artifact_registry_repository.images.location
  repository = google_artifact_registry_repository.images.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deploy.email}"
}

# In each environment GitHub may deploy revisions, run the release job, and act as the runtime account.
resource "google_project_iam_member" "deploy" {
  for_each = {
    for pair in setproduct(var.environment_projects, ["roles/run.admin", "roles/iam.serviceAccountUser"]) :
    "${pair[0]} ${pair[1]}" => { project = pair[0], role = pair[1] }
  }
  project = each.value.project
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

output "state_bucket" {
  value = google_storage_bucket.state.name
}

output "registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
}

output "workload_identity_provider" {
  description = "GitHub secret GCP_WORKLOAD_IDENTITY_PROVIDER."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deploy_service_account" {
  description = "GitHub secret GCP_DEPLOY_SERVICE_ACCOUNT."
  value       = google_service_account.deploy.email
}
