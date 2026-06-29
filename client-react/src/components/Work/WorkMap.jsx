import { useWorkStore } from '../../store/useWorkStore';
import { Map as MapIcon, Users, Laptop } from 'lucide-react';

export function WorkMap() {
  const user = useWorkStore(state => state.user);
  const statusList = useWorkStore(state => state.networkStatus);

  const visibleStatus = user.rol === 'Administrador'
    ? statusList
    : statusList.filter(s => s.departamento === user.departamento);

  const deptColors = {
    'Tecnología': '#38bdf8', // sky-400
    'Operaciones': '#34d399', // emerald-400
    'Recursos Humanos': '#fbbf24', // amber-400
    'Dirección': '#a78bfa', // violet-400
    'Finanzas': '#fb7185', // rose-400
  };

  // Agrupamos los peers por ubicación
  const peersByLocation = visibleStatus.reduce((acc, peer) => {
    const loc = peer.ubicacion || 'Remoto';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(peer);
    return acc;
  }, {});

  const renderRoom = (roomId, title, className = '') => {
    const peers = peersByLocation[roomId] || [];
    
    return (
      <div className={`relative flex flex-col p-4 border border-white/5 bg-black/40 hover:bg-black/60 transition-colors group overflow-hidden ${className}`}>
        {/* Room Title */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-semibold tracking-wide text-zinc-300 font-mono">{title}</span>
          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1"><Users className="w-3 h-3"/> {peers.length}</span>
        </div>

        {/* Peers Container */}
        <div className="flex-1 flex flex-wrap gap-3 content-start relative z-10">
          {peers.map(peer => {
            const color = deptColors[peer.departamento] || '#fff';
            return (
              <div 
                key={peer.id} 
                className="relative cursor-pointer hover:-translate-y-0.5 transition-transform"
                title={`${peer.nombre} - ${peer.departamento}`}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shadow-lg border border-black/50"
                     style={{ backgroundColor: color + '20', color: color, borderColor: color + '50' }}>
                  {peer.nombre.substring(0, 2).toUpperCase()}
                </div>
                
                {/* Tooltip */}
                <div className="absolute opacity-0 pointer-events-none group-hover/peer:pointer-events-auto group-hover/peer:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#09090b] border border-white/10 rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-50">
                  {peer.nombre}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Estética de fondo */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 p-5 md:p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-white font-medium">
          <MapIcon className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg">Mapa Interactivo de Instalaciones</h2>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
          {Object.entries(deptColors).map(([dept, color]) => (
            <div key={dept} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
              {dept}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-y-auto custom-scrollbar p-6">
        
        {/* CSS GRID MAP */}
        <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full min-h-[500px]">
          
          {/* Fila 1 */}
          {renderRoom('Recepción', 'Recepción', 'col-span-1 row-span-1 rounded-tl-xl')}
          {renderRoom('Oficinas Generales', 'Oficinas Generales', 'col-span-2 row-span-2')}
          {renderRoom('Data Center', 'Data Center', 'col-span-1 row-span-1 rounded-tr-xl border-b-0')}

          {/* Fila 2 */}
          {renderRoom('Sala de Juntas', 'Sala de Juntas A', 'col-span-1 row-span-1')}
          {/* Oficinas Generales ocupa este espacio (2x2) */}
          <div className="col-span-1 row-span-1 border border-white/5 bg-black/40 p-4 relative overflow-hidden flex flex-col items-center justify-center text-zinc-600/50">
            <span className="text-xs font-mono mb-2">ZONA RESTRINGIDA</span>
            <div className="w-full h-full border border-dashed border-zinc-700/30 rounded-md"></div>
          </div>

          {/* Fila 3 */}
          {renderRoom('Cafetería', 'Cafetería & Descanso', 'col-span-2 row-span-1 rounded-bl-xl')}
          {renderRoom('Remoto', 'Personal Remoto', 'col-span-2 row-span-1 rounded-br-xl bg-indigo-950/10 border-indigo-500/10')}
          
        </div>
        
      </div>
    </div>
  );
}
