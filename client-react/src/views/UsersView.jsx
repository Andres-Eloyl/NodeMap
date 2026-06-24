import { useWebRTCStore } from '../store/useWebRTCStore';

export function UsersView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const myName = useWebRTCStore(state => state.myName);
  const myColor = useWebRTCStore(state => state.myColor);
  const myAvatar = useWebRTCStore(state => state.myAvatar);
  const myZone = useWebRTCStore(state => state.zone);

  const allUsers = [
    { id: myId, nombre: myName, color: myColor, avatar: myAvatar, zona: myZone, isMe: true },
    ...peers
  ].filter(u => u.id); // Filter out in case myId isn't fully loaded yet

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <div className="p-4 border-b border-outline-variant/30 bg-surface/50 backdrop-blur-md">
        <h2 className="font-headline-lg text-[20px] font-bold text-primary">Directorio de Usuarios</h2>
        <p className="text-[12px] text-on-surface-variant/80">Personas conectadas a la red P2P en este momento.</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map(peer => (
            <div key={peer.id} className={`glass-card p-4 flex items-center gap-4 border transition-all ${peer.isMe ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-variant/10'}`}>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner relative" 
                style={{ backgroundColor: `${peer.color || '#03c6b2'}20`, color: peer.color || '#03c6b2' }}
              >
                {peer.avatar || peer.nombre.charAt(0).toUpperCase()}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#13121d]" title="Online"></span>
              </div>
              
              <div className="flex flex-col">
                <span className="font-headline-md font-bold text-[15px] text-on-surface leading-tight flex items-center gap-2">
                  {peer.nombre}
                  {peer.isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-widest">Tú</span>}
                </span>
                <span className="font-label-mono text-[10px] tracking-widest text-on-surface-variant/60 uppercase mt-1">
                  ID: {String(peer.id).substring(0, 6)}...
                </span>
              </div>
              
              <div className="ml-auto text-right flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary/70">Zona</span>
                  <span className="text-xs text-on-surface">{peer.zona}</span>
              </div>
            </div>
          ))}
          {allUsers.length === 0 && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center opacity-60">
              <span className="material-symbols-outlined text-5xl mb-2 text-on-surface-variant">group_off</span>
              <p className="text-sm font-medium text-on-surface-variant">No hay otros usuarios conectados a la red.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
