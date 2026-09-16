variable "project_id" {
  type        = string
  description = "El ID del proyecto en Google Cloud donde se desplegarán los recursos."
}

variable "region" {
  type        = string
  description = "La región geográfica de GCP donde se crearán los servicios de Cloud Run."
  default     = "us-central1"
}

variable "environment" {
  type        = string
  description = "Nombre del entorno (ej. development, staging, production)."
  default     = "production"
}

variable "app_secret" {
  type        = string
  description = "Clave secreta que se inyectará como variable de entorno APP_SECRET al backend."
  sensitive   = true # Evita que Terraform imprima este valor en texto plano en la consola
  default     = "clave-secreta-cloudrun-12345"
}

variable "artifact_repo_name" {
  type        = string
  description = "Nombre del repositorio Docker en Artifact Registry."
  default     = "terra-repo"
}

variable "backend_image" {
  type        = string
  description = "URI de la imagen de contenedor para el backend."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "frontend_image" {
  type        = string
  description = "URI de la imagen de contenedor para el frontend."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "min_instance_count" {
  type        = number
  description = "Mínimo de instancias activas. 0 permite escalar a cero y no pagar nada cuando está inactivo."
  default     = 0
}

variable "max_instance_count" {
  type        = number
  description = "Tope máximo de instancias para evitar costos inesperados o ataques de tráfico."
  default     = 2
}

variable "cpu_limit" {
  type        = string
  description = "Límite de CPU por contenedor (1 vCPU dentro del rango Free Tier)."
  default     = "1"
}

variable "memory_limit" {
  type        = string
  description = "Límite de memoria por contenedor (256Mi para frontend, 512Mi para backend)."
  default     = "512Mi"
}

