import { useWebRTCStore } from '../store/useWebRTCStore';
import { getMacroZone } from '../shared/zones.js';
import { Star, Users, UserX } from 'lucide-react';

export function UsersView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const myName = useWebRTCStore(state => state.myName);
  const myColor = useWebRTCStore(state => state.myColor);
  const myAvatar = useWebRTCStore(state => state.myAvatar);
  const myZone = useWebRTCStore(state => state.zone);
  const myPoints = useWebRTCStore(state => state.myPoints);

  const allUsers = [
    { id: myId, nombre: myName, color: myColor, avatar: myAvatar, zona: myZone, isMe: true, puntos: myPoints },
    ...peers
  ].filter(u => u.id); // Filter out in case myId isn't fully loaded yet

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <div className="p-4 border-b border-white/10 glass-panel relative z-10">
        <h2 className="font-logo text-[20px] font-bold text-white flex items-center gap-2">
          <Users size={20} className="text-orange-400" /> Directorio de Usuarios
        </h2>
        <p className="text-[12px] text-white/60 font-mono">Personas conectadas a la red P2P en este momento.</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map(peer => (
            <div key={peer.id} className={`glass-panel p-4 flex items-center gap-4 rounded-xl border transition-all ${peer.isMe ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 hover:border-orange-500/30 hover:bg-white/5'}`}>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] relative" 
                style={{ backgroundColor: `${peer.color || '#fb923c'}20`, color: peer.color || '#fb923c' }}
              >
                {peer.avatar || peer.nombre.charAt(0).toUpperCase()}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#05050a]" title="Online"></span>
              </div>
              
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-white leading-tight flex items-center gap-2">
                  {peer.nombre}
                  {peer.isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest font-mono">Tú</span>}
                </span>
                <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase mt-1">
                  ID: {String(peer.id).substring(0, 6)}...
                </span>
              </div>
              
              <div className="ml-auto text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded text-[11px] font-bold mb-1 shadow-[0_0_8px_rgba(234,179,8,0.2)]">
                      <Star size={12} className="fill-yellow-500" />
                      {peer.puntos || 0} pts
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400/70 font-mono">Se encuentra en:</span>
                  <span className="text-xs text-white/90 font-mono">{getMacroZone(peer.zona)} {peer.zona !== getMacroZone(peer.zona) ? `- ${peer.zona}` : ''}</span>
              </div>
            </div>
          ))}
          {allUsers.length === 0 && (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-center opacity-60">
              <UserX size={48} className="mb-2 text-white/40" />
              <p className="text-sm font-medium text-white/60">No hay otros usuarios conectados a la red.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
