// Configuration: Backend API URL
// En local usa localhost/proxy; en Cloud Run apunta directamente a la URL pública del backend desplegado
const PROD_BACKEND_URL = 'https://terra-backend-unf2xuz4tq-uc.a.run.app/api';
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '5173' ? '/api' : 'http://localhost:3001/api')
  : PROD_BACKEND_URL;

// DOM Elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const statusPort = document.getElementById('status-port');
const statusEnv = document.getElementById('status-env');
const statusPing = document.getElementById('status-ping');
const btnRefreshStatus = document.getElementById('btn-refresh-status');

const metricHealth = document.getElementById('metric-health');
const metricCount = document.getElementById('metric-count');
const metricUptime = document.getElementById('metric-uptime');
const metricSynced = document.getElementById('metric-synced');

const messageForm = document.getElementById('message-form');
const authorInput = document.getElementById('author-input');
const messageInput = document.getElementById('message-input');
const btnSubmitMessage = document.getElementById('btn-submit-message');
const formSpinner = document.getElementById('form-spinner');

const messagesList = document.getElementById('messages-list');
const liveCountBadge = document.getElementById('live-count-badge');
const btnFetchMessages = document.getElementById('btn-fetch-messages');
const toastContainer = document.getElementById('toast-container');

// Toast Notification Helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 1. Check Backend Health & Latency
async function checkHealth() {
  const startTime = performance.now();
  statusText.textContent = 'Comprobando...';
  
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    
    // Update status widget
    statusDot.className = 'status-dot online';
    statusText.textContent = 'En Línea';
    if (statusEnv) statusEnv.textContent = `Entorno: ${data.environment || 'local'}`;
    statusPort.textContent = `Puerto: ${data.port || 3001}`;
    statusPing.textContent = `Ping: ${latency} ms`;

    // Update metrics
    metricHealth.textContent = 'Online';
    metricHealth.className = 'metric-val text-success';
    metricUptime.textContent = `${data.uptimeSeconds}s`;
    metricSynced.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return true;
  } catch (error) {
    console.warn('Backend inalcanzable:', error);
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Desconectado';
    if (statusEnv) statusEnv.textContent = 'Entorno: --';
    statusPort.textContent = 'Puerto: --';
    statusPing.textContent = 'Ping: 0 ms';

    metricHealth.textContent = 'Offline';
    metricHealth.className = 'metric-val text-muted';
    return false;
  }
}

// 2. Fetch Messages from Backend
async function fetchMessages() {
  try {
    const res = await fetch(`${API_BASE}/messages`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    const messages = result.data || [];

    renderMessages(messages);
    metricCount.textContent = messages.length;
    liveCountBadge.textContent = `${messages.length} elementos`;
    metricSynced.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (error) {
    console.error('Error al cargar mensajes:', error);
    messagesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>No se pudo conectar con la API de mensajes.</p>
        <small style="color: var(--text-muted)">Asegúrate de que el backend esté corriendo en el puerto 3001.</small>
      </div>
    `;
  }
}

// 3. Render Messages list in the DOM
function renderMessages(messages) {
  if (messages.length === 0) {
    messagesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>No hay mensajes aún. ¡Sé el primero en enviar uno!</p>
      </div>
    `;
    return;
  }

  messagesList.innerHTML = messages.map(msg => `
    <article class="message-item" id="msg-${msg.id}">
      <div class="message-header">
        <span class="message-author">
          👤 ${escapeHtml(msg.author)}
        </span>
        <span class="message-time">${escapeHtml(msg.createdAt)}</span>
      </div>
      <p class="message-body">${escapeHtml(msg.text)}</p>
      <div class="message-footer">
        <button class="btn-delete" data-id="${msg.id}" title="Eliminar mensaje">
          🗑️ Eliminar
        </button>
      </div>
    </article>
  `).join('');

  // Attach delete events
  messagesList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteMessage(btn.dataset.id));
  });
}

// 4. Create New Message (POST)
async function handleCreateMessage(e) {
  e.preventDefault();

  const author = authorInput.value.trim();
  const text = messageInput.value.trim();

  if (!text) {
    showToast('Por favor escribe un mensaje', 'danger');
    return;
  }

  // UI state: loading
  btnSubmitMessage.disabled = true;
  formSpinner.classList.remove('hidden');

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al guardar el mensaje');
    }

    // Success
    messageInput.value = '';
    showToast('¡Mensaje enviado al backend con éxito!', 'success');
    await fetchMessages();
    await checkHealth();
  } catch (error) {
    showToast(`Error: ${error.message}`, 'danger');
  } finally {
    btnSubmitMessage.disabled = false;
    formSpinner.classList.add('hidden');
  }
}

// 5. Delete Message (DELETE)
async function deleteMessage(id) {
  try {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Error al eliminar mensaje');

    showToast('Mensaje eliminado correctamente', 'success');
    await fetchMessages();
  } catch (error) {
    showToast(`No se pudo eliminar: ${error.message}`, 'danger');
  }
}

// Utility: XSS prevention
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

// Event Listeners
messageForm.addEventListener('submit', handleCreateMessage);
btnFetchMessages.addEventListener('click', () => {
  fetchMessages();
  checkHealth();
  showToast('Sincronizado con el backend', 'info');
});
btnRefreshStatus.addEventListener('click', () => {
  checkHealth();
  showToast('Verificando latencia...', 'info');
});

// Prueba de variable de entorno APP_SECRET
const btnTestSecret = document.getElementById('btn-test-secret');
const secretInput = document.getElementById('secret-input');
const secretResult = document.getElementById('secret-result');

if (btnTestSecret && secretInput && secretResult) {
  btnTestSecret.addEventListener('click', async () => {
    const key = secretInput.value.trim();
    secretResult.innerHTML = '<span style="color: var(--text-muted);">Validando clave con el backend...</span>';

    try {
      const res = await fetch(`${API_BASE}/secret-data`, {
        headers: { 'x-app-secret': key }
      });

      const data = await res.json();

      if (res.ok) {
        secretResult.innerHTML = `<span style="color: var(--success);">✅ ${escapeHtml(data.message)} (Longitud: ${data.secretLength} chars)</span>`;
        showToast('¡Variable APP_SECRET validada con éxito!', 'success');
      } else {
        secretResult.innerHTML = `<span style="color: var(--danger);">❌ ${escapeHtml(data.error)}</span>`;
        showToast('Clave incorrecta o ausente', 'danger');
      }
    } catch (err) {
      secretResult.innerHTML = `<span style="color: var(--danger);">⚠️ Error de conexión: ${escapeHtml(err.message)}</span>`;
    }
  });
}

// Initial load
(async function init() {
  await checkHealth();
  await fetchMessages();

  // Periodic health check every 10 seconds
  setInterval(checkHealth, 10000);
})();
