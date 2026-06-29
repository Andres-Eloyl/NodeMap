import { useState, useRef, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';
import { Send, Wifi } from "lucide-react";

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
    e?.preventDefault();
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
  const currentTargetUser = statusList.find(s => s.id === targetId);

  return (
    <div className="flex h-full bg-transparent relative z-10">
      <div className="w-64 border-r border-white/5 p-4 overflow-y-auto bg-black/20">
        <h3 className="font-bold mb-4 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Contactos P2P</h3>
        {peers.map(p => (
          <button 
            key={p.id}
            onClick={() => setTargetId(p.id)}
            className={`w-full text-left px-3 py-2.5 mb-2 rounded-lg text-sm transition-all border ${targetId === p.id ? 'bg-sky-500/10 border-sky-400/30 text-white shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]' : 'bg-white/[0.02] border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] hover:border-white/5'}`}
          >
            <div className="font-bold truncate">{p.nombre}</div>
            <div className="text-[10px] opacity-70 uppercase font-mono mt-1">{p.departamento}</div>
          </button>
        ))}
        {peers.length === 0 && <div className="text-xs text-zinc-500 italic mt-4">Nadie conectado en la malla.</div>}
      </div>

      <div className="flex-1 flex flex-col h-full">
        {targetId ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  <Wifi className="h-3 w-3 text-emerald-400" />
                  Cifrado E2E · {currentTargetUser?.nombre}
                </div>
              </div>
              
              {activeMessages.length === 0 ? (
                <div className="text-center text-zinc-600 font-mono text-sm mt-10">No hay mensajes.</div>
              ) : (
                activeMessages.map(msg => {
                  const self = msg.senderId === myId;
                  return (
                    <div key={msg.id} className={`flex ${self ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] ${self ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className={`flex gap-2 text-[10px] font-mono text-zinc-500 ${self ? "justify-end" : ""}`}>
                          <span className="text-zinc-300">{self ? 'Tú' : msg.nombre}</span>
                          <span className="text-zinc-600">•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={[
                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed border backdrop-blur-md",
                            self
                              ? "bg-gradient-to-br from-sky-500/25 to-blue-700/20 border-sky-400/30 text-white rounded-tr-sm shadow-[0_4px_30px_-10px_rgba(56,189,248,0.4)]"
                              : "bg-white/[0.04] border-white/10 text-zinc-200 rounded-tl-sm",
                          ].join(" ")}
                        >
                          {msg.texto}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
            
            <div className="px-5 md:px-8 pb-6">
              <form onSubmit={handleSend} className="relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_40px_-20px_rgba(56,189,248,0.5)] focus-within:border-sky-400/40 focus-within:shadow-[0_0_60px_-20px_rgba(56,189,248,0.7)] transition-all">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Mensaje privado a ${currentTargetUser?.nombre}`}
                  className="w-full bg-transparent px-4 py-3.5 pr-28 text-sm placeholder:text-zinc-600 outline-none text-white"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7)] hover:scale-[1.02] transition-all"
                >
                  <Send className="h-3.5 w-3.5" /> Enviar
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 font-mono text-xs">
            <Wifi className="h-8 w-8 mb-3 opacity-20" />
            Selecciona un nodo para iniciar conexión P2P.
          </div>
        )}
      </div>
    </div>
  );
}
