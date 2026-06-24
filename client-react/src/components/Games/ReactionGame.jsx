import { useState, useEffect, useRef } from 'react';
import PROTOCOL from '../../shared/protocol.js';
import { useWebRTCStore } from '../../store/useWebRTCStore';

export function ReactionGame({ opponent, onExit }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, go, result
  const [result, setResult] = useState(null); // { winner: 'Me' | 'Opponent' | 'Draw', myTime, opTime }
  const myId = useWebRTCStore(state => state.myId);
  const startTimeRef = useRef(0);
  const myTapTimeRef = useRef(null);
  const opTapTimeRef = useRef(null);
  const isInitiatorRef = useRef(false);

  useEffect(() => {
    // When mounting, determine if we are initiator
    // If we invited, we are initiator. (A real app would track this better, let's assume we send READY)
    let isMounted = true;
    
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      // Send ready automatically
      WebRTCEngine.sendMessage(opponent.id, PROTOCOL.REACTION_READY, {});

      WebRTCEngine.onMessage(PROTOCOL.REACTION_READY, () => {
        if (!isMounted) return;
        setGameState('ready');
        // Initiator sends GO after random delay
        // We'll just let the one with higher ID be the initiator for determinism
        if (myId > opponent.id) {
            setTimeout(() => {
                if (!isMounted) return;
                const ts = Date.now();
                WebRTCEngine.sendMessage(opponent.id, PROTOCOL.REACTION_GO, { timestamp: ts });
                handleGo(ts);
            }, 2000 + Math.random() * 3000);
        }
      });

      WebRTCEngine.onMessage(PROTOCOL.REACTION_GO, (data) => {
        if (!isMounted) return;
        handleGo(data.timestamp);
      });

      WebRTCEngine.onMessage(PROTOCOL.REACTION_TAP, (data) => {
        if (!isMounted) return;
        opTapTimeRef.current = data.tapTime;
        checkResults();
      });
    });

    return () => {
      isMounted = false;
      // In a real app we'd off() the listeners, but we use an event bus which might need exact fn ref.
    };
  }, [opponent.id, myId]);

  const handleGo = (ts) => {
    startTimeRef.current = ts;
    setGameState('go');
  };

  const handleTap = () => {
    if (gameState !== 'go') return;
    myTapTimeRef.current = Date.now();
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
        WebRTCEngine.sendMessage(opponent.id, PROTOCOL.REACTION_TAP, { tapTime: myTapTimeRef.current });
    });
    setGameState('result');
    checkResults();
  };

  const checkResults = () => {
    if (myTapTimeRef.current && opTapTimeRef.current) {
        const myDiff = myTapTimeRef.current - startTimeRef.current;
        const opDiff = opTapTimeRef.current - startTimeRef.current;
        
        let winnerStr = '';
        if (myDiff < opDiff) winnerStr = '¡GANASTE!';
        else if (opDiff < myDiff) winnerStr = 'PERDISTE';
        else winnerStr = 'EMPATE';

        setResult({ winner: winnerStr, myTime: myDiff, opTime: opDiff });
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface-container-highest/50 backdrop-blur-md flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-primary">Carrera de Reacción</h2>
          <p className="text-[12px] text-on-surface-variant">Contra {opponent.name}</p>
        </div>
        <button onClick={onExit} className="btn-ghost px-3 py-1 text-xs">Salir</button>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
        {!result ? (
            <div 
                onClick={handleTap}
                className={`w-48 h-48 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors duration-100 border-4 select-none ${
                    gameState === 'waiting' ? 'bg-surface-bright border-outline-variant/30 text-on-surface-variant' :
                    gameState === 'ready' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' :
                    'bg-green-500 border-green-400 text-white shadow-[0_0_50px_rgba(34,197,94,0.5)]'
                }`}
            >
                <span className="font-bold text-2xl pointer-events-none">
                    {gameState === 'waiting' ? 'Esperando...' : gameState === 'ready' ? 'Atento...' : '¡YA!'}
                </span>
            </div>
        ) : (
            <div className="text-center animate-fade-in">
                <div className="font-headline-lg text-4xl text-primary mb-4">{result.winner}</div>
                <div className="font-label-mono text-[14px] text-white bg-surface-bright px-4 py-2 rounded mb-2">
                    Tu tiempo: <span className="font-bold text-primary">{result.myTime}</span> ms
                </div>
                <div className="font-label-mono text-[14px] text-on-surface-variant bg-surface px-4 py-2 rounded">
                    {opponent.name}: <span className="font-bold text-secondary">{result.opTime}</span> ms
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
