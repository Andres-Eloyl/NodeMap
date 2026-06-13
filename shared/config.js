const CONFIG = {
  PORT: 3000,
  STUN_SERVERS: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
  ],
  MAX_LOG_EVENTOS: 20,
  METRICS_PATH: "/metrics",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
