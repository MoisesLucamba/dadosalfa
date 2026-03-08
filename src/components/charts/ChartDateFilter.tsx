/**
 * ChartDateFilter — pill button group for time-series chart date filtering.
 * [7D] [1M] [3M] [6M] [1A] [MAX]
 */
import { cn } from '@/lib/utils';

export type DateRange = '7D' | '1M' | '3M' | '6M' | '1A' | 'MAX';

interface ChartDateFilterProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const RANGES: DateRange[] = ['7D', '1M', '3M', '6M', '1A', 'MAX'];

export function ChartDateFilter({ selected, onChange, className }: ChartDateFilterProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200',
            selected === r
              ? 'bg-[#00A3FF] text-white shadow-sm'
              : 'bg-transparent border border-[hsl(215_25%_15%)] text-muted-foreground hover:border-[#00A3FF]/40 hover:text-foreground'
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

/** Filter data array by date range */
export function filterByDateRange<T extends { date?: string; data_date?: string }>(
  data: T[],
  range: DateRange
): T[] {
  if (range === 'MAX') return data;
  
  const now = new Date();
  const daysMap: Record<DateRange, number> = {
    '7D': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1A': 365,
    'MAX': Infinity,
  };
  
  const cutoff = new Date(now.getTime() - daysMap[range] * 86400000);
  
  return data.filter(item => {
    const dateStr = item.date || item.data_date;
    if (!dateStr) return true;
    return new Date(dateStr) >= cutoff;
  });
}
