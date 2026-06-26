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

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client/index.html")));
app.use(express.static(path.join(__dirname, "../client")));
app.use("/shared", express.static(path.join(__dirname, "../shared")));

// NodeMap Work Endpoints
const workAuth = require('./work-auth');
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use('/api/work', workAuth);

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
  console.log(`\n Servidor NodeMap listo y escuchando en el puerto ${CONFIG.PORT}\n`);
  console.log(`   Telefonos (Mapa):      http://${ip}:${CONFIG.PORT}`);
  console.log(`   Dashboard (Pantalla):  http://${ip}:${CONFIG.PORT}/display.html`);
  console.log(`   Panel Organizador:     http://${ip}:${CONFIG.PORT}/organizer.html`);
  console.log(`   Tecnico / Test:        http://${ip}:${CONFIG.PORT}/test-signaling.html`);
  console.log(`   Metricas Crudas:       http://${ip}:${CONFIG.PORT}${CONFIG.METRICS_PATH}\n`);
  console.log(`   (Acceso Local:         http://localhost:${CONFIG.PORT})\n`);
});
