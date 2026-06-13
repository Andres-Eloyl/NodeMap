const CONFIG = {
  PORT: 3000,
  STUN_SERVERS: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
    "stun:stun2.l.google.com:19302",
  ],
  PING_INTERVAL_MS: 5000,
  RECONNECT_DELAY_MS: 2000,
  RECONNECT_TIMEOUT_MS: 5000,
  DATA_CHANNEL_LABEL: "data",
  MAX_LOG_EVENTOS: 20,
  METRICS_PATH: "/metrics",
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
