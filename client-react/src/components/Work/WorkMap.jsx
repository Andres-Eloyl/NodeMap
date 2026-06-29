import { useWorkStore } from '../../store/useWorkStore';
import { Map as MapIcon } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 p-5 md:p-8 overflow-hidden">
      <div className="flex items-center gap-2 mb-6 text-white font-medium">
        <MapIcon className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg">Mapa de Instalaciones P2P</h2>
      </div>
      
      <div className="flex-1 relative rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden flex items-center justify-center">
        <img 
          src="/work-instalaciones.svg" 
          alt="Plano Corporativo" 
          className="w-full h-full opacity-30 absolute inset-0 object-cover mix-blend-screen" 
        />
        
        <div className="absolute inset-0">
            {visibleStatus.map((emp, i) => {
              const x = 100 + (i * 80) % 600;
              const y = 100 + (i * 60) % 400;
              const color = deptColors[emp.departamento] || '#fff';
              return (
                <div key={emp.id} className="absolute group transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}px`, top: `${y}px` }}>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: color }}></div>
                    <div className="w-3 h-3 rounded-full border border-black/50 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color }}></div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#09090b] border border-white/10 rounded-md px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap transition-all shadow-xl z-20">
                    <div className="font-semibold text-zinc-200">{emp.nombre}</div>
                    <div className="text-zinc-500 uppercase tracking-widest">{emp.departamento}</div>
                  </div>
                </div>
              );
            })}
            
            {visibleStatus.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-zinc-500">
                Ningún peer transmitiendo ubicación.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
