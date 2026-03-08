/**
 * LiveIndicator — green pulsing dot + "LIVE" text for real-time metrics
 * LastUpdatedText — "Actualizado há Xs" footer
 */
import { formatLastUpdated } from '@/utils/formatUnit';

interface LiveIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function LiveIndicator({ className = '', showLabel = true }: LiveIndicatorProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      {showLabel && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
          Live
        </span>
      )}
    </span>
  );
}

interface LastUpdatedTextProps {
  seconds: number;
  lang?: string;
  className?: string;
}

export function LastUpdatedText({ seconds, lang = 'pt', className = '' }: LastUpdatedTextProps) {
  return (
    <span className={`text-[10px] text-muted-foreground ${className}`}>
      {formatLastUpdated(seconds, lang)}
    </span>
  );
}
