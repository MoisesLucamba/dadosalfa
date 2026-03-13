/**
 * AlphaData — Report Generation Engine
 * COVER: dark colour institutional design
 * INTERNAL PAGES: white background, full content preserved
 * FOOTER: no "Confidential" label — page number + branding + period only
 * Supports PT · EN · FR
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
import { getReportTranslation, formatDateForLang, type ReportLang } from './reportTranslations';

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
   DESIGN TOKENS
   Two palettes:
     C — cover chrome (dark, unchanged)
     P — internal pages (white background, dark ink)
   ═══════════════════════════════════════════════════════════════════════════ */

// Cover palette (dark — used only by addCoverPageToPDF)
const C = {
  pageBg:        [10,  14,  26]  as RGB,
  surface:       [13,  17,  23]  as RGB,
  border:        [30,  42,  58]  as RGB,
  accentBlue:    [0,   163, 255] as RGB,
  textPrimary:   [232, 237, 245] as RGB,
  textSecondary: [140, 158, 185] as RGB,
  textMuted:     [72,  90,  120] as RGB,
  white:         [255, 255, 255] as RGB,
  brand:         [220, 38,  38]  as RGB,
} as const;

// Internal pages palette (white background, dark ink)
const P = {
  bg:            [255, 255, 255] as RGB,   // white page
  surface:       [247, 248, 250] as RGB,   // light grey card bg
  surfaceAlt:    [240, 243, 248] as RGB,   // section title strip
  border:        [210, 218, 230] as RGB,
  accentBlue:    [0,   110, 200] as RGB,
  accentGreen:   [0,   150, 115] as RGB,
  accentRed:     [200, 30,  30]  as RGB,
  textPrimary:   [18,  24,  38]  as RGB,
  textSecondary: [55,  70,  95]  as RGB,
  textMuted:     [120, 135, 160] as RGB,
  brand:         [220, 38,  38]  as RGB,
  // Chart colours — darker shades readable on white
  c0: [0,   110, 200] as RGB,
  c1: [0,   150, 115] as RGB,
  c2: [190, 120, 20]  as RGB,
  c3: [200, 30,  30]  as RGB,
  c4: [100, 60,  200] as RGB,
  c5: [180, 50,  130] as RGB,
  c6: [40,  100, 210] as RGB,
  c7: [170, 130, 0]   as RGB,
} as const;

const PAGE_CHART_PALETTE: RGB[] = [P.c0, P.c1, P.c2, P.c3, P.c4, P.c5, P.c6, P.c7];

const L = {
  MARGIN:     20,
  HEADER_H:   38,
  FOOTER_H:   20,
  SECTION_SP: 14,
  SUBSEC_SP:  8,
  LINE_SP:    6,
  BOX_R:      3,
  SMALL_R:    2,
  THIN:       0.25,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   MARKDOWN PARSER
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
    // White background for all internal pages
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

function textLines(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(text, maxW);
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOCK RENDERER — white page palette (P)
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
      const sizes = { h1: 15, h2: 12, h3: 10.5 };
      const sz = sizes[block.kind];
      needsPage(ctx, 22);
      if (prevKind && prevKind !== 'blank') ctx.y += L.SUBSEC_SP;

      if (block.kind === 'h2') {
        ctx.doc.setFillColor(...P.accentBlue);
        ctx.doc.roundedRect(ctx.margin, ctx.y, 2, 11, 1, 1, 'F');
      }

      setFont(ctx.doc, sz, 'bold', P.textPrimary);
      const lines = textLines(ctx.doc, block.text, contentW - (block.kind === 'h2' ? 8 : 0));
      const xOff  = block.kind === 'h2' ? ctx.margin + 8 : ctx.margin;
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
      setFont(ctx.doc, 9.5, 'normal', P.textSecondary);
      const indentX = ctx.margin + block.indent * 8;
      const textW   = contentW - block.indent * 8 - 7;
      const lines   = textLines(ctx.doc, block.text, textW);
      for (let i = 0; i < lines.length; i++) {
        needsPage(ctx, L.LINE_SP);
        if (i === 0) {
          ctx.doc.setFillColor(...P.accentBlue);
          ctx.doc.circle(indentX + 1.5, ctx.y - 1.8, 1.1, 'F');
        }
        ctx.doc.text(lines[i], indentX + 6, ctx.y);
        ctx.y += L.LINE_SP;
      }
      prevKind = 'bullet';
      continue;
    }

    if (block.kind === 'numbered') {
      setFont(ctx.doc, 9.5, 'normal', P.textSecondary);
      const indentX = ctx.margin + block.indent * 8;
      const textW   = contentW - block.indent * 8;
      const lines   = textLines(ctx.doc, block.text, textW);
      for (const ln of lines) {
        needsPage(ctx, L.LINE_SP);
        ctx.doc.text(ln, indentX, ctx.y);
        ctx.y += L.LINE_SP;
      }
      prevKind = 'numbered';
      continue;
    }

    // paragraph
    setFont(ctx.doc, 9.5, 'normal', P.textSecondary);
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
   CHART RENDERERS — white page palette (P)
   ═══════════════════════════════════════════════════════════════════════════ */

function drawHBarChart(
  ctx: PDFCtx,
  title: string,
  items: { label: string; value: number }[],
  unit = '',
  maxBars = 8
): void {
  if (items.length === 0) return;
  const sorted   = [...items].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const maxVal   = sorted[0].value;
  const labelW   = 54;
  const valueW   = 22;
  const barAreaW = ctx.W - 2 * ctx.margin - labelW - valueW - 4;
  const barH     = 10;
  const barGap   = 5;
  const totalH   = sorted.length * (barH + barGap) + 16;

  needsPage(ctx, totalH + 20);

  setFont(ctx.doc, 9.5, 'bold', P.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  ctx.doc.setFillColor(...P.surface);
  ctx.doc.roundedRect(ctx.margin, ctx.y - 2, ctx.W - 2 * ctx.margin, totalH, L.BOX_R, L.BOX_R, 'F');
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(0.2);
  ctx.doc.roundedRect(ctx.margin, ctx.y - 2, ctx.W - 2 * ctx.margin, totalH, L.BOX_R, L.BOX_R, 'S');

  sorted.forEach((item, i) => {
    const rowY  = ctx.y + i * (barH + barGap);
    const ratio = maxVal > 0 ? item.value / maxVal : 0;
    const barW  = Math.max(ratio * barAreaW, 2);
    const color = PAGE_CHART_PALETTE[i % PAGE_CHART_PALETTE.length];

    setFont(ctx.doc, 7.5, 'normal', P.textSecondary);
    const label = item.label.length > 14 ? item.label.substring(0, 13) + '…' : item.label;
    ctx.doc.text(label, ctx.margin + 3, rowY + barH - 1);

    ctx.doc.setFillColor(...color);
    ctx.doc.roundedRect(ctx.margin + labelW, rowY, barW, barH, L.SMALL_R, L.SMALL_R, 'F');

    setFont(ctx.doc, 7, 'bold', P.textPrimary);
    const formatted =
      item.value >= 1_000_000 ? `${(item.value / 1_000_000).toFixed(1)}M` :
      item.value >= 1_000     ? `${(item.value / 1_000).toFixed(0)}K`     :
      `${item.value.toFixed(0)}`;
    ctx.doc.text(`${formatted}${unit ? ' ' + unit : ''}`, ctx.margin + labelW + barW + 3, rowY + barH - 1);
  });

  ctx.y += totalH + 8;
}

function drawDonutChart(
  ctx: PDFCtx,
  title: string,
  items: { label: string; value: number }[],
  unit = ''
): void {
  if (items.length === 0) return;
  const top   = [...items].sort((a, b) => b.value - a.value).slice(0, 7);
  const total = top.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  const r           = 26;
  const legendLineH = 8;
  const legendH     = top.length * legendLineH + 6;
  const totalH      = r * 2 + legendH + 20;

  needsPage(ctx, totalH + 18);

  setFont(ctx.doc, 9.5, 'bold', P.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  const cx = ctx.margin + r + 5;
  const cy = ctx.y + r;

  let startAngle = -Math.PI / 2;
  top.forEach((item, i) => {
    const slice = (item.value / total) * 2 * Math.PI;
    const color = PAGE_CHART_PALETTE[i % PAGE_CHART_PALETTE.length];
    ctx.doc.setFillColor(...color);
    const steps = Math.max(6, Math.floor(slice * 14));
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (s / steps) * slice;
      const a2 = startAngle + ((s + 1) / steps) * slice;
      ctx.doc.triangle(cx, cy, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, 'F');
    }
    startAngle += slice;
  });

  // White donut hole (matches white page bg)
  ctx.doc.setFillColor(...P.bg);
  ctx.doc.circle(cx, cy, r * 0.54, 'F');

  const centerFmt =
    total >= 1_000_000 ? `${(total / 1_000_000).toFixed(1)}M` :
    total >= 1_000     ? `${(total / 1_000).toFixed(0)}K`     :
    `${total.toFixed(0)}`;
  setFont(ctx.doc, 9, 'bold', P.textPrimary);
  ctx.doc.text(centerFmt, cx, cy + 1.5, { align: 'center' });
  if (unit) {
    setFont(ctx.doc, 6, 'normal', P.textMuted);
    ctx.doc.text(unit, cx, cy + 7, { align: 'center' });
  }

  const legendX = cx + r + 8;
  let legendY   = ctx.y + 4;
  top.forEach((item, i) => {
    const pct = ((item.value / total) * 100).toFixed(1);
    ctx.doc.setFillColor(...PAGE_CHART_PALETTE[i % PAGE_CHART_PALETTE.length]);
    ctx.doc.roundedRect(legendX, legendY - 3, 5, 5, 0.5, 0.5, 'F');
    setFont(ctx.doc, 7, 'normal', P.textSecondary);
    const lbl = item.label.length > 18 ? item.label.substring(0, 17) + '…' : item.label;
    ctx.doc.text(`${lbl}  ${pct}%`, legendX + 7, legendY + 1);
    legendY += legendLineH;
  });

  ctx.y = cy + r + legendH + 8;
}

function drawLineChart(
  ctx: PDFCtx,
  title: string,
  series: Array<{ name: string; points: { label: string; value: number }[]; color?: RGB }>
): void {
  if (series.length === 0 || series[0].points.length === 0) return;

  const chartH = 48;
  const chartW = ctx.W - 2 * ctx.margin;
  needsPage(ctx, chartH + 28);

  setFont(ctx.doc, 9.5, 'bold', P.textPrimary);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 8;

  ctx.doc.setFillColor(...P.surface);
  ctx.doc.roundedRect(ctx.margin, ctx.y, chartW, chartH, L.BOX_R, L.BOX_R, 'F');
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(0.2);
  ctx.doc.roundedRect(ctx.margin, ctx.y, chartW, chartH, L.BOX_R, L.BOX_R, 'S');

  const allVals = series.flatMap(s => s.points.map(p => p.value));
  const minV    = Math.min(...allVals);
  const maxV    = Math.max(...allVals);
  const range   = maxV - minV || 1;
  const padX    = 6;
  const padY    = 8;
  const plotW   = chartW - 2 * padX;
  const plotH   = chartH - 2 * padY;

  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(0.2);
  for (let g = 0; g <= 3; g++) {
    const gy = ctx.y + padY + (g / 3) * plotH;
    ctx.doc.line(ctx.margin + padX, gy, ctx.margin + padX + plotW, gy);
    const labelVal = maxV - (g / 3) * range;
    setFont(ctx.doc, 5.5, 'normal', P.textMuted);
    ctx.doc.text(
      labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}K` : `${labelVal.toFixed(0)}`,
      ctx.margin, gy + 1.5
    );
  }

  series.forEach((s, si) => {
    const color = s.color || PAGE_CHART_PALETTE[si % PAGE_CHART_PALETTE.length];
    const pts   = s.points;
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
  setFont(ctx.doc, 5.5, 'normal', P.textMuted);
  for (let i = 0; i < series[0].points.length; i += step) {
    const xp = ctx.margin + padX + (i / (series[0].points.length - 1)) * plotW;
    ctx.doc.text(series[0].points[i].label, xp, ctx.y + chartH + 4, { align: 'center' });
  }

  if (series.length > 1) {
    let lx = ctx.margin;
    series.forEach((s, i) => {
      const color = s.color || PAGE_CHART_PALETTE[i % PAGE_CHART_PALETTE.length];
      ctx.doc.setFillColor(...color);
      ctx.doc.roundedRect(lx, ctx.y + chartH + 7, 5, 4, 0.5, 0.5, 'F');
      setFont(ctx.doc, 6, 'normal', P.textSecondary);
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
  return arr
    .filter(r => r && (r.daily_production || r.production || r.value))
    .map(r => ({
      label: r.operator || r.company || r.name || r.label || 'N/D',
      value: Number(r.daily_production ?? r.production ?? r.value ?? 0),
    }));
}

function extractPrices(content: any): { label: string; value: number }[] {
  const arr: any[] = content?.data?.prices || content?.prices || [];
  return arr
    .filter(r => r && r.price)
    .map(r => ({
      label: r.crude_type || r.type || r.name || r.label || 'N/D',
      value: Number(r.price ?? 0),
    }));
}

function extractExports(content: any): { label: string; value: number }[] {
  const arr: any[] = content?.data?.exports || content?.exports || [];
  return arr
    .filter(r => r && (r.volume || r.value))
    .map(r => ({
      label: r.destination || r.country || r.label || 'N/D',
      value: Number(r.volume ?? r.value ?? 0),
    }));
}

function extractTimeSeries(
  content: any,
  valueKey: string,
  labelKey: string,
  dateKey: string,
  lang: ReportLang = 'pt'
) {
  const localeMap: Record<string, string> = { pt: 'pt-AO', en: 'en-GB', fr: 'fr-FR' };
  const arr: any[] = content?.data?.[labelKey] || content?.[labelKey] || [];
  return arr
    .filter(r => r && r[dateKey] && r[valueKey] != null)
    .sort((a, b) => new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime())
    .map(r => ({
      label: new Date(r[dateKey]).toLocaleDateString(localeMap[lang] || 'pt-AO', { month: 'short', day: '2-digit' }),
      value: Number(r[valueKey]),
    }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   HEADER — white page, institutional light style
   ═══════════════════════════════════════════════════════════════════════════ */

function makeHeaderFn(
  doc: jsPDF,
  data: ReportData,
  logoBase64: string | undefined,
  pageWidth: number,
  t: ReturnType<typeof getReportTranslation>,
  lang: ReportLang
): () => void {
  return function drawHeader() {
    // White header background
    doc.setFillColor(...P.bg);
    doc.rect(0, 0, pageWidth, L.HEADER_H, 'F');

    // Red brand stripe at very top
    doc.setFillColor(...P.brand);
    doc.rect(0, 0, pageWidth, 2.5, 'F');

    // Bottom border
    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(0, L.HEADER_H, pageWidth, L.HEADER_H);

    // Logo + brand
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

    // Vertical separator
    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(L.MARGIN + 52, 10, L.MARGIN + 52, 28);

    // Sub-label
    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text('PETROLEUM INTELLIGENCE PLATFORM', L.MARGIN + 56, 15);
    doc.text('Angola · Oil & Gas Analytics', L.MARGIN + 56, 22);

    // Report title centred
    setFont(doc, 7.5, 'normal', P.textSecondary);
    doc.text((data.title || t.report).substring(0, 62), pageWidth / 2, 17, { align: 'center' });

    // Date right
    const d = safeDate(data.generatedAt);
    const localeMap: Record<string, string> = { pt: 'pt-AO', en: 'en-GB', fr: 'fr-FR' };
    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(
      `${t.generatedOn}: ${d.toLocaleDateString(localeMap[lang], { day: '2-digit', month: 'long', year: 'numeric' })}`,
      pageWidth - L.MARGIN, 17, { align: 'right' }
    );

    // AI badge
    if (data.aiGenerated) {
      doc.setFillColor(...P.accentBlue);
      doc.roundedRect(pageWidth - L.MARGIN - 34, 24, 30, 7, 1.5, 1.5, 'F');
      setFont(doc, 5.5, 'bold', [255, 255, 255] as RGB);
      doc.text(t.generatedBy, pageWidth - L.MARGIN - 30, 28.8);
    }
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER — white page, NO "Confidential"
   Left:   AlphaData · Petroleum Intelligence
   Centre: Página X de Y
   Right:  period
   ═══════════════════════════════════════════════════════════════════════════ */

function addFooters(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  t: ReturnType<typeof getReportTranslation>,
  period: string,
  startPage = 2
) {
  const total = doc.getNumberOfPages();

  for (let i = startPage; i <= total; i++) {
    doc.setPage(i);

    // White footer bg
    doc.setFillColor(...P.bg);
    doc.rect(0, pageHeight - L.FOOTER_H, pageWidth, L.FOOTER_H, 'F');

    // Top border
    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.4);
    doc.line(0, pageHeight - L.FOOTER_H, pageWidth, pageHeight - L.FOOTER_H);

    // Red brand stripe at bottom edge
    doc.setFillColor(...P.brand);
    doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');

    // Left — platform name
    setFont(doc, 6.5, 'bold', P.textMuted);
    doc.text('AlphaData · Petroleum Intelligence', L.MARGIN, pageHeight - 7);

    // Centre — page number only
    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(t.pageOf(i, total), pageWidth / 2, pageHeight - 7, { align: 'center' });

    // Right — period (no "Confidential")
    setFont(doc, 6.5, 'normal', P.textMuted);
    doc.text(period || '', pageWidth - L.MARGIN, pageHeight - 7, { align: 'right' });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION TITLE — white page style
   ═══════════════════════════════════════════════════════════════════════════ */

function sectionTitle(ctx: PDFCtx, title: string) {
  needsPage(ctx, 26);

  ctx.doc.setFillColor(...P.surfaceAlt);
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.W - 2 * ctx.margin, 14, L.BOX_R, L.BOX_R, 'F');

  ctx.doc.setFillColor(...P.accentBlue);
  ctx.doc.roundedRect(ctx.margin, ctx.y, 3, 14, 1, 1, 'F');

  setFont(ctx.doc, 12, 'bold', P.textPrimary);
  ctx.doc.text(title, ctx.margin + 10, ctx.y + 9.5);
  ctx.y += 20;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

function safeDate(d: any): Date {
  const parsed = d instanceof Date ? d : new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function resolveTypeName(type: string, t: ReturnType<typeof getReportTranslation>): string {
  const map: Record<string, string> = {
    production:  t.typeProduction,
    market:      t.typeMarket,
    exports:     t.typeExports,
    risk:        t.typeRisk,
    predictions: t.typePredictions,
    general:     t.typeGeneral,
  };
  return map[type] || type || t.typeReport;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PDF GENERATOR
   Page 1  → dark cover (addCoverPageToPDF — unchanged)
   Page 2+ → white background, all content, institutional light style
   ═══════════════════════════════════════════════════════════════════════════ */

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  let logoBase64: string | undefined;
  try { logoBase64 = await loadLogoAsBase64(); } catch { /* optional */ }

  const lang: ReportLang = (data.language as ReportLang) || 'pt';
  const t      = getReportTranslation(lang);
  const doc    = new jsPDF('p', 'mm', 'a4');
  const W      = doc.internal.pageSize.getWidth();
  const H      = doc.internal.pageSize.getHeight();
  const margin = L.MARGIN;

  /* ── 1. COVER PAGE — dark colour ── */
  const defaultCover = getDefaultCoverPageData(lang);
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle:       data.title || `${t.report} AlphaData`,
    reportType:        resolveTypeName(data.type, t),
    reportPeriod:      data.period || (lang === 'en' ? 'Current' : lang === 'fr' ? 'Actuel' : 'Actual'),
    generatedAt:       safeDate(data.generatedAt),
    isAiGenerated:     data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy:       data.requestedBy,
    logoBase64,
    language:          lang,
  };
  addCoverPageToPDF(doc, coverData);

  /* ── 2. FIRST INTERNAL PAGE — white background ── */
  doc.addPage();
  doc.setFillColor(...P.bg);
  doc.rect(0, 0, W, H, 'F');

  const drawHeader = makeHeaderFn(doc, data, logoBase64, W, t, lang);
  drawHeader();

  const ctx: PDFCtx = {
    doc,
    y: L.HEADER_H + 8,
    W,
    H,
    margin,
    onNewPage: () => {
      drawHeader();
      ctx.y = L.HEADER_H + 8;
    },
  };

  const contentW = W - 2 * margin;

  /* ── Executive Summary ── */
  if (data.summary) {
    sectionTitle(ctx, t.execSummary);
    renderBlocks(ctx, parseMarkdown(data.summary));
    ctx.y += L.SECTION_SP;
  }

  /* ── Key Metrics / Highlights ── */
  if (data.highlights && data.highlights.length > 0) {
    sectionTitle(ctx, t.keyMetrics);
    const cardW = (contentW - 8) / 2;
    const cardH = 30;

    data.highlights.forEach((h, idx) => {
      const isLeft = idx % 2 === 0;
      if (isLeft) needsPage(ctx, cardH + 8);
      const cx = isLeft ? margin : margin + cardW + 8;
      const cy = ctx.y;

      ctx.doc.setFillColor(...P.surface);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'F');
      ctx.doc.setDrawColor(...P.border);
      ctx.doc.setLineWidth(0.3);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'S');

      const accentColor =
        h.trend === 'up'   ? P.accentGreen :
        h.trend === 'down' ? P.accentRed   : P.accentBlue;
      ctx.doc.setFillColor(...accentColor);
      ctx.doc.roundedRect(cx, cy, 2.5, cardH, 1, 1, 'F');

      setFont(ctx.doc, 7.5, 'normal', P.textSecondary);
      ctx.doc.text(h.title, cx + 8, cy + 10);

      setFont(ctx.doc, 14, 'bold', P.textPrimary);
      ctx.doc.text(h.value, cx + 8, cy + 22);

      if (h.trend) {
        const tColor = h.trend === 'up' ? P.accentGreen : h.trend === 'down' ? P.accentRed : P.textMuted;
        const arrow  = h.trend === 'up' ? '↑' : h.trend === 'down' ? '↓' : '—';
        setFont(ctx.doc, 9, 'bold', tColor);
        ctx.doc.text(arrow, cx + cardW - 12, cy + 16);
      }

      if (!isLeft || idx === data.highlights!.length - 1) ctx.y += cardH + 6;
    });
    ctx.y += L.SUBSEC_SP;
  }

  /* ── Dynamic Charts ── */
  const prodData    = extractProduction(data.content);
  const priceData   = extractPrices(data.content);
  const exportData  = extractExports(data.content);
  const priceSeries = extractTimeSeries(data.content, 'price', 'prices', 'data_date', lang);
  const hasCharts   = prodData.length > 0 || priceData.length > 0 || exportData.length > 0 || priceSeries.length > 1;

  if (hasCharts) {
    sectionTitle(ctx, t.visualAnalysis);

    if (prodData.length > 0) {
      drawHBarChart(ctx, t.productionByOperator, prodData, 'bpd', 8);
      ctx.y += 4;
      if (prodData.length >= 3) {
        drawDonutChart(ctx, t.marketShareProduction, prodData, 'bpd');
        ctx.y += 4;
      }
    }

    if (priceSeries.length > 1) {
      drawLineChart(ctx, t.priceEvolution, [{ name: t.price, points: priceSeries, color: P.c0 }]);
    } else if (priceData.length > 0) {
      drawHBarChart(ctx, t.pricesByType, priceData, 'USD', 8);
    }

    if (exportData.length > 0) {
      drawHBarChart(ctx, t.exportsByDestination, exportData, 'bbl', 8);
    }

    ctx.y += L.SECTION_SP;
  }

  /* ── Data Tables ── */
  if (data.content?.data) {
    const cd = data.content.data;
    const localeMap: Record<string, string> = { pt: 'pt-AO', en: 'en-GB', fr: 'fr-FR' };

    const tableHead = {
      fillColor:   P.accentBlue as any,
      textColor:   [255, 255, 255] as any,
      fontStyle:   'bold' as const,
      fontSize:    8,
      cellPadding: 5,
    };
    const tableBody = {
      fontSize:    8,
      textColor:   P.textSecondary as any,
      cellPadding: 4,
      fillColor:   P.surface as any,
    };
    const tableStyle = {
      lineColor:   P.border as any,
      lineWidth:   0.25,
      font:        'helvetica',
    };

    if (Array.isArray(cd.production) && cd.production.length > 0) {
      sectionTitle(ctx, t.productionData);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.operator, t.block, t.field, t.productionBpd, t.status]],
        body: cd.production.slice(0, 20).map((r: any) => [
          r.operator || r.company || '-',
          r.block    || '-',
          r.field    || '-',
          r.daily_production ? `${(r.daily_production / 1000).toFixed(0)}K bpd` : '-',
          r.status   || '-',
        ]),
        margin: { left: margin, right: margin },
        headStyles:         tableHead,
        bodyStyles:         tableBody,
        alternateRowStyles: { fillColor: P.bg as any },
        theme:              'grid',
        styles:             tableStyle,
        columnStyles:       { 3: { halign: 'right', fontStyle: 'bold', textColor: P.textPrimary as any } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    if (Array.isArray(cd.prices) && cd.prices.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, t.priceTable);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.crudeType, t.priceUsd, t.variation, t.date]],
        body: cd.prices.slice(0, 12).map((r: any) => [
          r.crude_type || r.type || '-',
          r.price         != null ? `$${Number(r.price).toFixed(2)}` : '-',
          r.change_percent != null ? `${r.change_percent >= 0 ? '+' : ''}${Number(r.change_percent).toFixed(2)}%` : '-',
          r.data_date ? new Date(r.data_date).toLocaleDateString(localeMap[lang]) : '-',
        ]),
        margin: { left: margin, right: margin },
        headStyles:         tableHead,
        bodyStyles:         tableBody,
        alternateRowStyles: { fillColor: P.bg as any },
        theme:              'grid',
        styles:             tableStyle,
        columnStyles:       { 1: { halign: 'right', fontStyle: 'bold', textColor: P.textPrimary as any }, 2: { halign: 'right' } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    if (Array.isArray(cd.exports) && cd.exports.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, t.exportTable);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.destination, t.volume, t.tanker, t.status]],
        body: cd.exports.slice(0, 12).map((r: any) => [
          r.destination || r.country || '-',
          r.volume != null ? `${(Number(r.volume) / 1_000_000).toFixed(2)}M bbl` : '-',
          r.tanker_name || '-',
          r.status      || '-',
        ]),
        margin: { left: margin, right: margin },
        headStyles:         tableHead,
        bodyStyles:         tableBody,
        alternateRowStyles: { fillColor: P.bg as any },
        theme:              'grid',
        styles:             tableStyle,
        columnStyles:       { 1: { halign: 'right', fontStyle: 'bold', textColor: P.textPrimary as any } },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }
  }

  /* ── Legal Disclaimer ── */
  needsPage(ctx, 36);
  ctx.doc.setFillColor(...P.surfaceAlt);
  ctx.doc.roundedRect(margin, ctx.y, contentW, 32, L.BOX_R, L.BOX_R, 'F');
  ctx.doc.setDrawColor(...P.border);
  ctx.doc.setLineWidth(0.25);
  ctx.doc.roundedRect(margin, ctx.y, contentW, 32, L.BOX_R, L.BOX_R, 'S');
  setFont(ctx.doc, 6.5, 'italic', P.textMuted);
  ctx.doc.text(
    ctx.doc.splitTextToSize(`${t.legalNotice}: ${t.legalText}`, contentW - 10),
    margin + 5, ctx.y + 8
  );

  /* ── 3. FOOTERS — pages 2+ only, no cover ── */
  addFooters(doc, W, H, t, data.period || '', 2);

  /* ── 4. SAVE ── */
  doc.save(
    `AlphaData_${resolveTypeName(data.type, t).replace(/\s+/g, '_')}_${(data.period || new Date().toISOString().split('T')[0]).replace(/\s+/g, '_')}.pdf`
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOCX GENERATOR — Multi-language
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  const lang      = (data.language as ReportLang) || 'pt';
  const t         = getReportTranslation(lang);
  const localeMap: Record<string, string> = { pt: 'pt-AO', en: 'en-GB', fr: 'fr-FR' };
  const children: any[] = [];

  children.push(
    new Paragraph({ text: data.title || `${t.report} AlphaData`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${t.period}: ${data.period || t.notAvailable}   ·   `, color: '64748B', size: 20 }),
        new TextRun({ text: `${t.generatedOn}: ${safeDate(data.generatedAt).toLocaleDateString(localeMap[lang])}`, color: '64748B', size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  if (data.summary) {
    children.push(new Paragraph({ text: t.execSummary, heading: HeadingLevel.HEADING_1 }));
    for (const block of parseMarkdown(data.summary)) {
      if (block.kind === 'blank') continue;
      if (block.kind === 'h1') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_1 }));
      else if (block.kind === 'h2') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2 }));
      else if (block.kind === 'h3') children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_3 }));
      else if (block.kind === 'bullet')
        children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], bullet: { level: block.indent - 1 } }));
      else if (block.kind === 'numbered')
        children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], numbering: { reference: 'default-numbering', level: 0 } }));
      else
        children.push(new Paragraph({ children: [new TextRun({ text: block.text, size: 20 })], spacing: { after: 120 } }));
    }
  }

  const cd = data.content?.data;
  if (cd?.production && Array.isArray(cd.production) && cd.production.length > 0) {
    children.push(new Paragraph({ text: t.productionData, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [t.operator, t.block, t.field, t.productionBpd, t.status].map(h =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })] })],
                shading: { fill: '006EC8' },
              })
            ),
          }),
          ...cd.production.slice(0, 20).map((r: any) =>
            new TableRow({
              children: [
                r.operator || '-',
                r.block    || '-',
                r.field    || '-',
                r.daily_production ? `${(r.daily_production / 1000).toFixed(0)}K bpd` : '-',
                r.status   || '-',
              ].map(val =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 18 })] })] })
              ),
            })
          ),
        ],
      })
    );
  }

  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(globalThis.document.createElement('a'), {
    href:     url,
    download: `AlphaData_${resolveTypeName(data.type, t)}_${(data.period || 'report').replace(/\s+/g, '_')}.docx`,
  });
  globalThis.document.body.appendChild(a);
  a.click();
  globalThis.document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXCEL GENERATOR — Multi-language
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateExcelReport = (data: ReportData): void => {
  const lang      = (data.language as ReportLang) || 'pt';
  const t         = getReportTranslation(lang);
  const localeMap: Record<string, string> = { pt: 'pt-AO', en: 'en-GB', fr: 'fr-FR' };
  const esc       = (s: string) =>
    String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const coverData: CoverPageData = {
    ...getDefaultCoverPageData(lang),
    reportTitle:       data.title || `${t.report} AlphaData`,
    reportType:        resolveTypeName(data.type, t),
    reportPeriod:      data.period || (lang === 'en' ? 'Current' : lang === 'fr' ? 'Actuel' : 'Actual'),
    generatedAt:       safeDate(data.generatedAt),
    isAiGenerated:     data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy:       data.requestedBy,
    language:          lang,
  };

  const dataRows: string[] = [];
  const cd = data.content?.data;

  if (cd?.production && Array.isArray(cd.production)) {
    dataRows.push(`<Row>${[t.operator, t.block, t.field, t.productionBpd, t.status].map(h => `<Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`);
    cd.production.forEach((r: any) => {
      dataRows.push(`<Row>${[r.operator||'-', r.block||'-', r.field||'-', r.daily_production||0, r.status||'-'].map((v, i) => i === 3 ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>` : `<Cell><Data ss:Type="String">${esc(String(v))}</Data></Cell>`).join('')}</Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.prices && Array.isArray(cd.prices)) {
    dataRows.push(`<Row>${[t.crudeType, t.priceUsd, t.variation, t.date].map(h => `<Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`);
    cd.prices.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.crude_type||r.type||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.price||0}</Data></Cell><Cell><Data ss:Type="Number">${r.change_percent||0}</Data></Cell><Cell><Data ss:Type="String">${r.data_date ? new Date(r.data_date).toLocaleDateString(localeMap[lang]) : '-'}</Data></Cell></Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.exports && Array.isArray(cd.exports)) {
    dataRows.push(`<Row>${[t.destination, t.volume, t.tanker, t.status].map(h => `<Cell ss:StyleID="tableHeader"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`);
    cd.exports.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.destination||r.country||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.volume||0}</Data></Cell><Cell><Data ss:Type="String">${esc(r.tanker_name||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.status||'-')}</Data></Cell></Row>`);
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="brand"><Font ss:Bold="1" ss:Size="16" ss:Color="#006EC8"/><Interior ss:Color="#F7F8FA" ss:Pattern="Solid"/></Style>
    <Style ss:ID="subheader"><Font ss:Bold="1" ss:Size="10" ss:Color="#121826"/><Interior ss:Color="#F0F3F8" ss:Pattern="Solid"/></Style>
    <Style ss:ID="tableHeader"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="9"/><Interior ss:Color="#006EC8" ss:Pattern="Solid"/></Style>
    <Style ss:ID="bold"><Font ss:Bold="1" ss:Color="#121826"/></Style>
    <Style ss:ID="footer"><Font ss:Italic="1" ss:Size="8" ss:Color="#7887A0"/></Style>
  </Styles>
  <Worksheet ss:Name="Info">
    <Table>${getCoverPageExcelRows(coverData).join('\n')}</Table>
  </Worksheet>
  <Worksheet ss:Name="${lang === 'en' ? 'Data' : lang === 'fr' ? 'Donnees' : 'Dados'}">
    <Table>${dataRows.join('\n')}</Table>
  </Worksheet>
</Workbook>`;

  const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.ms-excel' }));
  const a   = Object.assign(globalThis.document.createElement('a'), {
    href:     url,
    download: `AlphaData_${resolveTypeName(data.type, t)}_${(data.period || 'report').replace(/\s+/g, '_')}.xls`,
  });
  globalThis.document.body.appendChild(a);
  a.click();
  globalThis.document.body.removeChild(a);
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
  const d = { ...data, language };
  if (format === 'pdf')  return generatePDFReport(d);
  if (format === 'docx') return generateDOCXReport(d);
  generateExcelReport(d);
};