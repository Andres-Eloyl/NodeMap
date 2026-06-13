/**
 * Motor WebRTC — Módulo de comunicación P2P
 * 
 * Este archivo implementa toda la lógica de conexión WebRTC entre peers.
 * Expone una API pública que Jesús y María usan como caja negra.
 * 
 * Dependencias (cargar ANTES de este script):
 *   - Socket.io client (socket.io.js)
 *   - /shared/config.js  (CONFIG)
 *   - /shared/protocol.js (PROTOCOL)
 * 
 * Uso:
 *   WebRTCEngine.conectar("MiNombre");
 *   WebRTCEngine.onMessage(PROTOCOL.CHAT, (msg) => console.log(msg));
 *   WebRTCEngine.broadcast(PROTOCOL.CHAT, { texto: "Hola" });
 */

// --- Estado interno ---
const peers = new Map();          // peerId → { id, nombre, pc, dc }
const callbacks = new Map();      // tipo → [callback, ...]
const latencies = new Map();      // peerId → latencia en ms
const iceBuffers = new Map();     // peerId → [RTCIceCandidate, ...]
const reconnecting = new Set();   // peerIds que están en proceso de reconexión

let myId = null;
let myNombre = null;
let socket = null;
let pingInterval = null;

// --- Helpers internos ---

/**
 * Construye la configuración ICE usando los STUN servers de config.js.
 * Fallback a Google STUN si CONFIG no está disponible.
 */
function getIceConfig() {
  const servers = (typeof CONFIG !== "undefined" && CONFIG.STUN_SERVERS)
    ? CONFIG.STUN_SERVERS
    : ["stun:stun.l.google.com:19302"];
  return { iceServers: servers.map((url) => ({ urls: url })) };
}

/**
 * Regla de colisión: el peer con ID alfabéticamente menor siempre hace el OFFER.
 * @param {string} peerId - ID del peer remoto
 * @returns {boolean} true si YO debo hacer el OFFER
 */
function shouldIOffer(peerId) {
  return myId < peerId;
}

/**
 * Obtiene el intervalo de ping desde config, o usa 5000ms como default.
 */
function getPingInterval() {
  return (typeof CONFIG !== "undefined" && CONFIG.PING_INTERVAL_MS) || 5000;
}

/**
 * Obtiene el delay de reconexión desde config, o usa 2000ms como default.
 */
function getReconnectDelay() {
  return (typeof CONFIG !== "undefined" && CONFIG.RECONNECT_DELAY_MS) || 2000;
}

/**
 * Obtiene el timeout de reconexión desde config, o usa 5000ms como default.
 */
function getReconnectTimeout() {
  return (typeof CONFIG !== "undefined" && CONFIG.RECONNECT_TIMEOUT_MS) || 5000;
}

/**
 * Obtiene el label del DataChannel desde config, o usa "data" como default.
 */
function getChannelLabel() {
  return (typeof CONFIG !== "undefined" && CONFIG.DATA_CHANNEL_LABEL) || "data";
}

// --- Conexiones WebRTC ---

/**
 * Inicia una conexión WebRTC con un peer remoto.
 * Si me toca hacer OFFER (mi ID < su ID), creo el DataChannel y envío la offer.
 * Si no, espero a recibir su OFFER.
 * 
 * @param {string} peerId - ID del peer remoto
 * @param {string} nombre - Nombre del peer remoto
 */
function initConnection(peerId, nombre) {
  // Si ya existe una conexión con este peer, no duplicar
  if (peers.has(peerId)) return;

  const pc = new RTCPeerConnection(getIceConfig());
  iceBuffers.set(peerId, []);

  // Enviar ICE candidates al servidor para retransmisión
  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit(PROTOCOL.ICE_CANDIDATE, {
        destino: peerId,
        candidate: event.candidate,
      });
    }
  };

  // Detectar desconexión a nivel ICE
  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    if (state === "disconnected" || state === "failed") {
      handlePeerDisconnect(peerId);
    }
  };

  // El peer que recibe OFFER recibe el DataChannel aquí
  pc.ondatachannel = (event) => {
    setupDataChannel(peerId, nombre, event.channel);
  };

  const peerEntry = { id: peerId, nombre, pc, dc: null };

  if (shouldIOffer(peerId)) {
    // Yo creo el DataChannel y envío OFFER
    const dc = pc.createDataChannel(getChannelLabel());
    peerEntry.dc = dc;
    setupDataChannel(peerId, nombre, dc);

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit(PROTOCOL.OFFER, {
          destino: peerId,
          sdp: pc.localDescription,
        });
      })
      .catch((err) => console.error("[WebRTC] Error creando OFFER:", err));
  }

  peers.set(peerId, peerEntry);
}

/**
 * Configura los eventos del DataChannel para un peer.
 * 
 * @param {string} peerId - ID del peer remoto
 * @param {string} nombre - Nombre del peer remoto
 * @param {RTCDataChannel} dc - El DataChannel a configurar
 */
function setupDataChannel(peerId, nombre, dc) {
  dc.onopen = () => {
    const peer = peers.get(peerId);
    if (peer) peer.dc = dc;

    // Limpiar flag de reconexión si estaba activo
    reconnecting.delete(peerId);

    // Notificar a Jesús/María que este peer está conectado
    fireCallbacks(PROTOCOL.PEER_JOIN, { id: peerId, nombre });

    // Iniciar ciclo de pings si no está corriendo
    if (!pingInterval) {
      startPingCycle();
    }
  };

  dc.onclose = () => {
    handlePeerDisconnect(peerId);
  };

  dc.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const tipo = msg.tipo;
      delete msg.tipo;

      // PING: responder inmediatamente con PONG
      if (tipo === PROTOCOL.PING) {
        sendMessage(peerId, PROTOCOL.PONG, { timestamp: msg.timestamp });
        return;
      }

      // PONG: calcular latencia = (ahora - timestamp_original) / 2
      if (tipo === PROTOCOL.PONG) {
        const latencia = (Date.now() - msg.timestamp) / 2;
        latencies.set(peerId, latencia);
        return;
      }

      // Cualquier otro tipo: notificar callbacks registrados
      fireCallbacks(tipo, msg);
    } catch (err) {
      console.error("[WebRTC] Error procesando mensaje:", err);
    }
  };
}

// --- Conexión principal ---

/**
 * Conecta al servidor de señalización de Erasmo y arranca el motor WebRTC.
 * Esta función debe llamarse UNA vez al cargar la página.
 * 
 * @param {string} nombre - Nombre visible del peer (ej: "Erasmo", "Visitante 1")
 */
function conectar(nombre) {
  myNombre = nombre;

  // Determinar URL del servidor
  const serverUrl = (typeof CONFIG !== "undefined" && CONFIG.PORT)
    ? `http://${window.location.hostname}:${CONFIG.PORT}`
    : window.location.origin;

  socket = io(serverUrl, { query: { nombre } });

  // --- Evento: recibir mi ID y la lista de peers existentes ---
  socket.on(PROTOCOL.PEER_LIST, (data) => {
    // CRÍTICO: usar el ID que el servidor generó, NO socket.id
    myId = data.miId;

    // Iniciar conexión WebRTC con cada peer existente
    for (const peer of data.peers) {
      initConnection(peer.id, peer.nombre);
    }
  });

  // --- Evento: un peer nuevo se conectó ---
  socket.on(PROTOCOL.PEER_JOIN, (data) => {
    initConnection(data.id, data.nombre);
  });

  // --- Evento: recibir una OFFER de otro peer ---
  socket.on(PROTOCOL.OFFER, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      // Aplicar ICE candidates que llegaron antes del remoteDescription
      const buffered = iceBuffers.get(peerId) || [];
      for (const c of buffered) {
        await peer.pc.addIceCandidate(c);
      }
      iceBuffers.set(peerId, []);

      // Crear y enviar ANSWER
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);

      socket.emit(PROTOCOL.ANSWER, {
        destino: peerId,
        sdp: peer.pc.localDescription,
      });
    } catch (err) {
      console.error("[WebRTC] Error procesando OFFER:", err);
    }
  });

  // --- Evento: recibir ANSWER a mi OFFER ---
  socket.on(PROTOCOL.ANSWER, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      // Aplicar ICE candidates buffereados
      const buffered = iceBuffers.get(peerId) || [];
      for (const c of buffered) {
        await peer.pc.addIceCandidate(c);
      }
      iceBuffers.set(peerId, []);
    } catch (err) {
      console.error("[WebRTC] Error procesando ANSWER:", err);
    }
  });

  // --- Evento: recibir ICE candidate ---
  socket.on(PROTOCOL.ICE_CANDIDATE, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

    // Si aún no tenemos remoteDescription, bufferear el candidate
    if (!peer.pc.remoteDescription) {
      const buffer = iceBuffers.get(peerId) || [];
      buffer.push(new RTCIceCandidate(data.candidate));
      iceBuffers.set(peerId, buffer);
      return;
    }

    try {
      await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
      console.error("[WebRTC] Error agregando ICE candidate:", err);
    }
  });

  // --- Evento: un peer se desconectó abruptamente ---
  socket.on(PROTOCOL.PEER_LEAVE, (data) => {
    reconnecting.delete(data.id); // Cancelar reconexión si estaba en progreso
    cleanupPeer(data.id);
    fireCallbacks(PROTOCOL.PEER_LEAVE, { id: data.id });
  });

  // --- Evento: un peer salió voluntariamente ---
  socket.on(PROTOCOL.PEER_EXIT, (data) => {
    reconnecting.delete(data.id); // Cancelar reconexión si estaba en progreso
    cleanupPeer(data.id);
    fireCallbacks(PROTOCOL.PEER_EXIT, { id: data.id, nombre: data.nombre });
  });
}

// --- Limpieza y reconexión ---

/**
 * Limpia completamente los recursos de un peer: cierra DataChannel, cierra
 * RTCPeerConnection, y lo elimina de todos los Maps internos.
 * 
 * @param {string} peerId - ID del peer a limpiar
 */
function cleanupPeer(peerId) {
  const peer = peers.get(peerId);
  if (!peer) return;
  try { if (peer.dc) peer.dc.close(); } catch (e) { /* ignorar */ }
  try { if (peer.pc) peer.pc.close(); } catch (e) { /* ignorar */ }
  peers.delete(peerId);
  latencies.delete(peerId);
  iceBuffers.delete(peerId);
}

/**
 * Maneja la desconexión inesperada de un peer (DataChannel cerrado o ICE failed).
 * Intenta reconectar UNA vez después de RECONNECT_DELAY_MS.
 * Si la reconexión falla, notifica como peer-leave.
 * 
 * Usa un Set (reconnecting) para evitar loops infinitos de reconexión.
 * 
 * @param {string} peerId - ID del peer desconectado
 */
function handlePeerDisconnect(peerId) {
  // Guard: si ya estamos reconectando con este peer, no duplicar
  if (reconnecting.has(peerId)) return;

  const peer = peers.get(peerId);
  if (!peer) return;

  const nombre = peer.nombre;
  cleanupPeer(peerId);

  // Marcar como en proceso de reconexión
  reconnecting.add(peerId);

  // Intentar reconectar después del delay configurado
  setTimeout(() => {
    // Si el peer volvió por otra vía (ej: PEER_JOIN del servidor), cancelar
    if (peers.has(peerId)) {
      reconnecting.delete(peerId);
      return;
    }

    // Intentar nueva conexión
    initConnection(peerId, nombre);

    // Verificar después del timeout si la reconexión tuvo éxito
    setTimeout(() => {
      const p = peers.get(peerId);
      if (p && (!p.dc || p.dc.readyState !== "open")) {
        // Reconexión fallida
        cleanupPeer(peerId);
        reconnecting.delete(peerId);
        fireCallbacks(PROTOCOL.PEER_LEAVE, { id: peerId });
      } else if (!p) {
        // El peer ya no existe
        reconnecting.delete(peerId);
        fireCallbacks(PROTOCOL.PEER_LEAVE, { id: peerId });
      } else {
        // Reconexión exitosa
        reconnecting.delete(peerId);
      }
    }, getReconnectTimeout());
  }, getReconnectDelay());
}

// --- Ping/Pong ---

/**
 * Inicia el ciclo de pings para medir latencia con todos los peers.
 * Envía PING cada PING_INTERVAL_MS a cada peer con DataChannel abierto.
 */
function startPingCycle() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    for (const [peerId] of peers) {
      sendMessage(peerId, PROTOCOL.PING, { timestamp: Date.now() });
    }
  }, getPingInterval());
}

// --- Sistema de callbacks ---

/**
 * Ejecuta todos los callbacks registrados para un tipo de mensaje.
 * Cada callback se ejecuta en un try/catch para que un error en uno
 * no impida la ejecución de los demás.
 * 
 * @param {string} tipo - Tipo del mensaje (constante de PROTOCOL)
 * @param {object} datos - Datos del mensaje
 */
function fireCallbacks(tipo, datos) {
  const cbs = callbacks.get(tipo);
  if (!cbs) return;
  for (const cb of cbs) {
    try { cb(datos); } catch (err) { console.error("[WebRTC] Error en callback:", err); }
  }
}

// ========================================
// API PÚBLICA — Jesús y María usan estas
// ========================================

/**
 * Envía un mensaje a un peer específico por su DataChannel.
 * Si el peer no existe o su DataChannel no está abierto, no hace nada (no lanza error).
 * 
 * @param {string} peerId - ID del peer destino
 * @param {string} tipo - Tipo del mensaje (constante de PROTOCOL: CHAT, POSITION, PING, PONG)
 * @param {object} datos - Objeto con los campos del mensaje
 */
function sendMessage(peerId, tipo, datos) {
  const peer = peers.get(peerId);
  if (!peer || !peer.dc || peer.dc.readyState !== "open") return;
  try {
    peer.dc.send(JSON.stringify({ tipo, ...datos }));
  } catch (err) {
    console.error("[WebRTC] Error enviando mensaje:", err);
  }
}

/**
 * Envía el mismo mensaje a todos los peers conectados simultáneamente.
 * Internamente llama a sendMessage para cada peer en la lista.
 * 
 * @param {string} tipo - Tipo del mensaje (constante de PROTOCOL)
 * @param {object} datos - Objeto con los campos del mensaje
 */
function broadcast(tipo, datos) {
  for (const [peerId] of peers) {
    sendMessage(peerId, tipo, datos);
  }
}

/**
 * Registra un callback que se ejecuta cada vez que llega un mensaje del tipo indicado.
 * Se pueden registrar múltiples callbacks para el mismo tipo.
 * 
 * Tipos que Jesús usa: CHAT, POSITION
 * Tipos que María usa: CHAT, POSITION, PEER_JOIN, PEER_LEAVE, PEER_EXIT
 * 
 * @param {string} tipo - Tipo del mensaje (constante de PROTOCOL)
 * @param {function} callback - Función que recibe el objeto de datos del mensaje
 */
function onMessage(tipo, callback) {
  if (!callbacks.has(tipo)) callbacks.set(tipo, []);
  callbacks.get(tipo).push(callback);
}

/**
 * Devuelve la lista actual de peers conectados con DataChannel abierto.
 * Solo incluye peers con DataChannel en estado "open".
 * 
 * @returns {Array<{id: string, nombre: string}>} Array de peers conectados
 */
function getPeers() {
  const result = [];
  for (const [id, peer] of peers) {
    if (peer.dc && peer.dc.readyState === "open") {
      result.push({ id, nombre: peer.nombre });
    }
  }
  return result;
}

/**
 * Devuelve la última latencia medida hacia un peer específico en milisegundos.
 * Retorna null si no hay medición todavía.
 * 
 * @param {string} peerId - ID del peer
 * @returns {number|null} Latencia en ms o null si no hay medición
 */
function getLatency(peerId) {
  return latencies.has(peerId) ? latencies.get(peerId) : null;
}

/**
 * Desconecta limpiamente del servidor y cierra todas las conexiones WebRTC.
 * Notifica al servidor con PEER_EXIT antes de desconectar.
 */
function desconectar() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (socket) {
    socket.emit(PROTOCOL.PEER_EXIT);
    socket.disconnect();
    socket = null;
  }
  for (const [peerId] of peers) {
    cleanupPeer(peerId);
  }
  myId = null;
  myNombre = null;
}

// --- Exportar API pública globalmente ---
// Como este script se carga con <script>, necesita estar en window
// para que peer.js y display.js puedan accederlo

const WebRTCEngine = {
  conectar,
  desconectar,
  sendMessage,
  broadcast,
  onMessage,
  getPeers,
  getLatency,
};

window.WebRTCEngine = WebRTCEngine;
