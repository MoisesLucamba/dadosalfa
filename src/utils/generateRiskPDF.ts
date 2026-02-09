/**
 * PDF Report Generator for Geopolitical and Risk Analysis - IMPROVED VERSION
 * Professional formatting, proper markdown parsing, page overflow prevention
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RGBColor = [number, number, number];

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

export interface PDFData {
  riskScores: RiskScore[];
  alerts: RiskAlert[];
  countryRisks: CountryRisk[];
  geopoliticalForecasts: GeopoliticalForecast[];
  globalRiskIndex: number;
  simulationParams?: SimulationParams;
  simulationResults?: SimulationResults;
  lastUpdated?: string;
}

interface PDFContext {
  doc: jsPDF;
  yPos: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
}

// ============================================================================
// IMPROVED COLORS & LAYOUT
// ============================================================================

const COLORS = {
  primary: [30, 64, 175] as RGBColor,
  success: [34, 197, 94] as RGBColor,
  warning: [234, 179, 8] as RGBColor,
  danger: [239, 68, 68] as RGBColor,
  dark: [15, 23, 42] as RGBColor,
  darkGray: [51, 65, 85] as RGBColor,
  muted: [100, 116, 139] as RGBColor,
  mediumGray: [148, 163, 184] as RGBColor,
  lightGray: [203, 213, 225] as RGBColor,
  light: [241, 245, 249] as RGBColor,
  ultraLight: [248, 250, 252] as RGBColor,
  white: [255, 255, 255] as RGBColor,
  brand: [220, 38, 38] as RGBColor,
} as const;

const LAYOUT = {
  MARGIN: 20,
  HEADER_HEIGHT: 45,
  FOOTER_HEIGHT: 22,
  SECTION_SPACING: 16,
  CARD_SPACING: 12,
  SUBSECTION_SPACING: 10,
  LINE_SPACING: 6,
  
  // Typography
  ALPHA_SYMBOL_SIZE: 32,
  TITLE_SIZE: 22,
  SUBTITLE_SIZE: 11,
  DATE_SIZE: 9,
  SECTION_TITLE_SIZE: 13,
  BODY_LARGE: 11,
  BODY_NORMAL: 10,
  BODY_SMALL: 9,
  CAPTION: 8,
  TINY: 7,
  DISCLAIMER_SIZE: 7,
  
  // Components
  RISK_CARD_HEIGHT: 28,
  DISCLAIMER_BOX_HEIGHT: 32,
  BOX_RADIUS: 6,
  SMALL_RADIUS: 3,
  SECTION_BAR_WIDTH: 5,
  SECTION_BAR_HEIGHT: 14,
  LINE_WIDTH_THICK: 2,
  LINE_WIDTH_THIN: 0.5,
} as const;

const TRANSLATIONS = {
  REPORT_TITLE: 'Relatorio de Analise Geopolitica e Riscos',
  GENERATED_AT: 'Gerado em:',
  PAGE: 'Pagina',
  OF: 'de',
  CONFIDENTIAL: 'CONFIDENCIAL - USO INTERNO',
  FOOTER_TEXT: 'AlphaData - Inteligencia de Mercado Petrolifero Angolano',
  
  EXECUTIVE_SUMMARY: 'Sumario Executivo',
  GLOBAL_RISK_INDEX: 'INDICE DE RISCO GLOBAL',
  RISK_PROFILE: 'Perfil de Risco por Categoria',
  GEOPOLITICAL_FORECASTS: 'Previsoes Geopoliticas',
  ACTIVE_ALERTS: 'Alertas Activos',
  COUNTRY_COMPARISON: 'Comparativo de Risco por Pais',
  SIMULATION_IMPACT: 'Simulacao de Impacto Regulatorio',
  SIMULATION_PARAMS: 'Parametros da Simulacao:',
  SIMULATION_RESULTS: 'Resultados da Simulacao:',
  
  CATEGORY: 'Categoria',
  SCORE: 'Score',
  TREND: 'Tendencia',
  DESCRIPTION: 'Descricao',
  TYPE: 'Tipo',
  ALERT: 'Alerta',
  REGION: 'Regiao',
  IMPACT: 'Impacto',
  COUNTRY: 'Pais',
  CLASSIFICATION: 'Classificacao',
  HORIZON: 'Horizonte',
  PREDICTION: 'Previsao',
  
  CRITICAL: 'CRITICO',
  HIGH: 'ALTO',
  MEDIUM: 'MEDIO',
  LOW: 'BAIXO',
  ELEVATED: 'ELEVADO',
  MODERATE: 'MODERADO',
  
  WARNING: 'ALERTA',
  INFO: 'INFO',
  
  CURRENT_SITUATION: 'Situacao Actual:',
  OIL_IMPACT: 'Impacto no Petroleo:',
  RISK_LABEL: 'Risco:',
  
  ROYALTY_CHANGE: 'Alteracao Royalties',
  TAX_CHANGE: 'Alteracao Impostos',
  ENVIRONMENTAL_COSTS: 'Custos Ambientais',
  OPEC_QUOTA: 'Quota OPEP+',
  BRENT_PRICE: 'Preco Brent',
  CURRENCY_DEVALUATION: 'Desvalorizacao Cambial',
  
  REVENUE_IMPACT: 'Impacto na Receita',
  COST_IMPACT: 'Impacto nos Custos',
  NET_PROFIT_IMPACT: 'Impacto no Lucro Liquido',
  EXPORT_IMPACT: 'Impacto nas Exportacoes',
  GOVERNMENT_TAKE_CHANGE: 'Alteracao Government Take',
  BREAK_EVEN_PRICE: 'Break-Even Price',
  
  DISCLAIMER: 'AVISO LEGAL: Este relatorio foi gerado pela AlphaData - Inteligencia de Mercado Petrolifero Angolano. As informacoes aqui contidas sao para fins informativos e nao constituem aconselhamento financeiro ou de investimento. A AlphaData nao se responsabiliza por decisoes tomadas com base neste documento. Todos os dados sao provenientes de fontes oficiais e APIs de mercado em tempo real.',
} as const;

// ============================================================================
// TEXT FORMATTING UTILITIES (Same as reportUtils)
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
      formatted.push({
        text: heading2Match[1],
        bold: true,
        italic: false,
        isHeading: true,
        headingLevel: 2,
        isBullet: false,
        isNumbered: false,
        indent: 0,
      });
      continue;
    }
    
    if (heading3Match) {
      formatted.push({
        text: heading3Match[1],
        bold: true,
        italic: false,
        isHeading: true,
        headingLevel: 3,
        isBullet: false,
        isNumbered: false,
        indent: 0,
      });
      continue;
    }
    
    if (boldHeadingMatch) {
      formatted.push({
        text: `${boldHeadingMatch[1]}. ${boldHeadingMatch[2]}:`,
        bold: true,
        italic: false,
        isHeading: true,
        headingLevel: 3,
        isBullet: false,
        isNumbered: true,
        indent: 0,
      });
      continue;
    }
    
    const bulletMatch = line.match(/^\*\s+(.+)$/);
    if (bulletMatch) {
      formatted.push({
        text: bulletMatch[1],
        bold: false,
        italic: false,
        isHeading: false,
        headingLevel: 0,
        isBullet: true,
        isNumbered: false,
        indent: 1,
      });
      continue;
    }
    
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      formatted.push({
        text: `${numberedMatch[1]}. ${numberedMatch[2]}`,
        bold: false,
        italic: false,
        isHeading: false,
        headingLevel: 0,
        isBullet: false,
        isNumbered: true,
        indent: 1,
      });
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
      segments.push({
        text: boldMatch[1],
        bold: true,
        italic: false,
        isHeading: false,
        headingLevel: 0,
        isBullet: false,
        isNumbered: false,
        indent: 0,
      });
      continue;
    }
    
    const italicMatch = part.match(/^\*(.+)\*$/);
    if (italicMatch) {
      segments.push({
        text: italicMatch[1],
        bold: false,
        italic: true,
        isHeading: false,
        headingLevel: 0,
        isBullet: false,
        isNumbered: false,
        indent: 0,
      });
      continue;
    }
    
    if (part.trim()) {
      segments.push({
        text: part,
        bold: false,
        italic: false,
        isHeading: false,
        headingLevel: 0,
        isBullet: false,
        isNumbered: false,
        indent: 0,
      });
    }
  }
  
  return segments;
};

const renderFormattedText = (
  ctx: PDFContext,
  segments: FormattedText[],
  maxWidth: number
): void => {
  let currentLine: { text: string; bold: boolean; italic: boolean; x: number }[] = [];
  let currentX = ctx.margin;
  
  const checkNewPage = (requiredSpace: number) => {
    if (ctx.yPos + requiredSpace > ctx.pageHeight - ctx.margin - LAYOUT.FOOTER_HEIGHT - 5) {
      ctx.doc.addPage();
      ctx.yPos = ctx.margin;
      addHeader(ctx);
    }
  };
  
  const flushLine = () => {
    if (currentLine.length === 0) return;
    
    checkNewPage(LAYOUT.LINE_SPACING + 2);
    
    currentLine.forEach(segment => {
      ctx.doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
      ctx.doc.text(segment.text, segment.x, ctx.yPos);
    });
    
    currentLine = [];
    currentX = ctx.margin;
    ctx.yPos += LAYOUT.LINE_SPACING;
  };
  
  for (const segment of segments) {
    if (segment.isHeading) {
      flushLine();
      checkNewPage(LAYOUT.SUBSECTION_SPACING + 15);
      ctx.yPos += LAYOUT.SUBSECTION_SPACING;
      
      const headingSize = segment.headingLevel === 2 ? LAYOUT.TITLE_SIZE : LAYOUT.SECTION_TITLE_SIZE;
      ctx.doc.setFontSize(headingSize);
      ctx.doc.setFont('helvetica', 'bold');
      ctx.doc.setTextColor(...COLORS.dark);
      
      const headingLines = ctx.doc.splitTextToSize(segment.text, maxWidth);
      ctx.doc.text(headingLines, ctx.margin, ctx.yPos);
      ctx.yPos += headingLines.length * (LAYOUT.LINE_SPACING + 1) + LAYOUT.SUBSECTION_SPACING;
      
      ctx.doc.setFontSize(LAYOUT.BODY_NORMAL);
      continue;
    }
    
    if (segment.isBullet) {
      flushLine();
      checkNewPage(LAYOUT.LINE_SPACING + 2);
      
      ctx.doc.setFont('helvetica', 'normal');
      ctx.doc.setTextColor(...COLORS.dark);
      ctx.doc.setFontSize(LAYOUT.BODY_NORMAL);
      
      const bulletX = ctx.margin + (segment.indent * 8);
      ctx.doc.text('•', bulletX, ctx.yPos);
      
      const textLines = ctx.doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8) - 5);
      ctx.doc.text(textLines, bulletX + 5, ctx.yPos);
      ctx.yPos += textLines.length * LAYOUT.LINE_SPACING;
      continue;
    }
    
    if (segment.isNumbered) {
      flushLine();
      checkNewPage(LAYOUT.LINE_SPACING + 2);
      
      ctx.doc.setFont('helvetica', segment.bold ? 'bold' : 'normal');
      ctx.doc.setTextColor(...COLORS.dark);
      ctx.doc.setFontSize(LAYOUT.BODY_NORMAL);
      
      const numberedX = ctx.margin + (segment.indent * 8);
      const textLines = ctx.doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8));
      ctx.doc.text(textLines, numberedX, ctx.yPos);
      ctx.yPos += textLines.length * LAYOUT.LINE_SPACING;
      continue;
    }
    
    ctx.doc.setFontSize(LAYOUT.BODY_NORMAL);
    ctx.doc.setTextColor(...COLORS.darkGray);
    ctx.doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
    
    const words = segment.text.split(' ');
    for (const word of words) {
      const wordWidth = ctx.doc.getTextWidth(word + ' ');
      
      if (currentX + wordWidth > ctx.margin + maxWidth) {
        flushLine();
      }
      
      currentLine.push({
        text: word + ' ',
        bold: segment.bold,
        italic: segment.italic,
        x: currentX,
      });
      
      currentX += wordWidth;
    }
  }
  
  flushLine();
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getRiskColor = (score: number): RGBColor => {
  if (score >= 70) return COLORS.danger;
  if (score >= 50) return COLORS.warning;
  return COLORS.success;
};

const getTrendSymbol = (trend: string): string => {
  const trendLower = trend.toLowerCase();
  if (trendLower === 'up') return '+';
  if (trendLower === 'down') return '-';
  return '=';
};

const getRiskLevelText = (level: string): string => {
  const levelLower = level.toLowerCase();
  if (levelLower === 'critical') return TRANSLATIONS.CRITICAL;
  if (levelLower === 'high') return TRANSLATIONS.HIGH;
  if (levelLower === 'medium') return TRANSLATIONS.MEDIUM;
  return TRANSLATIONS.LOW;
};

const getRiskLevelColor = (level: string): RGBColor => {
  const levelLower = level.toLowerCase();
  if (levelLower === 'critical') return COLORS.danger;
  if (levelLower === 'high') return COLORS.warning;
  return COLORS.success;
};

const getImpactText = (impact: string): string => {
  const impactLower = impact.toLowerCase();
  if (impactLower === 'high') return 'Alto';
  if (impactLower === 'medium') return 'Medio';
  return 'Baixo';
};

const getAlertTypeText = (type: string): string => {
  const typeLower = type.toLowerCase();
  if (typeLower === 'critical') return TRANSLATIONS.CRITICAL;
  if (typeLower === 'warning') return TRANSLATIONS.WARNING;
  return TRANSLATIONS.INFO;
};

const getRiskClassification = (score: number): string => {
  if (score >= 70) return TRANSLATIONS.ELEVATED;
  if (score >= 50) return TRANSLATIONS.MODERATE;
  return TRANSLATIONS.LOW;
};

const getGlobalRiskClassification = (score: number): string => {
  if (score >= 70) return TRANSLATIONS.ELEVATED;
  if (score >= 50) return TRANSLATIONS.MODERATE;
  return TRANSLATIONS.LOW;
};

const formatDate = (): string => {
  return new Date().toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(0)}`;
};

const setTextStyle = (
  doc: jsPDF,
  fontSize: number,
  fontWeight: 'normal' | 'bold' | 'italic',
  color: RGBColor
): void => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontWeight);
  doc.setTextColor(...color);
};

// ============================================================================
// PDF GENERATION FUNCTIONS
// ============================================================================

const checkNewPage = (ctx: PDFContext, requiredSpace: number): void => {
  if (ctx.yPos + requiredSpace > ctx.pageHeight - ctx.margin - LAYOUT.FOOTER_HEIGHT - 5) {
    ctx.doc.addPage();
    ctx.yPos = ctx.margin;
    addHeader(ctx);
  }
};

const addHeader = (ctx: PDFContext): void => {
  ctx.doc.setFillColor(...COLORS.dark);
  ctx.doc.rect(0, 0, ctx.pageWidth, LAYOUT.HEADER_HEIGHT, 'F');

  setTextStyle(ctx.doc, LAYOUT.ALPHA_SYMBOL_SIZE, 'bold', COLORS.brand);
  ctx.doc.text('α', ctx.margin, 26);

  setTextStyle(ctx.doc, LAYOUT.TITLE_SIZE, 'bold', COLORS.white);
  ctx.doc.text('ALPHADATA', ctx.margin + 14, 26);

  setTextStyle(ctx.doc, LAYOUT.SUBTITLE_SIZE, 'normal', COLORS.lightGray);
  ctx.doc.text(TRANSLATIONS.REPORT_TITLE, ctx.margin, 37);

  setTextStyle(ctx.doc, LAYOUT.DATE_SIZE, 'normal', COLORS.mediumGray);
  ctx.doc.text(
    `${TRANSLATIONS.GENERATED_AT} ${formatDate()}`,
    ctx.pageWidth - ctx.margin - 85,
    26
  );

  ctx.yPos = LAYOUT.HEADER_HEIGHT + 8;
};

const addFooter = (ctx: PDFContext): void => {
  const totalPages = ctx.doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    ctx.doc.setPage(i);

    ctx.doc.setFillColor(...COLORS.ultraLight);
    ctx.doc.rect(0, ctx.pageHeight - LAYOUT.FOOTER_HEIGHT, ctx.pageWidth, LAYOUT.FOOTER_HEIGHT, 'F');

    ctx.doc.setDrawColor(...COLORS.brand);
    ctx.doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
    ctx.doc.line(0, ctx.pageHeight - LAYOUT.FOOTER_HEIGHT, ctx.pageWidth, ctx.pageHeight - LAYOUT.FOOTER_HEIGHT);

    setTextStyle(ctx.doc, LAYOUT.CAPTION, 'normal', COLORS.muted);

    ctx.doc.text(TRANSLATIONS.FOOTER_TEXT, ctx.margin, ctx.pageHeight - 10);

    ctx.doc.text(
      `${TRANSLATIONS.PAGE} ${i} ${TRANSLATIONS.OF} ${totalPages}`,
      ctx.pageWidth / 2,
      ctx.pageHeight - 10,
      { align: 'center' }
    );

    ctx.doc.text(
      TRANSLATIONS.CONFIDENTIAL,
      ctx.pageWidth - ctx.margin - 48,
      ctx.pageHeight - 10
    );
  }
};

const addSectionTitle = (ctx: PDFContext, title: string): void => {
  checkNewPage(ctx, 25);

  ctx.doc.setFillColor(...COLORS.brand);
  ctx.doc.roundedRect(ctx.margin, ctx.yPos, LAYOUT.SECTION_BAR_WIDTH, LAYOUT.SECTION_BAR_HEIGHT, 1, 1, 'F');

  setTextStyle(ctx.doc, LAYOUT.SECTION_TITLE_SIZE, 'bold', COLORS.dark);
  ctx.doc.text(title, ctx.margin + 10, ctx.yPos + 10);

  ctx.yPos += 22;
};

const renderExecutiveSummary = (ctx: PDFContext, data: PDFData): void => {
  addSectionTitle(ctx, TRANSLATIONS.EXECUTIVE_SUMMARY);

  setTextStyle(ctx.doc, LAYOUT.BODY_NORMAL, 'normal', COLORS.dark);

  const classification = getGlobalRiskClassification(data.globalRiskIndex);
  const summaryText = `Este relatorio apresenta uma analise abrangente dos riscos geopoliticos, regulatorios e fiscais que afetam o setor petrolifero angolano. O Indice de Risco Global atual e de ${data.globalRiskIndex}/100, classificado como ${classification}.`;

  const splitSummary = ctx.doc.splitTextToSize(summaryText, ctx.pageWidth - 2 * ctx.margin);
  ctx.doc.text(splitSummary, ctx.margin, ctx.yPos);
  ctx.yPos += splitSummary.length * LAYOUT.LINE_SPACING + LAYOUT.CARD_SPACING;
};

const renderGlobalRiskIndex = (ctx: PDFContext, data: PDFData): void => {
  checkNewPage(ctx, LAYOUT.RISK_CARD_HEIGHT + 10);

  const riskColor = getRiskColor(data.globalRiskIndex);
  ctx.doc.setFillColor(...riskColor);
  ctx.doc.roundedRect(
    ctx.margin,
    ctx.yPos,
    ctx.pageWidth - 2 * ctx.margin,
    LAYOUT.RISK_CARD_HEIGHT,
    LAYOUT.BOX_RADIUS,
    LAYOUT.BOX_RADIUS,
    'F'
  );

  setTextStyle(ctx.doc, LAYOUT.BODY_LARGE, 'bold', COLORS.white);
  ctx.doc.text(TRANSLATIONS.GLOBAL_RISK_INDEX, ctx.margin + 10, ctx.yPos + 12);

  setTextStyle(ctx.doc, 26, 'bold', COLORS.white);
  ctx.doc.text(`${data.globalRiskIndex}/100`, ctx.pageWidth - ctx.margin - 35, ctx.yPos + 18);

  ctx.yPos += LAYOUT.RISK_CARD_HEIGHT + LAYOUT.SECTION_SPACING;
};

const renderRiskScoresTable = (ctx: PDFContext, data: PDFData): void => {
  if (!data.riskScores || data.riskScores.length === 0) return;

  addSectionTitle(ctx, TRANSLATIONS.RISK_PROFILE);

  const riskTableData = data.riskScores.map((risk) => [
    risk.category,
    `${risk.score}/100`,
    getTrendSymbol(risk.trend),
    risk.description || '-',
  ]);

  autoTable(ctx.doc, {
    startY: ctx.yPos,
    head: [[TRANSLATIONS.CATEGORY, TRANSLATIONS.SCORE, TRANSLATIONS.TREND, TRANSLATIONS.DESCRIPTION]],
    body: riskTableData,
    margin: { left: ctx.margin, right: ctx.margin },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: LAYOUT.BODY_SMALL,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: LAYOUT.CAPTION,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.ultraLight,
    },
    theme: 'plain',
    styles: {
      cellPadding: 3,
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 'auto' },
    },
  });

  ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
};

const renderGeopoliticalForecasts = (ctx: PDFContext, data: PDFData): void => {
  if (!data.geopoliticalForecasts || data.geopoliticalForecasts.length === 0) return;

  addSectionTitle(ctx, TRANSLATIONS.GEOPOLITICAL_FORECASTS);

  data.geopoliticalForecasts.forEach((forecast) => {
    checkNewPage(ctx, 65);

    const riskLevelColor = getRiskLevelColor(forecast.risk_level);

    ctx.doc.setFillColor(...riskLevelColor);
    ctx.doc.roundedRect(
      ctx.margin,
      ctx.yPos,
      ctx.pageWidth - 2 * ctx.margin,
      9,
      LAYOUT.SMALL_RADIUS,
      LAYOUT.SMALL_RADIUS,
      'F'
    );

    setTextStyle(ctx.doc, LAYOUT.BODY_NORMAL, 'bold', COLORS.white);
    ctx.doc.text(forecast.region.toUpperCase(), ctx.margin + 8, ctx.yPos + 6);

    const riskLabel = getRiskLevelText(forecast.risk_level);
    ctx.doc.text(`${TRANSLATIONS.RISK_LABEL} ${riskLabel}`, ctx.pageWidth - ctx.margin - 35, ctx.yPos + 6);

    ctx.yPos += 14;

    setTextStyle(ctx.doc, LAYOUT.BODY_SMALL, 'bold', COLORS.dark);
    ctx.doc.text(TRANSLATIONS.CURRENT_SITUATION, ctx.margin, ctx.yPos);
    ctx.yPos += 5;

    setTextStyle(ctx.doc, LAYOUT.BODY_SMALL, 'normal', COLORS.darkGray);
    const situationLines = ctx.doc.splitTextToSize(forecast.situation, ctx.pageWidth - 2 * ctx.margin);
    ctx.doc.text(situationLines, ctx.margin, ctx.yPos);
    ctx.yPos += situationLines.length * 4 + 4;

    setTextStyle(ctx.doc, LAYOUT.BODY_SMALL, 'bold', COLORS.dark);
    ctx.doc.text(TRANSLATIONS.OIL_IMPACT, ctx.margin, ctx.yPos);
    ctx.yPos += 5;

    setTextStyle(ctx.doc, LAYOUT.BODY_SMALL, 'normal', COLORS.darkGray);
    const impactLines = ctx.doc.splitTextToSize(forecast.impact_on_oil, ctx.pageWidth - 2 * ctx.margin);
    ctx.doc.text(impactLines, ctx.margin, ctx.yPos);
    ctx.yPos += impactLines.length * 4 + 4;

    autoTable(ctx.doc, {
      startY: ctx.yPos,
      head: [[TRANSLATIONS.HORIZON, TRANSLATIONS.PREDICTION]],
      body: [
        ['30 dias', forecast.prediction_30d],
        ['90 dias', forecast.prediction_90d],
      ],
      margin: { left: ctx.margin, right: ctx.margin },
      headStyles: {
        fillColor: COLORS.primary,
        fontSize: LAYOUT.CAPTION,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: LAYOUT.CAPTION,
      },
      theme: 'plain',
      styles: {
        lineColor: COLORS.lightGray,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 25 },
      },
    });

    ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.CARD_SPACING;
  });
};

const renderActiveAlerts = (ctx: PDFContext, data: PDFData): void => {
  if (!data.alerts || data.alerts.length === 0) return;

  addSectionTitle(ctx, TRANSLATIONS.ACTIVE_ALERTS);

  const alertsTableData = data.alerts.map((alert) => [
    getAlertTypeText(alert.alert_type),
    alert.title,
    alert.region || '-',
    getImpactText(alert.impact),
  ]);

  autoTable(ctx.doc, {
    startY: ctx.yPos,
    head: [[TRANSLATIONS.TYPE, TRANSLATIONS.ALERT, TRANSLATIONS.REGION, TRANSLATIONS.IMPACT]],
    body: alertsTableData,
    margin: { left: ctx.margin, right: ctx.margin },
    headStyles: {
      fillColor: COLORS.danger,
      fontSize: LAYOUT.BODY_SMALL,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: LAYOUT.CAPTION,
    },
    theme: 'plain',
    styles: {
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25, halign: 'center' },
    },
  });

  ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
};

const renderCountryRiskComparison = (ctx: PDFContext, data: PDFData): void => {
  if (!data.countryRisks || data.countryRisks.length === 0) return;

  addSectionTitle(ctx, TRANSLATIONS.COUNTRY_COMPARISON);

  const countryTableData = data.countryRisks.map((cr) => [
    cr.country,
    `${cr.score}/100`,
    getTrendSymbol(cr.trend),
    getRiskClassification(cr.score),
  ]);

  autoTable(ctx.doc, {
    startY: ctx.yPos,
    head: [[TRANSLATIONS.COUNTRY, TRANSLATIONS.SCORE, TRANSLATIONS.TREND, TRANSLATIONS.CLASSIFICATION]],
    body: countryTableData,
    margin: { left: ctx.margin, right: ctx.margin },
    headStyles: {
      fillColor: COLORS.dark,
      fontSize: LAYOUT.BODY_SMALL,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: LAYOUT.BODY_SMALL,
    },
    theme: 'plain',
    styles: {
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 38, halign: 'center' },
    },
  });

  ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
};

const renderSimulationResults = (ctx: PDFContext, data: PDFData): void => {
  if (!data.simulationParams || !data.simulationResults) return;

  ctx.doc.addPage();
  ctx.yPos = ctx.margin;
  addHeader(ctx);

  addSectionTitle(ctx, TRANSLATIONS.SIMULATION_IMPACT);

  setTextStyle(ctx.doc, LAYOUT.BODY_NORMAL, 'bold', COLORS.dark);
  ctx.doc.text(TRANSLATIONS.SIMULATION_PARAMS, ctx.margin, ctx.yPos);
  ctx.yPos += 10;

  const params = data.simulationParams;
  const paramsData = [
    [TRANSLATIONS.ROYALTY_CHANGE, formatPercentage(params.royaltyChange)],
    [TRANSLATIONS.TAX_CHANGE, formatPercentage(params.taxChange)],
    [TRANSLATIONS.ENVIRONMENTAL_COSTS, `+${params.environmentalCompliance}%`],
    [TRANSLATIONS.OPEC_QUOTA, formatPercentage(params.opepQuotaChange)],
    [TRANSLATIONS.BRENT_PRICE, `${formatCurrency(params.brentPriceScenario)}/bbl`],
    [TRANSLATIONS.CURRENCY_DEVALUATION, `+${params.currencyDevaluation}%`],
  ];

  autoTable(ctx.doc, {
    startY: ctx.yPos,
    body: paramsData,
    margin: { left: ctx.margin, right: ctx.margin },
    theme: 'plain',
    bodyStyles: {
      fontSize: LAYOUT.BODY_SMALL,
    },
    styles: {
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'right', cellWidth: 35 },
    },
  });

  ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;

  setTextStyle(ctx.doc, LAYOUT.BODY_NORMAL, 'bold', COLORS.dark);
  ctx.doc.text(TRANSLATIONS.SIMULATION_RESULTS, ctx.margin, ctx.yPos);
  ctx.yPos += 10;

  const results = data.simulationResults;
  const resultsData = [
    [TRANSLATIONS.REVENUE_IMPACT, formatPercentage(results.revenueImpact)],
    [TRANSLATIONS.COST_IMPACT, formatPercentage(results.productionCostImpact)],
    [TRANSLATIONS.NET_PROFIT_IMPACT, formatPercentage(results.netProfitImpact)],
    [TRANSLATIONS.EXPORT_IMPACT, formatPercentage(results.exportVolumeImpact)],
    [TRANSLATIONS.GOVERNMENT_TAKE_CHANGE, `${results.governmentTakeChange > 0 ? '+' : ''}${results.governmentTakeChange.toFixed(0)}pp`],
    [TRANSLATIONS.BREAK_EVEN_PRICE, `${formatCurrency(results.breakEvenPrice)}/bbl`],
  ];

  autoTable(ctx.doc, {
    startY: ctx.yPos,
    body: resultsData,
    margin: { left: ctx.margin, right: ctx.margin },
    theme: 'plain',
    bodyStyles: {
      fontSize: LAYOUT.BODY_SMALL,
    },
    styles: {
      lineColor: COLORS.lightGray,
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { halign: 'right', cellWidth: 35 },
    },
    didParseCell: function (cellData: any) {
      if (cellData.column.index === 1 && cellData.section === 'body') {
        const val = parseFloat(cellData.cell.text[0]);
        if (!isNaN(val)) {
          if (cellData.row.index === 1) {
            cellData.cell.styles.textColor = val > 0 ? COLORS.danger : COLORS.success;
          } else if (cellData.row.index < 4) {
            cellData.cell.styles.textColor = val > 0 ? COLORS.success : COLORS.danger;
          }
        }
      }
    },
  });

  ctx.yPos = (ctx.doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
};

const renderDisclaimer = (ctx: PDFContext): void => {
  checkNewPage(ctx, LAYOUT.DISCLAIMER_BOX_HEIGHT + 5);

  ctx.doc.setFillColor(...COLORS.ultraLight);
  ctx.doc.roundedRect(
    ctx.margin,
    ctx.yPos,
    ctx.pageWidth - 2 * ctx.margin,
    LAYOUT.DISCLAIMER_BOX_HEIGHT,
    LAYOUT.BOX_RADIUS,
    LAYOUT.BOX_RADIUS,
    'F'
  );

  setTextStyle(ctx.doc, LAYOUT.DISCLAIMER_SIZE, 'italic', COLORS.muted);
  const disclaimerLines = ctx.doc.splitTextToSize(TRANSLATIONS.DISCLAIMER, ctx.pageWidth - 2 * ctx.margin - 10);
  ctx.doc.text(disclaimerLines, ctx.margin + 5, ctx.yPos + 8);
};

const validatePDFData = (data: PDFData): void => {
  if (!data) {
    throw new Error('PDF data is required');
  }
  if (typeof data.globalRiskIndex !== 'number' || data.globalRiskIndex < 0 || data.globalRiskIndex > 100) {
    throw new Error('Global risk index must be a number between 0 and 100');
  }
  if (!Array.isArray(data.riskScores)) {
    throw new Error('Risk scores must be an array');
  }
  if (!Array.isArray(data.alerts)) {
    throw new Error('Alerts must be an array');
  }
  if (!Array.isArray(data.countryRisks)) {
    throw new Error('Country risks must be an array');
  }
  if (!Array.isArray(data.geopoliticalForecasts)) {
    throw new Error('Geopolitical forecasts must be an array');
  }
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export const generateRiskPDF = (data: PDFData): void => {
  try {
    validatePDFData(data);

    const doc = new jsPDF('p', 'mm', 'a4');
    const ctx: PDFContext = {
      doc,
      yPos: LAYOUT.MARGIN,
      pageWidth: doc.internal.pageSize.getWidth(),
      pageHeight: doc.internal.pageSize.getHeight(),
      margin: LAYOUT.MARGIN,
    };

    doc.setProperties({
      title: TRANSLATIONS.REPORT_TITLE,
      subject: 'Geopolitical and Risk Analysis',
      author: 'AlphaData',
      keywords: 'AlphaData, Geopolitics, Risk, Angola, Oil, Petroleum',
      creator: 'AlphaData Platform',
    });

    addHeader(ctx);
    renderExecutiveSummary(ctx, data);
    renderGlobalRiskIndex(ctx, data);
    renderRiskScoresTable(ctx, data);
    renderGeopoliticalForecasts(ctx, data);
    renderActiveAlerts(ctx, data);
    renderCountryRiskComparison(ctx, data);
    renderSimulationResults(ctx, data);
    renderDisclaimer(ctx);

    addFooter(ctx);

    const fileName = `AlphaData_Analise_Geopolitica_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating risk PDF:', error);
    throw new Error(
      `Failed to generate risk PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};