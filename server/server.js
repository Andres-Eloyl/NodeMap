// Punto de entrada del servidor de señalización P2P
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');

const CONFIG = require('../shared/config');
const signaling = require('./signaling');

// 1. Crea una app Express
const app = express();

// 2. Crea un servidor HTTP usando http.createServer(app)
const httpServer = http.createServer(app);

// 3. Monta Socket.io sobre ese servidor HTTP con cors habilitado para cualquier origen
const io = new Server(httpServer, { cors: { origin: "*" } });

// Tiempo de inicio del servidor para calcular el uptime
const inicio = Date.now();

// Archivos estáticos
// Express debe servir la carpeta client/ como archivos estáticos
app.use(express.static(path.join(__dirname, "../client")));

// Express también debe servir la carpeta shared/ para que los browsers puedan cargar protocol.js y config.js
app.use("/shared", express.static(path.join(__dirname, "../shared")));

// Inicializar la señalización llamando a la función y pasándole el objeto io
signaling(io);

// Health check — para verificar rápidamente que el servidor está vivo
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.floor((Date.now() - inicio) / 1000) });
});

// Métricas
app.get(CONFIG.METRICS_PATH, (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  console.log(`📊 Métricas consultadas — ${signaling.metricas.peers.size} peers activos`);
  res.json({
    peers_activos: signaling.metricas.peers.size,
    mensajes_totales: signaling.metricas.mensajes_totales,
    uptime_segundos: Math.floor((Date.now() - inicio) / 1000),
    log: signaling.metricas.log
  });
});

/**
 * Obtiene la primera IP local IPv4 que no sea loopback.
 * Útil para que los compañeros del equipo se conecten desde celulares.
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Arranque del servidor
httpServer.listen(CONFIG.PORT, () => {
  const ip = getLocalIP();
  console.log(`\n🚀 Servidor de señalización listo\n`);
  console.log(`   Local:    http://localhost:${CONFIG.PORT}`);
  console.log(`   Red:      http://${ip}:${CONFIG.PORT}`);
  console.log(`   Métricas: http://${ip}:${CONFIG.PORT}${CONFIG.METRICS_PATH}`);
  console.log(`   Test:     http://${ip}:${CONFIG.PORT}/test-signaling.html`);
  console.log(`\n   Para celulares: conéctense a http://${ip}:${CONFIG.PORT}\n`);
});
