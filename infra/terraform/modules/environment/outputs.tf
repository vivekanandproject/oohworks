output "service_url" {
  description = "The service's own run.app address. In production, Cloudflare points ohworks.com here."
  value       = google_cloud_run_v2_service.web.uri
}

output "service_account" {
  value = google_service_account.web.email
}

output "database_instance" {
  description = "For Cloud SQL Studio and the Cloud SQL Auth Proxy."
  value       = google_sql_database_instance.db.connection_name
}

output "origin_secret_name" {
  description = "Cloudflare's Transform Rule sends this secret's value as X-Origin-Secret."
  value       = google_secret_manager_secret.s["ORIGIN_SECRET"].secret_id
}
