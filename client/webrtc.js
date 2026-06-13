const peers = new Map();
const callbacks = new Map();
const latencies = new Map();
const iceBuffers = new Map();

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

function initConnection(peerId, nombre) {
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

  const peerEntry = { id: peerId, nombre, pc, dc: null };

  if (shouldIOffer(peerId)) {
    const dc = pc.createDataChannel("data");
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
      .catch((err) => console.error(err));
  }

  peers.set(peerId, peerEntry);
}

function setupDataChannel(peerId, nombre, dc) {
  dc.onopen = () => {
    const peer = peers.get(peerId);
    if (peer) peer.dc = dc;
    fireCallbacks(PROTOCOL.PEER_JOIN, { id: peerId, nombre });
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

      fireCallbacks(tipo, msg);
    } catch (err) {
      console.error(err);
    }
  };
}

function conectar(nombre) {
  myNombre = nombre;

  const serverUrl = (typeof CONFIG !== "undefined" && CONFIG.PORT)
    ? `http://${window.location.hostname}:${CONFIG.PORT}`
    : window.location.origin;

  socket = io(serverUrl, { query: { nombre } });

  socket.on("connect", () => {
    myId = socket.id;
  });

  socket.on(PROTOCOL.PEER_LIST, (data) => {
    for (const peer of data.peers) {
      initConnection(peer.id, peer.nombre);
    }
  });

  socket.on(PROTOCOL.PEER_JOIN, (data) => {
    initConnection(data.id, data.nombre);
  });

  socket.on(PROTOCOL.OFFER, async (data) => {
    const peerId = data.origen || data.destino;
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
      console.error(err);
    }
  });

  socket.on(PROTOCOL.ANSWER, async (data) => {
    const peerId = data.origen || data.destino;
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
      console.error(err);
    }
  });

  socket.on(PROTOCOL.ICE_CANDIDATE, async (data) => {
    const peerId = data.origen || data.destino;
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
      console.error(err);
    }
  });

  socket.on(PROTOCOL.PEER_LEAVE, (data) => {
    cleanupPeer(data.id);
    fireCallbacks(PROTOCOL.PEER_LEAVE, { id: data.id });
  });

  socket.on(PROTOCOL.PEER_EXIT, (data) => {
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
  const peer = peers.get(peerId);
  if (!peer) return;
  const nombre = peer.nombre;
  cleanupPeer(peerId);

  setTimeout(() => {
    if (!peers.has(peerId)) {
      initConnection(peerId, nombre);

      setTimeout(() => {
        const p = peers.get(peerId);
        if (p && (!p.dc || p.dc.readyState !== "open")) {
          cleanupPeer(peerId);
          fireCallbacks(PROTOCOL.PEER_LEAVE, { id: peerId });
        }
      }, 5000);
    }
  }, 2000);
}

function startPingCycle() {
  if (pingInterval) clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    for (const [peerId] of peers) {
      sendMessage(peerId, PROTOCOL.PING, { timestamp: Date.now() });
    }
  }, 5000);
}

function fireCallbacks(tipo, datos) {
  const cbs = callbacks.get(tipo);
  if (!cbs) return;
  for (const cb of cbs) {
    try { cb(datos); } catch (err) { console.error(err); }
  }
}

function sendMessage(peerId, tipo, datos) {
  const peer = peers.get(peerId);
  if (!peer || !peer.dc || peer.dc.readyState !== "open") return;
  try {
    peer.dc.send(JSON.stringify({ tipo, ...datos }));
  } catch (err) {
    console.error(err);
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
      result.push({ id, nombre: peer.nombre });
    }
  }
  return result;
}

function getLatency(peerId) {
  return latencies.has(peerId) ? latencies.get(peerId) : null;
}

const WebRTCEngine = {
  conectar,
  sendMessage,
  broadcast,
  onMessage,
  getPeers,
  getLatency,
};
