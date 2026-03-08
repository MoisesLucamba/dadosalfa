/**
 * Utility functions for generating reports in PDF, DOCX, and Excel formats
 * FIXED VERSION:
 *  - No asterisks leaking into output
 *  - Fully dynamic charts driven by real data
 *  - Robust markdown parser with clean text output
 *  - Proper page-break handling throughout
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
import { getDocumentTranslation, DocumentLanguageCode } from '@/i18n';
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
  text: string;     // plain text, ALL markdown stripped
  indent: number;   // 0 = normal, 1+ = nested
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  dark:       [10,  10,  10]  as RGB,
  darkGray:   [51,  65,  85]  as RGB,
  muted:      [100, 116, 139] as RGB,
  mediumGray: [148, 163, 184] as RGB,
  lightGray:  [203, 213, 225] as RGB,
  ultraLight: [248, 250, 252] as RGB,
  white:      [255, 255, 255] as RGB,
  brand:      [220, 38,  38]  as RGB,
  primary:    [30,  64,  175] as RGB,
  success:    [34,  197, 94]  as RGB,
  warning:    [234, 179, 8]   as RGB,
  danger:     [239, 68,  68]  as RGB,
  // Chart palette
  c0: [59,  130, 246] as RGB,
  c1: [220, 38,  38]  as RGB,
  c2: [16,  185, 129] as RGB,
  c3: [249, 115, 22]  as RGB,
  c4: [139, 92,  246] as RGB,
  c5: [236, 72,  153] as RGB,
  c6: [30,  64,  175] as RGB,
  c7: [234, 179, 8]   as RGB,
} as const;

const CHART_PALETTE: RGB[] = [C.c0, C.c1, C.c2, C.c3, C.c4, C.c5, C.c6, C.c7];

const L = {
  MARGIN:     20,
  HEADER_H:   45,
  FOOTER_H:   22,
  SECTION_SP: 16,
  SUBSEC_SP:  10,
  LINE_SP:    6,
  BOX_R:      5,
  SMALL_R:    2,
  THIN:       0.4,
  THICK:      2,
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   MARKDOWN → PLAIN-TEXT BLOCK PARSER
   (Strips ALL asterisks, hashes, dashes used as markup)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Remove every markdown decoration and return clean text */
function stripInline(raw: string): string {
  return raw
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')   // bold-italic
    .replace(/\*\*(.+?)\*\*/g, '$1')        // bold
    .replace(/\*(.+?)\*/g, '$1')            // italic
    .replace(/__(.+?)__/g, '$1')            // bold alt
    .replace(/_(.+?)_/g, '$1')              // italic alt
    .replace(/`(.+?)`/g, '$1')              // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')     // links
    .replace(/~~(.+?)~~/g, '$1')            // strikethrough
    .trim();
}

function parseMarkdown(raw: string): Block[] {
  if (!raw) return [];
  const blocks: Block[] = [];

  for (const line of raw.split('\n')) {
    const t = line.trimEnd();

    // Blank line
    if (!t.trim()) {
      blocks.push({ kind: 'blank', text: '', indent: 0 });
      continue;
    }

    // ATX headings
    const h3m = t.match(/^###\s+(.*)/);
    if (h3m) { blocks.push({ kind: 'h3', text: stripInline(h3m[1]), indent: 0 }); continue; }

    const h2m = t.match(/^##\s+(.*)/);
    if (h2m) { blocks.push({ kind: 'h2', text: stripInline(h2m[1]), indent: 0 }); continue; }

    const h1m = t.match(/^#\s+(.*)/);
    if (h1m) { blocks.push({ kind: 'h1', text: stripInline(h1m[1]), indent: 0 }); continue; }

    // Setext heading (underline ==)
    // (rare but guard it)
    if (/^={3,}$/.test(t.trim()) && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      last.kind = 'h1';
      continue;
    }
    if (/^-{3,}$/.test(t.trim()) && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      last.kind = 'h2';
      continue;
    }

    // Numbered list with bold heading pattern: **1. Title:**
    const boldNumHeading = t.match(/^\*{0,2}(\d+)\.\s+([^*]+?):?\*{0,2}$/);
    if (boldNumHeading && t.startsWith('**')) {
      blocks.push({ kind: 'h3', text: `${boldNumHeading[1]}. ${stripInline(boldNumHeading[2])}`, indent: 0 });
      continue;
    }

    // Sub-bullet (two dashes: - -)
    const subDash = t.match(/^(\s*)-\s+-\s+(.*)/);
    if (subDash) {
      blocks.push({ kind: 'bullet', text: stripInline(subDash[2]), indent: 2 });
      continue;
    }

    // Asterisk bullet
    const starBullet = t.match(/^(\s*)\*\s+(.*)/);
    if (starBullet) {
      const indentLevel = Math.floor(starBullet[1].length / 2) + 1;
      blocks.push({ kind: 'bullet', text: stripInline(starBullet[2]), indent: indentLevel });
      continue;
    }

    // Dash bullet
    const dashBullet = t.match(/^(\s*)-\s+(.*)/);
    if (dashBullet) {
      const indentLevel = Math.floor(dashBullet[1].length / 2) + 1;
      blocks.push({ kind: 'bullet', text: stripInline(dashBullet[2]), indent: indentLevel });
      continue;
    }

    // Numbered list
    const numbered = t.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numbered) {
      const indentLevel = Math.floor(numbered[1].length / 2) + 1;
      blocks.push({ kind: 'numbered', text: `${numbered[2]}. ${stripInline(numbered[3])}`, indent: indentLevel });
      continue;
    }

    // Normal paragraph
    blocks.push({ kind: 'paragraph', text: stripInline(t), indent: 0 });
  }

  // Remove leading/trailing blanks
  while (blocks.length > 0 && blocks[0].kind === 'blank') blocks.shift();
  while (blocks.length > 0 && blocks[blocks.length - 1].kind === 'blank') blocks.pop();

  return blocks;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PDF CONTEXT HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

interface PDFCtx {
  doc: jsPDF;
  y: number;          // current cursor
  W: number;          // page width
  H: number;          // page height
  margin: number;
  onNewPage: () => void;
}

function bottomLimit(ctx: PDFCtx) {
  return ctx.H - L.FOOTER_H - ctx.margin - 8;
}

function needsPage(ctx: PDFCtx, space: number) {
  if (ctx.y + space > bottomLimit(ctx)) {
    ctx.doc.addPage();
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
   BLOCK RENDERER — renders parsed blocks into PDF
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
        // Red accent bar for section headings
        ctx.doc.setFillColor(...C.brand);
        ctx.doc.roundedRect(ctx.margin, ctx.y, 3, 12, 1, 1, 'F');
      }

      setFont(ctx.doc, sz, 'bold', C.dark);
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
      setFont(ctx.doc, 10, 'normal', C.darkGray);
      const indentX = ctx.margin + block.indent * 8;
      const textW = contentW - block.indent * 8 - 7;
      const lines = textLines(ctx.doc, block.text, textW);
      for (let i = 0; i < lines.length; i++) {
        needsPage(ctx, L.LINE_SP);
        if (i === 0) {
          ctx.doc.setFillColor(...C.brand);
          ctx.doc.circle(indentX + 1.5, ctx.y - 1.8, 1.2, 'F');
        }
        ctx.doc.text(lines[i], indentX + 6, ctx.y);
        ctx.y += L.LINE_SP;
      }
      prevKind = 'bullet';
      continue;
    }

    if (block.kind === 'numbered') {
      setFont(ctx.doc, 10, 'normal', C.darkGray);
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
    setFont(ctx.doc, 10, 'normal', C.darkGray);
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
   DYNAMIC CHART RENDERERS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Horizontal bar chart — driven entirely by the passed `items` array.
 * Each item: { label: string; value: number; unit?: string }
 */
function drawHBarChart(
  ctx: PDFCtx,
  title: string,
  items: { label: string; value: number }[],
  unit: string = '',
  maxBars: number = 8
): void {
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

  // Title
  setFont(ctx.doc, 10, 'bold', C.dark);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  // Background panel
  ctx.doc.setFillColor(...C.ultraLight);
  ctx.doc.roundedRect(ctx.margin, ctx.y - 2, ctx.W - 2 * ctx.margin, totalH, L.BOX_R, L.BOX_R, 'F');

  sorted.forEach((item, i) => {
    const rowY = ctx.y + i * (barH + barGap);
    const ratio = maxVal > 0 ? item.value / maxVal : 0;
    const barW = Math.max(ratio * barAreaW, 2);
    const color = CHART_PALETTE[i % CHART_PALETTE.length];

    // Label
    setFont(ctx.doc, 7.5, 'normal', C.darkGray);
    const label = (item.label || '').length > 14 ? item.label.substring(0, 13) + '…' : item.label;
    ctx.doc.text(label, ctx.margin + 3, rowY + barH - 1);

    // Bar
    ctx.doc.setFillColor(...color);
    ctx.doc.roundedRect(ctx.margin + labelW, rowY, barW, barH, L.SMALL_R, L.SMALL_R, 'F');

    // Value
    setFont(ctx.doc, 7, 'bold', C.dark);
    const formatted = item.value >= 1_000_000
      ? `${(item.value / 1_000_000).toFixed(1)}M`
      : item.value >= 1_000
      ? `${(item.value / 1_000).toFixed(0)}K`
      : `${item.value.toFixed(0)}`;
    ctx.doc.text(`${formatted}${unit ? ' ' + unit : ''}`, ctx.margin + labelW + barW + 3, rowY + barH - 1);
  });

  ctx.y += totalH + 8;
}

/**
 * Donut / pie chart — segments from real data.
 * items: { label: string; value: number }[]
 */
function drawDonutChart(
  ctx: PDFCtx,
  title: string,
  items: { label: string; value: number }[],
  unit: string = ''
): void {
  if (items.length === 0) return;

  const top = [...items].sort((a, b) => b.value - a.value).slice(0, 7);
  const total = top.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  const r = 26;
  const legendLineH = 8;
  const legendH = top.length * legendLineH + 6;
  const totalH = r * 2 + legendH + 20;

  needsPage(ctx, totalH + 18);

  setFont(ctx.doc, 10, 'bold', C.dark);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 10;

  const cx = ctx.margin + r + 5;
  const cy = ctx.y + r;

  // Draw pie segments
  let startAngle = -Math.PI / 2;
  top.forEach((item, i) => {
    const slice = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + slice;
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    ctx.doc.setFillColor(...color);

    // Approximate arc with triangle fan
    const steps = Math.max(6, Math.floor(slice * 14));
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (s / steps) * slice;
      const a2 = startAngle + ((s + 1) / steps) * slice;
      ctx.doc.triangle(
        cx, cy,
        cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
        cx + Math.cos(a2) * r, cy + Math.sin(a2) * r,
        'F'
      );
    }
    startAngle = endAngle;
  });

  // Inner white circle (donut)
  ctx.doc.setFillColor(...C.white);
  ctx.doc.circle(cx, cy, r * 0.54, 'F');

  // Center label
  const centerFmt = total >= 1_000_000
    ? `${(total / 1_000_000).toFixed(1)}M`
    : total >= 1_000
    ? `${(total / 1_000).toFixed(0)}K`
    : `${total.toFixed(0)}`;
  setFont(ctx.doc, 9, 'bold', C.dark);
  ctx.doc.text(centerFmt, cx, cy + 1.5, { align: 'center' });
  if (unit) {
    setFont(ctx.doc, 6, 'normal', C.muted);
    ctx.doc.text(unit, cx, cy + 7, { align: 'center' });
  }

  // Legend (right of donut)
  const legendX = cx + r + 8;
  let legendY = ctx.y + 4;
  top.forEach((item, i) => {
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    const pct = ((item.value / total) * 100).toFixed(1);
    ctx.doc.setFillColor(...color);
    ctx.doc.roundedRect(legendX, legendY - 3, 5, 5, 0.5, 0.5, 'F');
    setFont(ctx.doc, 7, 'normal', C.darkGray);
    const lbl = item.label.length > 18 ? item.label.substring(0, 17) + '…' : item.label;
    ctx.doc.text(`${lbl}  ${pct}%`, legendX + 7, legendY + 1);
    legendY += legendLineH;
  });

  ctx.y = cy + r + legendH + 8;
}

/**
 * Simple line/sparkline chart for time-series data
 * points: { label: string; value: number }[] (ordered)
 */
function drawLineChart(
  ctx: PDFCtx,
  title: string,
  series: Array<{ name: string; points: { label: string; value: number }[]; color?: RGB }>,
): void {
  if (series.length === 0 || series[0].points.length === 0) return;

  const chartH = 48;
  const chartW = ctx.W - 2 * ctx.margin;
  needsPage(ctx, chartH + 28);

  setFont(ctx.doc, 10, 'bold', C.dark);
  ctx.doc.text(title, ctx.margin, ctx.y);
  ctx.y += 8;

  // Background
  ctx.doc.setFillColor(...C.ultraLight);
  ctx.doc.roundedRect(ctx.margin, ctx.y, chartW, chartH, L.BOX_R, L.BOX_R, 'F');

  // Grid lines (4 horizontal)
  const allVals = series.flatMap(s => s.points.map(p => p.value));
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1;
  const padX = 6;
  const padY = 8;
  const plotW = chartW - 2 * padX;
  const plotH = chartH - 2 * padY;

  ctx.doc.setDrawColor(...C.lightGray);
  ctx.doc.setLineWidth(0.2);
  for (let g = 0; g <= 3; g++) {
    const gy = ctx.y + padY + (g / 3) * plotH;
    ctx.doc.line(ctx.margin + padX, gy, ctx.margin + padX + plotW, gy);
    // Y axis label
    const labelVal = maxV - (g / 3) * range;
    setFont(ctx.doc, 5.5, 'normal', C.mediumGray);
    ctx.doc.text(
      labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}K` : `${labelVal.toFixed(0)}`,
      ctx.margin, gy + 1.5
    );
  }

  // Draw each series
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

    // Dots
    ctx.doc.setFillColor(...color);
    for (let i = 0; i < pts.length; i++) {
      const { x, y } = toXY(i);
      ctx.doc.circle(x, y, 1.2, 'F');
    }
  });

  // X axis labels (evenly spaced, up to 8)
  const step = Math.max(1, Math.ceil(series[0].points.length / 8));
  setFont(ctx.doc, 5.5, 'normal', C.mediumGray);
  for (let i = 0; i < series[0].points.length; i += step) {
    const xp = ctx.margin + padX + (i / (series[0].points.length - 1)) * plotW;
    ctx.doc.text(series[0].points[i].label, xp, ctx.y + chartH + 4, { align: 'center' });
  }

  // Legend
  if (series.length > 1) {
    let lx = ctx.margin;
    series.forEach((s, i) => {
      const color = s.color || CHART_PALETTE[i % CHART_PALETTE.length];
      ctx.doc.setFillColor(...color);
      ctx.doc.roundedRect(lx, ctx.y + chartH + 7, 5, 4, 0.5, 0.5, 'F');
      setFont(ctx.doc, 6, 'normal', C.darkGray);
      ctx.doc.text(s.name, lx + 7, ctx.y + chartH + 10.5);
      lx += ctx.doc.getTextWidth(s.name) + 16;
    });
  }

  ctx.y += chartH + 16;
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATA EXTRACTORS — pull real arrays from report content
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

/** Try to build time-series from any date-ordered array */
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
   PDF HEADER / FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

function makeHeaderFn(
  doc: jsPDF,
  data: ReportData,
  logoBase64: string | undefined,
  pageWidth: number,
): () => void {
  const t = getDocumentTranslation(data.language || 'pt');
  const locale = data.language === 'en' ? 'en-US' : data.language === 'fr' ? 'fr-FR' : 'pt-AO';
  return function drawHeader() {
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, pageWidth, L.HEADER_H, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', L.MARGIN, 8, 12, 12);
        setFont(doc, 17, 'bold', C.white);
        doc.text('ALPHADATA', L.MARGIN + 15, 18);
      } catch {
        setFont(doc, 26, 'bold', C.brand);
        doc.text('α', L.MARGIN, 20);
        setFont(doc, 17, 'bold', C.white);
        doc.text('ALPHADATA', L.MARGIN + 13, 20);
      }
    } else {
      setFont(doc, 26, 'bold', C.brand);
      doc.text('α', L.MARGIN, 20);
      setFont(doc, 17, 'bold', C.white);
      doc.text('ALPHADATA', L.MARGIN + 13, 20);
    }

    setFont(doc, 9, 'normal', C.mediumGray);
    const titleStr = (data.title || t.report).substring(0, 60);
    doc.text(titleStr, L.MARGIN, 32);

    // Date right-aligned
    const d = safeDate(data.generatedAt);
    setFont(doc, 7.5, 'normal', C.mediumGray);
    doc.text(
      `${t.generatedAt}: ${d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - L.MARGIN - 85,
      20
    );

    if (data.aiGenerated) {
      doc.setFillColor(...C.primary);
      doc.roundedRect(pageWidth - L.MARGIN - 40, 26, 36, 9, 2, 2, 'F');
      setFont(doc, 6.5, 'bold', C.white);
      doc.text(t.aiGenerated, pageWidth - L.MARGIN - 36, 32);
    }
  };
}

function addFooters(doc: jsPDF, pageWidth: number, pageHeight: number, lang: DocumentLanguageCode = 'pt') {
  const t = getDocumentTranslation(lang);
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.ultraLight);
    doc.rect(0, pageHeight - L.FOOTER_H, pageWidth, L.FOOTER_H, 'F');
    doc.setDrawColor(...C.brand);
    doc.setLineWidth(L.THIN);
    doc.line(0, pageHeight - L.FOOTER_H, pageWidth, pageHeight - L.FOOTER_H);

    setFont(doc, 7, 'normal', C.muted);
    doc.text(t.footerText, L.MARGIN, pageHeight - 8);
    doc.text(`${t.page} ${i} ${t.of} ${total}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(t.confidential, pageWidth - L.MARGIN - 30, pageHeight - 8);
  }
}

function sectionTitle(ctx: PDFCtx, title: string) {
  needsPage(ctx, 24);
  ctx.doc.setFillColor(...C.brand);
  ctx.doc.roundedRect(ctx.margin, ctx.y, 3, 13, 1, 1, 'F');
  setFont(ctx.doc, 13, 'bold', C.dark);
  ctx.doc.text(title, ctx.margin + 9, ctx.y + 9.5);
  ctx.y += 20;
}

function safeDate(d: any): Date {
  const parsed = d instanceof Date ? d : new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getTypeName(type: string, lang: DocumentLanguageCode = 'pt'): string {
  const t = getDocumentTranslation(lang);
  const map: Record<string, string> = {
    production: t.typeProduction,
    market: t.typeMarket,
    exports: t.typeExports,
    risk: t.typeRisk,
    predictions: t.typePredictions,
    general: t.typeGeneral,
  };
  return map[type] || type || t.typeReport;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PDF GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  let logoBase64: string | undefined;
  try { logoBase64 = await loadLogoAsBase64(); } catch { /* logo optional */ }

  const lang = data.language || 'pt';
  const t = getDocumentTranslation(lang);
  const locale = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'pt-AO';

  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = L.MARGIN;

  // ── Cover page ──────────────────────────────────────────────────────────
  const defaultCover = getDefaultCoverPageData(lang);
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle: data.title || `${t.report} AlphaData`,
    reportType: getTypeName(data.type, lang),
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

  // ── Setup context ────────────────────────────────────────────────────────
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

  // ── Executive Summary ────────────────────────────────────────────────────
  if (data.summary) {
    sectionTitle(ctx, t.executiveSummary);
    const blocks = parseMarkdown(data.summary);
    renderBlocks(ctx, blocks);
    ctx.y += L.SECTION_SP;
  }

  // ── Highlights (modern card grid) ──────────────────────────────────────
  if (data.highlights && data.highlights.length > 0) {
    sectionTitle(ctx, t.mainHighlights);
    const cardW = (contentW - 8) / 2;
    const cardH = 30;
    data.highlights.forEach((h, idx) => {
      const isLeft = idx % 2 === 0;
      if (isLeft) needsPage(ctx, cardH + 8);
      const cx = isLeft ? margin : margin + cardW + 8;
      const cy = isLeft ? ctx.y : ctx.y;

      // Card background with left accent
      ctx.doc.setFillColor(...C.white);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'F');
      ctx.doc.setDrawColor(...C.lightGray);
      ctx.doc.setLineWidth(0.3);
      ctx.doc.roundedRect(cx, cy, cardW, cardH, L.BOX_R, L.BOX_R, 'S');

      // Left accent bar
      const accentColor = h.trend === 'up' ? C.success : h.trend === 'down' ? C.danger : C.primary;
      ctx.doc.setFillColor(...accentColor);
      ctx.doc.roundedRect(cx, cy, 3, cardH, 1, 1, 'F');

      // Label
      setFont(ctx.doc, 7.5, 'normal', C.muted);
      ctx.doc.text(h.title, cx + 8, cy + 10);

      // Value
      setFont(ctx.doc, 14, 'bold', C.dark);
      ctx.doc.text(h.value, cx + 8, cy + 22);

      // Trend indicator
      if (h.trend) {
        const tColor = h.trend === 'up' ? C.success : h.trend === 'down' ? C.danger : C.muted;
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

  // ── Dynamic Charts ───────────────────────────────────────────────────────
  const prodData = extractProduction(data.content);
  const priceData = extractPrices(data.content);
  const exportData = extractExports(data.content);

  // Price time series (if available)
  const priceSeries = extractTimeSeries(data.content, 'price', 'prices', 'data_date');

  const hasCharts = prodData.length > 0 || priceData.length > 0 || exportData.length > 0 || priceSeries.length > 1;

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
      drawLineChart(ctx, t.priceEvolution, [
        { name: t.price, points: priceSeries, color: C.brand },
      ]);
    } else if (priceData.length > 0) {
      drawHBarChart(ctx, t.pricesByType, priceData, 'USD', 8);
    }

    if (exportData.length > 0) {
      drawHBarChart(ctx, t.exportsByDestination, exportData, 'bbl', 8);
    }

    ctx.y += L.SECTION_SP;
  }

  // ── Data Tables ──────────────────────────────────────────────────────────
  if (data.content?.data) {
    const cd = data.content.data;

    // Production table
    if (Array.isArray(cd.production) && cd.production.length > 0) {
      sectionTitle(ctx, t.productionData);
      const rows = cd.production.slice(0, 20).map((r: any) => [
        r.operator || r.company || '-',
        r.block || '-',
        r.field || '-',
        r.daily_production
          ? `${(r.daily_production / 1000).toFixed(0)}K bpd`
          : '-',
        r.status || '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.operator, t.block, t.field, t.productionBpd, t.status]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: C.darkGray },
        alternateRowStyles: { fillColor: C.ultraLight },
        theme: 'plain',
        styles: { cellPadding: 3.5, lineColor: C.lightGray, lineWidth: 0.1 },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    // Prices table
    if (Array.isArray(cd.prices) && cd.prices.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, t.priceTable);
      const rows = cd.prices.slice(0, 12).map((r: any) => [
        r.crude_type || r.type || '-',
        r.price != null ? `$${Number(r.price).toFixed(2)}` : '-',
        r.change_percent != null
          ? `${r.change_percent >= 0 ? '+' : ''}${Number(r.change_percent).toFixed(2)}%`
          : '-',
        r.data_date ? new Date(r.data_date).toLocaleDateString(locale) : '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.crudeType, t.priceUsd, t.variation, t.date]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: C.darkGray },
        alternateRowStyles: { fillColor: C.ultraLight },
        theme: 'plain',
        styles: { cellPadding: 3.5, lineColor: C.lightGray, lineWidth: 0.1 },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }

    // Exports table
    if (Array.isArray(cd.exports) && cd.exports.length > 0) {
      needsPage(ctx, 50);
      sectionTitle(ctx, t.exportTable);
      const rows = cd.exports.slice(0, 12).map((r: any) => [
        r.destination || r.country || '-',
        r.volume != null ? `${(Number(r.volume) / 1_000_000).toFixed(2)}M bbl` : '-',
        r.tanker_name || '-',
        r.status || '-',
      ]);
      autoTable(doc, {
        startY: ctx.y,
        head: [[t.destination, t.volume, t.tanker, t.status]],
        body: rows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: C.darkGray },
        alternateRowStyles: { fillColor: C.ultraLight },
        theme: 'plain',
        styles: { cellPadding: 3.5, lineColor: C.lightGray, lineWidth: 0.1 },
      });
      ctx.y = (doc as any).lastAutoTable.finalY + L.SECTION_SP;
    }
  }

  // ── Disclaimer ───────────────────────────────────────────────────────────
  needsPage(ctx, 36);
  ctx.doc.setFillColor(...C.ultraLight);
  ctx.doc.roundedRect(margin, ctx.y, contentW, 32, L.BOX_R, L.BOX_R, 'F');
  setFont(ctx.doc, 6.5, 'italic', C.muted);
  const dLines = ctx.doc.splitTextToSize(t.disclaimer, contentW - 10);
  ctx.doc.text(dLines, margin + 5, ctx.y + 8);

  // ── Footers (all pages) ──────────────────────────────────────────────────
  addFooters(doc, W, H, lang);

  const fileName = `AlphaData_${getTypeName(data.type, lang)}_${(data.period || new Date().toISOString().split('T')[0]).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

/* ═══════════════════════════════════════════════════════════════════════════
   DOCX GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  const children: any[] = [];
  const lang = data.language || 'pt';
  const t = getDocumentTranslation(lang);
  const locale = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'pt-AO';

  // Title
  children.push(
    new Paragraph({
      text: data.title || `${t.report} AlphaData`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${t.docxPeriod}: ${data.period || t.notAvailable}   |   `, color: '64748B', size: 20 }),
        new TextRun({ text: `${t.docxGeneratedAt}: ${safeDate(data.generatedAt).toLocaleDateString(locale)}`, color: '64748B', size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Render markdown blocks for summary
  if (data.summary) {
    children.push(new Paragraph({ text: t.executiveSummary, heading: HeadingLevel.HEADING_1 }));

    const blocks = parseMarkdown(data.summary);
    for (const block of blocks) {
      if (block.kind === 'blank') continue;
      if (block.kind === 'h1') {
        children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_1 }));
      } else if (block.kind === 'h2') {
        children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_2 }));
      } else if (block.kind === 'h3') {
        children.push(new Paragraph({ text: block.text, heading: HeadingLevel.HEADING_3 }));
      } else if (block.kind === 'bullet') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 20 })],
            bullet: { level: block.indent - 1 },
          })
        );
      } else if (block.kind === 'numbered') {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 20 })],
            numbering: { reference: 'default-numbering', level: 0 },
          })
        );
      } else {
        // paragraph
        children.push(
          new Paragraph({
            children: [new TextRun({ text: block.text, size: 20 })],
            spacing: { after: 120 },
          })
        );
      }
    }
  }

  // Tables from content
  const cd = data.content?.data;
  if (cd?.production && Array.isArray(cd.production) && cd.production.length > 0) {
    children.push(new Paragraph({ text: t.productionData, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
    const headerRow = new TableRow({
      children: [t.operator, t.block, t.field, t.productionBpd, t.status].map(h =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })] })],
          shading: { fill: '0A0A0A' },
        })
      ),
    });
    const dataRows = cd.production.slice(0, 20).map((r: any) =>
      new TableRow({
        children: [
          r.operator || '-',
          r.block || '-',
          r.field || '-',
          r.daily_production ? `${(r.daily_production / 1000).toFixed(0)}K` : '-',
          r.status || '-',
        ].map(val =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(val), size: 18 })] })],
          })
        ),
      })
    );
    children.push(new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AlphaData_${getTypeName(data.type, lang)}_${(data.period || 'relatorio').replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXCEL GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

export const generateExcelReport = (data: ReportData): void => {
  const esc = (s: string) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const defaultCover = getDefaultCoverPageData();
  const coverData: CoverPageData = {
    ...defaultCover,
    reportTitle: data.title || 'Relatório AlphaData',
    reportType: getTypeName(data.type),
    reportPeriod: data.period || 'Actual',
    generatedAt: safeDate(data.generatedAt),
    isAiGenerated: data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
  };

  const coverRows = getCoverPageExcelRows(coverData);

  // Build data worksheet rows
  const dataRows: string[] = [];
  const cd = data.content?.data;

  if (cd?.production && Array.isArray(cd.production)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Operador</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Bloco</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Campo</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Producao (bpd)</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Status</Data></Cell></Row>`);
    cd.production.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.operator||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.block||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.field||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.daily_production||0}</Data></Cell><Cell><Data ss:Type="String">${esc(r.status||'-')}</Data></Cell></Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.prices && Array.isArray(cd.prices)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tipo Crude</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Preco USD</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Variacao %</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Data</Data></Cell></Row>`);
    cd.prices.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.crude_type||r.type||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.price||0}</Data></Cell><Cell><Data ss:Type="Number">${r.change_percent||0}</Data></Cell><Cell><Data ss:Type="String">${r.data_date ? new Date(r.data_date).toLocaleDateString('pt-AO') : '-'}</Data></Cell></Row>`);
    });
    dataRows.push(`<Row></Row>`);
  }

  if (cd?.exports && Array.isArray(cd.exports)) {
    dataRows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Destino</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Volume (bbl)</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tanque</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Status</Data></Cell></Row>`);
    cd.exports.forEach((r: any) => {
      dataRows.push(`<Row><Cell><Data ss:Type="String">${esc(r.destination||r.country||'-')}</Data></Cell><Cell><Data ss:Type="Number">${r.volume||0}</Data></Cell><Cell><Data ss:Type="String">${esc(r.tanker_name||'-')}</Data></Cell><Cell><Data ss:Type="String">${esc(r.status||'-')}</Data></Cell></Row>`);
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="brand"><Font ss:Bold="1" ss:Size="18" ss:Color="#DC2626"/><Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/></Style>
    <Style ss:ID="subheader"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/></Style>
    <Style ss:ID="tableHeader"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/><Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/></Style>
    <Style ss:ID="bold"><Font ss:Bold="1"/></Style>
    <Style ss:ID="footer"><Font ss:Italic="1" ss:Size="9" ss:Color="#64748B"/></Style>
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
  const d = { ...data, language };
  if (format === 'pdf') return generatePDFReport(d);
  if (format === 'docx') return generateDOCXReport(d);
  generateExcelReport(d);
};