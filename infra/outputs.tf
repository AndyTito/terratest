output "backend_url" {
  description = "URL pública HTTPS generada automáticamente por Cloud Run para el Backend."
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  description = "URL pública HTTPS generada automáticamente por Cloud Run para el Frontend."
  value       = google_cloud_run_v2_service.frontend.uri
}
