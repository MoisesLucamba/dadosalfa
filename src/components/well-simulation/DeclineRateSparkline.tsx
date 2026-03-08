import { useMemo } from "react";

const DECLINE_HISTORY = [21000, 20200, 19600, 19100, 18800, 18500];

export function DeclineRateRow() {
  const declineRate = useMemo(() => {
    const len = DECLINE_HISTORY.length;
    if (len < 2) return 0;
    const monthlyRates = [];
    for (let i = 1; i < len; i++) {
      monthlyRates.push(((DECLINE_HISTORY[i - 1] - DECLINE_HISTORY[i]) / DECLINE_HISTORY[i - 1]) * 100);
    }
    return monthlyRates.reduce((a, b) => a + b, 0) / monthlyRates.length;
  }, []);

  const isHigh = declineRate > 5;

  // Mini sparkline SVG
  const max = Math.max(...DECLINE_HISTORY);
  const min = Math.min(...DECLINE_HISTORY);
  const range = max - min || 1;
  const w = 48, h = 16;
  const points = DECLINE_HISTORY.map((v, i) => {
    const x = (i / (DECLINE_HISTORY.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex justify-between border-b border-[#0a1830] py-1.5 items-center">
      <span className="text-[9.5px] text-[#3a6a8a] font-mono">Taxa de Declínio</span>
      <div className="flex items-center gap-2">
        <svg width={w} height={h} className="opacity-70">
          <polyline
            points={points}
            fill="none"
            stroke={isHigh ? "#ffb830" : "#00e5a0"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-[9.5px] font-bold font-mono"
          style={{ color: isHigh ? "#ffb830" : "#00e5a0" }}
        >
          {declineRate.toFixed(1)}%/mês
        </span>
      </div>
    </div>
  );
}
