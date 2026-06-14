const PROTOCOL = require("../shared/protocol");
const CONFIG = require("../shared/config");

const peers = new Map();

const metricas = {
  peers: peers,
  mensajes_totales: 0,
  log: []
};

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function addToLog(evento) {
  metricas.log.push({ evento, timestamp: Date.now() });
  if (metricas.log.length > CONFIG.MAX_LOG_EVENTOS) {
    metricas.log.shift();
  }
}

function validarDatos(data, evento, origenId) {
  if (!data || typeof data !== "object") {
    console.log(`❌ ${evento} inválido de ${origenId}: datos no es un objeto`);
    return false;
  }
  if (!data.destino || typeof data.destino !== "string") {
    console.log(`❌ ${evento} inválido de ${origenId}: falta campo 'destino'`);
    return false;
  }
  return true;
}

const initSignaling = function(io) {
  io.on("connection", (socket) => {
    const id = generarId();
    const nombre = socket.handshake.query.nombre || "Anónimo";
    const zona = socket.handshake.query.zona || "Zona A";
    const peer = { id, socket, nombre, zona };

    peers.set(id, peer);
    socket.peerId = id;

    const listaPeers = [];
    peers.forEach((p, peerId) => {
      if (peerId !== id) {
        listaPeers.push({ id: p.id, nombre: p.nombre, zona: p.zona });
      }
    });

    socket.emit(PROTOCOL.PEER_LIST, { miId: id, peers: listaPeers });
    socket.broadcast.emit(PROTOCOL.PEER_JOIN, { id, nombre, zona });

    addToLog(`${nombre} entró a la red`);
    console.log(`🟢 Peer conectado: ${nombre} (${id}) — Total: ${peers.size}`);

    socket.on(PROTOCOL.OFFER, (data) => {
      if (!validarDatos(data, "OFFER", socket.peerId)) return;
      if (!data.sdp) {
        console.log(`❌ OFFER inválido de ${socket.peerId}: falta campo 'sdp'`);
        return;
      }

      const destinoPeer = peers.get(data.destino);
      if (destinoPeer) {
        console.log(`📨 OFFER: ${socket.peerId} → ${data.destino}`);
        data.origen = socket.peerId;
        destinoPeer.socket.emit(PROTOCOL.OFFER, data);
        metricas.mensajes_totales++;
      } else {
        console.log(`❌ OFFER: peer destino no encontrado: ${data.destino}`);
      }
    });

    socket.on(PROTOCOL.ANSWER, (data) => {
      if (!validarDatos(data, "ANSWER", socket.peerId)) return;
      if (!data.sdp) {
        console.log(`❌ ANSWER inválido de ${socket.peerId}: falta campo 'sdp'`);
        return;
      }

      const destinoPeer = peers.get(data.destino);
      if (destinoPeer) {
        console.log(`📩 ANSWER: ${socket.peerId} → ${data.destino}`);
        data.origen = socket.peerId;
        destinoPeer.socket.emit(PROTOCOL.ANSWER, data);
        metricas.mensajes_totales++;
      } else {
        console.log(`❌ ANSWER: peer destino no encontrado: ${data.destino}`);
      }
    });

    socket.on(PROTOCOL.ICE_CANDIDATE, (data) => {
      if (!validarDatos(data, "ICE", socket.peerId)) return;
      if (!data.candidate) {
        console.log(`❌ ICE inválido de ${socket.peerId}: falta campo 'candidate'`);
        return;
      }

      const destinoPeer = peers.get(data.destino);
      if (destinoPeer) {
        data.origen = socket.peerId;
        destinoPeer.socket.emit(PROTOCOL.ICE_CANDIDATE, data);
        metricas.mensajes_totales++;
      } else {
        console.log(`❌ ICE: peer destino no encontrado: ${data.destino}`);
      }
    });

    socket.on(PROTOCOL.PEER_EXIT, () => {
      const p = peers.get(socket.peerId);
      if (!p) return;

      const peerNombre = p.nombre;
      peers.delete(socket.peerId);

      socket.broadcast.emit(PROTOCOL.PEER_EXIT, { id: socket.peerId, nombre: peerNombre });

      addToLog(`${peerNombre} salió de la red`);
      console.log(`🟡 Peer salió voluntariamente: ${peerNombre} (${socket.peerId}) — Total: ${peers.size}`);

      socket.disconnect(true);
    });

    socket.on("disconnect", () => {
      const p = peers.get(socket.peerId);
      if (!p) return;

      const peerNombre = p.nombre;
      peers.delete(socket.peerId);

      socket.broadcast.emit(PROTOCOL.PEER_LEAVE, { id: socket.peerId });

      addToLog(`${peerNombre} se desconectó`);
      console.log(`🔴 Peer desconectado: ${peerNombre} (${socket.peerId}) — Total: ${peers.size}`);
    });

  });
};

initSignaling.metricas = metricas;
module.exports = initSignaling;
