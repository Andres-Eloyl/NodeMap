import { useState, useRef, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { Send, Users, Globe, Lock, MessageSquareText, ChevronLeft } from 'lucide-react';
import PROTOCOL from '../shared/protocol.js';

function MessageList({ messages, myId, peers }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => {
        const isMe = msg.senderId === myId;
        const peer = peers.find(p => p.id === msg.senderId);
        const color = isMe ? '#ffb3ad' : (peer?.color || msg.color || '#69d8d4');
        const name = isMe ? 'Yo' : (msg.nombre || peer?.nombre || 'Desconocido');

        return (
          <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fade-in_0.3s_ease-out]`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold" style={{ color }}>{name}</span>
              <span className="text-[10px] text-white/40">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div 
              className={`max-w-[80%] px-4 py-2.5 text-[14px] shadow-sm ${
                isMe ? 'bg-primary text-[#68000a]' : (msg.isPrivate ? 'glass-card-solid bg-[#f3e5f5]/10 border border-[#ab47bc]/40 text-[#ce93d8]' : 'glass-card-solid text-on-surface border-l-2')
              }`}
              style={(!isMe && !msg.isPrivate) ? { borderLeftColor: color } : {}}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
      {messages.length === 0 && <div className="text-center text-on-surface-variant/50 mt-10 text-sm">No hay mensajes aún.</div>}
      <div ref={endRef} />
    </div>
  );
}

export function ChatView() {
  const [activeTab, setActiveTab] = useState('global'); // 'zona', 'global', 'privados'
  const [text, setText] = useState('');
  const [privatePeerId, setPrivatePeerId] = useState(null);

  const messages = useWebRTCStore(state => state.messages);
  const myId = useWebRTCStore(state => state.myId);
  const myZone = useWebRTCStore(state => state.zone);
  const peers = useWebRTCStore(state => state.peers);

  // Removed forumZone logic

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const msgObj = {
      senderId: myId,
      nombre: 'Yo',
      text: text.trim(),
      timestamp: Date.now(),
      zona: activeTab === 'zona' ? myZone : null,
      isGlobal: activeTab === 'global',
      isPrivate: activeTab === 'privados',
      targetId: activeTab === 'privados' ? privatePeerId : null
    };

    // Update local state
    useWebRTCStore.setState(state => ({ messages: [...state.messages, msgObj] }));
    
    // Send via WebRTC
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      if (activeTab === 'global') {
        WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: text.trim(), timestamp: msgObj.timestamp, isGlobal: true, nombre: 'Yo' });
      } else if (activeTab === 'zona') {
        // Send only to peers in same zone
        peers.filter(p => p.zona === myZone).forEach(p => {
            WebRTCEngine.sendMessage(p.id, PROTOCOL.CHAT, { text: text.trim(), timestamp: msgObj.timestamp, zona: myZone, nombre: 'Yo' });
        });
      } else if (activeTab === 'privados' && privatePeerId) {
        WebRTCEngine.sendMessage(privatePeerId, PROTOCOL.CHAT, { text: text.trim(), timestamp: msgObj.timestamp, isPrivate: true, nombre: 'Yo' });
      }
    });

    setText('');
  };

  const currentMessages = activeTab === 'global' ? messages.filter(m => m.isGlobal) :
                          activeTab === 'zona' ? messages.filter(m => m.zona === myZone && !m.isGlobal && !m.isPrivate) :
                          activeTab === 'privados' && privatePeerId ? messages.filter(m => m.isPrivate && (m.senderId === privatePeerId || m.targetId === privatePeerId)) : [];

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      
      {/* HEADER TABS */}
      <div className="flex bg-surface-container-highest/80 backdrop-blur-md border-b border-primary/20">
        <button onClick={() => {setActiveTab('zona'); setPrivatePeerId(null);}} className={`flex-1 py-3 text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'zona' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant/70 hover:bg-surface-container'}`}>
          <Users size={16}/> Zona
        </button>
        <button onClick={() => {setActiveTab('global'); setPrivatePeerId(null);}} className={`flex-1 py-3 text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'global' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant/70 hover:bg-surface-container'}`}>
          <Globe size={16}/> Global
        </button>
        <button onClick={() => setActiveTab('privados')} className={`flex-1 py-3 text-[13px] font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'privados' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:bg-surface-variant/30'}`}>
          <Lock className="w-4 h-4 inline-block mr-2 -mt-0.5" />
          Privados
        </button>
      </div>

      {activeTab === 'privados' && !privatePeerId ? (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-bold text-white mb-4">Selecciona un Peer</h3>
          <div className="flex flex-col gap-2">
            {peers.length === 0 && <p className="text-on-surface-variant text-sm">No hay peers conectados.</p>}
            {peers.map(p => (
              <button key={p.id} onClick={() => setPrivatePeerId(p.id)} className="glass-card p-4 flex items-center gap-3 hover:bg-surface-container text-left transition-colors">
                <div className="w-10 h-10 flex items-center justify-center bg-primary/20" style={{ color: p.color || '#fff' }}>{p.avatar || p.nombre.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="font-bold text-white text-[14px]">{p.nombre}</div>
                  <div className="text-[11px] text-on-surface-variant">{p.zona}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Context Header for sub-tabs */}
          {activeTab === 'privados' && privatePeerId && (
            <div className="bg-surface-container-highest/50 p-2 border-b border-outline-variant/20 flex items-center gap-2">
              <button onClick={() => setPrivatePeerId(null)} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={20}/></button>
              <span className="font-bold text-[#ce93d8] text-sm">Chat con {peers.find(p => p.id === privatePeerId)?.nombre || 'Desconocido'}</span>
            </div>
          )}

          <MessageList messages={currentMessages} myId={myId} peers={peers} />

          <div className="p-4 border-t border-primary/20 bg-surface-container-highest/80 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="input-field flex-1 px-4 h-12"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary px-6 flex items-center justify-center">
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
