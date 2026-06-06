import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Activity, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Trash2, History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

type Run = {
  id: string;
  run_at: string;
  status: "ok" | "warning" | "critical";
  total_checks: number;
  total_issues: number;
  summary: any;
};

type Issue = {
  id: string;
  series: string;
  check_name: string;
  severity: "info" | "warning" | "critical";
  description: string;
  details: any;
  suggested_fix: string | null;
  created_at: string;
};

const STATUS_META: Record<Run["status"], { color: string; bg: string; label: string; Icon: any }> = {
  ok:       { color: "#22c55e", bg: "rgba(34,197,94,0.15)",  label: "SAUDÁVEL",   Icon: CheckCircle2 },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "ATENÇÃO",    Icon: AlertTriangle },
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.15)",  label: "CRÍTICO",    Icon: ShieldAlert },
};

const sevColor: Record<Issue["severity"], string> = {
  info: "#94a3b8",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export function DataQualityPanel() {
  const [run, setRun] = useState<Run | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [history, setHistory] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<any | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: runs } = await supabase
      .from("data_reconciliation_runs")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(10);
    const latest = (runs?.[0] as Run) ?? null;
    setRun(latest);
    setHistory((runs as Run[]) ?? []);
    if (latest) {
      const { data: iss } = await supabase
        .from("data_quality_issues")
        .select("*")
        .eq("run_id", latest.id)
        .order("severity", { ascending: false });
      setIssues((iss as Issue[]) ?? []);
    } else {
      setIssues([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("reconcile-data");
      if (error) throw error;
      toast.success("Reconciliação executada");
      await load();
    } catch (e: any) {
      toast.error(`Erro: ${e.message ?? e}`);
    } finally {
      setRunning(false);
    }
  };

  const runPreview = async () => {
    setPreviewing(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.rpc("cleanup_production_duplicates", { _dry_run: true });
      if (error) throw error;
      setPreview(data);
      toast.success(`Preview: ${(data as any)?.rows_to_remove ?? 0} linhas duplicadas detectadas`);
    } catch (e: any) {
      toast.error(`Erro no preview: ${e.message ?? e}`);
    } finally {
      setPreviewing(false);
    }
  };

  const runCleanup = async () => {
    setConfirming(true);
    try {
      const { data, error } = await supabase.rpc("cleanup_production_duplicates", { _dry_run: false });
      if (error) throw error;
      const n = (data as any)?.rows_removed ?? 0;
      toast.success(`${n} duplicados removidos (auditados)`);
      setPreview(data);
      setConfirmOpen(false);
      await load();
    } catch (e: any) {
      toast.error(`Erro na limpeza: ${e.message ?? e}`);
    } finally {
      setConfirming(false);
    }
  };

  const counts = useMemo(() => ({
    critical: issues.filter(i => i.severity === "critical").length,
    warning: issues.filter(i => i.severity === "warning").length,
    info: issues.filter(i => i.severity === "info").length,
  }), [issues]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const meta = STATUS_META[run?.status ?? "ok"];
  const Icon = meta.Icon;

  return (
    <div className="space-y-6">
      {/* Semáforo / estado geral */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Qualidade dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!run ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Nenhuma reconciliação executada ainda.</p>
              <Button onClick={runReconciliation} disabled={running}>
                {running ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                Executar reconciliação
              </Button>
            </div>
          ) : (
            <>
              <div
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ background: meta.bg, border: `1px solid ${meta.color}40` }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60"
                      style={{ background: meta.color }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-3 w-3"
                      style={{ background: meta.color }}
                    />
                  </div>
                  <Icon className="h-5 w-5" style={{ color: meta.color }} />
                  <div>
                    <p className="font-semibold" style={{ color: meta.color }}>{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Última execução: {format(new Date(run.run_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={runReconciliation} disabled={running}>
                  {running ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Reexecutar
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Verificações" value={run.total_checks} />
                <Stat label="Problemas" value={run.total_issues} accent={run.total_issues ? "#f59e0b" : undefined} />
                <Stat label="Críticos" value={counts.critical} accent={counts.critical ? "#ef4444" : undefined} />
                <Stat label="Avisos" value={counts.warning} accent={counts.warning ? "#f59e0b" : undefined} />
              </div>

              {run.summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {(["prices","production","exports"] as const).map(k => {
                    const s = run.summary?.[k];
                    if (!s) return null;
                    return (
                      <div key={k} className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium uppercase tracking-wider text-[10px] text-muted-foreground">{k}</p>
                        <p className="font-mono mt-1">{s.count ?? 0} regs</p>
                        <p className="text-muted-foreground">último: {s.latest ?? "—"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Issues detalhados */}
      {issues.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Problemas Detectados ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {issues.map(i => (
              <div
                key={i.id}
                className="p-3 rounded-lg bg-muted/30"
                style={{ borderLeft: `3px solid ${sevColor[i.severity]}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" style={{ color: sevColor[i.severity], borderColor: `${sevColor[i.severity]}80` }}>
                        {i.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{i.series} · {i.check_name}</span>
                    </div>
                    <p className="text-sm mt-1">{i.description}</p>
                    {i.suggested_fix && (
                      <p className="text-xs text-muted-foreground mt-1">→ {i.suggested_fix}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Limpeza de duplicados */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            Limpeza Automática · Duplicados de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Detecta linhas com a mesma chave (operador + bloco + campo + data) e prepara remoção das extras,
            mantendo sempre a mais recente. Todas as remoções são <strong>auditadas</strong> antes de qualquer apagar.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runPreview} disabled={previewing} variant="outline">
              {previewing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
              Pré-visualizar (dry-run)
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!preview || (preview?.rows_to_remove ?? 0) === 0}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Executar limpeza
            </Button>
          </div>

          {preview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <Stat label="Grupos afetados" value={preview.groups_affected ?? 0} />
              <Stat label="A remover" value={preview.rows_to_remove ?? 0} accent="#f59e0b" />
              <Stat label="Removidas" value={preview.rows_removed ?? 0} accent={preview.rows_removed ? "#22c55e" : undefined} />
              <Stat label="Modo" value={preview.dry_run ? "DRY-RUN" : "LIVE"} />
            </div>
          )}

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <History className="h-3 w-3" /> Histórico de reconciliações
            </p>
            <div className="space-y-1">
              {history.map(r => {
                const m = STATUS_META[r.status];
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: m.color }} />
                      <span className="font-mono">{format(new Date(r.run_at), "dd/MM HH:mm")}</span>
                      <Badge variant="outline" className="text-[10px]" style={{ color: m.color, borderColor: `${m.color}80` }}>
                        {m.label}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {r.total_issues} / {r.total_checks} checks
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar limpeza de duplicados</DialogTitle>
            <DialogDescription>
              Vão ser removidas <strong>{preview?.rows_to_remove ?? 0}</strong> linhas duplicadas
              em <strong>{preview?.groups_affected ?? 0}</strong> grupos. A linha mais recente de cada grupo é mantida.
              Todas as linhas removidas ficam guardadas em <code>production_data_cleanup_audit</code> e podem ser reauditadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirming}>Cancelar</Button>
            <Button variant="destructive" onClick={runCleanup} disabled={confirming}>
              {confirming ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Confirmar e remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-mono mt-1" style={{ color: accent ?? "hsl(var(--foreground))" }}>{value}</p>
    </div>
  );
}
