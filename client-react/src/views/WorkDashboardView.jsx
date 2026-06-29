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

import {
  Globe2,
  LogOut,
  Hash,
  MessageSquare,
  FileWarning,
  Map as MapIcon,
  Users,
  Siren,
  Cpu,
  Network,
  ChevronDown
} from "lucide-react";

function NavGroup({ title, children }) {
  return (
    <div>
      <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}) {
  const isAmber = item.tone === "amber";
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={[
        "group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-all border",
        active
          ? "bg-sky-500/10 text-white border-sky-400/30 shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]"
          : "border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03] hover:border-white/5",
        isAmber && !active && "text-amber-300/90 hover:text-amber-200",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon ? (
        <Icon className={`h-3.5 w-3.5 ${isAmber ? "text-amber-400" : ""}`} />
      ) : (
        <Hash className="h-3.5 w-3.5 text-zinc-500" />
      )}
      <span className="flex-1 text-left truncate">{item.label.replace(/^# /, "")}</span>
      {item.badge ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

function SleekSelect({ label, options, dotClass, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/5 hover:border-sky-400/30 transition-colors flex flex-col"
      >
        <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {dotClass && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
            <span className="text-[11px] text-zinc-200 truncate">{value}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full rounded-md border border-white/10 bg-[#09090b] shadow-xl z-50 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkDashboardView() {
  const user = useWorkStore(state => state.user);
  const logout = useWorkStore(state => state.logout);
  const navigate = useNavigate();
  const activeTab = useWorkStore(state => state.activeWorkTab);
  const setActiveTab = useWorkStore(state => state.setActiveWorkTab);
  const unreadCounts = useWorkStore(state => state.unreadCounts);
  
  const [myStatus, setMyStatus] = useState('Activo');
  const [myLocation, setMyLocation] = useState('Room A');

  const updateStatus = (estado) => {
    setMyStatus(estado);
    const msg = { id: WebRTCEngine.getMyId(), nombre: user?.nombre, estado, timestamp: Date.now() };
    WebRTCEngine.broadcast(PROTOCOL.WORK_STATUS, msg);
    useWorkStore.getState().updateStatus(msg);
  };

  const updateLocation = (ubicacion) => {
    setMyLocation(ubicacion);
    const msg = { id: WebRTCEngine.getMyId(), nombre: user?.nombre, departamento: user?.departamento, ubicacion, timestamp: Date.now() };
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
                estado: 'Activo',
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

  // Construct items
  const isManager = user.rol === 'Gerente' || user.rol === 'Administrador';
  const isAdmin = user.rol === 'Administrador';

  const channelsList = (isAdmin ? ['Tecnología', 'Operaciones', 'Recursos Humanos', 'Dirección', 'Finanzas'] : [user.departamento]).map(dept => {
    const key = `general-${dept.toLowerCase().substring(0,3)}`;
    const isCurrentChannel = (activeTab === key || (activeTab === 'channel' && currentChannel === key));
    let badge = 0;
    if (unreadCounts.channel > 0 && !isCurrentChannel && currentChannel === key) badge = unreadCounts.channel;
    return { key, label: `# ${key}`.replace('# general-', '# gen-'), badge };
  });

  channelsList.push({ key: 'global', label: '# global-empresa', badge: unreadCounts.global });
  channelsList.push({ key: 'private', label: 'Mensajes Privados', icon: MessageSquare, badge: unreadCounts.private });

  const toolsList = [
    { key: 'reports', label: 'Gestión de Reportes', icon: FileWarning }
  ];

  const managementList = isManager ? [
    { key: 'map', label: 'Mapa de Instalaciones', icon: MapIcon },
    { key: 'team', label: 'Lista de Equipo', icon: Users },
    { key: 'alert', label: 'Enviar Alerta', icon: Siren, tone: 'amber' },
  ] : [];

  const adminList = isAdmin ? [
    { key: 'admin', label: 'Panel Técnico', icon: Cpu },
    { key: 'topology', label: 'Topología de Red', icon: Network },
  ] : [];

  const handleSelect = (item) => {
    if (item.key === 'alert') {
      sendAlert();
    } else if (item.key === 'channel' || item.key.startsWith('general-')) {
      setActiveTab(item.key);
    } else {
      setActiveTab(item.key);
    }
  };

  const getTopTitle = () => {
    if (activeTab === 'channel') return `# ${currentChannel}`;
    if (activeTab.startsWith('general-')) return `# ${activeTab}`;
    if (activeTab === 'global') return '# global-empresa';
    if (activeTab === 'private') return 'Mensajes Privados';
    if (activeTab === 'team') return 'Lista de Equipo';
    if (activeTab === 'reports') return 'Gestión de Reportes';
    if (activeTab === 'map') return 'Mapa de Instalaciones';
    if (activeTab === 'admin') return 'Panel Técnico';
    if (activeTab === 'topology') return 'Topología de Red P2P';
    return activeTab;
  };

  const initials = user.nombre.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#05050a] text-zinc-200 font-sans antialiased selection:bg-sky-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/5 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-blue-700/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-xl">
          {/* Logo */}
          <div className="px-5 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-md bg-sky-500/40 blur-md" />
                <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                  <Globe2 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="text-[13px] font-semibold tracking-wide text-white">
                  NodeMap <span className="text-sky-400">Works</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  P2P · v0.4.1
                </div>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/70 to-blue-800/70 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#05050a] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.nombre}</div>
                <div className="mt-1 flex gap-1.5">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-sky-400/30 text-sky-300 bg-sky-400/5">
                    {user.rol}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-white/[0.02]">
                    {user.departamento.substring(0,3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status controls */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SleekSelect
                label="Status"
                options={["Activo", "En reunión", "Ocupado"]}
                value={myStatus}
                onChange={updateStatus}
                dotClass="bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
              />
              <SleekSelect 
                label="Ubicación" 
                options={["Room A", "Room B", "Remoto"]} 
                value={myLocation}
                onChange={updateLocation}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
            <NavGroup title="Canales">
              {channelsList.map((c) => (
                <NavLink key={c.key} item={c} active={activeTab === c.key || (activeTab === 'channel' && currentChannel === c.key)} onClick={() => handleSelect(c)} />
              ))}
            </NavGroup>

            <NavGroup title="Herramientas">
              {toolsList.map((c) => (
                <NavLink key={c.key} item={c} active={activeTab === c.key} onClick={() => handleSelect(c)} />
              ))}
            </NavGroup>

            {managementList.length > 0 && (
              <NavGroup title="Gestión · Manager">
                {managementList.map((c) => (
                  <NavLink key={c.key} item={c} active={activeTab === c.key} onClick={() => handleSelect(c)} />
                ))}
              </NavGroup>
            )}

            {adminList.length > 0 && (
              <NavGroup title="Administración · Admin">
                {adminList.map((c) => (
                  <NavLink key={c.key} item={c} active={activeTab === c.key} onClick={() => handleSelect(c)} />
                ))}
              </NavGroup>
            )}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/5">
            <button onClick={() => { logout(); navigate('/work/login'); }} className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-rose-300 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all">
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white tracking-wide">{getTopTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">P2P Connected</span>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 relative overflow-hidden">
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
        </main>
      </div>
    </div>
  );
}
