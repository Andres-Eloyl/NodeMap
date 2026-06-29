import { create } from 'zustand';
import { debeNotificar, mostrarNotificacion } from '../utils/notificaciones';
import { registrarEvento, registrarMensajeTrack, registrarReporteTrack } from '../utils/sesionLog';

export const useWorkStore = create((set, get) => ({
  user: JSON.parse(sessionStorage.getItem('work_user')) || null,
  channelMessages: [],
  privateMessages: [],
  reports: [],
  networkStatus: [],
  tareas: [],
  calendario: [],
  activeWorkTab: 'channel',
  unreadCounts: { channel: 0, global: 0, private: 0 },
  validTokens: ['ADMIN-TOKEN'], // Mock initial token

  addToken: (token) => set(state => ({ validTokens: [...state.validTokens, token] })),

  setActiveWorkTab: (tab) => set(state => {
    const newUnread = { ...state.unreadCounts, [tab]: 0 };
    return { activeWorkTab: tab, unreadCounts: newUnread };
  }),

  incrementUnread: (tab) => set((state) => {
    if (state.activeWorkTab === tab) return state;
    return { unreadCounts: { ...state.unreadCounts, [tab]: state.unreadCounts[tab] + 1 } };
  }),

  setUser: (user) => {
    sessionStorage.setItem('work_user', JSON.stringify(user));
    set({ user });
  },

  addChannelMessage: (msg) => set((state) => {
    if (state.channelMessages.find(m => m.id === msg.id)) return state;
    return { channelMessages: [...state.channelMessages, msg].sort((a,b) => a.timestamp - b.timestamp) };
  }),

  addPrivateMessage: (msg) => set((state) => {
    if (state.privateMessages.find(m => m.id === msg.id)) return state;
    
    // Evaluar notificación (si viene de otro peer)
    if (msg.senderId !== state.user?.id) {
      if (debeNotificar('MENSAJE_PRIVADO', { destino: state.user?.id }, state.user)) {
        mostrarNotificacion(`Nuevo mensaje de ${msg.senderName}`, { body: msg.texto });
      }
    }
    
    registrarMensajeTrack(msg.senderId);
    
    return { privateMessages: [...state.privateMessages, msg].sort((a,b) => a.timestamp - b.timestamp) };
  }),

  upsertReport: (report) => set((state) => {
    const exists = state.reports.findIndex(r => r.id === report.id || r.id === report.reporte_id);
    const isNew = exists < 0;
    
    if (isNew && report.autor_id !== state.user?.id) {
      if (debeNotificar('REPORTE_URGENTE', report, state.user)) {
        mostrarNotificacion(`🚨 Alerta: ${report.titulo}`, { body: report.descripcion });
      }
    }
    
    if (isNew) {
      registrarReporteTrack();
      registrarEvento('REPORTE_CREADO', { id: report.id, titulo: report.titulo });
    }

    if (!isNew) {
      const newReports = [...state.reports];
      newReports[exists] = { ...newReports[exists], ...report };
      return { reports: newReports.sort((a,b) => b.timestamp - a.timestamp) };
    }
    return { reports: [report, ...state.reports].sort((a,b) => b.timestamp - a.timestamp) };
  }),

  updateStatus: (statusObj) => set((state) => {
    const idx = state.networkStatus.findIndex(s => s.id === statusObj.id);
    const newStatus = [...state.networkStatus];
    if (idx >= 0) {
      newStatus[idx] = { ...newStatus[idx], ...statusObj };
    } else {
      newStatus.push(statusObj);
      registrarEvento('PEER_JOIN', { id: statusObj.id, nombre: statusObj.nombre });
    }
    return { networkStatus: newStatus };
  }),

  // KANBAN METHODS
  addTarea: (tarea) => set((state) => {
    if (state.tareas.find(t => t.id === tarea.id)) return state;
    return { tareas: [...state.tareas, tarea] };
  }),
  
  updateTareaEstado: (id, nuevoEstado) => set((state) => {
    const index = state.tareas.findIndex(t => t.id === id);
    if (index >= 0) {
      const newTareas = [...state.tareas];
      newTareas[index] = { ...newTareas[index], estado: nuevoEstado };
      return { tareas: newTareas };
    }
    return state;
  }),
  
  // CALENDAR METHODS
  addCalendarioEvento: (evento) => set((state) => {
    if (state.calendario.find(e => e.id === evento.id)) return state;
    return { calendario: [...state.calendario, evento].sort((a,b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)) };
  }),
  
  logout: () => {
    sessionStorage.removeItem('work_user');
    set({ 
      user: null, channelMessages: [], privateMessages: [], reports: [], networkStatus: [],
      unreadCounts: { channel: 0, global: 0, private: 0 }, activeWorkTab: 'channel'
    });
  }
}));
