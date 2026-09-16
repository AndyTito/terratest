# 📘 Guía Completa: Fullstack en GCP Cloud Run con Terraform (100% Free Tier)

Esta guía documenta todo el proceso para desplegar una arquitectura Fullstack (Frontend + Backend) en **Google Cloud Platform (GCP)** usando **Terraform** como IaC e imágenes Docker publicadas automáticamente en **GitHub Packages (ghcr.io)**, garantizando un costo de **$0.00** bajo el nivel gratuito permanente (*Always Free Tier*).

---

## 🏛️ 1. Arquitectura del Sistema

```
[ git push ]
      │
      ▼
[ GitHub Actions ]
  Compila imágenes Docker → las sube a ghcr.io (GitHub Packages)

      │
      ▼
  ghcr.io/andytito/terratest-backend:latest
  ghcr.io/andytito/terratest-frontend:latest

      │
      ▼  (npm run deploy — manual desde tu Mac)

[ Google Cloud Run ]
      │
      ├─► terra-frontend (Nginx + Vite SPA)  ← HTTPS gratis *.a.run.app
      │         │ fetch() REST API
      │         ▼
      └─► terra-backend (Node.js + Express)  ← HTTPS gratis *.a.run.app
                │
          Variables de entorno:
          • APP_ENV = production
          • APP_SECRET = (protegido)
```

- **Registry de imágenes**: **GitHub Packages (ghcr.io)** — gratuito para repos públicos.
- **Frontend**: SPA (Vite + Vanilla JS/CSS), compilado y servido por **Nginx Alpine**.
- **Backend**: API REST en **Node.js 22 Alpine** con endpoints `/api/health`, `/api/messages` y `/api/secret-data` (protegido por cabecera `x-app-secret`).
- **Ejecución Serverless**: **Google Cloud Run v2** con escalado a cero (costo $0.00 sin tráfico).
- **IaC**: **Terraform** gestionando servicios, permisos y APIs.

---

## 🛠️ 2. Prerrequisitos

En macOS (con Homebrew):
```bash
brew tap hashicorp/tap && brew install hashicorp/tap/terraform
brew install --cask google-cloud-sdk

terraform version   # Terraform v1.16+
gcloud --version    # Google Cloud SDK 585+
```

---

## 🔑 3. Configuración Inicial de GCP

```bash
gcloud auth login
gcloud auth application-default login

gcloud projects create terra-fullstack-demo --name="Terra Fullstack Demo"
gcloud config set project terra-fullstack-demo

gcloud billing accounts list
gcloud billing projects link terra-fullstack-demo --billing-account=TU_BILLING_ACCOUNT_ID
```

---

## 📦 4. Contenedorización con Docker

### Backend (`back/Dockerfile`)
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

### Frontend (`front/Dockerfile` — Multi-Stage Build)
```dockerfile
# Etapa 1: Compilación con Vite
FROM --platform=linux/amd64 node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor ultraligero con Nginx
FROM --platform=linux/amd64 nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### ⚠️ Mac Apple Silicon (M1/M2/M3/M4)
Cloud Run requiere arquitectura **`linux/amd64`**. Los Dockerfiles incluyen `--platform=linux/amd64` para garantizarlo en cualquier máquina.

---

## 🤖 5. CI/CD con GitHub Actions

El archivo `.github/workflows/docker-publish.yml` se ejecuta automáticamente con cada `git push` a `main`:

1. Hace checkout del código.
2. Inicia sesión en `ghcr.io` usando el token automático de GitHub (`GITHUB_TOKEN`).
3. Compila las imágenes con `--platform linux/amd64`.
4. Las sube a GitHub Packages.

**No se necesitan credenciales externas** — el `GITHUB_TOKEN` integrado lo gestiona todo.

```yaml
# Imágenes publicadas automáticamente:
ghcr.io/andytito/terratest-backend:latest
ghcr.io/andytito/terratest-frontend:latest
```

---

## 🏗️ 6. Infraestructura con Terraform (`infra/`)

### Recursos creados en GCP
| Recurso | Descripción |
| :--- | :--- |
| `google_project_service.cloud_run_api` | Activa la API de Cloud Run |
| `google_cloud_run_v2_service.backend` | Servicio backend (imagen de ghcr.io) |
| `google_cloud_run_v2_service.frontend` | Servicio frontend (imagen de ghcr.io) |
| `google_cloud_run_v2_service_iam_member` ×2 | Acceso público (`allUsers`) sin Load Balancer |

### `terraform.tfvars` (gitignored)
```hcl
project_id     = "terra-fullstack-demo"
region         = "us-central1"
environment    = "production"
app_secret     = "tu-clave-secreta"          # nunca se sube a GitHub

backend_image  = "ghcr.io/andytito/terratest-backend:latest"
frontend_image = "ghcr.io/andytito/terratest-frontend:latest"
```

### Controles de Free Tier ($0.00)
```hcl
min_instance_count = 0      # escala a cero → $0 sin tráfico
cpu_idle           = true   # CPU apagada entre requests
max_instance_count = 2      # tope para evitar sorpresas
memory_limit       = "512Mi" / "256Mi"
```

---

## 🚀 7. Flujo de Trabajo del Día a Día

### Primera vez (configurar infraestructura)
```bash
# Copiar plantilla y rellenar con tus valores reales
cp infra/terraform.tfvars.example infra/terraform.tfvars

# Crear los servicios Cloud Run en GCP
npm run infra:plan    # previsualizar
npm run infra:apply   # crear
```

### Ciclo normal de desarrollo
```bash
# 1. Programar → subir → GitHub Action publica imágenes en ghcr.io automáticamente
git add . && git commit -m "feat: cambio" && git push

# 2. Cuando quieras que los cambios lleguen a producción
npm run deploy         # actualiza backend Y frontend en Cloud Run
# — o por separado —
npm run deploy:back
npm run deploy:front
```

---

## 📋 Scripts Disponibles (`npm run ...`)

| Script | Descripción |
| :--- | :--- |
| `dev:back` | Servidor Node.js local con hot-reload |
| `dev:front` | Vite dev server local |
| `deploy:back` | Actualiza el backend en Cloud Run |
| `deploy:front` | Actualiza el frontend en Cloud Run |
| `deploy` | Actualiza ambos servicios en Cloud Run |
| `infra:plan` | Previsualiza cambios de Terraform |
| `infra:apply` | Aplica cambios de Terraform |
| `infra:destroy` | Destruye toda la infraestructura |

---

## 🌐 8. URLs de Producción

| Servicio | URL |
| :--- | :--- |
| **Frontend** | https://terra-frontend-unf2xuz4tq-uc.a.run.app |
| **Backend API** | https://terra-backend-unf2xuz4tq-uc.a.run.app |

---

## 📡 9. Endpoints del Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado, entorno, uptime y timestamp |
| `GET` | `/api/messages` | Lista todos los mensajes |
| `POST` | `/api/messages` | Agrega un mensaje `{ "author": "...", "text": "..." }` |
| `DELETE` | `/api/messages/:id` | Elimina un mensaje por ID |
| `GET` | `/api/secret-data` | Requiere cabecera `x-app-secret` válida → 403 si inválida |

---

## 🧹 10. Destrucción y Limpieza

```bash
npm run infra:destroy   # elimina todos los recursos de GCP
```

---

## 🧠 11. Lecciones Aprendidas

| Error | Causa | Solución |
| :--- | :--- | :--- |
| `reserved env names: PORT` | Cloud Run v2 reserva la variable `PORT` | Usar bloque `ports { container_port = 8080 }` en vez de `env PORT` |
| `must support amd64` | Macs M1/M2/M3 compilan ARM64 por defecto | `--platform linux/amd64` en Dockerfiles y GitHub Action |
| `403 Forbidden` tras recrear | Cloud Run purga los IAM al recrear el servicio | Ejecutar `terraform apply` para restablecer `allUsers` con `roles/run.invoker` |
| `Image not found` | Imagen no existía antes del `terraform apply` | Subir imágenes primero; si es la primera vez, usar la imagen pública de placeholder de Google |
| Costos del Load Balancer | Un Load Balancer cuesta ~$18 USD/mes | Usar las URLs HTTPS nativas gratuitas de Cloud Run (`*.a.run.app`) sin Load Balancer |

---

## 🔮 12. Próximos Pasos (Opcional)

- [ ] **CD automático**: Añadir `gcloud run deploy` al final del GitHub Action (requiere configurar credenciales GCP en GitHub Secrets)
- [ ] **Secretos seguros**: Mover `APP_SECRET` a Google Secret Manager
- [ ] **Dominio personalizado**: Configurar Cloud Run domain mapping con tu propio dominio
