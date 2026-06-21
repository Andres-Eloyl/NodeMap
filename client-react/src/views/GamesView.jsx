import { useState, useEffect } from 'react';
import { useWebRTCStore } from '../store/useWebRTCStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Gamepad } from 'lucide-react';
import { TicTacToe } from '../components/Games/TicTacToe';
import { RockPaperScissors } from '../components/Games/RockPaperScissors';
import PROTOCOL from '../../../shared/protocol.js';

export function GamesView() {
  const peers = useWebRTCStore(state => state.peers);
  const myId = useWebRTCStore(state => state.myId);
  const [activeGame, setActiveGame] = useState(null); // null, 'tictactoe', 'rps'
  const [opponent, setOpponent] = useState(null);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.on(PROTOCOL.GAME_INVITE, (data) => {
        setInvites(prev => [...prev, { from: data.senderId, name: data.nombre, game: data.gameType }]);
      });
      WebRTCEngine.on(PROTOCOL.GAME_ACCEPT, (data) => {
        setOpponent({ id: data.senderId, name: data.nombre });
        setActiveGame(data.gameType);
      });
      WebRTCEngine.on(PROTOCOL.GAME_REJECT, (data) => {
        alert(`${data.nombre} rechazó tu invitación a jugar.`);
      });
    });
  }, []);

  const inviteToGame = (peerId, peerName, gameType) => {
    import('../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(peerId, PROTOCOL.GAME_INVITE, { gameType, nombre: 'Yo' });
      alert(`Invitación enviada a ${peerName}`);
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

  return (
    <div className="flex flex-col h-full bg-surface-container  border border-primary/20 overflow-hidden relative">
      <div className="p-4 border-b border-primary/20 bg-surface-container-highest/50 backdrop-blur-md">
        <h2 className="font-headline-lg text-[20px] font-bold text-on-surface">Zona Arcade</h2>
        <p className="text-[12px] text-on-surface-variant">Reta a tus amigos a una partida rápida.</p>
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

        <h3 className="font-bold text-white mb-4">Peers Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {peers.map(peer => (
            <div key={peer.id} className="glass-card p-4  flex items-center justify-between border border-outline-variant/30 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10  flex items-center justify-center text-xl bg-primary/20" style={{ color: peer.color || '#fff' }}>
                  {peer.avatar || '👤'}
                </div>
                <span className="font-bold text-[14px]" style={{ color: peer.color || '#fff' }}>{peer.nombre}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => inviteToGame(peer.id, peer.nombre, 'tictactoe')} className="btn-ghost px-3 py-1.5 text-xs  flex items-center gap-1" title="Tic Tac Toe">
                  <Gamepad size={14}/> TTT
                </button>
                <button onClick={() => inviteToGame(peer.id, peer.nombre, 'rps')} className="btn-ghost px-3 py-1.5 text-xs  flex items-center gap-1" title="Piedra Papel Tijera">
                  <Swords size={14}/> PPT
                </button>
              </div>
            </div>
          ))}
          {peers.length === 0 && <p className="text-sm text-on-surface-variant">Nadie más está conectado en este momento.</p>}
        </div>
      </div>
    </div>
  );
}
