import { useState, useRef, useEffect } from "react";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import {
  Building2, Plus, Users, FileText, Activity, ChevronRight, Sparkles, Search,
  LayoutGrid, List, ArrowUpRight, Clock, MoreVertical, ShieldCheck, UserPlus,
  Settings, Trash2, TrendingUp, MessageSquare, Download,
  ChevronDown, AlertTriangle, X,
} from "lucide-react";
import { useWorkspaces, useWorkspaceMembers, useWorkspaceActivity, useWorkspaceReports, useWorkspaceInvitations } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { WorkspaceGroupChat } from "@/components/workspace/WorkspaceGroupChat";
import { WorkspacePrivateChat } from "@/components/workspace/WorkspacePrivateChat";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS  — AlphaData petroleum terminal
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
  green:     "#22c55e",
  greenSoft: "rgba(34,197,94,0.1)",
  amber:     "#f59e0b",
  amberSoft: "rgba(245,158,11,0.1)",
  blue:      "#3b82f6",
  blueSoft:  "rgba(59,130,246,0.1)",
  text:      "#dce8f5",
  textMid:   "#4d7a9e",
  textDim:   "#1e3a5f",
  mono:      "'IBM Plex Mono', monospace",
  sans:      "'Plus Jakarta Sans', sans-serif",
} as const;

/* ═══════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════ */

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
    <span style={{ width: 16, height: 2, background: T.red, display: "block", flexShrink: 0 }} />
    <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.red, letterSpacing: "0.28em", textTransform: "uppercase" }}>
      {children}
    </span>
  </div>
);

const MonoLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: T.textMid, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
    {children}
  </p>
);

const PrimaryBtn = ({ children, onClick, disabled, style: extra = {} }: any) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
      padding: "10px 20px", background: T.red, color: "#fff",
      border: "none", borderRadius: 5, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      boxShadow: "0 4px 20px rgba(200,16,46,0.28)", whiteSpace: "nowrap",
      transition: "background 0.15s",
      ...extra,
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = T.redDeep; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = T.red; }}
  >
    {children}
  </button>
);

const GhostBtn = ({ children, onClick, style: extra = {} }: any) => (
  <button onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 8,
      fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
      padding: "10px 16px", background: "transparent", color: T.textMid,
      border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer",
      transition: "all 0.15s", whiteSpace: "nowrap", ...extra,
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderMid; (e.currentTarget as HTMLElement).style.color = T.text; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.textMid; }}
  >
    {children}
  </button>
);

const IconBtn = ({ children, onClick }: any) => (
  <button onClick={onClick}
    style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, cursor: "pointer", color: T.textMid, transition: "all 0.15s" }}
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
      style={{ width: "100%", boxSizing: "border-box", fontFamily: T.sans, fontSize: 13, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, padding: "10px 14px", outline: "none", caretColor: T.red }}
      onFocus={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.redGlow}`; }}
      onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
    />
  </div>
);

const FieldTextarea = ({ label, value, onChange, placeholder, rows = 3 }: any) => (
  <div>
    {label && <MonoLabel>{label}</MonoLabel>}
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box", fontFamily: T.sans, fontSize: 13, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, padding: "10px 14px", outline: "none", caretColor: T.red, resize: "vertical", minHeight: 88 }}
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
        style={{ width: "100%", boxSizing: "border-box", fontFamily: T.mono, fontSize: 11, color: T.text, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, padding: "10px 36px 10px 14px", outline: "none", appearance: "none", cursor: "pointer" }}
        onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
        onBlur={e => e.currentTarget.style.borderColor = T.border}
      >
        {options.map((o: any) => <option key={o.value} value={o.value} style={{ background: T.surface2 }}>{o.label}</option>)}
      </select>
      <ChevronDown style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: T.textMid, pointerEvents: "none" }} />
    </div>
  </div>
);

const Modal = ({ open, onClose, title, subtitle, children, footer }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(3,6,9,0.88)", backdropFilter: "blur(10px)" }}>
      <motion.div initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.red}`, borderRadius: 8, width: "100%", maxWidth: 460, boxShadow: "0 48px 96px rgba(0,0,0,0.7)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <p style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</p>
            {subtitle && <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.12em", marginTop: 3 }}>{subtitle}</p>}
          </div>
          <IconBtn onClick={onClose}><X style={{ width: 14, height: 14 }} /></IconBtn>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        {footer && <div style={{ padding: "0 22px 20px" }}>{footer}</div>}
      </motion.div>
    </div>
  );
};

const ConfirmDialog = ({ open, onClose, onConfirm, title, desc }: any) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(3,6,9,0.92)", backdropFilter: "blur(12px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: T.surface, border: `1px solid rgba(200,16,46,0.3)`, borderTop: `3px solid ${T.red}`, borderRadius: 8, width: "100%", maxWidth: 400, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 7, background: T.redSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle style={{ width: 15, height: 15, color: T.red }} />
          </div>
          <p style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 700, color: T.text }}>{title}</p>
        </div>
        <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 24 }}>{desc}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <GhostBtn onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Cancelar</GhostBtn>
          <PrimaryBtn onClick={onConfirm} style={{ flex: 1, justifyContent: "center" }}>Eliminar</PrimaryBtn>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ value, label, icon: Icon, color, soft }: any) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{ width: 36, height: 36, borderRadius: 7, background: soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon style={{ width: 15, height: 15, color }} />
    </div>
    <div>
      <p style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{value}</p>
      <p style={{ fontFamily: T.mono, fontSize: 8, color: T.textMid, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 }}>{label}</p>
    </div>
  </div>
);

const ROLE_META: Record<string, { label: string; color: string; soft: string }> = {
  owner:  { label: "Proprietário", color: T.amber,   soft: T.amberSoft },
  admin:  { label: "Admin",        color: T.red,     soft: T.redSoft   },
  editor: { label: "Editor",       color: T.green,   soft: T.greenSoft },
  viewer: { label: "Visualizador", color: T.textMid, soft: T.surfaceHi },
};

const RoleBadge = ({ role }: { role: string }) => {
  const m = ROLE_META[role] || ROLE_META.viewer;
  return (
    <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: m.color, background: m.soft, padding: "4px 10px", borderRadius: 3 }}>
      {m.label}
    </span>
  );
};

const TABS = [
  { key: "members",  label: "Membros",    Icon: Users },
  { key: "chat",     label: "Chat",       Icon: MessageSquare },
  { key: "dms",      label: "Mensagens",  Icon: MessageSquare },
  { key: "reports",  label: "Relatórios", Icon: FileText },
  { key: "activity", label: "Atividade",  Icon: Activity },
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

  const [showCreate, setShowCreate]     = useState(false);
  const [showInvite, setShowInvite]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [newName, setNewName]         = useState("");
  const [newDesc, setNewDesc]         = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("editor");
  const [setName, setSetName]         = useState("");
  const [setDesc, setSetDesc]         = useState("");

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
    if (!newName.trim()) { toast.error("Nome é obrigatório"); return; }
    try {
      await createWorkspace.mutateAsync({ name: newName, description: newDesc || undefined });
      setShowCreate(false); setNewName(""); setNewDesc("");
    } catch (e: any) { toast.error(`Erro: ${e?.message}`); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Email é obrigatório"); return; }
    try {
      await sendInvitation.mutateAsync({ email: inviteEmail, role: inviteRole as any });
      setInviteEmail(""); setShowInvite(false);
    } catch (e: any) { toast.error(`Erro: ${e?.message}`); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkspace.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      setDeleteConfirmId(null);
    } catch (e: any) { toast.error(`Erro: ${e?.message}`); }
  };

  const handleSaveSettings = async () => {
    if (!selectedId) return;
    try {
      await updateWorkspace.mutateAsync({ id: selectedId, name: setName, description: setDesc });
      setShowSettings(false);
    } catch {}
  };

  const openSettings = () => {
    setSetName(selected?.name || "");
    setSetDesc(selected?.description || "");
    setShowSettings(true);
    setMenuOpen(false);
  };

  const getMemberName = (uid: string) => {
    if (uid === user?.id) return "Você";
    return members?.find(m => m.user_id === uid)?.profile?.contact_name || `USR-${uid.slice(0, 6).toUpperCase()}`;
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("report") || action.includes("share"))      return <FileText  style={{ width: 12, height: 12, color: T.green }} />;
    if (action.includes("member") || action.includes("invitation")) return <Users     style={{ width: 12, height: 12, color: T.blue  }} />;
    if (action.includes("download"))                                return <Download  style={{ width: 12, height: 12, color: T.blue  }} />;
    return <Activity style={{ width: 12, height: 12, color: T.amber }} />;
  };

  const formatAction = (action: string) => ({
    member_added: "adicionou um membro", member_removed: "removeu um membro",
    invitation_sent: "enviou um convite", report_shared: "partilhou um relatório",
  }[action] || action);

  const gridBg = `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .ws-scroll::-webkit-scrollbar { width: 3px; }
        .ws-scroll::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }

        /*
          ─── CHAT BUG FIXES ─────────────────────────────────────
          The root cause of all chat overflow issues in the original:
          1. TabsContent had no height constraint → chat grew page height
          2. No overflow:hidden on the wrapper → content escaped its container
          3. No word-break on bubbles → long words/URLs broke layout horizontally
          4. Chat input had no max-height → textarea grew infinitely
          ────────────────────────────────────────────────────────
        */

        /* FIX 1+2: Chat wrapper — fixed height, own scroll context */
        .chat-host {
          height: 520px;          /* fixed, not min-height — guarantees boundary    */
          overflow: hidden;        /* hard clip so children cannot escape            */
          display: flex;
          flex-direction: column;
          min-height: 0;           /* Safari flex fix                                */
        }

        /* FIX 3: Bubbles — prevent horizontal overflow from long text */
        .msg-bubble {
          word-break: break-word;      /* break long words                           */
          overflow-wrap: anywhere;     /* stronger: also handles URLs with no spaces */
          white-space: pre-wrap;       /* keep intentional line breaks from user     */
          hyphens: auto;               /* soft hyphenation where possible            */
          max-width: 100%;             /* never exceed parent container              */
        }

        /* FIX 4: Chat input — grows with content but stops at max-height */
        .chat-input {
          resize: none;
          min-height: 40px;
          max-height: 140px;           /* caps at ~5 lines before scrolling          */
          overflow-y: auto;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          scrollbar-width: thin;
          scrollbar-color: ${T.border} transparent;
        }
        .chat-input::-webkit-scrollbar { width: 3px; }
        .chat-input::-webkit-scrollbar-thumb { background: ${T.border}; }

        @keyframes pulse-r {
          0%,100% { box-shadow: 0 0 0 0 rgba(200,16,46,0.4); }
          50%      { box-shadow: 0 0 0 5px rgba(200,16,46,0); }
        }
        .dot-live { animation: pulse-r 2.5s ease-in-out infinite; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: T.sans, overflow: "hidden" }}>
        <Sidebar activeItem="/workspace" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <Header activeItem="/workspace" />

          <main className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <AnimatePresence mode="wait">

              {/* ─── DETAIL VIEW ─────────────────────────────── */}
              {selectedId && selected ? (
                <motion.div key="detail"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ maxWidth: 1280, margin: "0 auto" }}>

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <IconBtn onClick={() => setSelectedId(null)}>
                        <ChevronRight style={{ width: 14, height: 14, transform: "rotate(180deg)" }} />
                      </IconBtn>
                      <div>
                        <SectionLabel>Workspace Activo</SectionLabel>
                        <h1 style={{ fontFamily: T.sans, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 6 }}>
                          {selected.name}
                        </h1>
                        {selected.description && (
                          <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, marginTop: 4 }}>{selected.description}</p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isOwnerOrAdmin && (
                        <PrimaryBtn onClick={() => setShowInvite(true)}>
                          <UserPlus style={{ width: 13, height: 13 }} /> Convidar
                        </PrimaryBtn>
                      )}
                      <div style={{ position: "relative" }}>
                        <IconBtn onClick={() => setMenuOpen(v => !v)}>
                          <MoreVertical style={{ width: 14, height: 14 }} />
                        </IconBtn>
                        {menuOpen && (
                          <>
                            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: 6, minWidth: 190, zIndex: 20, boxShadow: "0 20px 48px rgba(0,0,0,0.5)" }}>
                              {isOwnerOrAdmin && (
                                <button onClick={openSettings}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 5, background: "none", border: "none", cursor: "pointer", color: T.textMid, fontFamily: T.mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHi; (e.currentTarget as HTMLElement).style.color = T.text; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = T.textMid; }}>
                                  <Settings style={{ width: 12, height: 12 }} /> Configurações
                                </button>
                              )}
                              {selected.owner_id === user?.id && (
                                <button onClick={() => { setDeleteConfirmId(selectedId); setMenuOpen(false); }}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 5, background: "none", border: "none", cursor: "pointer", color: T.red, fontFamily: T.mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}
                                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.redSoft}
                                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}>
                                  <Trash2 style={{ width: 12, height: 12 }} /> Eliminar
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 28 }}>
                    <StatCard value={members?.length || 0}       label="Membros"    icon={Users}      color={T.blue}  soft={T.blueSoft}  />
                    <StatCard value={sharedReports?.length || 0} label="Relatórios" icon={FileText}   color={T.green} soft={T.greenSoft} />
                    <StatCard value={activities?.length || 0}    label="Atividades" icon={Activity}   color={T.amber} soft={T.amberSoft} />
                    <StatCard value={todayActions}               label="Hoje"       icon={TrendingUp} color={T.red}   soft={T.redSoft}   />
                  </div>

                  {/* Tab nav — pure inline state, no Tailwind data-[] dynamic classes */}
                  <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.border}`, marginBottom: 0, flexWrap: "wrap" }}>
                    {TABS.map(({ key, label, Icon }) => {
                      const active = activeTab === key;
                      return (
                        <button key={key} onClick={() => setActiveTab(key)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "9px 16px",
                            borderRadius: "6px 6px 0 0",
                            background: active ? T.redSoft : "none",
                            border: active ? `1px solid ${T.borderHi}` : "1px solid transparent",
                            borderBottom: active ? `1px solid ${T.surface}` : "1px solid transparent",
                            marginBottom: active ? -1 : 0,
                            cursor: "pointer",
                            fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                            color: active ? T.red : T.textMid,
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = T.text; (e.currentTarget as HTMLElement).style.background = T.surfaceHi; } }}
                          onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = T.textMid; (e.currentTarget as HTMLElement).style.background = "none"; } }}
                        >
                          <Icon style={{ width: 12, height: 12 }} />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab content panel */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: "none", borderRadius: "0 6px 6px 6px" }}>

                    {/* MEMBERS */}
                    {activeTab === "members" && (
                      <div style={{ padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                          <div>
                            <p style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.text }}>Membros da Equipa</p>
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.12em", marginTop: 3 }}>
                              {members?.length || 0} membros · {invitations?.filter(i => i.status === "pending").length || 0} convites pendentes
                            </p>
                          </div>
                          {isOwnerOrAdmin && (
                            <PrimaryBtn onClick={() => setShowInvite(true)}>
                              <UserPlus style={{ width: 12, height: 12 }} /> Adicionar
                            </PrimaryBtn>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {members?.map(m => {
                            const name = m.user_id === user?.id ? "Você" : m.profile?.contact_name || `USR-${m.user_id.slice(0, 8).toUpperCase()}`;
                            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: 7, background: T.redSoft, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.red, flexShrink: 0 }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <p style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: T.text }}>{name}</p>
                                    <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 2 }}>
                                      Desde {format(new Date(m.joined_at), "dd MMM yyyy", { locale: pt })}
                                      {m.profile?.company_name && ` · ${m.profile.company_name}`}
                                    </p>
                                  </div>
                                </div>
                                <RoleBadge role={m.role} />
                              </div>
                            );
                          })}
                          {invitations?.filter(i => i.status === "pending").map(inv => (
                            <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.amberSoft, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 7 }}>
                              <div>
                                <p style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.text }}>{inv.email}</p>
                                <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 2 }}>Convite pendente · {inv.role}</p>
                              </div>
                              <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.amber, background: T.amberSoft, padding: "4px 10px", borderRadius: 3 }}>Pendente</span>
                            </div>
                          ))}
                          {(!members || members.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.16em", textTransform: "uppercase" }}>Nenhum membro encontrado</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/*
                      CHAT — FIX APPLIED:
                      .chat-host provides the fixed height + overflow:hidden boundary.
                      WorkspaceGroupChat is rendered INSIDE it.
                      Its internal bubbles must use .msg-bubble class (applied via global CSS
                      targeting child elements), and its input must use .chat-input.
                      Even if WorkspaceGroupChat doesn't consume those classes directly,
                      the outer .chat-host hard-clips all overflow.
                    */}
                    {activeTab === "chat" && (
                      <div className="chat-host">
                        <WorkspaceGroupChat workspaceId={selectedId} />
                      </div>
                    )}

                    {activeTab === "dms" && (
                      <div className="chat-host">
                        <WorkspacePrivateChat workspaceId={selectedId} />
                      </div>
                    )}

                    {/* REPORTS */}
                    {activeTab === "reports" && (
                      <div style={{ padding: 24 }}>
                        <div style={{ marginBottom: 20 }}>
                          <p style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.text }}>Relatórios Partilhados</p>
                          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.12em", marginTop: 3 }}>{sharedReports?.length || 0} ficheiros</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {sharedReports?.map((r: any) => (
                            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 6, background: T.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <FileText style={{ width: 14, height: 14, color: T.green }} />
                                </div>
                                <div>
                                  <p style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, color: T.text }}>{r.report?.title || `REL-${r.report_id.slice(0, 8).toUpperCase()}`}</p>
                                  <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 2 }}>{format(new Date(r.shared_at), "dd MMM yyyy", { locale: pt })}</p>
                                </div>
                              </div>
                              <IconBtn onClick={() => {}}><Download style={{ width: 13, height: 13 }} /></IconBtn>
                            </div>
                          ))}
                          {(!sharedReports || sharedReports.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.16em", textTransform: "uppercase" }}>Nenhum relatório partilhado</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ACTIVITY */}
                    {activeTab === "activity" && (
                      <div style={{ padding: 24 }}>
                        <div style={{ marginBottom: 20 }}>
                          <p style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 700, color: T.text }}>Histórico de Atividades</p>
                          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.12em", marginTop: 3 }}>Todas as ações registadas</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {activities?.map(item => (
                            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7 }}>
                              <div style={{ width: 30, height: 30, borderRadius: 6, background: T.surfaceHi, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                {getActivityIcon(item.action)}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* msg-bubble applied to fix long names/actions overflowing */}
                                <p className="msg-bubble" style={{ fontFamily: T.sans, fontSize: 12.5, color: T.textMid, lineHeight: 1.6 }}>
                                  <span style={{ fontWeight: 700, color: T.text }}>{getMemberName(item.user_id)}</span>
                                  {" "}{formatAction(item.action)}
                                </p>
                                <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textDim, marginTop: 4, letterSpacing: "0.1em" }}>
                                  {format(new Date(item.created_at), "dd MMM yyyy · HH:mm", { locale: pt })}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(!activities || activities.length === 0) && (
                            <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, textAlign: "center", padding: "32px 0", letterSpacing: "0.16em", textTransform: "uppercase" }}>Nenhuma atividade registada</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

              ) : (
              /* ─── LIST VIEW ──────────────────────────────── */
                <motion.div key="list"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  style={{ maxWidth: 1280, margin: "0 auto" }}>

                  {/* Page header */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 32 }}>
                    <div>
                      <SectionLabel>Gestão de Equipas</SectionLabel>
                      <h1 style={{ fontFamily: T.sans, fontSize: 26, fontWeight: 900, color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1, marginTop: 8 }}>
                        Seus Workspaces
                      </h1>
                      <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, marginTop: 6 }}>
                        Espaços de trabalho colaborativos do terminal AlphaData.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 3, gap: 2 }}>
                        {([["grid", LayoutGrid], ["list", List]] as const).map(([mode, Icon]) => (
                          <button key={mode} onClick={() => setViewMode(mode)}
                            style={{ width: 30, height: 30, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", background: viewMode === mode ? T.surfaceHi : "none", border: `1px solid ${viewMode === mode ? T.borderMid : "transparent"}`, cursor: "pointer", color: viewMode === mode ? T.text : T.textMid, transition: "all 0.15s" }}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </button>
                        ))}
                      </div>
                      <PrimaryBtn onClick={() => setShowCreate(true)}>
                        <Plus style={{ width: 13, height: 13 }} /> Novo Workspace
                      </PrimaryBtn>
                    </div>
                  </div>

                  {/* Search + sort — FIX: single input, NO nested border (removed Input inside div with border) */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, maxWidth: 380, position: "relative" }}>
                      <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: T.textMid, pointerEvents: "none" }} />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Procurar workspace..."
                        style={{ width: "100%", boxSizing: "border-box", fontFamily: T.sans, fontSize: 13, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 14px 10px 36px", outline: "none", caretColor: T.red }}
                        onFocus={e => e.currentTarget.style.borderColor = T.borderHi}
                        onBlur={e => e.currentTarget.style.borderColor = T.border}
                      />
                    </div>
                    <FieldSelect label="" value={sortBy} onChange={setSortBy}
                      options={[{ value: "recent", label: "Mais recentes" }, { value: "name", label: "Por nome" }]} />
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 28 }}>
                    <StatCard value={workspaces?.length || 0}                                      label="Total Workspaces" icon={Building2}  color={T.red}   soft={T.redSoft}   />
                    <StatCard value={workspaces?.filter(w => w.owner_id === user?.id).length || 0} label="Seus Workspaces"  icon={ShieldCheck} color={T.amber} soft={T.amberSoft} />
                    <StatCard value={workspaces?.filter(w => w.owner_id !== user?.id).length || 0} label="Colaborações"    icon={Users}       color={T.green} soft={T.greenSoft} />
                  </div>

                  {/* Cards */}
                  {isLoading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ height: 170, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }} />
                      ))}
                    </div>
                  ) : filtered && filtered.length > 0 ? (
                    <div style={{
                      display: viewMode === "grid" ? "grid" : "flex",
                      gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
                      flexDirection: viewMode === "list" ? "column" : undefined,
                      gap: 10,
                    }}>
                      {filtered.map((ws, idx) => (
                        <motion.div key={ws.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => setSelectedId(ws.id)}
                          /* FIX: removed whileHover y-translate (causes jank + clip issues with border-radius).
                             Using border-color change instead — smooth and safe. */
                          style={{
                            position: "relative", overflow: "hidden",
                            background: T.surface,
                            backgroundImage: gridBg,
                            backgroundSize: "24px 24px",
                            border: `1px solid ${T.border}`,
                            borderRadius: 8, padding: 22, cursor: "pointer",
                            transition: "border-color 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,16,46,0.3)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
                        >
                          {/* Solid overlay (dims grid texture) */}
                          <div style={{ position: "absolute", inset: 0, background: T.surface, opacity: 0.86, pointerEvents: "none" }} />

                          <div style={{ position: "relative", zIndex: 1 }}>
                            <span style={{ position: "absolute", top: -4, right: 0, fontFamily: T.mono, fontSize: 10, color: T.textDim, fontWeight: 700 }}>
                              {String(idx + 1).padStart(2, "0")}
                            </span>

                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                              <div style={{ width: 38, height: 38, borderRadius: 8, background: T.redSoft, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Building2 style={{ width: 16, height: 16, color: T.red }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {ws.name}
                                </p>
                                {ws.description && (
                                  <p style={{ fontFamily: T.sans, fontSize: 12, color: T.textMid, marginTop: 3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                    {ws.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Clock style={{ width: 10, height: 10, color: T.textMid }} />
                                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, letterSpacing: "0.1em" }}>
                                  {format(new Date(ws.created_at), "dd MMM yyyy", { locale: pt })}
                                </span>
                              </div>
                              {ws.owner_id === user?.id && (
                                <span style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.amber, background: T.amberSoft, padding: "3px 8px", borderRadius: 3 }}>
                                  Proprietário
                                </span>
                              )}
                            </div>
                            <ArrowUpRight style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, color: T.red, opacity: 0.35 }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "72px 24px", textAlign: "center" }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: T.redSoft, border: `1px solid ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <Sparkles style={{ width: 20, height: 20, color: T.red }} />
                      </div>
                      <p style={{ fontFamily: T.sans, fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                        {searchQuery ? "Nenhum resultado" : "Inicie a colaboração"}
                      </p>
                      <p style={{ fontFamily: T.sans, fontSize: 13, color: T.textMid, maxWidth: 360, margin: "0 auto 28px" }}>
                        {searchQuery ? "Ajuste a pesquisa." : "Crie o primeiro workspace para colaborar com a equipa."}
                      </p>
                      {!searchQuery && (
                        <PrimaryBtn onClick={() => setShowCreate(true)}>
                          <Plus style={{ width: 13, height: 13 }} /> Criar Workspace
                        </PrimaryBtn>
                      )}
                    </div>
                  )}

                  {/* Feature strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 36 }}>
                    {[
                      { title: "Chat em Tempo Real",     desc: "Comunique com a equipa no workspace",    icon: MessageSquare, color: T.blue,  soft: T.blueSoft  },
                      { title: "Controle de Permissões", desc: "Gerencie acessos e funções por membro",  icon: ShieldCheck,   color: T.green, soft: T.greenSoft },
                      { title: "Relatórios Partilhados", desc: "Aceda e partilhe relatórios de análise", icon: FileText,      color: T.amber, soft: T.amberSoft },
                    ].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: f.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <f.icon style={{ width: 13, height: 13, color: f.color }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 700, color: T.text }}>{f.title}</p>
                          <p style={{ fontFamily: T.mono, fontSize: 9, color: T.textMid, marginTop: 3, letterSpacing: "0.1em" }}>{f.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* MODALS */}
        <AnimatePresence>
          {showCreate && (
            <Modal key="m-create" title="Novo Workspace" subtitle="Espaço de trabalho colaborativo" onClose={() => setShowCreate(false)}
              footer={<PrimaryBtn onClick={handleCreate} disabled={createWorkspace.isPending} style={{ width: "100%", justifyContent: "center" }}>{createWorkspace.isPending ? "A criar..." : "Confirmar Criação"}</PrimaryBtn>}>
              <FieldInput label="Nome do Workspace" value={newName} onChange={(e: any) => setNewName(e.target.value)} placeholder="Ex: Equipa de Análise" />
              <FieldTextarea label="Descrição (opcional)" value={newDesc} onChange={(e: any) => setNewDesc(e.target.value)} placeholder="Descreva o propósito..." />
            </Modal>
          )}
          {showInvite && (
            <Modal key="m-invite" title="Convidar Membros" subtitle="Adicione colaboradores" onClose={() => setShowInvite(false)}
              footer={<PrimaryBtn onClick={handleInvite} disabled={sendInvitation.isPending} style={{ width: "100%", justifyContent: "center" }}>{sendInvitation.isPending ? "A enviar..." : "Enviar Convite"}</PrimaryBtn>}>
              <FieldInput label="Email" type="email" value={inviteEmail} onChange={(e: any) => setInviteEmail(e.target.value)} placeholder="utilizador@empresa.com" />
              <FieldSelect label="Função" value={inviteRole} onChange={setInviteRole}
                options={[{ value: "admin", label: "Administrador" }, { value: "editor", label: "Editor" }, { value: "viewer", label: "Visualizador" }]} />
            </Modal>
          )}
          {showSettings && (
            <Modal key="m-settings" title="Configurações" onClose={() => setShowSettings(false)}
              footer={<PrimaryBtn onClick={handleSaveSettings} disabled={updateWorkspace.isPending} style={{ width: "100%", justifyContent: "center" }}>{updateWorkspace.isPending ? "A guardar..." : "Salvar Alterações"}</PrimaryBtn>}>
              <FieldInput label="Nome" value={setName} onChange={(e: any) => setSetName(e.target.value)} placeholder="Nome do workspace" />
              <FieldTextarea label="Descrição" value={setDesc} onChange={(e: any) => setSetDesc(e.target.value)} placeholder="Descrição" />
            </Modal>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          title="Eliminar Workspace?"
          desc="Esta ação é irreversível. Todos os dados, membros e mensagens serão permanentemente eliminados do sistema."
        />

        <MobileBottomNav />
      </div>
    </>
  );
};

export default Workspace;