resource "google_project_service" "cloud_run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifact_registry_api" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "terra_repo" {
  repository_id = var.artifact_repo_name
  format        = "DOCKER"
  location      = var.region
  description   = "Repositorio Docker para imagenes de backend y frontend (Terra Project)"

#  lifecycle {
#    prevent_destroy = true
#  }

  depends_on = [google_project_service.artifact_registry_api]
}

resource "google_cloud_run_v2_service" "backend" {
  name     = "terra-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.backend_image

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle = true
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "APP_ENV"
        value = var.environment
      }

      env {
        name  = "APP_SECRET"
        value = var.app_secret
      }
    }
  }

  depends_on = [google_project_service.cloud_run_api]
}

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = "terra-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.frontend_image

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
        cpu_idle = true
      }

      ports {
        container_port = 8080
      }
    }
  }

  depends_on = [google_project_service.cloud_run_api]
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = google_cloud_run_v2_service.frontend.location
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
