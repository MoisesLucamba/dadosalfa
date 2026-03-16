import { useState, useEffect } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import {
  Building2, Plus, Users, FileText, Activity, ChevronRight, Sparkles, Search,
  LayoutGrid, List, ArrowUpRight, Clock, MoreVertical, ShieldCheck, UserPlus,
  Settings, Trash2, TrendingUp, MessageSquare, Download,
  ChevronDown, AlertTriangle, X, Terminal, Lock, Radio,
} from "lucide-react";
import { useWorkspaces, useWorkspaceMembers, useWorkspaceActivity, useWorkspaceReports, useWorkspaceInvitations } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceGroupChat } from "@/components/workspace/WorkspaceGroupChat";
import { WorkspacePrivateChat } from "@/components/workspace/WorkspacePrivateChat";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS — AlphaData Intelligence Terminal
   ═══════════════════════════════════════════════════ */
const T = {
  bg:        "#030609",
  surface:   "#08111c",
  surface2:  "#0c1828",
  surfaceHi: "#101f32",
  grid:      "rgba(255,255,255,0.025)",
  border:    "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.12)",
  borderHi:  "rgba(200,16,46,0.35)",
  red:       "#C8102E",
  redDeep:   "#9b0d22",
  redSoft:   "rgba(200,16,46,0.1)",
  redGlow:   "rgba(200,16,46,0.05)",
  green:     "#4ade80",
  greenSoft: "rgba(74,222,128,0.08)",
  amber:     "#f59e0b",
  amberSoft: "rgba(245,158,11,0.08)",
  blue:      "#3b82f6",
  blueSoft:  "rgba(59,130,246,0.08)",
  violet:    "#a78bfa",
  text:      "#dce8f5",
  textMid:   "#4d7a9e",
  textDim:   "#1e3a5f",
  mono:      "'IBM Plex Mono', monospace",
  sans:      "'IBM Plex Mono', monospace",
} as const;

/* ═══════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════ */

// Scanline overlay
const Scanline = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none",
    opacity: 0.022,
    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
  }} />
);

// Radar dot
const Pulse = ({ color = "#C8102E" }: { color?: string }) => (
  <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.6, animation: "ws-ping 1.5s ease-in-out infinite" }} />
    <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
  </span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
    <Terminal style={{ width: 10, height: 10, color: T.red }} />
    <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.red, letterSpacing: "0.3em", textTransform: "uppercase" }}>
      {children}
    </span>
  </div>
);

const Breadcrumb = ({ items }: { items: string[] }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
    {items.map((item, i) => (
      <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {i > 0 && <ChevronRight style={{ width: 10, height: 10, color: T.textDim }} />}
        <span style={{
          fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: i === items.length - 1 ? T.text : T.textMid,
        }}>
          {item}
        </span>
      </span>
    ))}
  </div>
);

const MonoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.textMid, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
    {children}
  </p>
);

const PrimaryBtn = ({ children, onClick, disabled, style: extra = {} }: any) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
    padding: "9px 18px",
    background: `linear-gradient(135deg, ${T.red}, ${T.redDeep})`,
    color: "#fff", border: `1px solid rgba(200,16,46,0.5)`,
    borderRadius: 4, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    boxShadow: "0 0 16px rgba(200,16,46,0.25)", whiteSpace: "nowrap",
    transition: "all 0.15s", ...extra,
  }}
  onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(200,16,46,0.4)"; }}
  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(200,16,46,0.25)"; }}
  >
    {children}
  </button>
);

const GhostBtn = ({ children, onClick, style: extra = {} }: any) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 8,
    fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
    padding: "9px 16px", background: "transparent", color: T.textMid,
    border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer",
    transition: "all 0.15s", whiteSpace: "nowrap", ...extra,
  }}
  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderMid; (e.currentTarget as HTMLElement).style.color = T.text; }}
  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.textMid; }}
  >
    {children}
  </button>
);

const IconBtn = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4,
    cursor: "pointer", color: T.textMid, transition: "all 0.15s",
  }}
  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderMid; (e.currentTarget as HTMLElement).style.color = T.text; }}
  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.textMid; }}
  >
    {children}
  </button>
);

const FieldInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div>
    {label && <MonoLabel>{label}</MonoLabel>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", fontFamily: T.mono, fontSize: 11, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px", outline: "none", caretColor: T.red, letterSpacing: "0.05em" }}
      onFocus={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.redGlow}`; }}
      onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
    />
  </div>
);

const FieldTextarea = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div>
    {label && <MonoLabel>{label}</MonoLabel>}
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box", fontFamily: T.mono, fontSize: 11, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px", outline: "none", caretColor: T.red, resize: "vertical", minHeight: 80, letterSpacing: "0.05em" }}
      onFocus={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.redGlow}`; }}
      onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
    />
  </div>
);

const FieldSelect = ({ label, value, onChange, options }: any) => (
  <div>
    {label && <MonoLabel>{label}</MonoLabel>}
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", fontFamily: T.mono, fontSize: 10, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 32px 10px 12px", outline: "none", appearance: "none", cursor: "pointer", letterSpacing: "0.1em" }}
        onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
        onBlur={e => e.currentTarget.style.borderColor = T.border}
      >
        {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: T.surface2 }}>{o.label}</option>)}
      </select>
      <ChevronDown style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, color: T.textMid, pointerEvents: "none" }} />
    </div>
  </div>
);

const Modal = ({ open, onClose, title, subtitle, children, footer }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(3,6,9,0.9)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.red}`, borderRadius: 6, width: "100%", maxWidth: 440, boxShadow: "0 48px 96px rgba(0,0,0,0.7)", overflow: "hidden" }}>
        {/* Modal header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: "rgba(200,16,46,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, boxShadow: `0 0 6px ${T.red}` }} />
            <div>
              <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>{title}</p>
              {subtitle && <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, letterSpacing: "0.15em", marginTop: 2, textTransform: "uppercase" }}>{subtitle}</p>}
            </div>
          </div>
          <IconBtn onClick={onClose}><X style={{ width: 12, height: 12 }} /></IconBtn>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
        {footer && <div style={{ padding: "0 20px 18px" }}>{footer}</div>}
      </motion.div>
    </div>
  );
};

const ConfirmDialog = ({ open, onClose, onConfirm, title, desc }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(3,6,9,0.94)", backdropFilter: "blur(12px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: T.surface, border: `1px solid rgba(200,16,46,0.25)`, borderTop: `2px solid ${T.red}`, borderRadius: 6, width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: T.redSoft, border: `1px solid rgba(200,16,46,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: T.red }} />
          </div>
          <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>{title}</p>
        </div>
        <p style={{ fontFamily: T.mono, fontSize: 10, color: T.textMid, lineHeight: 1.8, marginBottom: 20, letterSpacing: "0.05em" }}>{desc}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>CANCELAR</GhostBtn>
          <PrimaryBtn onClick={onConfirm} style={{ flex: 1, justifyContent: "center" }}>ELIMINAR</PrimaryBtn>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ value, label, icon: Icon, color, soft }: any) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
    {/* Corner tag */}
    <div style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", background: `${color}18` }} />
    <div style={{ width: 32, height: 32, borderRadius: 4, background: soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon style={{ width: 13, height: 13, color }} />
    </div>
    <div>
      <p style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
      <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4 }}>{label}</p>
    </div>
  </div>
);

const ROLE_META: Record<string, { label: string; color: string; soft: string }> = {
  owner:  { label: "PROPRIETÁRIO", color: T.amber,   soft: T.amberSoft },
  admin:  { label: "ADMIN",        color: T.red,     soft: T.redSoft   },
  editor: { label: "EDITOR",       color: T.green,   soft: T.greenSoft },
  viewer: { label: "VIEWER",       color: T.textMid, soft: T.surfaceHi },
};

const RoleBadge = ({ role }: { role: string }) => {
  const m = ROLE_META[role] || ROLE_META.viewer;
  return (
    <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: m.color, background: m.soft, padding: "3px 8px", borderRadius: 3, border: `1px solid ${m.color}22` }}>
      {m.label}
    </span>
  );
};

const TABS = [
  { key: "members",  label: "MEMBROS",    Icon: Users },
  { key: "chat",     label: "CHAT",       Icon: MessageSquare },
  { key: "dms",      label: "MENSAGENS",  Icon: MessageSquare },
  { key: "reports",  label: "RELATÓRIOS", Icon: FileText },
  { key: "activity", label: "ACTIVIDADE", Icon: Activity },
] as const;

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const Workspace = () => {
  const { user } = useAuth();
  const { workspaces, isLoading, createWorkspace, deleteWorkspace, updateWorkspace } = useWorkspaces();

  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<typeof TABS[number]["key"]>("members");
  const [viewMode, setViewMode]               = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery]         = useState("");
  const [sortBy, setSortBy]                   = useState<"recent" | "name">("recent");
  const [menuOpen, setMenuOpen]               = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCreate, setShowCreate]           = useState(false);
  const [showInvite, setShowInvite]           = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [newName, setNewName]                 = useState("");
  const [newDesc, setNewDesc]                 = useState("");
  const [inviteEmail, setInviteEmail]         = useState("");
  const [inviteRole, setInviteRole]           = useState("editor");
  const [setName, setSetName]                 = useState("");
  const [setDesc, setSetDesc]                 = useState("");
  const [bootDone, setBootDone]               = useState(false);
  const [now, setNow]                         = useState(new Date());

  useEffect(() => { setTimeout(() => setBootDone(true), 800); }, []);
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);

  const { members }       = useWorkspaceMembers(selectedId);
  const { activities }    = useWorkspaceActivity(selectedId);
  const { sharedReports } = useWorkspaceReports(selectedId);
  const { invitations, sendInvitation } = useWorkspaceInvitations(selectedId);

  const selected       = workspaces?.find(w => w.id === selectedId);
  const currentMember  = members?.find(m => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";
  const todayActions   = activities?.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length || 0;

  const filtered = workspaces
    ?.filter(w =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("CAMPO OBRIGATÓRIO: Nome"); return; }
    try {
      await createWorkspace.mutateAsync({ name: newName, description: newDesc || undefined });
      setShowCreate(false); setNewName(""); setNewDesc("");
      toast.success("WORKSPACE CRIADO // OK");
    } catch (e: any) { toast.error(`ERRO: ${e?.message}`); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("CAMPO OBRIGATÓRIO: Email"); return; }
    try {
      await sendInvitation.mutateAsync({ email: inviteEmail, role: inviteRole as any });
      setInviteEmail(""); setShowInvite(false);
      toast.success("CONVITE ENVIADO // ACK");
    } catch (e: any) { toast.error(`ERRO: ${e?.message}`); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkspace.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      setDeleteConfirmId(null);
      toast.success("WORKSPACE ELIMINADO");
    } catch (e: any) { toast.error(`ERRO: ${e?.message}`); }
  };

  const handleSaveSettings = async () => {
    if (!selectedId) return;
    try {
      await updateWorkspace.mutateAsync({ id: selectedId, name: setName, description: setDesc });
      setShowSettings(false);
      toast.success("CONFIGURAÇÕES GUARDADAS");
    } catch {}
  };

  const openSettings = () => {
    setSetName(selected?.name || "");
    setSetDesc(selected?.description || "");
    setShowSettings(true);
    setMenuOpen(false);
  };

  const getMemberName = (uid: string) => {
    if (uid === user?.id) return "VOCÊ";
    return members?.find(m => m.user_id === uid)?.profile?.contact_name?.toUpperCase() || `USR-${uid.slice(0, 6).toUpperCase()}`;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("report") || action.includes("share"))      return <FileText  style={{ width: 11, height: 11, color: T.green }} />;
    if (action.includes("member") || action.includes("invitation")) return <Users     style={{ width: 11, height: 11, color: T.blue  }} />;
    if (action.includes("download"))                                return <Download  style={{ width: 11, height: 11, color: T.blue  }} />;
    return <Activity style={{ width: 11, height: 11, color: T.amber }} />;
  };

  const formatAction = (action: string) => ({
    member_added: "ADICIONOU UM MEMBRO", member_removed: "REMOVEU UM MEMBRO",
    invitation_sent: "ENVIOU UM CONVITE", report_shared: "PARTILHOU UM RELATÓRIO",
  }[action] || action.toUpperCase());

  const gridBg = `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ws-scroll::-webkit-scrollbar { width: 3px; }
        .ws-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        .chat-host { height: 520px; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
        .msg-bubble { word-break: break-word; overflow-wrap: anywhere; white-space: pre-wrap; hyphens: auto; max-width: 100%; }
        .chat-input { resize: none; min-height: 40px; max-height: 140px; overflow-y: auto; word-break: break-word; overflow-wrap: anywhere; white-space: pre-wrap; }
        @keyframes ws-ping { 0%,100%{opacity:0.8;transform:scale(1)} 50%{opacity:0;transform:scale(2)} }
        @keyframes ws-boot { from{opacity:0} to{opacity:1} }
        .ws-boot { animation: ws-boot 0.3s ease forwards; }
      `}</style>

      <Scanline />

      {/* Boot screen */}
      <AnimatePresence>
        {!bootDone && (
          <motion.div exit={{ opacity: 0, transition: { duration: 0.3 } }}
            style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000", fontFamily: T.mono }}>
            <div style={{ color: T.red, fontSize: 11, lineHeight: 2 }}>
              <p style={{ color: "#f87171", fontSize: 14, fontWeight: 700, marginBottom: 16 }}>&gt; ALPHADAT-OS v3.2.1</p>
              <p style={{ opacity: 0.7 }}>LOADING COLLABORATION MODULE............. OK</p>
              <p style={{ opacity: 0.7 }}>AUTHENTICATING WORKSPACE SESSION......... OK</p>
              <p style={{ color: T.red }} className="ws-boot">INITIALISING WORKSPACE INTELLIGENCE...... ■</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: T.mono, overflow: "hidden" }}>
        <Sidebar activeItem="/workspace" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <Header activeItem="/workspace" />

          {/* Status Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: bootDone ? 1 : 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 24px", borderBottom: `1px solid rgba(200,16,46,0.12)`,
              background: "rgba(200,16,46,0.03)", flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: T.textMid }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.green }}>
                <Pulse color={T.green} />
                SISTEMA ONLINE
              </span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Lock style={{ width: 9, height: 9 }} />
                CLASSIFICAÇÃO: RESTRITO
              </span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>MÓDULO: WORKSPACE</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: T.text, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour12: false })}
            </span>
          </motion.div>

          <main className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <AnimatePresence mode="wait">

              {/* ─── DETAIL VIEW ───────────────────────────────── */}
              {selectedId && selected ? (
                <motion.div key="detail"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  style={{ maxWidth: 1280, margin: "0 auto" }}>

                  <Breadcrumb items={["ALPHADAT-OS", "WORKSPACE", selected.name.toUpperCase()]} />

                  {/* Detail header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <IconBtn onClick={() => setSelectedId(null)}>
                        <ChevronRight style={{ width: 12, height: 12, transform: "rotate(180deg)" }} />
                      </IconBtn>
                      <div>
                        <SectionLabel>Workspace Activo</SectionLabel>
                        <h1 style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 6 }}>
                          {selected.name.toUpperCase()}
                        </h1>
                        {selected.description && (
                          <p style={{ fontFamily: T.mono, fontSize: 10, color: T.textMid, marginTop: 6, letterSpacing: "0.05em" }}>
                            // {selected.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isOwnerOrAdmin && <PrimaryBtn onClick={() => setShowInvite(true)}><UserPlus style={{ width: 12, height: 12 }} /> CONVIDAR</PrimaryBtn>}
                      <div style={{ position: "relative" }}>
                        <IconBtn onClick={() => setMenuOpen(v => !v)}>
                          <MoreVertical style={{ width: 12, height: 12 }} />
                        </IconBtn>
                        {menuOpen && (
                          <>
                            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                            <div style={{ position: "absolute", right: 0, top: "calc(100% + 5px)", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: 5, minWidth: 180, zIndex: 20, boxShadow: "0 20px 48px rgba(0,0,0,0.6)" }}>
                              {isOwnerOrAdmin && (
                                <button onClick={openSettings}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: T.textMid, fontFamily: T.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHi; (e.currentTarget as HTMLElement).style.color = T.text; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = T.textMid; }}>
                                  <Settings style={{ width: 10, height: 10 }} /> CONFIGURAÇÕES
                                </button>
                              )}
                              {selected.owner_id === user?.id && (
                                <button onClick={() => { setDeleteConfirmId(selectedId); setMenuOpen(false); }}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: T.red, fontFamily: T.mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.redSoft}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                                  <Trash2 style={{ width: 10, height: 10 }} /> ELIMINAR
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 24 }}>
                    <StatCard value={members?.length || 0}       label="Membros"    icon={Users}      color={T.blue}  soft={T.blueSoft}  />
                    <StatCard value={sharedReports?.length || 0} label="Relatórios" icon={FileText}   color={T.green} soft={T.greenSoft} />
                    <StatCard value={activities?.length || 0}    label="Actividades" icon={Activity}  color={T.amber} soft={T.amberSoft} />
                    <StatCard value={todayActions}               label="Hoje"        icon={TrendingUp} color={T.red}   soft={T.redSoft}   />
                  </div>

                  {/* Tab nav */}
                  <div style={{ display: "flex", gap: 1, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                    {TABS.map(({ key, label, Icon }) => {
                      const active = activeTab === key;
                      return (
                        <button key={key} onClick={() => setActiveTab(key)} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "8px 14px",
                          background: active ? T.redSoft : "transparent",
                          border: active ? `1px solid ${T.borderHi}` : "1px solid transparent",
                          borderBottom: active ? `1px solid ${T.surface}` : "1px solid transparent",
                          marginBottom: active ? -1 : 0,
                          borderRadius: "4px 4px 0 0",
                          cursor: "pointer",
                          fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em",
                          color: active ? T.red : T.textMid,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = T.surfaceHi; } }}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = T.textMid; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                        >
                          <Icon style={{ width: 10, height: 10 }} />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab panel */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: "none", borderRadius: "0 4px 4px 4px" }}>

                    {/* MEMBERS */}
                    {activeTab === "members" && (
                      <div style={{ padding: 22 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                          <div>
                            <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>
                              MEMBROS DA EQUIPA
                            </p>
                            <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, letterSpacing: "0.15em", marginTop: 3 }}>
                              {members?.length || 0} MEMBROS · {invitations?.filter(i => i.status === "pending").length || 0} CONVITES PENDENTES
                            </p>
                          </div>
                          {isOwnerOrAdmin && <PrimaryBtn onClick={() => setShowInvite(true)}><UserPlus style={{ width: 11, height: 11 }} /> ADICIONAR</PrimaryBtn>}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {members?.map(m => {
                            const name = m.user_id === user?.id ? "VOCÊ" : (m.profile?.contact_name || `USR-${m.user_id.slice(0, 8)}`).toUpperCase();
                            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                            return (
                              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 4, background: T.redSoft, border: `1px solid rgba(200,16,46,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.red, flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text }}>{name}</p>
                                    <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, marginTop: 2, letterSpacing: "0.1em" }}>
                                      DESDE {format(new Date(m.joined_at), "dd MMM yyyy", { locale: pt }).toUpperCase()}
                                      {m.profile?.company_name && ` · ${m.profile.company_name.toUpperCase()}`}
                                    </p>
                                  </div>
                                </div>
                                <RoleBadge role={m.role} />
                              </div>
                            );
                          })}

                          {invitations?.filter(i => i.status === "pending").map(inv => (
                            <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: T.amberSoft, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 4 }}>
                              <div>
                                <p style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.text }}>{inv.email.toUpperCase()}</p>
                                <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, marginTop: 2, letterSpacing: "0.12em" }}>CONVITE PENDENTE · {inv.role.toUpperCase()}</p>
                              </div>
                              <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", color: T.amber, background: T.amberSoft, padding: "3px 8px", borderRadius: 3, border: `1px solid rgba(245,158,11,0.25)` }}>PENDENTE</span>
                            </div>
                          ))}

                          {(!members || members.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.2em" }}>// NENHUM MEMBRO ENCONTRADO</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "chat" && <div className="chat-host"><WorkspaceGroupChat workspaceId={selectedId} /></div>}
                    {activeTab === "dms"  && <div className="chat-host"><WorkspacePrivateChat workspaceId={selectedId} /></div>}

                    {/* REPORTS */}
                    {activeTab === "reports" && (
                      <div style={{ padding: 22 }}>
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>RELATÓRIOS PARTILHADOS</p>
                          <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, marginTop: 2, letterSpacing: "0.15em" }}>{sharedReports?.length || 0} FICHEIROS</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {sharedReports?.map((r: any) => (
                            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 4, background: T.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <FileText style={{ width: 12, height: 12, color: T.green }} />
                                </div>
                                <div>
                                  <p style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.text }}>{(r.report?.title || `REL-${r.report_id.slice(0, 8)}`).toUpperCase()}</p>
                                  <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, marginTop: 2, letterSpacing: "0.1em" }}>
                                    {format(new Date(r.shared_at), "dd MMM yyyy", { locale: pt }).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <IconBtn onClick={() => {}}><Download style={{ width: 11, height: 11 }} /></IconBtn>
                            </div>
                          ))}
                          {(!sharedReports || sharedReports.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.2em" }}>// NENHUM RELATÓRIO PARTILHADO</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ACTIVITY */}
                    {activeTab === "activity" && (
                      <div style={{ padding: 22 }}>
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "0.05em" }}>HISTÓRICO DE ACTIVIDADES</p>
                          <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, marginTop: 2, letterSpacing: "0.15em" }}>TODAS AS ACÇÕES REGISTADAS</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {activities?.map(item => (
                            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 4, background: T.surfaceHi, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                {getActivityIcon(item.action)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="msg-bubble" style={{ fontFamily: T.mono, fontSize: 10, color: T.textMid, lineHeight: 1.7, letterSpacing: "0.05em" }}>
                                  <span style={{ fontWeight: 700, color: T.text }}>{getMemberName(item.user_id)}</span>
                                  {" "}{formatAction(item.action)}
                                </p>
                                <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textDim, marginTop: 3, letterSpacing: "0.12em" }}>
                                  {format(new Date(item.created_at), "dd MMM yyyy · HH:mm", { locale: pt }).toUpperCase()}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!activities || activities.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.2em" }}>// NENHUMA ACTIVIDADE REGISTADA</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

              ) : (
              /* ─── LIST VIEW ─────────────────────────────────── */
                <motion.div key="list"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ maxWidth: 1280, margin: "0 auto" }}>

                  <Breadcrumb items={["ALPHADAT-OS", "INTELLIGENCE", "WORKSPACE"]} />

                  {/* Page header */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
                    <div>
                      <SectionLabel>MÓDULO-07 // COLABORAÇÃO</SectionLabel>
                      <h1 style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 8 }}>
                        WORKSPACE
                      </h1>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                        <div style={{ height: 1, width: 40, background: T.red }} />
                        <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.1em" }}>
                          ESPAÇOS DE TRABALHO COLABORATIVOS DO TERMINAL ALPHADATA
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* View toggle */}
                      <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 3, gap: 2 }}>
                        {([["grid", LayoutGrid], ["list", List]] as const).map(([mode, Icon]) => (
                          <button key={mode} onClick={() => setViewMode(mode)} style={{
                            width: 28, height: 28, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
                            background: viewMode === mode ? T.surfaceHi : "none",
                            border: `1px solid ${viewMode === mode ? T.borderMid : "transparent"}`,
                            cursor: "pointer", color: viewMode === mode ? T.text : T.textMid, transition: "all 0.15s",
                          }}>
                            <Icon style={{ width: 11, height: 11 }} />
                          </button>
                        ))}
                      </div>
                      <PrimaryBtn onClick={() => setShowCreate(true)}>
                        <Plus style={{ width: 12, height: 12 }} /> NOVO WORKSPACE
                      </PrimaryBtn>
                    </div>
                  </div>

                  {/* Search + sort */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, maxWidth: 360, position: "relative" }}>
                      <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, color: T.textMid, pointerEvents: "none" }} />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="PROCURAR WORKSPACE..."
                        style={{ width: "100%", fontFamily: T.mono, fontSize: 10, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "9px 12px 9px 32px", outline: "none", caretColor: T.red, letterSpacing: "0.05em" }}
                        onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
                        onBlur={e => e.currentTarget.style.borderColor = T.border}
                      />
                    </div>
                    <FieldSelect label="" value={sortBy} onChange={setSortBy}
                      options={[{ value: "recent", label: "MAIS RECENTES" }, { value: "name", label: "POR NOME" }]} />
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 24 }}>
                    <StatCard value={workspaces?.length || 0}                                      label="TOTAL"        icon={Building2}  color={T.red}   soft={T.redSoft}   />
                    <StatCard value={workspaces?.filter(w => w.owner_id === user?.id).length || 0} label="SEUS WS"      icon={ShieldCheck} color={T.amber} soft={T.amberSoft} />
                    <StatCard value={workspaces?.filter(w => w.owner_id !== user?.id).length || 0} label="COLABORAÇÕES" icon={Users}       color={T.green} soft={T.greenSoft} />
                  </div>

                  {/* Cards */}
                  {isLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ height: 160, borderRadius: 4, background: T.surface, border: `1px solid ${T.border}`, opacity: 1 - i * 0.2 }} />
                      ))}
                    </div>
                  ) : filtered && filtered.length > 0 ? (
                    <div style={{
                      display: viewMode === "grid" ? "grid" : "flex",
                      gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : undefined,
                      flexDirection: viewMode === "list" ? "column" : undefined,
                      gap: 8,
                    }}>
                      {filtered.map((ws, idx) => (
                        <motion.div key={ws.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => setSelectedId(ws.id)}
                          style={{
                            position: "relative", overflow: "hidden",
                            background: T.surface,
                            backgroundImage: gridBg,
                            backgroundSize: "24px 24px",
                            border: `1px solid ${T.border}`,
                            borderRadius: 4, padding: 20, cursor: "pointer",
                            transition: "border-color 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,16,46,0.3)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
                        >
                          {/* Solid overlay dims grid */}
                          <div style={{ position: "absolute", inset: 0, background: T.surface, opacity: 0.85, pointerEvents: "none" }} />

                          <div style={{ position: "relative", zIndex: 1 }}>
                            {/* Index */}
                            <span style={{ position: "absolute", top: -2, right: 0, fontFamily: T.mono, fontSize: 9, color: T.textDim, fontWeight: 700, letterSpacing: "0.1em" }}>
                              {String(idx + 1).padStart(2, "0")}
                            </span>

                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 4, background: T.redSoft, border: `1px solid rgba(200,16,46,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Building2 style={{ width: 14, height: 14, color: T.red }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.04em" }}>
                                  {ws.name.toUpperCase()}
                                </p>
                                {ws.description && (
                                  <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                                    // {ws.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Clock style={{ width: 9, height: 9, color: T.textMid }} />
                                <span style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, letterSpacing: "0.1em" }}>
                                  {format(new Date(ws.created_at), "dd MMM yyyy", { locale: pt }).toUpperCase()}
                                </span>
                              </div>
                              {ws.owner_id === user?.id ? (
                                <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", color: T.amber, background: T.amberSoft, padding: "2px 7px", borderRadius: 3, border: `1px solid rgba(245,158,11,0.2)` }}>
                                  OWNER
                                </span>
                              ) : (
                                <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", color: T.blue, background: T.blueSoft, padding: "2px 7px", borderRadius: 3, border: `1px solid rgba(59,130,246,0.2)` }}>
                                  MEMBRO
                                </span>
                              )}
                            </div>
                            <ArrowUpRight style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, color: T.red, opacity: 0.3 }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 4, padding: "64px 24px", textAlign: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 4, background: T.redSoft, border: `1px solid rgba(200,16,46,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <Sparkles style={{ width: 18, height: 18, color: T.red }} />
                      </div>
                      <p style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                        {searchQuery ? "// NENHUM RESULTADO" : "// INICIE A COLABORAÇÃO"}
                      </p>
                      <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, maxWidth: 340, margin: "0 auto 24px", letterSpacing: "0.06em", lineHeight: 1.8 }}>
                        {searchQuery ? "AJUSTE A PESQUISA." : "CRIE O PRIMEIRO WORKSPACE PARA COLABORAR COM A EQUIPA."}
                      </p>
                      {!searchQuery && <PrimaryBtn onClick={() => setShowCreate(true)}><Plus style={{ width: 12, height: 12 }} /> CRIAR WORKSPACE</PrimaryBtn>}
                    </div>
                  )}

                  {/* Feature strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginTop: 32 }}>
                    {[
                      { title: "CHAT EM TEMPO REAL",     desc: "// Comunique com a equipa no workspace",    icon: MessageSquare, color: T.blue,  soft: T.blueSoft  },
                      { title: "CONTROLO DE PERMISSÕES", desc: "// Gerencie acessos e funções por membro",  icon: ShieldCheck,   color: T.green, soft: T.greenSoft },
                      { title: "RELATÓRIOS PARTILHADOS", desc: "// Aceda e partilhe relatórios de análise", icon: FileText,      color: T.amber, soft: T.amberSoft },
                    ].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 4, background: f.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <f.icon style={{ width: 11, height: 11, color: f.color }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.text, letterSpacing: "0.08em" }}>{f.title}</p>
                          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 3, letterSpacing: "0.06em" }}>{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* ── MODALS ── */}
        <AnimatePresence>
          {showCreate && (
            <Modal key="m-create" title="NOVO WORKSPACE" subtitle="ESPAÇO DE TRABALHO COLABORATIVO" onClose={() => setShowCreate(false)}
              footer={<PrimaryBtn onClick={handleCreate} disabled={createWorkspace.isPending} style={{ width: "100%", justifyContent: "center" }}>{createWorkspace.isPending ? "A CRIAR..." : "CONFIRMAR CRIAÇÃO"}</PrimaryBtn>}>
              <FieldInput label="NOME DO WORKSPACE" value={newName} onChange={(e: any) => setNewName(e.target.value)} placeholder="EX: EQUIPA DE ANÁLISE" />
              <FieldTextarea label="DESCRIÇÃO (OPCIONAL)" value={newDesc} onChange={(e: any) => setNewDesc(e.target.value)} placeholder="// Descreva o propósito..." />
            </Modal>
          )}
          {showInvite && (
            <Modal key="m-invite" title="CONVIDAR MEMBROS" subtitle="ADICIONE COLABORADORES" onClose={() => setShowInvite(false)}
              footer={<PrimaryBtn onClick={handleInvite} disabled={sendInvitation.isPending} style={{ width: "100%", justifyContent: "center" }}>{sendInvitation.isPending ? "A ENVIAR..." : "ENVIAR CONVITE"}</PrimaryBtn>}>
              <FieldInput label="EMAIL" type="email" value={inviteEmail} onChange={(e: any) => setInviteEmail(e.target.value)} placeholder="operador@empresa.com" />
              <FieldSelect label="FUNÇÃO" value={inviteRole} onChange={setInviteRole}
                options={[{ value: "admin", label: "ADMINISTRADOR" }, { value: "editor", label: "EDITOR" }, { value: "viewer", label: "VISUALIZADOR" }]} />
            </Modal>
          )}
          {showSettings && (
            <Modal key="m-settings" title="CONFIGURAÇÕES" subtitle="EDITAR WORKSPACE" onClose={() => setShowSettings(false)}
              footer={<PrimaryBtn onClick={handleSaveSettings} disabled={updateWorkspace.isPending} style={{ width: "100%", justifyContent: "center" }}>{updateWorkspace.isPending ? "A GUARDAR..." : "SALVAR ALTERAÇÕES"}</PrimaryBtn>}>
              <FieldInput label="NOME" value={setName} onChange={(e: any) => setSetName(e.target.value)} placeholder="Nome do workspace" />
              <FieldTextarea label="DESCRIÇÃO" value={setDesc} onChange={(e: any) => setSetDesc(e.target.value)} placeholder="// Descrição" />
            </Modal>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          title="ELIMINAR WORKSPACE?"
          desc="Esta acção é irreversível. Todos os dados, membros e mensagens serão permanentemente eliminados do sistema."
        />

        <MobileBottomNav />
      </div>
    </>
  );
};

export default Workspace;