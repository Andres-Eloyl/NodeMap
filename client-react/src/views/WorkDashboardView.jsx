import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkStore } from '../store/useWorkStore';
import { WorkChannels } from '../components/Work/WorkChannels';
import { WorkReports } from '../components/Work/WorkReports';
import { WorkMap } from '../components/Work/WorkMap';
import { WorkAdminPanel } from '../components/Work/WorkAdminPanel';
import { WorkTopology } from '../components/Work/WorkTopology';
import { WebRTCEngine } from '../services/webrtc';
import PROTOCOL from '../shared/protocol';

export function WorkDashboardView() {
  const user = useWorkStore(state => state.user);
  const logout = useWorkStore(state => state.logout);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('channel');

  useEffect(() => {
    if (!user) {
      navigate('/work/login');
    } else {
      // Connect to WebRTC as a Work User if not connected
      if (!useWorkStore.getState().networkStatus.find(s => s.id === WebRTCEngine.getMyId())) {
        WebRTCEngine.conectar(user.nombre, 'Work', '#ffffff', 0); // Temporary profile
        
        setTimeout(() => {
            const status = {
                id: WebRTCEngine.getMyId(),
                nombre: user.nombre,
                departamento: user.departamento,
                estado: 'activo',
                timestamp: Date.now()
            };
            WebRTCEngine.broadcast(PROTOCOL.WORK_STATUS, status);
            useWorkStore.getState().updateStatus(status);
        }, 1000);
      }
    }
  }, [user, navigate]);

  if (!user) return null;
  const currentChannel = `general-${user.departamento.toLowerCase().substring(0,3)}`;

  return (
    <div className="min-h-screen w-full flex bg-[#05050a] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-black/60 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-logo font-bold tracking-widest text-blue-400">NodeMap Work</h2>
          <div className="text-xs text-white/50 mt-2 font-mono">
            {user.nombre} <br/>
            <span className="text-white/30 uppercase">{user.rol} | {user.departamento}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-mono text-white/40 mb-4 mt-2">CANALES</div>
          <button 
            onClick={() => setActiveTab('channel')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'channel' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            # {currentChannel}
          </button>
          
          <div className="text-xs font-mono text-white/40 mb-4 mt-8">HERRAMIENTAS</div>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'reports' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            Ver Incidentes
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'map' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            Mapa Corporativo
          </button>
          
          {user.rol === 'Administrador' && (
            <>
              <div className="text-xs font-mono text-white/40 mb-4 mt-8">ADMINISTRACIÓN</div>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'admin' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
                Panel Técnico
              </button>
              <button 
                onClick={() => setActiveTab('topology')}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'topology' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
                Topología D3.js
              </button>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => { logout(); navigate('/work/login'); }} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">logout</span> Salir
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40">
          <h3 className="font-bold text-lg">
            {activeTab === 'channel' ? `# ${currentChannel}` : 
             activeTab === 'reports' ? 'Gestión de Reportes' :
             activeTab === 'map' ? 'Mapa de Instalaciones' :
             activeTab === 'admin' ? 'Panel de Administración' : 'Topología D3'}
          </h3>
        </header>
        
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-black to-[#080810]">
          {activeTab === 'channel' && <WorkChannels currentChannel={currentChannel} />}
          {activeTab === 'reports' && <WorkReports />}
          {activeTab === 'map' && <WorkMap />}
          {activeTab === 'admin' && <WorkAdminPanel />}
          {activeTab === 'topology' && <WorkTopology />}
        </div>
      </div>
    </div>
  );
}
