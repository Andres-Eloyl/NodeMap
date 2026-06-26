import { useState, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Gamepad, Zap, ArrowLeft, Star, UserX } from 'lucide-react';
import { TicTacToe } from '../components/Games/TicTacToe';
import { RockPaperScissors } from '../components/Games/RockPaperScissors';
import { ReactionGame } from '../components/Games/ReactionGame';
import { Blackjack } from '../components/Games/Blackjack';
import { DominoLobby } from '../components/Games/DominoLobby';
import { DominoGame } from '../components/Games/DominoGame';
import SoundEngine from '../services/SoundEngine';
import PROTOCOL from '../shared/protocol.js';

export function GamesView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const [activeGame, setActiveGame] = useState(null); // null, 'tictactoe', 'rps', 'reaction'
  const [opponent, setOpponent] = useState(null);
  const [invites, setInvites] = useState([]);
  const [selectedGameToInvite, setSelectedGameToInvite] = useState(null);
  const [dominoState, setDominoState] = useState(null);
  
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

  const handleExitGame = () => {
    setActiveGame(null);
    setOpponent(null);
  };

  useEffect(() => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.onMessage(PROTOCOL.GAME_INVITE, (data) => {
        setInvites(prev => [...prev, { from: data.senderId, name: data.nombre, game: data.gameType }]);
        useWebRTCStore.getState().addToast(`Nueva invitación a ${data.gameType} de ${data.nombre}`, 'info', () => {
            useWebRTCStore.getState().setActiveTab('games');
        });
        SoundEngine.playAlert();
      });
      WebRTCEngine.onMessage(PROTOCOL.GAME_ACCEPT, (data) => {
        setOpponent({ id: data.senderId, name: data.nombre });
        setActiveGame(data.gameType);
      });
      WebRTCEngine.onMessage(PROTOCOL.GAME_REJECT, (data) => {
        alert(`${data.nombre} rechazó tu invitación a jugar.`);
      });

      const handleDominoInvite = (data) => {
        setInvites(prev => [...prev, { from: data.hostId, name: data.nombre, game: 'domino_lobby' }]);
        useWebRTCStore.getState().addToast(`Nueva invitación a Dominó 2v2 de ${data.nombre}`, 'info', () => {
            useWebRTCStore.getState().setActiveTab('games');
        });
        SoundEngine.playAlert();
      };

      const handleDominoStart = (data) => {
        setDominoState(data);
        setActiveGame('domino_game');
      };

      WebRTCEngine.onMessage(PROTOCOL.DOMINO_INVITE, handleDominoInvite);
      WebRTCEngine.onMessage(PROTOCOL.DOMINO_START, handleDominoStart);
    });
  }, [myId]);

  const inviteToGame = (peerId, peerName, gameType) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(peerId, PROTOCOL.GAME_INVITE, { gameType, nombre: 'Yo' });
      alert(`Invitación enviada a ${peerName}`);
      setSelectedGameToInvite(null);
    });
  };

  const acceptInvite = (inv) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      if (inv.game === 'domino_lobby') {
        WebRTCEngine.sendMessage(inv.from, PROTOCOL.DOMINO_ACCEPT, { senderId: myId, nombre: useWebRTCStore.getState().myName });
        setActiveGame('domino_lobby'); 
      } else {
        WebRTCEngine.sendMessage(inv.from, PROTOCOL.GAME_ACCEPT, { gameType: inv.game, nombre: 'Yo' });
        setOpponent({ id: inv.from, name: inv.name });
        setActiveGame(inv.game);
      }
      setInvites(prev => prev.filter(i => i !== inv));
    });
  };

  const rejectInvite = (inv) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(inv.from, PROTOCOL.GAME_REJECT, { gameType: inv.game, nombre: 'Yo' });
      setInvites(prev => prev.filter(i => i !== inv));
    });
  };

  const renderActiveGame = () => {
    switch (activeGame) {
      case 'tictactoe':
        return <TicTacToe opponent={opponent} onExit={handleExitGame} />;
      case 'rps':
      case 'rockpaperscissors':
        return <RockPaperScissors opponent={opponent} onExit={handleExitGame} />;
      case 'reaction':
        return <ReactionGame opponent={opponent} onExit={handleExitGame} />;
      case 'blackjack':
        return <Blackjack onExit={handleExitGame} />;
      case 'domino_lobby':
        return <DominoLobby onExit={handleExitGame} onStartGame={(initialState) => {
          setDominoState(initialState);
          setActiveGame('domino_game');
        }} />;
      case 'domino_game':
        return <DominoGame initialState={dominoState} onExit={handleExitGame} />;
      default:
        return null;
    }
  };

  if (activeGame) {
    return renderActiveGame();
  }

  return (
    <div className="flex flex-col h-full bg-transparent border-none overflow-hidden relative">
      <div className="p-4 border-b border-white/10 glass-panel flex justify-between items-center relative z-10">
        <div>
          <h2 className="font-logo text-[20px] font-bold text-white flex items-center gap-2">
            <Gamepad size={20} className="text-orange-400" /> Zona Arcade
          </h2>
          <p className="text-[12px] text-white/60 font-mono">Reta a tus amigos a una partida rápida.</p>
        </div>
        <button 
          onClick={handleFarm}
          disabled={farmCooldown > 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all ${farmCooldown > 0 ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10' : 'bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]'}`}
        >
          <Star size={16} className={farmCooldown <= 0 ? "fill-black" : ""} />
          {farmCooldown > 0 ? `Espera ${farmCooldown}s` : 'Minar +5 pts'}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence>
          {invites.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-2">
              <h3 className="font-bold text-orange-400 flex items-center gap-2 font-logo"><Swords size={18}/> Invitaciones Pendientes</h3>
              {invites.map((inv, idx) => (
                <div key={idx} className="glass-panel p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-orange-500/40 gap-3 rounded-xl bg-orange-500/5">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                          <Swords size={20} />
                      </div>
                      <div>
                          <span className="font-bold text-white text-[15px]">{inv.name}</span>
                          <span className="text-sm text-white/60 block">Te invita a jugar {inv.game === 'domino_lobby' ? 'Dominó 2v2' : (inv.game === 'tictactoe' ? 'Tic Tac Toe' : 'Piedra Papel Tijera')}</span>
                      </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => rejectInvite(inv)} className="flex-1 md:flex-none px-4 py-2 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-colors text-white/70 rounded-lg text-sm font-bold">Rechazar</button>
                    <button onClick={() => acceptInvite(inv)} className="flex-1 md:flex-none bg-orange-500 text-[#05050a] px-6 py-2 shadow-lg hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] rounded-lg text-sm font-bold">Aceptar</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedGameToInvite ? (
          <>
            <h3 className="font-bold text-white mb-4 font-logo">Selecciona un Juego</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setSelectedGameToInvite('tictactoe')} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-orange-500/50 transition-all hover:-translate-y-1 group hover:bg-white/5">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]">
                  <Gamepad size={32} className="text-orange-400" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white text-lg">Tic Tac Toe</h4>
                  <p className="text-xs text-white/50 mt-1 font-mono">El clásico tres en raya.</p>
                </div>
              </button>

              <button onClick={() => setActiveGame('blackjack')} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-green-500/50 transition-all hover:-translate-y-1 group bg-green-500/5">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
                  <span className="material-symbols-outlined text-green-500 text-4xl">style</span>
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white text-lg">Blackjack</h4>
                  <p className="text-xs text-white/50 mt-1 font-mono">Juega contra la CPU.</p>
                </div>
              </button>
              
              <button onClick={() => setSelectedGameToInvite('rps')} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 transition-all hover:-translate-y-1 group hover:bg-blue-500/5 border-blue-500/20">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                  <Swords size={32} className="text-blue-500" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white text-lg">Piedra Papel Tijera</h4>
                  <p className="text-xs text-white/50 mt-1 font-mono">Suerte y estrategia.</p>
                </div>
              </button>

              <button onClick={() => setSelectedGameToInvite('reaction')} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-purple-500/50 transition-all hover:-translate-y-1 group hover:bg-purple-500/5 border-purple-500/20">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]">
                  <Zap size={32} className="text-purple-500" />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-white text-lg">Carrera de Reacción</h4>
                  <p className="text-xs text-white/50 mt-1 font-mono">¿Quién tiene mejores reflejos?</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedGameToInvite(null)} className="p-2 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h3 className="font-bold text-white text-lg font-logo">
                Invitar a jugar {selectedGameToInvite === 'tictactoe' ? 'Tic Tac Toe' : selectedGameToInvite === 'rps' ? 'Piedra Papel Tijera' : 'Carrera de Reacción'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {peers.map(peer => (
                <div key={peer.id} className="glass-panel rounded-xl p-4 flex items-center justify-between border-white/10 hover:border-orange-500/50 transition-all hover:bg-white/5 cursor-pointer" onClick={() => inviteToGame(peer.id, peer.nombre, selectedGameToInvite)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] bg-white/5" style={{ color: peer.color || '#fff' }}>
                      {peer.avatar || peer.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[15px] text-white">{peer.nombre}</span>
                      <span className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5 font-mono">{peer.zona}</span>
                    </div>
                  </div>
                  <button className="bg-orange-500/20 text-orange-400 px-4 py-2 text-xs rounded-lg border border-orange-500/30 hover:bg-orange-500 hover:text-[#05050a] transition-colors font-bold">
                    Invitar
                  </button>
                </div>
              ))}
              {peers.length === 0 && (
                <div className="col-span-full py-8 text-center glass-panel rounded-xl opacity-60">
                  <UserX size={48} className="mx-auto mb-2 text-white/40" />
                  <p className="text-sm text-white/60">No hay usuarios disponibles en la red para invitar.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
