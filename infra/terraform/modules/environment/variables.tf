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

variable "ga_measurement_id" {
  description = "Google Analytics 4 measurement id (G-...), read by the app at run time; only production sends hits. Not a secret: it is in every page."
  type        = string
  default     = ""
}

variable "origin_check" {
  description = "Mount ORIGIN_SECRET on a public service, so the app refuses requests that did not come through Cloudflare. Leave off until Cloudflare (or a load balancer) adds the header, or every page answers 403."
  type        = bool
  default     = true
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
  description = "The monthly budget, in budget_currency (named for INR, the plan's currency)."
  type        = number
  default     = 10000
}

variable "budget_currency" {
  description = "Must be the billing account's own currency, or Google refuses the budget."
  type        = string
  default     = "INR"
}

variable "registry_project" {
  description = "The shared project holding the image registry, such as oohworks-shared."
  type        = string
}

variable "registry_repository" {
  type    = string
  default = "oohworks"
}
