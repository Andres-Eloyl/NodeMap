import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Map as MapIcon,
  Users,
  MessageSquare,
  MessagesSquare,
  Gamepad2,
  LogOut,
  Star,
  ArrowRight,
  Globe2,
  MapPin,
  Lock,
  MessageSquareText,
  Send,
  Heart,
  MessageCircle,
  Clock,
  UserX,
  Swords,
  Zap,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/consumer")({
  head: () => ({
    meta: [
      { title: "NodeMap Consumer — Red descentralizada" },
      {
        name: "description",
        content:
          "Accede a NodeMap Consumer: mapa, usuarios, chat, foro y juegos en una red P2P descentralizada.",
      },
    ],
  }),
  component: ConsumerApp,
});

type TabKey = "map" | "users" | "chat" | "social" | "games";

const TABS: { key: TabKey; label: string; icon: typeof MapIcon }[] = [
  { key: "map", label: "Mapa", icon: MapIcon },
  { key: "users", label: "Usuarios", icon: Users },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "social", label: "Social", icon: MessagesSquare },
  { key: "games", label: "Juegos", icon: Gamepad2 },
];

function ConsumerApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("map");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05050a] text-foreground">
      {/* Ambient backdrop */}
      <Backdrop />

      {isLoggedIn ? (
        <MainLayout
          username={username}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={() => {
            setIsLoggedIn(false);
            setUsername("");
          }}
        />
      ) : (
        <LoginScreen
          username={username}
          setUsername={setUsername}
          onEnter={() => {
            if (username.trim()) setIsLoggedIn(true);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- Backdrop ------------------------------- */

function Backdrop() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 bg-grid-nodes opacity-40" />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 15%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(ellipse 50% 50% at 85% 80%, rgba(249,115,22,0.10), transparent 60%), radial-gradient(ellipse 40% 30% at 50% 100%, rgba(249,115,22,0.08), transparent 70%)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />
    </>
  );
}

/* ------------------------------- LOGIN ---------------------------------- */

function LoginScreen({
  username,
  setUsername,
  onEnter,
}: {
  username: string;
  setUsername: (v: string) => void;
  onEnter: () => void;
}) {
  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
        className="animate-fade-in-up w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10"
        style={{
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.04)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/30"
            style={{
              background: "rgba(249,115,22,0.08)",
              boxShadow:
                "inset 0 0 24px rgba(249,115,22,0.25), 0 0 24px rgba(249,115,22,0.2)",
            }}
          >
            <Globe2 className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-white/80">Node</span>
            <span
              className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 18px rgba(249,115,22,0.45))" }}
            >
              Map
            </span>
          </h1>
          <p className="mt-3 font-mono text-[10px] tracking-[0.35em] text-muted-foreground">
            CONSUMER · RED DESCENTRALIZADA
          </p>
        </div>

        <div className="mt-8 space-y-2">
          <label
            htmlFor="username"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
          >
            Nombre de usuario
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@tu_nodo"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-orange-500/20"
              autoFocus
            />
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!username.trim()}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[#1a0a00] transition-all duration-300 hover:bg-orange-400 hover:shadow-[0_0_32px_rgba(249,115,22,0.55)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-orange-500 disabled:hover:shadow-none"
        >
          <span>Entrar</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-6 flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground/60">
          <span>v1.0.0 · P2P MESH</span>
          <Link to="/" className="hover:text-orange-400 transition-colors">
            ← VOLVER
          </Link>
        </div>
      </form>
    </main>
  );
}

/* ------------------------------- MAIN LAYOUT ---------------------------- */

function MainLayout({
  username,
  activeTab,
  setActiveTab,
  onLogout,
}: {
  username: string;
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  onLogout: () => void;
}) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <TopBar username={username} onLogout={onLogout} />

      {/* Desktop side / top tab nav */}
      <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <main className="flex-1 px-4 pb-28 pt-4 sm:px-6 md:pb-10">
        <div className="mx-auto max-w-6xl animate-fade-in-up">
          <TabContent tab={activeTab} username={username} />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

/* -------------------------------- TOP BAR ------------------------------- */

function TopBar({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(5,5,10,0.6)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-500/30"
            style={{
              background: "rgba(249,115,22,0.08)",
              boxShadow: "inset 0 0 16px rgba(249,115,22,0.25)",
            }}
          >
            <Globe2 className="h-4 w-4 text-orange-400" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-tight">
              <span className="text-white/80">Node</span>
              <span className="text-orange-400">Map</span>
            </div>
            <div className="font-mono text-[9px] tracking-widest text-muted-foreground/70">
              @{username || "usuario"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PointsBadge points={150} />
          <button
            type="button"
            onClick={onLogout}
            className="group flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            aria-label="Salir"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function PointsBadge({ points }: { points: number }) {
  return (
    <div
      className="flex h-9 items-center gap-1.5 rounded-lg border border-yellow-400/30 px-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(250,204,21,0.10) 0%, rgba(249,115,22,0.08) 100%)",
        boxShadow:
          "inset 0 0 14px rgba(250,204,21,0.18), 0 0 18px rgba(250,204,21,0.12)",
      }}
    >
      <Star
        className="h-3.5 w-3.5 text-yellow-300"
        fill="currentColor"
        strokeWidth={1.5}
      />
      <span className="font-mono text-xs font-semibold text-yellow-100">
        {points} <span className="text-yellow-300/70">pts</span>
      </span>
    </div>
  );
}

/* -------------------------------- TABS ---------------------------------- */

function DesktopTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
}) {
  return (
    <nav
      className="sticky top-16 z-20 hidden border-b border-white/5 md:block"
      style={{
        backdropFilter: "blur(16px)",
        background: "rgba(5,5,10,0.5)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 px-6">
        {TABS.map((t) => (
          <TabButton
            key={t.key}
            tab={t}
            active={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            variant="desktop"
          />
        ))}
      </div>
    </nav>
  );
}

function MobileTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 md:hidden"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(5,5,10,0.75)",
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((t) => (
          <TabButton
            key={t.key}
            tab={t}
            active={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            variant="mobile"
          />
        ))}
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  active,
  onClick,
  variant,
}: {
  tab: { key: TabKey; label: string; icon: typeof MapIcon };
  active: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
}) {
  const Icon = tab.icon;

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
          active ? "text-orange-400" : "text-muted-foreground/70 hover:text-foreground"
        }`}
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={active ? 2 : 1.5}
          style={active ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" } : undefined}
        />
        <span className="font-mono text-[9px] uppercase tracking-wider">{tab.label}</span>
        {active && (
          <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3.5 font-mono text-xs uppercase tracking-widest transition-colors ${
        active ? "text-orange-400" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon
        className="h-4 w-4"
        strokeWidth={active ? 2 : 1.5}
        style={active ? { filter: "drop-shadow(0 0 6px rgba(249,115,22,0.7))" } : undefined}
      />
      <span>{tab.label}</span>
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
      )}
    </button>
  );
}

/* ----------------------------- TAB CONTENT ------------------------------ */

function TabContent({ tab, username }: { tab: TabKey; username: string }) {
  switch (tab) {
    case "map":
      return <MapView />;
    case "users":
      return <UsersView currentUser={username} />;
    case "chat":
      return <ChatView />;
    case "social":
      return <ForumView />;
    case "games":
      return <GamesView />;
  }
}

function GlassPanel({
  title,
  subtitle,
  children,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon: typeof MapIcon;
}) {
  return (
    <section
      className="rounded-2xl border border-white/10 p-6 sm:p-8"
      style={{
        backdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.03)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
      }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/30"
          style={{
            background: "rgba(249,115,22,0.08)",
            boxShadow: "inset 0 0 16px rgba(249,115,22,0.25)",
          }}
        >
          <Icon className="h-5 w-5 text-orange-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h2>
          {subtitle && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function MapView() {
  return (
    <GlassPanel title="Mapa de la red" subtitle="Nodos activos cercanos" icon={MapIcon}>
      <div
        className="relative h-[420px] overflow-hidden rounded-xl border border-white/10 bg-grid-nodes"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(249,115,22,0.18), transparent 40%), radial-gradient(circle at 70% 60%, rgba(249,115,22,0.12), transparent 40%)",
          }}
        />
        {[
          { top: "30%", left: "25%", label: "Nodo A" },
          { top: "55%", left: "60%", label: "Nodo B" },
          { top: "40%", left: "75%", label: "Nodo C" },
          { top: "70%", left: "35%", label: "Nodo D" },
        ].map((n) => (
          <div
            key={n.label}
            className="absolute flex flex-col items-center gap-1"
            style={{ top: n.top, left: n.left, transform: "translate(-50%, -50%)" }}
          >
            <div className="relative">
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-400/60" />
              <MapPin className="relative h-5 w-5 text-orange-400" fill="currentColor" />
            </div>
            <span className="font-mono text-[9px] tracking-widest text-orange-200/80">
              {n.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground">
        // 4 NODOS ACTIVOS · LATENCIA MEDIA 42ms
      </p>
    </GlassPanel>
  );
}

function UsersView({ currentUser }: { currentUser: string }) {
  const users = [
    { name: "nova.dev", id: "1A2B3C4D", zone: "Zona A", status: "online", pts: 420 },
    { name: "k4t.eth", id: "4D5E6F7G", zone: "Zona B", status: "online", pts: 318 },
    { name: "alex_p2p", id: "7G8H9I0J", zone: "Zona A", status: "idle", pts: 205 },
    { name: "mesh_runner", id: "0J1K2L3M", zone: "Zona C", status: "online", pts: 188 },
    { name: "ghost.node", id: "3M4N5O6P", zone: "Zona B", status: "offline", pts: 95 },
  ];

  if (users.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <UserX className="h-20 w-20 text-muted-foreground/20" />
        <p className="mt-4 font-mono text-sm text-muted-foreground/40">
          No hay usuarios en esta zona
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Directorio de Usuarios
        </h2>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Nodos activos en la red mesh
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const isMe = u.name === currentUser;
          return (
            <div
              key={u.name}
              className="group relative flex items-start gap-4 rounded-xl border border-white/10 p-4 transition-all duration-300 hover:border-orange-500/30"
              style={{
                backdropFilter: "blur(12px)",
                background: "rgba(255,255,255,0.03)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 font-mono text-lg font-bold text-orange-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    boxShadow: "inset 0 0 20px rgba(255,255,255,0.05)",
                  }}
                >
                  {u.name[0].toUpperCase()}
                </div>
                {u.status === "online" && (
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#05050a] bg-green-400" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-sm font-semibold text-white">
                    @{u.name}
                  </span>
                  {isMe && (
                    <span className="shrink-0 rounded border border-orange-400/60 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                      TÚ
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground/60">
                  ID: {u.id}...
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-2">
                <div
                  className="flex items-center gap-1 rounded-md border border-yellow-400/30 px-2 py-0.5"
                  style={{
                    background: "linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(249,115,22,0.05) 100%)",
                    boxShadow: "inset 0 0 8px rgba(250,204,21,0.1), 0 0 10px rgba(250,204,21,0.08)",
                  }}
                >
                  <Star className="h-3 w-3 text-yellow-300" fill="currentColor" />
                  <span className="font-mono text-[10px] font-semibold text-yellow-100">
                    {u.pts} <span className="text-yellow-300/70">pts</span>
                  </span>
                </div>
                <span className="font-mono text-[9px] tracking-wider text-muted-foreground/40">
                  {u.zone}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatView() {
  const subtabs = ["Global", "Zona", "Privado"] as const;
  const [active, setActive] = useState<(typeof subtabs)[number]>("Global");
  const messages = {
    Global: [
      { from: "nova.dev", text: "alguien en el mesh sur?" },
      { from: "k4t.eth", text: "yo, latencia 38ms" },
      { from: "mesh_runner", text: "subiendo nodo nuevo en sector 7" },
    ],
    Zona: [
      { from: "alex_p2p", text: "evento en plaza central a las 20h" },
      { from: "nova.dev", text: "vamos" },
    ],
    Privado: [{ from: "k4t.eth", text: "hey, recibiste el handshake?" }],
  } as const;

  return (
    <GlassPanel title="Chat" subtitle="Mensajería P2P cifrada" icon={MessageSquare}>
      <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
        {subtabs.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(s)}
            className={`rounded-md px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
              active === s
                ? "bg-orange-500/20 text-orange-300 shadow-[inset_0_0_12px_rgba(249,115,22,0.25)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-white/5 bg-black/30 p-4">
        {messages[active].map((m, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="font-mono text-xs text-orange-300">@{m.from}</span>
            <span className="text-sm text-foreground/90">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder={`Mensaje · ${active.toLowerCase()}`}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground/40 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
        />
        <button
          type="button"
          className="rounded-lg bg-orange-500 px-5 font-mono text-xs font-semibold uppercase tracking-widest text-[#1a0a00] transition hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]"
        >
          Enviar
        </button>
      </div>
    </GlassPanel>
  );
}

interface ForumComment {
  id: string;
  author: string;
  avatar: string;
  zone: string;
  date: string;
  content: string;
  likes: number;
}

interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  zone: string;
  date: string;
  content: string;
  likes: number;
  comments: ForumComment[];
}

interface ForumViewProps {
  zone?: string;
  user?: string;
}

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "p1",
    author: "nova.dev",
    avatar: "N",
    zone: "Zona A",
    date: "Hace 2 min",
    content: "Nuevo nodo desplegado en el sector 7. Bienvenido al mesh.",
    likes: 12,
    comments: [
      {
        id: "c1",
        author: "alex_p2p",
        avatar: "A",
        zone: "Zona A",
        date: "Hace 1 min",
        content: "¡Excelente! Ya lo veo en el mapa.",
        likes: 3,
      },
    ],
  },
  {
    id: "p2",
    author: "k4t.eth",
    avatar: "K",
    zone: "Zona B",
    date: "Hace 1 h",
    content: "Alguien probó el nuevo protocolo de enrutado dinámico? Tiene mejoras de latencia notables.",
    likes: 8,
    comments: [],
  },
  {
    id: "p3",
    author: "mesh_runner",
    avatar: "M",
    zone: "Zona A",
    date: "Hace 3 h",
    content: "Comparto guía de seguridad para nodos públicos → Revisa el manual actualizado en el repo.",
    likes: 24,
    comments: [
      {
        id: "c2",
        author: "ghost.node",
        avatar: "G",
        zone: "Zona C",
        date: "Hace 2 h",
        content: "Gran aporte, justo lo que necesitaba.",
        likes: 5,
      },
      {
        id: "c3",
        author: "nova.dev",
        avatar: "N",
        zone: "Zona A",
        date: "Hace 1 h",
        content: "Link verificado, todo OK.",
        likes: 2,
      },
    ],
  },
];

function ForumView({ zone = "Zona A", user = "tu_nodo" }: ForumViewProps = {}) {
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [newPost, setNewPost] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [openReply, setOpenReply] = useState<Record<string, boolean>>({});

  const handlePublish = () => {
    if (!newPost.trim()) return;
    const post: ForumPost = {
      id: Math.random().toString(36).slice(2),
      author: user,
      avatar: user[0].toUpperCase(),
      zone,
      date: "Ahora",
      content: newPost.trim(),
      likes: 0,
      comments: [],
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  const toggleReply = (postId: string) => {
    setOpenReply((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const submitReply = (postId: string) => {
    const text = replyText[postId]?.trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: Math.random().toString(36).slice(2),
                  author: user,
                  avatar: user[0].toUpperCase(),
                  zone,
                  date: "Ahora",
                  content: text,
                  likes: 0,
                },
              ],
            }
          : p
      )
    );
    setReplyText((prev) => ({ ...prev, [postId]: "" }));
    setOpenReply((prev) => ({ ...prev, [postId]: false }));
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Fixed header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-4 backdrop-blur-xl"
        style={{
          background: "rgba(5,5,10,0.7)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30"
          style={{
            background: "rgba(249,115,22,0.1)",
            boxShadow: "inset 0 0 16px rgba(249,115,22,0.25), 0 0 12px rgba(249,115,22,0.2)",
          }}
        >
          <MessageSquareText className="h-5 w-5 text-orange-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Social
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Foro descentralizado · {posts.length} hilos activos
          </p>
        </div>
      </div>

      {/* Create post */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 font-mono text-sm font-medium text-orange-300">
            {user[0].toUpperCase()}
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            @{user} · {zone}
          </div>
        </div>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="¿Qué está pasando en tu nodo?"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0a12] px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handlePublish}
            disabled={!newPost.trim()}
            className="group flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#1a0a00] transition-all duration-300 hover:scale-105 hover:bg-orange-400 hover:shadow-[0_0_24px_rgba(249,115,22,0.55)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-orange-500 disabled:hover:shadow-none"
          >
            <span>Publicar</span>
            <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all hover:border-orange-500/20 sm:p-6"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
          >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] font-mono text-sm font-medium text-orange-300">
                  {post.avatar}
                </div>
                <div>
                  <div className="font-mono text-sm font-medium text-foreground">
                    @{post.author}
                  </div>
                  <div className="mt-0.5 inline-flex items-center rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-orange-300">
                    {post.zone}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{post.date}</span>
              </div>
            </div>

            {/* Body */}
            <p className="mb-4 text-sm leading-relaxed text-foreground/90">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-5 border-t border-white/5 pt-3">
              <button
                type="button"
                className="group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-orange-400"
              >
                <Heart className="h-3.5 w-3.5 transition-colors group-hover:text-orange-400" />
                <span>{post.likes}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleReply(post.id)}
                className="group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-orange-400"
              >
                <MessageCircle className="h-3.5 w-3.5 transition-colors group-hover:text-orange-400" />
                <span>Responder</span>
              </button>
            </div>

            {/* Reply input */}
            {openReply[post.id] && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={replyText[post.id] || ""}
                  onChange={(e) =>
                    setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  placeholder="Escribe una respuesta..."
                  className="flex-1 rounded-lg border border-white/10 bg-[#0a0a12] px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  onKeyDown={(e) => e.key === "Enter" && submitReply(post.id)}
                />
                <button
                  type="button"
                  onClick={() => submitReply(post.id)}
                  className="rounded-lg bg-orange-500 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#1a0a00] transition hover:bg-orange-400 hover:shadow-[0_0_16px_rgba(249,115,22,0.5)]"
                >
                  Enviar
                </button>
              </div>
            )}

            {/* Comments */}
            {post.comments.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pl-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] font-mono text-xs font-medium text-orange-300">
                      {comment.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-medium text-foreground">
                          @{comment.author}
                        </span>
                        <span className="rounded bg-orange-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-orange-300">
                          {comment.zone}
                        </span>
                        <span className="ml-auto font-mono text-[10px] tracking-widest text-muted-foreground">
                          {comment.date}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

type GameKey = "ttt" | "bj" | "rps" | "rr";

interface GameDef {
  key: GameKey;
  name: string;
  desc: string;
  players: number;
  themeColor: string;
  glowColor: string;
  icon: typeof Swords;
  iconBg: string;
}

const GAMES: GameDef[] = [
  {
    key: "ttt",
    name: "Tic Tac Toe",
    desc: "Tres en raya clásico con apuesta de puntos",
    players: 89,
    themeColor: "#f97316",
    glowColor: "rgba(249,115,22,0.35)",
    icon: Swords,
    iconBg: "bg-gradient-to-br from-orange-500 to-orange-700",
  },
  {
    key: "bj",
    name: "Blackjack",
    desc: "21 puntos, casa descentralizada",
    players: 56,
    themeColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.35)",
    icon: Star,
    iconBg: "bg-gradient-to-br from-green-400 to-green-700",
  },
  {
    key: "rps",
    name: "Piedra Papel Tijera",
    desc: "Duelo instantáneo PvP",
    players: 134,
    themeColor: "#3b82f6",
    glowColor: "rgba(59,130,246,0.35)",
    icon: Zap,
    iconBg: "bg-gradient-to-br from-blue-400 to-blue-700",
  },
  {
    key: "rr",
    name: "Carrera de Reacción",
    desc: "Reflejos bajo presión de red",
    players: 42,
    themeColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.35)",
    icon: Zap,
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-700",
  },
];

const INVITATIONS = [
  { id: "i1", from: "nova.dev", game: "Tic Tac Toe" },
  { id: "i2", from: "k4t.eth", game: "Blackjack" },
];

const OPPONENTS = [
  { name: "nova.dev", status: "online", pts: 420, zone: "Zona A" },
  { name: "k4t.eth", status: "online", pts: 318, zone: "Zona B" },
  { name: "alex_p2p", status: "idle", pts: 205, zone: "Zona A" },
  { name: "mesh_runner", status: "online", pts: 188, zone: "Zona C" },
  { name: "ghost.node", status: "offline", pts: 95, zone: "Zona B" },
];

function GamesView() {
  const [selectedGame, setSelectedGame] = useState<GameKey | null>(null);
  const [invites, setInvites] = useState(INVITATIONS);

  const game = selectedGame ? GAMES.find((g) => g.key === selectedGame) : null;

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 backdrop-blur-xl"
        style={{
          background: "rgba(5,5,10,0.7)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/30"
            style={{
              background: "rgba(249,115,22,0.1)",
              boxShadow: "inset 0 0 16px rgba(249,115,22,0.25), 0 0 12px rgba(249,115,22,0.2)",
            }}
          >
            <Gamepad2 className="h-5 w-5 text-orange-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              Zona Arcade
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Multijugador descentralizado
            </p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-yellow-400 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#1a0a00] shadow-[0_0_18px_rgba(250,204,21,0.45)] transition-all duration-300 hover:scale-105 hover:bg-yellow-300 hover:shadow-[0_0_28px_rgba(250,204,21,0.65)]"
        >
          Minar Puntos
        </button>
      </div>

      {/* Invitations */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Invitaciones pendientes
          </h3>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 rounded-xl border border-orange-500/15 bg-orange-500/[0.04] p-4 backdrop-blur-xl transition-all hover:border-orange-500/30 sm:flex-row sm:items-center sm:justify-between"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] font-mono text-sm font-medium text-orange-300">
                    {inv.from[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium text-foreground">
                      @{inv.from} te invitó
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-orange-300/80">
                      {inv.game}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvites((prev) => prev.filter((i) => i.id !== inv.id))}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const g = GAMES.find((x) => x.name === inv.game);
                      if (g) setSelectedGame(g.key);
                      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
                    }}
                    className="rounded-lg bg-orange-500 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#1a0a00] transition-all duration-300 hover:scale-105 hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.55)]"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game grid or Opponent selection */}
      {selectedGame && game ? (
        <OpponentSelectView game={game} onBack={() => setSelectedGame(null)} />
      ) : (
        <GameGridView onSelect={setSelectedGame} />
      )}
    </div>
  );
}

function GameGridView({ onSelect }: { onSelect: (key: GameKey) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Elige un juego
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => onSelect(g.key)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 p-6 text-left transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  g.themeColor + "55";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  `0 12px 40px rgba(0,0,0,0.35), inset 0 0 40px ${g.glowColor}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 12px 40px rgba(0,0,0,0.35)";
              }}
            >
              <div
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${g.iconBg} shadow-lg transition-transform duration-300 group-hover:scale-110`}
                style={{ boxShadow: `0 0 24px ${g.glowColor}` }}
              >
                <Icon className="h-7 w-7 text-white" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-lg font-bold tracking-tight">{g.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground/80">{g.desc}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {g.players} online
                </span>
                <span
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ color: g.themeColor }}
                >
                  Jugar
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpponentSelectView({ game, onBack }: { game: GameDef; onBack: () => void }) {
  return (
    <div className="space-y-6">
      {/* Back header */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-orange-400"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a juegos</span>
      </button>

      {/* Selected game card */}
      <div
        className="rounded-2xl border border-white/10 p-6 backdrop-blur-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          boxShadow: `0 12px 40px rgba(0,0,0,0.35), inset 0 0 60px ${game.glowColor}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${game.iconBg}`}
            style={{ boxShadow: `0 0 24px ${game.glowColor}` }}
          >
            <game.icon className="h-7 w-7 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">{game.name}</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Selecciona un oponente
            </p>
          </div>
        </div>
      </div>

      {/* Opponents list */}
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Usuarios disponibles · {OPPONENTS.length} nodos
        </h3>
        <div className="space-y-3">
          {OPPONENTS.map((u) => (
            <div
              key={u.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-xs text-orange-300"
                  style={{ boxShadow: "inset 0 0 20px rgba(255,255,255,0.05)" }}
                >
                  {u.name[0].toUpperCase()}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#05050a] ${
                      u.status === "online"
                        ? "bg-green-400"
                        : u.status === "idle"
                          ? "bg-yellow-400"
                          : "bg-muted-foreground/50"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      @{u.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      ID: {u.name.slice(0, 3).toUpperCase()}{Math.random().toString(36).slice(2, 6).toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {u.zone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-md border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 font-mono text-[10px] font-semibold text-yellow-200">
                  <Star className="h-3 w-3 text-yellow-300" fill="currentColor" />
                  {u.pts}
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-orange-500 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#1a0a00] transition-all duration-300 hover:scale-105 hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.55)]"
                >
                  Invitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
