import { useWorkStore } from '../../store/useWorkStore';

export function WorkTeamList() {
  const user = useWorkStore(state => state.user);
  const statusList = useWorkStore(state => state.networkStatus);

  const team = user.rol === 'Administrador' 
    ? statusList 
    : statusList.filter(s => s.departamento === user.departamento);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">Equipo ({user.rol === 'Administrador' ? 'Toda la Empresa' : user.departamento})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(emp => (
          <div key={emp.id} className="bg-white/5 border border-white/10 p-4 flex justify-between items-center rounded-sm">
            <div>
              <div className="font-bold">{emp.nombre}</div>
              <div className="text-xs text-white/50">{emp.departamento}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono text-blue-400 capitalize">{emp.estado || 'activo'}</div>
              <div className="text-xs text-white/50">{emp.ubicacion || 'Ubicación Desconocida'}</div>
            </div>
          </div>
        ))}
        {team.length === 0 && <div className="text-white/50 text-sm">No hay miembros del equipo conectados.</div>}
      </div>
    </div>
  );
}
