import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTCStore } from '../../store/useWebRTCStore';
import PROTOCOL from '../../shared/protocol';

export function DominoGame({ initialState, onExit }) {
  const myId = useWebRTCStore(state => state.myId);
  const addPoints = useWebRTCStore(state => state.addPoints);
  
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const [board, setBoard] = useState([]); // [{ tile: [a,b], end: 'head'|'tail' }]
  const [boardHead, setBoardHead] = useState(null); // The exposed number on the left
  const [boardTail, setBoardTail] = useState(null); // The exposed number on the right
  
  const [myHand, setMyHand] = useState(initialState.hands[myId] || []);
  const [players, setPlayers] = useState(initialState.players);
  const [turnIndex, setTurnIndex] = useState(initialState.turnIndex);
  
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [resultMsg, setResultMsg] = useState('');
  
  // To track opponents' tile counts
  const [handsCount, setHandsCount] = useState({
    [players[0].id]: 7,
    [players[1].id]: 7,
    [players[2].id]: 7,
    [players[3].id]: 7,
  });

  const myIndex = players.findIndex(p => p.id === myId);
  const isMyTurn = turnIndex === myIndex;

  useEffect(() => {
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      const handleAction = (data) => {
        if (data.type === 'PLAY') {
          applyPlay(data.playerId, data.tile, data.end);
        } else if (data.type === 'PASS') {
          applyPass(data.playerId);
        }
      };
      
      WebRTCEngine.onMessage(PROTOCOL.DOMINO_ACTION, handleAction);
    });
  }, [boardHead, boardTail, turnIndex, handsCount]);

  const advanceTurn = () => {
    setTurnIndex(prev => (prev + 1) % 4);
  };

  const applyPlay = (playerId, tile, end) => {
    setConsecutivePasses(0);
    
    // Update hands count
    setHandsCount(prev => ({ ...prev, [playerId]: prev[playerId] - 1 }));

    // Update board
    let newHead = boardHead;
    let newTail = boardTail;

    if (board.length === 0) {
      newHead = tile[0];
      newTail = tile[1];
      setBoard([{ tile, end: 'first' }]);
    } else {
      if (end === 'head') {
        newHead = tile[0] === boardHead ? tile[1] : tile[0];
        setBoard(prev => [{ tile, end: 'head' }, ...prev]);
      } else {
        newTail = tile[0] === boardTail ? tile[1] : tile[0];
        setBoard(prev => [...prev, { tile, end: 'tail' }]);
      }
    }
    
    setBoardHead(newHead);
    setBoardTail(newTail);
    
    // Check win condition
    if (handsCount[playerId] - 1 === 0) {
      handleWin(playerId, 'DOMINO');
      return;
    }

    advanceTurn();
  };

  const applyPass = (playerId) => {
    const newPasses = consecutivePasses + 1;
    setConsecutivePasses(newPasses);
    
    if (newPasses >= 4) {
      handleWin(null, 'BLOCKED');
    } else {
      advanceTurn();
    }
  };

  const handleWin = (winnerId, reason) => {
    setGameState('finished');
    if (reason === 'DOMINO') {
      const winnerIndex = players.findIndex(p => p.id === winnerId);
      const isMyTeam = (winnerIndex % 2) === (myIndex % 2);
      
      if (isMyTeam) {
        setResultMsg(`¡DOMINÓ! Ganó el Equipo ${winnerIndex % 2 === 0 ? 'A' : 'B'}.\nGanaste +200 pts.`);
        addPoints(200);
      } else {
        setResultMsg(`¡DOMINÓ! Ganó el Equipo ${winnerIndex % 2 === 0 ? 'A' : 'B'}. Pierdes.`);
      }
    } else if (reason === 'BLOCKED') {
      setResultMsg('¡JUEGO TRANCADO! \nCalculando puntos (en una versión real sumaríamos las fichas).\nPor ahora, empate.');
    }
  };

  const canPlayTile = (tile) => {
    if (board.length === 0) return true;
    return tile[0] === boardHead || tile[1] === boardHead || tile[0] === boardTail || tile[1] === boardTail;
  };

  const hasValidMoves = () => {
    return myHand.some(t => canPlayTile(t));
  };

  const playTile = (tile) => {
    if (!isMyTurn) return;
    
    let end = null;
    if (board.length === 0) {
      end = 'first';
    } else {
      const canHead = tile[0] === boardHead || tile[1] === boardHead;
      const canTail = tile[0] === boardTail || tile[1] === boardTail;
      
      if (canHead && canTail && boardHead !== boardTail) {
        // En un juego completo habría UI para elegir. Aquí elegimos 'tail' por defecto si coinciden ambos para simplificar
        end = 'tail'; 
      } else if (canHead) {
        end = 'head';
      } else if (canTail) {
        end = 'tail';
      } else {
        return; // Invalid
      }
    }

    // Remove from my hand
    const newHand = myHand.filter(t => !(t[0] === tile[0] && t[1] === tile[1]));
    setMyHand(newHand);

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      const action = { type: 'PLAY', playerId: myId, tile, end };
      players.forEach(p => {
        if (p.id !== myId) WebRTCEngine.sendMessage(p.id, PROTOCOL.DOMINO_ACTION, action);
      });
      applyPlay(myId, tile, end);
    });
  };

  const passTurn = () => {
    if (!isMyTurn) return;
    if (hasValidMoves()) {
        alert("¡Tienes fichas válidas para jugar! No puedes pasar.");
        return;
    }
    
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      const action = { type: 'PASS', playerId: myId };
      players.forEach(p => {
        if (p.id !== myId) WebRTCEngine.sendMessage(p.id, PROTOCOL.DOMINO_ACTION, action);
      });
      applyPass(myId);
    });
  };

  const DominoPiece = ({ tile, isHorizontal }) => {
    return (
        <div className={`bg-slate-100 rounded-md border border-slate-300 shadow-md flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center justify-center overflow-hidden`} style={{ width: isHorizontal ? '80px' : '40px', height: isHorizontal ? '40px' : '80px'}}>
            <div className={`flex-1 flex items-center justify-center font-bold text-xl text-black ${isHorizontal ? 'border-r border-slate-300' : 'border-b border-slate-300'} w-full h-full`}>
                {tile[0]}
            </div>
            <div className="flex-1 flex items-center justify-center font-bold text-xl text-black w-full h-full">
                {tile[1]}
            </div>
        </div>
    );
  };

  // Helper para dibujar las fichas en la mesa secuencialmente
  const renderBoard = () => {
      if (board.length === 0) return <div className="text-white/30 italic">La mesa está vacía. Juega cualquier ficha.</div>;
      
      return (
          <div className="flex flex-wrap items-center justify-center gap-1 p-4 bg-green-800/30 rounded-xl min-h-[200px] border border-green-500/20 shadow-inner">
             {board.map((move, idx) => {
                 const isDouble = move.tile[0] === move.tile[1];
                 return (
                     <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <DominoPiece tile={move.tile} isHorizontal={!isDouble} />
                     </motion.div>
                 );
             })}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-[#1a4a38] border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-white">Dominó 2v2</h2>
          <p className="text-[12px] text-white/60">Equipo A: {players[0].name} y {players[2].name} | Equipo B: {players[1].name} y {players[3].name}</p>
        </div>
        <button onClick={onExit} className="btn-ghost text-white hover:bg-white/10 px-3 py-1 text-xs">Salir</button>
      </div>

      {gameState === 'finished' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface p-8 rounded-xl border border-primary text-center max-w-sm">
                <span className="material-symbols-outlined text-6xl text-yellow-500 mb-4">emoji_events</span>
                <h3 className="text-2xl font-bold text-white mb-4 whitespace-pre-line">{resultMsg}</h3>
                <button onClick={onExit} className="btn-primary w-full py-3">Volver al Arcade</button>
            </div>
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col justify-between relative overflow-y-auto">
        
        {/* Opponents Status Top/Sides */}
        <div className="flex justify-between px-4 mb-4">
            {[0, 1, 2, 3].map(i => {
                if (i === myIndex) return null;
                const p = players[i];
                const active = turnIndex === i;
                return (
                    <div key={i} className={`flex flex-col items-center p-2 rounded ${active ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-black/20'}`}>
                        <span className={`font-bold ${active ? 'text-yellow-400' : 'text-white'}`}>{p.name}</span>
                        <span className="text-xs text-white/50">{handsCount[p.id]} fichas</span>
                    </div>
                );
            })}
        </div>

        {/* Board */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 w-full overflow-x-auto">
            {renderBoard()}
        </div>

        {/* Action / Turn indicator */}
        <div className="text-center mb-4">
            {isMyTurn ? (
                <div className="inline-block bg-yellow-500 text-black font-bold px-6 py-2 rounded-full animate-bounce">
                    ¡Es tu turno!
                </div>
            ) : (
                <div className="inline-block bg-black/40 text-white font-bold px-6 py-2 rounded-full">
                    Turno de {players[turnIndex].name}...
                </div>
            )}
        </div>

        {/* My Hand */}
        <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex flex-col items-center">
            <h4 className="text-white/60 text-sm mb-3">Tus fichas</h4>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
                {myHand.map((tile, idx) => {
                    const valid = isMyTurn && canPlayTile(tile);
                    return (
                        <button 
                            key={idx} 
                            onClick={() => playTile(tile)}
                            disabled={!valid}
                            className={`transition-transform hover:-translate-y-2 ${valid ? 'opacity-100 cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <DominoPiece tile={tile} isHorizontal={false} />
                        </button>
                    );
                })}
            </div>
            {isMyTurn && !hasValidMoves() && (
                <button onClick={passTurn} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-8 rounded-full shadow-lg animate-pulse">
                    Pasar Turno
                </button>
            )}
        </div>

      </div>
    </div>
  );
}
