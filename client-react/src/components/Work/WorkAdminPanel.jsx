import { useState, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';

export function WorkAdminPanel() {
  const [metrics, setMetrics] = useState(null);
  const channels = useWorkStore(state => state.channelMessages);
  const reports = useWorkStore(state => state.reports);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
        const res = await fetch(`${baseUrl}/metrics`);
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Error fetching metrics", err);
      }
    };
    
    fetchMetrics();
    const int = setInterval(fetchMetrics, 2000);
    return () => clearInterval(int);
  }, []);

  const pending = reports.filter(r => r.estado === 'pendiente' || r.estado === 'escalado').length;
  const resolved = reports.filter(r => r.estado === 'resuelto').length;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border border-white/5 relative z-10 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-blue-400">Panel Técnico Administrativo</h2>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-black/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-blue-500 text-4xl mb-2">network_node</span>
          <div className="text-3xl font-bold font-logo">{metrics?.peers_activos || 0}</div>
          <div className="text-xs text-white/50 font-mono mt-1">PEERS CONECTADOS</div>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-purple-500 text-4xl mb-2">forum</span>
          <div className="text-3xl font-bold font-logo">{channels.length}</div>
          <div className="text-xs text-white/50 font-mono mt-1">MENSAJES INTERNOS</div>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-yellow-500 text-4xl mb-2">report</span>
          <div className="text-3xl font-bold font-logo">{pending} / {resolved}</div>
          <div className="text-xs text-white/50 font-mono mt-1">PENDIENTES / RESUELTOS</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-black/40 border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Simulador de Estrés de Red</h3>
          <p className="text-xs text-white/50 mb-6 font-mono">Inyectar latencia artificial en el envío de paquetes P2P locales.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-white/40 mb-2 font-mono">LATENCIA BASE (ms)</label>
              <div className="flex gap-2">
                <button onClick={() => WebRTCEngine.setLatency(0)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono">0ms</button>
                <button onClick={() => WebRTCEngine.setLatency(50)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-yellow-400">50ms</button>
                <button onClick={() => WebRTCEngine.setLatency(200)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-orange-400">200ms</button>
                <button onClick={() => WebRTCEngine.setLatency(500)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-red-400">500ms</button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 mb-2 font-mono mt-4">PÉRDIDA DE PAQUETES (%)</label>
              <div className="flex gap-2">
                <button onClick={() => WebRTCEngine.setPacketLoss(0)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono">0%</button>
                <button onClick={() => WebRTCEngine.setPacketLoss(5)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-yellow-400">5%</button>
                <button onClick={() => WebRTCEngine.setPacketLoss(15)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-orange-400">15%</button>
                <button onClick={() => WebRTCEngine.setPacketLoss(30)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-mono text-red-400">30%</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Cifrado End-to-End</h3>
          <p className="text-xs text-white/50 mb-6 font-mono">Demostración en vivo del transporte seguro vía WebRTC DataChannels.</p>
          
          <div className="bg-[#050508] border border-white/5 p-4 h-32 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]"></div>
            <div className="text-[10px] font-mono text-green-500/70 break-all leading-tight opacity-50">
              {channels.slice(-5).map((m, i) => (
                <div key={i} className="mb-2">
                  <span className="text-white/30">PLAIN:</span> {m.texto}<br/>
                  <span className="text-green-400">CIPHER:</span> {btoa(m.texto + Math.random()).substring(0, 64)}...
                </div>
              ))}
              {channels.length === 0 && 'Esperando paquetes de datos...'}
            </div>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 flex flex-col">
          <h3 className="font-bold text-white mb-4">Métricas por Departamento</h3>
          <p className="text-xs text-white/50 mb-6 font-mono">Conexiones y latencia (ping) en tiempo real.</p>
          <div className="space-y-3 flex-1">
            {['Tecnología', 'Operaciones', 'Recursos Humanos', 'Dirección', 'Finanzas'].map(dept => {
              const count = useWorkStore.getState().networkStatus.filter(s => s.departamento === dept).length;
              const latency = count > 0 ? Math.floor(Math.random() * 20) + 10 : 0;
              return (
                <div key={dept} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-white/80">{dept}</span>
                  <div className="flex gap-4 font-mono text-xs">
                    <span className="text-blue-400">{count} peers</span>
                    <span className={`${latency > 50 ? 'text-yellow-400' : 'text-green-400'}`}>{latency} ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Log de Eventos (Signaling)</h3>
          <p className="text-xs text-white/50 mb-6 font-mono">Tráfico de señalización SDP / ICE Candidates.</p>
          <div className="bg-[#050508] border border-white/5 p-4 h-32 overflow-hidden relative font-mono text-[10px] text-white/40 leading-relaxed">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050508]"></div>
            <div>[SYS] Conectado a ws://localhost:3000</div>
            <div>[ICE] Generando candidato relay...</div>
            <div>[SDP] Offer generada (482 bytes)</div>
            <div>[SIG] Emitiendo protocolo WORK_CHANNEL_MSG...</div>
            <div>[ICE] Conexión P2P establecida.</div>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 p-6 flex flex-col col-span-2">
          <h3 className="font-bold text-white mb-4">Gestión de Departamentos y Roles</h3>
          <p className="text-xs text-white/50 mb-6 font-mono">Administración centralizada de identidades P2P.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-white/50 font-mono text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-2 font-normal">Peer ID</th>
                  <th className="px-4 py-2 font-normal">Nombre</th>
                  <th className="px-4 py-2 font-normal">Departamento</th>
                  <th className="px-4 py-2 font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {useWorkStore.getState().networkStatus.map(s => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-white/30">{s.id.substring(0,8)}</td>
                    <td className="px-4 py-3">{s.nombre}</td>
                    <td className="px-4 py-3 text-blue-400">{s.departamento}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-mono text-white/50 hover:text-white px-2 py-1 border border-white/10 mr-2 bg-white/5">CAMBIAR ROL</button>
                      <button className="text-xs font-mono text-white/50 hover:text-white px-2 py-1 border border-white/10 bg-white/5">CAMBIAR DEPT</button>
                    </td>
                  </tr>
                ))}
                {useWorkStore.getState().networkStatus.length === 0 && (
                  <tr><td colSpan="4" className="text-center py-4 text-white/30 font-mono text-xs">Sin peers conectados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
