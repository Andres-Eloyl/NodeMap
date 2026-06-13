/**
 * Módulo de señalización WebRTC
 * 
 * Gestiona la conexión de peers vía Socket.io y retransmite mensajes
 * de señalización (OFFER, ANSWER, ICE_CANDIDATE) entre ellos.
 * 
 * REGLA DE COLISIÓN DE OFFERS
 * Cuando dos peers se detectan simultáneamente (ambos reciben PEER_JOIN del otro),
 * ambos podrían intentar enviar un OFFER al mismo tiempo.
 * Para evitar el conflicto, se establece esta regla:
 * 
 * → El peer cuyo ID es ALFABÉTICAMENTE MENOR siempre inicia el OFFER.
 * → El peer con ID mayor espera a recibir el OFFER del otro.
 * 
 * Esta regla la implementa Andrés en webrtc.js. El servidor solo retransmite.
 * El servidor NO verifica ni enforce esta regla, solo la documenta.
 */

const PROTOCOL = require("../shared/protocol");
const CONFIG = require("../shared/config");

const peers = new Map();

// Objeto de métricas exportado para que server.js lo lea
const metricas = {
  peers: peers,
  mensajes_totales: 0,
  log: []
};

// Generador de IDs únicos y cortos
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Función helper para el log de eventos
function addToLog(evento) {
  metricas.log.push({ evento, timestamp: Date.now() });
  if (metricas.log.length > CONFIG.MAX_LOG_EVENTOS) {
    metricas.log.shift();
  }
}

/**
 * Valida que un objeto de señalización tenga el campo 'destino' y que sea un string no vacío.
 * @param {object} data - El objeto recibido del cliente
 * @param {string} evento - Nombre del evento (para logging)
 * @param {string} origenId - ID del peer que envía (para logging)
 * @returns {boolean} true si es válido
 */
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

// Función principal que inicializa Socket.io
const initSignaling = function(io) {
  io.on("connection", (socket) => {
    // 1. Genera un ID único
    const id = generarId();
    
    // 2. El nombre del peer viene en socket.handshake.query.nombre, o usa default
    const nombre = socket.handshake.query.nombre || "Anónimo";
    
    // 3. Crea el objeto peer
    const peer = { id, socket, nombre, zona: null };
    
    // 4. Guarda el peer en el Map
    peers.set(id, peer);
    
    // 5. Guarda el id en el socket para acceso rápido
    socket.peerId = id;
    
    // 6. Construye la lista de peers existentes excluyendo al actual
    const listaPeers = [];
    peers.forEach((p, peerId) => {
      if (peerId !== id) {
        listaPeers.push({ id: p.id, nombre: p.nombre });
      }
    });
    
    // Emite al peer recién conectado su ID y la lista de peers existentes
    socket.emit(PROTOCOL.PEER_LIST, { miId: id, peers: listaPeers });
    
    // 7. Emite a TODOS los demás peers que hay un nuevo peer
    socket.broadcast.emit(PROTOCOL.PEER_JOIN, { id, nombre });
    
    // 8. Agrega al log
    addToLog(`${nombre} entró a la red`);
    
    // 9. Imprime en consola
    console.log(`🟢 Peer conectado: ${nombre} (${id}) — Total: ${peers.size}`);
    
    // --- EVENTOS DE SEÑALIZACIÓN ---
    
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
    
    // --- DESCONEXIONES ---
    
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
      if (!p) return; // Si ya se eliminó en PEER_EXIT, esto lo evita
      
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
