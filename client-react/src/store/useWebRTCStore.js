import { create } from 'zustand';
import { WebRTCEngine } from '../services/webrtc.js';
import PROTOCOL from '../shared/protocol.js';
import SoundEngine from '../services/SoundEngine.js';

export const useWebRTCStore = create((set, get) => ({
  myId: null,
  myName: null,
  myColor: null,
  myAvatar: null,
  peers: [],
  messages: [],
  forumMessages: [],
  isConnected: false,
  zone: null,
  toasts: [],
  broadcast: null,
  myPoints: 0,

  addToast: (message, type = 'info', onClick = null) => {
    const id = Date.now() + Math.random();
    set(state => ({ toasts: [...state.toasts, { id, message, type, onClick }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  connect: (nombre, mapZone, color, avatar) => {
    WebRTCEngine.conectar(nombre, mapZone, color, avatar);
    
    WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (data) => {
      set({ peers: WebRTCEngine.getPeers() });
      if (data.zona === mapZone && data.nombre) {
        get().addToast(`${data.nombre} acaba de unirse a tu zona`, 'info');
        SoundEngine.playJoin();
      }
    });
    
    WebRTCEngine.onMessage(PROTOCOL.PEER_LEAVE, () => {
      set({ peers: WebRTCEngine.getPeers() });
    });

    WebRTCEngine.onMessage(PROTOCOL.PEER_EXIT, () => {
      set({ peers: WebRTCEngine.getPeers() });
    });

    WebRTCEngine.onMessage(PROTOCOL.ZONE_CHANGE, (data) => {
      set((state) => {
        const newPeers = state.peers.map(p => {
          if (p.id === data.senderId) {
            return { ...p, zona: data.newZone };
          }
          return p;
        });
        return { peers: newPeers };
      });
    });

    WebRTCEngine.onMessage(PROTOCOL.POS_SYNC, (data) => {
      set((state) => {
        const newPeers = state.peers.map(p => {
          if (p.id === data.senderId) {
            return { ...p, pos: { t: data.t, l: data.l } };
          }
          return p;
        });
        return { peers: newPeers };
      });
    });

    WebRTCEngine.onMessage(PROTOCOL.UPDATE_POINTS, (data) => {
      set((state) => {
        const newPeers = state.peers.map(p => {
          if (p.id === data.senderId) {
            return { ...p, puntos: data.puntos };
          }
          return p;
        });
        return { peers: newPeers };
      });
    });

    WebRTCEngine.onMessage(PROTOCOL.CHAT, (msg) => {
      set((state) => ({
        messages: [...state.messages, msg]
      }));
      if (msg.senderId !== get().myId) {
        if (msg.isPrivate) {
          get().addToast(`${msg.nombre} (Privado): ${msg.text.substring(0,20)}...`, 'private');
          SoundEngine.playPrivateChat();
        } else if (msg.isGlobal) {
          get().addToast(`${msg.nombre} (Global): ${msg.text.substring(0,20)}...`, 'global');
          SoundEngine.playGlobalChat();
        } else if (msg.zona === mapZone || (!msg.zona && msg.isGlobal)) { // fallback
          get().addToast(`${msg.nombre} (Zona): ${msg.text.substring(0,20)}...`, 'info');
          SoundEngine.playZoneChat();
        }
      }
    });

    WebRTCEngine.onMessage(PROTOCOL.FORUM_MSG, (msg) => {
      set((state) => {
        // Prevent duplicates
        if (state.forumMessages.find(m => m.id === msg.id)) return state;
        const newMsg = { ...msg, comments: msg.comments || [] };
        return { forumMessages: [...state.forumMessages, newMsg].sort((a,b) => b.timestamp - a.timestamp) };
      });
      if (msg.senderId !== get().myId) {
        get().addToast(`${msg.nombre} publicó en Social`, 'info');
        SoundEngine.playSocial();
      }
    });

    WebRTCEngine.onMessage(PROTOCOL.FORUM_COMMENT, (data) => {
      set((state) => {
        const newForum = state.forumMessages.map(post => {
            if (post.id === data.postId) {
                if (post.comments.find(c => c.id === data.comment.id)) return post;
                return { ...post, comments: [...post.comments, data.comment] };
            }
            return post;
        });
        return { forumMessages: newForum };
      });
      if (data.comment.senderId !== get().myId) {
        SoundEngine.playSocial();
      }
    });

    WebRTCEngine.onMessage(PROTOCOL.ORGANIZER_BROADCAST, (data) => {
      if (data.text) {
        set({ broadcast: data.text });
        setTimeout(() => set({ broadcast: null }), 8000);
        SoundEngine.playAlert();
      }
    });
    
    setTimeout(() => {
      set({ 
        myId: WebRTCEngine.getMyId(),
        myName: nombre,
        myColor: color,
        myAvatar: avatar,
        isConnected: true,
        zone: mapZone,
        myPoints: 0,
        peers: WebRTCEngine.getPeers() 
      });
    }, 1000);
  },

  disconnect: () => {
    WebRTCEngine.desconectar();
    set({ isConnected: false, peers: [], myId: null, myName: null, myColor: null, myAvatar: null, zone: null, myPoints: 0, messages: [], forumMessages: [] });
  },

  changeZone: (newZone) => {
    set({ zone: newZone });
    WebRTCEngine.broadcast(PROTOCOL.ZONE_CHANGE, { newZone });
  },

  syncPos: (t, l) => {
    WebRTCEngine.broadcast(PROTOCOL.POS_SYNC, { t, l });
  },

  addPoints: (amount) => {
    set((state) => {
      const newPoints = state.myPoints + amount;
      WebRTCEngine.broadcast(PROTOCOL.UPDATE_POINTS, { puntos: newPoints });
      return { myPoints: newPoints };
    });
  },

  sendMessageToForum: (text) => {
    const msgObj = { 
        id: Date.now() + Math.random().toString(),
        text, 
        timestamp: Date.now(), 
        zona: get().zone,
        senderId: get().myId,
        nombre: get().myName || 'Yo',
        avatar: get().myAvatar || (get().myName ? get().myName.charAt(0).toUpperCase() : 'Y'),
        comments: []
    };
    WebRTCEngine.broadcast(PROTOCOL.FORUM_MSG, msgObj);
    set(state => ({ forumMessages: [msgObj, ...state.forumMessages].sort((a,b) => b.timestamp - a.timestamp) }));
  },

  sendCommentToPost: (postId, text) => {
    const comment = {
        id: Date.now() + Math.random().toString(),
        text,
        timestamp: Date.now(),
        senderId: get().myId,
        nombre: get().myName || 'Yo',
        avatar: get().myAvatar || (get().myName ? get().myName.charAt(0).toUpperCase() : 'Y')
    };
    WebRTCEngine.broadcast(PROTOCOL.FORUM_COMMENT, { postId, comment });
    set((state) => {
      const newForum = state.forumMessages.map(post => {
          if (post.id === postId) {
              return { ...post, comments: [...post.comments, comment] };
          }
          return post;
      });
      return { forumMessages: newForum };
    });
  },
}));
