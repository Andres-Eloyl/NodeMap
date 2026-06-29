import { useState, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';
import { Plus, GripVertical, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'pendiente', title: 'Pendiente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-500/20' },
  { id: 'progreso', title: 'En Progreso', icon: AlertCircle, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-500/20' },
  { id: 'completado', title: 'Completado', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-500/20' }
];

export function WorkKanbanBoard() {
  const user = useWorkStore(state => state.user);
  const tareas = useWorkStore(state => state.tareas);
  const addTarea = useWorkStore(state => state.addTarea);
  const updateTareaEstado = useWorkStore(state => state.updateTareaEstado);

  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const misTareas = tareas.filter(t => t.canal === user?.departamento || t.canal === 'GENERAL');

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!user?.departamento) return;
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    fetch(`${baseUrl}/api/work/tareas?canal=${user.departamento}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.forEach(t => addTarea(t));
        }
      })
      .catch(console.error);
  }, [user, addTarea]);

  const handleDrop = (e, columnId) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Update locally
    updateTareaEstado(taskId, columnId);

    // Broadcast P2P
    WebRTCEngine.broadcast(PROTOCOL.WORK_TASK_MOVE, { id: taskId, estado: columnId });
    
    // Guardar en DB
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    fetch(`${baseUrl}/api/work/tareas/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: columnId })
    }).catch(console.error);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    const nuevaTarea = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      titulo: newTaskTitle,
      descripcion: newTaskDesc,
      asignado_a: user?.nombre,
      estado: 'pendiente',
      canal: user?.departamento,
      timestamp: Date.now()
    };

    addTarea(nuevaTarea);
    WebRTCEngine.broadcast(PROTOCOL.WORK_TASK_CREATE, nuevaTarea);
    
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    fetch(`${baseUrl}/api/work/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaTarea)
    }).catch(console.error);

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsCreating(false);
  };

  return (
    <div className="h-full flex flex-col p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white font-mono">Tabla de Tareas</h2>
          <p className="text-xs text-zinc-400 mt-1">Sincronizado vía P2P - {user?.departamento}</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva Tarea
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateTask} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-3">
          <input 
            autoFocus
            type="text" 
            placeholder="Título de la tarea" 
            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
          />
          <textarea 
            placeholder="Descripción (opcional)" 
            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[60px]"
            value={newTaskDesc}
            onChange={e => setNewTaskDesc(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-bold">Guardar y Sincronizar</button>
          </div>
        </form>
      )}

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto min-h-0 pb-4">
        {KANBAN_COLUMNS.map(col => (
          <div 
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col bg-black/40 rounded-xl border border-white/5 overflow-hidden"
          >
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${col.bg}`}>
              <col.icon className={`h-4 w-4 ${col.color}`} />
              <span className={`font-mono text-sm font-semibold text-white`}>{col.title}</span>
              <span className="ml-auto text-[10px] bg-black/50 px-2 py-0.5 rounded-full text-zinc-400">
                {misTareas.filter(t => t.estado === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {misTareas.filter(t => t.estado === col.id).map(tarea => (
                <div 
                  key={tarea.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tarea.id)}
                  className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <div className="flex gap-2 items-start">
                    <GripVertical className="h-4 w-4 text-zinc-600 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div>
                      <h4 className="text-sm text-zinc-100 font-medium">{tarea.titulo}</h4>
                      {tarea.descripcion && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{tarea.descripcion}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-900/30 px-2 py-0.5 rounded">
                          {tarea.asignado_a}
                        </span>
                        <span className="text-[9px] text-zinc-600">
                          {new Date(tarea.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {misTareas.filter(t => t.estado === col.id).length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-lg">
                  <span className="text-[11px] text-zinc-600 font-mono">Arrastra tareas aquí</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
