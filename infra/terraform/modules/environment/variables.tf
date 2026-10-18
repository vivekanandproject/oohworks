variable "project_id" {
  description = "The Google Cloud project for this environment, such as oohworks-staging."
  type        = string
}

variable "name" {
  description = "staging or production. Becomes SITE_ENV."
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.name)
    error_message = "name is staging or production."
  }
}

variable "region" {
  type    = string
  default = "asia-south1"
}

variable "site_url" {
  description = "The address the site answers at, such as https://staging.oohworks.co."
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL machine type."
  type        = string
}

variable "db_disk_gb" {
  type    = number
  default = 10
}

variable "db_point_in_time_recovery" {
  description = "Seven days of point-in-time recovery. On in production."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Refuse to delete the database or the service. On in production."
  type        = bool
  default     = true
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  description = "Keep at 1 until the shared Redis rate limits and page cache land (see the product roadmap, 2.6)."
  type        = number
  default     = 1
}

variable "cpu" {
  type    = string
  default = "1"
}

variable "memory" {
  type    = string
  default = "1Gi"
}

variable "staff" {
  description = "Google accounts allowed through the sign-in in front of a staff-only environment, as user:you@example.com or group:team@example.com."
  type        = list(string)
  default     = []
}

variable "public" {
  description = "Open to everyone (production, behind Cloudflare) or staff only behind Google sign-in (staging and previews)."
  type        = bool
}

variable "optional_secrets" {
  description = "Secrets you have given a value with `gcloud secrets versions add`, mounted as environment variables of the same name. A secret listed here with no value stops the deploy, so add each one only once it has a value."
  type        = list(string)
  default     = []
}

variable "budget_billing_account" {
  description = "The billing account, for the budget alert. Leave empty to skip the budget."
  type        = string
  default     = ""
}

variable "budget_monthly_inr" {
  type    = number
  default = 10000
}

variable "registry_project" {
  description = "The shared project holding the image registry, such as oohworks-shared."
  type        = string
}

variable "registry_repository" {
  type    = string
  default = "oohworks"
}
