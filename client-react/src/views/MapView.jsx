import { useWebRTCStore } from '../store/useWebRTCStore';

export function MapView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);

  // In a real scenario we'd track each user's X/Y coordinates in the store
  // and they would update via POSITION WebRTC messages.
  // For the MVP we will render them in a list or simple grid.

  return (
    <div className="flex flex-col h-full bg-surface-container  border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface-container-highest/50 backdrop-blur-md">
        <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">Mapa P2P</h2>
        <p className="text-[12px] text-on-surface-variant">Conectado con {peers.length} peers</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card-solid p-4  flex flex-col items-center justify-center border border-primary/50 relative overflow-hidden">
            <div className="absolute top-2 right-2 flex space-x-1">
              <span className="w-2 h-2  bg-green-500 animate-pulse"></span>
            </div>
            <div className="w-16 h-16  flex items-center justify-center text-3xl mb-2 bg-primary/20 text-primary">
              👤
            </div>
            <span className="font-bold text-[14px] text-white">Yo</span>
            <span className="text-[11px] text-on-surface-variant">Mi Nodo</span>
          </div>

          {peers.map(peer => (
            <div key={peer.id} className="glass-card p-4  flex flex-col items-center justify-center border border-outline-variant/30 hover:border-primary/50 transition-colors">
              <div 
                className="w-16 h-16  flex items-center justify-center text-3xl mb-2"
                style={{ backgroundColor: peer.color ? `${peer.color}20` : 'rgba(255,255,255,0.1)', color: peer.color || '#fff' }}
              >
                {peer.avatar || '👤'}
              </div>
              <span className="font-bold text-[14px] truncate w-full text-center" style={{ color: peer.color || '#fff' }}>
                {peer.nombre}
              </span>
              <span className="text-[11px] text-on-surface-variant">{peer.zona || 'Centro'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
