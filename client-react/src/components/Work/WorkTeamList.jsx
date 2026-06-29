import { useWorkStore } from '../../store/useWorkStore';
import { Users } from 'lucide-react';

export function WorkTeamList() {
  const user = useWorkStore(state => state.user);
  const statusList = useWorkStore(state => state.networkStatus);

  const team = user.rol === 'Administrador' 
    ? statusList 
    : statusList.filter(s => s.departamento === user.departamento);

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 p-5 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" />
            Equipo ({user.rol === 'Administrador' ? 'Global' : user.departamento})
          </div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
            peers P2P actualmente reportando telemetría
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(emp => {
          const initials = emp.nombre.substring(0,2).toUpperCase();
          const isActive = emp.estado?.toLowerCase() !== 'ocupado' && emp.estado?.toLowerCase() !== 'ausente';
          return (
            <div key={emp.id} className="group relative rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-800/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-sky-300">
                  {initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#09090b] shadow-[0_0_8px_rgba(52,211,153,0.7)] ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{emp.nombre}</div>
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-0.5">{emp.departamento}</div>
              </div>
              
              <div className="text-right shrink-0">
                <div className={`text-xs font-mono uppercase ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>{emp.estado || 'Activo'}</div>
                <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[100px] mt-0.5">{emp.ubicacion || 'Remoto'}</div>
              </div>
            </div>
          )
        })}
        
        {team.length === 0 && (
          <div className="col-span-full text-center text-zinc-500 text-sm font-mono mt-10">No hay miembros del equipo conectados.</div>
        )}
      </div>
    </div>
  );
}
