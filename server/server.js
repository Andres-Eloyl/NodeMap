const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');

const CONFIG = require('../shared/config');
const signaling = require('./signaling');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const inicio = Date.now();

app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

signaling(io);

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: Math.floor((Date.now() - inicio) / 1000) });
});

app.get(CONFIG.METRICS_PATH, (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.json({
    peers_activos: signaling.metricas.peers.size,
    mensajes_totales: signaling.metricas.mensajes_totales,
    uptime_segundos: Math.floor((Date.now() - inicio) / 1000),
    log: signaling.metricas.log
  });
});

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

httpServer.listen(CONFIG.PORT, () => {
  const ip = getLocalIP();
  console.log(`\n🚀 Servidor de señalización listo\n`);
  console.log(`   Local:    http://localhost:${CONFIG.PORT}`);
  console.log(`   Red:      http://${ip}:${CONFIG.PORT}`);
  console.log(`   Métricas: http://${ip}:${CONFIG.PORT}${CONFIG.METRICS_PATH}`);
  console.log(`   Test:     http://${ip}:${CONFIG.PORT}/test-signaling.html`);
  console.log(`\n   Para celulares: conéctense a http://${ip}:${CONFIG.PORT}\n`);
});
