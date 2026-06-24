export function RetroGridBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background flex flex-col justify-end">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent z-10"></div>
      <div className="absolute top-1/4 w-full h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(255,84,81,0.8)] z-10"></div>
      
      <div style={{ perspective: '1000px', height: '75vh', width: '100vw', position: 'absolute', bottom: 0, overflow: 'hidden' }}>
        <div 
            className="w-[300vw] h-[300vh] relative left-[-100vw] top-[-50vh] bg-[linear-gradient(to_right,rgba(3,198,178,0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(3,198,178,0.3)_1px,transparent_1px)]"
            style={{
            backgroundSize: '60px 60px',
            transform: 'rotateX(75deg) translateY(0)',
            transformOrigin: 'top center',
            animation: 'grid-move 2s linear infinite'
            }}
        />
      </div>
      <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
      `}</style>
    </div>
  );
}
