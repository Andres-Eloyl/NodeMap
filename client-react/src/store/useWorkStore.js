import { create } from 'zustand';

export const useWorkStore = create((set, get) => ({
  user: JSON.parse(sessionStorage.getItem('work_user')) || null,
  channelMessages: [],
  privateMessages: [],
  reports: [],
  networkStatus: [],
  activeWorkTab: 'channel',
  unreadCounts: { channel: 0, global: 0, private: 0 },

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
    return { privateMessages: [...state.privateMessages, msg].sort((a,b) => a.timestamp - b.timestamp) };
  }),

  upsertReport: (report) => set((state) => {
    const exists = state.reports.findIndex(r => r.id === report.id || r.id === report.reporte_id);
    if (exists >= 0) {
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
    }
    return { networkStatus: newStatus };
  }),
  
  logout: () => {
    sessionStorage.removeItem('work_user');
    set({ 
      user: null, channelMessages: [], privateMessages: [], reports: [], networkStatus: [],
      unreadCounts: { channel: 0, global: 0, private: 0 }, activeWorkTab: 'channel'
    });
  }
}));
