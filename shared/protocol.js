// CONTRATO DEL SISTEMA P2P
// Este archivo es el contrato del sistema. Todos los integrantes del equipo lo usan.
// Nadie puede cambiar los nombres de los eventos ni los campos sin pasar por el dueño de este archivo.
// 
// Regla de colisión de OFFERs: 
// Cuando dos peers intentan hacer OFFER al mismo tiempo, el peer cuyo ID es alfabéticamente menor siempre inicia. El otro espera.

const PROTOCOL = {
  /**
   * PEER_JOIN — Servidor → todos: un peer nuevo se conectó
   * Formato:
   * {
   *   id: string,
   *   nombre: string
   * }
   */
  PEER_JOIN: "peer-join",

  /**
   * PEER_LEAVE — Servidor → todos: un peer se desconectó abruptamente
   * Formato:
   * {
   *   id: string
   * }
   */
  PEER_LEAVE: "peer-leave",

  /**
   * PEER_EXIT — Servidor → todos: un peer salió voluntariamente
   * Formato:
   * {
   *   id: string,
   *   nombre: string
   * }
   */
  PEER_EXIT: "peer-exit",

  /**
   * PEER_LIST — Servidor → solo el peer nuevo: lista de peers existentes
   * Formato:
   * {
   *   miId: string,       ← el ID único asignado por el servidor a ESTE peer
   *   peers: [
   *     { id: string, nombre: string }
   *   ]
   * }
   * Nota: miId es el ID que el servidor generó para ti.
   * Úsalo como tu identidad en toda la sesión (regla de colisión, etc.)
   */
  PEER_LIST: "peer-list",

  /**
   * OFFER — Peer → servidor → otro peer: oferta SDP
   * Formato:
   * {
   *   destino: string,
   *   sdp: object
   * }
   * Nota: el servidor agrega el campo "origen" con el ID del peer que envía
   */
  OFFER: "offer",

  /**
   * ANSWER — Peer → servidor → otro peer: respuesta SDP
   * Formato:
   * {
   *   destino: string,
   *   sdp: object
   * }
   * Nota: el servidor agrega el campo "origen" con el ID del peer que envía
   */
  ANSWER: "answer",

  /**
   * ICE_CANDIDATE — Peer → servidor → otro peer: candidato ICE
   * Formato:
   * {
   *   destino: string,
   *   candidate: object
   * }
   * Nota: el servidor agrega el campo "origen" con el ID del peer que envía
   */
  ICE_CANDIDATE: "ice-candidate",

  /**
   * CHAT — DataChannel directo entre peers (NO pasa por servidor)
   * Este mensaje viaja por DataChannel directo. El servidor NUNCA lo ve ni lo procesa.
   * Formato:
   * {
   *   id: string,
   *   nombre: string,
   *   texto: string
   * }
   */
  CHAT: "chat",

  /**
   * POSITION — DataChannel directo entre peers (NO pasa por servidor)
   * Este mensaje viaja por DataChannel directo. El servidor NUNCA lo ve ni lo procesa.
   * Formato:
   * {
   *   id: string,
   *   nombre: string,
   *   zona: string
   * }
   * Nota: los valores posibles de "zona" los define María con el mapa del recinto
   */
  POSITION: "position",

  /**
   * PING — DataChannel directo entre peers (NO pasa por servidor)
   * Este mensaje viaja por DataChannel directo. El servidor NUNCA lo ve ni lo procesa.
   * Formato:
   * {
   *   timestamp: number
   * }
   */
  PING: "ping",

  /**
   * PONG — DataChannel directo entre peers (NO pasa por servidor)
   * Este mensaje viaja por DataChannel directo. El servidor NUNCA lo ve ni lo procesa.
   * Formato:
   * {
   *   timestamp: number
   * }
   * Nota: el timestamp es exactamente el mismo que vino en el PING, sin modificar
   */
  PONG: "pong",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PROTOCOL;
}
