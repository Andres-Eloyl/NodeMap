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
  const [pendingChoice, setPendingChoice] = useState(null); // { tile }
  
  // To track opponents' tile counts
  const [handsCount, setHandsCount] = useState({
    [players[0].id]: 7,
    [players[1].id]: 7,
    [players[2].id]: 7,
    [players[3].id]: 7,
  });

  const myIndex = players.findIndex(p => p.id === myId);
  const isMyTurn = turnIndex === myIndex;
  
  const rightIndex = (myIndex + 1) % 4;
  const topIndex = (myIndex + 2) % 4;
  const leftIndex = (myIndex + 3) % 4;

  useEffect(() => {
    let unmounted = false;
    let handleAction = null;

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      if (unmounted) return;
      handleAction = (data) => {
        if (data.type === 'PLAY') {
          applyPlay(data.playerId, data.tile, data.end);
        } else if (data.type === 'PASS') {
          applyPass(data.playerId);
        }
      };
      
      WebRTCEngine.onMessage(PROTOCOL.DOMINO_ACTION, handleAction);
    });

    return () => {
      unmounted = true;
      if (handleAction) {
        import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
            WebRTCEngine.offMessage(PROTOCOL.DOMINO_ACTION, handleAction);
        });
      }
    };
  }, [boardHead, boardTail, turnIndex, handsCount, board]);

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
        setPendingChoice({ tile });
        return; 
      } else if (canHead) {
        end = 'head';
      } else if (canTail) {
        end = 'tail';
      } else {
        return; // Invalid
      }
    }

    executePlay(tile, end);
  };

  const executePlay = (tile, end) => {
    const newHand = myHand.filter(t => !(t[0] === tile[0] && t[1] === tile[1]));
    setMyHand(newHand);
    setPendingChoice(null);

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

  const renderPips = (num, isHorizontal) => {
    const pips = Array(9).fill(false);
    if (num === 1) { pips[4] = true; }
    else if (num === 2) { pips[0] = true; pips[8] = true; }
    else if (num === 3) { pips[0] = true; pips[4] = true; pips[8] = true; }
    else if (num === 4) { pips[0] = true; pips[2] = true; pips[6] = true; pips[8] = true; }
    else if (num === 5) { pips[0] = true; pips[2] = true; pips[4] = true; pips[6] = true; pips[8] = true; }
    else if (num === 6) { pips[0] = true; pips[3] = true; pips[6] = true; pips[2] = true; pips[5] = true; pips[8] = true; }
    
    return (
      <div className={`grid grid-cols-3 grid-rows-3 w-full h-full p-[3px] sm:p-[4px] gap-[2px] ${isHorizontal ? 'rotate-90' : ''}`}>
        {pips.map((show, i) => (
          <div key={i} className={`rounded-full aspect-square ${show ? 'bg-black shadow-inner' : 'bg-transparent'}`} />
        ))}
      </div>
    );
  };

  const DominoPiece = ({ tile, isHorizontal }) => {
    // Si isHorizontal es falso, dibujamos la ficha en vertical.
    return (
        <div className={`bg-slate-100 rounded-md border border-slate-300 shadow-[0_4px_6px_rgba(0,0,0,0.3)] flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center justify-center overflow-hidden`} style={{ width: isHorizontal ? '60px' : '30px', height: isHorizontal ? '30px' : '60px'}}>
            <div className={`flex items-center justify-center ${isHorizontal ? 'border-r border-slate-300' : 'border-b border-slate-300'}`} style={{ width: '30px', height: '30px' }}>
                {renderPips(tile[0], isHorizontal)}
            </div>
            <div className="flex items-center justify-center" style={{ width: '30px', height: '30px' }}>
                {renderPips(tile[1], isHorizontal)}
            </div>
        </div>
    );
  };



  // Calculate 2D Layout
  const getLayout = () => {
    const layout = [];
    let hX = 0, tX = 0;
    let lastHead = null;
    let lastTail = null;

    board.forEach((move, i) => {
      const isDouble = move.tile[0] === move.tile[1];
      const w = isDouble ? 30 : 60;
      const h = isDouble ? 60 : 30;

      if (i === 0) {
        layout.push({ ...move, id: i, x: 0, y: 0, isDouble, w, h });
        lastHead = layout[0];
        lastTail = layout[0];
        return;
      }

      if (move.end === 'tail') {
        const dist = (lastTail.w / 2) + (w / 2);
        tX += dist;
        layout.push({ ...move, id: i, x: tX, y: 0, isDouble, w, h });
        lastTail = layout[layout.length - 1];
      } else {
        const dist = (lastHead.w / 2) + (w / 2);
        hX -= dist;
        layout.push({ ...move, id: i, x: hX, y: 0, isDouble, w, h });
        lastHead = layout[layout.length - 1];
      }
    });
    return layout;
  };

  const boardRef = useRef(null);
  
  useEffect(() => {
      if (boardRef.current) {
          // Centrar el scroll
          boardRef.current.scrollLeft = 1500 - (boardRef.current.clientWidth / 2);
          boardRef.current.scrollTop = 1500 - (boardRef.current.clientHeight / 2);
      }
  }, []);

  const renderBoard = () => {
      const layout = getLayout();

      return (
      <div 
        ref={boardRef}
        className="w-full h-full overflow-auto bg-green-800/30 rounded-xl border border-green-500/20 shadow-inner relative cursor-grab active:cursor-grabbing"
      >
         <div className="absolute" style={{ width: '3000px', height: '3000px' }}>
             {board.length === 0 ? (
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 italic font-medium bg-black/30 px-6 py-3 rounded-full backdrop-blur-sm pointer-events-none">
                     La mesa está vacía. Juega cualquier ficha para empezar.
                 </div>
             ) : (
                 layout.map((item) => {
                     return (
                         <motion.div 
                            key={item.id} 
                            initial={{ scale: 0, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="absolute flex items-center justify-center transition-all duration-300"
                            style={{
                                left: `calc(1500px + ${item.x}px)`,
                                top: `calc(1500px + ${item.y}px)`,
                                transform: `translate(-50%, -50%)`,
                                width: `${item.w}px`,
                                height: `${item.h}px`
                            }}
                         >
                            <DominoPiece tile={item.tile} isHorizontal={!item.isDouble} />
                         </motion.div>
                     );
                 })
             )}
         </div>
      </div>
    );
  };

  const PlayerBadge = ({ index, positionClass }) => {
      const p = players[index];
      if (!p) return null;
      const active = turnIndex === index;
      return (
        <div className={`absolute ${positionClass} flex flex-col items-center p-2 rounded-xl transition-all duration-500 ${active ? 'bg-yellow-500/30 border-2 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.8)] scale-110 z-20' : 'bg-black/60 border border-white/10 z-10'}`}>
            <span className="material-symbols-outlined text-white/50 mb-1 text-sm">person</span>
            <span className={`font-bold whitespace-nowrap text-sm ${active ? 'text-yellow-400' : 'text-white'}`}>{p.name}</span>
            <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full mt-1">{handsCount[p.id]} fichas</span>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="glass-card-solid bg-surface/90 p-10 rounded-3xl border border-primary/40 text-center max-w-sm shadow-[0_0_40px_rgba(255,179,173,0.15)] flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_10px_rgba(255,179,173,0.5)]">emoji_events</span>
                </div>
                <h3 className="text-[22px] font-bold text-white mb-2 whitespace-pre-line leading-tight">{resultMsg}</h3>
                <p className="text-on-surface-variant text-sm mb-8">La partida ha finalizado. ¡Bien jugado!</p>
                <button onClick={onExit} className="btn-primary w-full py-3 text-[15px] font-bold tracking-wide rounded-xl shadow-lg hover:shadow-primary/30 transition-all">Volver al Arcade</button>
            </div>
        </div>
      )}

      {pendingChoice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface p-6 rounded-xl border border-blue-500 text-center max-w-sm">
                <h3 className="text-xl font-bold text-white mb-6">¿Dónde colocar la ficha?</h3>
                <div className="flex justify-center gap-6">
                    <button onClick={() => executePlay(pendingChoice.tile, 'head')} className="flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-white/70">Izquierda</span>
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 font-bold text-xl">{boardHead}</div>
                    </button>
                    <button onClick={() => executePlay(pendingChoice.tile, 'tail')} className="flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                        <span className="text-white/70">Derecha</span>
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 font-bold text-xl">{boardTail}</div>
                    </button>
                </div>
                <button onClick={() => setPendingChoice(null)} className="mt-6 text-sm text-red-400 hover:text-red-300">Cancelar</button>
            </div>
        </div>
      )}

      <div className="flex-1 p-4 flex flex-col justify-between relative overflow-hidden">
        
        {/* Opponents Status (Absolute positioning for cross layout) */}
        <PlayerBadge index={topIndex} positionClass="top-2 left-1/2 -translate-x-1/2" />
        <PlayerBadge index={leftIndex} positionClass="left-2 top-1/2 -translate-y-1/2" />
        <PlayerBadge index={rightIndex} positionClass="right-2 top-1/2 -translate-y-1/2" />

        {/* Board */}
        <div className="flex-1 w-full h-full relative overflow-hidden z-0">
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
        <div className={`p-4 rounded-xl border transition-all duration-500 flex flex-col items-center mt-auto ${isMyTurn ? 'bg-yellow-500/10 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10'}`}>
            <h4 className={`text-sm mb-3 font-bold ${isMyTurn ? 'text-yellow-400' : 'text-white/60'}`}>
                {isMyTurn ? '¡Es tu turno!' : 'Tus fichas'}
            </h4>
            <div className="flex flex-wrap justify-center gap-2 mb-2">
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
