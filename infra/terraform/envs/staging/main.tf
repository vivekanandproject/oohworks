# The staging environment. Apply after envs/shared; see infra/terraform/README.md.

terraform {
  required_version = ">= 1.9"
  backend "gcs" {
    # bucket is given at init: terraform init -backend-config="bucket=<shared project>-terraform-state"
    prefix = "staging"
  }
}

variable "project_id" {
  type = string
}

variable "registry_project" {
  description = "The shared project, such as oohworks-shared."
  type        = string
}

variable "staff" {
  description = "Google accounts allowed in, as user:name@example.com."
  type        = list(string)
  default     = []
}

variable "optional_secrets" {
  type    = list(string)
  default = []
}

variable "billing_account" {
  description = "For the budget alert; empty skips it."
  type        = string
  default     = ""
}

provider "google" {
  project = var.project_id
  region  = "asia-south1"
}

provider "google-beta" {
  project = var.project_id
  region  = "asia-south1"
}

module "ohworks" {
  source                    = "../../modules/environment"
  project_id                = var.project_id
  registry_project          = var.registry_project
  name                      = "staging"
  site_url                  = "https://staging.oohworks.co"
  public                    = false
  staff                     = var.staff
  db_tier                   = "db-custom-1-3840"
  db_point_in_time_recovery = false
  deletion_protection       = false
  min_instances             = 0
  memory                    = "1Gi"
  optional_secrets          = var.optional_secrets
  budget_billing_account    = var.billing_account
  budget_monthly_inr        = 8000
}

output "service_url" {
  value = module.ohworks.service_url
}

output "database_instance" {
  value = module.ohworks.database_instance
}
