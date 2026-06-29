import { useState, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';
import { Calendar as CalendarIcon, Plus, Clock, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export function WorkCalendar() {
  const user = useWorkStore(state => state.user);
  const calendario = useWorkStore(state => state.calendario);
  const addCalendarioEvento = useWorkStore(state => state.addCalendarioEvento);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Estados para el calendario de la izquierda
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null); // null = mostrar todos

  // Fetch inicial desde SQLite
  useEffect(() => {
    if (!user?.departamento) return;
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    fetch(`${baseUrl}/api/work/calendario?departamento=${user.departamento}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.forEach(e => addCalendarioEvento(e));
        }
      })
      .catch(console.error);
  }, [user, addCalendarioEvento]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle || !newDate || !newTime) return;

    const fecha_inicio = new Date(`${newDate}T${newTime}`).toISOString();
    
    // Asumimos 1 hora de duración
    const fin = new Date(`${newDate}T${newTime}`);
    fin.setHours(fin.getHours() + 1);
    const fecha_fin = fin.toISOString();

    const nuevoEvento = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      titulo: newTitle,
      descripcion: newDesc,
      departamento: user?.departamento,
      fecha_inicio,
      fecha_fin,
      creador: user?.nombre
    };

    // Guardar localmente
    addCalendarioEvento(nuevoEvento);

    // Broadcast P2P
    WebRTCEngine.broadcast(PROTOCOL.WORK_EVENT_CREATE, nuevoEvento);

    // Guardar en DB
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    fetch(`${baseUrl}/api/work/calendario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoEvento)
    }).catch(console.error);

    // Reset
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setNewTime('');
    setIsCreating(false);
  };

  // ---------------- LÓGICA DEL CALENDARIO (GRID) ----------------
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Hacer que Lunes sea 0 y Domingo 6
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Filtrar eventos de mi departamento
  const eventosDepto = calendario.filter(e => e.departamento === user?.departamento || e.departamento === 'ALL');

  // Funciones de ayuda para comparar fechas sin la hora
  const isSameDay = (d1, d2) => 
    d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  // Filtrar la agenda de la derecha según la selección del calendario
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  
  const misEventosAgenda = eventosDepto.filter(e => {
    const d = new Date(e.fecha_inicio);
    if (selectedDate) return isSameDay(d, selectedDate);
    // Si no hay seleccion, mostrar del dia actual en adelante
    return d >= hoy;
  });

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-5 w-full">
      
      {/* LADO IZQUIERDO: CALENDARIO GRID */}
      <div className="md:w-[560px] flex flex-col shrink-0">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-lg">
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white capitalize">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3 text-center">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <div key={d} className="text-sm font-bold text-zinc-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((date, i) => {
              if (!date) return <div key={i} className="p-2" />;
              
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              
              // Ver si este dia tiene algun evento de mi depto
              const hasEvent = eventosDepto.some(e => isSameDay(new Date(e.fecha_inicio), date));

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : date)} // toggle
                  className={`
                    relative py-4 px-3 rounded-xl text-lg font-medium transition-all hover:bg-white/10
                    ${isSelected ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'text-zinc-300'}
                    ${isToday && !isSelected ? 'text-indigo-400 font-bold border border-indigo-500/30' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasEvent && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
             <button 
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-sm transition-colors shadow-lg"
              >
                <Plus className="h-4 w-4" /> Nuevo Evento
              </button>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Mostrar todos los próximos eventos
                </button>
              )}
          </div>
        </div>
      </div>

      {/* LADO DERECHO: AGENDA Y FORMULARIO */}
      <div className="flex-1 flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl p-5">
        
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <CalendarIcon className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-white">
            {selectedDate ? `Eventos: ${selectedDate.toLocaleDateString('es-ES')}` : 'Próximos Eventos'}
          </h2>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="bg-black/40 border border-indigo-500/30 rounded-xl p-5 mb-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-indigo-300">Detalles del Evento</h3>
              <button type="button" onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            
            <input 
              required autoFocus
              type="text" 
              placeholder="Título de la reunión / evento" 
              className="bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                required
                type="date"
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
              <input 
                required
                type="time" 
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
              />
            </div>

            <textarea 
              placeholder="Descripción u orden del día (opcional)" 
              className="bg-black/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors min-h-[80px]"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
            
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
                Guardar y Sincronizar
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {misEventosAgenda.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
              <CalendarIcon className="h-8 w-8 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400 font-mono">
                {selectedDate ? "No hay eventos en esta fecha." : "No hay eventos próximos agendados."}
              </p>
            </div>
          ) : (
            misEventosAgenda.map(evento => {
              const fecha = new Date(evento.fecha_inicio);
              const diaMes = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
              const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              const isToday = isSameDay(fecha, new Date());

              return (
                <div key={evento.id} className="flex group bg-black/40 hover:bg-black/60 border border-white/5 hover:border-indigo-500/30 rounded-xl overflow-hidden transition-all">
                  {/* Indicador de Fecha */}
                  <div className={`w-20 flex flex-col items-center justify-center p-3 border-r border-white/5 ${isToday ? 'bg-indigo-500/10' : 'bg-white/[0.02]'}`}>
                    <span className={`text-[10px] uppercase font-mono tracking-wider ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                      {isToday ? 'HOY' : fecha.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
                    <span className={`text-xl font-bold ${isToday ? 'text-indigo-300' : 'text-zinc-300'}`}>
                      {diaMes.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">{diaMes.split(' ')[1]}</span>
                  </div>
                  
                  {/* Contenido */}
                  <div className="flex-1 p-4 flex flex-col justify-center relative">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-base font-semibold text-zinc-100">{evento.titulo}</h4>
                      <span className="flex items-center gap-1.5 text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                        <Clock className="h-3 w-3" /> {hora}
                      </span>
                    </div>
                    
                    {evento.descripcion && (
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{evento.descripcion}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                        <Users className="h-3 w-3" /> Org: {evento.creador}
                      </div>
                      {evento.departamento === 'ALL' && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-mono">
                          <MapPin className="h-3 w-3" /> GLOBAL
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
