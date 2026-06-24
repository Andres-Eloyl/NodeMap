import React, { useState, useEffect } from 'react';
import { useWebRTCStore } from '../../store/useWebRTCStore';
import PROTOCOL from '../../shared/protocol';

export function DominoLobby({ onStartGame, onExit }) {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const myName = useWebRTCStore(state => state.myName);
  
  const [isHost, setIsHost] = useState(true);
  const [hostId, setHostId] = useState(myId);
  const [players, setPlayers] = useState([{ id: myId, name: myName, isHost: true }]);
  const [invited, setInvited] = useState([]);

  useEffect(() => {
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      // Listen for accepts
      const handleAccept = (data) => {
        if (!isHost) return;
        setPlayers(prev => {
          if (prev.find(p => p.id === data.senderId)) return prev;
          if (prev.length >= 4) return prev; // Lobby full
          return [...prev, { id: data.senderId, name: data.nombre }];
        });
      };
      
      WebRTCEngine.onMessage(PROTOCOL.DOMINO_ACCEPT, handleAccept);
      
      return () => {
        // In a real app we would remove the listener, but we'll let it be for now since we rely on component unmount
      };
    });
  }, [isHost]);

  const invitePlayer = (peer) => {
    if (players.length >= 4) return;
    setInvited(prev => [...prev, peer.id]);
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(peer.id, PROTOCOL.DOMINO_INVITE, { hostId: myId, nombre: myName });
    });
  };

  const kickPlayer = (id) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setInvited(prev => prev.filter(pid => pid !== id));
  };

  const startGame = () => {
    if (players.length !== 4) return;
    
    // Generate dominoes
    let dominoes = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        dominoes.push([i, j]);
      }
    }
    // Shuffle
    dominoes = dominoes.sort(() => Math.random() - 0.5);
    
    // Deal 7 to each
    const hands = {};
    players.forEach((p, idx) => {
      hands[p.id] = dominoes.slice(idx * 7, (idx + 1) * 7);
    });

    // Determine who starts (Highest double, or default to player 0)
    // Find double 6
    let startingPlayerIndex = 0;
    for (let i = 0; i < players.length; i++) {
        if (hands[players[i].id].some(d => d[0] === 6 && d[1] === 6)) {
            startingPlayerIndex = i;
            break;
        }
    }

    const gameState = {
      players: players.map(p => ({ id: p.id, name: p.name })),
      hands,
      turnIndex: startingPlayerIndex,
      board: []
    };

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      players.forEach(p => {
        if (p.id !== myId) {
          WebRTCEngine.sendMessage(p.id, PROTOCOL.DOMINO_START, gameState);
        }
      });
      onStartGame(gameState);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1a365d] border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-white">Lobby: Dominó 2v2</h2>
          <p className="text-[12px] text-white/60">Reúne a 4 jugadores</p>
        </div>
        <button onClick={onExit} className="btn-ghost text-white hover:bg-white/10 px-3 py-1 text-xs">Salir</button>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
        
        {/* Mesa Virtual */}
        <div className="glass-card p-6 bg-black/20 flex flex-col items-center">
            <h3 className="text-xl font-bold text-white mb-4">Jugadores en la Mesa ({players.length}/4)</h3>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {[0, 1, 2, 3].map(i => {
                    const p = players[i];
                    return (
                        <div key={i} className={`p-4 rounded-xl border flex flex-col items-center justify-center min-h-[100px] transition-all ${p ? 'bg-primary/20 border-primary text-white' : 'bg-surface-variant/20 border-outline-variant/30 text-white/30 border-dashed'}`}>
                            {p ? (
                                <>
                                    <span className="material-symbols-outlined text-3xl mb-2">{i % 2 === 0 ? 'group' : 'group'}</span>
                                    <span className="font-bold text-center">{p.name}</span>
                                    <span className="text-xs opacity-70">Equipo {i % 2 === 0 ? 'A' : 'B'}</span>
                                    {p.id !== myId && isHost && (
                                        <button onClick={() => kickPlayer(p.id)} className="mt-2 text-xs text-red-400 hover:text-red-300">Expulsar</button>
                                    )}
                                </>
                            ) : (
                                <span>Esperando...</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {isHost && players.length === 4 && (
                <button onClick={startGame} className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg animate-pulse">
                    ¡EMPEZAR PARTIDA!
                </button>
            )}
        </div>

        {/* Lista para invitar */}
        {isHost && players.length < 4 && (
            <div className="glass-card p-4">
                <h3 className="font-bold text-white mb-3">Invitar Jugadores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {peers.filter(p => !players.find(pl => pl.id === p.id)).map(peer => (
                        <div key={peer.id} className="flex items-center justify-between p-3 bg-surface-variant/30 rounded border border-white/5">
                            <span className="text-white font-medium">{peer.nombre}</span>
                            <button 
                                onClick={() => invitePlayer(peer)}
                                disabled={invited.includes(peer.id)}
                                className={`px-3 py-1 rounded text-xs font-bold ${invited.includes(peer.id) ? 'bg-surface text-white/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {invited.includes(peer.id) ? 'Invitado' : 'Invitar'}
                            </button>
                        </div>
                    ))}
                    {peers.length === 0 && <p className="text-white/50 text-sm">No hay más jugadores conectados.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
