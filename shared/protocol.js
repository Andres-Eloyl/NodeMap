const PROTOCOL = {
  PEER_JOIN: "peer-join",
  PEER_LEAVE: "peer-leave",
  PEER_EXIT: "peer-exit",
  PEER_LIST: "peer-list",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
  CHAT: "chat",
  POSITION: "position",
  PING: "ping",
  PONG: "pong",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PROTOCOL;
}
