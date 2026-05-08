import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { Button } from "@/components/ui/button";

const ChartTooltipDark = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#040f22]/95 border border-[#00a8ff]/20 rounded-lg p-3 shadow-xl shadow-black/40 backdrop-blur-sm">
      <p className="text-[#6a9ec4] text-[10px] mb-1.5 font-mono tracking-wider">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-[10px] font-mono flex justify-between gap-4" style={{ color: e.color || e.stroke }}>
          <span className="opacity-70">{e.name}</span>
          <b>{typeof e.value === "number" ? e.value.toLocaleString("pt-AO") : e.value}</b>
        </p>
      ))}
    </div>
  );
};

function generateForecastData(currentProd: number, days: number) {
  const data = [];
  const weekCount = Math.ceil(days / 7);
  const declineRate = 0.003; // per week
  const now = new Date();

  for (let w = 0; w <= weekCount; w++) {
    const date = new Date(now);
    date.setDate(date.getDate() + w * 7);
    const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;

    const predicted = Math.round(currentProd * Math.pow(1 - declineRate, w));
    const upper = Math.round(predicted * 1.06);
    const lower = Math.round(predicted * 0.94);

    data.push({
      date: dateStr,
      predicted,
      upper,
      lower,
      week: w,
    });
  }
  return data;
}

export function AIForecastChart({ currentProd }: { currentProd: number }) {
  const [range, setRange] = useState<30 | 60 | 90>(90);
  const btnEffect = "transition-all duration-200 active:scale-[0.97]";

  const data = useMemo(() => generateForecastData(currentProd, range), [currentProd, range]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] text-[#2a5272] tracking-widest uppercase font-mono">PREVISÃO DE PRODUÇÃO — IA</p>
          <p className="text-[8px] text-[#1a3a5a] font-mono mt-0.5">Modelo preditivo 30/60/90 dias</p>
        </div>
        <div className="flex gap-1">
          {([30, 60, 90] as const).map(d => (
            <Button key={d} size="sm"
              className={`h-5 text-[8px] px-2 font-mono tracking-wider ${btnEffect} ${range === d
                ? "bg-[#F5A623]/15 border border-[#F5A623]/40 text-[#F5A623]"
                : "bg-transparent border border-[#0a2040] text-[#3a6a8a] hover:text-[#F5A623]"}`}
              onClick={() => setRange(d)}>
              {d}D
            </Button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(26,92,255,0.08)" />
              <stop offset="100%" stopColor="rgba(26,92,255,0.02)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 7, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fontSize: 7, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} domain={["auto", "auto"]} />
          <Tooltip content={<ChartTooltipDark />} />
          <ReferenceLine y={currentProd} stroke="rgba(255,255,255,0.25)" strokeDasharray="6 4" label={{ value: "Actual", fill: "#6a9ec4", fontSize: 7, fontFamily: "Courier New", position: "insideTopRight" }} />
          <Area type="monotone" dataKey="upper" stroke="rgba(26,92,255,0.4)" strokeDasharray="4 3" strokeWidth={1} fill="url(#confBand)" name="Conf. Superior" />
          <Area type="monotone" dataKey="lower" stroke="rgba(26,92,255,0.4)" strokeDasharray="4 3" strokeWidth={1} fill="none" name="Conf. Inferior" />
          <Area type="monotone" dataKey="predicted" stroke="#F5A623" strokeWidth={2} fill="none" name="Produção Prevista" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
