import { useState, useEffect } from 'react';
import { useWorkStore } from '../../store/useWorkStore';
import { WebRTCEngine } from '../../services/webrtc';
import PROTOCOL from '../../shared/protocol';
import { Network, Inbox, ClipboardList, Activity, Terminal as TerminalIcon, Users } from 'lucide-react';

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}) {
  const accents = {
    sky: "from-sky-500/20 text-sky-300 border-sky-400/20 shadow-[0_0_40px_-20px_rgba(56,189,248,0.6)]",
    emerald: "from-emerald-500/20 text-emerald-300 border-emerald-400/20 shadow-[0_0_40px_-20px_rgba(52,211,153,0.6)]",
    amber: "from-amber-500/20 text-amber-300 border-amber-400/20 shadow-[0_0_40px_-20px_rgba(251,191,36,0.5)]",
  };
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-white/[0.02] backdrop-blur-xl p-5 transition-all hover:bg-white/[0.04] ${accents[accent]}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white tabular-nums">{value}</div>
          <div className="mt-1 text-[11px] font-mono text-zinc-500">{delta}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/5`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Segmented({ label, unit, value, options, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="text-[11px] font-mono text-zinc-300">{value}{unit}</div>
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={[
              "flex-1 text-[11px] font-mono py-1.5 rounded-md transition-all",
              value === o
                ? "bg-sky-500/15 text-white border border-sky-400/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent",
            ].join(" ")}
          >
            {o}{unit}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WorkAdminPanel() {
  const [metrics, setMetrics] = useState(null);
  const channels = useWorkStore(state => state.channelMessages);
  const reports = useWorkStore(state => state.reports);
  const networkStatus = useWorkStore(state => state.networkStatus);
  const user = useWorkStore(state => state.user);
  
  const [latency, setLatency] = useState(0);
  const [loss, setLoss] = useState(0);

  useEffect(() => {
    WebRTCEngine.setLatency(latency);
  }, [latency]);

  useEffect(() => {
    WebRTCEngine.setPacketLoss(loss);
  }, [loss]);

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
    <div className="p-5 md:p-8 space-y-6 h-full overflow-y-auto bg-transparent relative z-10">
      
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Peers Conectados" value={metrics?.peers_activos || networkStatus.length} delta="en la malla actual" icon={Network} accent="sky" />
        <StatCard label="Mensajes Internos" value={channels.length} delta="canal general" icon={Inbox} accent="emerald" />
        <StatCard label="Reportes Pendientes" value={pending} delta={`${resolved} resueltos`} icon={ClipboardList} accent="amber" />
      </div>

      {/* Stress + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Network Stress */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-400" /> Simulador de Estrés
              </div>
              <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                inyecta latencia y pérdida de paquetes en el mesh
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 px-2 py-1 rounded border border-emerald-400/20 bg-emerald-400/5">
              LIVE
            </span>
          </div>

          <div className="mt-5 space-y-4 flex-1">
            <Segmented
              label="Latencia"
              unit="ms"
              value={latency}
              options={[0, 50, 200, 500]}
              onChange={setLatency}
            />
            <Segmented
              label="Packet Loss"
              unit="%"
              value={loss}
              options={[0, 5, 15, 30]}
              onChange={setLoss}
            />
          </div>

          <div className="mt-5 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-zinc-400 flex justify-between">
            <span>RTT Base Artificial</span>
            <span className="text-sky-300">+{latency} ms · {loss}% loss</span>
          </div>
        </div>

        {/* Terminal Log */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden flex flex-col h-[320px]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <TerminalIcon className="h-4 w-4 text-emerald-400" /> P2P · Live Log
            </div>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500/70" />
              <span className="h-2 w-2 rounded-full bg-amber-400/70" />
              <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
            </div>
          </div>
          <div className="bg-[#050508] p-4 font-mono text-[11px] leading-relaxed text-emerald-400/90 flex-1 overflow-y-auto">
            <div className="whitespace-pre"><span className="text-emerald-600">›</span> [SYS] Conectado a ws://localhost:3000</div>
            <div className="whitespace-pre"><span className="text-emerald-600">›</span> [ICE] Generando candidato relay...</div>
            <div className="whitespace-pre"><span className="text-emerald-600">›</span> [SDP] Offer generada (482 bytes)</div>
            <div className="whitespace-pre"><span className="text-emerald-600">›</span> [SIG] Emitiendo protocolo WORK_CHANNEL_MSG...</div>
            <div className="whitespace-pre"><span className="text-emerald-600">›</span> [ICE] Conexión P2P establecida con mesh local.</div>
            
            {channels.slice(-5).map((m, i) => (
              <div key={i} className="whitespace-pre mt-2">
                <span className="text-emerald-600">›</span> [MSG] Plain: {m.texto}<br/>
                <span className="text-emerald-600">›</span> <span className="text-sky-400">Cipher: {btoa(m.texto + Math.random()).substring(0, 48)}...</span>
              </div>
            ))}

            <div className="mt-1 flex items-center gap-1">
              <span className="text-emerald-600">›</span>
              <span className="inline-block h-3 w-1.5 bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* User table */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="text-sm font-medium text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" /> Gestión de Identidades P2P
          </div>
          <button className="text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded border border-white/5 hover:border-white/10 transition-colors">
            export.csv
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-white/5">
                <th className="text-left px-5 py-2.5">Peer ID</th>
                <th className="text-left px-5 py-2.5">Nombre</th>
                <th className="text-left px-5 py-2.5">Depto.</th>
                <th className="text-right px-5 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {networkStatus.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 font-mono text-[12px] text-sky-300">{u.id.substring(0, 10)}...</td>
                  <td className="px-5 py-3 text-zinc-200">{u.nombre} {u.nombre === user?.nombre && '(Tú)'}</td>
                  <td className="px-5 py-3 text-zinc-400 text-[12px] font-mono uppercase">{u.departamento}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-300 hover:border-sky-400/40 hover:text-sky-300 hover:bg-sky-500/5 transition-all">
                        Cambiar Rol
                      </button>
                      <button className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-300 hover:border-rose-400/40 hover:text-rose-300 hover:bg-rose-500/5 transition-all">
                        Desconectar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {networkStatus.length === 0 && (
                 <tr>
                   <td colSpan="4" className="text-center py-4 text-xs font-mono text-zinc-500">Ningún peer conectado.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Metricas de Departamento */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden p-5">
        <h3 className="font-semibold text-white mb-1 text-sm">Estado del Mesh por Área</h3>
        <p className="text-[11px] text-zinc-500 font-mono mb-4">Latencia y densidad de red distribuida</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {['Tecnología', 'Operaciones', 'Recursos Humanos', 'Dirección', 'Finanzas'].map(dept => {
                const count = networkStatus.filter(s => s.departamento === dept).length;
                const activeLatency = count > 0 ? (latency + Math.floor(Math.random() * 20) + 10) : 0;
                return (
                  <div key={dept} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                    <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2 truncate">{dept}</div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-bold text-white">{count}</div>
                        <div className="text-[9px] font-mono text-zinc-500">peers</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-mono ${activeLatency > 150 ? 'text-rose-400' : activeLatency > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{activeLatency}ms</div>
                        <div className="text-[9px] font-mono text-zinc-500">RTT</div>
                      </div>
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
      
    </div>
  );
}
