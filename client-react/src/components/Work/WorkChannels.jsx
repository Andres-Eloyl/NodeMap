import { useState, useRef, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';

export function WorkChannels({ currentChannel }) {
  const user = useWorkStore(state => state.user);
  const messages = useWorkStore(state => state.channelMessages);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const activeMessages = messages.filter(m => m.canal === currentChannel);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const msg = {
      id: Date.now() + Math.random().toString(),
      nombre: user.nombre,
      departamento: user.departamento,
      canal: currentChannel,
      texto: text.trim(),
      timestamp: Date.now(),
      senderId: WebRTCEngine.getMyId()
    };

    WebRTCEngine.broadcast(PROTOCOL.WORK_CHANNEL_MSG, msg);
    useWorkStore.getState().addChannelMessage(msg);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeMessages.length === 0 ? (
          <div className="text-center text-white/30 font-mono text-sm mt-10">
            No hay mensajes en #{currentChannel}
          </div>
        ) : (
          activeMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col ${msg.senderId === WebRTCEngine.getMyId() ? 'items-end' : 'items-start'}`}>
              <div className="text-[10px] text-white/40 mb-1 font-mono uppercase tracking-widest flex items-center gap-2">
                <span>{msg.nombre}</span>
                <span className="text-blue-500/70">{msg.departamento}</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`px-4 py-2 max-w-[80%] ${msg.senderId === WebRTCEngine.getMyId() ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-white/5 text-white/90 border border-white/10'}`}>
                {msg.texto}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="p-4 border-t border-white/5 bg-black/40">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder={`Enviar a #${currentChannel}...`}
            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-blue-500/50 outline-none"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 font-bold transition-colors">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
