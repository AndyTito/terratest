output "backend_url" {
  description = "URL pública HTTPS generada automáticamente por Cloud Run para el Backend."
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL pública HTTPS generada automáticamente por Cloud Run para el Frontend."
  value       = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry_repo" {
  description = "URL base del repositorio Docker en Artifact Registry para subir las imágenes."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.terra_repo.repository_id}"
}
