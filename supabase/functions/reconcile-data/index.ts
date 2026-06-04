// Cross-source data reconciliation: checks freshness, internal consistency,
// production vs exports balance, and flags inconsistencies in data_quality_issues.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Issue = {
  series: string;
  check_name: string;
  severity: "info" | "warning" | "critical";
  description: string;
  details: Record<string, any>;
  suggested_fix?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const issues: Issue[] = [];
  let totalChecks = 0;

  // Fetch recent data
  const [pricesR, prodR, expR] = await Promise.all([
    supabase.from("price_data").select("*").order("data_date", { ascending: false }).limit(500),
    supabase.from("production_data").select("*").order("data_date", { ascending: false }).limit(2000),
    supabase.from("export_data").select("*").order("data_date", { ascending: false }).limit(500),
  ]);
  const prices = pricesR.data ?? [];
  const production = prodR.data ?? [];
  const exports = expR.data ?? [];

  const daysAgo = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  // ── CHECK 1: Freshness per series ──
  const series: [string, any[], number][] = [
    ["price_data", prices, 7],
    ["production_data", production, 60],
    ["export_data", exports, 14],
  ];
  for (const [name, rows, maxStale] of series) {
    totalChecks++;
    const latest = rows[0]?.data_date;
    if (!latest) {
      issues.push({
        series: name, check_name: "freshness",
        severity: "critical", description: `Sem dados em ${name}.`,
        details: {}, suggested_fix: "Executar sync-all-data e backfill-historical-data.",
      });
      continue;
    }
    const stale = daysAgo(latest);
    if (stale > maxStale) {
      issues.push({
        series: name, check_name: "freshness",
        severity: stale > maxStale * 2 ? "critical" : "warning",
        description: `Dados atrasados ${stale} dias (máx tolerado: ${maxStale}).`,
        details: { latest, stale_days: stale, max_stale: maxStale },
        suggested_fix: `Re-executar fetch-${name.replace("_data", "")} ou rever fonte.`,
      });
    }
  }

  // ── CHECK 2: Brent — outliers (price changes >15% dia/dia indicam erro) ──
  totalChecks++;
  const brent = prices.filter((p: any) => p.crude_type === "Brent").slice(0, 60);
  for (let i = 1; i < brent.length; i++) {
    const a = Number(brent[i - 1].price), b = Number(brent[i].price);
    if (!isFinite(a) || !isFinite(b) || b === 0) continue;
    const pct = Math.abs((a - b) / b) * 100;
    if (pct > 15) {
      issues.push({
        series: "price_data", check_name: "outlier_brent",
        severity: "warning",
        description: `Salto Brent ${pct.toFixed(1)}% entre ${brent[i].data_date} ($${b}) e ${brent[i - 1].data_date} ($${a}).`,
        details: { date_a: brent[i].data_date, price_a: b, date_b: brent[i - 1].data_date, price_b: a, change_pct: pct },
        suggested_fix: "Verificar fonte do dia anómalo; possível erro de unidade ou typo.",
      });
      break; // só primeiro
    }
  }

  // ── CHECK 3: Production — declínio impossível (>30% mês/mês) ──
  totalChecks++;
  const byMonth: Record<string, number> = {};
  for (const p of production) {
    const k = p.data_date.slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + Number(p.daily_production || 0);
  }
  const months = Object.keys(byMonth).sort().slice(-12);
  for (let i = 1; i < months.length; i++) {
    const prev = byMonth[months[i - 1]], cur = byMonth[months[i]];
    if (prev > 0 && cur > 0) {
      const pct = ((cur - prev) / prev) * 100;
      if (Math.abs(pct) > 30) {
        issues.push({
          series: "production_data", check_name: "impossible_swing",
          severity: "critical",
          description: `Variação ${pct.toFixed(1)}% produção entre ${months[i-1]} e ${months[i]} (${Math.round(prev)} → ${Math.round(cur)} bpd).`,
          details: { month_prev: months[i-1], month_cur: months[i], bpd_prev: prev, bpd_cur: cur, change_pct: pct },
          suggested_fix: "Provável duplicação de operadores ou unidade trocada (kbpd vs bpd).",
        });
      }
    }
  }

  // ── CHECK 4: Produção vs Exportações (balanço aproximado, mês corrente) ──
  totalChecks++;
  const latestMonth = months.at(-1);
  if (latestMonth) {
    const prodMonth = byMonth[latestMonth] * 30; // bpd → bbl/mês
    const expMonth = exports
      .filter((e: any) => e.data_date.slice(0, 7) === latestMonth)
      .reduce((s: number, e: any) => s + Number(e.volume || 0), 0);
    if (prodMonth > 0 && expMonth > 0) {
      const ratio = expMonth / prodMonth;
      // Angola exporta ~90-95% da produção (resto é consumo interno + perdas)
      if (ratio < 0.5 || ratio > 1.2) {
        issues.push({
          series: "cross_check", check_name: "production_export_balance",
          severity: "warning",
          description: `Ratio exportações/produção em ${latestMonth} = ${(ratio * 100).toFixed(0)}% (esperado 70-100%).`,
          details: { month: latestMonth, production_bbl: Math.round(prodMonth), exports_bbl: Math.round(expMonth), ratio },
          suggested_fix: "Verificar se as exportações estão completas ou se há dupla contagem na produção.",
        });
      }
    } else {
      issues.push({
        series: "cross_check", check_name: "production_export_balance",
        severity: "info",
        description: `Sem dados suficientes para reconciliar produção × exportações em ${latestMonth}.`,
        details: { month: latestMonth, production_bbl: prodMonth, exports_bbl: expMonth },
      });
    }
  }

  // ── CHECK 5: Crudes angolanos próximos do Brent (±$10) ──
  totalChecks++;
  const latestBrent = brent[0]?.price ? Number(brent[0].price) : null;
  if (latestBrent) {
    const latestDate = brent[0].data_date;
    const angolanCrudes = prices.filter((p: any) =>
      ["Cabinda", "Girassol", "Dalia", "Nemba", "Plutonio"].includes(p.crude_type) &&
      p.data_date === latestDate
    );
    for (const c of angolanCrudes) {
      const diff = Math.abs(Number(c.price) - latestBrent);
      if (diff > 10) {
        issues.push({
          series: "price_data", check_name: "crude_diff_brent",
          severity: "warning",
          description: `${c.crude_type} ($${c.price}) afasta-se do Brent ($${latestBrent}) em $${diff.toFixed(2)}.`,
          details: { crude: c.crude_type, price: c.price, brent: latestBrent, diff, date: latestDate },
          suggested_fix: "Crudes angolanos cotam tipicamente Brent ±$5. Verificar fonte do diferencial.",
        });
      }
    }
  }

  // ── CHECK 6: Sem duplicados (data + crude) ──
  totalChecks++;
  const dupKeys = new Map<string, number>();
  for (const p of prices) {
    const k = `${p.crude_type}|${p.data_date}`;
    dupKeys.set(k, (dupKeys.get(k) ?? 0) + 1);
  }
  const dups = [...dupKeys.entries()].filter(([, n]) => n > 1);
  if (dups.length) {
    issues.push({
      series: "price_data", check_name: "duplicates",
      severity: "warning",
      description: `${dups.length} chave(s) (crude+data) duplicadas em price_data.`,
      details: { sample: dups.slice(0, 5).map(([k, n]) => ({ key: k, count: n })) },
      suggested_fix: "Adicionar UNIQUE(crude_type, data_date) e deduplicar.",
    });
  }

  // ── Determine overall status ──
  const hasCritical = issues.some(i => i.severity === "critical");
  const hasWarning = issues.some(i => i.severity === "warning");
  const status = hasCritical ? "critical" : hasWarning ? "warning" : "ok";

  // Persist run + issues
  const { data: runRow, error: runErr } = await supabase
    .from("data_reconciliation_runs")
    .insert({
      status, total_checks: totalChecks, total_issues: issues.length,
      summary: {
        prices: { count: prices.length, latest: prices[0]?.data_date },
        production: { count: production.length, latest: production[0]?.data_date },
        exports: { count: exports.length, latest: exports[0]?.data_date },
        critical: issues.filter(i => i.severity === "critical").length,
        warning: issues.filter(i => i.severity === "warning").length,
        info: issues.filter(i => i.severity === "info").length,
      },
    })
    .select("id").single();

  if (runErr) {
    return new Response(JSON.stringify({ success: false, error: runErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (issues.length) {
    const rows = issues.map(i => ({ ...i, run_id: runRow.id }));
    await supabase.from("data_quality_issues").insert(rows);
  }

  return new Response(JSON.stringify({
    success: true, run_id: runRow.id, status, total_checks: totalChecks, total_issues: issues.length, issues,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
