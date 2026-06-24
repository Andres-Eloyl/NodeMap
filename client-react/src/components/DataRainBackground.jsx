import React, { useEffect, useRef } from 'react';

export function DataRainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*<>[]{}';
    const fontSize = 16;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops = Array.from({length: columns}).fill(1);

    const draw = () => {
      // Fade effect to leave trails
      ctx.fillStyle = 'rgba(19, 18, 29, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Color temático (Turquesa)
      ctx.fillStyle = 'rgba(3, 198, 178, 0.6)';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-background">
      <canvas ref={canvasRef} className="block w-full h-full opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50"></div>
    </div>
  );
}
