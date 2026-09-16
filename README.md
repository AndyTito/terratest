# Terra Project: Fullstack (Front & Back)

Aplicación fullstack estructurada en carpetas separadas `front/` y `back/`, conectadas a través de API REST.

---

## 📁 Estructura del Proyecto

```
terraproject/
├── back/
│   ├── package.json       # Dependencias del backend (express, cors)
│   └── server.js          # Servidor Express y endpoints API REST
├── front/
│   ├── index.html         # Estructura semántica, widgets de estado y layout
│   ├── style.css          # Estilos modernos (dark mode, glassmorphism, responsive)
│   ├── main.js            # Cliente JavaScript (consumo de API con fetch y renderizado reactivo)
│   ├── vite.config.js     # Configuración de Vite con proxy a puerto 3001
│   └── package.json       # Dependencias del frontend (vite)
└── package.json           # Scripts para ejecución desde la raíz
```

---

## 🚀 Cómo Ejecutar el Proyecto

Abre dos terminales (una para el backend y otra para el frontend):

### 1. Iniciar el Backend (Terminal 1)
```bash
# Opción A: Desde la raíz del proyecto
npm run start:back

# Opción B: Entrando a la carpeta back/
cd back
npm start
```
> El servidor backend iniciará en: **`http://localhost:3001`**

### 2. Iniciar el Frontend (Terminal 2)
```bash
# Opción A: Desde la raíz del proyecto
npm run dev:front

# Opción B: Entrando a la carpeta front/
cd front
npm run dev
```
> La aplicación web abrirá en: **`http://localhost:5173`**

---

## 📡 Endpoints del Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del backend, puerto, uptime y timestamp |
| `GET` | `/api/messages` | Lista de todos los mensajes registrados |
| `POST` | `/api/messages` | Agrega un nuevo mensaje (`{ "author": "...", "text": "..." }`) |
| `DELETE` | `/api/messages/:id` | Elimina un mensaje por su ID |

---

## ✨ Características del Frontend
- **Indicador de Conexión en Vivo**: Muestra si el backend está en línea, el puerto y la latencia (ping en ms).
- **Consumo Dinámico**: Trae mensajes precargados del backend, permite crear nuevos y eliminarlos en tiempo real.
- **Diseño Moderno**: Paleta de colores cyber/dark, efecto de cristal (*glassmorphism*), tipografía *Outfit* y micro-animaciones.
- **Proxy Configurado**: Peticiones a `/api` se redirigen automáticamente a `http://localhost:3001`.
