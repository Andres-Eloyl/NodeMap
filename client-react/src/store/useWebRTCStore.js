import { create } from 'zustand';
import { WebRTCEngine } from '../services/webrtc.js';
import PROTOCOL from '../../../shared/protocol.js';

export const useWebRTCStore = create((set, get) => ({
  myId: null,
  peers: [],
  messages: [],
  isConnected: false,

  connect: (nombre, mapZone, color, avatar) => {
    WebRTCEngine.init(nombre, mapZone, color, avatar);
    
    // Listen to WebRTC events
    WebRTCEngine.on(PROTOCOL.PEER_JOIN, () => {
      set({ peers: WebRTCEngine.getPeers() });
    });
    
    WebRTCEngine.on(PROTOCOL.PEER_LEAVE, () => {
      set({ peers: WebRTCEngine.getPeers() });
    });

    WebRTCEngine.on(PROTOCOL.PEER_EXIT, () => {
      set({ peers: WebRTCEngine.getPeers() });
    });

    WebRTCEngine.on(PROTOCOL.CHAT, (msg) => {
      set((state) => ({
        messages: [...state.messages, msg]
      }));
    });
    
    // Initial sync
    setTimeout(() => {
      set({ 
        myId: WebRTCEngine.getMyId(), 
        isConnected: true,
        peers: WebRTCEngine.getPeers() 
      });
    }, 1000);
  },

  disconnect: () => {
    WebRTCEngine.desconectar();
    set({ isConnected: false, peers: [], myId: null });
  },

  sendMessageToForum: (text) => {
    WebRTCEngine.broadcast(PROTOCOL.FORUM_MSG, { text, timestamp: Date.now() });
  },
}));
