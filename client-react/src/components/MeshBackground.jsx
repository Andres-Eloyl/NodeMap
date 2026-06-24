export function MeshBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/30 mix-blend-screen filter blur-[100px] animate-[spin_20s_linear_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#03c6b2]/20 mix-blend-screen filter blur-[120px] animate-[spin_25s_linear_infinite_reverse]" />
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#ffb3ad]/10 mix-blend-screen filter blur-[90px] animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent,_var(--tw-gradient-stops))] from-transparent to-background/90"></div>
    </div>
  );
}
