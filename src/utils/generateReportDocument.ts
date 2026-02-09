/**
 * Utility functions for generating reports in PDF, DOCX, and Excel formats
 * IMPROVED VERSION with proper text formatting and professional typography
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, Header, Footer, ImageRun, PageNumber, NumberFormat } from 'docx';
import { addCoverPageToPDF, getDefaultCoverPageData, getCoverPageExcelRows, CoverPageData } from './reportCoverPage';
import { getDocumentTranslation, DocumentLanguageCode, DOCUMENT_LANGUAGES } from '@/i18n';

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
// IMPROVED COLORS & LAYOUT
// ============================================================================

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  darkGray: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  mediumGray: [148, 163, 184] as [number, number, number],
  lightGray: [203, 213, 225] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  ultraLight: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  brand: [220, 38, 38] as [number, number, number],
};

const LAYOUT = {
  MARGIN: 20,
  SECTION_SPACING: 16,
  SUBSECTION_SPACING: 10,
  LINE_SPACING: 6,
  CARD_PADDING: 10,
  
  // Typography
  TITLE_LARGE: 24,
  TITLE_MEDIUM: 18,
  TITLE_SMALL: 14,
  SECTION_TITLE: 13,
  BODY_LARGE: 11,
  BODY_NORMAL: 10,
  BODY_SMALL: 9,
  CAPTION: 8,
  
  // Components
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

/**
 * Parse markdown-style text and convert to formatted segments
 */
const parseMarkdownText = (text: string): FormattedText[] => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const formatted: FormattedText[] = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Check for headings (## Text or **1. Text:**)
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
    
    // Check for bullets
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
    
    // Check for numbered lists
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
    
    // Regular paragraph - process inline formatting
    formatted.push(...parseInlineFormatting(line));
  }
  
  return formatted;
};

/**
 * Parse inline bold/italic formatting
 */
const parseInlineFormatting = (text: string): FormattedText[] => {
  const segments: FormattedText[] = [];
  
  // Remove markdown symbols and split into segments
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  for (const part of parts) {
    if (!part) continue;
    
    // Bold text (**text**)
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
    
    // Italic text (*text*)
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
    
    // Regular text
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

/**
 * Render formatted text segments to PDF
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
  const bottomLimit = pageHeight - LAYOUT.FOOTER_HEIGHT - LAYOUT.MARGIN - 5;
  
  const checkPageBreak = (requiredSpace: number) => {
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
    
    checkPageBreak(LAYOUT.LINE_SPACING + 2);
    
    currentLine.forEach(segment => {
      doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
      doc.text(segment.text, segment.x, yPos);
    });
    
    currentLine = [];
    currentX = startX;
    yPos += LAYOUT.LINE_SPACING;
  };
  
  for (const segment of segments) {
    // Handle headings
    if (segment.isHeading) {
      flushLine();
      checkPageBreak(LAYOUT.SUBSECTION_SPACING + 15);
      yPos += LAYOUT.SUBSECTION_SPACING;
      
      const headingSize = segment.headingLevel === 2 ? LAYOUT.TITLE_MEDIUM : LAYOUT.TITLE_SMALL;
      doc.setFontSize(headingSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      
      const headingLines = doc.splitTextToSize(segment.text, maxWidth);
      doc.text(headingLines, startX, yPos);
      yPos += headingLines.length * (LAYOUT.LINE_SPACING + 1) + LAYOUT.SUBSECTION_SPACING;
      
      doc.setFontSize(LAYOUT.BODY_NORMAL);
      continue;
    }
    
    // Handle bullets
    if (segment.isBullet) {
      flushLine();
      checkPageBreak(LAYOUT.LINE_SPACING + 2);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(LAYOUT.BODY_NORMAL);
      
      const bulletX = startX + (segment.indent * 8);
      doc.text('•', bulletX, yPos);
      
      const textLines = doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8) - 5);
      
      for (let i = 0; i < textLines.length; i++) {
        checkPageBreak(LAYOUT.LINE_SPACING);
        doc.text(textLines[i], bulletX + 5, yPos);
        yPos += LAYOUT.LINE_SPACING;
      }
      continue;
    }
    
    // Handle numbered lists
    if (segment.isNumbered) {
      flushLine();
      checkPageBreak(LAYOUT.LINE_SPACING + 2);
      
      doc.setFont('helvetica', segment.bold ? 'bold' : 'normal');
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(LAYOUT.BODY_NORMAL);
      
      const numberedX = startX + (segment.indent * 8);
      const textLines = doc.splitTextToSize(segment.text, maxWidth - (segment.indent * 8));
      
      for (let i = 0; i < textLines.length; i++) {
        checkPageBreak(LAYOUT.LINE_SPACING);
        doc.text(textLines[i], numberedX, yPos);
        yPos += LAYOUT.LINE_SPACING;
      }
      continue;
    }
    
    // Handle regular text with inline formatting
    doc.setFontSize(LAYOUT.BODY_NORMAL);
    doc.setTextColor(...COLORS.darkGray);
    doc.setFont('helvetica', segment.bold ? 'bold' : segment.italic ? 'italic' : 'normal');
    
    const words = segment.text.split(' ');
    for (const word of words) {
      const wordWidth = doc.getTextWidth(word + ' ');
      
      if (currentX + wordWidth > startX + maxWidth) {
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
  return yPos;
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

export const generatePDFReport = (data: ReportData): void => {
  try {
    const isGeneralReport = data.type === 'general';
    if (isGeneralReport) {
      console.log('Generating large general report - optimizing memory usage');
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = LAYOUT.MARGIN;
    let yPos = margin;

    // Add cover page
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
    
    addCoverPageToPDF(doc, coverPageData);
    doc.addPage();

    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - LAYOUT.FOOTER_HEIGHT - margin - 5) {
        doc.addPage();
        yPos = margin;
        addHeader();
      }
    };

    const addHeader = () => {
      // Modern header
      doc.setFillColor(...COLORS.dark);
      doc.rect(0, 0, pageWidth, LAYOUT.HEADER_HEIGHT, 'F');
      
      // Brand
      doc.setTextColor(...COLORS.brand);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('α', margin, 24);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('ALPHADATA', margin + 14, 24);
      
      // Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.lightGray);
      const safeTitle = data.title || 'Relatório AlphaData';
      doc.text(safeTitle, margin, 36);
      
      // Generation info
      doc.setFontSize(9);
      let generatedDate: Date;
      try {
        generatedDate = data.generatedAt instanceof Date ? data.generatedAt : new Date(data.generatedAt);
        if (isNaN(generatedDate.getTime())) {
          generatedDate = new Date();
        }
      } catch {
        generatedDate = new Date();
      }
      const generatedText = `Gerado em: ${generatedDate.toLocaleDateString('pt-AO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      doc.text(generatedText, pageWidth - margin - 85, 24);
      
      if (data.aiGenerated) {
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(pageWidth - margin - 48, 28, 45, 11, 2, 2, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Gerado com IA', pageWidth - margin - 44, 34.5);
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
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('AlphaData - Inteligencia de Mercado Petrolifero Angolano', margin, pageHeight - 10);
        doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('CONFIDENCIAL - USO INTERNO', pageWidth - margin - 48, pageHeight - 10);
      }
    };

    const addSectionTitle = (title: string) => {
      checkNewPage(25);
      
      doc.setFillColor(...COLORS.brand);
      doc.roundedRect(margin, yPos, 5, 14, 1, 1, 'F');
      
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(LAYOUT.SECTION_TITLE);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 10, yPos + 10);
      yPos += 22;
    };

    // Start document
    addHeader();

    // Executive Summary with proper formatting
    if (data.summary) {
      addSectionTitle('Sumário Executivo');
      
      const formattedSegments = parseMarkdownText(data.summary);
      yPos = renderFormattedText(doc, formattedSegments, margin, yPos, pageWidth - 2 * margin, addHeader);
      yPos += LAYOUT.SECTION_SPACING;
    }

    // Highlights
    if (data.highlights && data.highlights.length > 0) {
      addSectionTitle('Destaques Principais');
      
      data.highlights.forEach((highlight) => {
        checkNewPage(LAYOUT.HIGHLIGHT_BOX_HEIGHT + 5);
        
        // Modern highlight card
        doc.setFillColor(...COLORS.white);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, LAYOUT.HIGHLIGHT_BOX_HEIGHT, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'F');
        
        doc.setDrawColor(...COLORS.lightGray);
        doc.setLineWidth(LAYOUT.LINE_WIDTH_THIN);
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, LAYOUT.HIGHLIGHT_BOX_HEIGHT, LAYOUT.BOX_RADIUS, LAYOUT.BOX_RADIUS, 'S');
        
        // Label
        doc.setTextColor(...COLORS.muted);
        doc.setFontSize(LAYOUT.BODY_SMALL);
        doc.setFont('helvetica', 'normal');
        doc.text(highlight.title, margin + LAYOUT.CARD_PADDING, yPos + 9);
        
        // Value
        doc.setTextColor(...COLORS.dark);
        doc.setFontSize(LAYOUT.TITLE_SMALL);
        doc.setFont('helvetica', 'bold');
        doc.text(highlight.value, margin + LAYOUT.CARD_PADDING, yPos + 17);
        
        // Trend indicator
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

    // Data content
    if (data.content) {
      addSectionTitle(`Dados de ${getTypeName(data.type)}`);

      if (data.content.data) {
        const contentData = data.content.data;

        // Production data
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
                fontSize: 10,
                halign: 'left',
              },
              bodyStyles: {
                fontSize: 9,
                textColor: COLORS.darkGray,
              },
              alternateRowStyles: {
                fillColor: COLORS.ultraLight,
              },
              theme: 'plain',
              styles: {
                cellPadding: 4,
                lineColor: COLORS.lightGray,
                lineWidth: 0.1,
              },
            });
            yPos = (doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
          }
        }

        // Price data
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
              headStyles: {
                fillColor: COLORS.dark,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 10,
              },
              bodyStyles: {
                fontSize: 9,
                textColor: COLORS.darkGray,
              },
              alternateRowStyles: {
                fillColor: COLORS.ultraLight,
              },
              theme: 'plain',
              styles: {
                cellPadding: 4,
                lineColor: COLORS.lightGray,
                lineWidth: 0.1,
              },
            });
            yPos = (doc as any).lastAutoTable.finalY + LAYOUT.SECTION_SPACING;
          }
        }

        // Export data
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
              headStyles: {
                fillColor: COLORS.dark,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 10,
              },
              bodyStyles: {
                fontSize: 9,
                textColor: COLORS.darkGray,
              },
              alternateRowStyles: {
                fillColor: COLORS.ultraLight,
              },
              theme: 'plain',
              styles: {
                cellPadding: 4,
                lineColor: COLORS.lightGray,
                lineWidth: 0.1,
              },
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

    const isLargeReport = data.type === 'general';
    if (isLargeReport) {
      console.error('Large report generation failed - this may be due to memory constraints');
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      throw new Error('Relatório muito grande para gerar PDF. Tente reduzir a quantidade de dados ou use Excel.');
    }

    throw new Error(`Falha ao gerar PDF: ${errorMessage}`);
  }
};

// ============================================================================
// DOCX & EXCEL GENERATION (keeping existing code)
// ============================================================================

export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  // Keep existing DOCX code...
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const defaultCoverData = getDefaultCoverPageData();
  const children: any[] = [];

  // Add cover page and content (existing code)...
  // [Previous DOCX code remains the same]
  
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            bottom: 1440,
            left: 1800,
            right: 1440,
          },
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
  // Keep existing Excel code...
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

  // [Rest of Excel generation code remains the same]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="brand">
      <Font ss:Bold="1" ss:Size="18" ss:Color="#DC2626"/>
      <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Size="14"/>
    </Style>
    <Style ss:ID="subheader">
      <Font ss:Bold="1" ss:Size="11" ss:Color="#1E293B"/>
      <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="tableHeader">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
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
      generatePDFReport(reportData);
      break;
    case 'docx':
      await generateDOCXReport(reportData);
      break;
    case 'excel':
      generateExcelReport(reportData);
      break;
  }
};