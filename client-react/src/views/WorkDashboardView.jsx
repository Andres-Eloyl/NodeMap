import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkStore } from '../store/useWorkStore';
import { WorkChannels } from '../components/Work/WorkChannels';
import { WorkReports } from '../components/Work/WorkReports';
import { WorkMap } from '../components/Work/WorkMap';
import { WorkAdminPanel } from '../components/Work/WorkAdminPanel';
import { WorkTopology } from '../components/Work/WorkTopology';
import { WorkPrivateMessages } from '../components/Work/WorkPrivateMessages';
import { WorkTeamList } from '../components/Work/WorkTeamList';
import { WebRTCEngine } from '../services/webrtc';
import PROTOCOL from '../shared/protocol';

export function WorkDashboardView() {
  const user = useWorkStore(state => state.user);
  const logout = useWorkStore(state => state.logout);
  const navigate = useNavigate();
  const activeTab = useWorkStore(state => state.activeWorkTab);
  const setActiveTab = useWorkStore(state => state.setActiveWorkTab);
  const unreadCounts = useWorkStore(state => state.unreadCounts);
  const [myStatus, setMyStatus] = useState('activo');
  const [myLocation, setMyLocation] = useState('Oficina');

  const updateStatus = (estado) => {
    setMyStatus(estado);
    const msg = { id: WebRTCEngine.getMyId(), nombre: user.nombre, estado, timestamp: Date.now() };
    WebRTCEngine.broadcast(PROTOCOL.WORK_STATUS, msg);
    useWorkStore.getState().updateStatus(msg);
  };

  const updateLocation = (ubicacion) => {
    setMyLocation(ubicacion);
    const msg = { id: WebRTCEngine.getMyId(), nombre: user.nombre, departamento: user.departamento, ubicacion, timestamp: Date.now() };
    WebRTCEngine.broadcast(PROTOCOL.WORK_POSITION, msg);
    useWorkStore.getState().updateStatus(msg);
  };

  const sendAlert = () => {
    const text = window.prompt("Escribe la alerta para tu departamento:");
    if (!text) return;
    const msg = {
      id: Date.now().toString(),
      nombre: user.nombre,
      departamento: user.departamento,
      canal: `general-${user.departamento.toLowerCase().substring(0,3)}`,
      texto: `[ALERTA DE GERENCIA]: ${text}`,
      timestamp: Date.now(),
      senderId: WebRTCEngine.getMyId()
    };
    WebRTCEngine.broadcast(PROTOCOL.WORK_CHANNEL_MSG, msg);
    useWorkStore.getState().addChannelMessage(msg);
    setActiveTab('channel');
  };

  useEffect(() => {
    if (!user) {
      navigate('/work/login');
    } else {
      if (!useWorkStore.getState().networkStatus.find(s => s.id === WebRTCEngine.getMyId())) {
        WebRTCEngine.conectar(user.nombre, 'Work', '#ffffff', 0);
        
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
      <div className="w-64 bg-black/60 border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-logo font-bold tracking-widest text-blue-400">NodeMap Work</h2>
          <div className="text-xs text-white/50 mt-2 font-mono">
            {user.nombre} <br/>
            <span className="text-white/30 uppercase">{user.rol} | {user.departamento}</span>
          </div>
          <div className="mt-4 space-y-2">
            <select value={myStatus} onChange={(e) => updateStatus(e.target.value)} className="w-full bg-white/5 border border-white/10 text-xs p-1 text-white outline-none focus:border-blue-500">
              <option value="activo">Activo</option>
              <option value="en-reunion">En reunión</option>
              <option value="ocupado">Ocupado</option>
            </select>
            <input type="text" value={myLocation} onBlur={(e) => updateLocation(e.target.value)} onChange={(e) => setMyLocation(e.target.value)} placeholder="Ubicación (ej: Sala A)" className="w-full bg-white/5 border border-white/10 text-xs p-1 text-white outline-none focus:border-blue-500 placeholder:text-white/30" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-mono text-white/40 mb-4 mt-2">CANALES</div>
          
          {(user.rol === 'Administrador' ? ['Tecnología', 'Operaciones', 'Recursos Humanos', 'Dirección', 'Finanzas'] : [user.departamento]).map(dept => {
            const chanName = `general-${dept.toLowerCase().substring(0,3)}`;
            return (
              <button 
                key={chanName}
                onClick={() => setActiveTab(chanName)}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors flex justify-between items-center ${activeTab === chanName || (activeTab === 'channel' && currentChannel === chanName) ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
                <span># {chanName}</span>
                {unreadCounts.channel > 0 && activeTab !== chanName && currentChannel === chanName && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCounts.channel}</span>}
              </button>
            )
          })}

          <button 
            onClick={() => setActiveTab('global')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors flex justify-between items-center ${activeTab === 'global' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            <span># global-empresa</span>
            {unreadCounts.global > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCounts.global}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('private')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors flex justify-between items-center ${activeTab === 'private' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            <span>Mensajes Privados</span>
            {unreadCounts.private > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCounts.private}</span>}
          </button>
          
          <div className="text-xs font-mono text-white/40 mb-4 mt-8">HERRAMIENTAS</div>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'reports' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
            Ver Incidentes
          </button>
          
          {(user.rol === 'Gerente' || user.rol === 'Administrador') && (
            <>
              <div className="text-xs font-mono text-white/40 mb-4 mt-8">GESTIÓN</div>
              <button 
                onClick={() => setActiveTab('map')}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'map' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
                Mapa de Instalaciones
              </button>
              <button 
                onClick={() => setActiveTab('team')}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors ${activeTab === 'team' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'hover:bg-white/5 text-white/70 border-transparent'}`}>
                Lista de Equipo
              </button>
              <button 
                onClick={sendAlert}
                className="w-full text-left px-4 py-2 text-sm font-bold border-l-2 border-transparent text-yellow-500 hover:bg-yellow-500/20 transition-colors">
                Enviar Alerta
              </button>
            </>
          )}

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
              <button 
                onClick={() => {}}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors hover:bg-white/5 text-white/30 border-transparent cursor-not-allowed`} title="Fuera del alcance del prototipo">
                Gestión de Roles
              </button>
              <button 
                onClick={() => {}}
                className={`w-full text-left px-4 py-2 text-sm font-bold border-l-2 transition-colors hover:bg-white/5 text-white/30 border-transparent cursor-not-allowed`} title="Fuera del alcance del prototipo">
                Configuración
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

      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-16 border-b border-white/5 flex items-center px-6 bg-black/40">
          <h3 className="font-bold text-lg">
            {activeTab === 'channel' ? `# ${currentChannel}` : 
             activeTab.startsWith('general-') ? `# ${activeTab}` :
             activeTab === 'global' ? '# global-empresa' :
             activeTab === 'private' ? 'Mensajes Privados' :
             activeTab === 'team' ? 'Lista de Equipo' :
             activeTab === 'reports' ? 'Gestión de Reportes' :
             activeTab === 'map' ? 'Mapa de Instalaciones' :
             activeTab === 'admin' ? 'Panel de Administración' :
             activeTab === 'topology' ? 'Topología de Red P2P' : activeTab}
          </h3>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {(activeTab === 'channel' || activeTab.startsWith('general-')) && (
            <WorkChannels currentChannel={activeTab === 'channel' ? currentChannel : activeTab} />
          )}
          {activeTab === 'global' && <WorkChannels currentChannel="global-empresa" />}
          {activeTab === 'private' && <WorkPrivateMessages />}
          {activeTab === 'team' && <WorkTeamList />}
          {activeTab === 'reports' && <WorkReports />}
          {activeTab === 'map' && <WorkMap />}
          {activeTab === 'admin' && <WorkAdminPanel />}
          {activeTab === 'topology' && <WorkTopology />}
        </div>
      </div>
    </div>
  );
}
