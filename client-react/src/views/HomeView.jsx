import { useNavigate } from 'react-router-dom';
import { Globe2, Building2, ArrowRight, ChevronDown, Network, Shield, Zap, Lock, Check, Minus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PARTICLE_COLORS = [
  { bg: "oklch(0.74 0.13 45 / 0.6)", shadow: "oklch(0.74 0.13 45 / 0.5)" },
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.75 0.14 150 / 0.5)", shadow: "oklch(0.75 0.14 150 / 0.4)" },
  { bg: "oklch(0.74 0.13 45 / 0.6)", shadow: "oklch(0.74 0.13 45 / 0.5)" },
  { bg: "oklch(0.88 0.12 210 / 0.6)", shadow: "oklch(0.88 0.12 210 / 0.5)" },
  { bg: "oklch(0.75 0.14 150 / 0.5)", shadow: "oklch(0.75 0.14 150 / 0.4)" },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("opacity-100", "translate-y-0");
            e.target.classList.remove("opacity-0", "translate-y-8");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function HomeView() {
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMove = (e) =>
      setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const parallaxX = (mouse.x - 0.5) * 30;
  const parallaxY = (mouse.y - 0.5) * 30;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#05050a] text-white">
      {/* Ambient backdrop with mouse parallax */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 transition-transform duration-300 ease-out"
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: `translate3d(${parallaxX * 0.4}px, ${parallaxY * 0.4}px, 0)` 
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 animate-pulse transition-transform duration-500 ease-out"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.4 0.2 250 / 0.25), transparent 60%), radial-gradient(ellipse 50% 50% at 85% 80%, oklch(0.5 0.18 210 / 0.18), transparent 60%)",
          transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => {
        const color = PARTICLE_COLORS[i];
        return (
          <div
            key={i}
            className="pointer-events-none fixed h-1 w-1 rounded-full animate-bounce"
            style={{
              top: `${15 + i * 13}%`,
              left: `${10 + ((i * 17) % 80)}%`,
              animationDuration: `${8 + i}s`,
              backgroundColor: color.bg,
              boxShadow: `0 0 12px ${color.shadow}`,
            }}
          />
        );
      })}

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <header
          className="mb-14 text-center animate-fade-in"
          style={{
            transform: `translateY(${scrollY * 0.25}px)`,
            opacity: Math.max(0, 1 - scrollY / 500),
          }}
        >
          {/* Spinning orbit halo behind title */}
          <div className="relative inline-block">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full opacity-40"
              style={{
                animationDuration: '20s',
                background:
                  "conic-gradient(from 0deg, transparent 0%, oklch(0.74 0.13 45 / 0.25) 25%, transparent 50%, oklch(0.62 0.24 255 / 0.25) 75%, transparent 100%)",
                filter: "blur(40px)",
              }}
            />
            <h1 className="relative font-logo text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
              <span className="text-white">Node</span>
              <span
                className="bg-gradient-to-r from-orange-400 to-blue-500 bg-clip-text text-transparent"
                style={{ filter: "drop-shadow(0 0 24px oklch(0.74 0.13 45 / 0.35))" }}
              >
                Map
              </span>
            </h1>
          </div>
          <p className="mt-5 font-mono text-xs tracking-[0.35em] text-white/50 sm:text-sm">
            ELIGE TU MODALIDAD DE ACCESO
          </p>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
        </header>

        <div
          className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 animate-fade-in"
          style={{ animationDelay: "150ms" }}
        >
          <ModeCard
            variant="consumer"
            icon={<Globe2 className="h-10 w-10" strokeWidth={1.5} />}
            titleMain="NodeMap"
            titleAccent="Consumer"
            description="Red P2P pública. Explora zonas, foros y juegos en la feria libremente sin requerir cuenta."
            tag="PUBLIC · P2P"
            cta="Entrar como Consumer"
            onClick={() => navigate('/map')}
          />
          <ModeCard
            variant="work"
            icon={<Building2 className="h-10 w-10" strokeWidth={1.5} />}
            titleMain="NodeMap"
            titleAccent="Work"
            description="Entorno corporativo P2P. Colaboración interna segura, canales privados y topología empresarial."
            tag="ENTERPRISE · SECURE"
            cta="Acceso empresarial"
            onClick={() => navigate('/work/login')}
          />
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          className="group mt-16 flex flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/50 transition-colors hover:text-orange-400"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        >
          <span>EXPLORAR</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* FEATURES — scroll reveal */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-32">
        <RevealHeader />
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <RevealFeature key={f.title} feature={f} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section id="comparison" className="relative z-10 mx-auto max-w-4xl px-6 py-24">
        <RevealComparison />
      </section>

      {/* PROTOCOL STRIP */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-32">
        <RevealStrip />
      </section>

      <footer className="relative z-10 border-t border-white/5 py-10 text-center font-mono text-[10px] tracking-widest text-white/40">
        v1.0.0 · DISTRIBUTED MESH PROTOCOL
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: Network,
    title: "Mesh P2P",
    desc: "Topología descentralizada sin servidores intermedios.",
    color: "oklch(0.74 0.13 45)",
  },
  {
    icon: Shield,
    title: "Cifrado E2E",
    desc: "Cada nodo comunica con cifrado punto a punto verificable.",
    color: "oklch(0.62 0.24 255)",
  },
  {
    icon: Zap,
    title: "Baja latencia",
    desc: "Enrutamiento dinámico que minimiza saltos en la red.",
    color: "oklch(0.88 0.12 210)",
  },
  {
    icon: Lock,
    title: "Identidad soberana",
    desc: "Las claves nunca abandonan tu dispositivo.",
    color: "oklch(0.75 0.14 150)",
  },
];

function RevealHeader() {
  const ref = useReveal();
  return (
    <div ref={ref} className="text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
      <p className="font-mono text-[10px] tracking-[0.35em] text-orange-400/80">// PROTOCOLO</p>
      <h2 className="mt-3 font-logo text-4xl font-bold tracking-tight sm:text-5xl">
        Diseñado como una <span className="text-blue-400">red viva</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
        Cada modalidad comparte el mismo núcleo: nodos autónomos que se descubren, validan y enrutan
        sin punto único de falla.
      </p>
    </div>
  );
}

function RevealFeature({ feature, delay }) {
  const ref = useReveal();
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-6 transition-all duration-700 hover:-translate-y-1 hover:border-white/20 opacity-0 translate-y-8"
      style={{
        transitionDelay: `${delay}ms`,
        backdropFilter: "blur(12px)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${feature.color} / 0.3, transparent 70%)` }}
      />
      <div
        className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10"
        style={{ color: feature.color, boxShadow: `inset 0 0 18px ${feature.color}1a` }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h3 className="font-bold text-lg font-semibold">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.desc}</p>
    </div>
  );
}

function RevealStrip() {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-white/10 p-10 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out"
      style={{
        backdropFilter: "blur(12px)",
        background:
          "linear-gradient(135deg, rgba(40,15,10,0.35) 0%, rgba(20,30,60,0.35) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 animate-pulse"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
      />
      <p className="relative font-mono text-[10px] tracking-[0.35em] text-white/50">
        // LISTO PARA CONECTARTE
      </p>
      <h3 className="relative mt-3 font-logo text-3xl font-bold tracking-tight sm:text-4xl">
        Sube al <span className="text-orange-400">mesh</span>.
      </h3>
      <p className="relative mx-auto mt-3 max-w-md text-sm text-white/60">
        Vuelve arriba y elige tu modalidad para entrar en la red.
      </p>
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="relative mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-blue-400 transition-transform hover:translate-x-1"
      >
        <span>Volver al inicio</span>
        <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
      </a>
    </div>
  );
}

const COMPARISON_ROWS = [
  { label: "Acceso a la red", consumer: "Público", work: "Privado + VPN overlay" },
  { label: "Cuenta requerida", consumer: "Opcional", work: "Obligatoria (SSO/SAML)" },
  { label: "Cifrado", consumer: "E2E estándar", work: "E2E + ACL empresarial" },
  { label: "Topología de nodos", consumer: "Mesh público", work: "Mesh dedicado" },
  { label: "Prioridad de enrutado", consumer: "Estándar", work: "Alta prioridad" },
  { label: "Latencia garantizada", consumer: "Variable", work: "SLA < 30 ms" },
  { label: "Identidad", consumer: "Anónima / Pseudónima", work: "Corporativa federada" },
  { label: "Soporte técnico", consumer: "Comunidad", work: "Prioritario 24/7" },
];

function RevealComparison() {
  const ref = useReveal();
  return (
    <div ref={ref} className="opacity-0 translate-y-8 transition-all duration-700 ease-out">
      <div className="text-center">
        <p className="font-mono text-[10px] tracking-[0.35em] text-orange-400/80">// COMPARATIVA</p>
        <h2 className="mt-3 font-logo text-4xl font-bold tracking-tight sm:text-5xl">
          Consumer <span className="text-white/40">vs</span>{" "}
          <span className="text-blue-500">Work</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/60">
          El mismo protocolo, dos experiencias. Elige según tu contexto.
        </p>
      </div>

      <div
        className="mt-14 overflow-hidden rounded-2xl border border-white/10"
        style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* Header row */}
        <div className="grid grid-cols-3 border-b border-white/10 text-center font-mono text-[10px] tracking-widest uppercase text-white/50">
          <div className="px-4 py-4 text-left">Característica</div>
          <div className="px-4 py-4 text-orange-400">Consumer</div>
          <div className="px-4 py-4 text-blue-500">Work</div>
        </div>

        {/* Rows */}
        {COMPARISON_ROWS.map((row, i) => {
          const isConsumerBetter = [
            "Opcional",
            "Anónima / Pseudónima",
            "Comunidad",
          ].includes(row.consumer);
          const isWorkBetter = row.work.includes("SLA") || row.work.includes("Prioritario") || row.work.includes("Obligatoria") || row.work.includes("Privado") || row.work.includes("dedicado") || row.work.includes("Alta");

          return (
            <div
              key={row.label}
              className="grid grid-cols-3 items-center border-b border-white/5 transition-colors duration-200 hover:bg-white/[0.02]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="px-4 py-4 text-sm text-white/60">{row.label}</div>
              <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm">
                {isConsumerBetter ? (
                  <Check className="h-3.5 w-3.5 text-orange-400" strokeWidth={2.5} />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
                )}
                <span className={isConsumerBetter ? "text-orange-400" : "text-white/80"}>{row.consumer}</span>
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm">
                {isWorkBetter ? (
                  <Check className="h-3.5 w-3.5 text-blue-500" strokeWidth={2.5} />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-white/30" strokeWidth={2} />
                )}
                <span className={isWorkBetter ? "text-blue-500" : "text-white/80"}>{row.work}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModeCard({ variant, icon, titleMain, titleAccent, description, tag, cta, onClick }) {
  const isWork = variant === "work";
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const accentColor = isWork ? "oklch(0.62 0.24 255)" : "oklch(0.74 0.13 45)";
  const accentText = isWork ? "text-blue-500" : "text-orange-400";

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      className="group relative overflow-hidden rounded-2xl border border-white/10 p-8 text-left transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-transparent"
      style={{
        backdropFilter: "blur(12px)",
        background: isWork
          ? "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(20,30,60,0.35) 100%)"
          : "rgba(0,0,0,0.4)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 20px 60px ${accentColor.replace(")", " / 0.25)")}, 0 0 0 1px ${accentColor}`;
        if (isWork) {
          e.currentTarget.style.background =
            "linear-gradient(135deg, rgba(10,20,50,0.6) 0%, rgba(30,50,120,0.45) 100%)";
        } else {
          e.currentTarget.style.background =
            "linear-gradient(135deg, rgba(40,15,10,0.45) 0%, rgba(80,30,20,0.3) 100%)";
        }
      }}
      onMouseLeave={(e) => {
        setTilt({ x: 0, y: 0 });
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
        if (isWork) {
          e.currentTarget.style.background =
            "linear-gradient(135deg, rgba(0,0,0,0.45) 0%, rgba(20,30,60,0.35) 100%)";
        } else {
          e.currentTarget.style.background = "rgba(0,0,0,0.4)";
        }
      }}
    >
      {/* Top glow line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* Shimmer sweep on hover */}
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
        }}
      />

      {/* Corner mono tag */}
      <div className="mb-8 flex items-start justify-between">
        <div
          className={`rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] tracking-widest ${accentText}`}
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {tag}
        </div>
        <div className="font-mono text-[10px] tracking-widest text-white/40">
          {isWork ? "02" : "01"}
        </div>
      </div>

      <div
        className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 transition-transform duration-300 ease-in-out group-hover:scale-110 ${accentText}`}
        style={{
          background: "rgba(255,255,255,0.03)",
          boxShadow: `inset 0 0 24px ${accentColor.replace(")", " / 0.1)")}`,
        }}
      >
        {icon}
      </div>

      <h2 className="font-logo text-3xl font-semibold tracking-tight sm:text-4xl">
        <span className="text-white/60">{titleMain}</span>{" "}
        <span className={accentText}>{titleAccent}</span>
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/50">
        {description}
      </p>

      <div
        className={`mt-8 flex items-center gap-2 font-mono text-xs tracking-widest uppercase ${accentText} transition-transform duration-300 group-hover:translate-x-1`}
      >
        <span>{cta}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>

      <div
        className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full opacity-20 transition-opacity duration-300 group-hover:opacity-40"
        style={{
          background: `radial-gradient(circle, ${accentColor}, transparent 70%)`,
        }}
      />
    </button>
  );
}
