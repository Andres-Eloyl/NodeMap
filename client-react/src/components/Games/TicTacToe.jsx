import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebRTCStore } from '../../store/useWebRTCStore';
import PROTOCOL from '../../../../shared/protocol.js';

export function TicTacToe({ opponent, onExit }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [myMark, setMyMark] = useState(null); // 'X' or 'O'
  const myId = useWebRTCStore(state => state.myId);

  useEffect(() => {
    // Arbitrary assignment based on IDs
    setMyMark(myId < opponent.id ? 'X' : 'O');

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.on(PROTOCOL.GAME_MOVE, (data) => {
        if (data.gameType === 'tictactoe' && data.senderId === opponent.id) {
          setBoard(data.board);
          setXIsNext(data.xIsNext);
        }
      });
    });
  }, [opponent.id, myId]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (!squares.includes(null)) return { winner: 'Draw', line: null };
    return null;
  };

  const winData = calculateWinner(board);
  const winner = winData?.winner;
  const winLine = winData?.line;

  const handleClick = (i) => {
    if (board[i] || winner || (xIsNext ? 'X' : 'O') !== myMark) return;
    
    const newBoard = [...board];
    newBoard[i] = myMark;
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    import('../../services/webrtc.js').then(({ WebRTCEngine }) => {
      WebRTCEngine.sendMessage(opponent.id, PROTOCOL.GAME_MOVE, {
        gameType: 'tictactoe',
        board: newBoard,
        xIsNext: !xIsNext
      });
    });
  };

  const isMyTurn = (xIsNext ? 'X' : 'O') === myMark;
  let status = winner ? (winner === 'Draw' ? "¡Empate!" : (winner === myMark ? "¡Ganaste!" : "¡Perdiste!")) : (isMyTurn ? "Tu turno" : `Turno de ${opponent.name}`);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface-container  p-6 relative">
      <h2 className="text-3xl font-bold text-white mb-2">Tic Tac Toe</h2>
      <p className="text-on-surface-variant mb-8 text-lg">{status} (Eres {myMark})</p>

      <div className="relative">
        <div className="grid grid-cols-3 gap-2 bg-outline-variant p-2 ">
          {board.map((square, i) => (
            <motion.button
              key={i}
              whileHover={!square && !winner && isMyTurn ? { scale: 1.05 } : {}}
              whileTap={!square && !winner && isMyTurn ? { scale: 0.95 } : {}}
              onClick={() => handleClick(i)}
              className="w-24 h-24 sm:w-32 sm:h-32 bg-surface flex items-center justify-center  cursor-pointer border border-transparent shadow-inner"
              style={{
                color: square === 'X' ? '#ff5451' : '#69d8d4',
              }}
            >
              <AnimatePresence>
                {square && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl sm:text-7xl font-bold"
                  >
                    {square}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {winLine && (
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            <svg className="w-full h-full absolute" viewBox="0 0 100 100">
              {/* Very simplified line rendering; ideally mapped exactly to the grid cells */}
              <motion.line
                x1={winLine.includes(0) || winLine.includes(3) || winLine.includes(6) ? "16%" : winLine.includes(1) || winLine.includes(4) || winLine.includes(7) ? "50%" : "84%"}
                y1={winLine.includes(0) || winLine.includes(1) || winLine.includes(2) ? "16%" : winLine.includes(3) || winLine.includes(4) || winLine.includes(5) ? "50%" : "84%"}
                x2={winLine.includes(2) || winLine.includes(5) || winLine.includes(8) ? "84%" : winLine.includes(1) || winLine.includes(4) || winLine.includes(7) ? "50%" : "16%"}
                y2={winLine.includes(6) || winLine.includes(7) || winLine.includes(8) ? "84%" : winLine.includes(3) || winLine.includes(4) || winLine.includes(5) ? "50%" : "16%"}
                stroke={winner === myMark ? "#ff5451" : "#69d8d4"}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
            </svg>
          </motion.div>
        )}
      </div>

      <button onClick={onExit} className="mt-8 btn-ghost px-6 py-2 ">
        Salir del Juego
      </button>
    </div>
  );
}
