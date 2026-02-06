/**
 * Cover page generator for reports - IMPROVED VERSION
 * Professional typography, modern design, better spacing
 */

import jsPDF from 'jspdf';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RGBColor = readonly [number, number, number];

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
}

export interface DataSource {
  name: string;
  type: string;
  description: string;
}

// ============================================================================
// CONSTANTS - IMPROVED COLOR PALETTE
// ============================================================================

const COLORS = {
  // Primary brand colors
  primary: [30, 64, 175] as RGBColor,      // Deep blue
  brand: [220, 38, 38] as RGBColor,        // AlphaData red
  accent: [236, 72, 153] as RGBColor,      // Pink accent
  
  // Neutrals - improved contrast
  dark: [15, 23, 42] as RGBColor,          // Slate 900
  darkGray: [51, 65, 85] as RGBColor,      // Slate 700
  muted: [100, 116, 139] as RGBColor,      // Slate 500
  mediumGray: [148, 163, 184] as RGBColor, // Slate 400
  lightGray: [203, 213, 225] as RGBColor,  // Slate 300
  light: [241, 245, 249] as RGBColor,      // Slate 100
  ultraLight: [248, 250, 252] as RGBColor, // Slate 50
  white: [255, 255, 255] as RGBColor,
  
  // Status colors
  success: [34, 197, 94] as RGBColor,      // Green
  warning: [234, 179, 8] as RGBColor,      // Yellow
  info: [59, 130, 246] as RGBColor,        // Blue
  
  // Backgrounds
  bgPrimary: [249, 250, 251] as RGBColor,  // Gray 50
  bgSecondary: [243, 244, 246] as RGBColor, // Gray 100
} as const;

// ============================================================================
// LAYOUT - IMPROVED SPACING AND SIZING
// ============================================================================

const LAYOUT = {
  // Margins and spacing
  MARGIN: 20,
  MARGIN_SMALL: 12,
  SECTION_SPACING: 16,
  SUBSECTION_SPACING: 10,
  LINE_SPACING: 6,
  CARD_PADDING: 8,
  
  // Header
  HEADER_HEIGHT: 130,
  ALPHA_SYMBOL_SIZE: 56,
  ALPHA_SYMBOL_X_OFFSET: 30,
  BRAND_NAME_SIZE: 32,
  TAGLINE_SIZE: 11,
  
  // Typography - improved hierarchy
  TITLE_LARGE: 42,
  TITLE_MEDIUM: 28,
  TITLE_SMALL: 18,
  SECTION_TITLE_SIZE: 13,
  BODY_LARGE: 11,
  BODY_NORMAL: 10,
  BODY_SMALL: 9,
  CAPTION: 8,
  TINY: 7,
  
  // Decorative elements
  LINE_WIDTH_THICK: 2.5,
  LINE_WIDTH_MEDIUM: 1.5,
  LINE_WIDTH_THIN: 0.75,
  BOX_RADIUS: 6,
  SMALL_BOX_RADIUS: 3,
  DECORATIVE_LINE_WIDTH: 80,
  
  // Component sizes
  METADATA_BOX_HEIGHT: 35,
  INFO_BOX_HEIGHT: 26,
  DATA_SOURCE_BOX_HEIGHT: 32,
  REQUEST_BOX_HEIGHT: 24,
  REQUESTED_BY_BOX_HEIGHT: 16,
  AI_BADGE_WIDTH: 38,
  AI_BADGE_HEIGHT: 16,
  SECTION_BAR_WIDTH: 5,
  SECTION_BAR_HEIGHT: 14,
  FOOTER_HEIGHT: 28,
  
  // Positions
  ALPHA_Y: 50,
  BRAND_TEXT_Y: 50,
  TAGLINE_Y: 68,
  DECORATIVE_LINE_Y: 82,
  REPORT_LABEL_Y: 100,
  REPORT_TITLE_Y: 116,
  METADATA_START_Y: 148,
} as const;

const TRANSLATIONS = {
  REPORT: 'RELATORIO',
  TYPE: 'Tipo:',
  PERIOD: 'Periodo:',
  GENERATED: 'Gerado:',
  CURRENT: 'Actual',
  AI_GENERATED: 'Gerado com IA',
  GENERATING_COMPANY: 'EMPRESA GERADORA',
  DATA_SOURCES: 'FONTES DE DADOS',
  DATA_SOURCES_PAGE_TITLE: 'Fontes de Dados e Referencias',
  COUNTRY_INFO: 'INFORMACOES DO PAIS',
  REQUESTING_COMPANY: 'EMPRESA SOLICITANTE',
  REQUESTED_BY: 'SOLICITADO POR',
  COUNTRY: 'Pais:',
  REGION: 'Regiao:',
  CURRENCY: 'Moeda:',
  LANGUAGE: 'Idioma:',
  TIMEZONE: 'Fuso:',
  COMPANY: 'Empresa:',
  NIF: 'NIF:',
  SECTOR: 'Sector:',
  NAME: 'Nome:',
  ROLE: 'Cargo:',
  EMAIL: 'Email:',
  CONTACT: 'Contacto:',
  WEBSITE: 'Website:',
  ADDRESS: 'Endereco:',
  SOURCE: 'Fonte:',
  TYPE_LABEL: 'Tipo:',
  DESCRIPTION: 'Descricao:',
  CONFIDENTIAL_NOTICE: 'Este documento contem informacoes confidenciais. A sua distribuicao esta restrita a destinatarios autorizados.',
  CONFIDENTIAL_HEADER: 'CONFIDENCIAL - USO INTERNO',
  DATA_QUALITY_NOTE: 'Todas as fontes de dados sao verificadas e atualizadas regularmente para garantir precisao e confiabilidade nas analises.',
} as const;

// ============================================================================
// DEFAULT DATA
// ============================================================================
export const getDefaultCoverPageData = (): Omit<CoverPageData, 'reportTitle' | 'reportType' | 'reportPeriod' | 'generatedAt' | 'isAiGenerated'> => ({
  generatingCompany: {
    name: 'AlphaData',
    fullName: 'AlphaData - Inteligencia de Mercado Petrolifero Angolano',
    description:
      'Plataforma lider em analise de dados e inteligencia artificial para o sector petrolifero de Angola. Fornecemos insights estrategicos, previsoes de mercado e analises de risco em tempo real.',
    contact: 'info@alphadata.ao',
    website: 'www.alphadata.ao',
    address: 'Luanda, Angola',
  },
  dataSources: [
    {
      name: 'BPEP - Bureau de Pesquisa Energetica e Petrolifera',
      type: 'Oficial',
      description: 'Dados oficiais de producao e exportacao do sector petrolifero angolano',
    },
    {
      name: 'ANP - Agencia Nacional do Petroleo',
      type: 'Regulador',
      description: 'Informacoes regulatorias e licenciamento de operacoes',
    },
    {
      name: 'Ministerio dos Recursos Minerais e Petroleo',
      type: 'Governamental',
      description: 'Politicas e directivas do sector energetico',
    },
    {
      name: 'APIs de Mercado Internacional',
      type: 'Mercado',
      description: 'Cotacoes Brent, WTI e futuros de petroleo em tempo real',
    },
    {
      name: 'AlphaData AI Engine',
      type: 'IA',
      description: 'Modelos proprietarios de previsao e analise de tendencias',
    },
  ],
  countryInfo: {
    name: 'Republica de Angola',
    region: 'Africa Subsaariana',
    currency: 'Kwanza (AOA)',
    language: 'Portugues',
    timezone: 'WAT (UTC+1)',
  },
});

// ============================================================================
// VALIDATION
// ============================================================================

const validateCoverPageData = (data: CoverPageData): void => {
  if (!data) {
    throw new Error('Cover page data is required');
  }
  if (!data.reportTitle?.trim()) {
    throw new Error('Report title is required');
  }
  if (!data.reportType?.trim()) {
    throw new Error('Report type is required');
  }
  if (!data.generatedAt || !(data.generatedAt instanceof Date)) {
    throw new Error('Generated date must be a valid Date object');
  }
  if (!data.generatingCompany?.name) {
    throw new Error('Generating company name is required');
  }
  if (!Array.isArray(data.dataSources) || data.dataSources.length === 0) {
    throw new Error('At least one data source is required');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
};

const setTextStyle = (
  doc: jsPDF,
  fontSize: number,
  fontWeight: 'normal' | 'bold',
  color: RGBColor
): void => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontWeight);
  doc.setTextColor(...color);
};

const drawRoundedBox = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color: RGBColor,
  radius: number = LAYOUT.BOX_RADIUS
): void => {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, height, radius, radius, 'F');
};

const drawSectionBar = (
  doc: jsPDF,
  x: number,
  y: number,
  color: RGBColor
): void => {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, LAYOUT.SECTION_BAR_WIDTH, LAYOUT.SECTION_BAR_HEIGHT, 1, 1, 'F');
};

const formatDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const months = [
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} de ${month} de ${year} as ${hours}:${minutes}`;
};

// ============================================================================
// RENDER SECTIONS - IMPROVED DESIGN
// ============================================================================

const renderBrandHeader = (doc: jsPDF, data: CoverPageData): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Modern gradient-style background
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, LAYOUT.HEADER_HEIGHT, 'F');
  
  // Subtle overlay for depth
  doc.setFillColor(0, 0, 0);
  doc.setGState(new doc.GState({ opacity: 0.05 }));
  doc.rect(0, 0, pageWidth, LAYOUT.HEADER_HEIGHT, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Alpha symbol with better positioning
  setTextStyle(doc, LAYOUT.ALPHA_SYMBOL_SIZE, 'bold', COLORS.brand);
  doc.text('a', LAYOUT.MARGIN, LAYOUT.ALPHA_Y);

  // Brand name with improved typography
  setTextStyle(doc, LAYOUT.BRAND_NAME_SIZE, 'bold', COLORS.white);
  doc.text('ALPHADATA', LAYOUT.MARGIN + LAYOUT.ALPHA_SYMBOL_X_OFFSET, LAYOUT.BRAND_TEXT_Y);

  // Tagline with better spacing
  setTextStyle(doc, LAYOUT.TAGLINE_SIZE, 'normal', COLORS.lightGray);
  doc.text('Inteligencia de Mercado Petrolifero Angolano', LAYOUT.MARGIN, LAYOUT.TAGLINE_Y);

  // Modern decorative accent
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(LAYOUT.LINE_WIDTH_THICK);
  doc.line(
    LAYOUT.MARGIN,
    LAYOUT.DECORATIVE_LINE_Y,
    LAYOUT.MARGIN + LAYOUT.DECORATIVE_LINE_WIDTH,
    LAYOUT.DECORATIVE_LINE_Y
  );
  
  // Add subtle glow effect under line
  doc.setDrawColor(...COLORS.brand);
  doc.setGState(new doc.GState({ opacity: 0.3 }));
  doc.setLineWidth(4);
  doc.line(
    LAYOUT.MARGIN,
    LAYOUT.DECORATIVE_LINE_Y,
    LAYOUT.MARGIN + LAYOUT.DECORATIVE_LINE_WIDTH,
    LAYOUT.DECORATIVE_LINE_Y
  );
  doc.setGState(new doc.GState({ opacity: 1 }));

  // Report label with improved typography
  setTextStyle(doc, LAYOUT.BODY_NORMAL, 'normal', COLORS.mediumGray);
  doc.text(TRANSLATIONS.REPORT, LAYOUT.MARGIN, LAYOUT.REPORT_LABEL_Y);

  // Report title with better line height
  setTextStyle(doc, LAYOUT.TITLE_SMALL, 'bold', COLORS.white);
  const titleLines = doc.splitTextToSize(sanitizeText(data.reportTitle), pageWidth - 2 * LAYOUT.MARGIN);
  doc.text(titleLines, LAYOUT.MARGIN, LAYOUT.REPORT_TITLE_Y);

  return LAYOUT.METADATA_START_Y;
};

const renderMetadataBox = (doc: jsPDF, data: CoverPageData, yPos: number): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Modern card design with subtle shadow
  drawRoundedBox(doc, LAYOUT.MARGIN, yPos, pageWidth - 2 * LAYOUT.MARGIN, LAYOUT.METADATA_BOX_HEIGHT, COLORS.white);
  
  // Subtle border
  doc.setDrawColor(...COLORS.lightGray);
  doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
  doc.roundedRect(LAYOUT.MARGIN, yPos, pageWidth - 2 * LAYOUT.MARGIN, LAYOUT.METADATA_BOX_HEIGHT, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'S');

  const metaY = yPos + 14;
  const labelX = LAYOUT.MARGIN + LAYOUT.CARD_PADDING;

  // Type
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.TYPE, labelX, metaY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.reportType), labelX + 18, metaY);

  // Period
  const periodX = labelX + 70;
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.PERIOD, periodX, metaY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(data.reportPeriod) || TRANSLATIONS.CURRENT, periodX + 25, metaY);

  // Generated date - second row
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.GENERATED, labelX, metaY + 12);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(formatDateTime(data.generatedAt), labelX + 22, metaY + 12);

  // Modern AI badge
  if (data.isAiGenerated) {
    const badgeX = pageWidth - LAYOUT.MARGIN - LAYOUT.AI_BADGE_WIDTH - LAYOUT.CARD_PADDING;
    const badgeY = yPos + 10;
    
    // Gradient-style badge
    drawRoundedBox(
      doc,
      badgeX,
      badgeY,
      LAYOUT.AI_BADGE_WIDTH,
      LAYOUT.AI_BADGE_HEIGHT,
      COLORS.primary,
      LAYOUT.SMALL_BOX_RADIUS
    );
    
    setTextStyle(doc, LAYOUT.CAPTION, 'bold', COLORS.white);
    doc.text(TRANSLATIONS.AI_GENERATED, badgeX + 4, badgeY + 10);
  }

  return yPos + LAYOUT.METADATA_BOX_HEIGHT + LAYOUT.SECTION_SPACING;
};

const renderSectionHeader = (
  doc: jsPDF,
  title: string,
  yPos: number,
  barColor: RGBColor
): number => {
  drawSectionBar(doc, LAYOUT.MARGIN, yPos, barColor);
  setTextStyle(doc, LAYOUT.SECTION_TITLE_SIZE, 'bold', COLORS.dark);
  doc.text(sanitizeText(title), LAYOUT.MARGIN + 10, yPos + 10);
  return yPos + 22;
};

const renderGeneratingCompany = (
  doc: jsPDF,
  company: CoverPageData['generatingCompany'],
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company name with improved hierarchy
  setTextStyle(doc, LAYOUT.BODY_LARGE, 'bold', COLORS.dark);
  doc.text(sanitizeText(company.name), LAYOUT.MARGIN, yPos);

  setTextStyle(doc, LAYOUT.BODY_NORMAL, 'normal', COLORS.darkGray);
  doc.text(' - ' + sanitizeText(company.fullName), LAYOUT.MARGIN + 28, yPos);
  yPos += LAYOUT.SUBSECTION_SPACING;

  // Description with better readability
  const descLines = doc.splitTextToSize(sanitizeText(company.description), pageWidth - 2 * LAYOUT.MARGIN);
  setTextStyle(doc, LAYOUT.BODY_NORMAL, 'normal', COLORS.darkGray);
  doc.text(descLines, LAYOUT.MARGIN, yPos);
  yPos += descLines.length * LAYOUT.LINE_SPACING + LAYOUT.LINE_SPACING;

  // Contact info with icons-style layout
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.muted);
  const contactText = `${TRANSLATIONS.CONTACT} ${sanitizeText(company.contact)} | ${TRANSLATIONS.WEBSITE} ${sanitizeText(company.website)} | ${TRANSLATIONS.ADDRESS} ${sanitizeText(company.address)}`;
  const contactLines = doc.splitTextToSize(contactText, pageWidth - 2 * LAYOUT.MARGIN);
  doc.text(contactLines, LAYOUT.MARGIN, yPos);

  return yPos + contactLines.length * 5 + LAYOUT.SECTION_SPACING;
};

const renderCountryInfo = (
  doc: jsPDF,
  countryInfo: CoverPageData['countryInfo'],
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Modern info card
  drawRoundedBox(
    doc,
    LAYOUT.MARGIN,
    yPos,
    pageWidth - 2 * LAYOUT.MARGIN,
    LAYOUT.INFO_BOX_HEIGHT,
    COLORS.bgPrimary,
    LAYOUT.SMALL_BOX_RADIUS
  );

  const infoY = yPos + 10;
  const labelX = LAYOUT.MARGIN + LAYOUT.CARD_PADDING;

  // First row
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.COUNTRY, labelX, infoY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(countryInfo.name), labelX + 20, infoY);

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.REGION, labelX + 90, infoY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(countryInfo.region), labelX + 110, infoY);

  // Second row
  const secondRowY = infoY + 10;
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.CURRENCY, labelX, secondRowY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(countryInfo.currency), labelX + 23, secondRowY);

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.LANGUAGE, labelX + 70, secondRowY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(countryInfo.language), labelX + 93, secondRowY);

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.TIMEZONE, labelX + 125, secondRowY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(countryInfo.timezone), labelX + 141, secondRowY);

  return yPos + LAYOUT.INFO_BOX_HEIGHT + LAYOUT.SUBSECTION_SPACING;
};

const renderRequestingCompany = (
  doc: jsPDF,
  company: NonNullable<CoverPageData['requestingCompany']>,
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  drawRoundedBox(
    doc,
    LAYOUT.MARGIN,
    yPos,
    pageWidth - 2 * LAYOUT.MARGIN,
    LAYOUT.REQUEST_BOX_HEIGHT,
    COLORS.bgPrimary,
    LAYOUT.SMALL_BOX_RADIUS
  );

  const reqY = yPos + 10;
  const labelX = LAYOUT.MARGIN + LAYOUT.CARD_PADDING;

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.COMPANY, labelX, reqY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(company.name), labelX + 28, reqY);

  if (company.nif) {
    setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
    doc.text(TRANSLATIONS.NIF, labelX + 110, reqY);
    setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
    doc.text(sanitizeText(company.nif), labelX + 122, reqY);
  }

  if (company.sector || company.country) {
    const secondRowY = reqY + 10;
    if (company.sector) {
      setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
      doc.text(TRANSLATIONS.SECTOR, labelX, secondRowY);
      setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
      doc.text(sanitizeText(company.sector), labelX + 23, secondRowY);
    }

    if (company.country) {
      setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
      doc.text(TRANSLATIONS.COUNTRY, labelX + 90, secondRowY);
      setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
      doc.text(sanitizeText(company.country), labelX + 105, secondRowY);
    }
  }

  return yPos + LAYOUT.REQUEST_BOX_HEIGHT + LAYOUT.SUBSECTION_SPACING;
};

const renderRequestedBy = (
  doc: jsPDF,
  person: NonNullable<CoverPageData['requestedBy']>,
  yPos: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();

  drawRoundedBox(
    doc,
    LAYOUT.MARGIN,
    yPos,
    pageWidth - 2 * LAYOUT.MARGIN,
    LAYOUT.REQUESTED_BY_BOX_HEIGHT,
    COLORS.bgPrimary,
    LAYOUT.SMALL_BOX_RADIUS
  );

  const byY = yPos + 11;
  const labelX = LAYOUT.MARGIN + LAYOUT.CARD_PADDING;

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
  doc.text(TRANSLATIONS.NAME, labelX, byY);
  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
  doc.text(sanitizeText(person.name), labelX + 20, byY);

  if (person.role) {
    setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
    doc.text(TRANSLATIONS.ROLE, labelX + 90, byY);
    setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.dark);
    doc.text(sanitizeText(person.role), labelX + 108, byY);
  }

  if (person.email) {
    // If email is long, show it on the same line if possible
    const emailText = sanitizeText(person.email);
    const emailWidth = doc.getTextWidth(emailText);
    const availableWidth = pageWidth - LAYOUT.MARGIN - labelX - 168;
    
    if (emailWidth < availableWidth) {
      setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.muted);
      doc.text(TRANSLATIONS.EMAIL, labelX + 150, byY);
      setTextStyle(doc, LAYOUT.CAPTION, 'normal', COLORS.dark);
      doc.text(emailText, labelX + 165, byY);
    }
  }

  return yPos + LAYOUT.REQUESTED_BY_BOX_HEIGHT + LAYOUT.SUBSECTION_SPACING;
};

const renderFooter = (doc: jsPDF): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Modern footer with gradient
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, LAYOUT.FOOTER_HEIGHT, 'F');

  // Accent line
  doc.setDrawColor(...COLORS.brand);
  doc.setLineWidth(LAYOUT.LINE_WIDTH_MEDIUM);
  doc.line(0, pageHeight - LAYOUT.FOOTER_HEIGHT, pageWidth, pageHeight - LAYOUT.FOOTER_HEIGHT);

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.mediumGray);
  doc.text(sanitizeText(TRANSLATIONS.CONFIDENTIAL_NOTICE), pageWidth / 2, pageHeight - 16, { align: 'center' });

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.brand);
  doc.text(TRANSLATIONS.CONFIDENTIAL_HEADER, pageWidth / 2, pageHeight - 8, { align: 'center' });
};

// ============================================================================
// DATA SOURCES PAGE - IMPROVED DESIGN
// ============================================================================

const renderDataSourcesPage = (doc: jsPDF, data: CoverPageData): void => {
  doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = LAYOUT.MARGIN;

  // Modern page header
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, pageWidth, 70, 'F');

  setTextStyle(doc, LAYOUT.ALPHA_SYMBOL_SIZE, 'bold', COLORS.brand);
  doc.text('a', LAYOUT.MARGIN, 38);

  setTextStyle(doc, LAYOUT.BRAND_NAME_SIZE, 'bold', COLORS.white);
  doc.text('ALPHADATA', LAYOUT.MARGIN + LAYOUT.ALPHA_SYMBOL_X_OFFSET, 38);

  setTextStyle(doc, LAYOUT.TAGLINE_SIZE, 'normal', COLORS.white);
  doc.text(TRANSLATIONS.DATA_SOURCES_PAGE_TITLE, LAYOUT.MARGIN, 55);

  yPos = 85;

  // Section title
  drawSectionBar(doc, LAYOUT.MARGIN, yPos, COLORS.primary);
  setTextStyle(doc, LAYOUT.SECTION_TITLE_SIZE, 'bold', COLORS.dark);
  doc.text(TRANSLATIONS.DATA_SOURCES, LAYOUT.MARGIN + 10, yPos + 10);
  yPos += 28;

  // Introduction text
  setTextStyle(doc, LAYOUT.BODY_NORMAL, 'normal', COLORS.darkGray);
  const introText = 'Este relatorio baseia-se em multiplas fontes de dados verificadas e confiaveis para garantir a precisao e integridade das analises apresentadas.';
  const introLines = doc.splitTextToSize(introText, pageWidth - 2 * LAYOUT.MARGIN);
  doc.text(introLines, LAYOUT.MARGIN, yPos);
  yPos += introLines.length * LAYOUT.LINE_SPACING + 18;

  // Modern data sources cards
  data.dataSources.forEach((source, index) => {
    if (yPos + LAYOUT.DATA_SOURCE_BOX_HEIGHT + 10 > doc.internal.pageSize.getHeight() - LAYOUT.FOOTER_HEIGHT - LAYOUT.MARGIN) {
      renderFooter(doc);
      doc.addPage();
      yPos = LAYOUT.MARGIN;
    }

    // Card background
    drawRoundedBox(
      doc,
      LAYOUT.MARGIN,
      yPos,
      pageWidth - 2 * LAYOUT.MARGIN,
      LAYOUT.DATA_SOURCE_BOX_HEIGHT,
      COLORS.white,
      LAYOUT.BOX_RADIUS
    );
    
    // Card border
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
    doc.roundedRect(
      LAYOUT.MARGIN,
      yPos,
      pageWidth - 2 * LAYOUT.MARGIN,
      LAYOUT.DATA_SOURCE_BOX_HEIGHT,
      LAYOUT.BOX_RADIUS,
      LAYOUT.BOX_RADIUS,
      'S'
    );

    // Modern number badge
    const badgeX = LAYOUT.MARGIN + 10;
    const badgeY = yPos + 16;
    doc.setFillColor(...COLORS.primary);
    doc.circle(badgeX, badgeY, 9, 'F');
    setTextStyle(doc, LAYOUT.BODY_NORMAL, 'bold', COLORS.white);
    doc.text(`${index + 1}`, badgeX, badgeY + 3, { align: 'center' });

    // Source name
    setTextStyle(doc, LAYOUT.BODY_LARGE, 'bold', COLORS.dark);
    doc.text(sanitizeText(source.name), LAYOUT.MARGIN + 26, yPos + 12);

    // Type badge
    const typeText = `[${sanitizeText(source.type)}]`;
    const typeWidth = doc.getTextWidth(typeText);
    const badgeWidth = typeWidth + 10;
    const badgePosX = pageWidth - LAYOUT.MARGIN - badgeWidth - 6;
    
    doc.setFillColor(...COLORS.brand);
    doc.roundedRect(
      badgePosX,
      yPos + 7,
      badgeWidth,
      10,
      2,
      2,
      'F'
    );
    setTextStyle(doc, LAYOUT.CAPTION, 'bold', COLORS.white);
    doc.text(typeText, badgePosX + 5, yPos + 13);

    // Description
    setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.darkGray);
    const descLines = doc.splitTextToSize(sanitizeText(source.description), pageWidth - 2 * LAYOUT.MARGIN - 36);
    doc.text(descLines, LAYOUT.MARGIN + 26, yPos + 21);

    yPos += LAYOUT.DATA_SOURCE_BOX_HEIGHT + 12;
  });

  // Modern quality note
  yPos += 8;
  drawRoundedBox(
    doc,
    LAYOUT.MARGIN,
    yPos,
    pageWidth - 2 * LAYOUT.MARGIN,
    28,
    [235, 248, 255] as RGBColor,
    LAYOUT.BOX_RADIUS
  );

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'bold', COLORS.primary);
  doc.text('NOTA SOBRE QUALIDADE DOS DADOS', LAYOUT.MARGIN + 8, yPos + 10);

  setTextStyle(doc, LAYOUT.BODY_SMALL, 'normal', COLORS.darkGray);
  const noteLines = doc.splitTextToSize(
    sanitizeText(TRANSLATIONS.DATA_QUALITY_NOTE),
    pageWidth - 2 * LAYOUT.MARGIN - 16
  );
  doc.text(noteLines, LAYOUT.MARGIN + 8, yPos + 18);

  renderFooter(doc);
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export const addCoverPageToPDF = (doc: jsPDF, data: CoverPageData): void => {
  try {
    validateCoverPageData(data);

    doc.setProperties({
      title: sanitizeText(data.reportTitle),
      subject: sanitizeText(data.reportType),
      author: sanitizeText(data.generatingCompany.name),
      keywords: 'AlphaData, Petroleo, Angola, Relatorio',
      creator: 'AlphaData Platform',
    });

    let yPos = 0;

    // PAGE 1: COVER
    yPos = renderBrandHeader(doc, data);
    yPos = renderMetadataBox(doc, data, yPos);

    yPos = renderSectionHeader(doc, TRANSLATIONS.GENERATING_COMPANY, yPos, COLORS.brand);
    yPos = renderGeneratingCompany(doc, data.generatingCompany, yPos);

    yPos = renderSectionHeader(doc, TRANSLATIONS.COUNTRY_INFO, yPos, COLORS.success);
    yPos = renderCountryInfo(doc, data.countryInfo, yPos);

    if (data.requestingCompany) {
      yPos = renderSectionHeader(doc, TRANSLATIONS.REQUESTING_COMPANY, yPos, COLORS.warning);
      yPos = renderRequestingCompany(doc, data.requestingCompany, yPos);
    }

    if (data.requestedBy) {
      yPos = renderSectionHeader(doc, TRANSLATIONS.REQUESTED_BY, yPos, COLORS.info);
      yPos = renderRequestedBy(doc, data.requestedBy, yPos);
    }

    renderFooter(doc);

    // PAGE 2: DATA SOURCES
    renderDataSourcesPage(doc, data);

  } catch (error) {
    console.error('Error generating cover page:', error);
    throw new Error(`Failed to generate cover page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export other functions remain the same
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

const addExcelRow = (
  styleId: string,
  label: string,
  value?: string,
  isHeader: boolean = false
): string => {
  if (isHeader) {
    return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
  }
  if (value !== undefined) {
    return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell></Row>`;
  }
  return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(label)}</Data></Cell></Row>`;
};

const addExcelSeparator = (): string => `<Row></Row>`;

const addExcelDivider = (styleId: string = 'brand'): string => {
  return `<Row><Cell ss:StyleID="${styleId}"><Data ss:Type="String">===============================================================</Data></Cell></Row>`;
};

export const getCoverPageExcelRows = (data: CoverPageData): string[] => {
  validateCoverPageData(data);

  const rows: string[] = [];

  rows.push(addExcelDivider());
  rows.push(addExcelRow('brand', 'a ALPHADATA - PAGINA INFORMATIVA', undefined, true));
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', 'EMPRESA GERADORA', undefined, true));
  rows.push(addExcelRow('bold', 'Nome:', data.generatingCompany.fullName));
  rows.push(addExcelRow('bold', 'Descricao:', data.generatingCompany.description));
  rows.push(addExcelRow('bold', 'Contacto:', data.generatingCompany.contact));
  rows.push(addExcelRow('bold', 'Website:', data.generatingCompany.website));
  rows.push(addExcelRow('bold', 'Endereco:', data.generatingCompany.address));
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', 'FONTES DE DADOS', undefined, true));
  rows.push(
    `<Row><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Fonte</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tipo</Data></Cell><Cell ss:StyleID="tableHeader"><Data ss:Type="String">Descricao</Data></Cell></Row>`
  );
  data.dataSources.forEach((source) => {
    rows.push(
      `<Row><Cell><Data ss:Type="String">${escapeXml(source.name)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.type)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(source.description)}</Data></Cell></Row>`
    );
  });
  rows.push(addExcelSeparator());

  rows.push(addExcelRow('subheader', 'INFORMACOES DO PAIS', undefined, true));
  rows.push(addExcelRow('bold', 'Pais:', data.countryInfo.name));
  rows.push(addExcelRow('bold', 'Regiao:', data.countryInfo.region));
  rows.push(addExcelRow('bold', 'Moeda:', data.countryInfo.currency));
  rows.push(addExcelRow('bold', 'Idioma:', data.countryInfo.language));
  rows.push(addExcelRow('bold', 'Fuso Horario:', data.countryInfo.timezone));
  rows.push(addExcelSeparator());

  if (data.requestingCompany) {
    rows.push(addExcelRow('subheader', 'EMPRESA SOLICITANTE', undefined, true));
    rows.push(addExcelRow('bold', 'Empresa:', data.requestingCompany.name));
    if (data.requestingCompany.nif) {
      rows.push(addExcelRow('bold', 'NIF:', data.requestingCompany.nif));
    }
    if (data.requestingCompany.sector) {
      rows.push(addExcelRow('bold', 'Sector:', data.requestingCompany.sector));
    }
    if (data.requestingCompany.country) {
      rows.push(addExcelRow('bold', 'Pais:', data.requestingCompany.country));
    }
    rows.push(addExcelSeparator());
  }

  if (data.requestedBy) {
    rows.push(addExcelRow('subheader', 'SOLICITADO POR', undefined, true));
    rows.push(addExcelRow('bold', 'Nome:', data.requestedBy.name));
    if (data.requestedBy.role) {
      rows.push(addExcelRow('bold', 'Cargo:', data.requestedBy.role));
    }
    if (data.requestedBy.email) {
      rows.push(addExcelRow('bold', 'Email:', data.requestedBy.email));
    }
    rows.push(addExcelSeparator());
  }

  rows.push(addExcelRow('subheader', 'INFORMACOES DO RELATORIO', undefined, true));
  rows.push(addExcelRow('bold', 'Titulo:', data.reportTitle));
  rows.push(addExcelRow('bold', 'Tipo:', data.reportType));
  rows.push(addExcelRow('bold', 'Periodo:', data.reportPeriod || TRANSLATIONS.CURRENT));
  rows.push(addExcelRow('bold', 'Gerado em:', formatDateTime(data.generatedAt)));
  if (data.isAiGenerated) {
    rows.push(addExcelRow('bold', 'Metodo:', 'Gerado com Inteligencia Artificial'));
  }
  rows.push(addExcelSeparator());

  rows.push(addExcelDivider());
  rows.push(
    addExcelRow('footer', 'FIM DA PAGINA INFORMATIVA - INICIO DO CONTEUDO DO RELATORIO', undefined, true)
  );
  rows.push(addExcelDivider());
  rows.push(addExcelSeparator());
  rows.push(addExcelSeparator());

  return rows;
};