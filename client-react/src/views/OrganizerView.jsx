import { useState, useEffect } from 'react';
import { WebRTCEngine } from '../services/webrtc';
import PROTOCOL from '../shared/protocol.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function OrganizerView() {
  const [status, setStatus] = useState("ESPERANDO PEERS...");
  const [statusClass, setStatusClass] = useState("text-xs font-mono px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30");
  const [canSend, setCanSend] = useState(false);
  const [message, setMessage] = useState('');
  const [btnSendText, setBtnSendText] = useState('EMITIR BROADCAST');
  const [btnSendClass, setBtnSendClass] = useState('');
  const [activeQoS, setActiveQoS] = useState(0);

  const [triviaQ, setTriviaQ] = useState('¿Qué significa QoS en redes?');
  const [triviaO1, setTriviaO1] = useState('Quality of Service');
  const [triviaO2, setTriviaO2] = useState('Quantity of Speed');
  const [triviaO3, setTriviaO3] = useState('Query over Socket');
  const [triviaO4, setTriviaO4] = useState('Quick Operating System');
  const [btnTriviaText, setBtnTriviaText] = useState('INICIAR TRIVIA GLOBAL');
  const [btnTriviaClass, setBtnTriviaClass] = useState('');

  const [botsActive, setBotsActive] = useState(false);

  useEffect(() => {
    WebRTCEngine.conectar("ORGANIZADOR", "Control", "#ffffff", "👑");

    const interval = setInterval(() => {
      const peers = WebRTCEngine.getPeers();
      if (peers.length > 0) {
        setStatus(`CONECTADO (${peers.length} PEERS)`);
        setStatusClass("text-xs font-mono px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30");
        setCanSend(true);
      } else {
        setStatus("ESPERANDO PEERS...");
        setStatusClass("text-xs font-mono px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30");
        setCanSend(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      WebRTCEngine.desconectar();
    };
  }, []);

  const handleBroadcast = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (text && canSend) {
      WebRTCEngine.broadcast(PROTOCOL.ORGANIZER_BROADCAST, { text });
      setMessage('');
      
      const originalText = btnSendText;
      setBtnSendText('¡EMITIDO!');
      setBtnSendClass('bg-green-600');
      setTimeout(() => {
        setBtnSendText(originalText);
        setBtnSendClass('');
      }, 2000);
    }
  };

  const handleQoS = (latency) => {
    WebRTCEngine.broadcast(PROTOCOL.SET_LATENCY, { latency });
    setActiveQoS(latency);
  };

  const handleTrivia = () => {
    if (triviaQ && triviaO1 && triviaO2 && triviaO3 && triviaO4) {
      WebRTCEngine.broadcast(PROTOCOL.TRIVIA_START, {
        question: triviaQ,
        options: [triviaO1, triviaO2, triviaO3, triviaO4]
      });

      const originalText = btnTriviaText;
      setBtnTriviaText('TRIVIA ENVIADA');
      setBtnTriviaClass('bg-green-600');
      setTimeout(() => {
        setBtnTriviaText(originalText);
        setBtnTriviaClass('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center relative p-4 bg-transparent text-[#e5e0f0]">


      <div className="glass-card p-8 md:p-10 w-full max-w-[500px] relative z-10 shadow-2xl">
        <div className="text-center flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">admin_panel_settings</span>
            </div>
            <div>
                <h1 className="font-logo text-[28px] font-bold text-primary tracking-tight uppercase">Control de Red</h1>
                <p className="text-sm text-white/60 mt-1">Modo Organizador - Broadcast P2P</p>
            </div>
        </div>

        <div className="mb-6 p-4 border border-white/10 bg-black/20 flex items-center justify-between">
            <span className="text-sm font-medium">Estado WebRTC:</span>
            <span className={statusClass}>{status}</span>
        </div>

        <div className="mb-6 p-4 border border-white/10 bg-black/20">
            <h3 className="text-xs tracking-widest text-white/70 uppercase font-medium mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-yellow-400">warning</span> Simulador de Red (QoS)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button onClick={() => handleQoS(0)} className={cn("px-2 py-2 border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-all cursor-pointer", activeQoS === 0 && "ring-2 ring-white")}>0ms (Normal)</button>
                <button onClick={() => handleQoS(50)} className={cn("px-2 py-2 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all cursor-pointer", activeQoS === 50 && "ring-2 ring-white")}>50ms (Baja)</button>
                <button onClick={() => handleQoS(200)} className={cn("px-2 py-2 border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-all cursor-pointer", activeQoS === 200 && "ring-2 ring-white")}>200ms (Media)</button>
                <button onClick={() => handleQoS(500)} className={cn("px-2 py-2 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer", activeQoS === 500 && "ring-2 ring-white")}>500ms (Crítica)</button>
            </div>
        </div>

        <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-xs tracking-widest text-white/70 uppercase font-medium" htmlFor="message">Mensaje de Alerta Global</label>
                <textarea id="message" rows="4" className="input-field p-4 resize-none font-medium bg-[#0c0b15]" placeholder="Escribe el anuncio para todos los celulares..." value={message} onChange={e => setMessage(e.target.value)}></textarea>
            </div>
            <button className={cn("btn-primary w-full h-[56px] flex items-center justify-center gap-2 mt-2", btnSendClass)} disabled={!canSend || !message.trim()} type="submit">
                <span className="material-symbols-outlined text-[22px]">{btnSendText === 'EMITIR BROADCAST' ? 'campaign' : 'check_circle'}</span>
                {btnSendText}
            </button>
        </form>

        <div className="h-px bg-outline-variant/30 w-full my-4"></div>

        <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">lightbulb</span> Lanzar Trivia Rápida</h2>
            <div className="flex flex-col gap-2">
                <input className="input-field p-3 text-sm bg-[#0c0b15]" placeholder="Ej: ¿Qué protocolo usa la web?" value={triviaQ} onChange={e => setTriviaQ(e.target.value)} />
                <input className="input-field p-2 text-xs bg-[#0c0b15]" placeholder="Opción 1" value={triviaO1} onChange={e => setTriviaO1(e.target.value)} />
                <input className="input-field p-2 text-xs bg-[#0c0b15]" placeholder="Opción 2" value={triviaO2} onChange={e => setTriviaO2(e.target.value)} />
                <input className="input-field p-2 text-xs bg-[#0c0b15]" placeholder="Opción 3" value={triviaO3} onChange={e => setTriviaO3(e.target.value)} />
                <input className="input-field p-2 text-xs bg-[#0c0b15]" placeholder="Opción 4" value={triviaO4} onChange={e => setTriviaO4(e.target.value)} />
            </div>
            <button onClick={handleTrivia} className={cn("btn-primary w-full h-[48px] flex items-center justify-center gap-2", btnTriviaClass)}>
                <span className="material-symbols-outlined text-[20px]">{btnTriviaText === 'INICIAR TRIVIA GLOBAL' ? 'rocket_launch' : 'check_circle'}</span>
                {btnTriviaText}
            </button>
        </div>

        <div className="h-px bg-outline-variant/30 w-full my-4"></div>

        <div className="flex flex-col gap-4">
            <h2 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">robot_2</span> Simulador de Tráfico (Bots)</h2>
            <div className="flex items-center justify-between bg-black/20 p-4 border border-white/10">
                <div>
                    <div className="text-sm font-bold text-white">Bots en segundo plano</div>
                    <div className="text-xs text-white/50 mt-1">Lanza 5 bots que interactúan en la red</div>
                </div>
                <button onClick={() => setBotsActive(!botsActive)} className={cn("px-4 py-2 border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer", botsActive ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20")}>
                    <span className="material-symbols-outlined text-[16px]">{botsActive ? 'stop' : 'play_arrow'}</span> {botsActive ? 'DETENER' : 'INICIAR'}
                </button>
            </div>
            {botsActive && (
                <div className="hidden">
                    {[1,2,3,4,5].map(i => <iframe key={i} src={`/bot?id=${i}`} />)}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
