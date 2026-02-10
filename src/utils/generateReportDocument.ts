/**
 * Utility functions for generating reports in PDF, DOCX, and Excel formats
 * MODERN VERSION with charts, proper page breaks, and embedded logo
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, Header, Footer, ImageRun, PageNumber, NumberFormat } from 'docx';
import { addCoverPageToPDF, getDefaultCoverPageData, getCoverPageExcelRows, CoverPageData } from './reportCoverPage';
import { getDocumentTranslation, DocumentLanguageCode, DOCUMENT_LANGUAGES } from '@/i18n';
import { loadLogoAsBase64 } from './loadLogoForPDF';

export interface ReportData {
  title: string;
  type: string;
  period: string;
  summary?: string;
  content: any;
  highlights?: Array<{
    title: string;
    value: string;
    trend?: string;
  }>;
  generatedAt: Date;
  aiGenerated: boolean;
  requestingCompany?: {
    name: string;
    nif?: string;
    sector?: string;
    country?: string;
  };
  requestedBy?: {
    name: string;
    role?: string;
    email?: string;
  };
  language?: DocumentLanguageCode;
}

// ============================================================================
// COLORS & LAYOUT
// ============================================================================

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dark: [10, 10, 10] as [number, number, number],
  darkGray: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  mediumGray: [148, 163, 184] as [number, number, number],
  lightGray: [203, 213, 225] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  ultraLight: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  brand: [220, 38, 38] as [number, number, number],
  chartBlue: [59, 130, 246] as [number, number, number],
  chartGreen: [16, 185, 129] as [number, number, number],
  chartOrange: [249, 115, 22] as [number, number, number],
  chartPurple: [139, 92, 246] as [number, number, number],
  chartPink: [236, 72, 153] as [number, number, number],
};

const CHART_COLORS: [number, number, number][] = [
  COLORS.chartBlue,
  COLORS.brand,
  COLORS.chartGreen,
  COLORS.chartOrange,
  COLORS.chartPurple,
  COLORS.chartPink,
  COLORS.primary,
  COLORS.warning,
];

const LAYOUT = {
  MARGIN: 20,
  SECTION_SPACING: 16,
  SUBSECTION_SPACING: 10,
  LINE_SPACING: 6,
  CARD_PADDING: 10,
  TITLE_LARGE: 24,
  TITLE_MEDIUM: 18,
  TITLE_SMALL: 14,
  SECTION_TITLE: 13,
  BODY_LARGE: 11,
  BODY_NORMAL: 10,
  BODY_SMALL: 9,
  CAPTION: 8,
  HEADER_HEIGHT: 45,
  FOOTER_HEIGHT: 22,
  HIGHLIGHT_BOX_HEIGHT: 22,
  BOX_RADIUS: 6,
  SMALL_RADIUS: 3,
  LINE_WIDTH_THICK: 2,
  LINE_WIDTH_THIN: 0.5,
};

// ============================================================================
// TEXT FORMATTING UTILITIES
// ============================================================================

interface FormattedText {
  text: string;
  bold: boolean;
  italic: boolean;
  isHeading: boolean;
  headingLevel: number;
  isBullet: boolean;
  isNumbered: boolean;
  indent: number;
}

const parseMarkdownText = (text: string): FormattedText[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const formatted: FormattedText[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const heading2Match = line.match(/^##\s+(.+)$/);
    const heading3Match = line.match(/^###\s+(.+)$/);
    const boldHeadingMatch = line.match(/^\*\*(\d+)\.\s+([^:]+):\*\*$/);

    if (heading2Match) {
      formatted.push({ text: heading2Match[1], bold: true, italic: false, isHeading: true, headingLevel: 2, isBullet: false, isNumbered: false, indent: 0 });
      continue;
    }
    if (heading3Match) {
      formatted.push({ text: heading3Match[1], bold: true, italic: false, isHeading: true, headingLevel: 3, isBullet: false, isNumbered: false, indent: 0 });
      continue;
    }
    if (boldHeadingMatch) {
      formatted.push({ text: `${boldHeadingMatch[1]}. ${boldHeadingMatch[2]}:`, bold: true, italic: false, isHeading: true, headingLevel: 3, isBullet: false, isNumbered: true, indent: 0 });
      continue;
    }

    const bulletMatch = line.match(/^\*\s+(.+)$/);
    if (bulletMatch) {
      formatted.push({ text: bulletMatch[1], bold: false, italic: false, isHeading: false, headingLevel: 0, isBullet: true, isNumbered: false, indent: 1 });
      continue;
    }

    // Sub-bullets (- -)
    const subBulletMatch = line.match(/^-\s+-\s+(.+)$/);
    if (subBulletMatch) {
      formatted.push({ text: subBulletMatch[1], bold: false, italic: false, isHeading: false, headingLevel: 0, isBullet: true, isNumbered: false, indent: 2 });
      continue;
    }

    // Single dash bullets
    const dashBulletMatch = line.match(/^-\s+(.+)$/);
    if (dashBulletMatch) {
      formatted.push({ text: dashBulletMatch[1], bold: false, italic: false, isHeading: false, headingLevel: 0, isBullet: true, isNumbered: false, indent: 1 });
      continue;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      formatted.push({ text: `${numberedMatch[1]}. ${numberedMatch[2]}`, bold: false, italic: false, isHeading: false, headingLevel: 0, isBullet: false, isNumbered: true, indent: 1 });
      continue;
    }

    formatted.push(...parseInlineFormatting(line));
  }
  return formatted;
};

const parseInlineFormatting = (text: string): FormattedText[] => {
  const segments: FormattedText[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  for (const part of parts) {
    if (!part) continue;
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      segments.push({ text: boldMatch[1], bold: true, italic: false, isHeading: false, headingLevel: 0, isBullet: false, isNumbered: false, indent: 0 });
      continue;
    }
    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch) {
      segments.push({ text: italicMatch[1], bold: false, italic: true, isHeading: false, headingLevel: 0, isBullet: false, isNumbered: false, indent: 0 });
      continue;
    }
    if (part.trim()) {
      segments.push({ text: part, bold: false, italic: false, isHeading: false, headingLevel: 0, isBullet: false, isNumbered: false, indent: 0 });
    }
  }
  return segments;
};

/**
 * Render formatted text with robust page break handling
 */
const renderFormattedText = (
  doc: jsPDF,
  segments: FormattedText[],
  startX: number,
  startY: number,
  maxWidth: number,
  onNewPage?: () => void
): number => {
  let yPos = startY;
  let currentLine: { text: string; bold: boolean; italic: boolean; x: number }[] = [];
  let currentX = startX;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - LAYOUT.FOOTER_HEIGHT - LAYOUT.MARGIN - 10;

  const ensureSpace = (requiredSpace: number) => {
    if (yPos + requiredSpace > bottomLimit) {
      doc.addPage();
      yPos = LAYOUT.MARGIN;
      if (onNewPage) {
        onNewPage();
        yPos = LAYOUT.HEADER_HEIGHT + 10;
      }
    }
  };

  const flushLine = () => {
    if (currentLine.length === 0) return;
    ensureSpace(LAYOUT.LINE_SPACING + 2);
    currentLine.forEach(segment => {
      doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
      doc.text(segment.text, segment.x, yPos);
    });
    currentLine = [];
    currentX = startX;
    yPos += LAYOUT.LINE_SPACING;
  };

  for (const segment of segments) {
    if (segment.isHeading) {
      flushLine();
      ensureSpace(LAYOUT.SUBSECTION_SPACING + 18);
      yPos += LAYOUT.SUBSECTION_SPACING;

      const headingSize = segment.headingLevel === 2 ? LAYOUT.TITLE_MEDIUM : LAYOUT.TITLE_SMALL;
      doc.setFontSize(headingSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);

      // Draw accent bar for headings
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(startX, yPos - 4, 3, 10, 1, 1, 'F');

      const headingLines = doc.splitTextToSize(segment.text, maxWidth - 8);
      for (let i = 0; i < headingLines.length; i++) {
        ensureSpace(LAYOUT.LINE_SPACING + 2);
        doc.text(headingLines[i], startX + 8, yPos);
        yPos += LAYOUT.LINE_SPACING + 2;
      }
      yPos += LAYOUT.SUBSECTION_SPACING / 2;

      doc.setFontSize(LAYOUT.BODY_NORMAL);
      continue;
    }

    if (segment.isBullet) {
      flushLine();
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.darkGray);
      doc.setFontSize(LAYOUT.BODY_NORMAL);

      const bulletX = startX + (segment.indent * 8);
      const textLines = doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8) - 6);

      for (let i = 0; i < textLines.length; i++) {
        ensureSpace(LAYOUT.LINE_SPACING);
        if (i === 0) {
          doc.setFillColor(...COLORS.brand);
          doc.circle(bulletX + 1.5, yPos - 1.5, 1.2, 'F');
        }
        doc.text(textLines[i], bulletX + 6, yPos);
        yPos += LAYOUT.LINE_SPACING;
      }
      continue;
    }

    if (segment.isNumbered) {
      flushLine();
      doc.setFont('helvetica', segment.bold ? 'bold' : 'normal');
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(LAYOUT.BODY_NORMAL);

      const numberedX = startX + (segment.indent * 8);
      const textLines = doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8));

      for (let i = 0; i < textLines.length; i++) {
        ensureSpace(LAYOUT.LINE_SPACING);
        doc.text(textLines[i], numberedX, yPos);
        yPos += LAYOUT.LINE_SPACING;
      }
      continue;
    }

    // Regular paragraph text
    doc.setFontSize(LAYOUT.BODY_NORMAL);
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');

    const words = segment.text.split(' ');
    for (const word of words) {
      const wordWidth = doc.getTextWidth(word + ' ');
      if (currentX + wordWidth > startX + maxWidth) {
        flushLine();
      }
      currentLine.push({ text: word + ' ', bold: segment.bold, italic: segment.italic, x: currentX });
      currentX += wordWidth;
    }
  }

  flushLine();
  return yPos;
};

// ============================================================================
// CHART RENDERING
// ============================================================================

/**
 * Draw a horizontal bar chart for production data
 */
const drawProductionBarChart = (
  doc: jsPDF,
  data: Array<{ operator: string; daily_production: number }>,
  startX: number,
  startY: number,
  width: number,
  maxBars: number = 6
): number => {
  const chartData = data
    .sort((a, b) => b.daily_production - a.daily_production)
    .slice(0, maxBars);

  if (chartData.length === 0) return startY;

  const barHeight = 14;
  const barGap = 6;
  const labelWidth = 55;
  const chartWidth = width - labelWidth - 30;
  const maxValue = Math.max(...chartData.map(d => d.daily_production));

  let yPos = startY;

  // Chart title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Producao por Operador (bpd)', startX, yPos);
  yPos += 10;

  // Background
  doc.setFillColor(...COLORS.ultraLight);
  const chartTotalHeight = chartData.length * (barHeight + barGap) + 5;
  doc.roundedRect(startX, yPos - 3, width, chartTotalHeight, 4, 4, 'F');

  chartData.forEach((item, index) => {
    const barWidth = (item.daily_production / maxValue) * chartWidth;
    const barY = yPos + index * (barHeight + barGap);
    const color = CHART_COLORS[index % CHART_COLORS.length];

    // Operator label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.darkGray);
    const label = (item.operator || '-').substring(0, 14);
    doc.text(label, startX + 4, barY + 10);

    // Bar
    doc.setFillColor(...color);
    doc.roundedRect(startX + labelWidth, barY + 2, barWidth, barHeight - 4, 2, 2, 'F');

    // Value label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    const valueText = `${(item.daily_production / 1000).toFixed(0)}K`;
    doc.text(valueText, startX + labelWidth + barWidth + 3, barY + 10);
  });

  return yPos + chartTotalHeight + 10;
};

/**
 * Draw a simple pie/donut chart for market share
 */
const drawMarketShareDonut = (
  doc: jsPDF,
  data: Array<{ operator: string; daily_production: number }>,
  centerX: number,
  centerY: number,
  radius: number
): number => {
  const total = data.reduce((sum, d) => sum + d.daily_production, 0);
  if (total === 0) return centerY + radius + 10;

  const topData = data.sort((a, b) => b.daily_production - a.daily_production).slice(0, 6);

  let startAngle = -Math.PI / 2;

  topData.forEach((item, index) => {
    const share = item.daily_production / total;
    const endAngle = startAngle + share * 2 * Math.PI;
    const color = CHART_COLORS[index % CHART_COLORS.length];

    // Draw arc segment using line approximation
    doc.setFillColor(...color);
    const steps = Math.max(8, Math.floor(share * 40));
    const points: { x: number; y: number }[] = [{ x: centerX, y: centerY }];

    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (i / steps) * (endAngle - startAngle);
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    // Draw filled triangle fan
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(
        points[0].x, points[0].y,
        points[i].x, points[i].y,
        points[i + 1].x, points[i + 1].y,
        'F'
      );
    }

    startAngle = endAngle;
  });

  // Inner circle for donut effect
  doc.setFillColor(...COLORS.white);
  doc.circle(centerX, centerY, radius * 0.55, 'F');

  // Center text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`${(total / 1000).toFixed(0)}K`, centerX, centerY + 1, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text('bpd total', centerX, centerY + 6, { align: 'center' });

  // Legend
  let legendY = centerY + radius + 8;
  const legendX = centerX - radius;
  topData.forEach((item, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const share = ((item.daily_production / total) * 100).toFixed(1);

    doc.setFillColor(...color);
    doc.roundedRect(legendX, legendY - 3, 6, 6, 1, 1, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`${(item.operator || '-').substring(0, 16)} (${share}%)`, legendX + 9, legendY + 1);
    legendY += 8;
  });

  return legendY + 5;
};

// ============================================================================
// PDF GENERATION
// ============================================================================

const getTypeName = (type: string, lang: DocumentLanguageCode = 'pt'): string => {
  const t = getDocumentTranslation(lang);
  const types: Record<string, string> = {
    production: t.production,
    market: t.market,
    exports: t.exports,
    risk: t.risk,
    predictions: t.production + ' IA',
    general: t.general,
  };
  return types[type] || type;
};

export const generatePDFReport = async (data: ReportData): Promise<void> => {
  try {
    // Load logo
    let logoBase64: string | undefined;
    try {
      logoBase64 = await loadLogoAsBase64();
    } catch (e) {
      console.warn('Could not load logo for PDF:', e);
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = LAYOUT.MARGIN;
    let yPos = margin;

    // Cover page
    const defaultCoverData = getDefaultCoverPageData();
    const coverPageData: CoverPageData = {
      ...defaultCoverData,
      reportTitle: data.title || 'Relatório AlphaData',
      reportType: getTypeName(data.type),
      reportPeriod: data.period || 'Actual',
      generatedAt: data.generatedAt instanceof Date ? data.generatedAt : new Date(data.generatedAt),
      isAiGenerated: data.aiGenerated || false,
      requestingCompany: data.requestingCompany,
      requestedBy: data.requestedBy,
      logoBase64,
    };

    addCoverPageToPDF(doc, coverPageData);
    doc.addPage();

    const bottomLimit = pageHeight - LAYOUT.FOOTER_HEIGHT - margin - 10;

    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > bottomLimit) {
        doc.addPage();
        yPos = margin;
        addHeader();
      }
    };

    const addHeader = () => {
      doc.setFillColor(...COLORS.dark);
      doc.rect(0, 0, pageWidth, LAYOUT.HEADER_HEIGHT, 'F');

      // Logo in header
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, 8, 12, 12);
          doc.setTextColor(...COLORS.white);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('ALPHADATA', margin + 16, 18);
        } catch {
          doc.setTextColor(...COLORS.brand);
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.text('α', margin, 22);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.text('ALPHADATA', margin + 14, 22);
        }
      } else {
        doc.setTextColor(...COLORS.brand);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('α', margin, 22);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('ALPHADATA', margin + 14, 22);
      }

      // Title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.lightGray);
      const safeTitle = data.title || 'Relatório AlphaData';
      doc.text(safeTitle, margin, 34);

      // Generation info
      doc.setFontSize(8);
      let generatedDate: Date;
      try {
        generatedDate = data.generatedAt instanceof Date ? data.generatedAt : new Date(data.generatedAt);
        if (isNaN(generatedDate.getTime())) generatedDate = new Date();
      } catch {
        generatedDate = new Date();
      }
      const generatedText = `Gerado em: ${generatedDate.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      doc.text(generatedText, pageWidth - margin - 80, 22);

      if (data.aiGenerated) {
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(pageWidth - margin - 44, 28, 40, 10, 2, 2, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Gerado com IA', pageWidth - margin - 40, 34);
      }

      yPos = LAYOUT.HEADER_HEIGHT + 10;
    };

    const addFooter = () => {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        doc.setFillColor(...COLORS.ultraLight);
        doc.rect(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, LAYOUT.FOOTER_HEIGHT, 'F');

        doc.setDrawColor(...COLORS.brand);
        doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
        doc.line(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, pageHeight - LAYOUT.FOOTER_HEIGHT);

        doc.setTextColor(...COLORS.muted);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('AlphaData - Inteligencia de Mercado Petrolifero Angolano', margin, pageHeight - 10);
        doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('CONFIDENCIAL - USO INTERNO', pageWidth - margin - 45, pageHeight - 10);
      }
    };

    const addSectionTitle = (title: string) => {
      checkNewPage(25);
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(margin, yPos, 4, 14, 1, 1, 'F');
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(LAYOUT.SECTION_TITLE);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 10, yPos + 10);
      yPos += 22;
    };

    // Start document
    addHeader();

    // === EXECUTIVE SUMMARY ===
    if (data.summary) {
      addSectionTitle('Sumario Executivo');
      const formattedSegments = parseMarkdownText(data.summary);
      yPos = renderFormattedText(doc, formattedSegments, margin, yPos, pageWidth - 2 * margin, addHeader);
      yPos += LAYOUT.SECTION_SPACING;
    }

    // === CHARTS (for production data) ===
    if (data.content?.data?.production && Array.isArray(data.content.data.production) && data.content.data.production.length > 0) {
      checkNewPage(120);
      addSectionTitle('Analise Visual de Producao');

      const productionData = data.content.data.production;

      // Bar chart
      checkNewPage(100);
      yPos = drawProductionBarChart(doc, productionData, margin, yPos, pageWidth - 2 * margin, 6);

      // Donut chart
      checkNewPage(100);
      const donutCenterX = pageWidth / 2;
      yPos = drawMarketShareDonut(doc, productionData, donutCenterX, yPos + 28, 24);
      yPos += LAYOUT.SECTION_SPACING;
    }

    // === HIGHLIGHTS ===
    if (data.highlights && data.highlights.length > 0) {
      addSectionTitle('Destaques Principais');

      data.highlights.forEach((highlight) => {
        checkNewPage(LAYOUT.HIGHLIGHT_BOX_HEIGHT + 5);

        doc.setFillColor(...COLORS.white);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, LAYOUT.HIGHLIGHT_BOX_HEIGHT, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'F');
        doc.setDrawColor(...COLORS.lightGray);
        doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, LAYOUT.HIGHLIGHT_BOX_HEIGHT, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'S');

        doc.setTextColor(...COLORS.muted);
        doc.setFontSize(LAYOUT.BODY_SMALL);
        doc.setFont('helvetica', 'normal');
        doc.text(highlight.title, margin + LAYOUT.CARD_PADDING, yPos + 9);

        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(LAYOUT.TITLE_SMALL);
        doc.setFont('helvetica', 'bold');
        doc.text(highlight.value, margin + LAYOUT.CARD_PADDING, yPos + 17);

        if (highlight.trend) {
          const trendColor = highlight.trend === 'up' ? COLORS.success :
            highlight.trend === 'down' ? COLORS.danger : COLORS.muted;
          doc.setFillColor(...trendColor);
          doc.circle(pageWidth - margin - 12, yPos + 11, 5, 'F');
          doc.setTextColor(...COLORS.white);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const arrow = highlight.trend === 'up' ? '+' : highlight.trend === 'down' ? '-' : '=';
          doc.text(arrow, pageWidth - margin - 13.5, yPos + 13.5);
        }

        yPos += LAYOUT.HIGHLIGHT_BOX_HEIGHT + 8;
      });

      yPos += LAYOUT.SUBSECTION_SPACING;
    }

    // === DATA TABLES ===
    if (data.content) {
      addSectionTitle(`Dados de ${getTypeName(data.type)}`);

      if (data.content.data) {
        const contentData = data.content.data;

        // Production table
        if (contentData.production && Array.isArray(contentData.production)) {
          const maxRows = data.type === 'general' ? 10 : 15;
          const tableData = contentData.production.slice(0, maxRows).map((item: any) => [
            item.operator || '-',
            item.block || '-',
            item.field || '-',
            `${(item.daily_production / 1000).toFixed(0)}K bpd`,
            item.status || '-',
          ]);

          if (tableData.length > 0) {
            checkNewPage(80);
            autoTable(doc, {
              startY: yPos,
              head: [['Operador', 'Bloco', 'Campo', 'Producao', 'Status']],
              body: tableData,
              margin: { left: margin, right: margin },
              headStyles: {
                fillColor: COLORS.dark,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 9,
                halign: 'left',
              },
              bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
              alternateRowStyles: { fillColor: COLORS.ultraLight },
              theme: 'plain',
              styles: { cellPadding: 4, lineColor: COLORS.lightGray, lineWidth: 0.1 },
            });
            yPos = (doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
          }
        }

        // Price table
        if (contentData.prices && Array.isArray(contentData.prices)) {
          const tableData = contentData.prices.slice(0, 10).map((item: any) => [
            item.crude_type || '-',
            `$${item.price?.toFixed(2) || '0.00'}`,
            `${item.change_percent >= 0 ? '+' : ''}${item.change_percent?.toFixed(2) || '0.00'}%`,
            new Date(item.data_date).toLocaleDateString('pt-AO'),
          ]);

          if (tableData.length > 0) {
            checkNewPage(50);
            autoTable(doc, {
              startY: yPos,
              head: [['Tipo de Crude', 'Preco (USD)', 'Variacao', 'Data']],
              body: tableData,
              margin: { left: margin, right: margin },
              headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
              bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
              alternateRowStyles: { fillColor: COLORS.ultraLight },
              theme: 'plain',
              styles: { cellPadding: 4, lineColor: COLORS.lightGray, lineWidth: 0.1 },
            });
            yPos = (doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
          }
        }

        // Export table
        if (contentData.exports && Array.isArray(contentData.exports)) {
          const tableData = contentData.exports.slice(0, 10).map((item: any) => [
            item.destination || '-',
            `${(item.volume / 1000000).toFixed(2)}M bbl`,
            item.tanker_name || '-',
            item.status || '-',
          ]);

          if (tableData.length > 0) {
            checkNewPage(50);
            autoTable(doc, {
              startY: yPos,
              head: [['Destino', 'Volume', 'Tanque', 'Status']],
              body: tableData,
              margin: { left: margin, right: margin },
              headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 9 },
              bodyStyles: { fontSize: 8, textColor: COLORS.darkGray },
              alternateRowStyles: { fillColor: COLORS.ultraLight },
              theme: 'plain',
              styles: { cellPadding: 4, lineColor: COLORS.lightGray, lineWidth: 0.1 },
            });
            yPos = (doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
          }
        }
      }
    }

    // Disclaimer
    checkNewPage(35);
    doc.setFillColor(...COLORS.ultraLight);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 32, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'F');

    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'AVISO LEGAL: Este relatorio foi gerado pela AlphaData - Inteligencia de Mercado Petrolifero Angolano. As informacoes aqui contidas sao para fins informativos e nao constituem aconselhamento financeiro ou de investimento. A AlphaData nao se responsabiliza por decisoes tomadas com base neste documento. Todos os dados sao provenientes de fontes oficiais e APIs de mercado em tempo real.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 10);
    doc.text(disclaimerLines, margin + 5, yPos + 8);

    addFooter();

    const safeType = data.type || 'Relatorio';
    const safePeriod = data.period?.replace(/\s+/g, '_') || new Date().toISOString().split('T')[0];
    const fileName = `AlphaData_${getTypeName(safeType)}_${safePeriod}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      throw new Error('Relatório muito grande para gerar PDF. Tente reduzir a quantidade de dados ou use Excel.');
    }
    throw new Error(`Falha ao gerar PDF: ${errorMessage}`);
  }
};

// ============================================================================
// DOCX & EXCEL GENERATION
// ============================================================================

export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const defaultCoverData = getDefaultCoverPageData();
  const children: any[] = [];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AlphaData_${getTypeName(data.type)}_${data.period?.replace(/\s+/g, '_') || new Date().toISOString().split('T')[0]}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateExcelReport = (data: ReportData): void => {
  const escapeXml = (str: string): string => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  let rows: string[] = [];

  const defaultCoverData = getDefaultCoverPageData();
  const coverPageData: CoverPageData = {
    ...defaultCoverData,
    reportTitle: data.title || 'Relatório AlphaData',
    reportType: getTypeName(data.type),
    reportPeriod: data.period || 'Actual',
    generatedAt: data.generatedAt instanceof Date ? data.generatedAt : new Date(data.generatedAt),
    isAiGenerated: data.aiGenerated || false,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
  };

  rows.push(...getCoverPageExcelRows(coverPageData));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="brand">
      <Font ss:Bold="1" ss:Size="18" ss:Color="#DC2626"/>
      <Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="subheader">
      <Font ss:Bold="1" ss:Size="11" ss:Color="#0A0A0A"/>
      <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="tableHeader">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="bold">
      <Font ss:Bold="1"/>
    </Style>
    <Style ss:ID="footer">
      <Font ss:Italic="1" ss:Size="9" ss:Color="#64748B"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="AlphaData Report">
    <Table>
      ${rows.join('\n')}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AlphaData_${getTypeName(data.type)}_${data.period?.replace(/\s+/g, '_') || new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadReport = async (
  data: ReportData,
  format: 'pdf' | 'docx' | 'excel',
  language: DocumentLanguageCode = 'pt'
): Promise<void> => {
  const reportData = { ...data, language };

  switch (format) {
    case 'pdf':
      await generatePDFReport(reportData);
      break;
    case 'docx':
      await generateDOCXReport(reportData);
      break;
    case 'excel':
      generateExcelReport(reportData);
      break;
  }
};
