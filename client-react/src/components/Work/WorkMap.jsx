import { useWorkStore } from '../../store/useWorkStore';

export function WorkMap() {
  const statusList = useWorkStore(state => state.networkStatus);

  // Departamentos y sus colores
  const deptColors = {
    'Tecnología': '#3b82f6', // blue-500
    'Operaciones': '#10b981', // emerald-500
    'Recursos Humanos': '#ec4899', // pink-500
    'Dirección': '#8b5cf6', // violet-500
    'Finanzas': '#f59e0b', // amber-500
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10 p-6 overflow-hidden">
      <h2 className="text-xl font-bold mb-6">Mapa de Instalaciones</h2>
      
      <div className="flex-1 relative border border-white/10 bg-black/50 overflow-hidden flex items-center justify-center">
        {/* Placeholder SVG map */}
        <svg viewBox="0 0 800 600" className="w-full h-full opacity-50 absolute inset-0">
          <rect x="50" y="50" width="300" height="200" fill="none" stroke="#ffffff33" strokeWidth="2"/>
          <text x="200" y="150" fill="#ffffff55" textAnchor="middle" className="font-mono text-sm">Tecnología (Sala A)</text>

          <rect x="400" y="50" width="350" height="200" fill="none" stroke="#ffffff33" strokeWidth="2"/>
          <text x="575" y="150" fill="#ffffff55" textAnchor="middle" className="font-mono text-sm">Operaciones (Sala B)</text>

          <rect x="50" y="300" width="300" height="250" fill="none" stroke="#ffffff33" strokeWidth="2"/>
          <text x="200" y="425" fill="#ffffff55" textAnchor="middle" className="font-mono text-sm">RRHH / Finanzas</text>
          
          <rect x="400" y="300" width="350" height="250" fill="none" stroke="#ffffff33" strokeWidth="2"/>
          <text x="575" y="425" fill="#ffffff55" textAnchor="middle" className="font-mono text-sm">Dirección</text>
        </svg>

        {/* Empleados renderizados de forma simulada */}
        <div className="absolute inset-0">
            {statusList.map((emp, i) => {
              // Posición simulada basada en el index para no hacer lógica compleja de collision
              const x = 100 + (i * 40) % 600;
              const y = 100 + (i * 30) % 400;
              return (
                <div key={emp.id} className="absolute group transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}px`, top: `${y}px` }}>
                  <div className="w-4 h-4 rounded-full border-2 border-white/50 animate-pulse" style={{ backgroundColor: deptColors[emp.departamento] || '#fff' }}></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 border border-white/20 px-2 py-1 text-[10px] font-mono whitespace-nowrap transition-opacity">
                    {emp.nombre} ({emp.departamento})
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
