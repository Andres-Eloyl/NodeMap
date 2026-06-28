import { useState, useRef, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';

export function WorkPrivateMessages() {
  const user = useWorkStore(state => state.user);
  const messages = useWorkStore(state => state.privateMessages);
  const statusList = useWorkStore(state => state.networkStatus);
  const [targetId, setTargetId] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  const myId = WebRTCEngine.getMyId();
  
  const activeMessages = targetId 
    ? messages.filter(m => (m.senderId === myId && m.destino_id === targetId) || (m.senderId === targetId && m.destino_id === myId))
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !targetId) return;

    const targetUser = statusList.find(s => s.id === targetId);

    const msg = {
      id: Date.now() + Math.random().toString(),
      nombre: user.nombre,
      destino_id: targetId,
      destino_nombre: targetUser?.nombre || 'Desconocido',
      texto: text.trim(),
      timestamp: Date.now(),
      senderId: myId
    };

    WebRTCEngine.sendToPeer(targetId, PROTOCOL.WORK_PRIVATE_MSG, msg);
    useWorkStore.getState().addPrivateMessage(msg);
    setText('');
  };

  const peers = statusList.filter(s => s.id !== myId);

  return (
    <div className="flex h-full bg-[#0a0a0f] border border-white/5 relative z-10">
      <div className="w-64 border-r border-white/5 p-4 overflow-y-auto bg-black/20">
        <h3 className="font-bold mb-4 text-sm text-white/50 font-mono tracking-widest">CONTACTOS</h3>
        {peers.map(p => (
          <button 
            key={p.id}
            onClick={() => setTargetId(p.id)}
            className={`w-full text-left p-3 mb-2 text-sm transition-colors border ${targetId === p.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <div className="font-bold">{p.nombre}</div>
            <div className="text-[10px] text-white/50 uppercase">{p.departamento}</div>
          </button>
        ))}
        {peers.length === 0 && <div className="text-xs text-white/30">Nadie conectado.</div>}
      </div>

      <div className="flex-1 flex flex-col">
        {targetId ? (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeMessages.length === 0 ? (
                <div className="text-center text-white/30 font-mono text-sm mt-10">No hay mensajes.</div>
              ) : (
                activeMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === myId ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-white/40 mb-1 font-mono uppercase tracking-widest">
                      {msg.senderId === myId ? 'Tú' : msg.nombre} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`px-4 py-2 max-w-[80%] ${msg.senderId === myId ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-white/5 text-white/90 border border-white/10'}`}>
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
                  placeholder={`Mensaje privado...`}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-blue-500/50 outline-none"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-6 font-bold transition-colors">
                  Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 font-mono text-sm">
            Selecciona un contacto para comenzar a chatear.
          </div>
        )}
      </div>
    </div>
  );
}
