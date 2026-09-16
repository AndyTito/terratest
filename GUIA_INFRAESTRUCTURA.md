# 📘 Guía Completa: Infraestructura Fullstack en GCP Cloud Run con Terraform (100% Free Tier)

Esta guía documenta paso a paso todo el proceso realizado para crear, configurar, contenedorizar y desplegar una arquitectura Fullstack (Frontend + Backend) en **Google Cloud Platform (GCP)** usando **Terraform**, garantizando un costo de **$0.00** bajo el nivel gratuito permanente (*Always Free Tier*).

---

## 🏛️ 1. Arquitectura del Sistema

```
[ Usuario en Internet ]
          │
          ├── HTTPS (Puerto 443) ──► [ Frontend: Cloud Run ] (Nginx + Vite SPA)
          │                                  │
          │                           fetch() REST API
          │                                  ▼
          └── HTTPS (Puerto 443) ──► [ Backend: Cloud Run ] (Node.js + Express)
                                             │
                                   Variables de entorno:
                                   • PORT = 8080 (Cloud Run)
                                   • APP_ENV = production
                                   • APP_SECRET = (Protegido)
```

- **Frontend**: Single Page Application (Vite + Vanilla JS/CSS). Compilado en estáticos y servido por **Nginx Alpine (~25 MB)**.
- **Backend**: API REST en **Node.js 22 Alpine (~150 MB)** con endpoints `/api/health`, `/api/messages` y `/api/secret-data` (protegido por cabecera `x-app-secret`).
- **Registro de Imágenes**: **Artifact Registry** de Google Cloud (repositorio formato Docker).
- **Ejecución Serveless**: **Google Cloud Run v2** con escalado a cero (cero consumo si no hay tráfico).
- **Infraestructura como Código (IaC)**: **Terraform** automatizando la creación, permisos y despliegue.

---

## 🛠️ 2. Prerrequisitos Instalados

En macOS (con Homebrew):
```bash
# 1. Instalar Terraform
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 2. Instalar Google Cloud CLI
brew install --cask google-cloud-sdk

# 3. Verificar instalaciones
terraform version   # Terraform v1.16+
gcloud --version     # Google Cloud SDK 585+
docker --version     # Docker Desktop activo
```

---

## 🔑 3. Configuración Inicial de Google Cloud (GCP)

### 3.1. Autenticación en la máquina local
```bash
# Iniciar sesión con tu cuenta de Google
gcloud auth login

# Crear credenciales por defecto para que Terraform pueda operar en GCP
gcloud auth application-default login
```

### 3.2. Creación y vinculación del Proyecto
```bash
# Crear un proyecto limpio
gcloud projects create terra-fullstack-demo --name="Terra Fullstack Demo"
gcloud config set project terra-fullstack-demo

# Listar tu cuenta de facturación existente
gcloud billing accounts list

# Vincular la cuenta de facturación al proyecto (Obligatorio para Cloud Run, aunque sea $0.00)
gcloud billing projects link terra-fullstack-demo --billing-account=TU_BILLING_ACCOUNT_ID
```

---

## 📦 4. Contenedorización con Docker

### 4.1. Backend (`back/Dockerfile`)
```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8080
ENV APP_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
```

### 4.2. Frontend (`front/Dockerfile` - Multi-Stage Build)
```dockerfile
# Etapa 1: Compilación de la web con Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor ultraligero con Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### ⚠️ Lección Clave de Docker (Mac M1/M2/M3/M4):
Al compilar en Mac con chip Apple Silicon, Docker crea imágenes ARM64 por defecto. Google Cloud Run requiere arquitectura **`linux/amd64`**. Por tanto, el comando de compilación siempre debe llevar:
```bash
docker build --platform linux/amd64 ...
```

---

## 🏗️ 5. Estructura de Terraform (`infra/`)

### 5.1. `versions.tf` (Proveedor oficial)
```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
```

### 5.2. `variables.tf` y Reglas de Free Tier ($0.00)
Configuramos límites estrictos para evitar facturación:
- `min_instance_count = 0`: **Escalado a cero**. Si nadie entra a la web, Cloud Run apaga los contenedores y el costo es **$0.00**.
- `max_instance_count = 2`: Tope de seguridad ante ataques de tráfico.
- `cpu_idle = true`: La CPU se apaga en milisegundos cuando no se atienden peticiones HTTP.
- `limits`: Memoria mínima (256Mi para el front, 512Mi para el back).
- `app_secret`: Marcado con `sensitive = true` para no exponerlo en texto plano en la terminal.

### 5.3. `terraform.tfvars`
```hcl
project_id         = "terra-fullstack-demo"
region             = "us-central1"
environment        = "production"
app_secret         = "mi-clave-secreta-demo-12345"
artifact_repo_name = "terra-repo"

backend_image      = "us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-backend:latest"
frontend_image     = "us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-frontend:latest"
```

### 5.4. `main.tf` (Recursos creados)
1. **Habilitación de APIs internas de GCP**:
   - `run.googleapis.com` (Cloud Run).
   - `artifactregistry.googleapis.com` (Artifact Registry).
   - `disable_on_destroy = false` para no romper el proyecto si se hace un destroy.
2. **Repositorio Docker**:
   - `google_artifact_registry_repository.terra_repo` en `us-central1`.
3. **Servicios Cloud Run v2**:
   - `google_cloud_run_v2_service.backend` con inyección de variables de entorno (`APP_ENV`, `APP_SECRET`) y puerto 8080.
   - `google_cloud_run_v2_service.frontend` sirviendo Nginx en el puerto 8080.
4. **Acceso Público IAM (Sin pagar Load Balancer)**:
   - `google_cloud_run_v2_service_iam_member` asignando `roles/run.invoker` a `allUsers` tanto en backend como en frontend.

### 5.5. `outputs.tf`
Expone las URLs HTTPS públicas y la dirección del registro Docker:
```hcl
output "backend_url" {
  value = google_cloud_run_v2_service.backend.uri
}

output "frontend_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "artifact_registry_repo" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.terra_repo.repository_id}"
}
```

---

## 🚀 6. El Flujo de Despliegue Paso a Paso

### Paso 1: Resolver el dilema del "Huevo o la Gallina"
> *Para subir imágenes necesitas el repositorio de Docker, pero para crear Cloud Run necesitas que las imágenes ya existan.*

Solución:
1. En `terraform.tfvars` usamos al inicio la imagen pública de Google:
   ```hcl
   backend_image  = "us-docker.pkg.dev/cloudrun/container/hello"
   frontend_image = "us-docker.pkg.dev/cloudrun/container/hello"
   ```
2. Inicializar y aplicar:
   ```bash
   cd infra
   terraform init
   terraform apply
   ```
   Esto crea las APIs, el repositorio `terra-repo` y los servicios base.

---

### Paso 2: Autenticar Docker y Subir tus Imágenes Reales
```bash
# Autenticar Docker con Artifact Registry de GCP
gcloud auth configure-docker us-central1-docker.pkg.dev

# Compilar y subir Backend (con arquitectura amd64)
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-backend:latest ../back
docker push us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-backend:latest

# Compilar y subir Frontend (con arquitectura amd64)
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-frontend:latest ../front
docker push us-central1-docker.pkg.dev/terra-fullstack-demo/terra-repo/terra-frontend:latest
```

---

### Paso 3: Desplegar tus Imágenes Reales
En `terraform.tfvars` cambiamos a las imágenes de Artifact Registry y aplicamos:
```bash
terraform apply
```
*(O si se necesita forzar la recreación: `terraform apply -replace="google_cloud_run_v2_service.backend" -replace="google_cloud_run_v2_service.frontend"`)*.

---

## 🧹 7. Destrucción y Limpieza Completa

Para apagar y eliminar todos los recursos cuando ya no los necesites:
```bash
terraform destroy
```
- Destruye los servicios de Cloud Run y permisos IAM.
- Deja el costo en **$0.00**.

---

## 🧠 8. Lecciones Aprendidas y Errores Resueltos

| Error / Desafío | Causa | Solución Aplicada |
| :--- | :--- | :--- |
| `reserved env names were provided: PORT` | En Cloud Run v2, `PORT` es una variable reservada del sistema | Se quitó `PORT` de `env` y se usó el bloque nativo `ports { container_port = 8080 }` |
| `must support amd64/linux` | Los Macs con chip M1/M2/M3 compilan para ARM64 por defecto | Añadir `--platform linux/amd64` a los comandos `docker build` |
| `403 Forbidden` tras recrear | Al recrear un servicio Cloud Run, GCP purga sus enlaces IAM | Ejecutar `terraform apply` para restablecer el miembro `allUsers` con rol `roles/run.invoker` |
| `Image not found` tras destroy | Al hacer destroy se borró el repositorio y las imágenes | Subir las imágenes primero (`docker push`) y luego ejecutar `terraform apply` |
| Evitar costos de Load Balancer | Un Cloud Load Balancer cuesta ~$18 USD/mes | No usar Load Balancer; usar las URLs HTTPS nativas gratuitas de Cloud Run (`*.a.run.app`) |
