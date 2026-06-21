import { useState, useRef, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { Send } from 'lucide-react';
import PROTOCOL from '../shared/protocol.js';

export function ChatView() {
  const [text, setText] = useState('');
  const messages = useWebRTCStore(state => state.messages);
  const myId = useWebRTCStore(state => state.myId);
  const peers = useWebRTCStore(state => state.peers);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // Optimistically add our own message (in a real app you might want a local only state, or broadcast first)
    // Actually WebRTCEngine broadcast handles sending to others, but we need to show our own.
    // Let's call a method in store or just handle it here.
    const msgObj = {
      senderId: myId,
      nombre: 'Yo',
      text: text.trim(),
      timestamp: Date.now()
    };
    useWebRTCStore.setState(state => ({ messages: [...state.messages, msgObj] }));
    
    // Broadcast via WebRTC
    // Note: The store's WebRTCEngine needs to send the message
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.broadcast(PROTOCOL.CHAT, { text: text.trim(), timestamp: msgObj.timestamp });
    });

    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-container  border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface-container-highest/50 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">Foro Global P2P</h2>
        <p className="text-[12px] text-on-surface-variant">Conectado con {peers.length} peers localmente</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === myId;
          const peer = peers.find(p => p.id === msg.senderId);
          const color = isMe ? '#ffb3ad' : (peer?.color || '#69d8d4');
          const name = isMe ? 'Yo' : (msg.nombre || peer?.nombre || 'Desconocido');

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fade-in_0.3s_ease-out]`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold" style={{ color }}>{name}</span>
                <span className="text-[10px] text-white/40">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div 
                className={`max-w-[80%] px-4 py-2.5  text-[14px] shadow-sm ${
                  isMe 
                    ? 'bg-primary text-[#68000a] ' 
                    : 'glass-card-solid text-on-surface  border-l-2'
                }`}
                style={!isMe ? { borderLeftColor: color } : {}}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-primary/20 bg-surface-container-highest/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="input-field  flex-1 px-4 h-12"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary  px-6 flex items-center justify-center">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
