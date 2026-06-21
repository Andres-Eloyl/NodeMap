import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { WebRTCEngine } from '../services/webrtc';
import PROTOCOL from '../shared/protocol.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MAX_DATA_POINTS = 60;

const waypoints = {
    'Zona A': [
        { id: 'p1', t: 10, l: 25, edges: ['p2', 'r1'] },
        { id: 'p2', t: 30, l: 25, edges: ['p1', 'p3', 'r2'] },
        { id: 'p3', t: 50, l: 25, edges: ['p2', 'p4', 'r3'] },
        { id: 'p4', t: 70, l: 25, edges: ['p3', 'p5', 'r4'] },
        { id: 'p5', t: 90, l: 25, edges: ['p4', 'r5'] },
        { id: 'r1', t: 15, l: 12, edges: ['p1'] },
        { id: 'r2', t: 35, l: 12, edges: ['p2'] },
        { id: 'r3', t: 55, l: 12, edges: ['p3'] },
        { id: 'r4', t: 75, l: 12, edges: ['p4'] },
        { id: 'r5', t: 85, l: 12, edges: ['p5'] },
    ],
    'Zona B': [
        { id: 'c1', t: 15, l: 50, edges: ['c2', 'c6'] },
        { id: 'c2', t: 35, l: 50, edges: ['c1', 'c3', 'c7'] },
        { id: 'c3', t: 55, l: 50, edges: ['c2', 'c4'] },
        { id: 'c4', t: 75, l: 50, edges: ['c3', 'c5'] },
        { id: 'c5', t: 85, l: 50, edges: ['c4'] },
        { id: 'c6', t: 15, l: 38, edges: ['c1'] },
        { id: 'c7', t: 35, l: 62, edges: ['c2'] },
        { id: 'c8', t: 65, l: 38, edges: ['c3'] },
        { id: 'c9', t: 85, l: 62, edges: ['c5'] },
    ],
    'Zona C': [
        { id: 'p1', t: 10, l: 75, edges: ['p2', 'r1'] },
        { id: 'p2', t: 30, l: 75, edges: ['p1', 'p3', 'r2'] },
        { id: 'p3', t: 50, l: 75, edges: ['p2', 'p4', 'r3'] },
        { id: 'p4', t: 70, l: 75, edges: ['p3', 'p5', 'r4'] },
        { id: 'p5', t: 90, l: 75, edges: ['p4', 'r5'] },
        { id: 'r1', t: 15, l: 88, edges: ['p1'] },
        { id: 'r2', t: 35, l: 88, edges: ['p2'] },
        { id: 'r3', t: 55, l: 88, edges: ['p3'] },
        { id: 'r4', t: 75, l: 88, edges: ['p4'] },
        { id: 'r5', t: 85, l: 88, edges: ['p5'] },
    ]
};

export function DisplayView() {
  const chartContainerRef = useRef(null);
  const terminalRef = useRef(null);
  
  const [kpiNodes, setKpiNodes] = useState(0);
  const [kpiPeak, setKpiPeak] = useState(0);
  const [kpiMessages, setKpiMessages] = useState(0);
  const [kpiLatency, setKpiLatency] = useState(0);
  
  const [forums, setForums] = useState({ 'Zona A': 0, 'Zona B': 0, 'Zona C': 0 });
  const [activeGames, setActiveGames] = useState({});
  const [triviaScores, setTriviaScores] = useState({});
  
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, type: 'info', text: '> Escuchando tráfico crudo en red descentralizada...' },
    { id: 2, type: 'info', text: '> Protocolo End-to-End Encryption [ACTIVO]' }
  ]);

  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(50);
  const [replayStatus, setReplayStatus] = useState("Inicializando mapa histórico...");
  const [replayNodes, setReplayNodes] = useState([]);

  // Refs para estado mutable sin re-renders en hooks
  const statsRef = useRef({
    totalMessages: 0,
    peakConnections: 0,
    chartData: Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({ time: i, value: 0 }))
  });

  const chartRef = useRef({ width: 0, height: 0, x: null, y: null, svg: null, chartGroup: null, xAxisGroup: null, yAxisGroup: null });

  useEffect(() => {
    WebRTCEngine.conectar("Dashboard", "Central", "#ffffff", "📊");

    const handleRecordActivity = () => {
      statsRef.current.totalMessages++;
      statsRef.current.chartData[MAX_DATA_POINTS - 1].value += 1;
      setKpiMessages(statsRef.current.totalMessages);
    };

    const spawnReaction = (emoji) => {
      const el = document.createElement('div');
      el.className = 'fixed pointer-events-none z-[9999]';
      el.style.fontSize = '8rem'; 
      el.innerText = emoji;
      el.style.left = Math.random() * 80 + 10 + '%';
      el.style.bottom = '-100px';
      el.classList.add('animate-float-up');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    };

    WebRTCEngine.onMessage(PROTOCOL.CHAT, () => handleRecordActivity());
    WebRTCEngine.onMessage(PROTOCOL.POSITION, () => handleRecordActivity());
    WebRTCEngine.onMessage(PROTOCOL.HEATMAP_SYNC, () => handleRecordActivity());
    WebRTCEngine.onMessage(PROTOCOL.ORGANIZER_BROADCAST, () => handleRecordActivity());
    WebRTCEngine.onMessage(PROTOCOL.REACTION, (data) => {
      handleRecordActivity();
      spawnReaction(data.emoji);
    });

    const kpiInterval = setInterval(() => {
      const peers = WebRTCEngine.getPeers();
      const count = peers.length;
      setKpiNodes(count);
      
      if (count > statsRef.current.peakConnections) {
        statsRef.current.peakConnections = count;
        setKpiPeak(count);
      }
      
      let totalLatency = 0;
      let latencyCount = 0;
      for (const peer of peers) {
        const lat = WebRTCEngine.getLatency(peer.id);
        if (lat !== null && !isNaN(lat)) {
          totalLatency += lat;
          latencyCount++;
        }
      }
      const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
      setKpiLatency(avgLatency);
    }, 1000);

    WebRTCEngine.onMessage(PROTOCOL.FORUM_MSG, (data) => {
      if (data.zona && ['Zona A', 'Zona B', 'Zona C'].includes(data.zona)) {
        setForums(prev => ({ ...prev, [data.zona]: prev[data.zona] + 1 }));
      }
    });

    WebRTCEngine.onMessage(PROTOCOL.GAME_ACCEPT, (data) => {
      setActiveGames(prev => ({ ...prev, [data.senderId]: { player1: data.nombre, player2: 'Oponente', type: data.gameType, time: Date.now() } }));
    });
    WebRTCEngine.onMessage(PROTOCOL.GAME_INVITE, (data) => {
      setActiveGames(prev => ({ ...prev, [data.senderId + '_inv']: { player1: data.nombre, player2: 'Esperando...', type: data.gameType, time: Date.now() } }));
    });
    WebRTCEngine.onMessage(PROTOCOL.REACTION_TAP, (data) => {
      setActiveGames(prev => ({ ...prev, [data.senderId + '_reaction']: { player1: 'Jugador', player2: 'Jugador', type: 'reaction', time: Date.now(), status: 'Terminado' } }));
    });

    WebRTCEngine.onMessage(PROTOCOL.TRIVIA_ANSWER, (data) => {
      setTriviaScores(prev => ({ ...prev, [data.nombre]: (prev[data.nombre] || 0) + 100 }));
    });

    WebRTCEngine.onMessage("RAW_PACKET", (packet) => {
      let msgType = "UNKNOWN";
      try {
        const parsed = JSON.parse(packet.raw);
        msgType = parsed.tipo ? parsed.tipo.toUpperCase() : "RAW_DATA";
        if (msgType === "PING" || msgType === "PONG") return;
      } catch(e) {}
      
      let isSecure = packet.raw.includes('_encrypted');
      let rawText = packet.raw;
      if (isSecure) {
          rawText = rawText.replace(/"_encrypted":"([^"]+)"/, '"_encrypted":"<SECURE_E2EE_PAYLOAD>"');
      }

      setTerminalLogs(prev => {
        const newLogs = [...prev, {
          id: Date.now() + Math.random(),
          type: 'packet',
          time: new Date().toLocaleTimeString(),
          size: packet.size,
          isSecure,
          rawText
        }];
        if (newLogs.length > 50) newLogs.shift();
        return newLogs;
      });
    });

    return () => {
      clearInterval(kpiInterval);
      WebRTCEngine.desconectar();
    };
  }, []);

  // Scroll to bottom in terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    
    // Cleanup old chart if exists
    d3.select(chartContainerRef.current).selectAll("*").remove();

    const svg = d3.select(chartContainerRef.current)
      .append("svg")
      .attr("class", "d3-chart")
      .style("width", "100%")
      .style("height", "100%");

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffb3ad").attr("stop-opacity", 0.6);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ff5451").attr("stop-opacity", 1);

    chartRef.current.svg = svg;
    chartRef.current.chartGroup = svg.append("g");
    chartRef.current.xAxisGroup = svg.append("g");
    chartRef.current.yAxisGroup = svg.append("g");

    const resizeChart = () => {
      const rect = chartContainerRef.current.getBoundingClientRect();
      chartRef.current.width = rect.width - margin.left - margin.right;
      chartRef.current.height = rect.height - margin.top - margin.bottom;

      chartRef.current.chartGroup.attr("transform", `translate(${margin.left},${margin.top})`);
      chartRef.current.xAxisGroup.attr("transform", `translate(${margin.left},${chartRef.current.height + margin.top})`);
      chartRef.current.yAxisGroup.attr("transform", `translate(${margin.left},${margin.top})`);

      chartRef.current.x = d3.scaleBand().range([0, chartRef.current.width]).padding(0.2);
      chartRef.current.y = d3.scaleLinear().range([chartRef.current.height, 0]);
      
      updateChart(false);
    };

    const updateChart = (animate = true) => {
      const cr = chartRef.current;
      if (cr.width === 0 || cr.height === 0) return;

      cr.x.domain(statsRef.current.chartData.map(d => d.time));
      const maxVal = d3.max(statsRef.current.chartData, d => d.value);
      cr.y.domain([0, Math.max(5, maxVal + 2)]);
      
      const xAxis = d3.axisBottom(cr.x).tickFormat("").tickSize(0);
      const yAxis = d3.axisLeft(cr.y).ticks(5).tickSize(-cr.width);

      cr.xAxisGroup.call(xAxis);
      cr.yAxisGroup.transition().duration(animate ? 500 : 0).call(yAxis);
      
      const bars = cr.chartGroup.selectAll(".bar").data(statsRef.current.chartData, d => d.time);
      bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => cr.x(d.time))
        .attr("y", cr.height)
        .attr("width", cr.x.bandwidth())
        .attr("height", 0)
        .merge(bars)
        .transition()
        .duration(animate ? 400 : 0)
        .ease(d3.easeCubicOut)
        .attr("x", d => cr.x(d.time))
        .attr("y", d => cr.y(d.value))
        .attr("width", cr.x.bandwidth())
        .attr("height", d => cr.height - cr.y(d.value));
      bars.exit().remove();
    };

    window.addEventListener("resize", resizeChart);
    setTimeout(resizeChart, 100);

    const chartInterval = setInterval(() => {
      const data = statsRef.current.chartData;
      for (let i = 0; i < MAX_DATA_POINTS - 1; i++) {
        data[i].value = data[i + 1].value;
      }
      data[MAX_DATA_POINTS - 1].value = 0;
      updateChart(true);
    }, 1000);

    return () => {
      window.removeEventListener("resize", resizeChart);
      clearInterval(chartInterval);
    };
  }, []);

  // Replay logic
  // Due to complexity, replay state is managed via React state but positions handled manually or via simple mapping
  // Since we want EXACT functionality, we can keep the Replay DOM logic or translate it.
  // For brevity and exactness, we will use a ref map and update state.
  
  const startReplay = () => {
    if (isReplaying) return;
    WebRTCEngine.requestReplay();
  };

  useEffect(() => {
    WebRTCEngine.onMessage("REPLAY_DATA", (events) => {
      if (!events || events.length === 0) {
        alert("No hay suficientes eventos guardados para reproducir.");
        setIsReplaying(false);
        return;
      }
      setIsReplaying(true);
      events.sort((a, b) => a.timestamp - b.timestamp);

      let currentIndex = 0;
      let activeReplayNodes = new Map();

      const playNextEvent = () => {
        if (currentIndex >= events.length) {
          setReplayStatus("Replay Finalizado.");
          return;
        }

        const event = events[currentIndex];
        
        if (event.type === 'JOIN') {
            const peer = event.peer;
            const zonePoints = waypoints[peer.zona] || waypoints['Zona A'];
            const startPt = zonePoints[Math.floor(Math.random() * zonePoints.length)];
            
            activeReplayNodes.set(peer.id, {
                ...peer,
                t: startPt.t,
                l: startPt.l,
                wpId: startPt.id
            });
        } else if (event.type === 'LEAVE') {
            activeReplayNodes.delete(event.peerId);
        }

        setReplayNodes(Array.from(activeReplayNodes.values()));
        currentIndex++;
        
        if (currentIndex < events.length) {
          const nextEvent = events[currentIndex];
          const timeDiff = nextEvent.timestamp - event.timestamp;
          const waitTime = Math.max(0, timeDiff / parseInt(replaySpeed));
          
          setReplayStatus(`Reproduciendo... Evento ${currentIndex}/${events.length} (${replaySpeed}x)`);
          setTimeout(playNextEvent, waitTime);
        } else {
          setReplayStatus("Replay Finalizado.");
        }
      };

      setReplayStatus("Iniciando Time-Lapse...");
      playNextEvent();
    });
  }, [replaySpeed]);


  let kpiLatencyIcon = "wifi_off";
  let kpiLatencyColor = "text-gray-400/80";
  let kpiLatencyGlow = "bg-gray-500/10";
  
  if (kpiLatency > 0) {
      if (kpiLatency < 50) { kpiLatencyIcon = "wifi"; kpiLatencyColor = "text-green-400/80"; kpiLatencyGlow = "bg-green-500/10"; }
      else if (kpiLatency <= 150) { kpiLatencyIcon = "network_wifi_2_bar"; kpiLatencyColor = "text-yellow-400/80"; kpiLatencyGlow = "bg-yellow-500/10"; }
      else { kpiLatencyIcon = "network_wifi_1_bar"; kpiLatencyColor = "text-red-400/80"; kpiLatencyGlow = "bg-red-500/10"; }
  }

  const sortedGames = Object.values(activeGames).sort((a,b) => b.time - a.time).slice(0, 5);
  const sortedTrivia = Object.entries(triviaScores).sort((a,b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-white p-4 md:p-8 overflow-y-auto overflow-x-hidden relative">
      <div id="animated-bg">
         {Array.from({length: 25}).map((_, i) => (
             <div key={i} className="rainbow-line" style={{
                 boxShadow: `-130px 0 80px 40px #13121d, -50px 0 50px 25px #ffb3ad, 0 0 50px 25px #e3bdba, 50px 0 50px 25px #69d8d4, 130px 0 80px 40px #13121d`,
                 animation: `slide-bg ${45 - (45/25/2*i)}s linear infinite`,
                 animationDelay: `${-(i/25*45)}s`
             }}></div>
         ))}
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255, 179, 173, 0.1) 0%, transparent 50%)"}}></div>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)", backgroundSize: "40px 40px"}}></div>

      <div className="relative z-10 flex-grow flex flex-col max-w-[1400px] w-full mx-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(255,179,173,0.3)]">
                    <span className="material-symbols-outlined text-primary text-3xl">hub</span>
                </div>
                <div>
                    <h1 className="font-logo text-3xl font-bold tracking-tight text-white uppercase">NodeMap <span className="text-primary">Pulse</span></h1>
                    <p className="text-white/60 text-sm font-medium tracking-widest uppercase">Estadísticas P2P en Vivo</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-black/20 p-2 border border-white/5">
                <select value={replaySpeed} onChange={e => setReplaySpeed(e.target.value)} className="bg-transparent border-none text-white/80 text-xs font-mono outline-none cursor-pointer">
                    <option value="10">10x Speed</option>
                    <option value="50">50x Speed</option>
                    <option value="100">100x Speed</option>
                    <option value="500">500x Speed</option>
                </select>
                <button onClick={startReplay} disabled={isReplaying} className="bg-primary/20 hover:bg-primary/40 border border-primary/50 text-primary px-4 py-1.5 font-bold text-sm tracking-wide transition-all flex items-center gap-2 shadow-[0_0_10px_rgba(255,179,173,0.2)] disabled:opacity-50">
                    <span className="material-symbols-outlined text-xl">history</span>
                    <span>{isReplaying ? "Cargando..." : "Replay del Día"}</span>
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Nodos Activos</p>
                        <h2 className="font-logo text-5xl font-bold text-white">{kpiNodes}</h2>
                    </div>
                    <span className="material-symbols-outlined text-primary/80 text-4xl">share_windows</span>
                </div>
            </div>
            
            <div className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Peak Simultáneo</p>
                        <h2 className="font-logo text-5xl font-bold text-white">{kpiPeak}</h2>
                    </div>
                    <span className="material-symbols-outlined text-secondary/80 text-4xl">trending_up</span>
                </div>
            </div>
            
            <div className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Tráfico Total (Msjs)</p>
                        <h2 className="font-logo text-5xl font-bold text-white">{kpiMessages}</h2>
                    </div>
                    <span className="material-symbols-outlined text-purple-400/80 text-4xl">swap_calls</span>
                </div>
            </div>
            
            <div className="glass-card p-6 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 ${kpiLatencyGlow}`}></div>
                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Calidad de Red</p>
                        <h2 className="font-logo text-5xl font-bold text-white flex items-center gap-1">{kpiLatency}<span className="text-xl text-white/50">ms</span></h2>
                    </div>
                    <span className={cn("material-symbols-outlined text-4xl transition-colors", kpiLatencyColor)}>{kpiLatencyIcon}</span>
                </div>
            </div>
        </div>

        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-[400px]">
            <div className="glass-card p-6 relative flex flex-col flex-grow md:w-2/3">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">bar_chart</span>
                        Flujo de Mensajes por Segundo
                    </h3>
                    <span className="text-xs font-mono text-white/50 bg-black/30 px-2 py-1">Últimos 60s</span>
                </div>
                <div ref={chartContainerRef} className="flex-grow w-full relative min-h-[200px]"></div>
            </div>

            <div className="glass-card p-6 relative flex flex-col md:w-1/3 bg-[#0a0a0f]/90 border-green-500/20">
                <div className="flex justify-between items-center mb-4 border-b border-green-500/20 pb-3">
                    <h3 className="font-mono text-green-400 font-bold text-sm tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400 text-lg">terminal</span>
                        E2EE PACKET SNIFFER
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 animate-ping"></div>
                    </div>
                </div>
                <div ref={terminalRef} className="flex-grow w-full h-0 overflow-y-auto font-mono text-[10px] sm:text-xs text-green-500/70 flex flex-col gap-2 scroll-smooth pr-2 pb-2 custom-scrollbar">
                    {terminalLogs.map((log) => (
                        log.type === 'info' ? (
                            <div key={log.id} className="text-green-500/40 italic">{log.text}</div>
                        ) : (
                            <div key={log.id} className="break-all bg-green-500/5 p-2 border border-green-500/10">
                                <div className="text-white/60 mb-1 flex justify-between">
                                    <span>[{log.time}] INBOUND_PACKET</span>
                                    <span className="text-yellow-400">{log.size} B</span>
                                </div>
                                {log.isSecure && <div className="text-green-400 font-bold mb-1">[SECURE E2EE PAYLOAD DETECTED]</div>}
                                <div className="text-green-500/70">{log.rawText}</div>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-4">
            <div className="glass-card p-6 relative flex flex-col">
                <h3 className="font-bold text-lg tracking-wide flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">forum</span>
                    Foros Multicast
                </h3>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-white/80 font-bold">Zona A</span>
                        <span className="font-mono text-2xl text-primary font-bold transition-transform">{forums['Zona A']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/80 font-bold">Zona B</span>
                        <span className="font-mono text-2xl text-secondary font-bold transition-transform">{forums['Zona B']}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/80 font-bold">Zona C</span>
                        <span className="font-mono text-2xl text-tertiary font-bold transition-transform">{forums['Zona C']}</span>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6 relative flex flex-col">
                <h3 className="font-bold text-lg tracking-wide flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-secondary">sports_esports</span>
                    Juegos en Vivo
                </h3>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                    {sortedGames.length === 0 ? (
                        <p className="text-white/50 text-sm font-mono italic">Buscando partidas P2P...</p>
                    ) : (
                        sortedGames.map((g, idx) => (
                            <div key={idx} className="glass-card-solid p-3 border border-secondary/20 flex justify-between items-center transition-all animate-fade-in">
                                <span className="text-[12px] font-bold text-white">{g.player1} <span className="text-secondary text-[10px]">VS</span> {g.player2}</span>
                                <span className="badge-chip px-2 py-1 text-[9px]">{g.type === 'reaction' ? 'Reacción' : g.type}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="glass-card p-6 relative flex flex-col border border-tertiary/20 shadow-[0_0_20px_rgba(105,216,212,0.1)]">
                <h3 className="font-bold text-lg tracking-wide flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-tertiary">emoji_events</span>
                    Top Trivia
                </h3>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                    {sortedTrivia.length === 0 ? (
                        <p className="text-white/50 text-sm font-mono italic">A la espera de Trivia...</p>
                    ) : (
                        sortedTrivia.map((entry, idx) => (
                            <div key={idx} className={cn("glass-card-solid p-2 flex items-center justify-between border transition-all animate-fade-in", idx===0 ? "border-tertiary" : "border-white/10")}>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold text-tertiary">#{idx+1}</span>
                                    <span className="text-[13px] font-bold text-white">{entry[0]}</span>
                                </div>
                                <span className="font-mono text-tertiary text-[12px]">{entry[1]} pts</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {isReplaying && (
        <div className="fixed inset-0 z-50 bg-[#13121d]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8">
            <div className="flex justify-between items-center w-full max-w-5xl mb-6">
                <div>
                    <h2 className="font-logo text-3xl md:text-5xl text-primary font-bold tracking-tight">Time-Lapse: <span className="text-white">Red P2P</span></h2>
                    <p className="text-white/60 font-mono mt-2">{replayStatus}</p>
                </div>
                <button onClick={() => setIsReplaying(false)} className="w-12 h-12 bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center border border-red-500/30 transition-all">
                    <span className="material-symbols-outlined text-3xl">close</span>
                </button>
            </div>
            
            <div className="relative w-full max-w-5xl h-[60vh] md:h-[70vh] bg-[#0e0d18] border border-primary/30 overflow-hidden shadow-[0_0_50px_rgba(255,84,81,0.15)]">
                <div className="absolute inset-0 z-0 grid grid-cols-[1fr_0.5fr_2fr_0.5fr_1fr] gap-1 p-2 pointer-events-none blueprint-grid font-mono">
                    <div className="zone-left h-full w-full border-r border-primary/20 relative" style={{gridColumn: '1 / 3'}}>
                        <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona A</div>
                    </div>
                    <div className="zone-center h-full w-full border-r border-primary/20 relative" style={{gridColumn: '3 / 4'}}>
                        <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona B</div>
                    </div>
                    <div className="zone-right h-full w-full relative" style={{gridColumn: '4 / 6'}}>
                        <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona C</div>
                    </div>
                </div>
                
                <div className="absolute inset-0 z-0 blueprint-grid font-mono gap-1 p-2 pointer-events-none opacity-80" style={{background: 'transparent'}}>
                    <div className="blueprint-room z-10" style={{gridArea: '1 / 1 / 3 / 2'}}>Aula 6</div>
                    <div className="blueprint-room z-10" style={{gridArea: '3 / 1 / 5 / 2'}}>Aula 5</div>
                    <div className="blueprint-room z-10" style={{gridArea: '5 / 1 / 7 / 2'}}>Aula 4</div>
                    <div className="blueprint-room z-10" style={{gridArea: '7 / 1 / 9 / 2'}}>Aula 3</div>
                    <div className="blueprint-room z-10" style={{gridArea: '9 / 1 / 11 / 2'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '11 / 1 / 13 / 2'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '13 / 1 / 15 / 2'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '15 / 1 / 17 / 2'}}>Almacen</div>
                    <div className="blueprint-pasillo z-10" style={{gridArea: '1 / 2 / 17 / 3', writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>Pasillo</div>
                    <div className="blueprint-room z-10" style={{gridArea: '1 / 3 / 3 / 4'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '3 / 3 / 5 / 4'}}>Servicio Comunitario</div>
                    <div className="blueprint-room z-10" style={{gridArea: '5 / 3 / 7 / 4'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '7 / 3 / 9 / 4'}}>Laboratorio</div>
                    <div className="flex gap-1 z-10" style={{gridArea: '9 / 3 / 11 / 4'}}>
                        <div className="blueprint-room blueprint-stairs flex-1"><span className="bg-[#1f1e2a]/80 px-1 py-0.5">Escaleras</span></div>
                        <div className="blueprint-room blueprint-stairs flex-1"><span className="bg-[#1f1e2a]/80 px-1 py-0.5">Escaleras</span></div>
                    </div>
                    <div className="blueprint-room z-10" style={{gridArea: '11 / 3 / 14 / 4'}}>Laboratorio de Computación</div>
                    <div className="blueprint-room z-10" style={{gridArea: '14 / 3 / 17 / 4'}}>Laboratorio de Robótica</div>
                    <div className="blueprint-pasillo z-10" style={{gridArea: '1 / 4 / 17 / 5', writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>Pasillo</div>
                    <div className="blueprint-room z-10" style={{gridArea: '1 / 5 / 4 / 6'}}>Telecomunicaciones</div>
                    <div className="blueprint-room z-10" style={{gridArea: '4 / 5 / 6 / 6'}}>Baños</div>
                    <div className="blueprint-room z-10" style={{gridArea: '6 / 5 / 9 / 6'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '9 / 5 / 11 / 6'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '11 / 5 / 13 / 6'}}>Laboratorio</div>
                    <div className="blueprint-room z-10" style={{gridArea: '13 / 5 / 17 / 6'}}>Oficinas</div>
                    <div className="flex items-center justify-center text-white/40 font-mono text-[11px] pb-2 pt-1 uppercase tracking-[0.12em] z-10" style={{gridArea: '17 / 1 / 18 / 6', borderTop: '1px dashed rgba(255,255,255,0.1)'}}>
                        Entrada
                    </div>
                </div>
                
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute w-16 h-16 border-2 border-primary bg-primary/20 flex items-center justify-center z-0 backdrop-blur-sm pointer-events-auto shadow-[0_0_15px_rgba(255,84,81,0.3)]" style={{left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
                        <span className="material-symbols-outlined text-primary text-2xl">router</span>
                    </div>

                    {replayNodes.map(node => (
                        <div key={node.id} className="absolute w-8 h-8 border backdrop-blur-sm flex items-center justify-center z-10 shadow-md transition-all duration-[400ms]"
                             style={{borderColor: node.color || '#ffb3ad', backgroundColor: `${node.color || '#ffb3ad'}20`, transform: 'translate(-50%, -50%)', top: `${node.t}%`, left: `${node.l}%`}}>
                            <span className="text-[14px]">{node.avatar || node.nombre?.charAt(0).toUpperCase()}</span>
                            <div className="absolute -bottom-4 whitespace-nowrap font-mono text-[8px] text-white/70 bg-black/50 px-1">{node.nombre}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
