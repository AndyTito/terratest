import express from 'express';
import cors from 'cors';

const app = express();
// Variables de entorno
const PORT = process.env.PORT || 3001;
const APP_ENV = process.env.APP_ENV || 'development';
const APP_SECRET = process.env.APP_SECRET || 'secreto-dev-123';

console.log(`🔧 Entorno activo: [${APP_ENV}]`);
if (!process.env.APP_ENV) {
  console.log('ℹ️  Nota: "APP_ENV" no fue definida en el entorno, usando valor por defecto: "development".');
}

// Middlewares
app.use(cors());
app.use(express.json());

// In-memory data store
let messages = [
  {
    id: '1',
    text: `¡Bienvenido! Servidor ejecutándose en entorno: [${APP_ENV}].`,
    author: 'Sistema',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: '2',
    text: 'La conexión entre Frontend y Backend funciona a la perfección vía API REST.',
    author: 'Servidor Express',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// Endpoint: Health check & metadata
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend operativo y listo',
    environment: APP_ENV,
    secretConfigured: Boolean(process.env.APP_SECRET),
    port: PORT,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Endpoint protegido: Requiere la variable de ambiente APP_SECRET en el header x-app-secret
app.get('/api/secret-data', (req, res) => {
  const clientSecret = req.headers['x-app-secret'];

  if (!clientSecret) {
    return res.status(401).json({
      success: false,
      error: 'Cabecera "x-app-secret" ausente. Debes proveer la clave configurada en el backend.'
    });
  }

  if (clientSecret !== APP_SECRET) {
    return res.status(403).json({
      success: false,
      error: 'Clave secreta incorrecta. No coincide con la variable APP_SECRET del backend.'
    });
  }

  res.json({
    success: true,
    message: '¡Acceso concedido! Has validado correctamente la variable de ambiente APP_SECRET.',
    secretLength: APP_SECRET.length,
    environment: APP_ENV,
    unlockedAt: new Date().toISOString()
  });
});

// Endpoint: Obtener todos los mensajes
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// Endpoint: Crear un nuevo mensaje
app.post('/api/messages', (req, res) => {
  const { text, author } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'El campo "text" es requerido.'
    });
  }

  const newMessage = {
    id: Date.now().toString(),
    text: text.trim(),
    author: (author && author.trim()) ? author.trim() : 'Usuario Anónimo',
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  messages.unshift(newMessage);

  res.status(201).json({
    success: true,
    data: newMessage
  });
});

// Endpoint: Eliminar mensaje por ID
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = messages.length;
  messages = messages.filter(m => m.id !== id);

  if (messages.length === initialLength) {
    return res.status(404).json({
      success: false,
      error: `Mensaje con id ${id} no encontrado.`
    });
  }

  res.json({
    success: true,
    message: `Mensaje ${id} eliminado.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
