import { useState, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Gamepad } from 'lucide-react';
import { TicTacToe } from '../components/Games/TicTacToe';
import { RockPaperScissors } from '../components/Games/RockPaperScissors';
import { ReactionGame } from '../components/Games/ReactionGame';
import { Blackjack } from '../components/Games/Blackjack';
import SoundEngine from '../services/SoundEngine';
import PROTOCOL from '../shared/protocol.js';

export function GamesView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const [activeGame, setActiveGame] = useState(null); // null, 'tictactoe', 'rps', 'reaction'
  const [opponent, setOpponent] = useState(null);
  const [invites, setInvites] = useState([]);
  const [selectedGameToInvite, setSelectedGameToInvite] = useState(null);
  
  const [farmCooldown, setFarmCooldown] = useState(0);
  const addPoints = useWebRTCStore(state => state.addPoints);

  useEffect(() => {
    let timer;
    if (farmCooldown > 0) {
      timer = setInterval(() => {
        setFarmCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [farmCooldown]);

  const handleFarm = () => {
    if (farmCooldown <= 0) {
      addPoints(5);
      setFarmCooldown(25);
    }
  };

  useEffect(() => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.onMessage(PROTOCOL.GAME_INVITE, (data) => {
        setInvites(prev => [...prev, { from: data.senderId, name: data.nombre, game: data.gameType }]);
        SoundEngine.playAlert();
      });
      WebRTCEngine.onMessage(PROTOCOL.GAME_ACCEPT, (data) => {
        setOpponent({ id: data.senderId, name: data.nombre });
        setActiveGame(data.gameType);
      });
      WebRTCEngine.onMessage(PROTOCOL.GAME_REJECT, (data) => {
        alert(`${data.nombre} rechazó tu invitación a jugar.`);
      });
    });
  }, []);

  const inviteToGame = (peerId, peerName, gameType) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(peerId, PROTOCOL.GAME_INVITE, { gameType, nombre: 'Yo' });
      alert(`Invitación enviada a ${peerName}`);
      setSelectedGameToInvite(null);
    });
  };

  const acceptInvite = (inv) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(inv.from, PROTOCOL.GAME_ACCEPT, { gameType: inv.game, nombre: 'Yo' });
      setOpponent({ id: inv.from, name: inv.name });
      setActiveGame(inv.game);
      setInvites(prev => prev.filter(i => i !== inv));
    });
  };

  const rejectInvite = (inv) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(inv.from, PROTOCOL.GAME_REJECT, { gameType: inv.game, nombre: 'Yo' });
      setInvites(prev => prev.filter(i => i !== inv));
    });
  };

  if (activeGame === 'tictactoe') {
    return <TicTacToe opponent={opponent} onExit={() => setActiveGame(null)} />;
  }
  if (activeGame === 'rps' || activeGame === 'rockpaperscissors') {
    return <RockPaperScissors opponent={opponent} onExit={() => setActiveGame(null)} />;
  }
  if (activeGame === 'reaction') {
    return <ReactionGame opponent={opponent} onExit={() => setActiveGame(null)} />;
  }
  if (activeGame === 'blackjack') {
    return <Blackjack onExit={() => setActiveGame(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-transparent border-none overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface/50 backdrop-blur-md flex justify-between items-center">
        <div>
          <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">Zona Arcade</h2>
          <p className="text-[12px] text-on-surface-variant">Reta a tus amigos a una partida rápida.</p>
        </div>
        <button 
          onClick={handleFarm}
          disabled={farmCooldown > 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs shadow-md transition-all ${farmCooldown > 0 ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-105'}`}
        >
          <span className="material-symbols-outlined text-[16px]">stars</span>
          {farmCooldown > 0 ? `Espera ${farmCooldown}s` : 'Minar +5 pts'}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence>
          {invites.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2"><Swords size={18}/> Invitaciones Pendientes</h3>
              {invites.map((inv, idx) => (
                <div key={idx} className="glass-card-solid p-3  flex items-center justify-between border border-primary/50">
                  <span className="text-sm font-medium">{inv.name} te reta a {inv.game === 'tictactoe' ? 'Tic Tac Toe' : 'Piedra Papel Tijera'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => acceptInvite(inv)} className="btn-primary px-3 py-1 text-xs ">Aceptar</button>
                    <button onClick={() => rejectInvite(inv)} className="btn-ghost px-3 py-1 text-xs ">Rechazar</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedGameToInvite ? (
          <>
            <h3 className="font-bold text-white mb-4">Selecciona un Juego</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setSelectedGameToInvite('tictactoe')} className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Gamepad size={32} className="text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-on-surface text-lg">Tic Tac Toe</h4>
                  <p className="text-xs text-on-surface-variant mt-1">El clásico tres en raya.</p>
                </div>
              </button>

              <button onClick={() => setActiveGame('blackjack')} className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-green-500/50 transition-all hover:-translate-y-1 group border border-green-500/20 bg-green-500/5">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-green-500 text-4xl">style</span>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-on-surface text-lg">Blackjack</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Juega contra la CPU.</p>
                </div>
              </button>
              
              <button onClick={() => setSelectedGameToInvite('rps')} className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-secondary/50 transition-all hover:-translate-y-1 group">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Swords size={32} className="text-secondary" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-on-surface text-lg">Piedra Papel Tijera</h4>
                  <p className="text-xs text-on-surface-variant mt-1">Suerte y estrategia.</p>
                </div>
              </button>

              <button onClick={() => setSelectedGameToInvite('reaction')} className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-tertiary/50 transition-all hover:-translate-y-1 group">
                <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-tertiary text-4xl">timer</span>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-on-surface text-lg">Carrera de Reacción</h4>
                  <p className="text-xs text-on-surface-variant mt-1">¿Quién tiene mejores reflejos?</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedGameToInvite(null)} className="btn-ghost p-2 flex items-center justify-center rounded-full hover:bg-surface-variant/50">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              <h3 className="font-bold text-white text-lg">
                Invitar a jugar {selectedGameToInvite === 'tictactoe' ? 'Tic Tac Toe' : selectedGameToInvite === 'rps' ? 'Piedra Papel Tijera' : 'Carrera de Reacción'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peers.map(peer => (
                <div key={peer.id} className="glass-card p-4 flex items-center justify-between border border-outline-variant/30 hover:border-primary/50 transition-all hover:bg-surface-variant/10 cursor-pointer" onClick={() => inviteToGame(peer.id, peer.nombre, selectedGameToInvite)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-surface-variant/50 shadow-inner" style={{ color: peer.color || '#fff' }}>
                      {peer.avatar || peer.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-on-surface">{peer.nombre}</span>
                      <span className="text-[11px] text-on-surface-variant/60 uppercase tracking-widest mt-0.5">{peer.zona}</span>
                    </div>
                  </div>
                  <button className="btn-primary px-4 py-2 text-xs rounded-lg shadow-md">
                    Invitar
                  </button>
                </div>
              ))}
              {peers.length === 0 && (
                <div className="col-span-full py-8 text-center bg-surface/20 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">person_off</span>
                  <p className="text-sm text-on-surface-variant">No hay usuarios disponibles en la red para invitar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
