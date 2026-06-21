import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTCStore } from '../../store/useWebRTCStore';
import PROTOCOL from '../../../../shared/protocol.js';

const CHOICES = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️'
};

export function RockPaperScissors({ opponent, onExit }) {
  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null); // 'hidden' initially, then the actual choice
  const [result, setResult] = useState(null);

  useEffect(() => {
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.on(PROTOCOL.GAME_MOVE, (data) => {
        if ((data.gameType === 'rps' || data.gameType === 'rockpaperscissors') && data.senderId === opponent.id) {
          if (myChoice) {
            // Both have chosen, reveal and calculate
            setOpponentChoice(data.choice);
            calculateWinner(myChoice, data.choice);
          } else {
            // Opponent chose first
            setOpponentChoice('hidden');
            // Save their choice for when we choose
            window.lastOpponentRPSChoice = data.choice;
          }
        }
      });
    });
  }, [opponent.id, myChoice]);

  const calculateWinner = (mine, theirs) => {
    if (mine === theirs) {
      setResult('draw');
    } else if (
      (mine === 'rock' && theirs === 'scissors') ||
      (mine === 'paper' && theirs === 'rock') ||
      (mine === 'scissors' && theirs === 'paper')
    ) {
      setResult('win');
    } else {
      setResult('lose');
    }
  };

  const handleChoice = (choice) => {
    if (myChoice) return;
    setMyChoice(choice);
    
    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(opponent.id, PROTOCOL.GAME_MOVE, {
        gameType: 'rps',
        choice: choice
      });
    });

    if (opponentChoice === 'hidden') {
      const theirs = window.lastOpponentRPSChoice;
      setOpponentChoice(theirs);
      calculateWinner(choice, theirs);
    }
  };

  const resetGame = () => {
    setMyChoice(null);
    setOpponentChoice(null);
    setResult(null);
    window.lastOpponentRPSChoice = null;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-container  p-6 relative">
      <h2 className="text-3xl font-bold text-white mb-8">Piedra Papel Tijera</h2>

      <div className="flex w-full max-w-2xl justify-between items-center mb-12">
        {/* Me */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-xl text-primary mb-4">Tú</span>
          <div className="w-32 h-32 glass-card-solid  flex items-center justify-center text-6xl">
            {myChoice ? CHOICES[myChoice] : '❓'}
          </div>
        </div>

        <div className="text-4xl font-bold text-on-surface-variant">VS</div>

        {/* Opponent */}
        <div className="flex flex-col items-center">
          <span className="font-bold text-xl text-tertiary mb-4">{opponent.name}</span>
          <div className="w-32 h-32 glass-card-solid  flex items-center justify-center text-6xl">
            {opponentChoice === 'hidden' ? '🔒' : (opponentChoice ? CHOICES[opponentChoice] : '❓')}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!myChoice ? (
          <motion.div 
            key="choices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-4"
          >
            {Object.entries(CHOICES).map(([key, emoji]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleChoice(key)}
                className="w-20 h-20 bg-primary/20 hover:bg-primary/40 border border-primary/50  text-4xl flex items-center justify-center transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <h3 className={`text-4xl font-bold mb-8 ${result === 'win' ? 'text-green-400' : result === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
              {result === 'win' ? '¡Ganaste!' : result === 'lose' ? '¡Perdiste!' : result === 'draw' ? '¡Empate!' : 'Esperando al oponente...'}
            </h3>
            {result && (
              <button onClick={resetGame} className="btn-primary px-8 py-3  font-bold">
                Jugar de Nuevo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onExit} className="absolute bottom-6 btn-ghost px-6 py-2 ">
        Salir
      </button>
    </div>
  );
}
