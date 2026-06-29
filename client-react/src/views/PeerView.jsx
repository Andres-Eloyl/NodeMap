import { useState } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { 
  Map as MapIcon, 
  Users, 
  MessageSquare, 
  MessagesSquare, 
  Gamepad2, 
  LogOut, 
  Star, 
  ArrowRight, 
  Globe2, 
  Lock,
  School,
  Microscope,
  Briefcase
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { ChatView } from './ChatView';
import { MapView } from './MapView';
import { GamesView } from './GamesView';
import { UsersView } from './UsersView';
import { ForumView } from './ForumView';
import { TriviaModal } from '../components/Games/TriviaModal';
import SoundEngine from '../services/SoundEngine';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { key: "map", label: "Mapa", icon: MapIcon },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "forum", label: "Social", icon: MessagesSquare },
  { key: "games", label: "Juegos", icon: Gamepad2 },
];

/* ------------------------------- LOGIN ---------------------------------- */

function LoginScreen() {
  const connect = useWebRTCStore(state => state.connect);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Zona A');

  const handleNext = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) return;
    setStep(2);
  };

  const handleLogin = (e, selectedZone) => {
    if (e) e.preventDefault();
    SoundEngine.init();
    const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    connect(name, selectedZone || zone, color, name.charAt(0).toUpperCase());
  };

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16 text-white">
      {step === 1 && (
        <form
          onSubmit={handleNext}
          className="animate-fade-in-up w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10"
          style={{
            backdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30"
              style={{
                background: "rgba(249,115,22,0.08)",
                boxShadow: "inset 0 0 24px rgba(249,115,22,0.25), 0 0 24px rgba(249,115,22,0.2)",
              }}
            >
              <Globe2 className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
            </div>
            <h1 className="font-logo text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="text-white/80">Node</span>
              <span
                className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent"
                style={{ filter: "drop-shadow(0 0 18px rgba(249,115,22,0.45))" }}
              >
                Map
              </span>
            </h1>
            <p className="mt-3 font-mono text-[10px] tracking-[0.35em] text-white/50">
              CONSUMER · RED DESCENTRALIZADA
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <label
              htmlFor="username"
              className="font-mono text-[10px] uppercase tracking-widest text-white/50"
            >
              Nombre o Alias
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="@tu_nodo"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-orange-500/20"
                autoFocus
                required
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            </div>
          </div>

          <button
            type="submit"
            disabled={name.trim().length < 3}
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[#05050a] transition-all duration-300 hover:bg-orange-400 hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-orange-500 disabled:hover:shadow-none"
          >
            <span>Continuar</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="mt-6 flex items-center justify-end font-mono text-[10px] tracking-widest text-white/40">
            <Link to="/" className="hover:text-orange-400 transition-colors">
              ← VOLVER
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="animate-fade-in-up w-full max-w-4xl text-center">
            <h2 className="font-logo text-[28px] font-bold text-orange-400 tracking-tight">Elige tu zona</h2>
            <p className="font-mono text-[13px] text-white/60 mt-2">Selecciona dónde te encuentras</p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full py-8">
                
                <button onClick={(e) => handleLogin(e, 'Zona A')} className="w-full md:w-1/3 h-44 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-orange-500/50 hover:bg-white/[0.05] transition-all">
                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors duration-300"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                        <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-1 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors duration-300 shadow-[inset_0_0_15px_rgba(249,115,22,0.2)]">
                            <School className="text-orange-400" size={24} />
                        </div>
                        <span className="font-bold text-lg text-white">Zona A</span>
                        <span className="font-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Aulas</span>
                    </div>
                </button>

                <button onClick={(e) => handleLogin(e, 'Zona B')} className="w-full md:w-1/3 h-44 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-blue-500/50 hover:bg-white/[0.05] transition-all">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-300"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                        <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-1 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors duration-300 shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]">
                            <Microscope className="text-blue-400" size={24} />
                        </div>
                        <span className="font-bold text-lg text-white">Zona B</span>
                        <span className="font-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Laboratorios</span>
                    </div>
                </button>

                <button onClick={(e) => handleLogin(e, 'Zona C')} className="w-full md:w-1/3 h-44 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-purple-500/50 hover:bg-white/[0.05] transition-all">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-300"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                        <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-1 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors duration-300 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]">
                            <Briefcase className="text-purple-400" size={24} />
                        </div>
                        <span className="font-bold text-lg text-white">Zona C</span>
                        <span className="font-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Oficinas</span>
                    </div>
                </button>

            </div>
            
            <button type="button" onClick={() => setStep(1)} className="text-white/50 hover:text-orange-400 font-mono text-xs uppercase tracking-widest transition-colors">
              ← Volver
            </button>
        </div>
      )}
    </main>
  );
}

/* -------------------------------- TOP BAR ------------------------------- */

function TopBar({ username, onLogout, myPoints }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(5,5,10,0.6)",
      }}
    >
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/30 shadow-[inset_0_0_16px_rgba(249,115,22,0.25)] bg-orange-500/10"
          >
            <Globe2 className="h-4 w-4 text-orange-400" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <div className="font-logo text-base font-bold tracking-tight">
              <span className="text-white/80">Node</span>
              <span className="text-orange-400">Map</span>
            </div>
            <div className="font-mono text-[9px] tracking-widest text-white/50">
              @{username || "usuario"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PointsBadge points={myPoints} />
          <button
            type="button"
            onClick={onLogout}
            className="group flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 font-mono text-[10px] uppercase tracking-widest text-white/50 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            aria-label="Salir"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function PointsBadge({ points }) {
  return (
    <div
      className="flex h-9 items-center gap-1.5 rounded-lg border border-yellow-400/30 px-3 shadow-[inset_0_0_14px_rgba(250,204,21,0.18),0_0_18px_rgba(250,204,21,0.12)]"
      style={{
        background: "linear-gradient(135deg, rgba(250,204,21,0.10) 0%, rgba(249,115,22,0.08) 100%)",
      }}
    >
      <Star
        className="h-3.5 w-3.5 text-yellow-300"
        fill="currentColor"
        strokeWidth={1.5}
      />
      <span className="font-mono text-xs font-semibold text-yellow-100">
        {points} <span className="text-yellow-300/70">pts</span>
      </span>
    </div>
  );
}

/* -------------------------------- TABS ---------------------------------- */

function DesktopTabs({ activeTab, setActiveTab }) {
  return (
    <nav
      className="sticky top-16 z-20 hidden border-b border-white/5 md:block"
      style={{
        backdropFilter: "blur(16px)",
        background: "rgba(5,5,10,0.5)",
      }}
    >
      <div className="flex items-center justify-center gap-1 px-6">
        {TABS.map((t) => (
          <TabButton
            key={t.key}
            tab={t}
            active={activeTab === t.key}
            onClick={() => { setActiveTab(t.key); SoundEngine.playPop(); }}
            variant="desktop"
          />
        ))}
      </div>
    </nav>
  );
}

function MobileTabs({ activeTab, setActiveTab }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 md:hidden"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(5,5,10,0.75)",
      }}
    >
      <div className="grid grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <TabButton
            key={t.key}
            tab={t}
            active={activeTab === t.key}
            onClick={() => { setActiveTab(t.key); SoundEngine.playPop(); }}
            variant="mobile"
          />
        ))}
      </div>
    </nav>
  );
}

function TabButton({ tab, active, onClick, variant }) {
  const Icon = tab.icon;

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
          active ? "text-orange-400" : "text-white/40 hover:text-white"
        }`}
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={active ? 2 : 1.5}
          style={active ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" } : undefined}
        />
        <span className="font-mono text-[9px] uppercase tracking-wider">{tab.label}</span>
        {active && (
          <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-6 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors ${
        active ? "text-orange-400" : "text-white/40 hover:text-white"
      }`}
    >
      <Icon
        className="h-4 w-4"
        strokeWidth={active ? 2 : 1.5}
        style={active ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" } : undefined}
      />
      <span>{tab.label}</span>
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
      )}
    </button>
  );
}

/* ------------------------------- MODALS --------------------------------- */

function GlobalToasts() {
  const toasts = useWebRTCStore(state => state.toasts);
  
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} onClick={t.onClick} className={cn("glass-panel bg-[#05050a]/90 text-white px-4 py-3 shadow-xl flex items-center gap-3 animate-fade-in border-l-4 pointer-events-auto rounded-lg", t.type === 'private' ? 'border-[#ce93d8]' : (t.type === 'global' ? 'border-orange-500' : 'border-blue-500'), t.onClick && "cursor-pointer hover:bg-white/5")}>
          <div className="text-[13px] leading-tight font-bold">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

function BroadcastModal() {
  const broadcast = useWebRTCStore(state => state.broadcast);
  
  if (!broadcast) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#05050a]/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel p-8 max-w-md w-full text-center border-red-500/50 shadow-[0_0_50px_rgba(255,0,0,0.2)] rounded-2xl bg-[#05050a]">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4 animate-pulse">campaign</span>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest font-logo">Aviso del Organizador</h2>
        <p className="text-xl text-red-200 mt-4 leading-relaxed font-mono">{broadcast}</p>
      </div>
    </div>
  );
}

/* ----------------------------- MAIN VIEW -------------------------------- */

export function PeerView() {
  const activeTab = useWebRTCStore(state => state.activeTab);
  const setActiveTab = useWebRTCStore(state => state.setActiveTab);
  const isConnected = useWebRTCStore(state => state.isConnected);
  const disconnect = useWebRTCStore(state => state.disconnect);
  const myPoints = useWebRTCStore(state => state.myPoints);
  const myName = useWebRTCStore(state => state.myName);

  if (!isConnected) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-transparent">
        <LoginScreen />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent flex flex-col text-white">
      <GlobalToasts />
      <BroadcastModal />
      <TriviaModal />

      <TopBar 
        username={myName} 
        myPoints={myPoints}
        onLogout={() => { if(confirm('¿Salir de NodeMap?')) disconnect(); }} 
      />

      <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 relative pb-16 md:pb-0">
        <div className="absolute inset-0 max-w-[1400px] mx-auto p-4 md:p-6 pb-20 overflow-hidden">
          <div className={cn("absolute inset-0 p-4 md:p-6 transition-opacity duration-300 overflow-hidden", activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
            <MapView />
          </div>
          <div className={cn("absolute inset-0 p-4 md:p-6 transition-opacity duration-300 overflow-hidden", activeTab === 'users' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
            <UsersView />
          </div>
          <div className={cn("absolute inset-0 p-4 md:p-6 transition-opacity duration-300 overflow-hidden", activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
            <ChatView />
          </div>
          <div className={cn("absolute inset-0 p-4 md:p-6 transition-opacity duration-300 overflow-hidden", activeTab === 'forum' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
            <ForumView />
          </div>
          <div className={cn("absolute inset-0 p-4 md:p-6 transition-opacity duration-300 overflow-hidden", activeTab === 'games' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
            <GamesView />
          </div>
        </div>
      </main>

      <MobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
