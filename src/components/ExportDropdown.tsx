/**
 * Universal export dropdown for tables and charts.
 * Attach to any card/table/chart via top-right positioning.
 */
import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table2, FileJson, Image } from 'lucide-react';

type ExportFormat = 'pdf' | 'csv' | 'json' | 'png';

interface ExportDropdownProps {
  /** Data to export (array of objects for tables, or raw object) */
  data: any;
  /** Filename prefix */
  filename?: string;
  /** Show PNG option (for charts) */
  showPng?: boolean;
  /** Container ref for PNG capture */
  captureRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function ExportDropdown({
  data,
  filename = 'Elastra_Export',
  showPng = false,
  captureRef,
  className = '',
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportCSV = () => {
    try {
      const arr = Array.isArray(data) ? data : [data];
      if (arr.length === 0) return;
      const headers = Object.keys(arr[0]);
      const csv = [
        headers.join(','),
        ...arr.map(row => headers.map(h => `"${String(row[h] ?? '')}"`).join(',')),
      ].join('\n');
      downloadBlob(csv, `${filename}.csv`, 'text/csv');
    } catch { /* skip */ }
    setOpen(false);
  };

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadBlob(json, `${filename}.json`, 'application/json');
    setOpen(false);
  };

  const exportPDF = () => {
    window.print();
    setOpen(false);
  };

  const exportPNG = async () => {
    if (!captureRef?.current) return;
    try {
      const canvas = await import('html2canvas').then(m => m.default(captureRef.current!));
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback: just close
    }
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:text-[#00A3FF] hover:bg-[rgba(0,163,255,0.10)]"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exportar</span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          <ExportItem icon={FileText} label="PDF Report" onClick={exportPDF} />
          <ExportItem icon={Table2} label="CSV" onClick={exportCSV} />
          <ExportItem icon={FileJson} label="JSON" onClick={exportJSON} />
          {showPng && <ExportItem icon={Image} label="PNG Image" onClick={exportPNG} />}
        </div>
      )}
    </div>
  );
}

function ExportItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-foreground/80 transition-colors duration-150 hover:bg-accent/10 hover:text-foreground"
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
