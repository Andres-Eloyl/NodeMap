import { useEffect, useState, useRef } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import PROTOCOL from '../shared/protocol.js';
import { getMacroZone } from '../shared/zones.js';

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
    ],
    'Zona C': [
        { id: 'pd1', t: 10, l: 75, edges: ['pd2', 'o1'] },
        { id: 'pd2', t: 30, l: 75, edges: ['pd1', 'pd3', 'o2'] },
        { id: 'pd3', t: 50, l: 75, edges: ['pd2', 'pd4', 'o3'] },
        { id: 'pd4', t: 70, l: 75, edges: ['pd3', 'pd5', 'o4'] },
        { id: 'pd5', t: 90, l: 75, edges: ['pd4', 'o5'] },
        { id: 'o1', t: 15, l: 88, edges: ['pd1'] },
        { id: 'o2', t: 35, l: 88, edges: ['pd2'] },
        { id: 'o3', t: 55, l: 88, edges: ['pd3'] },
        { id: 'o4', t: 75, l: 88, edges: ['pd4'] },
        { id: 'o5', t: 85, l: 88, edges: ['pd5'] },
    ]
};

const roomWaypoints = {
    'Aula 6': [{ id: 'rm1', t: 5, l: 10, edges: [] }],
    'Aula 5': [{ id: 'rm2', t: 20, l: 10, edges: [] }],
    'Aula 4': [{ id: 'rm3', t: 32, l: 10, edges: [] }],
    'Aula 3': [{ id: 'rm4', t: 45, l: 10, edges: [] }],
    'Laboratorio 1': [{ id: 'rm5', t: 57, l: 10, edges: [] }],
    'Laboratorio 2': [{ id: 'rm6', t: 70, l: 10, edges: [] }],
    'Laboratorio 3': [{ id: 'rm7', t: 82, l: 10, edges: [] }],
    'Almacen': [{ id: 'rm8', t: 90, l: 10, edges: [] }],
    'Laboratorio 4': [{ id: 'rm9', t: 5, l: 50, edges: [] }],
    'Servicio Comunitario': [{ id: 'rm10', t: 20, l: 50, edges: [] }],
    'Laboratorio 5': [{ id: 'rm11', t: 32, l: 50, edges: [] }],
    'Laboratorio 6': [{ id: 'rm12', t: 45, l: 50, edges: [] }],
    'Lab Computación': [{ id: 'rm13', t: 73, l: 50, edges: [] }],
    'Lab Robótica': [{ id: 'rm14', t: 90, l: 50, edges: [] }],
    'Telecomunicaciones': [{ id: 'rm15', t: 10, l: 90, edges: [] }],
    'Baños': [{ id: 'rm16', t: 25, l: 90, edges: [] }],
    'Laboratorio 7': [{ id: 'rm17', t: 40, l: 90, edges: [] }],
    'Laboratorio 8': [{ id: 'rm18', t: 57, l: 90, edges: [] }],
    'Laboratorio 9': [{ id: 'rm19', t: 70, l: 90, edges: [] }],
    'Oficinas': [{ id: 'rm20', t: 90, l: 90, edges: [] }],
    'Pasillo Central': [{ id: 'rm21', t: 50, l: 25, edges: [] }],
    'Pasillo Este': [{ id: 'rm22', t: 50, l: 75, edges: [] }],
};

function PeerNode({ peer }) {
  const [pos, setPos] = useState({ t: 50, l: 50 });
  const wpIdRef = useRef(null);
  const syncPos = useWebRTCStore(state => state.syncPos);

  // Sync position from network if it's a remote peer
  useEffect(() => {
    if (!peer.isSelf && peer.pos) {
      setPos({ t: peer.pos.t, l: peer.pos.l });
    }
  }, [peer.pos, peer.isSelf]);

  useEffect(() => {
    // Only the owner calculates movement
    if (!peer.isSelf) return;

    let points = waypoints[peer.zona];
    if (!points) {
        points = roomWaypoints[peer.zona];
    }
    if (!points) {
        points = waypoints['Zona A'];
    }

    const startPt = points[Math.floor(Math.random() * points.length)];
    setPos({ t: startPt.t, l: startPt.l });
    wpIdRef.current = startPt.id;
    syncPos(startPt.t, startPt.l);

    const interval = setInterval(() => {
      const currentPt = points.find(p => p.id === wpIdRef.current);
      if (currentPt && currentPt.edges && currentPt.edges.length > 0) {
        const nextId = currentPt.edges[Math.floor(Math.random() * currentPt.edges.length)];
        const nextPt = points.find(p => p.id === nextId);
        if (nextPt) {
          wpIdRef.current = nextId;
          const rT = nextPt.t + (Math.random() * 4 - 2);
          const rL = nextPt.l + (Math.random() * 2 - 1);
          setPos({ t: rT, l: rL });
          syncPos(rT, rL);
        }
      } else {
        // If no edges (like inside a room), just drift slightly
        setPos(prev => {
            const newT = Math.max(0, Math.min(100, prev.t + (Math.random() * 4 - 2)));
            const newL = Math.max(0, Math.min(100, prev.l + (Math.random() * 4 - 2)));
            syncPos(newT, newL);
            return { t: newT, l: newL };
        });
      }
    }, 6000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [peer.zona, peer.isSelf, syncPos]);

  return (
    <div 
      className="absolute w-9 h-9 border backdrop-blur-sm flex items-center justify-center z-10 shadow-md transition-all duration-[6000ms] ease-linear pointer-events-auto group"
      style={{
        top: `${pos.t}%`, left: `${pos.l}%`, transform: 'translate(-50%, -50%)',
        borderColor: peer.color || '#ffb3ad',
        backgroundColor: peer.isSelf ? peer.color : `${peer.color || '#ffb3ad'}20`
      }}
    >
      <span className="text-[16px] font-bold">{peer.avatar || (peer.nombre ? peer.nombre.charAt(0).toUpperCase() : '?')}</span>
      <div className="absolute -bottom-6 whitespace-nowrap font-label-mono text-[9px] text-on-surface-variant/90 bg-surface/90 backdrop-blur-sm px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {peer.nombre} {peer.latency ? `(${peer.latency}ms)` : ''}
      </div>
    </div>
  );
}

export function MapView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const myName = useWebRTCStore(state => state.myName);
  const myAvatar = useWebRTCStore(state => state.myAvatar);
  const myZone = useWebRTCStore(state => state.zone);
  const changeZone = useWebRTCStore(state => state.changeZone);
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState({});

  useEffect(() => {
    let localInterval;
    let syncInterval;

    if (myId && myZone) {
      // Init local CRDT
      localInterval = setInterval(() => {
        setHeatmapData(prev => {
          const next = { ...prev };
          if (!next[myId]) next[myId] = {};
          next[myId][myZone] = (next[myId][myZone] || 0) + 1;
          return next;
        });
      }, 1000);

      syncInterval = setInterval(() => {
        setHeatmapData(currentData => {
          import('../services/webrtc.js').then(({ WebRTCEngine }) => {
            WebRTCEngine.broadcast(PROTOCOL.HEATMAP_SYNC, currentData);
          });
          return currentData;
        });
      }, 5000);

      import('../services/webrtc.js').then(({ WebRTCEngine }) => {
        WebRTCEngine.onMessage(PROTOCOL.HEATMAP_SYNC, (data) => {
          setHeatmapData(prev => {
            const next = { ...prev };
            for (const peerId in data) {
              if (!next[peerId]) next[peerId] = {};
              for (const z in data[peerId]) {
                next[peerId][z] = Math.max(next[peerId][z] || 0, data[peerId][z]);
              }
            }
            return next;
          });
        });
      });
    }

    return () => {
      clearInterval(localInterval);
      clearInterval(syncInterval);
    };
  }, [myId, myZone]);

  const totals = {};
  for (const p in heatmapData) {
    for (const z in heatmapData[p]) {
      const macro = getMacroZone(z);
      totals[macro] = (totals[macro] || 0) + heatmapData[p][z];
    }
  }
  let maxScore = Math.max(...Object.values(totals), 0);

  const getZoneStyle = (zName, colorRgb) => {
    if (!isHeatmap) return {};
    const score = totals[zName] || 0;
    const intensity = maxScore > 0 ? score / maxScore : 0;
    if (intensity > 0) {
      return {
        backgroundColor: `rgba(${colorRgb}, ${0.05 + intensity * 0.25})`,
        boxShadow: intensity > 0.2 ? `inset 0 0 ${intensity * 40}px rgba(${colorRgb}, ${intensity * 0.5})` : 'none'
      };
    }
    return {};
  };

  const sortedZones = Object.keys(totals).map(z => ({ name: z, score: totals[z] })).sort((a,b) => b.score - a.score).slice(0, 5);

  const allNodes = [
    { id: myId, nombre: myName || 'Yo', zona: myZone, isSelf: true, color: '#ffb3ad', avatar: myAvatar || (myName ? myName.charAt(0).toUpperCase() : 'Y') },
    ...peers.map(p => {
        let lat = null;
        // In a real app we would pull latency from WebRTCEngine.getLatency(p.id)
        // Since we don't have access to the instance synchronously easily, we mock or omit it.
        return { ...p, isSelf: false, latency: lat };
    })
  ];

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface/50 backdrop-blur-md flex justify-between items-center z-20">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">Mapa P2P</h2>
          <p className="text-[12px] text-on-surface-variant">Zona Actual: <span className="text-primary font-bold">{getMacroZone(myZone)} {myZone !== getMacroZone(myZone) ? `(${myZone})` : ''}</span></p>
        </div>
        <button 
          onClick={() => setIsHeatmap(!isHeatmap)}
          className={`px-3 py-1.5 border flex items-center gap-2 text-sm transition-colors ${isHeatmap ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/30 text-on-surface-variant/70 bg-black/20'}`}
        >
          <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
          <span className="hidden md:inline">Heatmap</span>
        </button>
      </div>

      <div className="flex-1 relative overflow-auto p-2 md:p-4 bg-transparent">
        
        {isHeatmap && (
          <div className="absolute top-4 right-4 md:right-8 w-[220px] md:w-[260px] glass-card-solid p-3 shadow-2xl z-30 animate-fade-in pointer-events-none">
            <h3 className="font-headline-sm text-primary mb-2 flex items-center gap-2 border-b border-outline-variant/30 pb-2 text-[13px]">
              <span className="material-symbols-outlined text-[16px]">leaderboard</span> Top Zonas
            </h3>
            <div className="flex flex-col gap-1.5">
              {sortedZones.length === 0 ? (
                <div className="text-center text-on-surface-variant/40 text-[11px] font-label-mono mt-2">Sin datos aún</div>
              ) : (
                sortedZones.map((z, idx) => (
                  <div key={z.name} className="flex items-center justify-between p-2 bg-surface/40 border border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px]" style={{ color: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : '#b45309' }}>#{idx + 1}</span>
                      <span className="font-headline-md text-[13px] text-on-surface">{z.name}</span>
                    </div>
                    <span className="font-label-mono text-[11px] text-white/60 bg-black/30 px-1.5 py-0.5">{Math.floor(z.score)}s</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="relative w-full h-full min-w-[600px] min-h-[600px] m-auto z-0 blueprint-grid font-label-mono border border-outline-variant/40 shadow-lg gap-1 p-2">
          
          <div className="absolute inset-0 z-0 grid grid-cols-[1fr_0.5fr_2fr_0.5fr_1fr] gap-1 p-2 pointer-events-none">
            <div className="zone-left h-full w-full border-r border-primary/20 relative transition-all duration-[800ms]" style={{ gridColumn: '1 / 3', ...getZoneStyle('Zona A', '255, 179, 173') }}>
                <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona A</div>
            </div>
            <div className="zone-center h-full w-full border-r border-primary/20 relative transition-all duration-[800ms]" style={{ gridColumn: '3 / 4', ...getZoneStyle('Zona B', '68, 226, 205') }}>
                <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona B</div>
            </div>
            <div className="zone-right h-full w-full relative transition-all duration-[800ms]" style={{ gridColumn: '4 / 6', ...getZoneStyle('Zona C', '255, 84, 81') }}>
                <div className="absolute top-2 left-2 text-[10px] text-primary/50 tracking-widest uppercase font-bold z-0">Zona C</div>
            </div>
          </div>

          {/* Habitaciones del blueprint (igual que peer.html) */}
          <div onClick={() => changeZone('Aula 6')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '1 / 1 / 3 / 2' }}>Aula 6</div>
          <div onClick={() => changeZone('Aula 5')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '3 / 1 / 5 / 2' }}>Aula 5</div>
          <div onClick={() => changeZone('Aula 4')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '5 / 1 / 7 / 2' }}>Aula 4</div>
          <div onClick={() => changeZone('Aula 3')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '7 / 1 / 9 / 2' }}>Aula 3</div>
          <div onClick={() => changeZone('Laboratorio 1')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '9 / 1 / 11 / 2' }}>Laboratorio</div>
          <div onClick={() => changeZone('Laboratorio 2')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '11 / 1 / 13 / 2' }}>Laboratorio</div>
          <div onClick={() => changeZone('Laboratorio 3')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '13 / 1 / 15 / 2' }}>Laboratorio</div>
          <div onClick={() => changeZone('Almacen')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '15 / 1 / 17 / 2' }}>Almacen</div>
          <div onClick={() => changeZone('Pasillo Central')} className="blueprint-pasillo z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '1 / 2 / 17 / 3', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Pasillo</div>
          <div onClick={() => changeZone('Laboratorio 4')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '1 / 3 / 3 / 4' }}>Laboratorio</div>
          <div onClick={() => changeZone('Servicio Comunitario')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '3 / 3 / 5 / 4' }}>Servicio Comunitario</div>
          <div onClick={() => changeZone('Laboratorio 5')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '5 / 3 / 7 / 4' }}>Laboratorio</div>
          <div onClick={() => changeZone('Laboratorio 6')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '7 / 3 / 9 / 4' }}>Laboratorio</div>
          <div className="flex gap-1 z-10" style={{ gridArea: '9 / 3 / 11 / 4' }}>
              <div className="blueprint-room blueprint-stairs flex-1"><span className="bg-surface-container/80 px-1 py-0.5">Escaleras</span></div>
              <div className="blueprint-room blueprint-stairs flex-1"><span className="bg-surface-container/80 px-1 py-0.5">Escaleras</span></div>
          </div>
          <div onClick={() => changeZone('Lab Computación')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '11 / 3 / 14 / 4' }}>Lab Computación</div>
          <div onClick={() => changeZone('Lab Robótica')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '14 / 3 / 17 / 4' }}>Lab Robótica</div>
          <div onClick={() => changeZone('Pasillo Este')} className="blueprint-pasillo z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '1 / 4 / 17 / 5', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Pasillo</div>
          <div onClick={() => changeZone('Telecomunicaciones')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '1 / 5 / 4 / 6' }}>Telecomunicaciones</div>
          <div onClick={() => changeZone('Baños')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '4 / 5 / 6 / 6' }}>Baños</div>
          <div onClick={() => changeZone('Laboratorio 7')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '6 / 5 / 9 / 6' }}>Laboratorio</div>
          <div onClick={() => changeZone('Laboratorio 8')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '9 / 5 / 11 / 6' }}>Laboratorio</div>
          <div onClick={() => changeZone('Laboratorio 9')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '11 / 5 / 13 / 6' }}>Laboratorio</div>
          <div onClick={() => changeZone('Oficinas')} className="blueprint-room z-10 cursor-pointer hover:bg-primary/20 transition-colors" style={{ gridArea: '13 / 5 / 17 / 6' }}>Oficinas</div>
          <div className="flex items-center justify-center text-outline/60 font-label-mono text-[11px] pb-2 pt-1 uppercase tracking-[0.12em] z-10 border-t border-dashed border-outline/30" style={{ gridArea: '17 / 1 / 18 / 6' }}>
              Entrada
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            {allNodes.map(p => <PeerNode key={p.id} peer={p} />)}
            <div className="absolute w-12 h-12 md:w-16 md:h-16 border-2 border-primary bg-primary/20 flex items-center justify-center map-zone-glow z-0 backdrop-blur-sm pointer-events-auto" style={{ left: '50%', top: '53%', transform: 'translate(-50%, -50%)' }}>
              <span className="material-symbols-outlined text-primary">my_location</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
