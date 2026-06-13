// Configuración central del sistema P2P — NO hardcodear estos valores en otros archivos
const CONFIG = {
  // Puerto donde corre el servidor Express y Socket.io
  PORT: 3000,
  
  // Los usa Andrés en webrtc.js para configurar RTCPeerConnection
  STUN_SERVERS: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
  ],
  
  // Intervalo en ms entre PINGs de latencia (cada peer envía PING a todos sus peers)
  PING_INTERVAL_MS: 5000,

  // Tiempo de espera en ms antes de intentar reconectar con un peer caído
  RECONNECT_DELAY_MS: 2000,

  // Tiempo máximo en ms para que una reconexión tenga éxito antes de darla por fallida
  RECONNECT_TIMEOUT_MS: 5000,

  // Nombre del DataChannel que crea el peer que hace OFFER
  DATA_CHANNEL_LABEL: "data",
  
  // Máximo de entradas en el log de métricas. Cuando llega la entrada 21 se elimina la más antigua.
  MAX_LOG_EVENTOS: 20,
  
  // Ruta HTTP donde el servidor expone las métricas en formato JSON
  METRICS_PATH: "/metrics",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
