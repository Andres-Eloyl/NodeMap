const PROTOCOL = {
  PEER_JOIN: "peer-join",
  PEER_LEAVE: "peer-leave",
  PEER_EXIT: "peer-exit",
  PEER_LIST: "peer-list",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
  CHAT: "chat",
  REACTION: "reaction",
  POSITION: "position",
  PING: "ping",
  PONG: "pong",
  HEATMAP_SYNC: "heatmap-sync",
  ORGANIZER_BROADCAST: "organizer-broadcast",
  GET_REPLAY: "get-replay",
  REPLAY_DATA: "replay-data",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PROTOCOL;
}
