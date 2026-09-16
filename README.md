# Terra Project: Fullstack (Front & Back)

Aplicación fullstack (React + Node.js) desplegada en **Google Cloud Run** con imágenes publicadas automáticamente en **GitHub Packages** via CI/CD.

---

## 📁 Estructura del Proyecto

```
terraproject/
├── back/               → API REST Node.js/Express
│   ├── server.js
│   └── Dockerfile
├── front/              → SPA React + Vite + Nginx
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   └── Dockerfile
├── infra/              → Infraestructura como código (Terraform)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   └── terraform.tfvars.example
├── .github/
│   └── workflows/
│       └── docker-publish.yml  → CI: build + push a ghcr.io
└── package.json        → Scripts de desarrollo y deploy
```

---

## 🚀 Desarrollo Local

```bash
# Backend (http://localhost:3001)
npm run dev:back

# Frontend (http://localhost:5173)
npm run dev:front
```

---

## ☁️ Despliegue en Producción

El flujo normal de trabajo es:

```bash
# 1. Subir código → GitHub Action compila y publica imágenes automáticamente
git push

# 2. Actualizar Cloud Run con las nuevas imágenes
npm run deploy
```

---

## 📋 Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `npm run dev:back` | Servidor Node.js local |
| `npm run dev:front` | Vite dev server local |
| `npm run deploy` | Actualiza ambos servicios en Cloud Run |
| `npm run deploy:back` | Actualiza solo el backend |
| `npm run deploy:front` | Actualiza solo el frontend |
| `npm run infra:plan` | Previsualiza cambios de Terraform |
| `npm run infra:apply` | Aplica cambios de Terraform |
| `npm run infra:destroy` | Destruye la infraestructura |

---

## 📡 Endpoints del Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado, entorno, uptime y timestamp |
| `GET` | `/api/messages` | Lista de mensajes |
| `POST` | `/api/messages` | Agrega un mensaje `{ "author": "...", "text": "..." }` |
| `DELETE` | `/api/messages/:id` | Elimina un mensaje por ID |
| `GET` | `/api/secret-data` | Requiere cabecera `x-app-secret` → 403 si inválida |

---

> 📘 Ver [GUIA_INFRAESTRUCTURA.md](./GUIA_INFRAESTRUCTURA.md) para documentación completa del proceso de despliegue.
