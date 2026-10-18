# One ohworks environment: its network, database, secrets, the web service and the release job.
# Used by envs/staging and envs/prod. Images come from the shared project's Artifact Registry and are
# deployed by GitHub Actions; Terraform creates the service with a placeholder and then leaves the
# image alone.

locals {
  # Secrets Terraform makes itself. Their values sit in the state, which lives in a private bucket.
  generated = ["DATABASE_URL", "PAYLOAD_SECRET", "ORIGIN_SECRET", "CRON_SECRET"]
  # A release refuses to finish without a super admin (apps/web/scripts/release.mjs).
  release_secrets = ["SUPER_ADMIN_EMAILS", "SUPER_ADMIN_PASSWORD"]
  all_secrets     = toset(concat(local.generated, local.release_secrets, var.optional_secrets))
  placeholder     = "us-docker.pkg.dev/cloudrun/container/hello"
  site_env        = var.name
}

data "google_project" "this" {
  project_id = var.project_id
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
    "iap.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudscheduler.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# Network: the database has a private address only; Cloud Run reaches it by direct VPC egress.
resource "google_compute_network" "vpc" {
  project                 = var.project_id
  name                    = "ohworks"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

resource "google_compute_subnetwork" "run" {
  project       = var.project_id
  name          = "run"
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = "10.10.0.0/24"
}

resource "google_compute_global_address" "sql" {
  project       = var.project_id
  name          = "cloud-sql"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "sql" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.sql.name]
}

resource "google_sql_database_instance" "db" {
  project             = var.project_id
  name                = "ohworks"
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = var.db_disk_gb
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "20:30" # 02:00 in India
      point_in_time_recovery_enabled = var.db_point_in_time_recovery
      backup_retention_settings {
        retained_backups = 14
      }
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  depends_on = [google_service_networking_connection.sql]
}

resource "google_sql_database" "ohworks" {
  project  = var.project_id
  instance = google_sql_database_instance.db.name
  name     = "ohworks"
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_user" "ohworks" {
  project  = var.project_id
  instance = google_sql_database_instance.db.name
  name     = "ohworks"
  password = random_password.db.result
}

resource "random_password" "payload" {
  length  = 48
  special = false
}

resource "random_password" "origin" {
  length  = 40
  special = false
}

resource "random_password" "cron" {
  length  = 40
  special = false
}

resource "google_secret_manager_secret" "s" {
  for_each  = local.all_secrets
  project   = var.project_id
  secret_id = each.value
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "generated" {
  for_each = {
    DATABASE_URL   = "postgres://ohworks:${random_password.db.result}@${google_sql_database_instance.db.private_ip_address}:5432/ohworks"
    PAYLOAD_SECRET = random_password.payload.result
    ORIGIN_SECRET  = random_password.origin.result
    CRON_SECRET    = random_password.cron.result
  }
  secret      = google_secret_manager_secret.s[each.key].id
  secret_data = each.value
}

# Cloud Run pulls images as its own service agent, so that agent may read the shared registry.
resource "google_artifact_registry_repository_iam_member" "pull" {
  project    = var.registry_project
  location   = var.region
  repository = var.registry_repository
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:service-${data.google_project.this.number}@serverless-robot-prod.iam.gserviceaccount.com"
  depends_on = [google_project_service.apis]
}

# The identity the service and the release job run as.
resource "google_service_account" "web" {
  project      = var.project_id
  account_id   = "ohworks-web"
  display_name = "ohworks web service and release job"
}

resource "google_secret_manager_secret_iam_member" "web" {
  for_each  = google_secret_manager_secret.s
  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web.email}"
}

locals {
  # The web service never needs the super admin's first password; only the release job does.
  web_secrets     = setsubtract(local.all_secrets, toset(local.release_secrets))
  release_job_env = local.all_secrets
  # In production the origin secret is checked (Cloudflare adds it); a staff-only environment sits
  # behind Google sign-in instead, and its run.app address is the way in.
  checked_secrets = var.public ? local.web_secrets : setsubtract(local.web_secrets, toset(["ORIGIN_SECRET"]))
}

resource "google_cloud_run_v2_service" "web" {
  provider            = google-beta
  project             = var.project_id
  name                = "web"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.deletion_protection
  launch_stage        = var.public ? "GA" : "BETA"
  iap_enabled         = !var.public

  template {
    service_account = google_service_account.web.email
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    vpc_access {
      egress = "PRIVATE_RANGES_ONLY"
      network_interfaces {
        network    = google_compute_network.vpc.id
        subnetwork = google_compute_subnetwork.run.id
      }
    }
    containers {
      image = local.placeholder
      ports {
        container_port = 8080
      }
      resources {
        limits = { cpu = var.cpu, memory = var.memory }
      }
      env {
        name  = "SITE_ENV"
        value = local.site_env
      }
      env {
        name  = "SERVICE_ROLE"
        value = "web"
      }
      env {
        name  = "SITE_URL"
        value = var.site_url
      }
      dynamic "env" {
        for_each = local.checked_secrets
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.s[env.value].secret_id
              version = "latest"
            }
          }
        }
      }
      startup_probe {
        http_get {
          path = "/api/health/"
        }
        period_seconds    = 5
        failure_threshold = 24
      }
    }
  }

  lifecycle {
    # Deploys change the image; Terraform owns everything else.
    ignore_changes = [template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_secret_manager_secret_version.generated, google_secret_manager_secret_iam_member.web]
}

# Production: anyone may reach it (Cloudflare in front, the origin secret checked by the app).
resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.public ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Staging and previews: Google sign-in for the listed staff, then the identity-aware proxy calls the service.
resource "google_cloud_run_v2_service_iam_member" "iap_invoker" {
  count    = var.public ? 0 : 1
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.this.number}@gcp-sa-iap.iam.gserviceaccount.com"
}

resource "google_iap_web_cloud_run_service_iam_member" "staff" {
  provider               = google-beta
  for_each               = var.public ? toset([]) : toset(var.staff)
  project                = var.project_id
  location               = var.region
  cloud_run_service_name = google_cloud_run_v2_service.web.name
  role                   = "roles/iap.httpsResourceAccessor"
  member                 = each.value
}

# The release job: migrations, then the first users (Dockerfile target `release`). Run before each deploy.
resource "google_cloud_run_v2_job" "release" {
  project             = var.project_id
  name                = "release"
  location            = var.region
  deletion_protection = var.deletion_protection

  template {
    task_count = 1
    template {
      service_account = google_service_account.web.email
      max_retries     = 0
      timeout         = "900s"
      vpc_access {
        egress = "PRIVATE_RANGES_ONLY"
        network_interfaces {
          network    = google_compute_network.vpc.id
          subnetwork = google_compute_subnetwork.run.id
        }
      }
      containers {
        image = local.placeholder
        resources {
          limits = { cpu = "1", memory = "2Gi" }
        }
        env {
          name  = "SITE_ENV"
          value = local.site_env
        }
        env {
          name  = "SITE_URL"
          value = var.site_url
        }
        dynamic "env" {
          for_each = local.release_job_env
          content {
            name = env.value
            value_source {
              secret_key_ref {
                secret  = google_secret_manager_secret.s[env.value].secret_id
                version = "latest"
              }
            }
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image, client, client_version]
  }

  depends_on = [google_secret_manager_secret_version.generated, google_secret_manager_secret_iam_member.web]
}

# A monthly budget with alerts at 50%, 90% and 100%, emailed to the billing account's admins.
resource "google_billing_budget" "monthly" {
  count           = var.budget_billing_account == "" ? 0 : 1
  billing_account = var.budget_billing_account
  display_name    = "ohworks ${var.name}"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = "INR"
      units         = tostring(var.budget_monthly_inr)
    }
  }

  dynamic "threshold_rules" {
    for_each = [0.5, 0.9, 1.0]
    content {
      threshold_percent = threshold_rules.value
    }
  }
}

# The jobs on a timer (apps/web/src/lib/jobs), called on the web service with the cron secret. Paused
# where the service sits behind Google sign-in, which the scheduler's plain request cannot pass; run
# one there by hand with the secret if needed.
locals {
  jobs = {
    alerts        = { schedule = "0 * * * *", what = "Emails new sites to confirmed follows" }
    availability  = { schedule = "30 9 * * 1", what = "Asks owners to confirm availability" }
    "reply-times" = { schedule = "0 3 * * *", what = "Works out owners' reply times again" }
  }
}

resource "google_cloud_scheduler_job" "jobs" {
  for_each    = local.jobs
  project     = var.project_id
  region      = var.region
  name        = "ohworks-${each.key}"
  description = each.value.what
  schedule    = each.value.schedule
  time_zone   = "Asia/Kolkata"
  paused      = !var.public

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.web.uri}/api/jobs/${each.key}/"
    headers = {
      Authorization = "Bearer ${random_password.cron.result}"
    }
  }

  depends_on = [google_project_service.apis]
}
