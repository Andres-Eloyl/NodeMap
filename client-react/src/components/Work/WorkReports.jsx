import { useState } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';
import { ShieldAlert, Activity, CheckCircle2, Clock, Plus, X } from "lucide-react";

function Badge({
  tone,
  icon: Icon,
  label,
}) {
  const tones = {
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-300",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    purple: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${tones[tone]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

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
    <div className="flex flex-col h-full bg-transparent relative z-10 p-5 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-white">Incidentes & Reportes</div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
            registro distribuido · firmado por cada autor
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white text-sm font-medium shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:shadow-[0_0_40px_rgba(56,189,248,0.7)] hover:scale-[1.02] transition-all"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Crear Reporte'}
        </button>
      </div>

      {showForm ? (
        <ReportForm onClose={() => setShowForm(false)} user={user} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleReports.length === 0 ? (
            <div className="col-span-full text-center text-zinc-500 font-mono text-sm mt-10">No hay reportes activos.</div>
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
      id: 'RPT-' + Math.floor(Math.random()*9000 + 1000),
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-white mb-2">Crear Nuevo Reporte</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Tipo</label>
          <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50">
            <option value="incidente">Incidente</option>
            <option value="solicitud">Solicitud</option>
            <option value="novedad">Novedad</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Prioridad</label>
          <select value={prioridad} onChange={e=>setPrioridad(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50">
            <option value="normal">Normal</option>
            <option value="media">Media</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Título</label>
        <input type="text" value={titulo} onChange={e=>setTitulo(e.target.value)} required className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Descripción</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} required rows="3" className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50 resize-none"></textarea>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Departamento Destino</label>
          <select value={destino} onChange={e=>setDestino(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50">
              <option value="Tecnología">Tecnología</option>
              <option value="Operaciones">Operaciones</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Dirección">Dirección</option>
              <option value="Finanzas">Finanzas</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Ubicación del Incidente</label>
          <input type="text" value={ubicacion} onChange={e=>setUbicacion(e.target.value)} placeholder="Ej: Sala A" className="w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-md text-sm text-zinc-300 outline-none focus:border-sky-400/50 placeholder:text-zinc-600" />
        </div>
      </div>
      <button type="submit" className="bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-md py-3 mt-4 text-sm font-semibold shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7)] hover:scale-[1.01] transition-all">Enviar Reporte</button>
    </form>
  );
}

function ReportCard({ report, user }) {
  const [commentText, setCommentText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const isManagerOrAdmin = user.rol === 'Gerente' || user.rol === 'Administrador';
  
  const isUrgent = report.prioridad === 'urgente';
  const isResolved = report.estado === 'resuelto';
  const isEscalado = report.estado === 'escalado';

  let statusTone = 'sky';
  if (isResolved) statusTone = 'emerald';
  if (isEscalado) statusTone = 'amber';
  
  let prioTone = 'sky';
  if (isUrgent) prioTone = 'rose';
  if (report.prioridad === 'media') prioTone = 'purple';

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

  const elapsed = () => {
    const diff = Date.now() - report.timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'hace 1m';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden flex flex-col">
      <div
        className={[
          "absolute -top-px left-4 right-4 h-px",
          isUrgent ? "bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" : "bg-gradient-to-r from-transparent via-sky-400/40 to-transparent",
        ].join(" ")}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono text-zinc-500">{report.id}</div>
            <span className="text-[9px] uppercase font-bold text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{report.tipo}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold text-white leading-snug">{report.titulo}</h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            tone={prioTone}
            icon={isUrgent ? ShieldAlert : Activity}
            label={report.prioridad}
          />
          <Badge
            tone={statusTone}
            icon={isResolved ? CheckCircle2 : Clock}
            label={report.estado}
          />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed flex-1">{report.descripcion}</p>

      {report.comentario && (
        <div className="mt-3 bg-white/[0.03] border border-white/5 p-3 rounded-md text-[12px] text-zinc-300">
          <div className="text-[10px] font-mono text-sky-400/80 mb-1 uppercase tracking-widest">{report.actualizado_por} respondió:</div>
          {report.comentario}
        </div>
      )}

      {showReply && !isResolved && (
        <div className="mt-3 flex gap-2">
          <input 
            type="text" 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Respuesta..."
            className="flex-1 bg-white/5 border border-white/10 text-xs px-3 py-2 outline-none rounded-md focus:border-sky-400/50 text-white"
          />
          <button 
            onClick={() => handleUpdate(null, commentText)}
            className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold px-4 py-2 rounded-md hover:bg-sky-500/30 transition-all"
          >
            Enviar
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <div className="text-[10px] font-mono text-zinc-500">
          {report.nombre} ({report.departamento}) · {elapsed()}
        </div>
        <div className="flex gap-2">
          {!isResolved && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[11px] px-3 py-1.5 rounded-md border border-sky-400/30 text-sky-300 hover:bg-sky-500/10 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all"
            >
              Responder
            </button>
          )}
          {isManagerOrAdmin && !isResolved && (
            <>
              {!isEscalado && (
                <button
                  onClick={() => handleUpdate('escalado')}
                  className="text-[11px] px-3 py-1.5 rounded-md border border-amber-400/30 text-amber-300 hover:bg-amber-500/10 transition-all"
                >
                  Escalar
                </button>
              )}
              <button
                onClick={() => handleUpdate('resuelto')}
                className="text-[11px] px-3 py-1.5 rounded-md border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10 transition-all"
              >
                Resolver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
