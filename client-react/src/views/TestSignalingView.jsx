import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PROTOCOL from '../shared/protocol.js';
import CONFIG from '../shared/config.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function TestSignalingView() {
  const [nombre, setNombre] = useState('Anónimo');
  const [miId, setMiId] = useState('—');
  const [status, setStatus] = useState('Conectando...');
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  
  const logsEndRef = useRef(null);
  const isStarted = useRef(false);

  const addLog = (text, type = "info") => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type }]);
  };

  useEffect(() => {
    if (isStarted.current) return;
    isStarted.current = true;

    const n = prompt("¿Cuál es tu nombre?") || "Anónimo";
    setNombre(n);

    const serverUrl = (typeof CONFIG !== "undefined" && CONFIG.PORT)
      ? `http://${window.location.hostname}:${CONFIG.PORT}`
      : window.location.origin;

    const s = io(serverUrl, { query: { nombre: n } });
    setSocket(s);

    s.on("connect", () => {
      setIsConnected(true);
      setStatus("Conectado");
      addLog("Conectado al servidor de señalización", "join");
    });

    s.on("disconnect", () => {
      setIsConnected(false);
      setStatus("Desconectado");
      addLog("Desconectado del servidor", "leave");
    });

    s.on(PROTOCOL.PEER_LIST, (data) => {
      if (data.miId) setMiId(data.miId);
      
      setPeerCount(data.peers.length);

      if (data.peers.length === 0) {
        addLog("No hay otros peers conectados — eres el primero", "info");
      } else {
        const nombres = data.peers.map(p => `${p.nombre} (${p.id.substr(0,6)}…)`).join(", ");
        addLog(`Peers existentes: ${nombres}`, "info");
      }
    });

    s.on(PROTOCOL.PEER_JOIN, (data) => {
      setPeerCount(prev => prev + 1);
      addLog(`🟢 ${data.nombre} acaba de entrar (${data.id.substr(0,6)}…)`, "join");
    });

    s.on(PROTOCOL.PEER_LEAVE, (data) => {
      setPeerCount(prev => Math.max(0, prev - 1));
      addLog(`🔴 Peer desconectado: ${data.id.substr(0,6)}…`, "leave");
    });

    s.on(PROTOCOL.PEER_EXIT, (data) => {
      setPeerCount(prev => Math.max(0, prev - 1));
      addLog(`🟡 ${data.nombre} salió voluntariamente`, "leave");
    });

    s.on(PROTOCOL.OFFER, (data) => {
      addLog(`📨 Recibí OFFER de ${data.origen.substr(0,6)}…`, "signal");
    });

    s.on(PROTOCOL.ANSWER, (data) => {
      addLog(`📩 Recibí ANSWER de ${data.origen.substr(0,6)}…`, "signal");
    });

    s.on(PROTOCOL.ICE_CANDIDATE, (data) => {
      addLog(`🧊 Recibí ICE candidate de ${data.origen.substr(0,6)}…`, "signal");
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const simularOffer = () => {
    const destino = prompt("Ingresa el ID del destinatario:");
    if (destino && socket) {
      socket.emit(PROTOCOL.OFFER, { destino: destino, sdp: { tipo: "test-simulado" } });
      addLog(`📨 Enviando OFFER simulada a ${destino.substr(0,6)}…`, "signal");
    }
  };

  const fetchMetrics = async () => {
    try {
      const serverUrl = (typeof CONFIG !== "undefined" && CONFIG.PORT)
        ? `http://${window.location.hostname}:${CONFIG.PORT}`
        : window.location.origin;
        
      const res = await fetch(`${serverUrl}/metrics`);
      const data = await res.json();
      addLog(`📊 Peers: ${data.peers_activos} | Mensajes: ${data.mensajes_totales} | Uptime: ${data.uptime_segundos}s`, "info");
    } catch (err) {
      addLog(`❌ Error leyendo métricas: ${err.message}`, "leave");
    }
  };

  const salir = () => {
    if (socket) {
      socket.emit(PROTOCOL.PEER_EXIT);
      addLog("Saliendo voluntariamente...", "leave");
      setIsConnected(false);
      setStatus("Desconectado");
      socket.disconnect();
    }
  };

  return (
    <div className="font-['Inter'] bg-transparent text-[#e4e6ed] p-6 max-w-[800px] mx-auto min-h-screen">
      <h1 className="text-2xl font-bold bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] bg-clip-text text-transparent mb-2">Test de Señalización</h1>
      <p className="text-[#8b8fa3] text-sm mb-6">Prueba de conexión con el servidor de señalización (sin WebRTC)</p>

      <div className="flex flex-wrap gap-5 py-3.5 px-4.5 bg-[#1a1d27] border border-[#2a2e3d] rounded-xl mb-4">
        <div className="text-[13.6px]">
          <span className={cn("inline-block w-2 h-2 rounded-full mr-1.5 align-middle shadow-[0_0_6px_rgba(52,211,153,0.5)]", isConnected ? "bg-[#34d399]" : "bg-[#f87171] shadow-none")}></span>
          <span>{status}</span>
        </div>
        <div className="text-[13.6px]"><strong className="text-[#6c63ff]">Nombre:</strong> <span>{nombre}</span></div>
        <div className="text-[13.6px]"><strong className="text-[#6c63ff]">Mi ID:</strong> <span>{miId}</span></div>
        <div className="text-[13.6px]">Peers: <span className="inline-block bg-[rgba(108,99,255,0.15)] text-[#6c63ff] py-0.5 px-2.5 rounded-full text-xs font-semibold">{peerCount}</span></div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2e3d] rounded-xl p-3.5 h-[400px] overflow-y-auto mb-4 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className={cn("py-1.5 border-b border-[#2a2e3d] last:border-b-0 leading-snug", 
            log.type === 'join' && "text-[#34d399]",
            log.type === 'leave' && "text-[#f87171]",
            log.type === 'signal' && "text-[#fbbf24]",
            log.type === 'info' && "text-[#8b8fa3]"
          )}>
            <span className="text-[#8b8fa3] mr-2">[{log.time}]</span>
            <span dangerouslySetInnerHTML={{ __html: log.text }} />
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button onClick={simularOffer} className="py-2.5 px-4.5 border-none rounded-lg font-['Inter'] font-semibold text-[13px] cursor-pointer transition-all bg-[#6c63ff] text-white hover:bg-[#5b53e0]">
          📨 Simular OFFER
        </button>
        <button onClick={fetchMetrics} className="py-2.5 px-4.5 border rounded-lg font-['Inter'] font-semibold text-[13px] cursor-pointer transition-all bg-[#1a1d27] text-[#e4e6ed] border-[#2a2e3d] hover:bg-[#2a2e3d]">
          📊 Ver Métricas
        </button>
        <button onClick={salir} className="py-2.5 px-4.5 border-none rounded-lg font-['Inter'] font-semibold text-[13px] cursor-pointer transition-all bg-[#f87171] text-[#0f1117] hover:bg-[#ef4444]">
          🚪 Salir
        </button>
      </div>
    </div>
  );
}
