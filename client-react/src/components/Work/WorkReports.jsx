import { useState } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';

export function WorkReports() {
  const user = useWorkStore(state => state.user);
  const reports = useWorkStore(state => state.reports);
  const [showForm, setShowForm] = useState(false);

  // Filtro: Colaborador ve los suyos, Gerente/Admin ven todos los de su departamento o globales
  const visibleReports = user.rol === 'Colaborador' 
    ? reports.filter(r => r.nombre === user.nombre)
    : user.rol === 'Gerente' 
      ? reports.filter(r => r.departamento === user.departamento || r.departamento_destino === user.departamento)
      : reports; // Admin ve todo

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Reportes de Incidencias</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Cancelar' : 'Nuevo Reporte'}
        </button>
      </div>

      {showForm ? (
        <ReportForm onClose={() => setShowForm(false)} user={user} />
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {visibleReports.length === 0 ? (
            <div className="text-center text-white/30 font-mono text-sm mt-10">No hay reportes activos.</div>
          ) : (
            visibleReports.map(report => (
              <ReportCard key={report.id} report={report} user={user} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ReportForm({ onClose, user }) {
  const [tipo, setTipo] = useState('incidente');
  const [titulo, setTitulo] = useState('');
  const [desc, setDesc] = useState('');
  const [prioridad, setPrioridad] = useState('normal');
  const [destino, setDestino] = useState('Tecnología');
  const [ubicacion, setUbicacion] = useState('');
  const [adjunto, setAdjunto] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo || !desc) return;

    const newReport = {
      id: 'rep' + Date.now(),
      nombre: user.nombre,
      departamento: user.departamento,
      tipo,
      titulo,
      descripcion: desc,
      prioridad,
      departamento_destino: destino,
      ubicacion: ubicacion || 'No especificada',
      adjunto: adjunto ? adjunto.name : null,
      estado: 'pendiente',
      timestamp: Date.now(),
      senderId: WebRTCEngine.getMyId()
    };

    WebRTCEngine.broadcast(PROTOCOL.WORK_REPORT, newReport);
    useWorkStore.getState().upsertReport(newReport);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-black/40 border border-white/10 p-6 flex flex-col gap-4 animate-fade-in">
      <h3 className="font-bold text-blue-400 mb-2">Crear Nuevo Reporte</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Tipo</label>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none">
            <option value="incidente">Incidente</option>
            <option value="solicitud">Solicitud</option>
            <option value="novedad">Novedad</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Prioridad</label>
          <select value={prioridad} onChange={e=>setPrioridad(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none">
            <option value="normal">Normal</option>
            <option value="media">Media</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Título</label>
        <input type="text" value={titulo} onChange={e=>setTitulo(e.target.value)} required className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Descripción</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} required rows="3" className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none resize-none"></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Departamento Destino</label>
          <select value={destino} onChange={e=>setDestino(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none">
              <option value="Tecnología">Tecnología</option>
              <option value="Operaciones">Operaciones</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Dirección">Dirección</option>
              <option value="Finanzas">Finanzas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Ubicación del Incidente</label>
          <input type="text" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} placeholder="Ej: Sala A, Pasillo Central" className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none placeholder:text-white/20" />
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Adjunto (opcional)</label>
        <input type="file" onChange={e=>setAdjunto(e.target.files[0])} className="w-full bg-[#0a0a0f] border border-white/10 p-2 text-sm outline-none text-white/60 file:mr-4 file:py-1 file:px-3 file:border file:border-white/10 file:text-xs file:bg-white/5 file:text-white/60 file:cursor-pointer" />
      </div>
      <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-3 mt-2 font-bold transition-colors">Enviar Reporte</button>
    </form>
  );
}

function ReportCard({ report, user }) {
  const [commentText, setCommentText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const isManagerOrAdmin = user.rol === 'Gerente' || user.rol === 'Administrador';
  
  const statusColor = report.estado === 'resuelto' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 
                      report.estado === 'escalado' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                      'text-red-400 border-red-500/30 bg-red-500/10';

  const handleUpdate = (newState, customComment = null) => {
    const update = {
      reporte_id: report.id,
      estado: newState || report.estado,
      comentario: customComment,
      actualizado_por: user.nombre,
      timestamp: Date.now(),
      senderId: WebRTCEngine.getMyId()
    };
    WebRTCEngine.broadcast(PROTOCOL.WORK_REPORT_UPDATE, update);
    useWorkStore.getState().upsertReport(update);
    setShowReply(false);
    setCommentText('');
  };

  const tipoColor = {
    incidente: 'text-red-400 border-red-400/30 bg-red-400/10',
    solicitud: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    novedad: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
    urgente: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  };

  const elapsed = () => {
    const diff = Date.now() - report.timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="bg-black/20 border border-white/10 p-4 hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${tipoColor[report.tipo] || tipoColor.incidente}`}>{report.tipo}</span>
          <h4 className="font-bold text-white">{report.titulo}</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/40">{elapsed()}</span>
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${statusColor}`}>{report.estado}</span>
        </div>
      </div>
      <p className="text-sm text-white/70 mb-4">{report.descripcion}</p>
      
      {report.comentario && (
        <div className="bg-white/5 border border-white/10 p-3 mb-4 text-sm font-mono text-white/80">
          <div className="text-[10px] text-blue-400 mb-1 uppercase tracking-widest">{report.actualizado_por} respondió:</div>
          {report.comentario}
        </div>
      )}

      {showReply && report.estado !== 'resuelto' && (
        <div className="mb-4 flex gap-2">
          <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="flex-1 bg-white/5 border border-white/10 text-xs px-3 py-2 outline-none focus:border-blue-500/50 text-white"
          />
          <button 
            onClick={() => handleUpdate(null, commentText)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2"
          >
            Enviar
          </button>
        </div>
      )}
      
      <div className="flex justify-between items-end mt-2">
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest space-y-1">
          <div>Reporta: <span className="text-white/80">{report.nombre} ({report.departamento})</span></div>
          <div>Destino: <span className="text-white/80">{report.departamento_destino}</span> | Prioridad: <span className="text-white/80">{report.prioridad}</span>{report.ubicacion && report.ubicacion !== 'No especificada' ? <> | Ubicación: <span className="text-white/80">{report.ubicacion}</span></> : null}</div>
          {report.actualizado_por && !report.comentario && <div>Última act. por: <span className="text-blue-400">{report.actualizado_por}</span></div>}
        </div>

        <div className="flex gap-2">
          {report.estado !== 'resuelto' && (
            <button onClick={() => setShowReply(!showReply)} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 border border-blue-500/30">
              {showReply ? 'CANCELAR' : 'RESPONDER'}
            </button>
          )}
          {isManagerOrAdmin && report.estado !== 'resuelto' && (
            <>
              <button onClick={() => handleUpdate('escalado')} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30 border border-yellow-500/30">
                ESCALAR
              </button>
              <button onClick={() => handleUpdate('resuelto')} className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 border border-green-500/30">
                RESOLVER
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
