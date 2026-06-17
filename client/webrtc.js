const peers = new Map();
const callbacks = new Map();
const latencies = new Map();
const iceBuffers = new Map();
const reconnecting = new Set();

let myId = null;
let myNombre = null;
let socket = null;
let pingInterval = null;

function getIceConfig() {
  const servers = (typeof CONFIG !== "undefined" && CONFIG.STUN_SERVERS)
    ? CONFIG.STUN_SERVERS
    : ["stun:stun.l.google.com:19302"];
  return { iceServers: servers.map((url) => ({ urls: url })) };
}

function shouldIOffer(peerId) {
  return myId < peerId;
}

function getPingInterval() {
  return (typeof CONFIG !== "undefined" && CONFIG.PING_INTERVAL_MS) || 5000;
}

function getReconnectDelay() {
  return (typeof CONFIG !== "undefined" && CONFIG.RECONNECT_DELAY_MS) || 2000;
}

function getReconnectTimeout() {
  return (typeof CONFIG !== "undefined" && CONFIG.RECONNECT_TIMEOUT_MS) || 5000;
}

function getChannelLabel() {
  return (typeof CONFIG !== "undefined" && CONFIG.DATA_CHANNEL_LABEL) || "data";
}

function initConnection(peerId, nombre, zona, color, avatar) {
  if (peers.has(peerId)) return;

  const pc = new RTCPeerConnection(getIceConfig());
  iceBuffers.set(peerId, []);

  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit(PROTOCOL.ICE_CANDIDATE, {
        destino: peerId,
        candidate: event.candidate,
      });
    }
  };

  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState;
    if (state === "disconnected" || state === "failed") {
      handlePeerDisconnect(peerId);
    }
  };

  pc.ondatachannel = (event) => {
    setupDataChannel(peerId, nombre, event.channel);
  };

  const peerEntry = { id: peerId, nombre, zona, color, avatar, pc, dc: null };

  if (shouldIOffer(peerId)) {
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

function setupDataChannel(peerId, nombre, dc) {
  const onOpenHandler = () => {
    const peer = peers.get(peerId);
    if (peer) peer.dc = dc;
    reconnecting.delete(peerId);
    fireCallbacks(PROTOCOL.PEER_JOIN, { id: peerId, nombre, zona: peer ? peer.zona : "Desconocida", color: peer ? peer.color : "#fff", avatar: peer ? peer.avatar : "👤" });
    if (!pingInterval) startPingCycle();
  };

  dc.onopen = onOpenHandler;
  if (dc.readyState === 'open') {
    onOpenHandler();
  };

  dc.onclose = () => {
    handlePeerDisconnect(peerId);
  };

  dc.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const tipo = msg.tipo;
      delete msg.tipo;

      if (tipo === PROTOCOL.PING) {
        sendMessage(peerId, PROTOCOL.PONG, { timestamp: msg.timestamp });
        return;
      }

      if (tipo === PROTOCOL.PONG) {
        const latencia = (Date.now() - msg.timestamp) / 2;
        latencies.set(peerId, latencia);
        return;
      }
      fireCallbacks("RAW_PACKET", { raw: event.data, size: event.data.length, peerId: peerId });
      if (tipo === PROTOCOL.CHAT || tipo === PROTOCOL.ORGANIZER_BROADCAST) {
        if (msg._encrypted) {
            try {
                const decoded = decodeURIComponent(atob(msg._encrypted));
                msg.text = decoded.replace("_NO_LEER_ESTO_XD_", "");
            } catch(e) {}
        }
      }

      
      msg.senderId = peerId;
      fireCallbacks(tipo, msg);
    } catch (err) {
      console.error("[WebRTC] Error procesando mensaje:", err);
    }
  };
}

function conectar(nombre, zona, color, avatar) {
  myNombre = nombre;

  const serverUrl = (typeof CONFIG !== "undefined" && CONFIG.PORT)
    ? `http://${window.location.hostname}:${CONFIG.PORT}`
    : window.location.origin;

  socket = io(serverUrl, { query: { nombre, zona, color, avatar } });

  socket.on(PROTOCOL.PEER_LIST, (data) => {
    myId = data.miId;
    for (const peer of data.peers) {
      initConnection(peer.id, peer.nombre, peer.zona, peer.color, peer.avatar);
    }
  });

  socket.on(PROTOCOL.PEER_JOIN, (data) => {
    initConnection(data.id, data.nombre, data.zona, data.color, data.avatar);
  });

  socket.on(PROTOCOL.REPLAY_DATA, (data) => {
    fireCallbacks("REPLAY_DATA", data);
  });

  socket.on(PROTOCOL.OFFER, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      const buffered = iceBuffers.get(peerId) || [];
      for (const c of buffered) {
        await peer.pc.addIceCandidate(c);
      }
      iceBuffers.set(peerId, []);

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

  socket.on(PROTOCOL.ANSWER, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      const buffered = iceBuffers.get(peerId) || [];
      for (const c of buffered) {
        await peer.pc.addIceCandidate(c);
      }
      iceBuffers.set(peerId, []);
    } catch (err) {
      console.error("[WebRTC] Error procesando ANSWER:", err);
    }
  });

  socket.on(PROTOCOL.ICE_CANDIDATE, async (data) => {
    const peerId = data.origen;
    if (!peerId) return;

    const peer = peers.get(peerId);
    if (!peer) return;

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

  socket.on(PROTOCOL.PEER_LEAVE, (data) => {
    reconnecting.delete(data.id);
    cleanupPeer(data.id);
    fireCallbacks(PROTOCOL.PEER_LEAVE, { id: data.id });
  });

  socket.on(PROTOCOL.PEER_EXIT, (data) => {
    reconnecting.delete(data.id);
    cleanupPeer(data.id);
    fireCallbacks(PROTOCOL.PEER_EXIT, { id: data.id, nombre: data.nombre });
  });
}

function cleanupPeer(peerId) {
  const peer = peers.get(peerId);
  if (!peer) return;
  try { if (peer.dc) peer.dc.close(); } catch (e) {}
  try { if (peer.pc) peer.pc.close(); } catch (e) {}
  peers.delete(peerId);
  latencies.delete(peerId);
  iceBuffers.delete(peerId);
}

function handlePeerDisconnect(peerId) {
  if (reconnecting.has(peerId)) return;

  const peer = peers.get(peerId);
  if (!peer) return;

  const nombre = peer.nombre;
  cleanupPeer(peerId);
  reconnecting.add(peerId);

  setTimeout(() => {
    if (peers.has(peerId)) {
      reconnecting.delete(peerId);
      return;
    }

    initConnection(peerId, nombre);

    setTimeout(() => {
      const p = peers.get(peerId);
      if (p && (!p.dc || p.dc.readyState !== "open")) {
        cleanupPeer(peerId);
        reconnecting.delete(peerId);
        fireCallbacks(PROTOCOL.PEER_LEAVE, { id: peerId });
      } else if (!p) {
        reconnecting.delete(peerId);
        fireCallbacks(PROTOCOL.PEER_LEAVE, { id: peerId });
      } else {
        reconnecting.delete(peerId);
      }
    }, getReconnectTimeout());
  }, getReconnectDelay());
}

function startPingCycle() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    for (const [peerId] of peers) {
      sendMessage(peerId, PROTOCOL.PING, { timestamp: Date.now() });
    }
  }, getPingInterval());
}

function fireCallbacks(tipo, datos) {
  const cbs = callbacks.get(tipo);
  if (!cbs) return;
  for (const cb of cbs) {
    try { cb(datos); } catch (err) { console.error("[WebRTC] Error en callback:", err); }
  }
}

function sendMessage(peerId, tipo, datos) {
  const peer = peers.get(peerId);
  if (!peer || !peer.dc || peer.dc.readyState !== "open") return;
  try {
    let finalDatos = { ...datos };
    if (tipo === PROTOCOL.CHAT || tipo === PROTOCOL.ORGANIZER_BROADCAST) {
        if (finalDatos.text) {
            finalDatos._encrypted = btoa(encodeURIComponent(finalDatos.text + "_NO_LEER_ESTO_XD_"));
            delete finalDatos.text;
        }
    }
    
    peer.dc.send(JSON.stringify({ tipo, ...finalDatos }));
  } catch (err) {
    console.error("[WebRTC] Error enviando mensaje:", err);
  }
}

function broadcast(tipo, datos) {
  for (const [peerId] of peers) {
    sendMessage(peerId, tipo, datos);
  }
}

function onMessage(tipo, callback) {
  if (!callbacks.has(tipo)) callbacks.set(tipo, []);
  callbacks.get(tipo).push(callback);
}

function getPeers() {
  const result = [];
  for (const [id, peer] of peers) {
    if (peer.dc && peer.dc.readyState === "open") {
      result.push({ id, nombre: peer.nombre, zona: peer.zona });
    }
  }
  return result;
}

function getLatency(peerId) {
  return latencies.has(peerId) ? latencies.get(peerId) : null;
}

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

function getMyId() {
  return myId;
}

function requestReplay() {
  if (socket) {
    socket.emit(PROTOCOL.GET_REPLAY);
  }
}

const WebRTCEngine = {
  conectar,
  desconectar,
  sendMessage,
  sendToPeer: sendMessage,
  broadcast,
  onMessage,
  getPeers,
  getLatency,
  getMyId,
  requestReplay,
};

window.WebRTCEngine = WebRTCEngine;
