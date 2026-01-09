/**
 * Utility functions for exporting data to CSV and Excel formats
 */

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  format: 'csv' | 'excel';
}

/**
 * Formats a value for CSV/Excel export
 */
const formatValue = (value: any, formatter?: (value: any) => string): string => {
  if (formatter) {
    return formatter(value);
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('pt-AO');
  }
  // Escape quotes and wrap in quotes if contains comma or newline
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

/**
 * Generates CSV content from data
 */
const generateCSV = (options: ExportOptions): string => {
  const { columns, data } = options;
  
  // Header row
  const headerRow = columns.map(col => formatValue(col.header)).join(',');
  
  // Data rows
  const dataRows = data.map(row => 
    columns.map(col => formatValue(row[col.key], col.formatter)).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Generates Excel-compatible XML content
 */
const generateExcelXML = (options: ExportOptions): string => {
  const { columns, data } = options;
  
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };
  
  const headerCells = columns.map(col => 
    `<Cell><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`
  ).join('');
  
  const dataRows = data.map(row => {
    const cells = columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.formatter ? col.formatter(value) : value;
      const type = typeof value === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${escapeXml(String(formattedValue ?? ''))}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Dados">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
};

/**
 * Downloads data as a file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export data to CSV or Excel format
 */
export const exportData = (options: ExportOptions): void => {
  const { filename, format } = options;
  
  if (format === 'csv') {
    const csv = generateCSV(options);
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  } else {
    const excel = generateExcelXML(options);
    downloadFile(excel, `${filename}.xls`, 'application/vnd.ms-excel');
  }
};

/**
 * Filter data by date range
 */
export const filterDataByDateRange = <T extends Record<string, any>>(
  data: T[],
  dateField: string,
  startDate?: Date,
  endDate?: Date
): T[] => {
  if (!startDate && !endDate) return data;
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('pt-AO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
