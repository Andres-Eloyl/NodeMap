import { useState } from 'react';
import { useWebRTCStore } from './store/useWebRTCStore';
import { Map, MessageSquare, Gamepad2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatView } from './views/ChatView';
import { MapView } from './views/MapView';
import { GamesView } from './views/GamesView';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function AnimatedBackground() {
  return (
    <div id="animated-bg">
      <div className="rainbow-line" style={{ left: '20%', background: 'linear-gradient(to bottom, #ff5451, #03c6b2)', animation: 'slide-bg 15s infinite linear' }}></div>
      <div className="rainbow-line" style={{ left: '60%', background: 'linear-gradient(to bottom, #69d8d4, #b91a24)', animation: 'slide-bg 20s infinite linear reverse' }}></div>
    </div>
  );
}

function LoginScreen() {
  const connect = useWebRTCStore(state => state.connect);
  const [name, setName] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    connect(name, 'Centro', color, '👤');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <div className="glass-card w-full max-w-sm ] p-8 md:p-10 shadow-2xl z-10 animate-[fade-in_0.6s_ease-out]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-surface-container  rotate-12 flex items-center justify-center mb-6 shadow-inner border border-white/5">
            <span className="material-symbols-outlined text-primary text-5xl drop-shadow-[0_0_15px_rgba(255,84,81,0.5)]">hub</span>
          </div>
          <h1 className="font-logo text-4xl font-bold tracking-tight text-white mb-2">Node<span className="text-primary">Map</span></h1>
          <p className="text-on-surface-variant text-[15px] font-medium text-center">Conecta. Juega. Explora.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">person</span>
            <input 
              className="input-field  pl-12 h-[56px] text-[15px] focus:ring-1 focus:ring-primary/50 bg-black/40"
              placeholder="Tu apodo genial..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary  h-[56px] text-[16px] shadow-[0_0_20px_rgba(255,84,81,0.2)] mt-2">
            Entrar a la Red
          </button>
        </form>
      </div>
    </div>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState('map');
  const isConnected = useWebRTCStore(state => state.isConnected);

  if (!isConnected) {
    return <LoginScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden relative">
      <AnimatedBackground />
      {/* Sidebar / Bottom Nav */}
      <nav className="glass-card md:w-[280px] flex-none flex md:flex-col justify-between md:justify-start p-2 md:p-6 border-t md:border-t-0 md:border-r border-outline-variant/30 order-last md:order-first z-20">
        <div className="hidden md:flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary/20  flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <h1 className="font-logo text-2xl font-bold tracking-tight">Node<span className="text-primary">Map</span></h1>
        </div>

        <div className="flex md:flex-col w-full gap-1 md:gap-2 justify-around md:justify-start">
          <button onClick={() => setActiveTab('map')} className={cn("nav-tab-item flex items-center justify-center md:justify-start gap-3 p-3 md:py-4 md:px-5  w-full flex-1 md:flex-none", activeTab === 'map' && "active")}>
            <Map size={24} />
            <span className="hidden md:block font-headline-sm text-[15px]">Mapa</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={cn("nav-tab-item flex items-center justify-center md:justify-start gap-3 p-3 md:py-4 md:px-5  w-full flex-1 md:flex-none", activeTab === 'chat' && "active")}>
            <MessageSquare size={24} />
            <span className="hidden md:block font-headline-sm text-[15px]">Chat</span>
          </button>
          <button onClick={() => setActiveTab('games')} className={cn("nav-tab-item flex items-center justify-center md:justify-start gap-3 p-3 md:py-4 md:px-5  w-full flex-1 md:flex-none", activeTab === 'games' && "active")}>
            <Gamepad2 size={24} />
            <span className="hidden md:block font-headline-sm text-[15px]">Juegos</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-background">
        <div className={cn("absolute inset-0 p-4 transition-opacity duration-300", activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <MapView />
        </div>
        <div className={cn("absolute inset-0 p-4 transition-opacity duration-300", activeTab === 'chat' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <ChatView />
        </div>
        <div className={cn("absolute inset-0 p-4 transition-opacity duration-300", activeTab === 'games' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none')}>
          <GamesView />
        </div>
      </main>
    </div>
  );
}

export default AppShell;
