import { useState } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { Map, MessageSquare, Gamepad2, LogOut, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
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


function LoginScreen() {
  const connect = useWebRTCStore(state => state.connect);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [zone, setZone] = useState('Zona A');

  const handleNext = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    SoundEngine.init();
    const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    connect(name, zone, color, name.charAt(0).toUpperCase());
  };

  return (
    <>
      {step === 1 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-transparent px-5 overflow-y-auto py-8" id="screen-entry">
            <div className="glass-card p-8 w-full max-w-[380px] flex flex-col gap-6 mt-[15vh] relative z-10 shadow-2xl animate-fade-in">
                
                <div className="text-center flex flex-col items-center gap-3">
                    <img src="/logo.svg" alt="NodeMap Logo" className="h-16 w-16" style={{ filter: 'drop-shadow(0 0 12px rgba(255,179,173,0.4))' }} />
                    <div>
                        <h1 className="font-logo text-[28px] font-bold text-primary tracking-tight">NodeMap</h1>
                        <p className="font-body-md text-[13px] text-on-surface-variant/70 mt-1">Red de comunicación P2P</p>
                    </div>
                </div>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent"></div>

                <form onSubmit={handleNext} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                      <label className="font-label-mono text-[11px] tracking-[0.08em] text-on-surface-variant/80 uppercase" htmlFor="nickname">Nombre o Alias</label>
                      <input 
                        autoComplete="off" 
                        className="input-field px-4 py-3 h-[48px]" 
                        id="nickname" 
                        placeholder="Introduce tu nombre o alias (min. 3 letras)" 
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        autoFocus
                      />
                  </div>
                  
                  <button type="submit" className="btn-primary w-full h-[48px] flex items-center justify-center gap-2" id="btn-enter" disabled={name.trim().length < 3}>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      Conectar a la Red
                  </button>
                </form>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-[380px] mb-4 relative z-10 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <p className="font-label-mono text-[10px] text-white/60 tracking-[0.12em] uppercase">Proyecto desarrollado por:</p>
                <div className="w-full flex flex-col">
                    <a href="https://github.com/Andres-Eloyl" target="_blank" className="flex items-center gap-3 py-2.5 px-1 text-white/70 hover:text-primary transition-colors duration-200">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        <span className="font-profile text-[13px] font-medium">Andrés López</span>
                    </a>
                    <div className="w-full h-px bg-outline-variant/20"></div>
                    <a href="https://github.com/ErasmoAlvarado" target="_blank" className="flex items-center gap-3 py-2.5 px-1 text-white/70 hover:text-secondary transition-colors duration-200">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        <span className="font-profile text-[13px] font-medium">Erasmo Alvarado</span>
                    </a>
                    <div className="w-full h-px bg-outline-variant/20"></div>
                    <a href="https://github.com/mariagtovarp" target="_blank" className="flex items-center gap-3 py-2.5 px-1 text-white/70 hover:text-tertiary transition-colors duration-200">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        <span className="font-profile text-[13px] font-medium">María Tovar</span>
                    </a>
                    <div className="w-full h-px bg-outline-variant/20"></div>
                    <a href="https://github.com" target="_blank" className="flex items-center gap-3 py-2.5 px-1 text-white/70 hover:text-primary transition-colors duration-200">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        <span className="font-profile text-[13px] font-medium">Jesús Rivas</span>
                    </a>
                </div>
            </div>
        </div>
      )}

      {step === 2 && (
        <div className="absolute inset-0 z-40 bg-transparent flex flex-col overflow-y-auto pb-8 animate-fade-in" id="screen-zone">
            <div className="px-5 flex-none text-center pt-[10vh]">
                <h2 className="font-headline-lg text-[28px] font-bold text-primary tracking-tight">Elige tu zona</h2>
                <p className="font-body-md text-[13px] text-on-surface-variant/60 mt-2">Selecciona dónde te encuentras</p>
            </div>
            
            <form onSubmit={handleLogin} className="flex-grow flex flex-col items-center w-full">
              <div className="flex-grow px-5 flex flex-col md:flex-row gap-4 justify-center items-center max-w-4xl mx-auto w-full py-8">
                  
                  <button type="submit" onClick={() => setZone('Zona A')} className="zone-btn zone-card w-full md:w-1/3 h-44 glass-card relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary-container/5 group-hover:bg-primary-container/12 transition-colors duration-300"></div>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                          <div className="w-14 h-14 bg-primary-container/10 flex items-center justify-center mb-1 group-hover:bg-primary-container/20 transition-colors duration-300">
                              <span className="material-symbols-outlined text-primary text-3xl">school</span>
                          </div>
                          <span className="font-headline-md text-lg font-semibold text-on-surface">Zona A</span>
                          <span className="font-label-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Aulas</span>
                      </div>
                  </button>

                  <button type="submit" onClick={() => setZone('Zona B')} className="zone-btn zone-card w-full md:w-1/3 h-44 glass-card relative overflow-hidden group">
                      <div className="absolute inset-0 bg-secondary-container/5 group-hover:bg-secondary-container/12 transition-colors duration-300"></div>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                          <div className="w-14 h-14 bg-secondary-container/10 flex items-center justify-center mb-1 group-hover:bg-secondary-container/20 transition-colors duration-300">
                              <span className="material-symbols-outlined text-secondary text-3xl">science</span>
                          </div>
                          <span className="font-headline-md text-lg font-semibold text-on-surface">Zona B</span>
                          <span className="font-label-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Laboratorios</span>
                      </div>
                  </button>

                  <button type="submit" onClick={() => setZone('Zona C')} className="zone-btn zone-card w-full md:w-1/3 h-44 glass-card relative overflow-hidden group">
                      <div className="absolute inset-0 bg-tertiary-container/5 group-hover:bg-tertiary-container/12 transition-colors duration-300"></div>
                      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
                          <div className="w-14 h-14 bg-tertiary-container/10 flex items-center justify-center mb-1 group-hover:bg-tertiary-container/20 transition-colors duration-300">
                              <span className="material-symbols-outlined text-tertiary text-3xl">work</span>
                          </div>
                          <span className="font-headline-md text-lg font-semibold text-on-surface">Zona C</span>
                          <span className="font-label-mono text-[11px] tracking-[0.08em] text-white/60 uppercase">Oficinas</span>
                      </div>
                  </button>

              </div>
              
              <div className="px-5 mb-8 w-full max-w-4xl text-center">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost px-6 py-2.5">
                  Volver
                </button>
              </div>
            </form>
        </div>
      )}
    </>
  );
}

function GlobalToasts() {
  const toasts = useWebRTCStore(state => state.toasts);
  
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} onClick={t.onClick} className={cn("glass-card-solid bg-surface/90 text-white px-4 py-3 shadow-xl flex items-center gap-3 animate-fade-in border-l-4 pointer-events-auto", t.type === 'private' ? 'border-[#ce93d8]' : (t.type === 'global' ? 'border-primary' : 'border-secondary'), t.onClick && "cursor-pointer hover:bg-surface")}>
          <div className="font-body-md text-[13px] leading-tight">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

function BroadcastModal() {
  const broadcast = useWebRTCStore(state => state.broadcast);
  
  if (!broadcast) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card-solid p-8 max-w-md w-full text-center border-red-500/50 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4 animate-pulse">campaign</span>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Aviso del Organizador</h2>
        <p className="text-xl text-red-200 mt-4 leading-relaxed">{broadcast}</p>
      </div>
    </div>
  );
}

export function PeerView() {
  const activeTab = useWebRTCStore(state => state.activeTab);
  const setActiveTab = useWebRTCStore(state => state.setActiveTab);
  const isConnected = useWebRTCStore(state => state.isConnected);
  const disconnect = useWebRTCStore(state => state.disconnect);
  const myPoints = useWebRTCStore(state => state.myPoints);

  if (!isConnected) {
    return <LoginScreen />;
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col md:flex-row bg-transparent" id="screen-main">
      <GlobalToasts />
      <BroadcastModal />
      <TriviaModal />

      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 flex-none z-50 order-first w-full">
          <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Logo" className="w-5 h-5" style={{ filter: 'drop-shadow(0 0 5px rgba(255,179,173,0.3))' }} />
              <span className="font-logo text-[15px] font-semibold text-primary tracking-tight">NodeMap</span>
          </div>
          <button className="text-on-surface-variant/60 p-2 hover:bg-surface-variant/30 transition-all duration-200 flex items-center justify-center" title="Modo simple">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>energy_savings_leaf</span>
          </button>
      </header>

      <aside className="w-full md:w-60 bg-surface/95 md:bg-surface/80 md:backdrop-blur-md border-t md:border-t-0 md:border-r border-outline-variant/40 flex md:flex-col z-50 flex-none order-last md:order-first">
          <header className="hidden md:flex p-6 justify-center items-center border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                  <img src="/logo.svg" alt="Logo" className="w-7 h-7" style={{ filter: 'drop-shadow(0 0 6px rgba(255,179,173,0.3))' }} />
                  <span className="font-logo text-[22px] font-bold text-primary tracking-tight">NodeMap</span>
              </div>
          </header>
          <nav className="flex-grow md:py-6 px-2 md:px-3 flex flex-row md:flex-col gap-1 justify-around md:justify-start">
              <button onClick={() => { setActiveTab('map'); SoundEngine.playPop(); }} className={cn("nav-tab nav-tab-item flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 w-full text-center md:text-left", activeTab === 'map' ? 'active' : 'text-on-surface-variant/70')}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  <span className="font-headline-md text-[10px] md:text-[13px] font-semibold">Mapa</span>
              </button>
              <button onClick={() => { setActiveTab('users'); SoundEngine.playPop(); }} className={cn("nav-tab nav-tab-item flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 w-full text-center md:text-left", activeTab === 'users' ? 'active' : 'text-on-surface-variant/70')}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                  <span className="font-headline-md text-[10px] md:text-[13px] font-semibold">Usuarios</span>
              </button>
              <button onClick={() => { setActiveTab('chat'); SoundEngine.playPop(); }} className={cn("nav-tab nav-tab-item flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 w-full text-center md:text-left", activeTab === 'chat' ? 'active' : 'text-on-surface-variant/70')}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>chat</span>
                  <span className="font-headline-md text-[10px] md:text-[13px] font-semibold">Chat</span>
              </button>
              <button onClick={() => { setActiveTab('forum'); SoundEngine.playPop(); }} className={cn("nav-tab nav-tab-item flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 w-full text-center md:text-left", activeTab === 'forum' ? 'active' : 'text-on-surface-variant/70')}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>dynamic_feed</span>
                  <span className="font-headline-md text-[10px] md:text-[13px] font-semibold">Social</span>
              </button>
              <button onClick={() => { setActiveTab('games'); SoundEngine.playPop(); }} className={cn("nav-tab nav-tab-item flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 w-full text-center md:text-left", activeTab === 'games' ? 'active' : 'text-on-surface-variant/70')}>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>sports_esports</span>
                  <span className="font-headline-md text-[10px] md:text-[13px] font-semibold">Juegos</span>
              </button>
          </nav>
          <div className="hidden md:flex flex-col gap-1 p-3 border-t border-outline-variant/30">
              <div className="w-full text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2.5 flex items-center justify-between mb-2 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">stars</span>
                      <span className="font-headline-md text-[13px] font-bold">Puntos</span>
                  </div>
                  <span className="font-label-mono text-[13px] font-bold">{myPoints}</span>
              </div>
              <button onClick={() => { if(confirm('¿Salir de NodeMap?')) disconnect(); }} className="w-full text-on-surface-variant/60 hover:bg-surface-variant/30 hover:text-primary transition-all duration-200 px-4 py-2.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                  <span className="font-headline-md text-[13px] font-medium">Salir</span>
              </button>
          </div>
      </aside>

      <main className="flex-grow relative overflow-hidden bg-transparent">
        <div className={cn("absolute inset-0 transition-opacity duration-300", activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <MapView />
        </div>
        <div className={cn("absolute inset-0 transition-opacity duration-300", activeTab === 'users' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <UsersView />
        </div>
        <div className={cn("absolute inset-0 transition-opacity duration-300", activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <ChatView />
        </div>
        <div className={cn("absolute inset-0 transition-opacity duration-300", activeTab === 'forum' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <ForumView />
        </div>
        <div className={cn("absolute inset-0 transition-opacity duration-300", activeTab === 'games' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <GamesView />
        </div>
      </main>
    </div>
  );
}
