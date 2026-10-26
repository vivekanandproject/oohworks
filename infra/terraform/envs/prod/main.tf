# The production environment. Apply after envs/shared; see infra/terraform/README.md.

terraform {
  required_version = ">= 1.9"
  backend "gcs" {
    # bucket is given at init: terraform init -backend-config="bucket=<shared project>-terraform-state"
    prefix = "prod"
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

# Sized for launch (26 Oct 2026): a shared-core database and no warm instance, about INR 1,500 to
# 2,500 a month. For real traffic: db_tier "db-custom-2-8192", point-in-time recovery on,
# min_instances 1, budget 80000.
variable "db_tier" {
  type    = string
  default = "db-g1-small"
}

variable "db_point_in_time_recovery" {
  type    = bool
  default = false
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "budget_monthly_inr" {
  description = "In budget_currency."
  type        = number
  default     = 3000
}

variable "budget_currency" {
  description = "The billing account's currency; the oohworks.co account bills in MYR (set in terraform.tfvars)."
  type        = string
  default     = "INR"
}

variable "ga_measurement_id" {
  description = "Google Analytics 4 measurement id for oohworks.co (G-...)."
  type        = string
  default     = ""
}

variable "indexnow_key" {
  description = "IndexNow key for oohworks.co (32 hex characters, public by design)."
  type        = string
  default     = ""
}

variable "origin_check" {
  description = "Turn on once Cloudflare in front adds X-Origin-Secret; until then the run.app address serves the site."
  type        = bool
  default     = false
}

provider "google" {
  project = var.project_id
  region  = "asia-south1"
  # The budget API refuses user credentials without a project to bill the request to.
  user_project_override = true
  billing_project       = var.project_id
}

provider "google-beta" {
  project = var.project_id
  region  = "asia-south1"
  # The budget API refuses user credentials without a project to bill the request to.
  user_project_override = true
  billing_project       = var.project_id
}

module "ohworks" {
  source                    = "../../modules/environment"
  project_id                = var.project_id
  registry_project          = var.registry_project
  name                      = "production"
  site_url                  = "https://oohworks.co"
  public                    = true
  staff                     = var.staff
  origin_check              = var.origin_check
  ga_measurement_id         = var.ga_measurement_id
  indexnow_key              = var.indexnow_key
  db_tier                   = var.db_tier
  db_point_in_time_recovery = var.db_point_in_time_recovery
  deletion_protection       = true
  min_instances             = var.min_instances
  memory                    = "1Gi"
  optional_secrets          = var.optional_secrets
  budget_billing_account    = var.billing_account
  budget_monthly_inr        = var.budget_monthly_inr
  budget_currency           = var.budget_currency
}

output "service_url" {
  value = module.ohworks.service_url
}

output "database_instance" {
  value = module.ohworks.database_instance
}
