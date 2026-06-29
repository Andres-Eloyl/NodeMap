import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Globe2,
  LogOut,
  Hash,
  MessageSquare,
  FileWarning,
  Map as MapIcon,
  Users,
  Siren,
  Cpu,
  Network,
  Send,
  Wifi,
  Activity,
  Inbox,
  ClipboardList,
  Plus,
  Terminal as TerminalIcon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "NodeMap Works — Panel Corporativo" },
      {
        name: "description",
        content:
          "Panel corporativo P2P de NodeMap Works: canales internos, gestión técnica y reporte de incidentes en una red descentralizada.",
      },
      { property: "og:title", content: "NodeMap Works — Panel Corporativo" },
      {
        property: "og:description",
        content: "Colaboración P2P empresarial: chat, panel técnico y reportes en tiempo real.",
      },
    ],
  }),
  component: WorkApp,
});

type ViewKey = "chat" | "admin" | "reports";

type NavItem = {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  view: ViewKey;
  tone?: "default" | "amber";
};

const channels: NavItem[] = [
  { key: "general-tec", label: "# general-tec", view: "chat", badge: 3 },
  { key: "global", label: "# global-empresa", view: "chat" },
  { key: "dm", label: "Mensajes Privados", icon: MessageSquare, view: "chat", badge: 7 },
];

const tools: NavItem[] = [
  { key: "reports", label: "Gestión de Reportes", icon: FileWarning, view: "reports" },
];

const management: NavItem[] = [
  { key: "map", label: "Mapa de Instalaciones", icon: MapIcon, view: "admin" },
  { key: "team", label: "Lista de Equipo", icon: Users, view: "admin" },
  { key: "alert", label: "Enviar Alerta", icon: Siren, view: "admin", tone: "amber" },
];

const administration: NavItem[] = [
  { key: "tech", label: "Panel Técnico", icon: Cpu, view: "admin" },
  { key: "topology", label: "Topología de Red", icon: Network, view: "admin" },
];

function WorkApp() {
  const [view, setView] = useState<ViewKey>("chat");
  const [activeKey, setActiveKey] = useState<string>("general-tec");

  const select = (item: NavItem) => {
    setActiveKey(item.key);
    setView(item.view);
  };

  const topTitle =
    [...channels, ...tools, ...management, ...administration].find((i) => i.key === activeKey)?.label ??
    "# general-tec";

  return (
    <div className="min-h-screen w-full bg-[#05050a] text-zinc-200 font-sans antialiased selection:bg-sky-500/30">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/5 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-blue-700/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="flex min-h-screen">
        <Sidebar
          activeKey={activeKey}
          onSelect={select}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <TopBar title={topTitle} view={view} onViewChange={setView} />
          <div className="flex-1 min-h-0">
            {view === "chat" && <ChatView channel={topTitle} />}
            {view === "admin" && <AdminView />}
            {view === "reports" && <ReportsView />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================ SIDEBAR ============================ */

function Sidebar({
  activeKey,
  onSelect,
}: {
  activeKey: string;
  onSelect: (i: NavItem) => void;
}) {
  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-xl">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-md bg-sky-500/40 blur-md" />
            <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.35)]">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-wide text-white">
              NodeMap <span className="text-sky-400">Works</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
              P2P · v0.4.1
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500/70 to-blue-800/70 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold">
              MR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#05050a] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">Mateo Reyes</div>
            <div className="mt-1 flex gap-1.5">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-sky-400/30 text-sky-300 bg-sky-400/5">
                Admin
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-white/[0.02]">
                IT-OPS
              </span>
            </div>
          </div>
        </div>

        {/* Status controls */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <SleekSelect
            label="Status"
            options={["Active", "Busy", "AFK"]}
            dotClass="bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
          />
          <SleekSelect label="Ubicación" options={["Room A", "Room B", "Remoto"]} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
        <NavGroup title="Canales">
          {channels.map((c) => (
            <NavLink key={c.key} item={c} active={activeKey === c.key} onClick={() => onSelect(c)} />
          ))}
        </NavGroup>

        <NavGroup title="Herramientas">
          {tools.map((c) => (
            <NavLink key={c.key} item={c} active={activeKey === c.key} onClick={() => onSelect(c)} />
          ))}
        </NavGroup>

        <NavGroup title="Gestión · Manager">
          {management.map((c) => (
            <NavLink key={c.key} item={c} active={activeKey === c.key} onClick={() => onSelect(c)} />
          ))}
        </NavGroup>

        <NavGroup title="Administración · Admin">
          {administration.map((c) => (
            <NavLink key={c.key} item={c} active={activeKey === c.key} onClick={() => onSelect(c)} />
          ))}
        </NavGroup>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-400 hover:text-rose-300 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all">
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const isAmber = item.tone === "amber";
  return (
    <button
      onClick={onClick}
      className={[
        "group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-all border",
        active
          ? "bg-sky-500/10 text-white border-sky-400/30 shadow-[inset_0_0_20px_rgba(56,189,248,0.08)]"
          : "border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03] hover:border-white/5",
        isAmber && !active && "text-amber-300/90 hover:text-amber-200",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {item.icon ? (
        <item.icon className={`h-3.5 w-3.5 ${isAmber ? "text-amber-400" : ""}`} />
      ) : (
        <Hash className="h-3.5 w-3.5 text-zinc-500" />
      )}
      <span className="flex-1 text-left truncate">{item.label.replace(/^# /, "")}</span>
      {item.badge ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

function SleekSelect({
  label,
  options,
  dotClass,
}: {
  label: string;
  options: string[];
  dotClass?: string;
}) {
  const [value, setValue] = useState(options[0]);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/5 hover:border-sky-400/30 transition-colors"
      >
        <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {dotClass && <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />}
            <span className="text-[11px] text-zinc-200 truncate">{value}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 right-0 rounded-md border border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl overflow-hidden shadow-xl">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                setValue(o);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-sky-500/10 hover:text-white"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ TOP BAR ============================ */

function TopBar({
  title,
  view,
  onViewChange,
}: {
  title: string;
  view: ViewKey;
  onViewChange: (v: ViewKey) => void;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#05050a]/70 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm font-medium text-white truncate">{title}</div>
          <span className="hidden sm:inline text-[10px] font-mono text-zinc-600">
            ID: 0xA9F2…7B
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 p-1 rounded-md bg-white/[0.02] border border-white/5">
            <ViewTab active={view === "chat"} onClick={() => onViewChange("chat")} icon={MessageSquare} label="Chat" />
            <ViewTab active={view === "admin"} onClick={() => onViewChange("admin")} icon={Cpu} label="Técnico" />
            <ViewTab active={view === "reports"} onClick={() => onViewChange("reports")} icon={FileWarning} label="Reportes" />
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-mono text-emerald-300">P2P Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-all",
        active
          ? "bg-sky-500/15 text-white border border-sky-400/30"
          : "text-zinc-400 hover:text-white border border-transparent",
      ].join(" ")}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

/* ============================ STATE A: CHAT ============================ */

type Msg = {
  id: number;
  self?: boolean;
  name: string;
  dept: string;
  time: string;
  text: string;
};

const initialMessages: Msg[] = [
  { id: 1, name: "Lucía Pérez", dept: "DevOps", time: "09:12", text: "Subí el nuevo pipeline. Los nodos del rack B ya están sincronizando." },
  { id: 2, name: "Iván Soto", dept: "Soporte", time: "09:14", text: "Confirmo, latencia bajó a 38ms en el segmento norte." },
  { id: 3, self: true, name: "Mateo Reyes", dept: "IT-OPS", time: "09:15", text: "Perfecto. Voy a abrir el reporte de la incidencia de ayer para cerrarla formalmente." },
  { id: 4, name: "Carla Núñez", dept: "Seguridad", time: "09:17", text: "Recordatorio: rotamos llaves del mesh esta noche, 23:00." },
];

function ChatView({ channel }: { channel: string }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { id: Date.now(), self: true, name: "Mateo Reyes", dept: "IT-OPS", time: "ahora", text: t },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-5">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <Wifi className="h-3 w-3 text-emerald-400" />
            Canal cifrado E2E · {channel}
          </div>
        </div>

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
      </div>

      {/* Input */}
      <div className="px-5 md:px-8 pb-6">
        <div className="relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_40px_-20px_rgba(56,189,248,0.5)] focus-within:border-sky-400/40 focus-within:shadow-[0_0_60px_-20px_rgba(56,189,248,0.7)] transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Mensaje en ${channel}`}
            className="w-full bg-transparent px-4 py-3.5 pr-28 text-sm placeholder:text-zinc-600 outline-none"
          />
          <button
            onClick={send}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white text-xs font-medium shadow-[0_0_20px_rgba(56,189,248,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.7)] hover:scale-[1.02] transition-all"
          >
            <Send className="h-3.5 w-3.5" /> Enviar
          </button>
        </div>
        <div className="mt-2 text-[10px] font-mono text-zinc-600 text-center">
          Cifrado punto-a-punto · sin servidores intermedios
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const self = !!msg.self;
  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] ${self ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`flex gap-2 text-[10px] font-mono text-zinc-500 ${self ? "justify-end" : ""}`}>
          <span className="text-zinc-300">{msg.name}</span>
          <span className="text-zinc-600">•</span>
          <span>{msg.dept}</span>
          <span className="text-zinc-600">•</span>
          <span>{msg.time}</span>
        </div>
        <div
          className={[
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed border backdrop-blur-md",
            self
              ? "bg-gradient-to-br from-sky-500/25 to-blue-700/20 border-sky-400/30 text-white rounded-tr-sm shadow-[0_4px_30px_-10px_rgba(56,189,248,0.4)]"
              : "bg-white/[0.04] border-white/10 text-zinc-200 rounded-tl-sm",
          ].join(" ")}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

/* ============================ STATE B: ADMIN ============================ */

function AdminView() {
  return (
    <div className="p-5 md:p-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Peers Connected" value="247" delta="+12 últ. hora" icon={Network} accent="sky" />
        <StatCard label="Mensajes Internos" value="14,892" delta="hoy" icon={Inbox} accent="emerald" />
        <StatCard label="Reportes Pendientes" value="08" delta="2 urgentes" icon={ClipboardList} accent="amber" />
      </div>

      {/* Stress + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NetworkStress />
        <TerminalLog />
      </div>

      {/* User table */}
      <UserManagement />
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "sky" | "emerald" | "amber";
}) {
  const accents: Record<string, string> = {
    sky: "from-sky-500/20 text-sky-300 border-sky-400/20 shadow-[0_0_40px_-20px_rgba(56,189,248,0.6)]",
    emerald: "from-emerald-500/20 text-emerald-300 border-emerald-400/20 shadow-[0_0_40px_-20px_rgba(52,211,153,0.6)]",
    amber: "from-amber-500/20 text-amber-300 border-amber-400/20 shadow-[0_0_40px_-20px_rgba(251,191,36,0.5)]",
  };
  return (
    <div className={`group relative overflow-hidden rounded-xl border bg-white/[0.02] backdrop-blur-xl p-5 transition-all hover:bg-white/[0.04] ${accents[accent]}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white tabular-nums">{value}</div>
          <div className="mt-1 text-[11px] font-mono text-zinc-500">{delta}</div>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-white/[0.03] border border-white/5`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function NetworkStress() {
  const [latency, setLatency] = useState(50);
  const [loss, setLoss] = useState(0);
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" /> Network Stress Simulator
          </div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
            inyecta latencia y pérdida de paquetes en el mesh
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-300 px-2 py-1 rounded border border-emerald-400/20 bg-emerald-400/5">
          LIVE
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <Segmented
          label="Latencia"
          unit="ms"
          value={latency}
          options={[0, 50, 200]}
          onChange={setLatency}
        />
        <Segmented
          label="Packet Loss"
          unit="%"
          value={loss}
          options={[0, 2, 10, 25]}
          onChange={setLoss}
        />
      </div>

      <div className="mt-5 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-zinc-400 flex justify-between">
        <span>RTT actual</span>
        <span className="text-sky-300">{38 + latency} ms · {loss}% loss</span>
      </div>
    </div>
  );
}

function Segmented({
  label,
  unit,
  value,
  options,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="text-[11px] font-mono text-zinc-300">{value}{unit}</div>
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={[
              "flex-1 text-[11px] font-mono py-1.5 rounded-md transition-all",
              value === o
                ? "bg-sky-500/15 text-white border border-sky-400/30 shadow-[inset_0_0_15px_rgba(56,189,248,0.15)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent",
            ].join(" ")}
          >
            {o}{unit}
          </button>
        ))}
      </div>
    </div>
  );
}

function TerminalLog() {
  const lines = [
    "[09:14:22] mesh: peer 0xA9F2…7B handshake OK",
    "[09:14:23] route: gossip-update accepted (epoch=412)",
    "[09:14:25] xfer: 1.2MB delta synced from peer 0xD41E…03",
    "[09:14:28] crypt: noise_xx rekey scheduled in 02:42:11",
    "[09:14:31] mesh: 247 peers · 18 supernodes · 0 churn",
    "[09:14:33] dht: lookup k=8 returned 6 hits (34ms)",
    "[09:14:36] mesh: peer 0x77BC…91 latency 38ms ↓",
    "[09:14:40] route: pruning stale link 0x12A0…ff",
    "[09:14:44] ok: heartbeat consensus reached",
  ];
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-emerald-400" /> P2P · Live Log
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
      </div>
      <div className="bg-black p-4 font-mono text-[11px] leading-relaxed text-emerald-400/90 h-[260px] overflow-y-auto">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre">
            <span className="text-emerald-600">›</span> {l}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-1">
          <span className="text-emerald-600">›</span>
          <span className="inline-block h-3 w-1.5 bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const users = [
    { id: "0xA9F2…7B", name: "Lucía Pérez", dept: "DevOps" },
    { id: "0xD41E…03", name: "Iván Soto", dept: "Soporte" },
    { id: "0x77BC…91", name: "Carla Núñez", dept: "Seguridad" },
    { id: "0x12A0…ff", name: "Andrés Vidal", dept: "Infra" },
    { id: "0x5C88…2e", name: "Renata Silva", dept: "QA" },
  ];
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-400" /> User Management
        </div>
        <button className="text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded border border-white/5 hover:border-white/10">
          export.csv
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-white/5">
              <th className="text-left px-5 py-2.5">Peer ID</th>
              <th className="text-left px-5 py-2.5">Nombre</th>
              <th className="text-left px-5 py-2.5">Depto.</th>
              <th className="text-right px-5 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 font-mono text-[12px] text-sky-300">{u.id}</td>
                <td className="px-5 py-3 text-zinc-200">{u.name}</td>
                <td className="px-5 py-3 text-zinc-400 text-[12px] font-mono">{u.dept}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-300 hover:border-sky-400/40 hover:text-sky-300 hover:bg-sky-500/5 transition-all">
                      Inspect
                    </button>
                    <button className="text-[11px] px-2.5 py-1 rounded border border-white/10 text-zinc-300 hover:border-rose-400/40 hover:text-rose-300 hover:bg-rose-500/5 transition-all">
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ STATE C: REPORTS ============================ */

type Report = {
  id: string;
  title: string;
  priority: "Urgent" | "Normal";
  status: "Pending" | "Resolved";
  desc: string;
  author: string;
  time: string;
};

const reports: Report[] = [
  {
    id: "RPT-0421",
    title: "Caída intermitente en switch sala B",
    priority: "Urgent",
    status: "Pending",
    desc: "Pérdida de paquetes >15% durante picos de carga. Posible fallo en uplink secundario.",
    author: "Iván Soto",
    time: "hace 12m",
  },
  {
    id: "RPT-0420",
    title: "Solicitud de acceso temporal — Auditoría",
    priority: "Normal",
    status: "Pending",
    desc: "Equipo externo requiere lectura sobre nodos del clúster financiero por 48h.",
    author: "Carla Núñez",
    time: "hace 1h",
  },
  {
    id: "RPT-0418",
    title: "Rekey programado del mesh",
    priority: "Normal",
    status: "Resolved",
    desc: "Rotación de llaves Noise XX completada sin caídas. Epoch 412 estable.",
    author: "Mateo Reyes",
    time: "hace 3h",
  },
  {
    id: "RPT-0415",
    title: "Anomalía en peer 0x77BC…91",
    priority: "Urgent",
    status: "Resolved",
    desc: "Tráfico saliente atípico detectado. Aislado y reincorporado tras revisión.",
    author: "Carla Núñez",
    time: "ayer",
  },
];

function ReportsView() {
  return (
    <div className="p-5 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-semibold text-white">Incidentes & Reportes</div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
            registro distribuido · firmado por cada autor
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white text-sm font-medium shadow-[0_0_25px_rgba(56,189,248,0.45)] hover:shadow-[0_0_40px_rgba(56,189,248,0.7)] hover:scale-[1.02] transition-all">
          <Plus className="h-4 w-4" />
          Crear Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r) => (
          <ReportCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

function ReportCard({ r }: { r: Report }) {
  const isUrgent = r.priority === "Urgent";
  const isResolved = r.status === "Resolved";
  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden">
      <div
        className={[
          "absolute -top-px left-4 right-4 h-px",
          isUrgent ? "bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" : "bg-gradient-to-r from-transparent via-sky-400/40 to-transparent",
        ].join(" ")}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-zinc-500">{r.id}</div>
          <h3 className="mt-0.5 text-sm font-semibold text-white leading-snug">{r.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            tone={isUrgent ? "rose" : "sky"}
            icon={isUrgent ? ShieldAlert : Activity}
            label={r.priority}
          />
          <Badge
            tone={isResolved ? "emerald" : "amber"}
            icon={isResolved ? CheckCircle2 : Clock}
            label={r.status}
          />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-zinc-400 leading-relaxed">{r.desc}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-[10px] font-mono text-zinc-500">
          {r.author} · {r.time}
        </div>
        <button
          className={[
            "text-[11px] px-3 py-1.5 rounded-md border transition-all",
            isResolved
              ? "border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              : "border-sky-400/30 text-sky-300 hover:bg-sky-500/10 hover:border-sky-400/60 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]",
          ].join(" ")}
        >
          {isResolved ? "Ver detalle" : "Responder / Resolver"}
        </button>
      </div>
    </div>
  );
}

function Badge({
  tone,
  icon: Icon,
  label,
}: {
  tone: "rose" | "sky" | "emerald" | "amber";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const tones: Record<string, string> = {
    rose: "border-rose-400/30 bg-rose-500/10 text-rose-300",
    sky: "border-sky-400/30 bg-sky-500/10 text-sky-300",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${tones[tone]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
