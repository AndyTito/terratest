# 1. Imagen base ligera con Node.js 22 sobre Alpine Linux
FROM node:22-alpine

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar descriptores de dependencias primero para aprovechar el caché de capas de Docker
COPY package*.json ./

# 4. Instalar únicamente las dependencias de producción
RUN npm install --omit=dev

# 5. Copiar el resto del código fuente del backend
COPY . .

# 6. Definir variables de entorno por defecto (Cloud Run inyectará PORT dinámicamente)
ENV PORT=8080
ENV APP_ENV=production

# 7. Documentar el puerto en el que escucha el servicio
EXPOSE 8080

# 8. Comando para ejecutar el servidor
CMD ["node", "server.js"]
