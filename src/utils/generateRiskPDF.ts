/**
 * AlphaData - Geopolitical & Risk Intelligence Report Generator
 * ─────────────────────────────────────────────────────────────
 * COVER        : dark institutional (addCoverPageToPDF)
 * INTERNAL     : white background, palette P - unified with reportGenerator
 * ENHANCEMENTS : semi-circular risk gauge, inline score bars, KPI strip,
 *                alert severity cards, side-by-side simulation layout,
 *                key-indicator chips, colour-coded trend deltas, risk bands
 *
 * VISIBILITY IMPROVEMENTS v2:
 *  - Gauge: arco SVG-style via Bézier/polígono fino → arcos circulares limpos
 *    com strokeColor + maior raio + label de score maior
 *  - Score bars: altura de 5→8mm, cantos mais arredondados, label sempre visível
 *    com fundo contraste (badge branco/dark) sobre a barra preenchida
 *  - KPI strip: tiles mais altos (24→30mm), fonte de valor maior (15→18pt),
 *    top strip mais grosso (2.5→4mm)
 *  - Band scale: altura 6→10mm, pointer mais grosso (0.7→1.5), sombra/halo
 *  - Country/Risk row heights aumentados para respirar (13→16mm)
 *  - Alert cards: cardH 24→30mm para mais espaço de leitura
 *  - Cores de texto: contraste mínimo garantido (texto escuro sobre pale,
 *    branco sobre cor saturada) — nunca branco puro sobre verde/laranja claro
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  addCoverPageToPDF,
  getDefaultCoverPageData,
  CoverPageData,
} from './reportCoverPage';
import { loadLogoAsBase64 } from './loadLogoForPDF';

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type RGB = [number, number, number];

export interface RiskScore {
  category: string;
  score: number;
  trend: string;
  description: string;
}

export interface RiskAlert {
  alert_type: string;
  title: string;
  description: string;
  impact: string;
  region: string;
}

export interface CountryRisk {
  country: string;
  score: number;
  trend: string;
}

export interface GeopoliticalForecast {
  region: string;
  situation: string;
  impact_on_oil: string;
  prediction_30d: string;
  prediction_90d: string;
  risk_level: string;
  key_indicators: string[];
}

export interface SimulationParams {
  royaltyChange: number;
  taxChange: number;
  environmentalCompliance: number;
  opepQuotaChange: number;
  brentPriceScenario: number;
  currencyDevaluation: number;
}

export interface SimulationResults {
  revenueImpact: number;
  productionCostImpact: number;
  netProfitImpact: number;
  exportVolumeImpact: number;
  governmentTakeChange: number;
  breakEvenPrice: number;
}

export interface RiskReportData {
  title?: string;
  period?: string;
  riskScores: RiskScore[];
  alerts: RiskAlert[];
  countryRisks: CountryRisk[];
  geopoliticalForecasts: GeopoliticalForecast[];
  globalRiskIndex: number;
  simulationParams?: SimulationParams;
  simulationResults?: SimulationResults;
  generatedAt?: Date;
  aiGenerated?: boolean;
  requestingCompany?: { name: string; nif?: string; sector?: string; country?: string };
  requestedBy?: { name: string; role?: string; email?: string };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */

const P = {
  bg:               [255, 255, 255] as RGB,
  surface:          [247, 248, 250] as RGB,
  surfaceAlt:       [240, 243, 248] as RGB,
  surfaceDark:      [218, 224, 235] as RGB,   // ↑ contrast vs white bg
  border:           [210, 218, 230] as RGB,
  accentBlue:       [0,   110, 200] as RGB,
  accentBluePale:   [230, 242, 255] as RGB,
  accentGreen:      [0,   150, 115] as RGB,
  accentGreenPale:  [220, 245, 240] as RGB,
  accentRed:        [200, 30,  30]  as RGB,
  accentRedPale:    [255, 235, 235] as RGB,
  accentOrange:     [190, 120, 20]  as RGB,
  accentOrangePale: [255, 243, 220] as RGB,
  textPrimary:      [18,  24,  38]  as RGB,
  textSecondary:    [55,  70,  95]  as RGB,
  textMuted:        [120, 135, 160] as RGB,
  brand:            [220, 38,  38]  as RGB,
  white:            [255, 255, 255] as RGB,
  scoreHigh:        [200, 30,  30]  as RGB,
  scoreMed:         [190, 120, 20]  as RGB,
  scoreLow:         [0,   150, 115] as RGB,
} as const;

const L = {
  MARGIN:      20,
  HEADER_H:    38,
  FOOTER_H:    20,
  SECTION_SP:  16,
  SUBSEC_SP:   10,
  LINE_SP:     6,
  BOX_R:       3,
  SMALL_R:     2,
  THIN:        0.25,
  // ── VISIBILITY UPGRADE ──
  SCORE_BAR_H: 8,     // was 5 → taller, more readable
  BAR_RADIUS:  2,     // was 1 → rounder corners on bars
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSLATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const T = {
  reportTitle:           'Analise Geopolitica e de Riscos',
  reportSubtitle:        'Inteligencia Estrategica | Sector Petrolifero Angolano',
  generatedOn:           'Gerado em',
  generatedBy:           'IA AlphaData',
  pageOf:                (i: number, t: number) => `Pagina ${i} / ${t}`,
  globalRiskIndex:       'Indice de Risco Global Consolidado',
  riskGaugeLabel:        'IRG',
  kpiAlerts:             'Alertas Activos',
  kpiCritical:           'Criticos',
  kpiRegions:            'Regioes Monitorizadas',
  kpiCategories:         'Categorias de Risco',
  riskProfile:           'Perfil de Risco Detalhado por Categoria',
  geopoliticalForecasts: 'Previsoes Geopoliticas e Analise de Cenarios',
  activeAlerts:          'Alertas Operacionais Activos',
  countryComparison:     'Comparativo de Risco entre Paises',
  simulationImpact:      'Simulacao de Impacto Regulatorio e Fiscal',
  simulationParams:      'Parametros de Entrada da Simulacao',
  simulationResults:     'Resultados Projectados',
  simulationNote:        'Nota: Valores percentuais representam variacao face ao cenario base. Simulacao gerada por modelo AlphaData v2.',
  category:              'Categoria de Risco',
  score:                 'Score',
  scoreBar:              'Distribuicao Visual',
  trend:                 'Tendencia',
  description:           'Analise Sumaria',
  alertSeverity:         'Severidade',
  alertTitle:            'Descricao do Alerta',
  region:                'Regiao Afectada',
  impact:                'Nivel de Impacto',
  country:               'Pais / Jurisdicao',
  scoreCol:              'Score IRG',
  trendCol:              'Variacao',
  riskBand:              'Banda de Risco',
  horizon:               'Horizonte',
  forecast:              'Previsao Estrategica',
  situation:             'Situacao Actual',
  oilImpact:             'Impacto no Sector Petrolifero',
  riskLevel:             'Nivel de Risco',
  keyIndicators:         'Indicadores-Chave',
  parameter:             'Parametro',
  inputValue:            'Valor de Entrada',
  indicator:             'Indicador de Resultado',
  delta:                 'Impacto Projectado',
  legalNotice:           'AVISO LEGAL',
  legalText:             'Este relatorio foi gerado pela plataforma AlphaData - Inteligencia de Mercado Petrolifero Angolano. As informacoes aqui contidas sao de caracter estritamente informativo e analitico, nao constituindo aconselhamento financeiro, juridico ou de investimento. A AlphaData nao se responsabiliza por quaisquer decisoes tomadas com base neste documento. Dados provenientes de fontes oficiais, APIs de mercado em tempo real e modelos proprietarios AlphaData.',
  critical:   'CRITICO',
  high:       'ELEVADO',
  medium:     'MODERADO',
  low:        'CONTROLADO',
  warning:    'ALERTA',
  info:       'INFO',
  royaltyChange:       'Variacao de Royalties (%)',
  taxChange:           'Variacao Fiscal - ISP (%)',
  environmentalCosts:  'Conformidade Ambiental (%)',
  opecQuota:           'Ajuste Quota OPEP+ (%)',
  brentPrice:          'Cenario Preco Brent (USD/bbl)',
  currencyDevaluation: 'Desvalorizacao Cambial AOA (%)',
  revenueImpact:       'Impacto na Receita Bruta',
  costImpact:          'Impacto nos Custos de Producao',
  netProfitImpact:     'Impacto no Resultado Liquido',
  exportImpact:        'Impacto no Volume de Exportacao',
  govTakeChange:       'Variacao Government Take (pp)',
  breakEvenPrice:      'Preco de Equilibrio (Break-Even)',
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   PDF CONTEXT
   ═══════════════════════════════════════════════════════════════════════════ */

interface PDFCtx {
  doc: jsPDF;
  y: number;
  W: number;
  H: number;
  margin: number;
  onNewPage: () => void;
}

function bottomLimit(ctx: PDFCtx) {
  return ctx.H - L.FOOTER_H - ctx.margin - 8;
}

function needsPage(ctx: PDFCtx, space: number) {
  if (ctx.y + space > bottomLimit(ctx)) {
    ctx.doc.addPage();
    ctx.doc.setFillColor(...P.bg);
    ctx.doc.rect(0, 0, ctx.W, ctx.H, 'F');
    ctx.y = ctx.margin;
    ctx.onNewPage();
  }
}

function setFont(doc: jsPDF, size: number, weight: 'normal' | 'bold' | 'italic', color: RGB) {
  doc.setFontSize(size);
  doc.setFont('helvetica', weight);
  doc.setTextColor(...color);
}

function safeDate(d: any): Date {
  const parsed = d instanceof Date ? d : new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RISK HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreColor(score: number): RGB {
  if (score >= 70) return P.scoreHigh;
  if (score >= 45) return P.scoreMed;
  return P.scoreLow;
}

function scorePaleColor(score: number): RGB {
  if (score >= 70) return P.accentRedPale;
  if (score >= 45) return P.accentOrangePale;
  return P.accentGreenPale;
}

function riskLevelColor(level: string): RGB {
  const l = level.toLowerCase();
  if (l === 'critical') return P.scoreHigh;
  if (l === 'high')     return P.scoreMed;
  return P.scoreLow;
}

function riskLevelText(level: string): string {
  const l = level.toLowerCase();
  if (l === 'critical') return T.critical;
  if (l === 'high')     return T.high;
  if (l === 'medium')   return T.medium;
  return T.low;
}

function riskBand(score: number): string {
  if (score >= 70) return T.critical;
  if (score >= 45) return T.medium;
  return T.low;
}

function trendShort(trend: string): string {
  const t = trend.toLowerCase();
  if (t === 'up')   return '[+] Agrav.';
  if (t === 'down') return '[-] Melhoria';
  return '[=] Estavel';
}

function trendColor(trend: string): RGB {
  const t = trend.toLowerCase();
  if (t === 'up')   return P.scoreHigh;
  if (t === 'down') return P.scoreLow;
  return P.textMuted;
}

function alertSeverityColor(type: string): RGB {
  const t = type.toLowerCase();
  if (t === 'critical') return P.scoreHigh;
  if (t === 'warning')  return P.scoreMed;
  return P.accentBlue;
}

function alertSeverityPale(type: string): RGB {
  const t = type.toLowerCase();
  if (t === 'critical') return P.accentRedPale;
  if (t === 'warning')  return P.accentOrangePale;
  return P.accentBluePale;
}

function alertTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === 'critical') return T.critical;
  if (t === 'warning')  return T.warning;
  return T.info;
}

function impactText(impact: string): string {
  const i = impact.toLowerCase();
  if (i === 'high')   return 'Alto';
  if (i === 'medium') return 'Medio';
  return 'Baixo';
}

function fmtPct(v: number): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function fmtDelta(v: number, unit = '%'): string {
  return `${v > 0 ? '+' : ''}${v.toFixed(2)} ${unit}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED TABLE STYLES
   ═══════════════════════════════════════════════════════════════════════════ */

const TH = {
  fillColor:   P.accentBlue as any,
  textColor:   [255, 255, 255] as any,
  fontStyle:   'bold' as const,
  fontSize:    7.5,
  cellPadding: 4,
};
const TB = {
  fontSize:    8,
  textColor:   P.textSecondary as any,
  cellPadding: 4,
  fillColor:   P.surface as any,
};
const TS = {
  lineColor: P.border as any,
  lineWidth: 0.25,
  font:      'helvetica',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

function makeHeaderFn(
  doc: jsPDF,
  data: RiskReportData,
  logoBase64: string | undefined,
  W: number
): () => void {
  return function drawHeader() {
    doc.setFillColor(...P.bg);
    doc.rect(0, 0, W, L.HEADER_H, 'F');

    doc.setFillColor(...P.brand);
    doc.rect(0, 0, W, 2.5, 'F');

    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(0, L.HEADER_H, W, L.HEADER_H);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', L.MARGIN, 9, 10, 10);
        setFont(doc, 13, 'bold', P.textPrimary);
        doc.text('ALPHADATA', L.MARGIN + 13, 17);
      } catch {
        setFont(doc, 13, 'bold', P.textPrimary);
        doc.text('ALPHADATA', L.MARGIN, 17);
      }
    } else {
      setFont(doc, 13, 'bold', P.textPrimary);
      doc.text('ALPHADATA', L.MARGIN, 17);
    }

    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(L.MARGIN + 52, 10, L.MARGIN + 52, 28);

    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text('PETROLEUM INTELLIGENCE PLATFORM', L.MARGIN + 56, 15);
    doc.text('Angola | Oil & Gas Analytics', L.MARGIN + 56, 22);

    const title = (data.title || T.reportTitle).substring(0, 62);
    setFont(doc, 7.5, 'normal', P.textSecondary);
    doc.text(title, W / 2, 17, { align: 'center' });

    const d = safeDate(data.generatedAt);
    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(
      `${T.generatedOn}: ${d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      W - L.MARGIN, 17, { align: 'right' }
    );

    if (data.aiGenerated) {
      doc.setFillColor(...P.accentBlue);
      doc.roundedRect(W - L.MARGIN - 34, 24, 30, 7, 1.5, 1.5, 'F');
      setFont(doc, 5.5, 'bold', P.white);
      doc.text(T.generatedBy, W - L.MARGIN - 30, 28.8);
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

function addFooters(doc: jsPDF, W: number, H: number, period: string, startPage = 2) {
  const total = doc.getNumberOfPages();
  for (let i = startPage; i <= total; i++) {
    doc.setPage(i);

    doc.setFillColor(...P.bg);
    doc.rect(0, H - L.FOOTER_H, W, L.FOOTER_H, 'F');

    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(0, H - L.FOOTER_H, W, H - L.FOOTER_H);

    doc.setFillColor(...P.brand);
    doc.rect(0, H - 2, W, 2, 'F');

    setFont(doc, 6.5, 'bold', P.textMuted);
    doc.text('AlphaData | Petroleum Intelligence | Risk & Geopolitics', L.MARGIN, H - 7);

    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(T.pageOf(i, total), W / 2, H - 7, { align: 'center' });

    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(period || '', W - L.MARGIN, H - 7, { align: 'right' });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION TITLE
   ═══════════════════════════════════════════════════════════════════════════ */

function sectionTitle(ctx: PDFCtx, title: string, subtitle?: string) {
  const h = subtitle ? 18 : 14;
  needsPage(ctx, h + 8);

  ctx.doc.setFillColor(...P.surfaceAlt);
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.W - 2 * ctx.margin, h, L.BOX_R, L.BOX_R, 'F');

  ctx.doc.setFillColor(...P.accentBlue);
  ctx.doc.roundedRect(ctx.margin, ctx.y, 3, h, 1, 1, 'F');

  setFont(ctx.doc, 11, 'bold', P.textPrimary);
  ctx.doc.text(title, ctx.margin + 10, ctx.y + (subtitle ? 7 : 9.5));

  if (subtitle) {
    setFont(ctx.doc, 7, 'normal', P.textMuted);
    ctx.doc.text(subtitle, ctx.margin + 10, ctx.y + 14);
  }

  ctx.y += h + 6;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-SECTION LABEL
   ═══════════════════════════════════════════════════════════════════════════ */

function subLabel(ctx: PDFCtx, text: string) {
  needsPage(ctx, 12);
  setFont(ctx.doc, 7.5, 'bold', P.accentBlue);
  ctx.doc.text(text.toUpperCase(), ctx.margin, ctx.y);
  ctx.doc.setDrawColor(...P.accentBlue);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(ctx.margin, ctx.y + 2, ctx.W - ctx.margin, ctx.y + 2);
  ctx.y += 8;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE SCORE BAR  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • Height 5 → 8mm (L.SCORE_BAR_H)
   • Radius 1 → 2 (L.BAR_RADIUS)
   • Track colour: surfaceDark (darker than before) for better empty-fill contrast
   • Score label: always rendered as a white badge pill INSIDE the fill
     (never plain text over unknown background)
   • If fill too narrow (<14mm) for label, place label to the right in primary colour
   ═══════════════════════════════════════════════════════════════════════════ */

function drawScoreBar(
  ctx: PDFCtx,
  x: number,
  y: number,
  w: number,
  score: number,
  showLabel = true
) {
  const h      = L.SCORE_BAR_H;
  const radius = L.BAR_RADIUS;
  const fillW  = Math.max((score / 100) * w, 3);
  const color  = scoreColor(score);

  // ── Track (background) ──
  ctx.doc.setFillColor(...P.surfaceDark);
  ctx.doc.roundedRect(x, y, w, h, radius, radius, 'F');

  // ── Fill ──
  ctx.doc.setFillColor(...color);
  ctx.doc.roundedRect(x, y, fillW, h, radius, radius, 'F');

  // ── Score label ──
  if (!showLabel) return;

  const labelText = `${score}%`;
  const minFillForLabel = 14; // mm — minimum fill width to fit label inside

  if (fillW >= minFillForLabel) {
    // White pill inside the fill
    setFont(ctx.doc, 5.5, 'bold', P.white);
    const tw = ctx.doc.getTextWidth(labelText);
    const pillW = tw + 4;
    const pillH = h - 2;
    const pillX = x + fillW - pillW - 1;
    const pillY = y + 1;
    // Semi-transparent darker overlay for pill bg (simulate with slightly darker colour)
    const [r, g, b] = color;
    ctx.doc.setFillColor(Math.max(r - 40, 0), Math.max(g - 30, 0), Math.max(b - 30, 0));
    ctx.doc.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'F');
    ctx.doc.text(labelText, pillX + pillW / 2, y + h - 1.8, { align: 'center' });
  } else {
    // Label to the right of bar, in score colour (always readable on white bg)
    setFont(ctx.doc, 6, 'bold', color);
    ctx.doc.text(labelText, x + w + 2, y + h - 1.5);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEMI-CIRCULAR GAUGE  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • Radius stays the same (caller passes r=28) but inner hole shrunk: 0.62→0.55
     → wider coloured arc band (more visible)
   • Zone arcs use a 2-layer approach: outer arc (r*0.98) + re-draw hole
     + a thin white ring stroke to separate zones visually
   • Needle: lineWidth 1.2→2.0, + white outline trick for contrast
   • Score number: fontSize 16→20, centred lower in the hole
   • IRG label: fontSize 6→7.5, uppercase tracking
   • Scale labels (0 / 50 / 100): fontSize 5.5→6.5
   • Zone boundary tick marks added for clearer scale reading
   ═══════════════════════════════════════════════════════════════════════════ */

function drawGauge(ctx: PDFCtx, cx: number, cy: number, r: number, score: number) {
  const doc = ctx.doc;
  const PI  = Math.PI;
  const STEPS = 48; // smoother arcs

  // ── 1. Grey background arc ──────────────────────────────────────────────
  doc.setFillColor(...P.surfaceDark);
  for (let s = 0; s < STEPS; s++) {
    const a1 = PI + (s / STEPS) * PI;
    const a2 = PI + ((s + 1) / STEPS) * PI;
    doc.triangle(
      cx, cy,
      cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
      cx + Math.cos(a2) * r, cy + Math.sin(a2) * r,
      'F'
    );
  }

  // ── 2. White inner hole (first pass — clean background) ─────────────────
  doc.setFillColor(...P.bg);
  doc.circle(cx, cy, r * 0.55, 'F');    // was 0.62 → 0.55 = wider arc

  // ── 3. Colour zones ──────────────────────────────────────────────────────
  const zones: Array<[number, number, RGB]> = [
    [0,  45, P.scoreLow],
    [45, 70, P.scoreMed],
    [70, 100, P.scoreHigh],
  ];
  const zoneSteps = 16;
  zones.forEach(([from, to, color]) => {
    const a1Base = PI + (from / 100) * PI;
    const a2Base = PI + (to   / 100) * PI;
    doc.setFillColor(...color);
    for (let s = 0; s < zoneSteps; s++) {
      const a1 = a1Base + (s / zoneSteps) * (a2Base - a1Base);
      const a2 = a1Base + ((s + 1) / zoneSteps) * (a2Base - a1Base);
      doc.triangle(
        cx, cy,
        cx + Math.cos(a1) * (r * 0.98), cy + Math.sin(a1) * (r * 0.98),
        cx + Math.cos(a2) * (r * 0.98), cy + Math.sin(a2) * (r * 0.98),
        'F'
      );
    }
  });

  // ── 4. Re-draw inner hole ────────────────────────────────────────────────
  doc.setFillColor(...P.bg);
  doc.circle(cx, cy, r * 0.55, 'F');

  // ── 5. Thin white ring to separate inner hole from arc ──────────────────
  doc.setDrawColor(...P.bg);
  doc.setLineWidth(0.8);
  doc.circle(cx, cy, r * 0.55);

  // ── 6. Zone boundary tick marks (at 0, 45, 70, 100) ─────────────────────
  const tickAngles = [0, 45, 70, 100].map(v => PI + (v / 100) * PI);
  doc.setDrawColor(...P.bg);
  doc.setLineWidth(1.0);
  tickAngles.forEach(a => {
    const x1 = cx + Math.cos(a) * (r * 0.54);
    const y1 = cy + Math.sin(a) * (r * 0.54);
    const x2 = cx + Math.cos(a) * (r * 0.99);
    const y2 = cy + Math.sin(a) * (r * 0.99);
    doc.line(x1, y1, x2, y2);
  });

  // ── 7. Needle ────────────────────────────────────────────────────────────
  const needleAngle = PI + (score / 100) * PI;
  const nx = cx + Math.cos(needleAngle) * (r * 0.75);
  const ny = cy + Math.sin(needleAngle) * (r * 0.75);

  // White outline for contrast against any zone colour
  doc.setDrawColor(...P.bg);
  doc.setLineWidth(3.5);
  doc.line(cx, cy, nx, ny);

  // Needle itself
  doc.setDrawColor(...P.textPrimary);
  doc.setLineWidth(1.8);
  doc.line(cx, cy, nx, ny);

  // Pivot dot
  doc.setFillColor(...P.bg);
  doc.circle(cx, cy, 2.8, 'F');
  doc.setFillColor(...P.textPrimary);
  doc.circle(cx, cy, 2.0, 'F');

  // ── 8. Score text inside hole ────────────────────────────────────────────
  setFont(doc, 20, 'bold', scoreColor(score));   // was 16 → 20
  doc.text(`${score}`, cx, cy - 2, { align: 'center' });

  setFont(doc, 7.5, 'bold', P.textMuted);         // was 6 → 7.5
  doc.text(T.riskGaugeLabel, cx, cy + 5.5, { align: 'center' });

  // ── 9. Scale labels ──────────────────────────────────────────────────────
  setFont(doc, 6.5, 'normal', P.textMuted);       // was 5.5 → 6.5
  doc.text('0',   cx - r - 2, cy + 3, { align: 'right' });
  doc.text('100', cx + r + 2, cy + 3);
  doc.text('50',  cx,         cy - r - 3, { align: 'center' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   KPI STRIP  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • tileH 24 → 30mm
   • Value font 15 → 18pt
   • Top colour strip 2.5 → 4mm
   • Value Y position adjusted for new height
   • Label Y position adjusted
   ═══════════════════════════════════════════════════════════════════════════ */

function renderKpiStrip(ctx: PDFCtx, data: RiskReportData) {
  needsPage(ctx, 36);

  const contentW = ctx.W - 2 * ctx.margin;
  const tileW    = (contentW - 9) / 4;
  const tileH    = 30;     // was 24

  const criticalCount = data.alerts.filter(a => a.alert_type.toLowerCase() === 'critical').length;
  const regionCount   = [...new Set(data.geopoliticalForecasts.map(f => f.region))].length;

  const kpis = [
    { label: T.kpiAlerts,     value: String(data.alerts.length),    color: P.accentBlue, pale: P.accentBluePale   },
    { label: T.kpiCritical,   value: String(criticalCount),          color: P.scoreHigh,  pale: P.accentRedPale    },
    { label: T.kpiRegions,    value: String(regionCount),            color: P.scoreMed,   pale: P.accentOrangePale },
    { label: T.kpiCategories, value: String(data.riskScores.length), color: P.scoreLow,   pale: P.accentGreenPale  },
  ];

  kpis.forEach((kpi, i) => {
    const tx = ctx.margin + i * (tileW + 3);

    ctx.doc.setFillColor(...kpi.pale);
    ctx.doc.roundedRect(tx, ctx.y, tileW, tileH, L.BOX_R, L.BOX_R, 'F');
    ctx.doc.setDrawColor(...kpi.color);
    ctx.doc.setLineWidth(0.4);
    ctx.doc.roundedRect(tx, ctx.y, tileW, tileH, L.BOX_R, L.BOX_R, 'S');

    // Top colour strip — thicker: 4mm (was 2.5)
    ctx.doc.setFillColor(...kpi.color);
    ctx.doc.roundedRect(tx, ctx.y, tileW, 4, 1, 1, 'F');

    // Value
    setFont(ctx.doc, 18, 'bold', kpi.color);   // was 15 → 18
    ctx.doc.text(kpi.value, tx + tileW / 2, ctx.y + 20, { align: 'center' });

    // Label
    setFont(ctx.doc, 6.5, 'normal', P.textSecondary);   // was 6 → 6.5, was textMuted → textSecondary
    ctx.doc.text(kpi.label, tx + tileW / 2, ctx.y + 27, { align: 'center' });
  });

  ctx.y += tileH + L.SUBSEC_SP;
}

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL RISK INDEX PANEL  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • panelH 58 → 68mm (more space for gauge with wider arc)
   • Band scale: height 6 → 10mm, bandY adjusted
   • Pointer: lineWidth 0.7 → 1.5, halo circle added
   • Legend swatch size 4 → 6mm
   • Legend font 5.5 → 6.5
   ═══════════════════════════════════════════════════════════════════════════ */

function renderGlobalRiskPanel(ctx: PDFCtx, data: RiskReportData) {
  sectionTitle(ctx, T.globalRiskIndex, T.reportSubtitle);
  needsPage(ctx, 76);

  const contentW = ctx.W - 2 * ctx.margin;
  const panelH   = 68;     // was 58

  ctx.doc.setFillColor(...P.surface);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, panelH, L.BOX_R, L.BOX_R, 'F');
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(L.THIN);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, panelH, L.BOX_R, L.BOX_R, 'S');

  // Gauge — centre vertically in panel (cy moves down proportionally)
  drawGauge(ctx, ctx.margin + 46, ctx.y + panelH / 2 + 6, 30, data.globalRiskIndex);

  // Vertical divider
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(0.3);
  ctx.doc.line(ctx.margin + 96, ctx.y + 6, ctx.margin + 96, ctx.y + panelH - 6);

  const rx = ctx.margin + 102;
  const ry = ctx.y + 8;
  const color = scoreColor(data.globalRiskIndex);

  setFont(ctx.doc, 7.5, 'bold', P.textMuted);
  ctx.doc.text('CLASSIFICACAO DO RISCO GLOBAL', rx, ry);

  // Badge
  const badge = riskBand(data.globalRiskIndex);
  ctx.doc.setFillColor(...color);
  ctx.doc.roundedRect(rx, ry + 4, 48, 13, L.SMALL_R, L.SMALL_R, 'F');
  setFont(ctx.doc, 11, 'bold', P.white);
  ctx.doc.text(badge, rx + 24, ry + 13, { align: 'center' });

  // Band scale
  const bandY = ry + 24;
  const bandW = contentW - 102 - 10;

  setFont(ctx.doc, 6.5, 'normal', P.textMuted);
  ctx.doc.text('Escala de Referencia:', rx, bandY);

  const bands: Array<[RGB, number]> = [
    [P.scoreLow,  44],
    [P.scoreMed,  25],
    [P.scoreHigh, 31],
  ];
  let bx = rx;
  const BAND_H = 10;   // was 6 → 10
  bands.forEach(([c, pct]) => {
    ctx.doc.setFillColor(...c);
    ctx.doc.rect(bx, bandY + 4, (pct / 100) * bandW, BAND_H, 'F');
    bx += (pct / 100) * bandW;
  });

  // Pointer — thicker, with white halo
  const pointerX = rx + (data.globalRiskIndex / 100) * bandW;

  // Halo
  ctx.doc.setDrawColor(...P.bg);
  ctx.doc.setLineWidth(3.0);
  ctx.doc.line(pointerX, bandY + 1, pointerX, bandY + BAND_H + 7);

  // Pointer line
  ctx.doc.setDrawColor(...P.textPrimary);
  ctx.doc.setLineWidth(1.5);    // was 0.7 → 1.5
  ctx.doc.line(pointerX, bandY + 1, pointerX, bandY + BAND_H + 7);

  // Pointer dot
  ctx.doc.setFillColor(...P.bg);
  ctx.doc.circle(pointerX, bandY + 1, 2.5, 'F');
  ctx.doc.setFillColor(...P.textPrimary);
  ctx.doc.circle(pointerX, bandY + 1, 1.8, 'F');

  // Legend
  const legendLabels = ['CONTROLADO', 'MODERADO', 'CRITICO'];
  const legendColors: RGB[] = [P.scoreLow, P.scoreMed, P.scoreHigh];
  const legendStepW = bandW / 3;
  legendLabels.forEach((label, i) => {
    const lx2 = rx + i * legendStepW;
    ctx.doc.setFillColor(...legendColors[i]);
    ctx.doc.roundedRect(lx2, bandY + BAND_H + 9, 6, 6, 0.8, 0.8, 'F');  // was 4×4 → 6×6
    setFont(ctx.doc, 6.5, 'normal', P.textMuted);   // was 5.5 → 6.5
    ctx.doc.text(label, lx2 + 8, bandY + BAND_H + 14);
  });

  // Metadata
  const d = safeDate(data.generatedAt);
  setFont(ctx.doc, 6.5, 'normal', P.textMuted);
  ctx.doc.text(
    `Periodo: ${data.period || '-'}   |   Actualizado: ${d.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    rx, ctx.y + panelH - 6
  );

  ctx.y += panelH + L.SECTION_SP;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RISK MATRIX  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • rowH 15 → 18mm
   • Header row height 10 → 12mm
   • drawScoreBar now called with showLabel=true (new default)
   • Bar label badge now always visible (handled inside drawScoreBar)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderRiskMatrix(ctx: PDFCtx, data: RiskReportData) {
  if (!data.riskScores?.length) return;

  renderKpiStrip(ctx, data);
  sectionTitle(ctx, T.riskProfile);

  const contentW = ctx.W - 2 * ctx.margin;
  const colCat   = 52;
  const colScore = 22;
  const colTrend = 38;
  const colBar   = contentW - colCat - colScore - colTrend;
  const rowH     = 18;    // was 15

  // Header row
  ctx.doc.setFillColor(...P.accentBlue);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, 12, L.BOX_R, L.BOX_R, 'F');  // was 10 → 12
  setFont(ctx.doc, 7.5, 'bold', P.white);   // was 7 → 7.5
  ctx.doc.text(T.category,  ctx.margin + 4,                              ctx.y + 8.5);
  ctx.doc.text(T.score,     ctx.margin + colCat + colScore / 2,          ctx.y + 8.5, { align: 'center' });
  ctx.doc.text(T.scoreBar,  ctx.margin + colCat + colScore + colBar / 2, ctx.y + 8.5, { align: 'center' });
  ctx.doc.text(T.trend,     ctx.margin + colCat + colScore + colBar + 4, ctx.y + 8.5);
  ctx.y += 14;

  data.riskScores.forEach((r, idx) => {
    needsPage(ctx, rowH + 6);
    const isAlt = idx % 2 === 1;

    ctx.doc.setFillColor(...(isAlt ? P.bg : P.surface));
    ctx.doc.rect(ctx.margin, ctx.y, contentW, rowH, 'F');

    // Left accent strip — thicker: 3.5mm (was 2.5)
    ctx.doc.setFillColor(...scoreColor(r.score));
    ctx.doc.rect(ctx.margin, ctx.y, 3.5, rowH, 'F');

    // Category
    setFont(ctx.doc, 8.5, 'bold', P.textPrimary);   // was 8 → 8.5
    ctx.doc.text(r.category, ctx.margin + 6, ctx.y + 11);

    // Score value — bigger
    setFont(ctx.doc, 11, 'bold', scoreColor(r.score));   // was 9.5 → 11
    ctx.doc.text(`${r.score}`, ctx.margin + colCat + colScore / 2, ctx.y + 11.5, { align: 'center' });

    // Score bar — centred vertically in row, using new drawScoreBar
    const barX = ctx.margin + colCat + colScore + 3;
    const barW = colBar - 10;   // leave room for external label if needed
    const barY = ctx.y + (rowH - L.SCORE_BAR_H) / 2;
    drawScoreBar(ctx, barX, barY, barW, r.score, true);

    // Trend
    const tLabel = trendShort(r.trend);
    setFont(ctx.doc, 7, 'normal', trendColor(r.trend));   // was 6.5 → 7
    ctx.doc.text(tLabel, ctx.margin + colCat + colScore + colBar + 4, ctx.y + 11);

    ctx.doc.setDrawColor(...P.border);
    ctx.doc.setLineWidth(0.15);
    ctx.doc.line(ctx.margin, ctx.y + rowH, ctx.margin + contentW, ctx.y + rowH);
    ctx.y += rowH;
  });

  // Description detail table
  const withDesc = data.riskScores.filter(r => r.description);
  if (withDesc.length > 0) {
    ctx.y += 8;
    subLabel(ctx, T.description);
    autoTable(ctx.doc, {
      startY: ctx.y,
      head: [[T.category, T.description]],
      body: withDesc.map(r => [r.category, r.description]),
      margin: { left: ctx.margin, right: ctx.margin },
      headStyles:         TH,
      bodyStyles:         { ...TB, fontSize: 7.5 },
      alternateRowStyles: { fillColor: P.bg as any },
      theme:              'grid',
      styles:             TS,
      columnStyles:       { 0: { cellWidth: 50, fontStyle: 'bold', textColor: P.textPrimary as any } },
    });
    ctx.y = (ctx.doc as any).lastAutoTable.finalY + L.SECTION_SP;
  } else {
    ctx.y += L.SECTION_SP;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GEOPOLITICAL FORECASTS
   ═══════════════════════════════════════════════════════════════════════════ */

function renderGeopoliticalForecasts(ctx: PDFCtx, data: RiskReportData) {
  if (!data.geopoliticalForecasts?.length) return;
  sectionTitle(ctx, T.geopoliticalForecasts, 'Analise por regiao com horizonte 30/90 dias');

  const contentW = ctx.W - 2 * ctx.margin;

  data.geopoliticalForecasts.forEach((f, idx) => {
    needsPage(ctx, 100);

    const lvlColor = riskLevelColor(f.risk_level);
    const lvlPale  = scorePaleColor(
      f.risk_level === 'critical' ? 80 : f.risk_level === 'high' ? 60 : 30
    );

    // Region header bar
    ctx.doc.setFillColor(...lvlColor);
    ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, 13, L.SMALL_R, L.SMALL_R, 'F');

    const badgeText   = riskLevelText(f.risk_level);
    const badgeFixedW = 28;
    const regionLabel = `${idx + 1}. ${f.region.toUpperCase()}`;
    const maxRegionW  = contentW - badgeFixedW - 16;
    setFont(ctx.doc, 9, 'bold', P.white);    // was 8.5 → 9
    const regionLines = ctx.doc.splitTextToSize(regionLabel, maxRegionW);
    ctx.doc.text(regionLines[0], ctx.margin + 6, ctx.y + 9);

    ctx.doc.setFillColor(...P.white);
    ctx.doc.roundedRect(ctx.W - ctx.margin - badgeFixedW, ctx.y + 2.5, badgeFixedW, 8, 1, 1, 'F');
    setFont(ctx.doc, 7, 'bold', lvlColor);   // was 6.5 → 7
    ctx.doc.text(badgeText, ctx.W - ctx.margin - badgeFixedW / 2, ctx.y + 8, { align: 'center' });

    ctx.y += 17;

    // Two-column info cards
    const halfW = (contentW - 6) / 2;

    // Situation card (left)
    ctx.doc.setFillColor(...P.surface);
    ctx.doc.roundedRect(ctx.margin, ctx.y, halfW, 40, L.SMALL_R, L.SMALL_R, 'F');
    ctx.doc.setDrawColor(...P.border);
    ctx.doc.setLineWidth(0.2);
    ctx.doc.roundedRect(ctx.margin, ctx.y, halfW, 40, L.SMALL_R, L.SMALL_R, 'S');
    ctx.doc.setFillColor(...P.accentBlue);
    ctx.doc.roundedRect(ctx.margin, ctx.y, halfW, 3.5, 1, 1, 'F');    // was 3 → 3.5

    setFont(ctx.doc, 7.5, 'bold', P.accentBlue);   // was 7 → 7.5
    ctx.doc.text(T.situation.toUpperCase(), ctx.margin + 4, ctx.y + 11);
    setFont(ctx.doc, 7.5, 'normal', P.textSecondary);
    const sitLines = ctx.doc.splitTextToSize(f.situation, halfW - 8);
    ctx.doc.text(sitLines.slice(0, 5), ctx.margin + 4, ctx.y + 17);

    // Oil impact card (right)
    const rx2 = ctx.margin + halfW + 6;
    ctx.doc.setFillColor(...lvlPale);
    ctx.doc.roundedRect(rx2, ctx.y, halfW, 40, L.SMALL_R, L.SMALL_R, 'F');
    ctx.doc.setDrawColor(...lvlColor);
    ctx.doc.setLineWidth(0.2);
    ctx.doc.roundedRect(rx2, ctx.y, halfW, 40, L.SMALL_R, L.SMALL_R, 'S');
    ctx.doc.setFillColor(...lvlColor);
    ctx.doc.roundedRect(rx2, ctx.y, halfW, 3.5, 1, 1, 'F');

    setFont(ctx.doc, 7.5, 'bold', lvlColor);   // was 7 → 7.5
    ctx.doc.text(T.oilImpact.toUpperCase(), rx2 + 4, ctx.y + 11);
    setFont(ctx.doc, 7.5, 'normal', P.textSecondary);
    const impLines = ctx.doc.splitTextToSize(f.impact_on_oil, halfW - 8);
    ctx.doc.text(impLines.slice(0, 5), rx2 + 4, ctx.y + 17);

    ctx.y += 44;

    // Key indicator chips
    if (f.key_indicators?.length) {
      needsPage(ctx, 24);
      setFont(ctx.doc, 7.5, 'bold', P.textMuted);   // was 7 → 7.5
      ctx.doc.text(`${T.keyIndicators}:`, ctx.margin, ctx.y + 5);
      ctx.y += 10;

      let chipX = ctx.margin;
      f.key_indicators.slice(0, 8).forEach(ind => {
        const display = ind.length > 28 ? ind.substring(0, 27) + '.' : ind;
        setFont(ctx.doc, 6.5, 'normal', P.accentBlue);   // was 6 → 6.5
        const chipW = ctx.doc.getTextWidth(display) + 12;   // was +10 → +12
        if (chipX + chipW > ctx.W - ctx.margin) {
          chipX  = ctx.margin;
          ctx.y += 12;
          needsPage(ctx, 12);
        }
        ctx.doc.setFillColor(...P.accentBluePale);
        ctx.doc.roundedRect(chipX, ctx.y, chipW, 9, 1, 1, 'F');   // was 8 → 9
        ctx.doc.setDrawColor(...P.accentBlue);
        ctx.doc.setLineWidth(0.3);
        ctx.doc.roundedRect(chipX, ctx.y, chipW, 9, 1, 1, 'S');
        ctx.doc.text(display, chipX + chipW / 2, ctx.y + 6.5, { align: 'center' });
        chipX += chipW + 3;
      });
      ctx.y += 15;
    }

    // 30/90-day forecast table
    needsPage(ctx, 30);
    autoTable(ctx.doc, {
      startY: ctx.y,
      head: [[T.horizon, T.forecast]],
      body: [
        ['30 dias', f.prediction_30d],
        ['90 dias', f.prediction_90d],
      ],
      margin: { left: ctx.margin, right: ctx.margin },
      headStyles:         { ...TH, fillColor: lvlColor as any },
      bodyStyles:         TB,
      alternateRowStyles: { fillColor: P.bg as any },
      theme:              'grid',
      styles:             TS,
      columnStyles:       { 0: { cellWidth: 22, fontStyle: 'bold', halign: 'center' } },
    });
    ctx.y = (ctx.doc as any).lastAutoTable.finalY + L.SUBSEC_SP + 6;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVE ALERTS  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • Detail card height 24 → 30mm
   • Left accent strip 3.5 → 4.5mm
   • Title font 8.5 → 9.5pt
   • Description up to 3 lines (was 2)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderActiveAlerts(ctx: PDFCtx, data: RiskReportData) {
  if (!data.alerts?.length) return;
  sectionTitle(ctx, T.activeAlerts);

  const contentW = ctx.W - 2 * ctx.margin;

  autoTable(ctx.doc, {
    startY: ctx.y,
    head: [[T.alertSeverity, T.alertTitle, T.region, T.impact]],
    body: data.alerts.map(a => [
      alertTypeLabel(a.alert_type),
      a.title,
      a.region || '-',
      impactText(a.impact),
    ]),
    margin: { left: ctx.margin, right: ctx.margin },
    headStyles:         { ...TH, fillColor: P.scoreHigh as any },
    bodyStyles:         { ...TB, fontSize: 8.5 },   // was 8 → 8.5
    alternateRowStyles: { fillColor: P.bg as any },
    theme:              'grid',
    styles:             TS,
    columnStyles: {
      0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 22, halign: 'center' },
    },
    didParseCell(cell: any) {
      if (cell.column.index === 0 && cell.section === 'body') {
        const txt = cell.cell.text[0] as string;
        cell.cell.styles.textColor =
          txt === T.critical ? P.scoreHigh :
          txt === T.warning  ? P.scoreMed  : P.accentBlue;
        cell.cell.styles.fontSize = 8;
        cell.cell.styles.fontStyle = 'bold';
      }
    },
  });
  ctx.y = (ctx.doc as any).lastAutoTable.finalY + L.SUBSEC_SP;

  // Detail cards
  const withDesc = data.alerts.filter(a => a.description);
  if (withDesc.length > 0) {
    ctx.y += 6;
    subLabel(ctx, 'Detalhe dos Alertas');

    withDesc.forEach(a => {
      needsPage(ctx, 34);
      const sev   = alertSeverityColor(a.alert_type);
      const pale  = alertSeverityPale(a.alert_type);
      const cardH = 30;    // was 24

      ctx.doc.setFillColor(...pale);
      ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, cardH, L.SMALL_R, L.SMALL_R, 'F');
      ctx.doc.setDrawColor(...sev);
      ctx.doc.setLineWidth(0.3);
      ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, cardH, L.SMALL_R, L.SMALL_R, 'S');
      ctx.doc.setFillColor(...sev);
      ctx.doc.roundedRect(ctx.margin, ctx.y, 4.5, cardH, 1, 1, 'F');    // was 3.5 → 4.5

      const maxTitleW = contentW - 54;
      setFont(ctx.doc, 9.5, 'bold', P.textPrimary);   // was 8.5 → 9.5
      const titleLines = ctx.doc.splitTextToSize(a.title, maxTitleW);
      ctx.doc.text(titleLines[0], ctx.margin + 9, ctx.y + 10);

      const regionDisplay = (a.region || '-').length > 16
        ? (a.region || '-').substring(0, 15) + '.'
        : (a.region || '-');
      const badgeLabel = `${alertTypeLabel(a.alert_type)} | ${regionDisplay}`;
      const maxBadgeW  = 50;
      const bw = Math.min(ctx.doc.getTextWidth(badgeLabel) + 8, maxBadgeW);
      ctx.doc.setFillColor(...sev);
      ctx.doc.roundedRect(ctx.W - ctx.margin - bw, ctx.y + 3, bw, 8, 1, 1, 'F');
      setFont(ctx.doc, 6, 'bold', P.white);   // was 5.5 → 6
      ctx.doc.text(badgeLabel, ctx.W - ctx.margin - bw / 2, ctx.y + 8, { align: 'center' });

      setFont(ctx.doc, 8, 'normal', P.textSecondary);   // was 7.5 → 8
      const descLines = ctx.doc.splitTextToSize(a.description, contentW - 16);
      ctx.doc.text(descLines.slice(0, 3), ctx.margin + 9, ctx.y + 19);   // was 2 lines → 3

      ctx.y += cardH + 4;
    });
  }

  ctx.y += L.SECTION_SP;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COUNTRY RISK  ── VISIBILITY UPGRADE
   ─────────────────────────────────────────────────────────────────────────
   Changes:
   • rowH 13 → 16mm
   • Country name font 7.5 → 8.5pt
   • Score font 9 → 11pt
   • Bar height increased via L.SCORE_BAR_H
   ═══════════════════════════════════════════════════════════════════════════ */

function renderCountryRisk(ctx: PDFCtx, data: RiskReportData) {
  if (!data.countryRisks?.length) return;
  sectionTitle(ctx, T.countryComparison);

  const contentW = ctx.W - 2 * ctx.margin;
  const colCountry = 50;
  const colScore   = 18;
  const colBand    = 24;
  const colTrend   = 30;
  const colBar     = contentW - colCountry - colScore - colBand - colTrend;
  const rowH       = 16;   // was 13
  const sorted     = [...data.countryRisks].sort((a, b) => b.score - a.score);

  // Header row
  ctx.doc.setFillColor(...P.accentBlue);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, 12, L.BOX_R, L.BOX_R, 'F');   // was 10 → 12
  setFont(ctx.doc, 7, 'bold', P.white);

  ctx.doc.text(T.country,  ctx.margin + 4, ctx.y + 8.5);
  ctx.doc.text(T.scoreCol, ctx.margin + colCountry + colScore / 2, ctx.y + 8.5, { align: 'center' });
  ctx.doc.text(T.scoreBar, ctx.margin + colCountry + colScore + colBar / 2, ctx.y + 8.5, { align: 'center' });
  ctx.doc.text(T.trendCol, ctx.margin + colCountry + colScore + colBar + 3, ctx.y + 8.5);
  ctx.doc.text(T.riskBand, ctx.margin + colCountry + colScore + colBar + colTrend + colBand / 2, ctx.y + 8.5, { align: 'center' });
  ctx.y += 14;

  sorted.forEach((cr, idx) => {
    needsPage(ctx, rowH + 4);
    const isAlt = idx % 2 === 1;

    ctx.doc.setFillColor(...(isAlt ? P.bg : P.surface));
    ctx.doc.rect(ctx.margin, ctx.y, contentW, rowH, 'F');

    ctx.doc.setFillColor(...scoreColor(cr.score));
    ctx.doc.rect(ctx.margin, ctx.y, 3.5, rowH, 'F');    // was 2.5 → 3.5

    const maxCountryChars = 18;
    const displayName = cr.country.length > maxCountryChars
      ? cr.country.substring(0, maxCountryChars - 1) + '.'
      : cr.country;
    setFont(ctx.doc, 8.5, 'bold', P.textPrimary);   // was 7.5 → 8.5
    ctx.doc.text(displayName, ctx.margin + 6, ctx.y + 10.5);

    setFont(ctx.doc, 11, 'bold', scoreColor(cr.score));   // was 9 → 11
    ctx.doc.text(`${cr.score}`, ctx.margin + colCountry + colScore / 2, ctx.y + 11, { align: 'center' });

    const barX = ctx.margin + colCountry + colScore + 2;
    const barW = colBar - 8;
    const barY = ctx.y + (rowH - L.SCORE_BAR_H) / 2;
    drawScoreBar(ctx, barX, barY, barW, cr.score, true);

    const trendLabel = trendShort(cr.trend);
    setFont(ctx.doc, 6.5, 'normal', trendColor(cr.trend));
    ctx.doc.text(trendLabel, ctx.margin + colCountry + colScore + colBar + 3, ctx.y + 10.5);

    const band     = riskBand(cr.score);
    const badgeX   = ctx.margin + colCountry + colScore + colBar + colTrend;
    const badgeW   = colBand - 2;
    ctx.doc.setFillColor(...scoreColor(cr.score));
    ctx.doc.roundedRect(badgeX, ctx.y + 3, badgeW, 10, 1, 1, 'F');   // taller badge: 8 → 10
    setFont(ctx.doc, 6, 'bold', P.white);   // was 5.5 → 6
    ctx.doc.text(band, badgeX + badgeW / 2, ctx.y + 9.5, { align: 'center' });

    ctx.doc.setDrawColor(...P.border);
    ctx.doc.setLineWidth(0.15);
    ctx.doc.line(ctx.margin, ctx.y + rowH, ctx.margin + contentW, ctx.y + rowH);
    ctx.y += rowH;
  });

  ctx.y += L.SECTION_SP;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIMULATION
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSimulation(ctx: PDFCtx, data: RiskReportData) {
  if (!data.simulationParams || !data.simulationResults) return;

  ctx.doc.addPage();
  ctx.doc.setFillColor(...P.bg);
  ctx.doc.rect(0, 0, ctx.W, ctx.H, 'F');
  ctx.y = ctx.margin;
  ctx.onNewPage();

  sectionTitle(ctx, T.simulationImpact, 'Modelo de impacto regulatorio, fiscal e macroeconomico AlphaData v2');

  const contentW = ctx.W - 2 * ctx.margin;
  const halfW    = (contentW - 8) / 2;
  const p        = data.simulationParams;
  const r        = data.simulationResults;
  const startY   = ctx.y;

  subLabel(ctx, T.simulationParams);
  autoTable(ctx.doc, {
    startY: ctx.y,
    head: [[T.parameter, T.inputValue]],
    body: [
      [T.royaltyChange,       fmtPct(p.royaltyChange)],
      [T.taxChange,           fmtPct(p.taxChange)],
      [T.environmentalCosts,  `+${p.environmentalCompliance.toFixed(1)}%`],
      [T.opecQuota,           fmtPct(p.opepQuotaChange)],
      [T.brentPrice,          `USD ${p.brentPriceScenario.toFixed(2)}/bbl`],
      [T.currencyDevaluation, `+${p.currencyDevaluation.toFixed(1)}%`],
    ],
    margin: { left: ctx.margin, right: ctx.margin + halfW + 8 },
    headStyles:         TH,
    bodyStyles:         TB,
    alternateRowStyles: { fillColor: P.bg as any },
    theme:              'grid',
    styles:             TS,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: P.textPrimary as any },
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });
  const paramsBottom = (ctx.doc as any).lastAutoTable.finalY;

  const resultRows: [string, string, boolean][] = [
    [T.revenueImpact,   fmtDelta(r.revenueImpact),             r.revenueImpact >= 0],
    [T.costImpact,      fmtDelta(r.productionCostImpact),       r.productionCostImpact <= 0],
    [T.netProfitImpact, fmtDelta(r.netProfitImpact),            r.netProfitImpact >= 0],
    [T.exportImpact,    fmtDelta(r.exportVolumeImpact),         r.exportVolumeImpact >= 0],
    [T.govTakeChange,   fmtDelta(r.governmentTakeChange, 'pp'), r.governmentTakeChange <= 0],
    [T.breakEvenPrice,  `USD ${r.breakEvenPrice.toFixed(2)}/bbl`, r.breakEvenPrice <= 50],
  ];

  autoTable(ctx.doc, {
    startY,
    head: [[T.indicator, T.delta]],
    body: resultRows.map(row => [row[0], row[1]]),
    margin: { left: ctx.margin + halfW + 8, right: ctx.margin },
    headStyles:         { ...TH, fillColor: P.scoreMed as any },
    bodyStyles:         { ...TB, fontSize: 8.5 },   // was 8 → 8.5
    alternateRowStyles: { fillColor: P.bg as any },
    theme:              'grid',
    styles:             TS,
    columnStyles: {
      0: { fontStyle: 'bold', textColor: P.textPrimary as any },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(cell: any) {
      if (cell.column.index === 1 && cell.section === 'body') {
        const positive = resultRows[cell.row.index]?.[2];
        cell.cell.styles.textColor = positive ? P.accentGreen : P.accentRed;
        cell.cell.styles.fontSize = 9;   // delta column slightly bigger
      }
    },
  });

  ctx.y = Math.max(paramsBottom, (ctx.doc as any).lastAutoTable.finalY) + L.SUBSEC_SP;

  // Model note
  needsPage(ctx, 22);
  setFont(ctx.doc, 7, 'italic', P.accentBlue);    // was 6.5 → 7
  const noteLines = ctx.doc.splitTextToSize(`[i]  ${T.simulationNote}`, contentW - 10);
  const noteH     = noteLines.length * 5 + 10;
  ctx.doc.setFillColor(...P.accentBluePale);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, noteH, L.SMALL_R, L.SMALL_R, 'F');
  ctx.doc.setDrawColor(...P.accentBlue);
  ctx.doc.setLineWidth(0.2);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, noteH, L.SMALL_R, L.SMALL_R, 'S');
  ctx.doc.text(noteLines, ctx.margin + 4, ctx.y + 7);
  ctx.y += noteH + 6;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEGAL DISCLAIMER
   ═══════════════════════════════════════════════════════════════════════════ */

function renderDisclaimer(ctx: PDFCtx) {
  const contentW = ctx.W - 2 * ctx.margin;
  setFont(ctx.doc, 7, 'italic', P.textMuted);    // was 6.5 → 7
  const lines    = ctx.doc.splitTextToSize(T.legalText, contentW - 12);
  const boxH     = 12 + lines.length * 5 + 4;
  needsPage(ctx, boxH + 4);

  ctx.doc.setFillColor(...P.surfaceAlt);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, boxH, L.BOX_R, L.BOX_R, 'F');
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(L.THIN);
  ctx.doc.roundedRect(ctx.margin, ctx.y, contentW, boxH, L.BOX_R, L.BOX_R, 'S');
  ctx.doc.setFillColor(...P.textMuted);
  ctx.doc.roundedRect(ctx.margin, ctx.y, 2.5, boxH, 1, 1, 'F');

  setFont(ctx.doc, 8, 'bold', P.textMuted);    // was 7 → 8
  ctx.doc.text(T.legalNotice, ctx.margin + 6, ctx.y + 9);
  setFont(ctx.doc, 7, 'italic', P.textMuted);
  ctx.doc.text(lines, ctx.margin + 6, ctx.y + 16);
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateRiskPDF = async (data: RiskReportData): Promise<void> => {
  if (typeof data.globalRiskIndex !== 'number' || data.globalRiskIndex < 0 || data.globalRiskIndex > 100)
    throw new Error('globalRiskIndex must be 0-100');

  let logoBase64: string | undefined;
  try { logoBase64 = await loadLogoAsBase64(); } catch { /* optional */ }

  const doc = new jsPDF('p', 'mm', 'a4');
  const W   = doc.internal.pageSize.getWidth();
  const H   = doc.internal.pageSize.getHeight();

  /* ── 1. COVER PAGE ── */
  const defaultCover = getDefaultCoverPageData('pt');
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle:       data.title || T.reportTitle,
    reportType:        T.reportTitle,
    reportPeriod:      data.period || 'Actual',
    generatedAt:       safeDate(data.generatedAt),
    isAiGenerated:     data.aiGenerated ?? true,
    requestingCompany: data.requestingCompany,
    requestedBy:       data.requestedBy,
    logoBase64,
    language:          'pt',
  };
  addCoverPageToPDF(doc, coverData);

  /* ── 2. INTERNAL PAGES ── */
  doc.addPage();
  doc.setFillColor(...P.bg);
  doc.rect(0, 0, W, H, 'F');

  const drawHeader = makeHeaderFn(doc, data, logoBase64, W);
  drawHeader();

  const ctx: PDFCtx = {
    doc,
    y:      L.HEADER_H + 8,
    W,
    H,
    margin: L.MARGIN,
    onNewPage: () => {
      drawHeader();
      ctx.y = L.HEADER_H + 8;
    },
  };

  /* ── Sections ── */
  renderGlobalRiskPanel(ctx, data);
  renderRiskMatrix(ctx, data);
  renderGeopoliticalForecasts(ctx, data);
  renderActiveAlerts(ctx, data);
  renderCountryRisk(ctx, data);
  renderSimulation(ctx, data);
  renderDisclaimer(ctx);

  /* ── 3. FOOTERS ── */
  addFooters(doc, W, H, data.period || '', 2);

  /* ── 4. SAVE ── */
  const dateStr = safeDate(data.generatedAt).toISOString().split('T')[0];
  doc.save(`AlphaData_Risco_Geopolitico_${dateStr}.pdf`);
};