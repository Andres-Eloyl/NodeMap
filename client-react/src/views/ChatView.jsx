import { useState, useRef, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { Send, Users, Globe, Lock, MessageSquareText, ChevronLeft } from 'lucide-react';
import PROTOCOL from '../shared/protocol.js';

function MessageList({ messages, myId, peers, isPrivateView }) {
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

        // WhatsApp Structure with Original NodeMap Colors for Private Chats
        if (isPrivateView) {
            return (
              <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-[fade-in_0.3s_ease-out]`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[15px] shadow-sm relative pb-5 ${
                    isMe ? 'bg-primary text-[#68000a] rounded-tr-sm' : 'glass-card-solid bg-[#f3e5f5]/10 border border-[#ab47bc]/40 text-[#ce93d8] rounded-tl-sm'
                }`}>
                    {!isMe && <div className="text-[12px] font-bold mb-0.5" style={{ color }}>{name}</div>}
                    <div className="leading-snug break-words pr-8">{msg.text}</div>
                    <span className={`text-[10px] absolute bottom-1 right-2 ${isMe ? 'text-[#68000a]/60' : 'text-[#ce93d8]/60'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            );
        }

        // Standard Style for Global/Zone
        return (
          <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fade-in_0.3s_ease-out]`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold" style={{ color }}>{name}</span>
              <span className="text-[10px] text-white/40">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div 
              className={`max-w-[80%] px-4 py-2.5 text-[14px] shadow-sm rounded-lg ${
                isMe ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-tr-sm' : 'glass-panel text-white border-l-2 rounded-tl-sm'
              }`}
              style={(!isMe) ? { borderLeftColor: color } : {}}
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
  const activeTab = useWebRTCStore(state => state.chatTab);
  const setActiveTab = useWebRTCStore(state => state.setChatTab);
  const privatePeerId = useWebRTCStore(state => state.privateChatId);
  const setPrivatePeerId = useWebRTCStore(state => state.setPrivateChatId);
  
  const [text, setText] = useState('');

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

  const privateContacts = [...peers].sort((a, b) => {
    const aMsgs = messages.filter(m => m.isPrivate && (m.senderId === a.id || m.targetId === a.id));
    const bMsgs = messages.filter(m => m.isPrivate && (m.senderId === b.id || m.targetId === b.id));
    const aLast = aMsgs.length > 0 ? aMsgs[aMsgs.length - 1].timestamp : 0;
    const bLast = bMsgs.length > 0 ? bMsgs[bMsgs.length - 1].timestamp : 0;
    return bLast - aLast;
  });

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      
      {/* HEADER TABS */}
      <div className="flex bg-black/60 backdrop-blur-md border-b border-white/10 relative z-10">
        <button onClick={() => {setActiveTab('zona'); setPrivatePeerId(null);}} className={`flex-1 py-3 text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'zona' ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/5' : 'text-white/50 hover:bg-white/5'}`}>
          <Users size={16}/> Zona
        </button>
        <button onClick={() => {setActiveTab('global'); setPrivatePeerId(null);}} className={`flex-1 py-3 text-[13px] font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'global' ? 'text-orange-400 border-b-2 border-orange-400 bg-orange-500/5' : 'text-white/50 hover:bg-white/5'}`}>
          <Globe size={16}/> Global
        </button>
        <button onClick={() => setActiveTab('privados')} className={`flex-1 py-3 text-[13px] font-bold uppercase tracking-widest border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'privados' ? 'border-orange-400 text-orange-400 bg-orange-500/5' : 'border-transparent text-white/50 hover:bg-white/5'}`}>
          <Lock className="w-4 h-4" /> Privados
        </button>
      </div>

      {activeTab === 'privados' && !privatePeerId ? (
        <div className="flex-1 overflow-y-auto p-4 z-10 relative">
          <h3 className="font-bold text-white mb-4 font-logo">Selecciona un Peer</h3>
          <div className="flex flex-col gap-2">
            {privateContacts.length === 0 && <p className="text-white/50 text-sm">No hay peers conectados.</p>}
            {privateContacts.map(p => {
              const pMsgs = messages.filter(m => m.isPrivate && (m.senderId === p.id || m.targetId === p.id));
              const lastMsg = pMsgs.length > 0 ? pMsgs[pMsgs.length - 1] : null;
              return (
              <button key={p.id} onClick={() => setPrivatePeerId(p.id)} className="glass-panel p-4 flex items-center gap-3 hover:bg-white/5 text-left transition-colors relative rounded-xl">
                <div className="w-10 h-10 flex items-center justify-center bg-orange-500/20 rounded-full border border-orange-500/30 shadow-[0_0_10px_rgba(251,146,60,0.2)]" style={{ color: p.color || '#fff' }}>{p.avatar || p.nombre.charAt(0).toUpperCase()}</div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-white text-[14px]">{p.nombre}</div>
                  <div className="text-[12px] text-white/50 truncate">{lastMsg ? lastMsg.text : p.zona}</div>
                </div>
                {lastMsg && <div className="text-[10px] text-white/40 absolute top-4 right-4">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
              </button>
            )})}
          </div>
        </div>
      ) : (
        <>
          {/* Context Header for sub-tabs */}
          {activeTab === 'privados' && privatePeerId && (
            <div className="bg-surface-container-highest/50 p-2 border-b border-outline-variant/20 flex items-center gap-2">
              <button onClick={() => setPrivatePeerId(null)} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={24}/></button>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/20 text-white font-bold" style={{ backgroundColor: peers.find(p => p.id === privatePeerId)?.color || '#555' }}>
                  {peers.find(p => p.id === privatePeerId)?.nombre?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex flex-col">
                  <span className="font-bold text-[#ce93d8] text-[16px] leading-tight">{peers.find(p => p.id === privatePeerId)?.nombre || 'Desconocido'}</span>
                  <span className="text-[12px] text-white/60 leading-tight">en línea</span>
              </div>
            </div>
          )}

          <MessageList messages={currentMessages} myId={myId} peers={peers} isPrivateView={activeTab === 'privados'} />

          <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-md relative z-10">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-4xl mx-auto w-full">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-5 h-12 outline-none glass-panel text-white rounded-full bg-white/5 focus:bg-white/10 focus:border-orange-500/50 transition-colors"
                autoComplete="off"
              />
              <button type="submit" className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 bg-orange-500 text-[#05050a] w-12 h-12 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                <Send size={20} className="ml-1" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
