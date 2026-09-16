# ==========================================
# ETAPA 1: Compilación de la aplicación Vite
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# Copiar paquetes e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y construir la versión de producción
COPY . .
RUN npm run build

# ==========================================
# ETAPA 2: Servidor web ultraligero con Nginx
# ==========================================
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx para Cloud Run (puerto 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar únicamente los archivos estáticos generados en la etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto 8080 esperado por Cloud Run
EXPOSE 8080

# Iniciar servidor Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
