/**
 * Cover page generator for reports — DARK THEME REDESIGN
 * All reports are in European Portuguese only.
 */

import jsPDF from 'jspdf';
import { DocumentLanguageCode } from '@/i18n';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RGBColor = [number, number, number];

export interface CoverPageData {
  generatingCompany: {
    name: string;
    fullName: string;
    description: string;
    contact: string;
    website: string;
    address: string;
  };
  dataSources: DataSource[];
  countryInfo: {
    name: string;
    region: string;
    currency: string;
    language: string;
    timezone: string;
  };
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
  reportTitle: string;
  reportType: string;
  reportPeriod: string;
  generatedAt: Date;
  isAiGenerated: boolean;
  logoBase64?: string;
  language?: DocumentLanguageCode;
}

export interface DataSource {
  name: string;
  type: string;
  description: string;
}

// ============================================================================
// DARK THEME DESIGN TOKENS
// ============================================================================

const C = {
  pageBg:      [10,  14,  26]  as RGBColor,  // #0A0E1A
  surface:     [13,  17,  23]  as RGBColor,  // #0D1117
  border:      [30,  42,  58]  as RGBColor,  // #1E2A3A
  accentBlue:  [0,   163, 255] as RGBColor,  // #00A3FF
  accentAmber: [245, 166, 35]  as RGBColor,  // #F5A623
  accentGreen: [0,   212, 170] as RGBColor,  // #00D4AA
  accentRed:   [255, 59,  48]  as RGBColor,  // #FF3B30
  textPrimary: [232, 237, 245] as RGBColor,  // #E8EDF5
  textSecondary:[107, 122, 153] as RGBColor, // #6B7A99
  textMuted:   [61,  79,  107] as RGBColor,  // #3D4F6B
  white:       [255, 255, 255] as RGBColor,
  brand:       [220, 38,  38]  as RGBColor,  // #DC2626 AlphaData red
} as const;

const LAYOUT = {
  MARGIN: 20,
  FOOTER_HEIGHT: 28,
} as const;

// ============================================================================
// PORTUGUESE-ONLY TRANSLATIONS
// ============================================================================

const T = {
  INTELLIGENCE: 'INTELIGENCIA DO MERCADO PETROLIFERO',
  AI_BADGE: 'GERADO POR IA',
  REPORT_LABEL: 'RELATORIO ALPHADATA',
  TYPE: 'TIPO',
  PERIOD: 'PERIODO',
  GENERATED_AT: 'GERADO EM',
  LIVE_DATA: 'DADOS EM TEMPO REAL',
  GENERATING_COMPANY: 'ENTIDADE GERADORA',
  COUNTRY_INFO: 'INFORMACOES DO PAIS',
  COUNTRY: 'Pais:',
  REGION: 'Regiao:',
  CURRENCY: 'Moeda:',
  TIMEZONE: 'Fuso:',
  REQUESTING_COMPANY: 'EMPRESA SOLICITANTE',
  REQUESTED_BY: 'SOLICITADO POR',
  COMPANY: 'Empresa:',
  NIF: 'NIF:',
  SECTOR: 'Sector:',
  NAME: 'Nome:',
  ROLE: 'Cargo:',
  EMAIL: 'Email:',
  CONFIDENTIAL: 'CONFIDENCIAL - USO INTERNO',
  CONFIDENTIAL_NOTICE: 'Este documento contem informacoes confidenciais. A sua distribuicao esta restrita a destinatarios autorizados.',
  DATA_SOURCES: 'FONTES DE DADOS',
  DATA_SOURCES_TITLE: 'Fontes de Dados e Referencias',
  DATA_SOURCES_INTRO: 'Este relatorio baseia-se em multiplas fontes de dados verificadas e confiaveis para garantir a precisao e integridade das analises apresentadas.',
  DATA_QUALITY_TITLE: 'NOTA SOBRE QUALIDADE DOS DADOS',
  DATA_QUALITY_NOTE: 'Todas as fontes de dados sao verificadas e atualizadas regularmente para garantir precisao e confiabilidade nas analises.',
  TAGLINE: 'Inteligencia de Mercado Petrolifero Angolano',
  PAGE: 'Pagina',
  OF: 'de',
  SOURCE: 'Fonte',
  SOURCE_TYPE: 'Tipo',
  SOURCE_DESC: 'Descricao',
  REPORT_INFO: 'INFORMACOES DO RELATORIO',
  TITLE_LABEL: 'Titulo:',
  METHOD: 'Metodo:',
  AI_METHOD: 'Gerado com Inteligencia Artificial',
};

const DATA_SOURCES: DataSource[] = [
  { name: 'BPEP - Bureau de Pesquisa Energetica e Petrolifera', type: 'Oficial', description: 'Dados oficiais de producao e exportacao do sector petrolifero angolano' },
  { name: 'ANP - Agencia Nacional do Petroleo', type: 'Regulador', description: 'Informacoes regulatorias e licenciamento de operacoes' },
  { name: 'Ministerio dos Recursos Minerais e Petroleo', type: 'Governamental', description: 'Politicas e directivas do sector energetico' },
  { name: 'APIs de Mercado Internacional', type: 'Mercado', description: 'Cotacoes Brent, WTI e futuros de petroleo em tempo real' },
  { name: 'AlphaData AI Engine', type: 'IA', description: 'Modelos proprietarios de previsao e analise de tendencias' },
];

// ============================================================================
// UTILITIES
// ============================================================================

const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
};

const setStyle = (doc: jsPDF, size: number, weight: 'normal' | 'bold' | 'italic', color: RGBColor): void => {
  doc.setFontSize(size);
  doc.setFont('helvetica', weight);
  doc.setTextColor(...color);
};

const formatDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} de ${month} de ${year} as ${hours}:${minutes}`;
};

const formatDateShort = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} WAT`;
};

const validateCoverPageData = (data: CoverPageData): void => {
  if (!data) throw new Error('Cover page data is required');
  if (!data.reportTitle?.trim()) throw new Error('Report title is required');
  if (!data.reportType?.trim()) throw new Error('Report type is required');
  if (!data.generatedAt || !(data.generatedAt instanceof Date)) throw new Error('Generated date must be a valid Date object');
  if (!data.generatingCompany?.name) throw new Error('Generating company name is required');
};

// ============================================================================
// DEFAULT DATA
// ============================================================================

export const getDefaultCoverPageData = (lang: DocumentLanguageCode = 'pt'): Omit<CoverPageData, 'reportTitle' | 'reportType' | 'reportPeriod' | 'generatedAt' | 'isAiGenerated'> => {
  return {
    generatingCompany: {
      name: 'AlphaData',
      fullName: 'AlphaData - Inteligencia de Mercado Petrolifero Angolano',
      description: 'Plataforma lider em analise de dados e inteligencia artificial para o sector petrolifero de Angola. Fornecemos insights estrategicos, previsoes de mercado e analises de risco em tempo real.',
      contact: 'info@alphadata.ao',
      website: 'www.alphadata.ao',
      address: 'Luanda, Angola',
    },
    dataSources: DATA_SOURCES,
    countryInfo: {
      name: 'Republica de Angola',
      region: 'Africa Subsaariana',
      currency: 'Kwanza (AOA)',
      language: 'Portugues',
      timezone: 'WAT (UTC+1)',
    },
    language: 'pt',
  };
};

// ============================================================================
// COVER PAGE — DARK THEME
// ============================================================================

const renderCoverPage = (doc: jsPDF, data: CoverPageData): void => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = LAYOUT.MARGIN;

  // === Full dark background ===
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, W, H, 'F');

  // === Top gradient bar (4px) ===
  const barH = 1.5;
  // Blue → Green → Amber gradient (approximated with 3 segments)
  const segW = W / 3;
  doc.setFillColor(...C.accentBlue);
  doc.rect(0, 0, segW, barH, 'F');
  doc.setFillColor(...C.accentGreen);
  doc.rect(segW, 0, segW, barH, 'F');
  doc.setFillColor(...C.accentAmber);
  doc.rect(segW * 2, 0, segW, barH, 'F');

  // === HEADER: Logo + Tagline + AI Badge ===
  let y = 14;

  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, 'PNG', m, y, 18, 18);
      setStyle(doc, 22, 'bold', C.textPrimary);
      doc.text('ALPHADATA', m + 22, y + 12);
    } catch {
      setStyle(doc, 36, 'bold', C.accentBlue);
      doc.text('A', m, y + 15);
      setStyle(doc, 22, 'bold', C.textPrimary);
      doc.text('ALPHADATA', m + 18, y + 15);
    }
  } else {
    setStyle(doc, 36, 'bold', C.accentBlue);
    doc.text('A', m, y + 15);
    setStyle(doc, 22, 'bold', C.textPrimary);
    doc.text('ALPHADATA', m + 18, y + 15);
  }

  // Tagline below logo
  setStyle(doc, 7, 'normal', C.textSecondary);
  doc.text(T.INTELLIGENCE, m, y + 24);

  // AI Badge (top right)
  if (data.isAiGenerated) {
    const badgeText = T.AI_BADGE;
    const badgeW = doc.getTextWidth(badgeText) + 14;
    const badgeX = W - m - badgeW;
    doc.setFillColor(0, 30, 50);
    doc.roundedRect(badgeX, y + 2, badgeW, 10, 5, 5, 'F');
    doc.setDrawColor(...C.accentBlue);
    doc.setLineWidth(0.3);
    doc.roundedRect(badgeX, y + 2, badgeW, 10, 5, 5, 'S');
    setStyle(doc, 7, 'bold', C.accentBlue);
    doc.text(badgeText, badgeX + 7, y + 9);
  }

  // === HERO SECTION ===
  y = 58;

  // Report label with blue left border
  doc.setFillColor(...C.accentBlue);
  doc.rect(m, y, 1.2, 7, 'F');
  setStyle(doc, 7.5, 'normal', C.textSecondary);
  doc.text(T.REPORT_LABEL, m + 5, y + 5);

  // Main title
  y += 16;
  setStyle(doc, 28, 'bold', C.textPrimary);
  const titleLines = doc.splitTextToSize(sanitizeText(data.reportTitle), W - 2 * m);
  doc.text(titleLines, m, y);
  y += titleLines.length * 12;

  // Subtitle (period + location)
  y += 4;
  setStyle(doc, 11, 'normal', C.textSecondary);
  doc.text(sanitizeText(data.reportPeriod) + '  ·  Angola  ·  Bacia do Congo', m, y);

  // Blue divider line
  y += 10;
  doc.setFillColor(...C.accentBlue);
  doc.rect(m, y, 25, 1.2, 'F');

  // === META CARD ===
  y += 12;
  const metaCardH = 22;
  doc.setFillColor(...C.surface);
  doc.roundedRect(m, y, W - 2 * m, metaCardH, 4, 4, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, W - 2 * m, metaCardH, 4, 4, 'S');

  const col1X = m + 8;
  const col2X = m + 60;
  const col3X = m + 115;
  const metaLabelY = y + 8;
  const metaValueY = y + 15;

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.TYPE, col1X, metaLabelY);
  setStyle(doc, 8, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.reportType), col1X, metaValueY);

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.PERIOD, col2X, metaLabelY);
  setStyle(doc, 8, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.reportPeriod) || 'Actual', col2X, metaValueY);

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.GENERATED_AT, col3X, metaLabelY);
  setStyle(doc, 8, 'normal', C.textPrimary);
  doc.text(formatDateShort(data.generatedAt), col3X, metaValueY);

  // Live indicator (right side of card)
  const liveX = W - m - 42;
  doc.setFillColor(...C.accentGreen);
  doc.circle(liveX, y + 11, 1.5, 'F');
  setStyle(doc, 6, 'bold', C.accentGreen);
  doc.text(T.LIVE_DATA, liveX + 4, y + 12.5);

  // === COMPANY SECTION ===
  y += metaCardH + 12;
  doc.setFillColor(...C.accentBlue);
  doc.rect(m, y, 1.5, 10, 'F');
  setStyle(doc, 7, 'bold', C.textSecondary);
  doc.text(T.GENERATING_COMPANY, m + 6, y + 4);
  setStyle(doc, 12, 'bold', C.textPrimary);
  doc.text('AlphaData', m + 6, y + 12);

  y += 16;
  setStyle(doc, 8, 'normal', C.textSecondary);
  const descLines = doc.splitTextToSize(sanitizeText(data.generatingCompany.description), W - 2 * m - 6);
  doc.text(descLines, m + 6, y);
  y += descLines.length * 4 + 4;

  setStyle(doc, 7, 'normal', C.textMuted);
  doc.text(
    `${sanitizeText(data.generatingCompany.contact)}  ·  ${sanitizeText(data.generatingCompany.website)}  ·  ${sanitizeText(data.generatingCompany.address)}`,
    m + 6, y
  );

  // === COUNTRY INFO CARD ===
  y += 12;
  const countryCardH = 20;
  doc.setFillColor(...C.surface);
  doc.roundedRect(m, y, W - 2 * m, countryCardH, 4, 4, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(m, y, W - 2 * m, countryCardH, 4, 4, 'S');

  const ciY1 = y + 8;
  const ciY2 = y + 15;

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.COUNTRY, col1X, ciY1);
  setStyle(doc, 7.5, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.countryInfo.name), col1X + 16, ciY1);

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.REGION, col2X, ciY1);
  setStyle(doc, 7.5, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.countryInfo.region), col2X + 18, ciY1);

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.CURRENCY, col1X, ciY2);
  setStyle(doc, 7.5, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.countryInfo.currency), col1X + 18, ciY2);

  setStyle(doc, 6, 'bold', C.textSecondary);
  doc.text(T.TIMEZONE, col2X, ciY2);
  setStyle(doc, 7.5, 'normal', C.textPrimary);
  doc.text(sanitizeText(data.countryInfo.timezone), col2X + 14, ciY2);

  y += countryCardH;

  // === REQUESTING COMPANY ===
  if (data.requestingCompany) {
    y += 10;
    doc.setFillColor(...C.surface);
    doc.roundedRect(m, y, W - 2 * m, 18, 4, 4, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, W - 2 * m, 18, 4, 4, 'S');

    setStyle(doc, 6, 'bold', C.textSecondary);
    doc.text(T.REQUESTING_COMPANY, col1X, y + 6);
    setStyle(doc, 8, 'normal', C.textPrimary);
    doc.text(sanitizeText(data.requestingCompany.name), col1X, y + 13);

    if (data.requestingCompany.nif) {
      setStyle(doc, 6, 'bold', C.textSecondary);
      doc.text(T.NIF, col2X + 20, y + 6);
      setStyle(doc, 8, 'normal', C.textPrimary);
      doc.text(sanitizeText(data.requestingCompany.nif), col2X + 20, y + 13);
    }
    y += 18;
  }

  // === REQUESTED BY ===
  if (data.requestedBy) {
    y += 6;
    doc.setFillColor(...C.surface);
    doc.roundedRect(m, y, W - 2 * m, 14, 4, 4, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, W - 2 * m, 14, 4, 4, 'S');

    setStyle(doc, 6, 'bold', C.textSecondary);
    doc.text(T.REQUESTED_BY, col1X, y + 6);
    setStyle(doc, 8, 'normal', C.textPrimary);
    doc.text(sanitizeText(data.requestedBy.name), col1X + 32, y + 6);

    if (data.requestedBy.role) {
      setStyle(doc, 6, 'bold', C.textSecondary);
      doc.text(T.ROLE, col2X + 20, y + 6);
      setStyle(doc, 8, 'normal', C.textPrimary);
      doc.text(sanitizeText(data.requestedBy.role), col2X + 36, y + 6);
    }
    y += 14;
  }

  // === BOTTOM FOOTER BAR ===
  const footerY = H - LAYOUT.FOOTER_HEIGHT;
  doc.setFillColor(...C.surface);
  doc.rect(0, footerY, W, LAYOUT.FOOTER_HEIGHT, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, W, footerY);

  setStyle(doc, 7, 'normal', C.textMuted);
  doc.text('AlphaData  ·  Inteligencia de Mercado', m, footerY + 10);

  setStyle(doc, 7, 'normal', C.textMuted);
  doc.text(T.CONFIDENTIAL, W - m - 50, footerY + 10);
};

// ============================================================================
// DATA SOURCES PAGE — DARK THEME
// ============================================================================

const renderDataSourcesPage = (doc: jsPDF, data: CoverPageData): void => {
  doc.addPage();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = LAYOUT.MARGIN;

  // Dark background
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, W, H, 'F');

  // Header bar
  doc.setFillColor(...C.surface);
  doc.rect(0, 0, W, 50, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(0, 50, W, 50);

  if (data.logoBase64) {
    try {
      doc.addImage(data.logoBase64, 'PNG', m, 12, 14, 14);
      setStyle(doc, 18, 'bold', C.textPrimary);
      doc.text('ALPHADATA', m + 18, 23);
    } catch {
      setStyle(doc, 18, 'bold', C.textPrimary);
      doc.text('ALPHADATA', m, 23);
    }
  } else {
    setStyle(doc, 18, 'bold', C.textPrimary);
    doc.text('ALPHADATA', m, 23);
  }

  setStyle(doc, 9, 'normal', C.textSecondary);
  doc.text(T.DATA_SOURCES_TITLE, m, 38);

  let y = 65;

  // Section title
  doc.setFillColor(...C.accentBlue);
  doc.rect(m, y, 1.5, 10, 'F');
  setStyle(doc, 10, 'bold', C.textPrimary);
  doc.text(T.DATA_SOURCES, m + 6, y + 7);
  y += 18;

  // Intro text
  setStyle(doc, 8, 'normal', C.textSecondary);
  const introLines = doc.splitTextToSize(T.DATA_SOURCES_INTRO, W - 2 * m);
  doc.text(introLines, m, y);
  y += introLines.length * 4.5 + 10;

  // Data source cards
  const sources = data.dataSources || DATA_SOURCES;
  sources.forEach((source, index) => {
    const cardH = 26;
    if (y + cardH + 8 > H - LAYOUT.FOOTER_HEIGHT - m) {
      doc.addPage();
      doc.setFillColor(...C.pageBg);
      doc.rect(0, 0, W, H, 'F');
      y = m;
    }

    doc.setFillColor(...C.surface);
    doc.roundedRect(m, y, W - 2 * m, cardH, 4, 4, 'F');
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(m, y, W - 2 * m, cardH, 4, 4, 'S');

    // Number badge
    const badgeX = m + 10;
    const badgeY = y + 13;
    doc.setFillColor(...C.accentBlue);
    doc.circle(badgeX, badgeY, 6, 'F');
    setStyle(doc, 8, 'bold', C.white);
    doc.text(`${index + 1}`, badgeX, badgeY + 2.5, { align: 'center' });

    // Source name
    setStyle(doc, 9, 'bold', C.textPrimary);
    doc.text(sanitizeText(source.name), m + 22, y + 10);

    // Type badge
    const typeText = `[${sanitizeText(source.type)}]`;
    const typeWidth = doc.getTextWidth(typeText) + 8;
    const typeBadgeX = W - m - typeWidth - 6;
    doc.setFillColor(...C.accentBlue);
    doc.roundedRect(typeBadgeX, y + 4, typeWidth, 9, 2, 2, 'F');
    setStyle(doc, 6.5, 'bold', C.white);
    doc.text(typeText, typeBadgeX + 4, y + 10);

    // Description
    setStyle(doc, 7.5, 'normal', C.textSecondary);
    doc.text(sanitizeText(source.description), m + 22, y + 19);

    y += cardH + 6;
  });

  // Quality note
  y += 6;
  doc.setFillColor(0, 30, 50);
  doc.roundedRect(m, y, W - 2 * m, 22, 4, 4, 'F');

  setStyle(doc, 7.5, 'bold', C.accentBlue);
  doc.text(T.DATA_QUALITY_TITLE, m + 8, y + 8);
  setStyle(doc, 7, 'normal', C.textSecondary);
  const noteLines = doc.splitTextToSize(T.DATA_QUALITY_NOTE, W - 2 * m - 16);
  doc.text(noteLines, m + 8, y + 15);

  // Footer
  const footerY = H - LAYOUT.FOOTER_HEIGHT;
  doc.setFillColor(...C.surface);
  doc.rect(0, footerY, W, LAYOUT.FOOTER_HEIGHT, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, W, footerY);

  setStyle(doc, 7, 'normal', C.textMuted);
  doc.text('AlphaData  ·  Inteligencia de Mercado', m, footerY + 10);
  doc.text(T.CONFIDENTIAL, W - m - 50, footerY + 10);
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const addCoverPageToPDF = (doc: jsPDF, data: CoverPageData): void => {
  try {
    validateCoverPageData(data);

    doc.setProperties({
      title: sanitizeText(data.reportTitle),
      subject: sanitizeText(data.reportType),
      author: sanitizeText(data.generatingCompany.name),
      keywords: 'AlphaData, Oil, Angola, Report',
      creator: 'AlphaData Platform',
    });

    renderCoverPage(doc, data);
    renderDataSourcesPage(doc, data);

  } catch (error) {
    console.error('Error generating cover page:', error);
    throw new Error(`Failed to generate cover page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================================================
// DOCX & EXCEL EXPORTS
// ============================================================================

export const getCoverPageDOCXContent = (data: CoverPageData) => {
  validateCoverPageData(data);
  return {
    title: data.reportTitle,
    type: data.reportType,
    period: data.reportPeriod,
    generatedAt: data.generatedAt,
    isAiGenerated: data.isAiGenerated,
    generatingCompany: data.generatingCompany,
    dataSources: data.dataSources,
    countryInfo: data.countryInfo,
    requestingCompany: data.requestingCompany,
    requestedBy: data.requestedBy,
  };
};

const escapeXml = (str: string): string => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
};

const addExcelRow = (styleId: string, label: string, value?: string, isHeader: boolean = false): string => {
  if (isHeader) return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
  if (value !== undefined) return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell></Row>`;
  return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
};

const addExcelSeparator = (): string => `<Row></Row>`;
const addExcelDivider = (styleId: string = 'brand'): string => `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">===============================================================</Data></Cell></Row>`;

export const getCoverPageExcelRows = (data: CoverPageData): string[] => {
  validateCoverPageData(data);
  const rows: string[] = [];

  rows.push(addExcelDivider());
  rows.push(addExcelRow('brand', `ALPHADATA - PAGINA INFORMATIVA`, undefined, true));
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.GENERATING_COMPANY, undefined, true));
  rows.push(addExcelRow('bold', T.NAME, data.generatingCompany.fullName));
  rows.push(addExcelRow('bold', 'Descricao:', data.generatingCompany.description));
  rows.push(addExcelRow('bold', 'Contacto:', data.generatingCompany.contact));
  rows.push(addExcelRow('bold', 'Website:', data.generatingCompany.website));
  rows.push(addExcelRow('bold', 'Endereco:', data.generatingCompany.address));
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.DATA_SOURCES, undefined, true));
  rows.push(`<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE_TYPE}</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">${T.SOURCE_DESC}</Data></Cell></Row>`);
  (data.dataSources || DATA_SOURCES).forEach((source) => {
    rows.push(`<Row><Cell><Data ss:Type="String">${escapeXml(source.name)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.type)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.description)}</Data></Cell></Row>`);
  });
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', T.COUNTRY_INFO, undefined, true));
  rows.push(addExcelRow('bold', T.COUNTRY, data.countryInfo.name));
  rows.push(addExcelRow('bold', T.REGION, data.countryInfo.region));
  rows.push(addExcelRow('bold', T.CURRENCY, data.countryInfo.currency));
  rows.push(addExcelRow('bold', T.TIMEZONE, data.countryInfo.timezone));
  rows.push(addExcelSeparator());

  if (data.requestingCompany) {
    rows.push(addExcelRow('subheader', T.REQUESTING_COMPANY, undefined, true));
    rows.push(addExcelRow('bold', T.COMPANY, data.requestingCompany.name));
    if (data.requestingCompany.nif) rows.push(addExcelRow('bold', T.NIF, data.requestingCompany.nif));
    if (data.requestingCompany.sector) rows.push(addExcelRow('bold', T.SECTOR, data.requestingCompany.sector));
    rows.push(addExcelSeparator());
  }

  if (data.requestedBy) {
    rows.push(addExcelRow('subheader', T.REQUESTED_BY, undefined, true));
    rows.push(addExcelRow('bold', T.NAME, data.requestedBy.name));
    if (data.requestedBy.role) rows.push(addExcelRow('bold', T.ROLE, data.requestedBy.role));
    if (data.requestedBy.email) rows.push(addExcelRow('bold', T.EMAIL, data.requestedBy.email));
    rows.push(addExcelSeparator());
  }

  rows.push(addExcelRow('subheader', T.REPORT_INFO, undefined, true));
  rows.push(addExcelRow('bold', T.TITLE_LABEL, data.reportTitle));
  rows.push(addExcelRow('bold', 'Tipo:', data.reportType));
  rows.push(addExcelRow('bold', 'Periodo:', data.reportPeriod || 'Actual'));
  rows.push(addExcelRow('bold', 'Gerado:', formatDateTime(data.generatedAt)));
  if (data.isAiGenerated) {
    rows.push(addExcelRow('bold', T.METHOD, T.AI_METHOD));
  }
  rows.push(addExcelSeparator());
  rows.push(addExcelDivider());
  rows.push(addExcelRow('footer', 'FIM DA PAGINA INFORMATIVA - INICIO DO CONTEUDO DO RELATORIO', undefined, true));
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());

  return rows;
};
