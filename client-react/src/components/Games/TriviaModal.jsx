import { useState, useEffect } from 'react';
import PROTOCOL from '../../shared/protocol.js';
import { useWebRTCStore } from '../../store/useWebRTCStore';

export function TriviaModal() {
  const [triviaData, setTriviaData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const myId = useWebRTCStore(state => state.myId);
  const addPoints = useWebRTCStore(state => state.addPoints);

  useEffect(() => {
    let interval = null;

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.onMessage(PROTOCOL.TRIVIA_START, (data) => {
        setTriviaData(data);
        setTimeLeft(data.duration);
        setAnswered(false);

        if (interval) clearInterval(interval);
        interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setTimeout(() => setTriviaData(null), 2000); // close after 2s
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      });
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!triviaData) return null;

  const handleAnswer = (idx) => {
    if (answered) return;
    setAnswered(true);
    addPoints(10); // Reward for participation
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      const myNombre = useWebRTCStore.getState().peers.find(p => p.id === myId)?.nombre || 'Yo';
      WebRTCEngine.broadcast(PROTOCOL.TRIVIA_ANSWER, { answerIndex: idx, nombre: myNombre });
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border-2 border-tertiary/50 p-6 shadow-[0_0_50px_rgba(105,216,212,0.2)] w-full max-w-md animate-fade-in relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-tertiary transition-all duration-1000 ease-linear" 
             style={{ width: `${(timeLeft / triviaData.duration) * 100}%` }}></div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-sm text-tertiary flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
            ¡TRIVIA P2P!
          </h3>
          <span className="font-mono text-tertiary font-bold">{timeLeft}s</span>
        </div>

        <p className="font-bold text-lg text-white mb-6 leading-tight">
          {triviaData.question}
        </p>

        <div className="flex flex-col gap-3">
          {triviaData.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`text-left px-4 py-3 border font-medium transition-all ${
                answered 
                  ? 'border-outline-variant/20 text-on-surface-variant/50 bg-surface-container opacity-50 cursor-not-allowed'
                  : 'border-tertiary/30 hover:border-tertiary hover:bg-tertiary/10 text-on-surface hover:pl-6'
              }`}
            >
              <span className="text-tertiary/60 font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <div className="mt-4 text-center text-sm font-bold text-tertiary animate-pulse">
            Respuesta enviada. Esperando resultados...
          </div>
        )}
      </div>
    </div>
  );
}
