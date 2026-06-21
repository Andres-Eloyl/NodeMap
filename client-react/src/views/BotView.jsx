import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WebRTCEngine } from '../services/webrtc';
import PROTOCOL from '../shared/protocol.js';

export function BotView() {
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);
  const botId = searchParams.get('id') || Math.floor(Math.random() * 1000);
  const nombre = "Bot " + botId;

  const addLog = (msg) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
  };

  useEffect(() => {
    addLog(`Iniciando conexión...`);
    WebRTCEngine.conectar(nombre, "Zona A", "#6c63ff", "🤖");

    WebRTCEngine.onMessage(PROTOCOL.PEER_JOIN, (p) => addLog(`🟢 Detectado: ${p.nombre}`));
    WebRTCEngine.onMessage(PROTOCOL.PEER_LEAVE, (p) => addLog(`🔴 Cayó: ${p.id.substr(0,6)}`));
    WebRTCEngine.onMessage(PROTOCOL.PEER_EXIT, (p) => addLog(`🟡 Salió: ${p.nombre}`));
    WebRTCEngine.onMessage(PROTOCOL.CHAT, (m) => addLog(`💬 ${m.nombre}: ${m.texto}`));

    const zonas = ["Zona A", "Zona B", "Zona C", "Pasillo", "Escenario", "Entrada"];
    let miZona = zonas[Math.floor(Math.random() * zonas.length)];

    const initialPosTimeout = setTimeout(() => {
        WebRTCEngine.broadcast(PROTOCOL.POSITION, { id: null, nombre: nombre, zona: miZona });
        addLog(`📍 Posición inicial: ${miZona}`);
    }, 3000);

    const actionInterval = setInterval(() => {
      const isChat = Math.random() > 0.5;
      
      if (isChat) {
         const frases = ["¡Hola a todos!", "¿Alguien en la zona?", "Probando red P2P...", "¡Qué buen evento!", "Nos vemos en el pasillo."];
         const txt = frases[Math.floor(Math.random() * frases.length)];
         
         const peers = WebRTCEngine.getPeers();
         if (peers.length > 0) {
            const dest = peers[Math.floor(Math.random() * peers.length)];
            WebRTCEngine.sendMessage(dest.id, PROTOCOL.CHAT, { id: null, nombre: nombre, texto: txt, destino: dest.id });
            addLog(`✉️ Envié a ${dest.nombre}: ${txt}`);
         }
      } else {
         miZona = zonas[Math.floor(Math.random() * zonas.length)];
         WebRTCEngine.broadcast(PROTOCOL.POSITION, { id: null, nombre: nombre, zona: miZona });
         addLog(`🏃 Me moví a ${miZona}`);
      }
    }, 4000 + Math.random() * 4000);

    return () => {
      clearTimeout(initialPosTimeout);
      clearInterval(actionInterval);
      WebRTCEngine.desconectar();
    };
  }, [nombre]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="font-['Inter'] text-[12px] bg-[#1a1d27] text-white p-2.5 h-screen overflow-hidden flex flex-col">
      <h3 className="m-0 mb-2.5 text-[#6c63ff]">{nombre}</h3>
      <div className="flex-1 overflow-y-auto border border-[#2a2e3d] p-2 rounded-md bg-[#0f1117]">
        {logs.map((log, i) => (
          <div key={i}>
            <span className="text-[#8b8fa3] font-mono">[{log.time}]</span> {log.msg}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
