/**
 * Rich custom tooltip for Recharts charts.
 * Dark theme with accent border, monospace numbers.
 */

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit?: string;
  showChange?: boolean;
}

export function RichChartTooltip({ active, payload, label, unit = '', showChange = false }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl"
      style={{
        background: '#0D1117',
        border: '1px solid rgba(0,163,255,0.20)',
      }}
    >
      <p className="text-[10px] font-medium text-[#6B7A99] mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color || '#00A3FF' }}
          />
          <span className="text-[11px] text-[#E8EDF5]">{entry.name || ''}</span>
          <span className="text-xs font-bold font-mono text-[#E8EDF5] ml-auto">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {unit && ` ${unit}`}
          </span>
        </div>
      ))}
      {showChange && payload[0]?.payload?.change != null && (
        <p className={`text-[10px] font-mono mt-1 ${payload[0].payload.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {payload[0].payload.change >= 0 ? '+' : ''}{payload[0].payload.change.toFixed(2)}%
        </p>
      )}
    </div>
  );
}
