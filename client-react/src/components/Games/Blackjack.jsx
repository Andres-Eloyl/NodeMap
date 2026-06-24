import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTCStore } from '../../store/useWebRTCStore';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getCardValue(card) {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
}

function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  for (let card of hand) {
    score += getCardValue(card);
    if (card.value === 'A') aces += 1;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let value of VALUES) {
      deck.push({ suit, value, color: (suit === '♥' || suit === '♦') ? 'text-red-500' : 'text-slate-800' });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

const Card = ({ card, hidden }) => {
  if (hidden) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-primary border-2 border-white/20 flex items-center justify-center shadow-lg transform -rotate-2">
        <div className="w-12 h-20 border border-white/20 rounded opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]"></div>
      </div>
    );
  }
  return (
    <motion.div 
      initial={{ scale: 0, x: 50 }} 
      animate={{ scale: 1, x: 0 }}
      className="w-16 h-24 sm:w-20 sm:h-28 rounded-lg bg-white border border-slate-300 shadow-xl flex flex-col justify-between p-1 select-none"
    >
      <div className={`text-sm sm:text-base font-bold ${card.color}`}>{card.value}</div>
      <div className={`text-2xl sm:text-4xl text-center flex-1 flex items-center justify-center ${card.color}`}>{card.suit}</div>
      <div className={`text-sm sm:text-base font-bold ${card.color} rotate-180`}>{card.value}</div>
    </motion.div>
  );
};

export function Blackjack({ onExit }) {
  const [gameState, setGameState] = useState('betting'); // betting, insurance, playing, dealerTurn, result
  const [deck, setDeck] = useState([]);
  const [playerHands, setPlayerHands] = useState([]); // Array of hands: [ [card1, card2], ... ]
  const [bets, setBets] = useState([]); // Array of bets corresponding to each hand
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState([]);
  const [resultMsg, setResultMsg] = useState('');
  
  const myPoints = useWebRTCStore(state => state.myPoints);
  const addPoints = useWebRTCStore(state => state.addPoints);

  const placeBet = (amount) => {
    if (myPoints < amount) return;
    
    // Deduct bet immediately
    addPoints(-amount);
    
    // Start game
    const newDeck = createDeck();
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];
    
    setDeck(newDeck);
    setPlayerHands([pHand]);
    setBets([amount]);
    setActiveHandIndex(0);
    setDealerHand(dHand);
    setResultMsg('');

    // If dealer has an Ace, offer insurance
    if (dHand[0].value === 'A') {
      setGameState('insurance');
    } else {
      checkInitialBlackjack(pHand, dHand, amount);
    }
  };

  const checkInitialBlackjack = (pHand, dHand, amount) => {
    const pScore = calculateScore(pHand);
    if (pScore === 21) {
        setGameState('result');
        const dScore = calculateScore(dHand);
        if (dScore === 21) {
            setResultMsg('¡Empate de Blackjack! (Push)');
            addPoints(amount); // Return bet
        } else {
            setResultMsg('¡BLACKJACK NATURAL! Ganas 2.5x');
            addPoints(Math.floor(amount * 2.5)); // 3 to 2 payout
        }
    } else {
        setGameState('playing');
    }
  };

  const buyInsurance = () => {
    const amount = bets[0];
    const insuranceCost = Math.floor(amount / 2);
    if (myPoints < insuranceCost) return;
    
    addPoints(-insuranceCost);
    
    const dScore = calculateScore(dealerHand);
    if (dScore === 21) {
        // Dealer has Blackjack, insurance pays 2:1 (cost * 3)
        addPoints(insuranceCost * 3);
        setGameState('result');
        
        const pScore = calculateScore(playerHands[0]);
        if (pScore === 21) {
            setResultMsg('Compraste seguro y el crupier tenía Blackjack. \n¡Tu mano también es Blackjack! (Empate en la principal).');
            addPoints(amount); // Push
        } else {
            setResultMsg('Compraste seguro. El crupier tenía Blackjack. \n(Ganas el seguro, pierdes la mano).');
        }
    } else {
        // No Blackjack, lose insurance cost
        setResultMsg('Nadie en casa. Pierdes el seguro, la partida continúa.');
        setTimeout(() => setResultMsg(''), 2000);
        checkInitialBlackjack(playerHands[0], dealerHand, amount);
    }
  };

  const declineInsurance = () => {
    const dScore = calculateScore(dealerHand);
    if (dScore === 21) {
        setGameState('result');
        const pScore = calculateScore(playerHands[0]);
        if (pScore === 21) {
            setResultMsg('Rechazaste el seguro. Crupier tenía Blackjack. \n¡Tú también! Empate (Push).');
            addPoints(bets[0]); // Push
        } else {
            setResultMsg('Rechazaste el seguro y el crupier tenía Blackjack. Pierdes.');
        }
    } else {
        checkInitialBlackjack(playerHands[0], dealerHand, bets[0]);
    }
  };

  const surrender = () => {
    // Only allowed on initial 2 cards
    const amount = bets[0];
    const refund = Math.floor(amount / 2);
    addPoints(refund);
    setGameState('result');
    setResultMsg(`Te rendiste. Recuperas ${refund} pts.`);
  };

  const advanceHand = (newHands) => {
    if (activeHandIndex + 1 < newHands.length) {
      setActiveHandIndex(prev => prev + 1);
    } else {
      // Check if all hands are busted
      const allBusted = newHands.every(hand => calculateScore(hand) > 21);
      if (allBusted) {
        setGameState('result');
        if (newHands.length > 1) {
            setResultMsg('¡Todas tus manos se pasaron de 21! Pierdes.');
        } else {
            setResultMsg('¡Te pasaste de 21! Pierdes.');
        }
      } else {
        setGameState('dealerTurn');
      }
    }
  };

  const hit = () => {
    const newDeck = [...deck];
    const card = newDeck.pop();
    
    const newHands = [...playerHands];
    newHands[activeHandIndex] = [...newHands[activeHandIndex], card];
    
    setDeck(newDeck);
    setPlayerHands(newHands);
    
    if (calculateScore(newHands[activeHandIndex]) > 21) {
      advanceHand(newHands);
    }
  };

  const stand = () => {
    advanceHand(playerHands);
  };

  const doubleDown = () => {
    const currentBet = bets[activeHandIndex];
    if (myPoints < currentBet || playerHands[activeHandIndex].length > 2) return;
    
    addPoints(-currentBet);
    
    const newBets = [...bets];
    newBets[activeHandIndex] *= 2;
    setBets(newBets);
    
    const newDeck = [...deck];
    const card = newDeck.pop();
    const newHands = [...playerHands];
    newHands[activeHandIndex] = [...newHands[activeHandIndex], card];
    
    setDeck(newDeck);
    setPlayerHands(newHands);
    
    advanceHand(newHands);
  };

  const split = () => {
    const currentHand = playerHands[activeHandIndex];
    const currentBet = bets[activeHandIndex];
    
    if (currentHand.length !== 2 || myPoints < currentBet) return;
    if (getCardValue(currentHand[0]) !== getCardValue(currentHand[1])) return;

    addPoints(-currentBet); // Deduct for the new split hand
    
    const newDeck = [...deck];
    const card1 = newDeck.pop();
    const card2 = newDeck.pop();

    const hand1 = [currentHand[0], card1];
    const hand2 = [currentHand[1], card2];

    const newHands = [...playerHands];
    newHands.splice(activeHandIndex, 1, hand1, hand2);

    const newBets = [...bets];
    newBets.splice(activeHandIndex, 1, currentBet, currentBet);

    setDeck(newDeck);
    setPlayerHands(newHands);
    setBets(newBets);
  };

  // Dealer logic
  useEffect(() => {
    if (gameState === 'dealerTurn') {
      let currentHand = [...dealerHand];
      let currentDeck = [...deck];
      
      const playDealer = () => {
        let score = calculateScore(currentHand);
        if (score < 17) {
          setTimeout(() => {
            currentHand = [...currentHand, currentDeck.pop()];
            setDealerHand(currentHand);
            setDeck(currentDeck);
            playDealer();
          }, 800);
        } else {
          endRound(currentHand);
        }
      };
      
      setTimeout(playDealer, 800);
    }
  }, [gameState]);

  const endRound = (finalDealerHand) => {
    const dScore = calculateScore(finalDealerHand);
    let totalWon = 0;
    let messages = [];

    playerHands.forEach((hand, idx) => {
      const pScore = calculateScore(hand);
      const bet = bets[idx];
      let result = '';

      if (pScore > 21) {
        result = playerHands.length > 1 ? `Mano ${idx + 1}: Te pasaste.` : 'Te pasaste. Pierdes.';
      } else if (dScore > 21) {
        result = playerHands.length > 1 ? `Mano ${idx + 1}: Crupier se pasó. GANAS.` : '¡Crupier se pasó! GANAS.';
        totalWon += bet * 2;
      } else if (pScore > dScore) {
        result = playerHands.length > 1 ? `Mano ${idx + 1}: ¡Ganaste!` : '¡Ganaste!';
        totalWon += bet * 2;
      } else if (dScore > pScore) {
        result = playerHands.length > 1 ? `Mano ${idx + 1}: Crupier gana.` : 'Crupier gana. Pierdes.';
      } else {
        result = playerHands.length > 1 ? `Mano ${idx + 1}: Empate.` : 'Empate (Push).';
        totalWon += bet;
      }
      messages.push(result);
    });

    if (totalWon > 0) {
      addPoints(totalWon);
    }

    setResultMsg(messages.join('\n'));
    setGameState('result');
  };

  const nextRound = () => {
    setGameState('betting');
    setPlayerHands([]);
    setBets([]);
    setActiveHandIndex(0);
    setDealerHand([]);
    setResultMsg('');
  };

  const showDealerScore = gameState === 'result' || gameState === 'dealerTurn';
  const dealerScore = calculateScore(dealerHand);

  const canSplit = gameState === 'playing' && 
                   playerHands[activeHandIndex]?.length === 2 && 
                   getCardValue(playerHands[activeHandIndex][0]) === getCardValue(playerHands[activeHandIndex][1]) &&
                   myPoints >= bets[activeHandIndex];

  const canSurrender = gameState === 'playing' && 
                       playerHands.length === 1 && 
                       playerHands[0]?.length === 2;

  return (
    <div className="flex flex-col h-full bg-[#1a4a38] border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex justify-between items-center z-10">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-white">Blackjack (21)</h2>
          <p className="text-[12px] text-white/60">Crupier Virtual • Tus puntos: <span className="text-yellow-400 font-bold">{myPoints}</span></p>
        </div>
        <button onClick={onExit} className="btn-ghost text-white hover:bg-white/10 px-3 py-1 text-xs">Salir</button>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between relative overflow-y-auto">
        
        {/* Betting Phase */}
        {gameState === 'betting' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-8 max-w-sm w-full text-center border-yellow-500/30">
              <span className="material-symbols-outlined text-yellow-500 text-5xl mb-4">casino</span>
              <h3 className="text-xl font-bold text-white mb-2">Haz tu apuesta</h3>
              <p className="text-sm text-on-surface-variant mb-6">Puntos disponibles: {myPoints}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[10, 25, 50, 100].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => placeBet(amt)}
                    disabled={myPoints < amt}
                    className={`p-3 font-bold rounded flex items-center justify-center gap-1 ${myPoints >= amt ? 'bg-surface-variant hover:bg-primary text-white' : 'bg-surface/50 text-white/30 cursor-not-allowed'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">stars</span> {amt}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => placeBet(myPoints)}
                disabled={myPoints <= 0}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded disabled:opacity-50"
              >
                ALL IN
              </button>
            </div>
          </div>
        )}

        {/* Insurance Phase */}
        {gameState === 'insurance' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
            <div className="glass-card p-8 max-w-md w-full text-center border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
              <span className="material-symbols-outlined text-yellow-500 text-5xl mb-2">admin_panel_settings</span>
              <h3 className="text-2xl font-bold text-white mb-2">Seguro</h3>
              <p className="text-sm text-on-surface-variant mb-6">El crupier tiene un As. ¿Quieres comprar un seguro contra Blackjack?</p>
              
              <p className="text-xs text-yellow-500 font-mono mb-4">Costo: {Math.floor(bets[0] / 2)} pts (Mitad de tu apuesta)</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={buyInsurance}
                  disabled={myPoints < Math.floor(bets[0] / 2)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded disabled:opacity-50"
                >
                  Comprar Seguro
                </button>
                <button 
                  onClick={declineInsurance}
                  className="flex-1 bg-surface-variant hover:bg-surface-variant/80 text-white font-bold py-3 rounded"
                >
                  Ignorar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dealer Area */}
        <div className="flex flex-col items-center mt-2 min-h-[140px]">
          <div className="text-white/60 text-sm font-bold tracking-widest mb-2 uppercase flex flex-col items-center gap-1">
            <span>Crupier {showDealerScore && `(${dealerScore})`}</span>
            {!showDealerScore && resultMsg && <span className="text-yellow-400 text-xs animate-pulse">{resultMsg}</span>}
          </div>
          <div className="flex justify-center -space-x-8 sm:-space-x-12">
            {dealerHand.map((card, idx) => (
              <Card key={idx} card={card} hidden={idx === 1 && !showDealerScore && gameState !== 'insurance'} />
            ))}
          </div>
        </div>

        {/* Center Board / Results */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 z-10">
          <AnimatePresence>
            {gameState === 'result' && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/80 border border-yellow-500/50 px-8 py-4 rounded-xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-full overflow-hidden"
              >
                <div className="text-lg sm:text-2xl font-bold text-white mb-2 whitespace-pre-line">{resultMsg}</div>
                <button onClick={nextRound} className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-full transition-transform hover:scale-105">
                  Jugar de nuevo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Area (Multiple Hands) */}
        <div className="flex flex-row justify-center gap-8 mb-4 min-h-[160px] overflow-x-auto w-full px-4">
          {playerHands.map((hand, idx) => {
            const isActive = gameState === 'playing' && activeHandIndex === idx;
            const pScore = calculateScore(hand);
            return (
              <div key={idx} className={`flex flex-col items-center transition-all ${isActive ? 'scale-105 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'opacity-70 scale-95'}`}>
                <div className="flex justify-center -space-x-8 sm:-space-x-12 mb-4">
                  {hand.map((card, cIdx) => (
                    <Card key={cIdx} card={card} />
                  ))}
                </div>
                <div className={`text-sm font-bold tracking-widest uppercase px-4 py-1 rounded-full ${isActive ? 'bg-yellow-500 text-black' : 'bg-black/40 text-white/80'}`}>
                  {playerHands.length > 1 ? `Mano ${idx + 1}` : 'Tú'} ({pScore})
                </div>
                {playerHands.length > 1 && (
                  <div className="text-xs text-white/50 mt-1">Apuesta: {bets[idx]}</div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-auto">
            <button 
              onClick={hit} 
              disabled={gameState !== 'playing'}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 sm:px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Pedir
            </button>
            <button 
              onClick={stand}
              disabled={gameState !== 'playing'}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 sm:px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Plantarse
            </button>
            <button 
              onClick={doubleDown}
              disabled={gameState !== 'playing' || playerHands[activeHandIndex]?.length > 2 || myPoints < bets[activeHandIndex]}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 sm:px-8 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hidden sm:block"
              title="Duplica tu apuesta y recibe exactamente 1 carta más."
            >
              Doblar
            </button>
            {canSplit && (
              <button 
                onClick={split}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 sm:px-8 rounded-full shadow-lg"
                title="Divide tus cartas en dos manos independientes."
              >
                Dividir
              </button>
            )}
            {canSurrender && (
              <button 
                onClick={surrender}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 sm:px-8 rounded-full shadow-lg"
                title="Ríndete y recupera la mitad de tu apuesta."
              >
                Rendirse
              </button>
            )}
        </div>

      </div>
    </div>
  );
}
