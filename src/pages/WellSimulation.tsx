import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Eye, Plus, Download, Save, Upload, Cpu, Activity, Layers,
  BarChart3, TrendingDown, Shield, Crosshair, Droplets, Thermometer,
  FileText, Trash2, Zap,
} from "lucide-react";

/* ─── WELL DATA (Angolan basins) ─────────────────────────────── */
const DEFAULT_WELLS = [
  { id: "w1", name: "Girassol-4", block: "Bloco 17", op: "TotalEnergies", field: "Girassol", basin: "Congo", type: "Produção", depth: 4250, wd: 1360, status: "Concluído", prob: 92, risk: "Baixo", prod: 18500, api: 30.2, lat: -7.35, lng: 11.82 },
  { id: "w2", name: "Dalia-7", block: "Bloco 17", op: "TotalEnergies", field: "Dalia", basin: "Congo", type: "Desenvolvimento", depth: 3890, wd: 1400, status: "Em análise", prob: 85, risk: "Médio", prod: 15200, api: 23.6, lat: -7.42, lng: 11.75 },
  { id: "w3", name: "Kaombo Norte-2", block: "Bloco 32", op: "TotalEnergies", field: "Kaombo", basin: "Congo", type: "Exploração", depth: 4680, wd: 1950, status: "Concluído", prob: 78, risk: "Médio", prod: 22400, api: 27.8, lat: -7.58, lng: 11.64 },
  { id: "w4", name: "Plutónio-A3", block: "Bloco 18", op: "BP", field: "Plutónio", basin: "Congo", type: "Produção", depth: 3540, wd: 1300, status: "Concluído", prob: 88, risk: "Baixo", prod: 16800, api: 33.1, lat: -7.68, lng: 11.55 },
  { id: "w5", name: "Kissanje-5", block: "Bloco 15/06", op: "Eni Angola", field: "Kissanje", basin: "Kwanza", type: "Avaliação", depth: 3980, wd: 850, status: "Em análise", prob: 71, risk: "Alto", prod: 8900, api: 29.4, lat: -8.12, lng: 12.34 },
  { id: "w6", name: "Mafumeira Sul-1", block: "Bloco 0", op: "Chevron", field: "Mafumeira Sul", basin: "Cabinda", type: "Exploração", depth: 2450, wd: 65, status: "Concluído", prob: 94, risk: "Baixo", prod: 11200, api: 36.5, lat: -5.42, lng: 12.08 },
  { id: "w7", name: "Pazflor-B2", block: "Bloco 17", op: "TotalEnergies", field: "Pazflor", basin: "Congo", type: "Desenvolvimento", depth: 4120, wd: 1200, status: "Pendente", prob: 82, risk: "Médio", prod: 19600, api: 25.9, lat: -7.31, lng: 11.88 },
  { id: "w8", name: "CLOV-E1", block: "Bloco 17", op: "TotalEnergies", field: "CLOV", basin: "Congo", type: "Produção", depth: 3750, wd: 1350, status: "Concluído", prob: 90, risk: "Baixo", prod: 21000, api: 31.7, lat: -7.39, lng: 11.79 },
];

const PROD_DATA = [
  { m: "Jan", real: 145200, cap: 168000, ai: 142000 },
  { m: "Fev", real: 142800, cap: 168000, ai: 139500 },
  { m: "Mar", real: 139500, cap: 165000, ai: 137000 },
  { m: "Abr", real: 137200, cap: 165000, ai: 134500 },
  { m: "Mai", real: 135100, cap: 162000, ai: 132000 },
  { m: "Jun", real: 133800, cap: 162000, ai: 130000 },
  { m: "Jul", real: 131500, cap: 160000, ai: 128000 },
  { m: "Ago", real: 129800, cap: 160000, ai: 126500 },
];

const GEO_RADAR = [
  { s: "Porosidade", A: 78, B: 65 },
  { s: "Permeab.", A: 85, B: 72 },
  { s: "Saturação", A: 62, B: 58 },
  { s: "Net Pay", A: 91, B: 80 },
  { s: "Conectiv.", A: 70, B: 55 },
  { s: "Pressão", A: 82, B: 75 },
];

const RISK_DATA = [
  { f: "Pressão do Reserv.", v: 72, t: 80 },
  { f: "Integridade", v: 88, t: 90 },
  { f: "Risco Geológico", v: 45, t: 60 },
  { f: "Subsidência", v: 32, t: 50 },
  { f: "Corrosão", v: 58, t: 70 },
  { f: "H₂S / CO₂", v: 25, t: 40 },
];

const DECLINE = [
  { y: "2024", r: 26500, p: 26500 },
  { y: "2025", r: 24200, p: 24800 },
  { y: "2026", r: 22100, p: 23200 },
  { y: "2027", r: null, p: 21700 },
  { y: "2028", r: null, p: 20300 },
  { y: "2029", r: null, p: 19100 },
  { y: "2030", r: null, p: 18000 },
];

/* ─── 3D MATH HELPERS ────────────────────────────────────────── */
function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}
function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}
function project(x: number, y: number, z: number, fov: number, cx: number, cy: number): [number, number, number] {
  const scale = fov / (fov + z);
  return [cx + x * scale, cy + y * scale, scale];
}

/* ─── WELL CANVAS (custom 3D) ─────────────────────────────────── */
function WellCanvas({ well, viewMode = "3d" }: { well: typeof DEFAULT_WELLS[0]; viewMode?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const T = useRef(0);
  const cam = useRef({ yaw: 0.4, pitch: 0.3, zoom: 1, autoSpin: true });
  const drag = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 });
  const particles = useRef<any[]>([]);
  const viewModeRef = useRef(viewMode);
  const blend = useRef(1);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    particles.current = Array.from({ length: 90 }, () => ({
      u: (Math.random() - 0.5) * 8, v: Math.random() * 600,
      vy: -(0.4 + Math.random() * 1.1), r: 1 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.5, hue: 175 + Math.random() * 50,
    }));

    const onDown = (e: MouseEvent) => { drag.current = { active: true, lastX: e.clientX, lastY: e.clientY, velX: 0, velY: 0 }; cam.current.autoSpin = false; canvas.style.cursor = "grabbing"; };
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX, dy = e.clientY - drag.current.lastY;
      cam.current.yaw += dx * 0.008;
      cam.current.pitch += dy * 0.006 * blend.current;
      cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch));
      drag.current.lastX = e.clientX; drag.current.lastY = e.clientY;
      drag.current.velX = dx; drag.current.velY = dy;
    };
    const onUp = () => { drag.current.active = false; canvas.style.cursor = "grab"; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); cam.current.zoom = Math.max(0.35, Math.min(2.8, cam.current.zoom - e.deltaY * 0.001)); };
    const onDblClick = () => { cam.current.autoSpin = !cam.current.autoSpin; };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDblClick);
    canvas.style.cursor = "grab";

    const C = { bg: "#030e22", primary: "#00a8ff", green: "#00e5a0", amber: "#ffb830", red: "#ff4365", textMuted: "rgba(180,210,255,0.45)", textDim: "rgba(120,165,220,0.6)", border: "rgba(0,168,255,0.12)" };

    const draw = (ts: number) => {
      T.current = ts * 0.001;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const vm = viewModeRef.current;
      const blendTarget = vm === "3d" ? 1 : vm === "2d" ? 0 : 0.5;
      blend.current += (blendTarget - blend.current) * 0.055;
      const b = blend.current;

      if (!drag.current.active) {
        drag.current.velX *= 0.88; drag.current.velY *= 0.88;
        if (!cam.current.autoSpin) {
          cam.current.yaw += drag.current.velX * 0.004;
          cam.current.pitch += drag.current.velY * 0.003 * b;
          cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch));
        }
      }
      if (cam.current.autoSpin) cam.current.yaw += (0.004 + 0.003 * b);

      const { yaw, pitch, zoom } = cam.current;
      const ePitch = pitch * b + (-0.04) * (1 - b);
      const eYaw = yaw * b + (Math.PI * 0.07) * (1 - b);
      const cx = W / 2, cy = H / 2;
      const fov = 360 * zoom;

      const toScreen = (wx: number, wy: number, wz: number) => {
        let [x, y, z] = rotateX(wx, wy, wz, ePitch);
        [x, y, z] = rotateY(x, y, z, eYaw);
        return project(x, y, z, fov, cx, cy);
      };

      // Background
      const bgR = ctx.createRadialGradient(cx, cy * 0.4, 0, cx, cy, Math.max(W, H) * 0.85);
      bgR.addColorStop(0, "#030e22"); bgR.addColorStop(1, "#010512");
      ctx.fillStyle = bgR; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,20,60,0.02)";
      for (let sl = 0; sl < H; sl += 2) ctx.fillRect(0, sl, W, 1);

      const SEA_Y = 85, BED_Y = 0, HALF = 130;
      const TOTAL_D = -420 * (well.depth / 5000);
      const RES_Y = TOTAL_D * 0.75;
      const devX = 65 * (well.depth / 5000);
      const devZ = 22 * (well.depth / 5000);

      // Geological layers
      const layers = [
        { y0: BED_Y, y1: BED_Y - 30, col: "#5c2a0a", label: "ARGILA" },
        { y0: BED_Y - 30, y1: BED_Y - 68, col: "#3a1a06", label: "FOLHELHO" },
        { y0: BED_Y - 68, y1: BED_Y - 125, col: "#2a3a15", label: "ARENITO" },
        { y0: BED_Y - 125, y1: BED_Y - 192, col: "#1a2a0f", label: "CALCÁRIO" },
        { y0: BED_Y - 192, y1: TOTAL_D + 30, col: "#0a1c08", label: "RESERVATÓRIO" },
      ];
      layers.forEach(({ y0, y1, col, label }) => {
        const corners = [
          [-HALF, y0, HALF], [HALF, y0, HALF], [HALF, y0, -HALF], [-HALF, y0, -HALF],
          [-HALF, y1, HALF], [HALF, y1, HALF], [HALF, y1, -HALF], [-HALF, y1, -HALF],
        ].map(([x, y, z]) => toScreen(x, y, z));
        if (b > 0.04) {
          [[0, 1, 2, 3], [0, 1, 5, 4], [1, 2, 6, 5], [3, 2, 6, 7], [0, 3, 7, 4]].forEach((f, fi) => {
            ctx.beginPath(); f.forEach((ci, ii) => { const [sx, sy] = corners[ci]; ii === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); }); ctx.closePath();
            ctx.fillStyle = col + Math.round([0.9, 0.62, 0.72, 0.48, 0.58][fi] * 200).toString(16).padStart(2, "0");
            ctx.globalAlpha = b; ctx.fill(); ctx.globalAlpha = 1;
          });
          const [lx, ly] = toScreen(HALF + 5, (y0 + y1) / 2, -HALF);
          ctx.fillStyle = `rgba(100,190,100,${b * 0.42})`; ctx.font = "8px 'Courier New',monospace"; ctx.fillText(label, lx, ly);
        }
      });

      // Sea surface
      {
        const surf = [[-HALF, SEA_Y, HALF], [HALF, SEA_Y, HALF], [HALF, SEA_Y, -HALF], [-HALF, SEA_Y, -HALF]]
          .map(([x, _y, z]) => toScreen(x, SEA_Y + Math.sin(x * 0.05 + T.current) * 2, z));
        ctx.beginPath(); surf.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)); ctx.closePath();
        ctx.fillStyle = "rgba(0,80,180,0.15)"; ctx.fill();
        ctx.strokeStyle = `rgba(0,168,255,${0.28 + Math.sin(T.current) * 0.08})`; ctx.lineWidth = 1.5; ctx.stroke();
      }

      // FPSO
      {
        const hy = SEA_Y + 5, hw = 70, hh = 10, hd = 22;
        const hull = [[-hw, hy, -hd], [hw, hy, -hd], [hw, hy, hd], [-hw, hy, hd], [-hw, hy - hh, -hd], [hw, hy - hh, -hd], [hw, hy - hh, hd], [-hw, hy - hh, hd]]
          .map(([x, y, z]) => toScreen(x, y, z));
        [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]].forEach((f, fi) => {
          ctx.beginPath(); f.forEach((ci, ii) => ii === 0 ? ctx.moveTo(hull[ci][0], hull[ci][1]) : ctx.lineTo(hull[ci][0], hull[ci][1])); ctx.closePath();
          ctx.fillStyle = ["#2a3d5e", "#1a2a3e", "#243550", "#1e3048", "#1a2840", "#243050"][fi]; ctx.fill();
          ctx.strokeStyle = "rgba(0,168,255,0.25)"; ctx.lineWidth = 0.8; ctx.stroke();
        });
        const fp = toScreen(62, hy + 22, 0);
        const fR = 7 + Math.sin(T.current * 4) * 4;
        const fg = ctx.createRadialGradient(fp[0], fp[1], 0, fp[0], fp[1], fR * 2.5);
        fg.addColorStop(0, "rgba(255,210,0,0.95)"); fg.addColorStop(0.3, "rgba(255,100,0,0.55)"); fg.addColorStop(1, "rgba(255,80,0,0)");
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fp[0], fp[1], fR * 2.5, 0, Math.PI * 2); ctx.fill();
      }

      // Riser
      {
        const rPts = [SEA_Y, SEA_Y * 0.55, SEA_Y * 0.25, BED_Y].map(ry => toScreen(0, ry, 0));
        ctx.beginPath(); ctx.moveTo(rPts[0][0], rPts[0][1]); rPts.slice(1).forEach(([sx, sy]) => ctx.lineTo(sx, sy));
        ctx.strokeStyle = "#3a6090"; ctx.lineWidth = 5 * zoom; ctx.stroke();
      }

      // Wellbore
      {
        const nPts = 24;
        const wPts = Array.from({ length: nPts + 1 }, (_, i) => {
          const u = i / nPts;
          return toScreen(Math.sin(u * 0.7) * devX, BED_Y + (TOTAL_D - BED_Y) * u, Math.sin(u * 0.5) * devZ);
        });
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "#4a7aaa"; ctx.lineWidth = 7 * zoom; ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.shadowBlur = 6; ctx.shadowColor = "rgba(0,100,200,0.4)"; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "rgba(120,200,255,0.18)"; ctx.lineWidth = 2.5 * zoom; ctx.stroke();
      }

      // Fault line
      if (well.risk !== "Baixo") {
        const f1 = toScreen(-92, BED_Y - 18, 22), f2 = toScreen(-62, TOTAL_D + 35, -12);
        ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "rgba(255,67,101,0.55)"; ctx.lineWidth = 1.8;
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(255,67,101,0.5)";
        ctx.beginPath(); ctx.moveTo(f1[0], f1[1]); ctx.lineTo(f2[0], f2[1]); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,67,101,0.82)"; ctx.font = "bold 9px 'Courier New',monospace";
        ctx.fillText("FALHA", f1[0] + 4, f1[1] + 14); ctx.restore();
      }

      // Reservoir glow
      {
        const [rx, ry] = toScreen(devX * 0.78, RES_Y, 0);
        const pulse = 0.7 + Math.sin(T.current * 1.5) * 0.3;
        const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 72 * zoom);
        rg.addColorStop(0, `rgba(0,229,160,${0.38 * pulse})`); rg.addColorStop(1, "rgba(0,100,60,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, ry, 72 * zoom, 0, Math.PI * 2); ctx.fill();
      }

      // Perforations
      for (let pi = 0; pi < 6; pi++) {
        const u = 0.72 + pi * 0.04;
        const [sx, sy] = toScreen(Math.sin(u * 0.7) * devX, BED_Y + (TOTAL_D - BED_Y) * u, Math.sin(pi * 1.1) * 11);
        const pA = 0.5 + Math.sin(T.current * 3 + pi * 1.2) * 0.5;
        ctx.fillStyle = `rgba(0,168,255,${0.72 * pA})`; ctx.shadowBlur = 7; ctx.shadowColor = "#00a8ff";
        ctx.beginPath(); ctx.arc(sx, sy, 3 * zoom, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }

      // Oil particles
      particles.current.forEach(p => {
        p.v += p.vy;
        if (p.v < -SEA_Y * 0.25) p.v = 600;
        const u = Math.max(0, Math.min(1, (600 - p.v) / 600));
        const [sx, sy, sc] = toScreen(
          Math.sin(u * 0.7) * devX + p.u * 0.3,
          BED_Y + (TOTAL_D - BED_Y) * u * 0.9 + (600 - p.v) * 0.25,
          Math.sin(u * 0.5) * devZ + p.u * 0.15
        );
        if (sc < 0) return;
        const a = p.alpha * (0.4 + Math.sin(T.current * 2 + p.v * 0.03) * 0.4);
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, p.r * sc * 1.8, 0, Math.PI * 2); ctx.fill();
      });

      // HUD
      const hud = [
        { label: "PRESSÃO", value: `${(well.depth * 0.1).toFixed(0)} BAR`, col: "#00a8ff" },
        { label: "TEMP", value: `${(120 + well.depth * 0.015).toFixed(0)}°C`, col: "#ffb830" },
        { label: "API", value: `${well.api}°`, col: "#00e5a0" },
        { label: "PROD", value: `${(well.prod / 1000).toFixed(1)}k bbl/d`, col: "#00a8ff" },
      ];
      hud.forEach((h, i) => {
        const hx = 12, hy2 = 52 + i * 38;
        ctx.fillStyle = "rgba(2,8,24,0.82)"; ctx.beginPath(); ctx.roundRect(hx, hy2, 112, 30, 5); ctx.fill();
        ctx.strokeStyle = h.col + "40"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(hx, hy2, 112, 30, 5); ctx.stroke();
        ctx.fillStyle = h.col + "90"; ctx.font = "7px 'Courier New',monospace"; ctx.fillText(h.label, hx + 7, hy2 + 11);
        ctx.fillStyle = h.col; ctx.font = "bold 11px 'Courier New',monospace"; ctx.fillText(h.value, hx + 7, hy2 + 23);
      });

      // Risk badge
      const rCol = well.risk === "Baixo" ? "#00e5a0" : well.risk === "Médio" ? "#ffb830" : "#ff4365";
      ctx.fillStyle = "rgba(2,8,24,0.85)"; ctx.beginPath(); ctx.roundRect(W - 132, 12, 120, 34, 5); ctx.fill();
      ctx.fillStyle = rCol; ctx.font = "bold 9px 'Courier New',monospace"; ctx.fillText(`RISCO ${well.risk.toUpperCase()}`, W - 110, 33);

      // Title
      ctx.fillStyle = "rgba(2,8,24,0.78)"; ctx.beginPath(); ctx.roundRect(cx - 102, 10, 204, 34, 5); ctx.fill();
      ctx.fillStyle = "#00a8ff"; ctx.font = "bold 11px 'Courier New',monospace"; ctx.textAlign = "center"; ctx.fillText(well.name.toUpperCase(), cx, 28);
      ctx.fillStyle = "rgba(180,210,255,0.45)"; ctx.font = "8px 'Courier New',monospace"; ctx.fillText(`${well.block} · ${well.op}`, cx, 41); ctx.textAlign = "left";

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousedown", onDown); canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", onWheel); canvas.removeEventListener("dblclick", onDblClick);
    };
  }, [well]);

  return <canvas ref={canvasRef} className="w-full h-full block select-none touch-none" />;
}

/* ─── TOOLTIP ────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-border rounded-lg p-3 backdrop-blur-sm shadow-lg">
      <p className="text-muted-foreground text-xs mb-1 font-mono">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-xs font-mono" style={{ color: e.color }}>
          {e.name}: <b>{typeof e.value === "number" ? e.value.toLocaleString("pt-AO") : e.value}</b>
        </p>
      ))}
    </div>
  );
};

/* ─── CIRCULAR GAUGE ─────────────────────────────────────────── */
function Gauge({ value, max = 100, label, color = "hsl(var(--primary))", size = 88 }: { value: number; max?: number; label: string; color?: string; size?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: "stroke-dasharray 1s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dy="4" fill={color} fontSize="16" fontWeight="bold" fontFamily="monospace">{value}</text>
        <text x="44" y="58" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="8" fontFamily="monospace">/ {max}</text>
      </svg>
      <span className="text-[9px] text-muted-foreground font-mono tracking-widest uppercase">{label}</span>
    </div>
  );
}

/* ─── RISK BAR ───────────────────────────────────────────────── */
function RiskBar({ label, value, threshold }: { label: string; value: number; threshold: number }) {
  const col = value >= threshold ? "#ff4365" : value >= threshold * 0.7 ? "#ffb830" : "#00e5a0";
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-mono">{label}</span>
        <span className="text-[10px] font-mono font-bold" style={{ color: col }}>{value}%</span>
      </div>
      <div className="relative h-1.5 bg-muted rounded-full">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1 }}
          className="h-full rounded-full" style={{ background: col, boxShadow: `0 0 8px ${col}60` }} />
        <div className="absolute top-[-3px] h-3 w-0.5 rounded-full" style={{ left: `${threshold}%`, background: "#ff436580" }} />
      </div>
    </div>
  );
}

/* ─── PDF EXPORT ─────────────────────────────────────────────── */
function generateSimulationPDF(well: typeof DEFAULT_WELLS[0]) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Cover
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, w, 297, "F");
  doc.setTextColor(0, 168, 255);
  doc.setFontSize(28);
  doc.text("AlphaData", 20, 40);
  doc.setFontSize(10);
  doc.setTextColor(120, 165, 220);
  doc.text("Simulação de Poços · Relatório Técnico", 20, 52);
  doc.setDrawColor(0, 168, 255);
  doc.line(20, 60, w - 20, 60);

  doc.setFontSize(22);
  doc.setTextColor(232, 244, 255);
  doc.text(well.name, 20, 85);
  doc.setFontSize(12);
  doc.setTextColor(0, 229, 160);
  doc.text(`${well.block} · ${well.op}`, 20, 98);

  doc.setFontSize(10);
  doc.setTextColor(180, 210, 255);
  const info = [
    ["Campo", well.field],
    ["Bacia", well.basin],
    ["Tipo", well.type],
    ["Profundidade Total", `${well.depth.toLocaleString()} m`],
    ["Lâmina d'Água", `${well.wd.toLocaleString()} m`],
    ["API Gravity", `${well.api}°`],
    ["Produção Diária", `${well.prod.toLocaleString()} bbl/d`],
    ["Prob. Sucesso", `${well.prob}%`],
    ["Nível de Risco", well.risk],
    ["Status", well.status],
    ["Coordenadas", `${well.lat.toFixed(2)}°S, ${well.lng.toFixed(2)}°E`],
  ];
  let y = 120;
  info.forEach(([k, v]) => {
    doc.setTextColor(120, 165, 220);
    doc.text(k, 20, y);
    doc.setTextColor(232, 244, 255);
    doc.text(String(v), 90, y);
    y += 10;
  });

  // Page 2 - Production data
  doc.addPage();
  doc.setFillColor(10, 15, 30); doc.rect(0, 0, w, 297, "F");
  doc.setTextColor(0, 168, 255); doc.setFontSize(16);
  doc.text("Dados de Produção", 20, 25);

  autoTable(doc, {
    startY: 35,
    head: [["Mês", "Prod. Real (bbl/d)", "Capacidade", "Previsão IA"]],
    body: PROD_DATA.map(d => [d.m, d.real.toLocaleString(), d.cap.toLocaleString(), d.ai.toLocaleString()]),
    theme: "grid",
    headStyles: { fillColor: [0, 40, 80], textColor: [0, 168, 255], fontSize: 9 },
    bodyStyles: { fillColor: [10, 18, 35], textColor: [200, 220, 240], fontSize: 9 },
    alternateRowStyles: { fillColor: [15, 25, 45] },
  });

  // Page 3 - Risk data
  doc.addPage();
  doc.setFillColor(10, 15, 30); doc.rect(0, 0, w, 297, "F");
  doc.setTextColor(0, 168, 255); doc.setFontSize(16);
  doc.text("Matriz de Riscos", 20, 25);

  autoTable(doc, {
    startY: 35,
    head: [["Factor", "Valor (%)", "Limiar (%)", "Estado"]],
    body: RISK_DATA.map(r => [r.f, `${r.v}`, `${r.t}`, r.v >= r.t ? "⚠ CRÍTICO" : r.v >= r.t * 0.7 ? "⚡ ATENÇÃO" : "✓ OK"]),
    theme: "grid",
    headStyles: { fillColor: [0, 40, 80], textColor: [0, 168, 255], fontSize: 9 },
    bodyStyles: { fillColor: [10, 18, 35], textColor: [200, 220, 240], fontSize: 9 },
    alternateRowStyles: { fillColor: [15, 25, 45] },
  });

  // Footer
  const pages = doc.internal.pages.length - 1;
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(100, 130, 170);
    doc.text(`AlphaData · Simulação de Poços · ${new Date().toLocaleDateString("pt-AO")}`, 20, 290);
    doc.text(`Pág. ${i}/${pages}`, w - 35, 290);
  }

  doc.save(`AlphaData_Simulacao_${well.name.replace(/\s+/g, "_")}.pdf`);
  toast.success("PDF exportado com sucesso!");
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function WellSimulation() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState(DEFAULT_WELLS[0]);
  const [tab, setTab] = useState("prod");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploads, setUploads] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState("3d");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [loadingDB, setLoadingDB] = useState(false);

  // New simulation form
  const [newWell, setNewWell] = useState({ name: "", block: "", operator: "", field: "", basin: "Congo", type: "Exploração", depth: 3000, wd: 1000 });

  const riskCol = (r: string) => r === "Baixo" ? "#00e5a0" : r === "Médio" ? "#ffb830" : "#ff4365";

  // Fetch saved simulations from DB
  const fetchSimulations = useCallback(async () => {
    setLoadingDB(true);
    const { data, error } = await supabase
      .from("well_simulations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setSavedSimulations(data);
    setLoadingDB(false);
  }, []);

  useEffect(() => { fetchSimulations(); }, [fetchSimulations]);

  // Process with AI simulation
  const handleProcess = () => {
    if (uploads.length === 0) return;
    setProcessing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setProcessing(false); toast.success("Processamento IA concluído!"); return 100; }
        return p + 2;
      });
    }, 50);
  };

  // Save simulation to DB
  const handleSave = async () => {
    if (!user) { toast.error("É necessário iniciar sessão"); return; }
    setSaving(true);
    const { error } = await supabase.from("well_simulations").insert({
      user_id: user.id,
      well_name: selected.name,
      block: selected.block,
      operator: selected.op,
      field: selected.field,
      basin: selected.basin,
      well_type: selected.type,
      depth: selected.depth,
      water_depth: selected.wd,
      api_gravity: selected.api,
      daily_production: selected.prod,
      success_probability: selected.prob,
      risk_level: selected.risk,
      status: selected.status,
      latitude: selected.lat,
      longitude: selected.lng,
      simulation_data: { prodData: PROD_DATA, riskData: RISK_DATA, geoRadar: GEO_RADAR },
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); }
    else { toast.success("Simulação salva com sucesso!"); fetchSimulations(); }
  };

  // Create new simulation
  const handleCreateNew = async () => {
    if (!user || !newWell.name) { toast.error("Preencha o nome do poço"); return; }
    setSaving(true);
    const { error } = await supabase.from("well_simulations").insert({
      user_id: user.id,
      well_name: newWell.name,
      block: newWell.block || "N/A",
      operator: newWell.operator || "N/A",
      field: newWell.field,
      basin: newWell.basin,
      well_type: newWell.type,
      depth: newWell.depth,
      water_depth: newWell.wd,
      status: "Pendente",
      success_probability: 0,
      risk_level: "Médio",
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar: " + error.message); }
    else {
      toast.success("Nova simulação criada!");
      setShowNewDialog(false);
      setNewWell({ name: "", block: "", operator: "", field: "", basin: "Congo", type: "Exploração", depth: 3000, wd: 1000 });
      fetchSimulations();
    }
  };

  // Delete simulation
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("well_simulations").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar");
    else { toast.success("Simulação eliminada"); fetchSimulations(); }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeItem="well-simulation" isMobileOpen={sidebarOpen} setIsMobileOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6 overflow-auto">
          {/* ── PAGE HEADER ── */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-1 h-8 bg-gradient-to-b from-primary to-green-500 rounded-full" />
                  <div>
                    <p className="text-[10px] text-muted-foreground tracking-[3px] uppercase">AlphaData · Visão Computacional</p>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-wide">SIMULAÇÃO DE POÇOS</h1>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 text-[10px]">● LIVE</Badge>
                </div>
                <p className="text-xs text-muted-foreground ml-4">Bacias de Angola — Congo · Kwanza · Cabinda · {DEFAULT_WELLS.length} poços</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setShowNewDialog(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Simulação</Button>
                <Button variant="outline" size="sm" onClick={() => generateSimulationPDF(selected)}><Download className="w-3.5 h-3.5 mr-1" /> Exportar PDF</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}><Save className="w-3.5 h-3.5 mr-1" /> {saving ? "A salvar..." : "Salvar"}</Button>
              </div>
            </div>
          </motion.div>

          {/* ── WELL SELECTOR ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {DEFAULT_WELLS.map((w) => {
              const active = selected.id === w.id;
              return (
                <button key={w.id} onClick={() => setSelected(w)}
                  className={`flex-shrink-0 p-2.5 rounded-lg text-left border transition-all font-mono ${active ? "bg-primary/10 border-primary/40 shadow-md shadow-primary/10" : "bg-card border-border hover:border-primary/20"}`}>
                  <div className={`text-[11px] font-bold whitespace-nowrap ${active ? "text-primary" : "text-foreground"}`}>{w.name}</div>
                  <div className="text-[9px] text-muted-foreground whitespace-nowrap mt-0.5">{w.block} · {w.basin}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: riskCol(w.risk), boxShadow: `0 0 4px ${riskCol(w.risk)}` }} />
                    <span className="text-[8px]" style={{ color: riskCol(w.risk) }}>{w.risk}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* ── 3D CANVAS ── */}
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-4 flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono tracking-widest uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-500" />
                  {viewMode === "2d" ? "Secção 2D" : viewMode === "blend" ? "Vista Híbrida" : "Visualização 3D"} — {selected.name}
                </CardTitle>
                <div className="flex gap-1">
                  {[{ id: "2d", label: "2D" }, { id: "blend", label: "MIX" }, { id: "3d", label: "3D" }].map(v => (
                    <Button key={v.id} variant={viewMode === v.id ? "default" : "ghost"} size="sm" className="h-6 text-[10px] px-2 font-mono"
                      onClick={() => setViewMode(v.id)}>{v.label}</Button>
                  ))}
                </div>
              </CardHeader>
              <div className="h-[320px] md:h-[480px] bg-[#010714] relative">
                <WellCanvas well={selected} viewMode={viewMode} />
              </div>
              <div className="flex gap-3 p-3 border-t border-border flex-wrap text-[9px]">
                {[["#00e5a0", "Reservatório"], ["#ff4365", "Falha"], ["#ffb830", "Risco"], ["#00a8ff", "Perfurações"], ["#1e40af", "Água"]].map(([col, lab]) => (
                  <div key={lab as string} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: col as string }} />
                    <span className="text-muted-foreground">{lab}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── RIGHT PANEL ── */}
            <div className="flex flex-col gap-3">
              {/* Well info */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-mono tracking-widest uppercase">{selected.field}</CardTitle>
                    <Badge variant={selected.status === "Concluído" ? "default" : selected.status === "Em análise" ? "secondary" : "outline"} className="text-[10px]">
                      {selected.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4 space-y-2">
                  {[["Operador", selected.op], ["Bloco", selected.block], ["Bacia", selected.basin], ["Tipo", selected.type], ["API", `${selected.api}°`]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between border-b border-border/50 pb-1.5">
                      <span className="text-[10px] text-muted-foreground">{k}</span>
                      <span className="text-[10px] text-foreground font-bold">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Gauges */}
              <Card className="p-4">
                <div className="grid grid-cols-3 gap-2 justify-items-center">
                  <Gauge value={selected.prob} label="SUCESSO %" color={selected.prob > 85 ? "#00e5a0" : "#ffb830"} />
                  <Gauge value={Math.round(selected.api)} max={50} label="API °" color="#00a8ff" />
                  <Gauge value={Math.round(selected.prod / 1000)} max={30} label="KBBL/D" color="#00e5a0" />
                </div>
              </Card>

              {/* Depth */}
              <Card className="p-4">
                <p className="text-[10px] text-primary tracking-widest mb-3 uppercase font-mono">Profundidade</p>
                <RiskBar label="Prof. Água (m)" value={Math.round(selected.wd / 20)} threshold={85} />
                <RiskBar label="Prof. Total (m)" value={Math.round(selected.depth / 50)} threshold={80} />
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-muted-foreground">Água: {selected.wd.toLocaleString()}m</span>
                  <span className="text-[9px] text-muted-foreground">Total: {selected.depth.toLocaleString()}m</span>
                </div>
              </Card>

              {/* AI Model */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-primary tracking-widest uppercase font-mono">Modelo IA</p>
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 text-[9px]">● ACTIVO</Badge>
                </div>
                {[["Precisão", "94.7%"], ["Amostras", "12,847"], ["Arquitectura", "LSTM+RF"], ["Última sync", "agora"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between mb-1.5">
                    <span className="text-[9px] text-muted-foreground">{k}</span>
                    <span className="text-[9px] text-foreground font-bold">{v}</span>
                  </div>
                ))}
                <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
                  <motion.div animate={{ width: ["60%", "100%", "60%"] }} transition={{ duration: 3, repeat: Infinity }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-green-500" />
                </div>
              </Card>
            </div>
          </div>

          {/* ── UPLOAD ROW ── */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-mono tracking-widest uppercase flex items-center gap-2">
                <Upload className="w-4 h-4" /> Ingestão de Dados — {selected.field}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2.5 flex-wrap items-center p-4 pt-0">
              {[["Sísmico 2D/3D", Crosshair], ["Perfis LAS", BarChart3], ["Imagens Geo", Eye], ["Modelos Reserv.", Layers]].map(([label, Icon], i) => {
                const up = uploads.includes(i);
                const IconComp = Icon as any;
                return (
                  <button key={i} onClick={() => setUploads(u => up ? u.filter(x => x !== i) : [...u, i])}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-dashed border transition-all min-w-[90px] ${up ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                    <IconComp className="w-5 h-5" />
                    <span className="text-[9px] tracking-wider">{label as string}</span>
                  </button>
                );
              })}
              <Button className="ml-auto" disabled={processing || uploads.length === 0} onClick={handleProcess}>
                <Zap className="w-4 h-4 mr-1" />
                {processing ? `${Math.round(progress)}%` : "Processar IA"}
              </Button>
              {processing && (
                <div className="flex-1 min-w-[120px]">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[9px] text-muted-foreground mt-1 tracking-wider">A PROCESSAR DADOS...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── CHARTS ── */}
          <Card>
            <Tabs value={tab} onValueChange={setTab}>
              <div className="border-b border-border px-4">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  {[{ id: "prod", label: "Produção", icon: Activity }, { id: "geo", label: "Geologia", icon: Layers }, { id: "risk", label: "Riscos", icon: Shield }, { id: "decline", label: "Declínio", icon: TrendingDown }].map(t => (
                    <TabsTrigger key={t.id} value={t.id} className="text-[10px] tracking-widest uppercase font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
                      <t.icon className="w-3.5 h-3.5 mr-1.5" />{t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="p-4">
                <TabsContent value="prod" className="mt-0">
                  <p className="text-[10px] text-muted-foreground tracking-widest mb-4 uppercase">Projeção de Produção — {selected.block} · {selected.op}</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={PROD_DATA}>
                      <defs>
                        <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00a8ff" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00a8ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="m" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="cap" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1} fill="none" name="Capacidade" />
                      <Area type="monotone" dataKey="real" stroke="#00a8ff" strokeWidth={2.5} fill="url(#gReal)" name="Produção Real" />
                      <Area type="monotone" dataKey="ai" stroke="#00e5a0" strokeDasharray="6 3" strokeWidth={2} fill="none" name="Previsão IA" />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="geo" className="mt-0">
                  <p className="text-[10px] text-muted-foreground tracking-widest mb-4 uppercase">Análise Petrofísica — {selected.field}</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={GEO_RADAR} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="s" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={30} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                      <Radar name="Poço Actual" dataKey="A" stroke="#00a8ff" fill="#00a8ff" fillOpacity={0.15} strokeWidth={2} dot />
                      <Radar name="Média da Bacia" dataKey="B" stroke="#ffb830" fill="#ffb830" fillOpacity={0.08} strokeWidth={1.5} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="risk" className="mt-0">
                  <p className="text-[10px] text-muted-foreground tracking-widest mb-4 uppercase">Matriz de Riscos Operacionais</p>
                  {RISK_DATA.map(r => <RiskBar key={r.f} label={r.f} value={r.v} threshold={r.t} />)}
                </TabsContent>
                <TabsContent value="decline" className="mt-0">
                  <p className="text-[10px] text-muted-foreground tracking-widest mb-4 uppercase">Curva de Declínio</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={DECLINE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="y" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="r" stroke="#00a8ff" strokeWidth={2.5} dot={{ fill: "#00a8ff", r: 4 }} name="Real (bbl/d)" connectNulls={false} />
                      <Line type="monotone" dataKey="p" stroke="#ffb830" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#ffb830", r: 3 }} name="Projeção IA" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* ── HISTORY TABLE ── */}
          <Card>
            <CardHeader className="py-3 px-4 flex-row items-center justify-between">
              <CardTitle className="text-xs font-mono tracking-widest uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> Histórico de Simulações
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{DEFAULT_WELLS.length + savedSimulations.length} registos</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-mono">Poço</TableHead>
                    <TableHead className="text-[10px] font-mono hidden md:table-cell">Bloco</TableHead>
                    <TableHead className="text-[10px] font-mono hidden md:table-cell">Operador</TableHead>
                    <TableHead className="text-[10px] font-mono">Bacia</TableHead>
                    <TableHead className="text-[10px] font-mono hidden md:table-cell">Sucesso</TableHead>
                    <TableHead className="text-[10px] font-mono">Status</TableHead>
                    <TableHead className="text-[10px] font-mono">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEFAULT_WELLS.map(w => (
                    <TableRow key={w.id} className={`cursor-pointer ${selected.id === w.id ? "bg-primary/5" : ""}`} onClick={() => setSelected(w)}>
                      <TableCell className="text-xs font-bold">{w.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{w.block}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{w.op}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px]">{w.basin}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${w.prob}%`, background: w.prob > 85 ? "#00e5a0" : "#ffb830" }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{w.prob}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.status === "Concluído" ? "default" : "secondary"} className="text-[9px]">{w.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] px-2"><Eye className="w-3 h-3 mr-1" /> Ver</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Saved from DB */}
                  {savedSimulations.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-bold">{s.well_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{s.block}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{s.operator}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px]">{s.basin}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-[10px] text-muted-foreground">{s.success_probability || 0}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px]">{s.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 text-[9px] px-1" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>

        {isMobile && <MobileBottomNav />}
      </div>

      {/* ── NEW SIMULATION DIALOG ── */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Simulação de Poço</DialogTitle>
            <DialogDescription>Preencha os dados básicos para iniciar uma nova simulação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome do Poço</Label><Input value={newWell.name} onChange={e => setNewWell(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Girassol-5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Bloco</Label><Input value={newWell.block} onChange={e => setNewWell(p => ({ ...p, block: e.target.value }))} placeholder="Bloco 17" /></div>
              <div><Label className="text-xs">Operador</Label><Input value={newWell.operator} onChange={e => setNewWell(p => ({ ...p, operator: e.target.value }))} placeholder="TotalEnergies" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Campo</Label><Input value={newWell.field} onChange={e => setNewWell(p => ({ ...p, field: e.target.value }))} placeholder="Girassol" /></div>
              <div>
                <Label className="text-xs">Bacia</Label>
                <Select value={newWell.basin} onValueChange={v => setNewWell(p => ({ ...p, basin: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Congo">Congo</SelectItem>
                    <SelectItem value="Kwanza">Kwanza</SelectItem>
                    <SelectItem value="Cabinda">Cabinda</SelectItem>
                    <SelectItem value="Namibe">Namibe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Profundidade (m)</Label><Input type="number" value={newWell.depth} onChange={e => setNewWell(p => ({ ...p, depth: Number(e.target.value) }))} /></div>
              <div><Label className="text-xs">Lâmina d'Água (m)</Label><Input type="number" value={newWell.wd} onChange={e => setNewWell(p => ({ ...p, wd: Number(e.target.value) }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateNew} disabled={saving || !newWell.name}>{saving ? "A criar..." : "Criar Simulação"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
