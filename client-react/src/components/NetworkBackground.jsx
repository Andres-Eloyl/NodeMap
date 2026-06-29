import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const CONSUMER_PARTICLES = [
  { bg: "oklch(0.74 0.13 45 / 0.6)", shadow: "oklch(0.74 0.13 45 / 0.5)" },
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.75 0.14 150 / 0.5)", shadow: "oklch(0.75 0.14 150 / 0.4)" },
  { bg: "oklch(0.74 0.13 45 / 0.6)", shadow: "oklch(0.74 0.13 45 / 0.5)" },
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.75 0.14 150 / 0.5)", shadow: "oklch(0.75 0.14 150 / 0.4)" },
];

const WORK_PARTICLES = [
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.85 0.15 230 / 0.6)", shadow: "oklch(0.85 0.15 230 / 0.5)" },
  { bg: "oklch(0.70 0.20 255 / 0.5)", shadow: "oklch(0.70 0.20 255 / 0.4)" },
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.85 0.15 230 / 0.6)", shadow: "oklch(0.85 0.15 230 / 0.5)" },
  { bg: "oklch(0.70 0.20 255 / 0.5)", shadow: "oklch(0.70 0.20 255 / 0.4)" },
];

export function NetworkBackground() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const location = useLocation();

  useEffect(() => {
    const onMove = (e) =>
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const parallaxX = (mouse.x - 0.5) * 30;
  const parallaxY = (mouse.y - 0.5) * 30;

  const isWork = location.pathname.startsWith('/work');
  const particles = isWork ? WORK_PARTICLES : CONSUMER_PARTICLES;
  
  const radialGradient = isWork 
    ? "radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.5 0.2 250 / 0.15), transparent 60%), radial-gradient(ellipse 50% 50% at 85% 80%, oklch(0.5 0.18 210 / 0.1), transparent 60%)"
    : "radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.4 0.2 250 / 0.25), transparent 60%), radial-gradient(ellipse 50% 50% at 85% 80%, oklch(0.5 0.18 210 / 0.18), transparent 60%)";

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#05050a]">
      {/* Ambient backdrop with mouse parallax */}
      <div
        className="pointer-events-none fixed inset-0 bg-grid-nodes opacity-60 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${parallaxX * 0.4}px, ${parallaxY * 0.4}px, 0)` }}
      />
      <div
        className="pointer-events-none fixed inset-0 animate-node-pulse transition-transform duration-500 ease-out"
        style={{
          background: radialGradient,
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />

      {/* Floating particles */}
      {particles.map((color, i) => (
        <div
          key={i}
          className="pointer-events-none fixed h-1 w-1 rounded-full z-0"
          style={{
            top: `${15 + i * 13}%`,
            left: `${10 + ((i * 17) % 80)}%`,
            animation: `drift ${8 + i}s ease-in-out infinite`,
            backgroundColor: color.bg,
            boxShadow: `0 0 12px ${color.shadow}`,
          }}
        />
      ))}
    </div>
  );
}
