/**
 * Report generation — DARK THEME + PORTUGUESE ONLY
 * All reports use dark backgrounds matching the platform design system.
 * All text is in European Portuguese.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import {
  addCoverPageToPDF,
  getDefaultCoverPageData,
  getCoverPageExcelRows,
  CoverPageData,
} from './reportCoverPage';
import { DocumentLanguageCode } from '@/i18n';
import { loadLogoAsBase64 } from './loadLogoForPDF';

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ReportData {
  title: string;
  type: string;
  period: string;
  summary?: string;
  content: any;
  highlights?: Array<{ title: string; value: string; trend?: string }>;
  generatedAt: Date;
  aiGenerated: boolean;
  requestingCompany?: { name: string; nif?: string; sector?: string; country?: string };
  requestedBy?: { name: string; role?: string; email?: string };
  language?: DocumentLanguageCode;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTERNAL TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

type RGB = [number, number, number];

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'numbered' | 'blank';
  text: string;
  indent: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DARK THEME DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  pageBg:      [10,  14,  26]  as RGB,  // #0A0E1A
  surface:     [13,  17,  23]  as RGB,  // #0D1117
  border:      [30,  42,  58]  as RGB,  // #1E2A3A
  accentBlue:  [0,   163, 255] as RGB,  // #00A3FF
  accentAmber: [245, 166, 35]  as RGB,  // #F5A623
  accentGreen: [0,   212, 170] as RGB,  // #00D4AA
  accentRed:   [255, 59,  48]  as RGB,  // #FF3B30
  textPrimary: [232, 237, 245] as RGB,  // #E8EDF5
  textSecondary:[107, 122, 153] as RGB, // #6B7A99
  textMuted:   [61,  79,  107] as RGB,  // #3D4F6B
  white:       [255, 255, 255] as RGB,
  brand:       [220, 38,  38]  as RGB,  // #DC2626
  // Chart palette
  c0: [0,   163, 255] as RGB,
  c1: [0,   212, 170] as RGB,
  c2: [245, 166, 35]  as RGB,
  c3: [255, 59,  48]  as RGB,
  c4: [139, 92,  246] as RGB,
  c5: [236, 72,  153] as RGB,
  c6: [59,  130, 246] as RGB,
  c7: [234, 179, 8]   as RGB,
} as const;

const CHART_PALETTE: RGB[] = [C.c0, C.c1, C.c2, C.c3, C.c4, C.c5, C.c6, C.c7];

const L = {
  MARGIN:     20,
  HEADER_H:   40,
  FOOTER_H:   22,
  SECTION_SP: 16,
  SUBSEC_SP:  10,
  LINE_SP:    6,
  BOX_R:      4,
  SMALL_R:    2,
  THIN:       0.3,
  THICK:      2,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   PORTUGUESE-ONLY LABELS
   ═══════════════════════════════════════════════════════════════════════════ */

const PT = {
  executiveSummary: 'Resumo Executivo',
  mainHighlights: 'Pontos-Chave',
  visualAnalysis: 'Analise Visual',
  productionByOperator: 'Producao por Operador',
  marketShareProduction: 'Quota de Mercado (Producao)',
  priceEvolution: 'Evolucao de Precos (USD/bbl)',
  pricesByType: 'Precos por Tipo de Crude (USD/bbl)',
  exportsByDestination: 'Exportacoes por Destino',
  productionData: 'Dados de Producao',
  priceTable: 'Tabela de Precos',
  exportTable: 'Tabela de Exportacoes',
  operator: 'Operador',
  block: 'Bloco',
  field: 'Campo',
  status: 'Status',
  productionBpd: 'Producao (bpd)',
  crudeType: 'Tipo de Crude',
  priceUsd: 'Preco (USD)',
  variation: 'Variacao',
  date: 'Data',
  destination: 'Destino',
  volume: 'Volume',
  tanker: 'Tanque',
  price: 'Preco',
  generatedAt: 'Gerado em',
  aiGenerated: 'Gerado com IA',
  report: 'Relatorio',
  footerText: 'AlphaData - Inteligencia de Mercado Petrolifero Angolano',
  confidential: 'CONFIDENCIAL',
  page: 'Pagina',
  of: 'de',
  disclaimer: 'AVISO LEGAL: Este relatorio foi gerado pela AlphaData - Inteligencia de Mercado Petrolifero Angolano. As informacoes aqui contidas sao para fins informativos e nao constituem aconselhamento financeiro ou de investimento.',
  notAvailable: 'N/D',
  period: 'Periodo',
  // Type names
  typeProduction: 'Producao',
  typeMarket: 'Mercado',
  typeExports: 'Exportacoes',
  typeRisk: 'Risco',
  typePredictions: 'Previsoes',
  typeGeneral: 'Geral',
  typeReport: 'Relatorio',
};

/* ═══════════════════════════════════════════════════════════════════════════
   MARKDOWN → PLAIN-TEXT BLOCK PARSER
   ═══════════════════════════════════════════════════════════════════════════ */

function stripInline(raw: string): string {
  return raw
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .trim();
}

function parseMarkdown(raw: string): Block[] {
  if (!raw) return [];
  const blocks: Block[] = [];

  for (const line of raw.split('\n')) {
    const t = line.trimEnd();
    if (!t.trim()) { blocks.push({ kind: 'blank', text: '', indent: 0 }); continue; }

    const h3m = t.match(/^###\s+(.*)/);
    if (h3m) { blocks.push({ kind: 'h3', text: stripInline(h3m[1]), indent: 0 }); continue; }
    const h2m = t.match(/^##\s+(.*)/);
    if (h2m) { blocks.push({ kind: 'h2', text: stripInline(h2m[1]), indent: 0 }); continue; }
    const h1m = t.match(/^#\s+(.*)/);
    if (h1m) { blocks.push({ kind: 'h1', text: stripInline(h1m[1]), indent: 0 }); continue; }

    if (/^={3,}$/.test(t.trim()) && blocks.length > 0) { blocks[blocks.length - 1].kind = 'h1'; continue; }
    if (/^-{3,}$/.test(t.trim()) && blocks.length > 0) { blocks[blocks.length - 1].kind = 'h2'; continue; }

    const boldNumHeading = t.match(/^\*{0,2}(\d+)\.\s+([^*]+?):?\*{0,2}$/);
    if (boldNumHeading && t.startsWith('**')) {
      blocks.push({ kind: 'h3', text: `${boldNumHeading[1]}. ${stripInline(boldNumHeading[2])}`, indent: 0 });
      continue;
    }

    const subDash = t.match(/^(\s*)-\s+-\s+(.*)/);
    if (subDash) { blocks.push({ kind: 'bullet', text: stripInline(subDash[2]), indent: 2 }); continue; }

    const starBullet = t.match(/^(\s*)\*\s+(.*)/);
    if (starBullet) {
      blocks.push({ kind: 'bullet', text: stripInline(starBullet[2]), indent: Math.floor(starBullet[1].length / 2) + 1 });
      continue;
    }

    const dashBullet = t.match(/^(\s*)-\s+(.*)/);
    if (dashBullet) {
      blocks.push({ kind: 'bullet', text: stripInline(dashBullet[2]), indent: Math.floor(dashBullet[1].length / 2) + 1 });
      continue;
    }

    const numbered = t.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numbered) {
      blocks.push({ kind: 'numbered', text: `${numbered[2]}. ${stripInline(numbered[3])}`, indent: Math.floor(numbered[1].length / 2) + 1 });
      continue;
    }

    blocks.push({ kind: 'paragraph', text: stripInline(t), indent: 0 });
  }

  while (blocks.length > 0 && blocks[0].kind === 'blank') blocks.shift();
  while (blocks.length > 0 && blocks[blocks.length - 1].kind === 'blank') blocks.pop();
  return blocks;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PDF CONTEXT HELPERS
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
    // Dark bg on new page
    ctx.doc.setFillColor(...C.pageBg);
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

function textLines(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW);
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK RENDERER — dark theme
   ═══════════════════════════════════════════════════════════════════════════ */

function renderBlocks(ctx: PDFCtx, blocks: Block[]) {
  const contentW = ctx.W - 2 * ctx.margin;
  let prevKind: Block['kind'] | null = null;

  for (const block of blocks) {
    if (block.kind === 'blank') {
      if (prevKind && prevKind !== 'blank') ctx.y += 3;
      prevKind = 'blank';
      continue;
    }

    if (block.kind === 'h1' || block.kind === 'h2' || block.kind === 'h3') {
      const sizes = { h1: 16, h2: 13, h3: 11 };
      const sz = sizes[block.kind];
      needsPage(ctx, 22);
      if (prevKind && prevKind !== 'blank') ctx.y += L.SUBSEC_SP;

      if (block.kind === 'h2') {
        ctx.doc.setFillColor(...C.accentBlue);
        ctx.doc.roundedRect(ctx.margin, ctx.y, 2, 12, 1, 1, 'F');
      }

      setFont(ctx.doc, sz, 'bold', C.textPrimary);
      const lines = textLines(ctx.doc, block.text, contentW - (block.kind === 'h2' ? 8 : 0));
      const xOff = block.kind === 'h2' ? ctx.margin + 8 : ctx.margin;
      for (const ln of lines) {
        needsPage(ctx, L.LINE_SP + 3);
        ctx.doc.text(ln, xOff, ctx.y);
        ctx.y += L.LINE_SP + 2;
      }
      ctx.y += 3;
      prevKind = block.kind;
      continue;
    }

    if (block.kind === 'bullet') {
      setFont(ctx.doc, 10, 'normal', C.textSecondary);
      const indentX = ctx.margin + block.indent * 8;
      const textW = contentW - block.indent * 8 - 7;
      const lines = textLines(ctx.doc, block.text, textW);
      for (let i = 0; i < lines.length; i++) {
        needsPage(ctx, L.LINE_SP);
        if (i === 0) {
          ctx.doc.setFillColor(...C.accentBlue);
          ctx.doc.circle(indentX + 1.5, ctx.y - 1.8, 1.2, 'F');
        }
        ctx.doc.text(lines[i], indentX + 6, ctx.y);
        ctx.y += L.LINE_SP;
      }
      prevKind = 'bullet';
      continue;
    }

    if (block.kind === 'numbered') {
      setFont(ctx.doc, 10, 'normal', C.textSecondary);
      const indentX = ctx.margin + block.indent * 8;
      const textW = contentW - block.indent * 8;
      const lines = textLines(ctx.doc, block.text, textW);
      for (const ln of lines) {
        needsPage(ctx, L.LINE_SP);
        ctx.doc.text(ln, indentX, ctx.y);
        ctx.y += L.LINE_SP;
      }
      prevKind = 'numbered';
      continue;
    }

    // paragraph
    setFont(ctx.doc, 10, 'normal', C.textSecondary);
    const lines = textLines(ctx.doc, block.text, contentW);
    for (const ln of lines) {
      needsPage(ctx, L.LINE_SP);
      ctx.doc.text(ln, ctx.margin, ctx.y);
      ctx.y += L.LINE_SP;
    }
    prevKind = 'paragraph';
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DYNAMIC CHART RENDERERS — dark theme
   ═══════════════════════════════════════════════════════════════════════════ */

function drawHBarChart(ctx: PDFCtx, title: string, items: { label: string; value: number }[], unit: string = '', maxBars: number = 8): void {
  if (items.length === 0) return;
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const maxVal = sorted[0].value;

  const labelW = 52;
  const valueW = 20;
  const barAreaW = ctx.W - 2 * ctx.margin - labelW - valueW - 4;
  const barH = 10;
  const barGap = 5;
  const totalH = sorted.length * (barH + barGap) + 16;

  needsPage(ctx, totalH + 18);

  setFont(ctx.doc, 10, 'bold', C.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  // Dark surface panel
  ctx.doc.setFillColor(...C.surface);
  ctx.doc.roundedRect(ctx.margin, ctx.y - 2, ctx.W - 2 * ctx.margin, totalH, L.BOX_R, L.BOX_R, 'F');

  sorted.forEach((item, i) => {
    const rowY = ctx.y + i * (barH + barGap);
    const ratio = maxVal > 0 ? item.value / maxVal : 0;
    const barW = Math.max(ratio * barAreaW, 2);
    const color = CHART_PALETTE[i % CHART_PALETTE.length];

    setFont(ctx.doc, 7.5, 'normal', C.textSecondary);
    const label = (item.label || '').length > 14 ? item.label.substring(0, 13) + '...' : item.label;
    ctx.doc.text(label, ctx.margin + 3, rowY + barH - 1);

    ctx.doc.setFillColor(...color);
    ctx.doc.roundedRect(ctx.margin + labelW, rowY, barW, barH, L.SMALL_R, L.SMALL_R, 'F');

    setFont(ctx.doc, 7, 'bold', C.textPrimary);
    const formatted = item.value >= 1_000_000 ? `${(item.value / 1_000_000).toFixed(1)}M` : item.value >= 1_000 ? `${(item.value / 1_000).toFixed(0)}K` : `${item.value.toFixed(0)}`;
    ctx.doc.text(`${formatted}${unit ? ' ' + unit : ''}`, ctx.margin + labelW + barW + 3, rowY + barH - 1);
  });

  ctx.y += totalH + 8;
}

function drawDonutChart(ctx: PDFCtx, title: string, items: { label: string; value: number }[], unit: string = ''): void {
  if (items.length === 0) return;
  const top = [...items].sort((a, b) => b.value - a.value).slice(0, 7);
  const total = top.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  const r = 26;
  const legendLineH = 8;
  const legendH = top.length * legendLineH + 6;
  const totalH = r * 2 + legendH + 20;

  needsPage(ctx, totalH + 18);

  setFont(ctx.doc, 10, 'bold', C.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  const cx = ctx.margin + r + 5;
  const cy = ctx.y + r;

  let startAngle = -Math.PI / 2;
  top.forEach((item, i) => {
    const slice = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + slice;
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    ctx.doc.setFillColor(...color);
    const steps = Math.max(6, Math.floor(slice * 14));
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (s / steps) * slice;
      const a2 = startAngle + ((s + 1) / steps) * slice;
      ctx.doc.triangle(cx, cy, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, 'F');
    }
    startAngle = endAngle;
  });

  // Inner dark circle (donut)
  ctx.doc.setFillColor(...C.pageBg);
  ctx.doc.circle(cx, cy, r * 0.54, 'F');

  const centerFmt = total >= 1_000_000 ? `${(total / 1_000_000).toFixed(1)}M` : total >= 1_000 ? `${(total / 1_000).toFixed(0)}K` : `${total.toFixed(0)}`;
  setFont(ctx.doc, 9, 'bold', C.textPrimary);
  ctx.doc.text(centerFmt, cx, cy + 1.5, { align: 'center' });
  if (unit) {
    setFont(ctx.doc, 6, 'normal', C.textMuted);
    ctx.doc.text(unit, cx, cy + 7, { align: 'center' });
  }

  const legendX = cx + r + 8;
  let legendY = ctx.y + 4;
  top.forEach((item, i) => {
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    const pct = ((item.value / total) * 100).toFixed(1);
    ctx.doc.setFillColor(...color);
    ctx.doc.roundedRect(legendX, legendY - 3, 5, 5, 0.5, 0.5, 'F');
    setFont(ctx.doc, 7, 'normal', C.textSecondary);
    const lbl = item.label.length > 18 ? item.label.substring(0, 17) + '...' : item.label;
    ctx.doc.text(`${lbl}  ${pct}%`, legendX + 7, legendY + 1);
    legendY += legendLineH;
  });

  ctx.y = cy + r + legendH + 8;
}

function drawLineChart(ctx: PDFCtx, title: string, series: Array<{ name: string; points: { label: string; value: number }[]; color?: RGB }>): void {
  if (series.length === 0 || series[0].points.length === 0) return;

  const chartH = 48;
  const chartW = ctx.W - 2 * ctx.margin;
  needsPage(ctx, chartH + 28);

  setFont(ctx.doc, 10, 'bold', C.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 8;

  // Dark surface
  ctx.doc.setFillColor(...C.surface);
  ctx.doc.roundedRect(ctx.margin, ctx.y, chartW, chartH, L.BOX_R, L.BOX_R, 'F');

  const allVals = series.flatMap(s => s.points.map(p => p.value));
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const padX = 6;
  const padY = 8;
  const plotW = chartW - 2 * padX;
  const plotH = chartH - 2 * padY;

  ctx.doc.setDrawColor(...C.border);
  ctx.doc.setLineWidth(0.2);
  for (let g = 0; g <= 3; g++) {
    const gy = ctx.y + padY + (g / 3) * plotH;
    ctx.doc.line(ctx.margin + padX, gy, ctx.margin + padX + plotW, gy);
    const labelVal = maxV - (g / 3) * range;
    setFont(ctx.doc, 5.5, 'normal', C.textMuted);
    ctx.doc.text(labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}K` : `${labelVal.toFixed(0)}`, ctx.margin, gy + 1.5);
  }

  series.forEach((s, si) => {
    const color = s.color || CHART_PALETTE[si % CHART_PALETTE.length];
    const pts = s.points;
    if (pts.length < 2) return;
    ctx.doc.setDrawColor(...color);
    ctx.doc.setLineWidth(1.2);
    const toXY = (i: number) => ({
      x: ctx.margin + padX + (i / (pts.length - 1)) * plotW,
      y: ctx.y + padY + (1 - (pts[i].value - minV) / range) * plotH,
    });
    for (let i = 0; i < pts.length - 1; i++) {
      const { x: x1, y: y1 } = toXY(i);
      const { x: x2, y: y2 } = toXY(i + 1);
      ctx.doc.line(x1, y1, x2, y2);
    }
    ctx.doc.setFillColor(...color);
    for (let i = 0; i < pts.length; i++) {
      const { x, y } = toXY(i);
      ctx.doc.circle(x, y, 1.2, 'F');
    }
  });

  const step = Math.max(1, Math.ceil(series[0].points.length / 8));
  setFont(ctx.doc, 5.5, 'normal', C.textMuted);
  for (let i = 0; i < series[0].points.length; i += step) {
    const xp = ctx.margin + padX + (i / (series[0].points.length - 1)) * plotW;
    ctx.doc.text(series[0].points[i].label, xp, ctx.y + chartH + 4, { align: 'center' });
  }

  if (series.length > 1) {
    let lx = ctx.margin;
    series.forEach((s, i) => {
      const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
      ctx.doc.setFillColor(...color);
      ctx.doc.roundedRect(lx, ctx.y + chartH + 7, 5, 4, 0.5, 0.5, 'F');
      setFont(ctx.doc, 6, 'normal', C.textSecondary);
      ctx.doc.text(s.name, lx + 7, ctx.y + chartH + 10.5);
      lx += ctx.doc.getTextWidth(s.name) + 16;
    });
  }

  ctx.y += chartH + 16;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA EXTRACTORS
   ═══════════════════════════════════════════════════════════════════════════ */

function extractProduction(content: any): { label: string; value: number }[] {
  const arr: any[] = content?.data?.production || content?.production || [];
  return arr.filter(r => r && (r.daily_production || r.production || r.value)).map(r => ({
    label: r.operator || r.company || r.name || r.label || 'N/D',
    value: Number(r.daily_production ?? r.production ?? r.value ?? 0),
  }));
}

function extractPrices(content: any): { label: string; value: number }[] {
  const arr: any[] = content?.data?.prices || content?.prices || [];
  return arr.filter(r => r && r.price).map(r => ({
    label: r.crude_type || r.type || r.name || r.label || 'N/D',
    value: Number(r.price ?? 0),
  }));
}

function extractExports(content: any): { label: string; value: number }[] {
  const arr: any[] = content?.data?.exports || content?.exports || [];
  return arr.filter(r => r && (r.volume || r.value)).map(r => ({
    label: r.destination || r.country || r.label || 'N/D',
    value: Number(r.volume ?? r.value ?? 0),
  }));
}

function extractTimeSeries(content: any, valueKey: string, labelKey: string, dateKey: string) {
  const arr: any[] = content?.data?.[labelKey] || content?.[labelKey] || [];
  return arr
    .filter(r => r && r[dateKey] && r[valueKey] != null)
    .sort((a, b) => new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime())
    .map(r => ({
      label: new Date(r[dateKey]).toLocaleDateString('pt-AO', { month: 'short', day: '2-digit' }),
      value: Number(r[valueKey]),
    }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   DARK THEME HEADER / FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

function makeHeaderFn(doc: jsPDF, data: ReportData, logoBase64: string | undefined, pageWidth: number): () => void {
  return function drawHeader() {
    // Dark header bar
    doc.setFillColor(...C.surface);
    doc.rect(0, 0, pageWidth, L.HEADER_H, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(L.THIN);
    doc.line(0, L.HEADER_H, pageWidth, L.HEADER_H);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', L.MARGIN, 8, 10, 10);
        setFont(doc, 14, 'bold', C.textPrimary);
        doc.text('ALPHADATA', L.MARGIN + 13, 16);
      } catch {
        setFont(doc, 14, 'bold', C.textPrimary);
        doc.text('ALPHADATA', L.MARGIN, 16);
      }
    } else {
      setFont(doc, 14, 'bold', C.textPrimary);
      doc.text('ALPHADATA', L.MARGIN, 16);
    }

    // Report title center
    setFont(doc, 8, 'normal', C.textSecondary);
    const titleStr = (data.title || PT.report).substring(0, 60);
    doc.text(titleStr, pageWidth / 2, 16, { align: 'center' });

    // Date right
    const d = safeDate(data.generatedAt);
    setFont(doc, 7, 'normal', C.textMuted);
    doc.text(
      `${PT.generatedAt}: ${d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - L.MARGIN,
      16,
      { align: 'right' }
    );

    if (data.aiGenerated) {
      doc.setFillColor(...C.accentBlue);
      doc.roundedRect(pageWidth - L.MARGIN - 36, 24, 32, 8, 2, 2, 'F');
      setFont(doc, 6, 'bold', C.white);
      doc.text(PT.aiGenerated, pageWidth - L.MARGIN - 32, 29.5);
    }
  };
}

function addFooters(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.surface);
    doc.rect(0, pageHeight - L.FOOTER_H, pageWidth, L.FOOTER_H, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(L.THIN);
    doc.line(0, pageHeight - L.FOOTER_H, pageWidth, pageHeight - L.FOOTER_H);

    setFont(doc, 7, 'normal', C.textMuted);
    doc.text(PT.footerText, L.MARGIN, pageHeight - 8);
    doc.text(`${PT.page} ${i} ${PT.of} ${total}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(PT.confidential, pageWidth - L.MARGIN, pageHeight - 8, { align: 'right' });
  }
}

function sectionTitle(ctx: PDFCtx, title: string) {
  needsPage(ctx, 24);
  ctx.doc.setFillColor(...C.accentBlue);
  ctx.doc.roundedRect(ctx.margin, ctx.y, 2, 13, 1, 1, 'F');
  setFont(ctx.doc, 13, 'bold', C.textPrimary);
  ctx.doc.text(title, ctx.margin + 8, ctx.y + 9.5);
  ctx.y += 20;
}

function safeDate(d: any): Date {
  const parsed = d instanceof Date ? d : new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getTypeName(type: string): string {
  const map: Record<string, string> = {
    production: PT.typeProduction,
    market: PT.typeMarket,
    exports: PT.typeExports,
    risk: PT.typeRisk,
    predictions: PT.typePredictions,
    general: PT.typeGeneral,
  };
  return map[type] || type || PT.typeReport;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PDF GENERATOR — DARK THEME
   ═══════════════════════════════════════════════════════════════════════════ */

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  let logoBase64: string | undefined;
  try { logoBase64 = await loadLogoAsBase64(); } catch { /* optional */ }

  // Force Portuguese
  const lang: DocumentLanguageCode = 'pt';

  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = L.MARGIN;

  // ── Cover page ──
  const defaultCover = getDefaultCoverPageData(lang);
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle: data.title || `${PT.report} AlphaData`,
    reportType: getTypeName(data.type),
    reportPeriod: data.period || 'Actual',
    generatedAt: safeDate(data.generatedAt),
    isAiGenerated: data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
    logoBase64,
    language: lang,
  };
  addCoverPageToPDF(doc, coverData);
  doc.addPage();

  // ── Dark background for content page ──
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, W, H, 'F');

  // ── Setup context ──
  const drawHeader = makeHeaderFn(doc, data, logoBase64, W);
  drawHeader();

  const ctx: PDFCtx = {
    doc,
    y: L.HEADER_H + 8,
    W,
    H,
    margin,
    onNewPage: () => { drawHeader(); ctx.y = L.HEADER_H + 8; },
  };

  const contentW = W - 2 * margin;

  // ── Executive Summary ──
  if (data.summary) {
    sectionTitle(ctx, PT.executiveSummary);
    const blocks = parseMarkdown(data.summary);
    renderBlocks(ctx, blocks);
    ctx.y += L.SECTION_SP;
  }

  // ── Highlights (dark card grid) ──
  if (data.highlights && data.highlights.length > 0) {
    sectionTitle(ctx, PT.mainHighlights);
    const cardW = (contentW - 8) / 2;
    const cardH = 30;
    data.highlights.forEach((h, idx) => {
      const isLeft = idx % 2 === 0;
      if (isLeft) needsPage(ctx, cardH + 8);
      const cx = isLeft ? margin : margin + cardW + 8;
      const cy = isLeft ? ctx.y : ctx.y;

      // Dark card
      ctx.doc.setFillColor(...C.surface);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'F');
      ctx.doc.setDrawColor(...C.border);
      ctx.doc.setLineWidth(0.3);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'S');

      // Left accent bar
      const accentColor = h.trend === 'up' ? C.accentGreen : h.trend === 'down' ? C.accentRed : C.accentBlue;
      ctx.doc.setFillColor(...accentColor);
      ctx.doc.roundedRect(cx, cy, 2.5, cardH, 1, 1, 'F');

      // Label
      setFont(ctx.doc, 7.5, 'normal', C.textSecondary);
      ctx.doc.text(h.title, cx + 8, cy + 10);

      // Value
      setFont(ctx.doc, 14, 'bold', C.textPrimary);
      ctx.doc.text(h.value, cx + 8, cy + 22);

      // Trend
      if (h.trend) {
        const tColor = h.trend === 'up' ? C.accentGreen : h.trend === 'down' ? C.accentRed : C.textMuted;
        const arrow = h.trend === 'up' ? '+' : h.trend === 'down' ? '-' : '=';
        setFont(ctx.doc, 8, 'bold', tColor);
        ctx.doc.text(arrow, cx + cardW - 14, cy + 16);
      }

      if (!isLeft || idx === data.highlights!.length - 1) {
        ctx.y += cardH + 6;
      }
    });
    ctx.y += L.SUBSEC_SP;
  }

  // ── Dynamic Charts ──
  const prodData = extractProduction(data.content);
  const priceData = extractPrices(data.content);
  const exportData = extractExports(data.content);
  const priceSeries = extractTimeSeries(data.content, 'price', 'prices', 'data_date');

  const hasCharts = prodData.length > 0 || priceData.length > 0 || exportData.length > 0 || priceSeries.length > 1;

  if (hasCharts) {
    sectionTitle(ctx, PT.visualAnalysis);

    if (prodData.length > 0) {
      drawHBarChart(ctx, PT.productionByOperator, prodData, 'bpd', 8);
      ctx.y += 4;
      if (prodData.length >= 3) {
        drawDonutChart(ctx, PT.marketShareProduction, prodData, 'bpd');
        ctx.y += 4;
      }
    }

    if (priceSeries.length > 1) {
      drawLineChart(ctx, PT.priceEvolution, [
        { name: PT.price, points: priceSeries, color: C.accentBlue },
      ]);
    } else if (priceData.length > 0) {
      drawHBarChart(ctx, PT.pricesByType, priceData, 'USD', 8);
    }

    if (exportData.length > 0) {
      drawHBarChart(ctx, PT.exportsByDestination, exportData, 'bbl', 8);
    }

    ctx.y += L.SECTION_SP;
  }

  // ── Data Tables (dark themed) ──
  if (data.content?.data) {
    const cd = data.content.data;

    if (Array.isArray(cd.production) && cd.production.length > 0) {
      sectionTitle(ctx, PT.productionData);
      const rows = cd.production.slice(0, 20).map((r: any) => [
        r.operator || r.company || '-',
        r.block || '-',
        r.field || '-',
        r.daily_production ? `${(r.daily_production / 1000).toFixed(0)}K bpd` : '-',
        r.status || '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[PT.operator, PT.block, PT.field, PT.productionBpd, PT.status]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.accentBlue as any, textColor: C.white as any, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
        bodyStyles: { fontSize: 8, textColor: C.textSecondary as any, cellPadding: 4, fillColor: C.surface as any },
        alternateRowStyles: { fillColor: C.pageBg as any },
        theme: 'grid',
        styles: { lineColor: C.border as any, lineWidth: 0.25, font: 'helvetica' },
        columnStyles: { 3: { halign: 'right', fontStyle: 'bold', textColor: C.textPrimary as any } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    if (Array.isArray(cd.prices) && cd.prices.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, PT.priceTable);
      const rows = cd.prices.slice(0, 12).map((r: any) => [
        r.crude_type || r.type || '-',
        r.price != null ? `$${Number(r.price).toFixed(2)}` : '-',
        r.change_percent != null ? `${r.change_percent >= 0 ? '+' : ''}${Number(r.change_percent).toFixed(2)}%` : '-',
        r.data_date ? new Date(r.data_date).toLocaleDateString('pt-AO') : '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[PT.crudeType, PT.priceUsd, PT.variation, PT.date]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.accentBlue as any, textColor: C.white as any, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
        bodyStyles: { fontSize: 8, textColor: C.textSecondary as any, cellPadding: 4, fillColor: C.surface as any },
        alternateRowStyles: { fillColor: C.pageBg as any },
        theme: 'grid',
        styles: { lineColor: C.border as any, lineWidth: 0.25, font: 'helvetica' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold', textColor: C.textPrimary as any }, 2: { halign: 'right' } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    if (Array.isArray(cd.exports) && cd.exports.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, PT.exportTable);
      const rows = cd.exports.slice(0, 12).map((r: any) => [
        r.destination || r.country || '-',
        r.volume != null ? `${(Number(r.volume) / 1_000_000).toFixed(2)}M bbl` : '-',
        r.tanker_name || '-',
        r.status || '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[PT.destination, PT.volume, PT.tanker, PT.status]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.accentBlue as any, textColor: C.white as any, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
        bodyStyles: { fontSize: 8, textColor: C.textSecondary as any, cellPadding: 4, fillColor: C.surface as any },
        alternateRowStyles: { fillColor: C.pageBg as any },
        theme: 'grid',
        styles: { lineColor: C.border as any, lineWidth: 0.25, font: 'helvetica' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold', textColor: C.textPrimary as any } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }
  }

  // ── Disclaimer ──
  needsPage(ctx, 36);
  ctx.doc.setFillColor(...C.surface);
  ctx.doc.roundedRect(margin, ctx.y, contentW, 32, L.BOX_R, L.BOX_R, 'F');
  setFont(ctx.doc, 6.5, 'italic', C.textMuted);
  const dLines = ctx.doc.splitTextToSize(PT.disclaimer, contentW - 10);
  ctx.doc.text(dLines, margin + 5, ctx.y + 8);

  // ── Footers (all pages) ──
  addFooters(doc, W, H);

  const fileName = `AlphaData_${getTypeName(data.type)}_${(data.period || new Date().toISOString().split('T')[0]).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOCX GENERATOR — Portuguese only
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  const children: any[] = [];

  children.push(
    new Paragraph({
      text: data.title || `${PT.report} AlphaData`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${PT.period}: ${data.period || PT.notAvailable}   |   `, color: '64748B', size: 20 }),
        new TextRun({ text: `${PT.generatedAt}: ${safeDate(data.generatedAt).toLocaleDateString('pt-AO')}`, color: '64748B', size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  if (data.summary) {
    children.push(new Paragraph({ text: PT.executiveSummary, heading: HeadingLevel.HEADING_1 }));
    const blocks = parseMarkdown(data.summary);
    for (const block of blocks) {
      if (block.kind === 'blank') continue;
      if (block.kind === 'h1') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_1 }));
      else if (block.kind === 'h2') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2 }));
      else if (block.kind === 'h3') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_3 }));
      else if (block.kind === 'bullet') children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], bullet: { level: block.indent - 1 } }));
      else if (block.kind === 'numbered') children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], numbering: { reference: 'default-numbering', level: 0 } }));
      else children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], spacing: { after: 120 } }));
    }
  }

  const cd = data.content?.data;
  if (cd?.production && Array.isArray(cd.production) && cd.production.length > 0) {
    children.push(new Paragraph({ text: PT.productionData, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
    const headerRow = new TableRow({
      children: [PT.operator, PT.block, PT.field, PT.productionBpd, PT.status].map(h =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })] })], shading: { fill: '0A0E1A' } })
      ),
    });
    const dataRows = cd.production.slice(0, 20).map((r: any) =>
      new TableRow({
        children: [r.operator || '-', r.block || '-', r.field || '-', r.daily_production ? `${(r.daily_production / 1000).toFixed(0)}K` : '-', r.status || '-'].map(val =>
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 18 })] })] })
        ),
      })
    );
    children.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AlphaData_${getTypeName(data.type)}_${(data.period || 'relatorio').replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXCEL GENERATOR — Portuguese only
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateExcelReport = (data: ReportData): void => {
  const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const defaultCover = getDefaultCoverPageData('pt');
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle: data.title || `${PT.report} AlphaData`,
    reportType: getTypeName(data.type),
    reportPeriod: data.period || 'Actual',
    generatedAt: safeDate(data.generatedAt),
    isAiGenerated: data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
    language: 'pt',
  };

  const coverRows = getCoverPageExcelRows(coverData);
  const dataRows: string[] = [];
  const cd = data.content?.data;

  if (cd?.production && Array.isArray(cd.production)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.operator)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.block)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.field)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.productionBpd)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.status)}</Data></Cell></Row>`);
    cd.production.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.operator||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.block||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.field||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.daily_production||0}</Data></Cell><Cell><Data ss:Type="String">${esc(r.status||'-')}</Data></Cell></Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.prices && Array.isArray(cd.prices)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.crudeType)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.priceUsd)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.variation)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.date)}</Data></Cell></Row>`);
    cd.prices.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.crude_type||r.type||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.price||0}</Data></Cell><Cell><Data ss:Type="Number">${r.change_percent||0}</Data></Cell><Cell><Data ss:Type="String">${r.data_date ? new Date(r.data_date).toLocaleDateString('pt-AO') : '-'}</Data></Cell></Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.exports && Array.isArray(cd.exports)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.destination)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.volume)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.tanker)}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(PT.status)}</Data></Cell></Row>`);
    cd.exports.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.destination||r.country||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.volume||0}</Data></Cell><Cell><Data ss:Type="String">${esc(r.tanker_name||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.status||'-')}</Data></Cell></Row>`);
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="brand"><Font ss:Bold="1" ss:Size="18" ss:Color="#00A3FF"/><Interior ss:Color="#0A0E1A" ss:Pattern="Solid"/></Style>
    <Style ss:ID="subheader"><Font ss:Bold="1" ss:Size="11" ss:Color="#E8EDF5"/><Interior ss:Color="#0D1117" ss:Pattern="Solid"/></Style>
    <Style ss:ID="tableHeader"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/><Interior ss:Color="#00A3FF" ss:Pattern="Solid"/></Style>
    <Style ss:ID="bold"><Font ss:Bold="1" ss:Color="#E8EDF5"/></Style>
    <Style ss:ID="footer"><Font ss:Italic="1" ss:Size="9" ss:Color="#3D4F6B"/></Style>
  </Styles>
  <Worksheet ss:Name="Info">
    <Table>${coverRows.join('\n')}</Table>
  </Worksheet>
  <Worksheet ss:Name="Dados">
    <Table>${dataRows.join('\n')}</Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AlphaData_${getTypeName(data.type)}_${(data.period || 'relatorio').replace(/\s+/g, '_')}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════════════════════════════════ */

export const downloadReport = async (
  data: ReportData,
  format: 'pdf' | 'docx' | 'excel',
  language: DocumentLanguageCode = 'pt'
): Promise<void> => {
  // Force Portuguese for all reports regardless of language param
  const d = { ...data, language: 'pt' as DocumentLanguageCode };
  if (format === 'pdf') return generatePDFReport(d);
  if (format === 'docx') return generateDOCXReport(d);
  generateExcelReport(d);
};
