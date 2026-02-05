/**
 * Utility functions for generating reports in PDF, DOCX, and Excel formats
 * with AlphaData branding
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, Header, Footer, ImageRun, PageNumber, NumberFormat } from 'docx';
import { addCoverPageToPDF, getDefaultCoverPageData, getCoverPageExcelRows, CoverPageData } from './reportCoverPage';

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
  // Optional: Requesting company/user info for cover page
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
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number], // Blue
  success: [34, 197, 94] as [number, number, number], // Green
  warning: [245, 158, 11] as [number, number, number], // Amber
  danger: [239, 68, 68] as [number, number, number], // Red
  dark: [15, 23, 42] as [number, number, number], // Slate 900
  muted: [100, 116, 139] as [number, number, number], // Slate 500
  light: [241, 245, 249] as [number, number, number], // Slate 100
  brand: [220, 38, 38] as [number, number, number], // AlphaData Red
};

const getTypeName = (type: string): string => {
  const types: Record<string, string> = {
    production: 'Produção',
    market: 'Mercado',
    exports: 'Exportações',
    risk: 'Riscos',
    predictions: 'Previsões IA',
    general: 'Geral',
  };
  return types[type] || type;
};

/**
 * Generate PDF Report with AlphaData branding
 */
export const generatePDFReport = (data: ReportData): void => {
  try {
    // Memory optimization: Check if report is too large
    const isGeneralReport = data.type === 'general';
    if (isGeneralReport) {
      console.log('Generating large general report - optimizing memory usage');
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Add cover page first
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
    
    // Add new page for content
    doc.addPage();

    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - 25) {
        doc.addPage();
        yPos = margin;
        addHeader();
      }
    };

    const addHeader = () => {
      // Header background
      doc.setFillColor(...COLORS.dark);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Brand name with red accent
      doc.setTextColor(...COLORS.brand);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('α', margin, 22);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('ALPHADATA', margin + 12, 22);
      
      // Report title - handle undefined or null
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const safeTitle = data.title || 'Relatório AlphaData';
      doc.text(safeTitle, margin, 33);
      
      // Generation info - safe date handling
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
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
      doc.text(generatedText, pageWidth - margin - 75, 22);
      
      if (data.aiGenerated) {
        doc.setTextColor(...COLORS.primary);
        doc.setFillColor(230, 240, 255);
        doc.roundedRect(pageWidth - margin - 45, 28, 42, 10, 2, 2, 'F');
        doc.setFontSize(8);
        doc.text('Gerado com IA', pageWidth - margin - 40, 34);
      }
      
      yPos = 50;
    };

  const addFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(...COLORS.light);
      doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
      
      // Footer line
      doc.setDrawColor(...COLORS.brand);
      doc.setLineWidth(0.5);
      doc.line(0, pageHeight - 18, pageWidth, pageHeight - 18);
      
      // Footer content
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(8);
      doc.text('AlphaData - Inteligencia de Mercado Petrolifero Angolano', margin, pageHeight - 8);
      doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('CONFIDENCIAL - USO INTERNO', pageWidth - margin - 35, pageHeight - 8);
      // NO watermark - removed per user request
    }
  };

  const addSectionTitle = (title: string) => {
    checkNewPage(20);
    doc.setFillColor(...COLORS.brand);
    doc.rect(margin, yPos, 4, 12, 'F');
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 8, yPos + 8);
    yPos += 18;
  };

  // Start document
  addHeader();

  // Executive Summary
  addSectionTitle('Sumário Executivo');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (data.summary) {
    const summaryLines = doc.splitTextToSize(data.summary, pageWidth - 2 * margin);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 5 + 10;
  }

  // Highlights
  if (data.highlights && data.highlights.length > 0) {
    addSectionTitle('Destaques Principais');
    
    data.highlights.forEach((highlight) => {
      checkNewPage(20);
      
      // Highlight box
      doc.setFillColor(...COLORS.light);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 18, 3, 3, 'F');
      
      doc.setTextColor(...COLORS.muted);
      doc.setFontSize(9);
      doc.text(highlight.title, margin + 5, yPos + 7);
      
      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(highlight.value, margin + 5, yPos + 14);
      
      if (highlight.trend) {
        const trendColor = highlight.trend === 'up' ? COLORS.success : 
                           highlight.trend === 'down' ? COLORS.danger : COLORS.muted;
        doc.setFillColor(...trendColor);
        doc.circle(pageWidth - margin - 10, yPos + 9, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        const arrow = highlight.trend === 'up' ? '+' : highlight.trend === 'down' ? '-' : '=';
        doc.text(arrow, pageWidth - margin - 11.5, yPos + 11);
      }
      
      doc.setFont('helvetica', 'normal');
      yPos += 22;
    });
  }

  // Data content
  if (data.content) {
    addSectionTitle(`Dados de ${getTypeName(data.type)}`);

    // Handle different content types
    if (data.content.data) {
      const contentData = data.content.data;

      // Production data - limit to prevent memory issues
      if (contentData.production && Array.isArray(contentData.production)) {
        const maxRows = data.type === 'general' ? 10 : 15; // Reduce for general reports
        const tableData = contentData.production.slice(0, maxRows).map((item: any) => [
          item.operator || '-',
          item.block || '-',
          item.field || '-',
          `${(item.daily_production / 1000).toFixed(0)}K bpd`,
          item.status || '-',
        ]);

        if (tableData.length > 0) {
          checkNewPage(80); // Ensure enough space for table
          autoTable(doc, {
            startY: yPos,
            head: [['Operador', 'Bloco', 'Campo', 'Produção', 'Status']],
            body: tableData,
            margin: { left: margin, right: margin },
            headStyles: {
              fillColor: COLORS.dark,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 8,
              textColor: COLORS.dark,
            },
            alternateRowStyles: {
              fillColor: COLORS.light,
            },
            theme: 'grid',
            styles: {
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
            },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
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
            head: [['Tipo de Crude', 'Preço (USD)', 'Variação', 'Data']],
            body: tableData,
            margin: { left: margin, right: margin },
            headStyles: {
              fillColor: COLORS.dark,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 8,
              textColor: COLORS.dark,
            },
            alternateRowStyles: {
              fillColor: COLORS.light,
            },
            theme: 'grid',
            styles: {
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
            },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
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
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
            },
            bodyStyles: {
              fontSize: 8,
              textColor: COLORS.dark,
            },
            alternateRowStyles: {
              fillColor: COLORS.light,
            },
            theme: 'grid',
            styles: {
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
            },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
        }
      }
    }
  }

  // AI Analysis section (if AI generated)
  if (data.aiGenerated && data.content?.aiAnalysis) {
    doc.addPage();
    yPos = margin;
    addHeader();
    
    addSectionTitle('Análise de Inteligência Artificial');
    
    doc.setFillColor(230, 240, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 3, 3, 'F');
    
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(9);
    doc.text('Esta analise foi gerada automaticamente por modelos de IA treinados da AlphaData', margin + 5, yPos + 9);
    yPos += 20;
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  }

  // Disclaimer
  checkNewPage(35);
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const disclaimer = 'AVISO LEGAL: Este relatório foi gerado pela AlphaData - Inteligência de Mercado Petrolífero Angolano. As informações aqui contidas são para fins informativos e não constituem aconselhamento financeiro ou de investimento. A AlphaData não se responsabiliza por decisões tomadas com base neste documento. Todos os dados são provenientes de fontes oficiais e APIs de mercado em tempo real.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin - 10);
  doc.text(disclaimerLines, margin + 5, yPos + 8);

    // Add footers
    addFooter();

    // Save
    const safeType = data.type || 'Relatorio';
    const safePeriod = data.period?.replace(/\s+/g, '_') || new Date().toISOString().split('T')[0];
    const fileName = `AlphaData_${getTypeName(safeType)}_${safePeriod}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Enhanced error handling for large reports
    const isLargeReport = data.type === 'general';
    if (isLargeReport) {
      console.error('Large report generation failed - this may be due to memory constraints');
    }

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

    // Provide more specific error messages
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
      throw new Error('Relatório muito grande para gerar PDF. Tente reduzir a quantidade de dados ou use Excel.');
    }

    throw new Error(`Falha ao gerar PDF: ${errorMessage}`);
  }
};

/**
 * Generate DOCX Report with AlphaData branding
 */
export const generateDOCXReport = async (data: ReportData): Promise<void> => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get default cover page data
  const defaultCoverData = getDefaultCoverPageData();

  // Create document sections
  const children: any[] = [];

  // ===== COVER PAGE SECTION =====
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '═══════════════════════════════════════════════════════════',
          color: '1E293B',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'α ALPHADATA',
          bold: true,
          size: 56,
          color: 'DC2626',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'PÁGINA INFORMATIVA',
          bold: true,
          size: 24,
          color: '64748B',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),

    // Report Info Box
    new Paragraph({
      children: [
        new TextRun({
          text: `📋 ${data.title}`,
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Tipo: ', bold: true, size: 22 }),
        new TextRun({ text: getTypeName(data.type), size: 22 }),
        new TextRun({ text: '    |    Período: ', bold: true, size: 22 }),
        new TextRun({ text: data.period || 'Actual', size: 22 }),
        new TextRun({ text: '    |    Gerado: ', bold: true, size: 22 }),
        new TextRun({ text: formatDate(data.generatedAt), size: 22 }),
        data.aiGenerated ? new TextRun({ text: '    ✨ Gerado com IA', color: '1E40AF', size: 22 }) : new TextRun({ text: '' }),
      ],
      spacing: { after: 400 },
    }),

    // Generating Company Section
    new Paragraph({
      children: [
        new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: 'DC2626' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '🏢 EMPRESA GERADORA', bold: true, size: 24, color: '1E293B' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: defaultCoverData.generatingCompany.fullName, bold: true, size: 22 }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: defaultCoverData.generatingCompany.description, size: 20, color: '64748B' }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `📧 ${defaultCoverData.generatingCompany.contact}  |  🌐 ${defaultCoverData.generatingCompany.website}  |  📍 ${defaultCoverData.generatingCompany.address}`, size: 18, color: '64748B' }),
      ],
      spacing: { after: 300 },
    }),

    // Data Sources Section
    new Paragraph({
      children: [
        new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: '1E40AF' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '📊 FONTES DE DADOS', bold: true, size: 24, color: '1E293B' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
  );

  // Add data sources
  defaultCoverData.dataSources.forEach((source) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `• ${source.name}`, bold: true, size: 20 }),
          new TextRun({ text: ` [${source.type}]`, size: 18, color: '64748B' }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `  ${source.description}`, size: 18, color: '64748B', italics: true }),
        ],
        spacing: { after: 100 },
      }),
    );
  });

  // Country Info Section
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: '22C55E' }),
      ],
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '🌍 INFORMAÇÕES DO PAÍS', bold: true, size: 24, color: '1E293B' }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'País: ', bold: true, size: 20 }),
        new TextRun({ text: defaultCoverData.countryInfo.name, size: 20 }),
        new TextRun({ text: '  |  Região: ', bold: true, size: 20 }),
        new TextRun({ text: defaultCoverData.countryInfo.region, size: 20 }),
      ],
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Moeda: ', bold: true, size: 20 }),
        new TextRun({ text: defaultCoverData.countryInfo.currency, size: 20 }),
        new TextRun({ text: '  |  Idioma: ', bold: true, size: 20 }),
        new TextRun({ text: defaultCoverData.countryInfo.language, size: 20 }),
        new TextRun({ text: '  |  Fuso: ', bold: true, size: 20 }),
        new TextRun({ text: defaultCoverData.countryInfo.timezone, size: 20 }),
      ],
      spacing: { after: 300 },
    }),
  );

  // Requesting Company Section (if available)
  if (data.requestingCompany) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: 'B48232' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '🏛️ EMPRESA SOLICITANTE', bold: true, size: 24, color: '1E293B' }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Empresa: ', bold: true, size: 20 }),
          new TextRun({ text: data.requestingCompany.name, size: 20 }),
          data.requestingCompany.nif ? new TextRun({ text: `  |  NIF: ${data.requestingCompany.nif}`, size: 20 }) : new TextRun({ text: '' }),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          data.requestingCompany.sector ? new TextRun({ text: `Sector: ${data.requestingCompany.sector}`, size: 20 }) : new TextRun({ text: '' }),
          data.requestingCompany.country ? new TextRun({ text: `  |  País: ${data.requestingCompany.country}`, size: 20 }) : new TextRun({ text: '' }),
        ],
        spacing: { after: 300 },
      }),
    );
  }

  // Requested By Section (if available)
  if (data.requestedBy) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', color: '6464B4' }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '👤 SOLICITADO POR', bold: true, size: 24, color: '1E293B' }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Nome: ', bold: true, size: 20 }),
          new TextRun({ text: data.requestedBy.name, size: 20 }),
          data.requestedBy.role ? new TextRun({ text: `  |  Cargo: ${data.requestedBy.role}`, size: 20 }) : new TextRun({ text: '' }),
          data.requestedBy.email ? new TextRun({ text: `  |  Email: ${data.requestedBy.email}`, size: 20 }) : new TextRun({ text: '' }),
        ],
        spacing: { after: 300 },
      }),
    );
  }

  // Page Break before content
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '═══════════════════════════════════════════════════════════', color: '1E293B' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'FIM DA PÁGINA INFORMATIVA', size: 18, color: '64748B', italics: true }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      pageBreakBefore: true,
    }),
  );

  // ===== REPORT CONTENT =====
  // Title - with proper spacing
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'α ALPHADATA',
          bold: true,
          size: 52,
          color: 'DC2626',
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Inteligência de Mercado Petrolífero Angolano',
          size: 26,
          color: '64748B',
          italics: true,
        }),
      ],
      spacing: { after: 500 },
    }),
    new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Tipo: ',
          bold: true,
          size: 22,
        }),
        new TextRun({
          text: `${getTypeName(data.type)}`,
          size: 22,
        }),
        new TextRun({
          text: '    |    Período: ',
          bold: true,
          size: 22,
        }),
        new TextRun({
          text: `${data.period || 'Atual'}`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Gerado em: ',
          bold: true,
          size: 20,
          color: '64748B',
        }),
        new TextRun({
          text: formatDate(data.generatedAt),
          size: 20,
          color: '64748B',
        }),
        data.aiGenerated ? new TextRun({
          text: '    ✨ Gerado com Inteligência Artificial',
          size: 20,
          color: '1E40AF',
          bold: true,
        }) : new TextRun({ text: '' }),
      ],
      spacing: { after: 500 },
    })
  );

  // Summary - with improved spacing for readability
  if (data.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            color: 'DC2626',
          }),
        ],
        spacing: { before: 400 },
      }),
      new Paragraph({
        text: 'SUMÁRIO EXECUTIVO',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 24,
          }),
        ],
        spacing: { after: 400, line: 360 }, // 1.5 line spacing for better readability
      })
    );
  }

  // Highlights - with better visual separation
  if (data.highlights && data.highlights.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            color: '1E40AF',
          }),
        ],
        spacing: { before: 400 },
      }),
      new Paragraph({
        text: 'DESTAQUES PRINCIPAIS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 300 },
      })
    );

    const highlightRows = data.highlights.map(h => 
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h.title, size: 20 })],
            })],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h.value, bold: true, size: 24 })],
            })],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ 
                text: h.trend === 'up' ? '+' : h.trend === 'down' ? '-' : '=',
                color: h.trend === 'up' ? '22C55E' : h.trend === 'down' ? 'EF4444' : '64748B',
                size: 24,
                bold: true,
              })],
            })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );

    children.push(
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph({ children: [new TextRun({ text: 'Indicador', bold: true })] })],
                shading: { fill: '1E293B' },
              }),
              new TableCell({ 
                children: [new Paragraph({ children: [new TextRun({ text: 'Valor', bold: true })] })],
                shading: { fill: '1E293B' },
              }),
              new TableCell({ 
                children: [new Paragraph({ children: [new TextRun({ text: 'Tendência', bold: true })] })],
                shading: { fill: '1E293B' },
              }),
            ],
          }),
          ...highlightRows,
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  // Data section - with improved headers
  if (data.content?.data) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            color: '22C55E',
          }),
        ],
        spacing: { before: 500 },
      }),
      new Paragraph({
        text: `DADOS DE ${getTypeName(data.type).toUpperCase()}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 300 },
      })
    );

    // Production data table
    if (data.content.data.production && Array.isArray(data.content.data.production)) {
      const prodData = data.content.data.production.slice(0, 10);
      
      const headerRow = new TableRow({
        children: ['Operador', 'Bloco', 'Campo', 'Produção (bpd)', 'Status'].map(text => 
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })] })],
            shading: { fill: '1E293B' },
          })
        ),
      });

      const dataRows = prodData.map((item: any) => 
        new TableRow({
          children: [
            item.operator || '-',
            item.block || '-',
            item.field || '-',
            `${(item.daily_production / 1000).toFixed(0)}K`,
            item.status || '-',
          ].map(text => 
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(text), size: 20 })] })],
            })
          ),
        })
      );

      children.push(
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }
  }

  // Footer note
  children.push(
    new Paragraph({
      spacing: { before: 600 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '─────────────────────────────────────────────────',
          color: 'E5E7EB',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Este relatório foi gerado pela AlphaData - Inteligência de Mercado Petrolífero Angolano.',
          size: 16,
          color: '64748B',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'CONFIDENCIAL - USO INTERNO',
          size: 14,
          color: 'DC2626',
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
    })
  );

  // Create document with proper margins for better readability
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch = 1440 twips
            bottom: 1440,
            left: 1800, // 1.25 inches for binding
            right: 1440,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'AlphaData | ',
                  color: 'DC2626',
                  bold: true,
                  size: 20,
                }),
                new TextRun({
                  text: data.title,
                  color: '64748B',
                  size: 20,
                }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'AlphaData - Inteligência de Mercado Petrolífero Angolano | ',
                  color: '64748B',
                  size: 18,
                }),
                new TextRun({
                  text: 'CONFIDENCIAL',
                  color: 'DC2626',
                  bold: true,
                  size: 18,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
            }),
          ],
        }),
      },
      children,
    }],
  });

  // Generate and download
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

/**
 * Generate Excel Report with AlphaData branding
 */
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

  // Add cover page content first
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

  // Header rows with branding
  rows.push(`<Row>
    <Cell ss:StyleID="brand"><Data ss:Type="String">α ALPHADATA - Inteligência de Mercado Petrolífero Angolano</Data></Cell>
  </Row>`);
  rows.push(`<Row>
    <Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(data.title)}</Data></Cell>
  </Row>`);
  rows.push(`<Row>
    <Cell><Data ss:Type="String">Tipo: ${escapeXml(getTypeName(data.type))}</Data></Cell>
    <Cell><Data ss:Type="String">Período: ${escapeXml(data.period || 'Atual')}</Data></Cell>
    <Cell><Data ss:Type="String">Gerado em: ${data.generatedAt.toLocaleString('pt-AO')}</Data></Cell>
    <Cell><Data ss:Type="String">${data.aiGenerated ? '✨ Gerado com IA' : ''}</Data></Cell>
  </Row>`);
  rows.push(`<Row></Row>`);

  // Summary
  if (data.summary) {
    rows.push(`<Row>
      <Cell ss:StyleID="subheader"><Data ss:Type="String">Sumário Executivo</Data></Cell>
    </Row>`);
    rows.push(`<Row>
      <Cell ss:MergeAcross="4"><Data ss:Type="String">${escapeXml(data.summary.substring(0, 500))}</Data></Cell>
    </Row>`);
    rows.push(`<Row></Row>`);
  }

  // Highlights
  if (data.highlights && data.highlights.length > 0) {
    rows.push(`<Row>
      <Cell ss:StyleID="subheader"><Data ss:Type="String">Destaques</Data></Cell>
    </Row>`);
    rows.push(`<Row>
      <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Indicador</Data></Cell>
      <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Valor</Data></Cell>
      <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tendência</Data></Cell>
    </Row>`);
    data.highlights.forEach(h => {
      const trendSymbol = h.trend === 'up' ? '▲' : h.trend === 'down' ? '▼' : '►';
      rows.push(`<Row>
        <Cell><Data ss:Type="String">${escapeXml(h.title)}</Data></Cell>
        <Cell ss:StyleID="bold"><Data ss:Type="String">${escapeXml(h.value)}</Data></Cell>
        <Cell><Data ss:Type="String">${trendSymbol}</Data></Cell>
      </Row>`);
    });
    rows.push(`<Row></Row>`);
  }

  // Data content
  if (data.content?.data) {
    // Production data
    if (data.content.data.production && Array.isArray(data.content.data.production)) {
      rows.push(`<Row>
        <Cell ss:StyleID="subheader"><Data ss:Type="String">Dados de Produção</Data></Cell>
      </Row>`);
      rows.push(`<Row>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Operador</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Bloco</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Campo</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Produção Diária (bpd)</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Produção Mensal</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Status</Data></Cell>
      </Row>`);
      
      data.content.data.production.forEach((item: any) => {
        rows.push(`<Row>
          <Cell><Data ss:Type="String">${escapeXml(item.operator)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(item.block)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(item.field || '-')}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.daily_production || 0}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.monthly_production || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(item.status || 'active')}</Data></Cell>
        </Row>`);
      });
      rows.push(`<Row></Row>`);
    }

    // Price data
    if (data.content.data.prices && Array.isArray(data.content.data.prices)) {
      rows.push(`<Row>
        <Cell ss:StyleID="subheader"><Data ss:Type="String">Dados de Preços</Data></Cell>
      </Row>`);
      rows.push(`<Row>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tipo de Crude</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Preço (USD)</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Variação (%)</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Data</Data></Cell>
      </Row>`);
      
      data.content.data.prices.forEach((item: any) => {
        rows.push(`<Row>
          <Cell><Data ss:Type="String">${escapeXml(item.crude_type)}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.price || 0}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.change_percent || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${item.data_date || ''}</Data></Cell>
        </Row>`);
      });
      rows.push(`<Row></Row>`);
    }

    // Export data
    if (data.content.data.exports && Array.isArray(data.content.data.exports)) {
      rows.push(`<Row>
        <Cell ss:StyleID="subheader"><Data ss:Type="String">Dados de Exportações</Data></Cell>
      </Row>`);
      rows.push(`<Row>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Destino</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Volume (bbl)</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Valor (USD)</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Tanque</Data></Cell>
        <Cell ss:StyleID="tableHeader"><Data ss:Type="String">Status</Data></Cell>
      </Row>`);
      
      data.content.data.exports.forEach((item: any) => {
        rows.push(`<Row>
          <Cell><Data ss:Type="String">${escapeXml(item.destination)}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.volume || 0}</Data></Cell>
          <Cell><Data ss:Type="Number">${item.value_usd || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(item.tanker_name || '-')}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(item.status || '-')}</Data></Cell>
        </Row>`);
      });
    }
  }

  // Footer
  rows.push(`<Row></Row>`);
  rows.push(`<Row>
    <Cell ss:StyleID="footer" ss:MergeAcross="5"><Data ss:Type="String">Este relatório foi gerado pela AlphaData - Inteligência de Mercado Petrolífero Angolano. CONFIDENCIAL - USO INTERNO</Data></Cell>
  </Row>`);

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

/**
 * Download report in specified format
 */
export const downloadReport = async (
  data: ReportData,
  format: 'pdf' | 'docx' | 'excel'
): Promise<void> => {
  switch (format) {
    case 'pdf':
      generatePDFReport(data);
      break;
    case 'docx':
      await generateDOCXReport(data);
      break;
    case 'excel':
      generateExcelReport(data);
      break;
  }
};
