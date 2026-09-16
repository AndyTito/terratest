# Infraestructura con Terraform para GCP Cloud Run (100% Free Tier)

Este módulo gestiona la infraestructura como código (IaC) para desplegar el proyecto Fullstack en **Google Cloud Platform (GCP)** asegurando un costo de **$0.00** bajo el nivel gratuito permanente (Always Free Tier).

---

## 🛡️ Reglas y Garantías de Free Tier Aplicadas

| Recurso | Límite Free Tier de GCP | Configuración en Terraform | Costo Esperado |
| :--- | :--- | :--- | :--- |
| **Cloud Run (Peticiones)** | 2 millones de peticiones/mes gratis | Autoscaling controlado | **$0.00** |
| **Cloud Run (Cómputo)** | 360,000 GB-s memoria / 180,000 vCPU-s | `cpu_idle = true`, `memory = 256/512Mi`, `cpu = 1` | **$0.00** |
| **Cloud Run (Instancias)** | Paga $0 cuando no hay tráfico | **`min_instance_count = 0`** (Escala a cero) | **$0.00** |
| **Protección contra picos** | N/A | **`max_instance_count = 2`** (Tope de seguridad) | **$0.00** |
| **Artifact Registry** | 500 MB de almacenamiento gratis al mes | Imágenes optimizadas (~175 MB en total) | **$0.00** |
| **Certificados HTTPS y DNS** | Incluidos gratis por Cloud Run | URLs públicas gestionadas por Google | **$0.00** |
| **Load Balancer** | $18+/mes si usas balanceador externo | **NO se crea Load Balancer**, se usa acceso directo | **$0.00** |

---

## 🚀 Guía de Despliegue Paso a Paso

### 1. Prerrequisitos
Tener instalado y configurado en tu máquina:
- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- [Terraform CLI](https://developer.hashicorp.com/terraform/install)
- [Docker](https://docs.docker.com/get-docker/)

Autentícate con tu cuenta de GCP:
```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project TU_PROJECT_ID
```

---

### 2. Configuración de Variables Locales
Copia el archivo de ejemplo para definir tus datos:
```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
```
Edita `terraform.tfvars` con tu `project_id` y tu clave `app_secret`.

---

### 3. Inicializar y Aplicar Terraform
```bash
# Inicializar los proveedores (descarga el plugin de Google)
terraform init

# Ver el plan de ejecución sin aplicar cambios
terraform plan

# Aplicar los cambios en tu proyecto de GCP
terraform apply
```

Al terminar, Terraform imprimirá en tu terminal las URLs públicas HTTPS generadas para el backend y frontend.

---

### 4. Compilar y Subir tus Imágenes Propias
Una vez creado el repositorio con Terraform, puedes subir tus contenedores reales:

```bash
# 1. Configurar Docker con Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# 2. Compilar y subir el Backend
docker build -t us-central1-docker.pkg.dev/TU_PROJECT_ID/terra-repo/terra-backend:latest ../back
docker push us-central1-docker.pkg.dev/TU_PROJECT_ID/terra-repo/terra-backend:latest

# 3. Compilar y subir el Frontend
docker build -t us-central1-docker.pkg.dev/TU_PROJECT_ID/terra-repo/terra-frontend:latest ../front
docker push us-central1-docker.pkg.dev/TU_PROJECT_ID/terra-repo/terra-frontend:latest
```

Luego descomentas las líneas `backend_image` y `frontend_image` en tu `terraform.tfvars` y ejecutas de nuevo `terraform apply`.
