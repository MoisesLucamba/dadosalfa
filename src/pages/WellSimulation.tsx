import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ReferenceLine,
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
import { loadLogoAsBase64 } from "@/utils/loadLogoForPDF";
import { getWellSimTranslation, DocumentLanguageCode, DOCUMENT_LANGUAGES } from "@/i18n";
import { LanguageDownloadDialog } from "@/components/reports/LanguageDownloadDialog";
import {
  Eye, Plus, Download, Save, Upload, Cpu, Activity, Layers,
  BarChart3, TrendingDown, Shield, Crosshair, Droplets, Thermometer,
  FileText, Trash2, Zap, AlertTriangle, CheckCircle2, XCircle,
  Gauge as GaugeIcon, Radio, Waves, Boxes, Drill, GitCompare,
} from "lucide-react";

// New components
import { AnomalyDot, AnomalyBanner, getMetricStatus } from "@/components/well-simulation/AnomalyAlerts";
import { AIForecastChart } from "@/components/well-simulation/AIForecastChart";
import { DeclineRateRow } from "@/components/well-simulation/DeclineRateSparkline";
import { WellEventTimeline } from "@/components/well-simulation/WellEventTimeline";
import { WellComparisonDrawer } from "@/components/well-simulation/WellComparisonDrawer";
import { TechnicalFileUploadModal } from "@/components/well-simulation/TechnicalFileUploadModal";

/* ─── WELL DATA ─────────────────────────────────────────────── */
const DEFAULT_WELLS = [
  { id: "w1", name: "Girassol-4", block: "Bloco 17", op: "TotalEnergies", field: "Girassol", basin: "Congo", type: "Produção", depth: 4250, wd: 1360, status: "Concluído", prob: 92, risk: "Baixo", prod: 18500, api: 30.2, gor: 485, wcut: 12.4, bhp: 4280, temp: 178, lat: -7.35, lng: 11.82, tvd: 4180, md: 4250, inc: 22.4 },
  { id: "w2", name: "Dalia-7", block: "Bloco 17", op: "TotalEnergies", field: "Dalia", basin: "Congo", type: "Desenvolvimento", depth: 3890, wd: 1400, status: "Em análise", prob: 85, risk: "Médio", prod: 15200, api: 23.6, gor: 612, wcut: 28.7, bhp: 3920, temp: 164, lat: -7.42, lng: 11.75, tvd: 3750, md: 3890, inc: 31.2 },
  { id: "w3", name: "Kaombo Norte-2", block: "Bloco 32", op: "TotalEnergies", field: "Kaombo", basin: "Congo", type: "Exploração", depth: 4680, wd: 1950, status: "Concluído", prob: 78, risk: "Médio", prod: 22400, api: 27.8, gor: 341, wcut: 8.2, bhp: 4890, temp: 198, lat: -7.58, lng: 11.64, tvd: 4520, md: 4680, inc: 18.6 },
  { id: "w4", name: "Plutónio-A3", block: "Bloco 18", op: "BP", field: "Plutónio", basin: "Congo", type: "Produção", depth: 3540, wd: 1300, status: "Concluído", prob: 88, risk: "Baixo", prod: 16800, api: 33.1, gor: 278, wcut: 5.1, bhp: 3650, temp: 152, lat: -7.68, lng: 11.55, tvd: 3400, md: 3540, inc: 14.8 },
  { id: "w5", name: "Kissanje-5", block: "Bloco 15/06", op: "Eni Angola", field: "Kissanje", basin: "Kwanza", type: "Avaliação", depth: 3980, wd: 850, status: "Em análise", prob: 71, risk: "Alto", prod: 8900, api: 29.4, gor: 892, wcut: 44.3, bhp: 3210, temp: 141, lat: -8.12, lng: 12.34, tvd: 3820, md: 3980, inc: 27.9 },
  { id: "w6", name: "Mafumeira Sul-1", block: "Bloco 0", op: "Chevron", field: "Mafumeira Sul", basin: "Cabinda", type: "Exploração", depth: 2450, wd: 65, status: "Concluído", prob: 94, risk: "Baixo", prod: 11200, api: 36.5, gor: 195, wcut: 3.8, bhp: 2580, temp: 112, lat: -5.42, lng: 12.08, tvd: 2420, md: 2450, inc: 8.4 },
  { id: "w7", name: "Pazflor-B2", block: "Bloco 17", op: "TotalEnergies", field: "Pazflor", basin: "Congo", type: "Desenvolvimento", depth: 4120, wd: 1200, status: "Pendente", prob: 82, risk: "Médio", prod: 19600, api: 25.9, gor: 524, wcut: 18.9, bhp: 4180, temp: 172, lat: -7.31, lng: 11.88, tvd: 3980, md: 4120, inc: 24.1 },
  { id: "w8", name: "CLOV-E1", block: "Bloco 17", op: "TotalEnergies", field: "CLOV", basin: "Congo", type: "Produção", depth: 3750, wd: 1350, status: "Concluído", prob: 90, risk: "Baixo", prod: 21000, api: 31.7, gor: 318, wcut: 9.6, bhp: 3880, temp: 159, lat: -7.39, lng: 11.79, tvd: 3600, md: 3750, inc: 19.3 },
];

const PROD_DATA = [
  { m: "Jan", real: 145200, cap: 168000, ai: 142000, inj: 82000 },
  { m: "Fev", real: 142800, cap: 168000, ai: 139500, inj: 80500 },
  { m: "Mar", real: 139500, cap: 165000, ai: 137000, inj: 79200 },
  { m: "Abr", real: 137200, cap: 165000, ai: 134500, inj: 78100 },
  { m: "Mai", real: 135100, cap: 162000, ai: 132000, inj: 76800 },
  { m: "Jun", real: 133800, cap: 162000, ai: 130000, inj: 75400 },
  { m: "Jul", real: 131500, cap: 160000, ai: 128000, inj: 74100 },
  { m: "Ago", real: 129800, cap: 160000, ai: 126500, inj: 73200 },
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
  { f: "Integridade do Poço", v: 88, t: 90 },
  { f: "Risco Geológico", v: 45, t: 60 },
  { f: "Subsidência", v: 32, t: 50 },
  { f: "Corrosão (CO₂/H₂S)", v: 58, t: 70 },
  { f: "Concentração H₂S", v: 25, t: 40 },
  { f: "Pressão Anular", v: 61, t: 75 },
  { f: "Intrusão de Água", v: 44, t: 55 },
];

const DECLINE = [
  { y: "2022", r: 28900, p: 28900 },
  { y: "2023", r: 27400, p: 27600 },
  { y: "2024", r: 26500, p: 26500 },
  { y: "2025", r: 24200, p: 24800 },
  { y: "2026", r: 22100, p: 23200 },
  { y: "2027", r: null, p: 21700 },
  { y: "2028", r: null, p: 20300 },
  { y: "2029", r: null, p: 19100 },
  { y: "2030", r: null, p: 18000 },
];

const PRESSURE_DEPTH = Array.from({ length: 40 }, (_, i) => ({
  depth: (i + 1) * 100,
  pore: 95 + i * 18.2 + Math.sin(i * 0.4) * 12,
  frac: 145 + i * 28.4 + Math.cos(i * 0.3) * 8,
  mud: 110 + i * 22 + Math.sin(i * 0.6) * 6,
  hydro: 70 + i * 10,
}));

/* ─── 3D MATH ─────────────────────────────────────────────────── */
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

/* ─── SEISMIC SCAN OVERLAY ─────────────────────────────────── */
function SeismicOverlay({ canvas, ctx, W, H, T }: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; W: number; H: number; T: number }) {
  const scanY = ((T * 60) % H);
  const sg = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  sg.addColorStop(0, "rgba(0,168,255,0)");
  sg.addColorStop(0.5, "rgba(0,168,255,0.07)");
  sg.addColorStop(1, "rgba(0,168,255,0)");
  ctx.fillStyle = sg;
  ctx.fillRect(0, scanY - 30, W, 60);

  const bLen = 22, bW = 2;
  ctx.strokeStyle = "rgba(0,229,160,0.55)";
  ctx.lineWidth = bW;
  [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(([bx, by, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(bx + dx * bLen, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + dy * bLen);
    ctx.stroke();
  });

  ctx.strokeStyle = "rgba(0,168,255,0.18)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.setLineDash([]);
}

/* ─── WELL CANVAS ─────────────────────────────────────────────── */
function WellCanvas({ well, viewMode = "3d" }: { well: typeof DEFAULT_WELLS[0]; viewMode?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const T = useRef(0);
  const cam = useRef({ yaw: 0.4, pitch: 0.3, zoom: 1, autoSpin: true });
  const drag = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 });
  const particles = useRef<any[]>([]);
  const gasParticles = useRef<any[]>([]);
  const waterParticles = useRef<any[]>([]);
  const ambientParticles = useRef<any[]>([]);
  const viewModeRef = useRef(viewMode);
  const blend = useRef(1);
  const wellRef = useRef(well);
  const lastInteraction = useRef(0);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { wellRef.current = well; }, [well]);

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

    // Oil particles - amber/gold
    particles.current = Array.from({ length: 140 }, () => ({
      u: (Math.random() - 0.5) * 6, v: Math.random() * 600,
      vy: -(0.5 + Math.random() * 1.3), r: 1 + Math.random() * 2,
      alpha: 0.25 + Math.random() * 0.55, hue: 32 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
    }));
    // Gas particles - blue-white sparkles
    gasParticles.current = Array.from({ length: 40 }, () => ({
      u: (Math.random() - 0.5) * 3, v: Math.random() * 400,
      vy: -(1.2 + Math.random() * 2.1), r: 0.8 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2,
    }));
    // Water particles - pale blue
    waterParticles.current = Array.from({ length: 25 }, () => ({
      u: (Math.random() - 0.5) * 5, v: Math.random() * 500,
      vy: -(0.3 + Math.random() * 0.8), r: 1.2 + Math.random() * 1.8,
      alpha: 0.15 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2,
    }));
    // Ambient particles
    ambientParticles.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * 1000, y: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2,
      r: 0.5 + Math.random(), alpha: 0.08 + Math.random() * 0.12,
    }));

    const onDown = (e: MouseEvent) => {
      drag.current = { active: true, lastX: e.clientX, lastY: e.clientY, velX: 0, velY: 0 };
      cam.current.autoSpin = false;
      lastInteraction.current = performance.now();
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.lastX, dy = e.clientY - drag.current.lastY;
      cam.current.yaw += dx * 0.008;
      cam.current.pitch += dy * 0.006 * blend.current;
      cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch));
      drag.current.lastX = e.clientX; drag.current.lastY = e.clientY;
      drag.current.velX = dx; drag.current.velY = dy;
    };
    const onUp = () => {
      drag.current.active = false;
      lastInteraction.current = performance.now();
      canvas.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.current.zoom = Math.max(0.3, Math.min(3.2, cam.current.zoom - e.deltaY * 0.001));
      cam.current.autoSpin = false;
      lastInteraction.current = performance.now();
    };
    const onDblClick = () => {
      cam.current.yaw = 0.4;
      cam.current.pitch = 0.3;
      cam.current.zoom = 1;
      cam.current.autoSpin = true;
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        drag.current = { active: true, lastX: t.clientX, lastY: t.clientY, velX: 0, velY: 0 };
        cam.current.autoSpin = false;
        lastInteraction.current = performance.now();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current.active || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - drag.current.lastX, dy = t.clientY - drag.current.lastY;
      cam.current.yaw += dx * 0.008;
      cam.current.pitch += dy * 0.006 * blend.current;
      cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch));
      drag.current.lastX = t.clientX; drag.current.lastY = t.clientY;
    };
    const onTouchEnd = () => {
      drag.current.active = false;
      lastInteraction.current = performance.now();
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDblClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.style.cursor = "grab";

    const draw = (ts: number) => {
      T.current = ts * 0.001;
      const t = T.current;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const w = wellRef.current;
      ctx.clearRect(0, 0, W, H);

      const vm = viewModeRef.current;
      const blendTarget = vm === "3d" ? 1 : vm === "2d" ? 0 : 0.5;
      blend.current += (blendTarget - blend.current) * 0.055;
      const b = blend.current;

      // Auto-resume orbit after 5s of inactivity
      if (!drag.current.active && !cam.current.autoSpin) {
        if (performance.now() - lastInteraction.current > 5000) {
          cam.current.autoSpin = true;
        }
      }

      if (!drag.current.active) {
        drag.current.velX *= 0.88; drag.current.velY *= 0.88;
        if (!cam.current.autoSpin) {
          cam.current.yaw += drag.current.velX * 0.004;
          cam.current.pitch += drag.current.velY * 0.003 * b;
          cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch));
        }
      }
      if (cam.current.autoSpin) cam.current.yaw += (0.0018 + 0.0012 * b);

      const { yaw, pitch, zoom } = cam.current;
      const ePitch = pitch * b + (-0.04) * (1 - b);
      const eYaw = yaw * b + (Math.PI * 0.07) * (1 - b);
      const cx = W / 2, cy = H * 0.48;
      const fov = 380 * zoom;

      const toScreen = (wx: number, wy: number, wz: number) => {
        let [x, y, z] = rotateX(wx, wy, wz, ePitch);
        [x, y, z] = rotateY(x, y, z, eYaw);
        return project(x, y, z, fov, cx, cy);
      };

      // ── BACKGROUND ──
      const bgR = ctx.createRadialGradient(cx, cy * 0.35, 0, cx, cy, Math.max(W, H) * 0.9);
      bgR.addColorStop(0, "#040f22"); bgR.addColorStop(0.6, "#020a18"); bgR.addColorStop(1, "#010510");
      ctx.fillStyle = bgR; ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(0,60,120,0.07)";
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 28) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 28) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      const SEA_Y = 82, BED_Y = 0, HALF = 138;
      const TOTAL_D = -430 * (w.depth / 5000);
      const RES_Y = TOTAL_D * 0.76;
      const devX = 68 * (w.depth / 5000) * Math.sin(w.inc * Math.PI / 180);
      const devZ = 24 * (w.depth / 5000);

      // ── GEOLOGICAL LAYERS — enhanced with textures ──
      const layers = [
        { y0: BED_Y, y1: BED_Y - 28, col: "#1a2a44", label: "ÁGUA (SEA)", perm: "—", por: "—", textureType: "water" },
        { y0: BED_Y - 28, y1: BED_Y - 65, col: "#2a3828", label: "FOLHELHO (SH)", perm: "0.001 mD", por: "18%", textureType: "shale" },
        { y0: BED_Y - 65, y1: BED_Y - 118, col: "#5a4520", label: "ARENITO (SS)", perm: "185 mD", por: "24%", textureType: "sand" },
        { y0: BED_Y - 118, y1: BED_Y - 188, col: "#4a4a3a", label: "CALCÁRIO (LS)", perm: "42 mD", por: "19%", textureType: "limestone" },
        { y0: BED_Y - 188, y1: TOTAL_D + 25, col: "#3a2800", label: "RESERVATÓRIO (SS/LS)", perm: `${Math.round(w.api * 6.4)} mD`, por: `${(w.api * 0.62).toFixed(1)}%`, textureType: "reservoir" },
      ];

      layers.forEach(({ y0, y1, col, label, perm, por, textureType }, layerIdx) => {
        const corners = [
          [-HALF, y0, HALF], [HALF, y0, HALF], [HALF, y0, -HALF], [-HALF, y0, -HALF],
          [-HALF, y1, HALF], [HALF, y1, HALF], [HALF, y1, -HALF], [-HALF, y1, -HALF],
        ].map(([x, y, z]) => toScreen(x, y, z));

        if (b > 0.04) {
          const faces = [[0, 1, 2, 3], [0, 1, 5, 4], [1, 2, 6, 5], [3, 2, 6, 7], [0, 3, 7, 4]];
          const opacities = [0.88, 0.62, 0.72, 0.48, 0.58];
          faces.forEach((f, fi) => {
            ctx.beginPath();
            f.forEach((ci, ii) => { const [sx, sy] = corners[ci]; ii === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); });
            ctx.closePath();

            // Layer-specific coloring
            let fillCol = col;
            if (textureType === "reservoir") {
              const pulse = 0.7 + Math.sin(t * 1.8) * 0.3;
              fillCol = `rgba(60,40,0,${opacities[fi] * 0.8 * pulse})`;
              ctx.fillStyle = fillCol;
            } else if (textureType === "water") {
              const wave = 0.6 + Math.sin(t * 0.8 + layerIdx) * 0.2;
              ctx.fillStyle = `rgba(10,20,50,${opacities[fi] * wave})`;
            } else {
              ctx.fillStyle = col + Math.round(opacities[fi] * 200).toString(16).padStart(2, "0");
            }
            ctx.globalAlpha = b; ctx.fill();

            // Edge glow
            if (textureType === "reservoir") {
              ctx.strokeStyle = `rgba(200,150,40,${0.25 + Math.sin(t * 1.5) * 0.15})`;
              ctx.lineWidth = 1.5;
            } else {
              ctx.strokeStyle = "rgba(0,80,40,0.12)";
              ctx.lineWidth = 0.5;
            }
            ctx.stroke();

            // Texture patterns on top face only
            if (fi === 0) {
              ctx.save();
              ctx.globalAlpha = b * 0.15;
              const [tl, tr, br, bl] = [corners[f[0]], corners[f[1]], corners[f[2]], corners[f[3]]];
              if (textureType === "shale") {
                // Striations
                for (let s = 0; s < 6; s++) {
                  const frac = (s + 0.5) / 6;
                  const sx1 = tl[0] + (bl[0] - tl[0]) * frac;
                  const sy1 = tl[1] + (bl[1] - tl[1]) * frac;
                  const sx2 = tr[0] + (br[0] - tr[0]) * frac;
                  const sy2 = tr[1] + (br[1] - tr[1]) * frac;
                  ctx.strokeStyle = "#4a5a38";
                  ctx.lineWidth = 0.5;
                  ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
                }
              } else if (textureType === "limestone") {
                // Crack pattern
                for (let c = 0; c < 4; c++) {
                  const rx = tl[0] + (tr[0] - tl[0]) * Math.random();
                  const ry = tl[1] + (bl[1] - tl[1]) * Math.random();
                  ctx.strokeStyle = "#6a6a5a";
                  ctx.lineWidth = 0.5;
                  ctx.beginPath();
                  ctx.moveTo(rx, ry);
                  ctx.lineTo(rx + (Math.random() - 0.5) * 20, ry + (Math.random() - 0.5) * 15);
                  ctx.stroke();
                }
              }
              ctx.restore();
            }

            ctx.globalAlpha = 1;
          });

          // Layer labels with depth markers
          const [lx, ly] = toScreen(-HALF - 12, (y0 + y1) / 2, -HALF);
          ctx.fillStyle = `rgba(120,210,130,${b * 0.65})`;
          ctx.font = "bold 7.5px 'Courier New',monospace";
          ctx.textAlign = "right";
          ctx.fillText(label, lx, ly - 4);
          ctx.fillStyle = `rgba(80,180,100,${b * 0.4})`;
          ctx.font = "6.5px 'Courier New',monospace";
          ctx.fillText(`φ:${por}  k:${perm}`, lx, ly + 6);
          // Depth marker
          const depthVal = Math.round(Math.abs(y0) * (w.depth / Math.abs(TOTAL_D)));
          ctx.fillStyle = `rgba(0,168,255,${b * 0.4})`;
          ctx.fillText(`${depthVal}m`, lx, ly + 15);
          ctx.textAlign = "left";
        }
      });

      // ── WATER DEPTH INDICATOR ──
      const [wd1x, wd1y] = toScreen(-HALF - 8, BED_Y, 0);
      const [wd2x, wd2y] = toScreen(-HALF - 8, SEA_Y, 0);
      ctx.save();
      ctx.strokeStyle = "rgba(0,140,255,0.45)"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(wd1x, wd1y); ctx.lineTo(wd2x, wd2y); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      ctx.fillStyle = "rgba(0,140,255,0.7)"; ctx.font = "7px 'Courier New',monospace";
      ctx.fillText(`WD ${w.wd}m`, wd2x - 8, wd2y - 4);

      // ── SEA SURFACE ──
      {
        const surf = [[-HALF, SEA_Y, HALF], [HALF, SEA_Y, HALF], [HALF, SEA_Y, -HALF], [-HALF, SEA_Y, -HALF]]
          .map(([x, _y, z]) => toScreen(x, SEA_Y + Math.sin(x * 0.05 + t) * 2.2 + Math.sin(x * 0.09 - t * 0.7) * 1.1, z));
        ctx.beginPath(); surf.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)); ctx.closePath();
        const seaG = ctx.createLinearGradient(0, surf[0][1], 0, surf[0][1] + 20);
        seaG.addColorStop(0, "rgba(0,90,200,0.22)"); seaG.addColorStop(1, "rgba(0,40,120,0)");
        ctx.fillStyle = seaG; ctx.fill();
        ctx.strokeStyle = `rgba(0,168,255,${0.3 + Math.sin(t) * 0.1})`; ctx.lineWidth = 1.8; ctx.stroke();

        // Seabed ripple
        for (let r = 0; r < 3; r++) {
          const ripY = BED_Y + 2 + r * 3;
          const rPts = Array.from({ length: 8 }, (_, i) => {
            const frac = i / 7;
            const rx = -HALF + frac * HALF * 2;
            const ry = ripY + Math.sin(rx * 0.08 + t * 0.5 + r) * 1.5;
            return toScreen(rx, ry, -HALF);
          });
          ctx.beginPath();
          rPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
          ctx.strokeStyle = `rgba(0,80,160,${0.08 - r * 0.02})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }

      // ── FPSO — enhanced with helipad and details ──
      {
        const hy = SEA_Y + 4, hw = 74, hh = 9, hd = 20;
        const hull = [
          [-hw, hy, -hd], [hw, hy, -hd], [hw, hy, hd], [-hw, hy, hd],
          [-hw, hy - hh, -hd], [hw, hy - hh, -hd], [hw, hy - hh, hd], [-hw, hy - hh, hd],
        ].map(([x, y, z]) => toScreen(x, y, z));
        [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]].forEach((f, fi) => {
          ctx.beginPath(); f.forEach((ci, ii) => ii === 0 ? ctx.moveTo(hull[ci][0], hull[ci][1]) : ctx.lineTo(hull[ci][0], hull[ci][1])); ctx.closePath();
          ctx.fillStyle = ["#253a56", "#192838", "#1e2f45", "#1a2b40", "#172638", "#1e2d42"][fi]; ctx.fill();
          ctx.strokeStyle = "rgba(0,168,255,0.2)"; ctx.lineWidth = 0.7; ctx.stroke();
        });

        // Flare stack with animated flame
        const fStackBase = toScreen(62, hy - hh, 0);
        const fStackTop = toScreen(62, hy - hh - 18, 0);
        ctx.strokeStyle = "#3a4a5a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(fStackBase[0], fStackBase[1]); ctx.lineTo(fStackTop[0], fStackTop[1]); ctx.stroke();

        const fp = toScreen(62, hy + 26, 0);
        const fR = 6 + Math.sin(t * 4.5) * 4;
        const fg = ctx.createRadialGradient(fp[0], fp[1], 0, fp[0], fp[1], fR * 3);
        fg.addColorStop(0, "rgba(255,220,0,0.95)"); fg.addColorStop(0.25, "rgba(255,120,0,0.6)"); fg.addColorStop(1, "rgba(255,60,0,0)");
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fp[0], fp[1], fR * 3, 0, Math.PI * 2); ctx.fill();

        // Helipad
        const tp = toScreen(-10, hy - 5, 0);
        ctx.fillStyle = "#1a2e4a"; ctx.beginPath(); ctx.arc(tp[0], tp[1], 8 * zoom, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(0,168,255,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
        // H marker
        ctx.fillStyle = "rgba(0,168,255,0.6)"; ctx.font = `bold ${6 * zoom}px 'Courier New',monospace`; ctx.textAlign = "center";
        ctx.fillText("H", tp[0], tp[1] + 2 * zoom); ctx.textAlign = "left";

        ctx.fillStyle = "rgba(180,215,255,0.55)"; ctx.font = "bold 8px 'Courier New',monospace"; ctx.textAlign = "center";
        const lp = toScreen(0, hy + 14, 0);
        ctx.fillText("FPSO " + w.op.toUpperCase().slice(0, 8), lp[0], lp[1]); ctx.textAlign = "left";
      }

      // ── UMBILICAL / RISER SYSTEM ──
      {
        const rPts = [toScreen(0, SEA_Y, 0), toScreen(4, SEA_Y * 0.65, 2), toScreen(2, SEA_Y * 0.3, 1), toScreen(0, BED_Y, 0)];
        ctx.beginPath(); ctx.moveTo(rPts[0][0], rPts[0][1]);
        rPts.slice(1).forEach(([sx, sy]) => ctx.lineTo(sx, sy));
        ctx.strokeStyle = "#3a5c80"; ctx.lineWidth = 5.5 * zoom; ctx.lineCap = "round"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rPts[0][0] + 3, rPts[0][1]);
        rPts.slice(1).forEach(([sx, sy]) => ctx.lineTo(sx + 3, sy));
        ctx.strokeStyle = "#2a4060"; ctx.lineWidth = 2.5 * zoom; ctx.stroke();

        // BOP/Wellhead at seabed
        const br = toScreen(0, BED_Y + 5, 0);
        ctx.fillStyle = "#2a4a6a"; ctx.beginPath(); ctx.arc(br[0], br[1], 6 * zoom, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(0,229,160,0.5)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "rgba(0,229,160,0.5)"; ctx.font = `${6 * zoom}px 'Courier New',monospace`;
        ctx.fillText("BOP", br[0] + 8 * zoom, br[1] + 2);
      }

      // ── WELLBORE — enhanced with casing, tubing, cement ──
      {
        const nPts = 32;
        const wPts = Array.from({ length: nPts + 1 }, (_, i) => {
          const u = i / nPts;
          const kick = u > 0.15 ? Math.sin((u - 0.15) * Math.PI * 0.6) : 0;
          return toScreen(kick * devX, BED_Y + (TOTAL_D - BED_Y) * u, kick * devZ * 0.4);
        });

        // Cement bond (outer shell)
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "rgba(160,160,150,0.15)"; ctx.lineWidth = 15 * zoom; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();

        // Outer casing - dark steel
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "#2A3040"; ctx.lineWidth = 11 * zoom; ctx.stroke();

        // Inner tubing - bright metallic
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "#8A9BB0"; ctx.lineWidth = 7 * zoom;
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(0,120,220,0.5)"; ctx.stroke(); ctx.shadowBlur = 0;

        // Inner highlight
        ctx.beginPath(); wPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy));
        ctx.strokeStyle = "rgba(140,220,255,0.22)"; ctx.lineWidth = 2.5 * zoom; ctx.stroke();

        // Drill string rotation indicator (subtle spinning marks)
        const drillSpin = t * 0.5 * Math.PI;
        for (let di = 0; di < 6; di++) {
          const u = 0.1 + di * 0.12;
          const idx = Math.floor(u * nPts);
          if (idx >= wPts.length) continue;
          const [sx, sy] = wPts[idx];
          const markAngle = drillSpin + di * 1.2;
          const markR = 3 * zoom;
          ctx.fillStyle = `rgba(140,180,220,${0.15 + Math.sin(markAngle) * 0.1})`;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(markAngle) * markR, sy + Math.sin(markAngle) * markR * 0.3, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        const kp = wPts[Math.floor(nPts * 0.15)];
        ctx.fillStyle = "rgba(255,184,48,0.85)"; ctx.font = "7px 'Courier New',monospace";
        ctx.fillText("KOP", kp[0] + 8, kp[1]);
        ctx.beginPath(); ctx.arc(kp[0], kp[1], 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb830"; ctx.fill();

        const td = wPts[nPts];
        ctx.fillStyle = "rgba(0,229,160,0.85)"; ctx.font = "7px 'Courier New',monospace";
        ctx.fillText(`TD ${w.depth}m`, td[0] + 8, td[1]);
        ctx.beginPath(); ctx.arc(td[0], td[1], 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5a0"; ctx.fill();

        [0.25, 0.5, 0.75].forEach(u => {
          const idx = Math.floor(u * nPts);
          const [sx, sy] = wPts[idx];
          const inc = (w.inc * u).toFixed(1);
          ctx.fillStyle = "rgba(0,168,255,0.5)"; ctx.font = "6px 'Courier New',monospace";
          ctx.fillText(`${inc}°`, sx + 6, sy - 2);
          ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,168,255,0.6)"; ctx.fill();
        });

        // ── PRESSURE GRADIENT along wellbore ──
        const gradX = 20;
        for (let gi = 0; gi < nPts; gi++) {
          const u = gi / nPts;
          const idx = gi;
          if (idx >= wPts.length) continue;
          const [sx, sy] = wPts[idx];
          const pressure = u; // 0=top, 1=bottom
          const r = pressure > 0.7 ? 255 : pressure > 0.4 ? 245 : 0;
          const g2 = pressure > 0.7 ? 59 : pressure > 0.4 ? 166 : 163;
          const b2 = pressure > 0.7 ? 48 : pressure > 0.4 ? 35 : 255;
          ctx.fillStyle = `rgba(${r},${g2},${b2},0.25)`;
          ctx.beginPath();
          ctx.arc(sx - gradX * zoom, sy, 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pressure labels at intervals
        [0, 0.25, 0.5, 0.75, 1.0].forEach(u => {
          const idx = Math.floor(u * nPts);
          if (idx >= wPts.length) return;
          const [sx, sy] = wPts[idx];
          const pVal = Math.round(w.bhp * (0.3 + u * 0.7));
          ctx.fillStyle = "rgba(120,165,220,0.35)"; ctx.font = "5px 'Courier New',monospace";
          ctx.fillText(`${pVal}bar`, sx - (gradX + 18) * zoom, sy + 2);
        });
      }

      // ── FAULT PLANE ──
      if (w.risk !== "Baixo") {
        const fPts = [
          toScreen(-95, BED_Y - 15, 25), toScreen(-68, TOTAL_D + 40, -15),
          toScreen(-58, TOTAL_D + 40, -5), toScreen(-85, BED_Y - 15, 35),
        ];
        ctx.beginPath(); fPts.forEach(([sx, sy], i) => i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)); ctx.closePath();
        ctx.fillStyle = "rgba(255,67,101,0.08)"; ctx.fill();
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = "rgba(255,67,101,0.6)"; ctx.lineWidth = 1.6;
        ctx.shadowBlur = 12; ctx.shadowColor = "rgba(255,67,101,0.45)";
        ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
        const [fax, fay] = toScreen(-92, BED_Y - 22, 28);
        ctx.fillStyle = "rgba(255,67,101,0.9)"; ctx.font = "bold 8px 'Courier New',monospace";
        ctx.fillText(`FALHA · ${w.risk === "Alto" ? "ACTIVA" : "INACTIVA"}`, fax, fay); ctx.restore();
      }

      // ── RESERVOIR ZONE — BHP-synced pulse ──
      {
        const kick = Math.sin(0.76 * 0.6) * devX;
        const [rx, ry] = toScreen(kick * 0.88, RES_Y, 0);
        const bhpNorm = Math.min(1, Math.max(0.3, w.bhp / 5000));
        const pulse = (0.5 + bhpNorm * 0.5) + Math.sin(t * 1.4) * 0.2 * bhpNorm;
        const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, 80 * zoom);
        rg.addColorStop(0, `rgba(200,150,40,${0.5 * pulse})`);
        rg.addColorStop(0.4, `rgba(160,100,20,${0.22 * pulse})`);
        rg.addColorStop(1, "rgba(80,50,0,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(rx, ry, 80 * zoom, 0, Math.PI * 2); ctx.fill();

        // Radial inflow animation — particles flowing INTO wellbore
        for (let ri = 0; ri < 12; ri++) {
          const angle = (ri / 12) * Math.PI * 2 + t * 0.3;
          const dist = 30 + Math.sin(t * 2 + ri) * 15;
          const inflowX = kick * 0.88 + Math.cos(angle) * dist;
          const inflowY = RES_Y + Math.sin(angle) * dist * 0.3;
          const [ix, iy] = toScreen(inflowX, inflowY, Math.sin(angle) * dist * 0.3);
          ctx.fillStyle = `rgba(245,166,35,${0.3 + Math.sin(t * 3 + ri) * 0.2})`;
          ctx.beginPath(); ctx.arc(ix, iy, 1.5 * zoom, 0, Math.PI * 2); ctx.fill();
        }

        const [goc1x, goc1y] = toScreen(-HALF, RES_Y * 0.88, -HALF);
        const [goc2x, goc2y] = toScreen(HALF, RES_Y * 0.88, -HALF);
        ctx.strokeStyle = "rgba(255,184,48,0.45)"; ctx.lineWidth = 0.8; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(goc1x, goc1y); ctx.lineTo(goc2x, goc2y); ctx.stroke();
        ctx.fillStyle = "rgba(255,184,48,0.7)"; ctx.font = "7px 'Courier New',monospace";
        ctx.fillText("GOC", goc2x + 4, goc2y);

        const [owc1x, owc1y] = toScreen(-HALF, RES_Y * 0.98, -HALF);
        const [owc2x, owc2y] = toScreen(HALF, RES_Y * 0.98, -HALF);
        ctx.strokeStyle = "rgba(0,140,255,0.45)"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(owc1x, owc1y); ctx.lineTo(owc2x, owc2y); ctx.stroke();
        ctx.fillStyle = "rgba(0,140,255,0.7)"; ctx.font = "7px 'Courier New',monospace";
        ctx.fillText("OWC", owc2x + 4, owc2y);
        ctx.setLineDash([]);
      }

      // ── PERFORATIONS — glowing amber dots ──
      for (let pi = 0; pi < 8; pi++) {
        const u = 0.70 + pi * 0.036;
        const kick = Math.sin(u * 0.6) * devX;
        const [sx, sy] = toScreen(kick, BED_Y + (TOTAL_D - BED_Y) * u, Math.sin(pi * 1.1) * 12);
        const pA = 0.5 + Math.sin(t * 3 + pi * 1.2) * 0.5;
        ctx.fillStyle = `rgba(245,166,35,${0.75 * pA})`;
        ctx.shadowBlur = 8; ctx.shadowColor = "rgba(245,166,35,0.6)";
        ctx.beginPath(); ctx.arc(sx, sy, 3.5 * zoom, 0, Math.PI * 2); ctx.fill();
        const pdir = toScreen(kick + 10, BED_Y + (TOTAL_D - BED_Y) * u, Math.sin(pi * 1.1) * 12 + 8);
        ctx.strokeStyle = `rgba(245,166,35,${0.35 * pA})`; ctx.lineWidth = 1; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pdir[0], pdir[1]); ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // ── OIL PARTICLES — amber/gold ──
      const prodSpeed = Math.max(0.5, w.prod / 15000);
      particles.current.forEach(p => {
        p.v += p.vy * prodSpeed;
        if (p.v < -SEA_Y * 0.2) p.v = 580;
        const u = Math.max(0, Math.min(1, (580 - p.v) / 580));
        const kick = Math.sin(u * 0.6) * devX;
        const [sx, sy, sc] = toScreen(kick + p.u * 0.25, BED_Y + (TOTAL_D - BED_Y) * u * 0.92 + (580 - p.v) * 0.22, Math.sin(u * 0.5) * devZ * 0.4 + p.u * 0.12);
        if (sc < 0) return;
        const a = p.alpha * (0.45 + Math.sin(t * 2 + p.phase) * 0.35);
        ctx.fillStyle = `hsla(${p.hue},78%,55%,${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, p.r * sc * 1.9, 0, Math.PI * 2); ctx.fill();
      });

      // ── GAS BUBBLES — blue-white sparkles ──
      gasParticles.current.forEach(p => {
        p.v += p.vy * prodSpeed;
        if (p.v < -SEA_Y * 0.1) p.v = 380;
        const u = Math.max(0, Math.min(1, (380 - p.v) / 380));
        const kick = Math.sin(u * 0.6) * devX * 0.6;
        const [sx, sy, sc] = toScreen(kick + p.u * 0.18, BED_Y + (TOTAL_D - BED_Y) * u * 0.7 + (380 - p.v) * 0.3, p.u * 0.08);
        if (sc < 0) return;
        const a = p.alpha * (0.3 + Math.sin(t * 3 + p.phase) * 0.4);
        ctx.fillStyle = `rgba(200,230,255,${a * 0.6})`;
        ctx.beginPath(); ctx.arc(sx, sy, p.r * sc * 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(200,230,255,${a * 0.3})`; ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // ── WATER PARTICLES — pale blue ──
      waterParticles.current.forEach(p => {
        p.v += p.vy * prodSpeed * 0.6;
        if (p.v < -SEA_Y * 0.15) p.v = 500;
        const u = Math.max(0, Math.min(1, (500 - p.v) / 500));
        const kick = Math.sin(u * 0.6) * devX * 0.8;
        const [sx, sy, sc] = toScreen(kick + p.u * 0.2, BED_Y + (TOTAL_D - BED_Y) * u * 0.85, p.u * 0.1);
        if (sc < 0) return;
        const a = p.alpha * (0.3 + Math.sin(t * 1.5 + p.phase) * 0.3);
        ctx.fillStyle = `rgba(120,180,255,${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, p.r * sc * 1.4, 0, Math.PI * 2); ctx.fill();
      });

      // ── AMBIENT PARTICLES ──
      ambientParticles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.fillStyle = `rgba(100,160,220,${p.alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });

      // ── SEISMIC OVERLAY ──
      SeismicOverlay({ canvas, ctx, W, H, T: t });

      // ── HUD PANELS ──
      const drawPanel = (x: number, y: number, w2: number, h2: number, col: string) => {
        ctx.fillStyle = "rgba(2,6,20,0.88)"; ctx.beginPath(); ctx.roundRect(x, y, w2, h2, 4); ctx.fill();
        ctx.strokeStyle = col + "30"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w2, h2, 4); ctx.stroke();
        ctx.strokeStyle = col + "12"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, w2 - 4, h2 - 4, 3); ctx.stroke();
      };

      const hud = [
        { label: "BHP", unit: "BAR", value: `${w.bhp.toLocaleString()}`, col: "#00a8ff" },
        { label: "TEMP RES.", unit: "°C", value: `${w.temp}`, col: "#ffb830" },
        { label: "API GRAV.", unit: "°API", value: `${w.api}`, col: "#00e5a0" },
        { label: "GOR", unit: "SCF/BBL", value: `${w.gor}`, col: "#a855f7" },
        { label: "W-CUT", unit: "%", value: `${w.wcut}`, col: w.wcut > 30 ? "#ff4365" : "#00e5a0" },
        { label: "PROD", unit: "bbl/d", value: `${(w.prod / 1000).toFixed(1)}k`, col: "#00a8ff" },
      ];
      hud.forEach((h, i) => {
        const panH = 34, panW = 118, margin = 10;
        const px = margin, py = 48 + i * (panH + 5);
        drawPanel(px, py, panW, panH, h.col);
        ctx.fillStyle = h.col + "80"; ctx.font = "6.5px 'Courier New',monospace";
        ctx.fillText(h.label, px + 8, py + 11);
        ctx.fillStyle = "rgba(120,150,200,0.5)"; ctx.font = "5.5px 'Courier New',monospace";
        ctx.fillText(h.unit, px + 8 + ctx.measureText(h.label).width + 3, py + 11);
        ctx.fillStyle = h.col; ctx.font = "bold 13px 'Courier New',monospace";
        ctx.fillText(h.value, px + 8, py + 26);
        const ldAlpha = 0.5 + Math.sin(t * 4 + i) * 0.5;
        ctx.fillStyle = `rgba(0,229,160,${ldAlpha})`;
        ctx.beginPath(); ctx.arc(px + panW - 8, py + 8, 2.5, 0, Math.PI * 2); ctx.fill();
      });

      // ── RIGHT SIDE: TRAJECTORY INFO ──
      const rpx = W - 130, rpy = 48;
      drawPanel(rpx, rpy, 118, 82, "#00a8ff");
      ctx.fillStyle = "#00a8ff80"; ctx.font = "6.5px 'Courier New',monospace"; ctx.fillText("TRAJECTÓRIA", rpx + 8, rpy + 12);
      [["MD", `${w.md}m`], ["TVD", `${w.tvd}m`], ["INC MAX", `${w.inc}°`], ["WD", `${w.wd}m`]].forEach(([k, v], i) => {
        ctx.fillStyle = "rgba(120,165,220,0.6)"; ctx.font = "6px 'Courier New',monospace"; ctx.fillText(k as string, rpx + 8, rpy + 24 + i * 14);
        ctx.fillStyle = "#b4d4ff"; ctx.font = "bold 9px 'Courier New',monospace";
        ctx.textAlign = "right"; ctx.fillText(v as string, rpx + 110, rpy + 24 + i * 14); ctx.textAlign = "left";
      });

      // ── RISK BADGE ──
      const rCol = w.risk === "Baixo" ? "#00e5a0" : w.risk === "Médio" ? "#ffb830" : "#ff4365";
      drawPanel(W - 130, rpy + 90, 118, 26, rCol);
      ctx.fillStyle = rCol; ctx.font = "bold 8.5px 'Courier New',monospace";
      const rText = `● RISCO ${w.risk.toUpperCase()}`;
      ctx.fillText(rText, W - 130 + (118 - ctx.measureText(rText).width) / 2, rpy + 90 + 16);

      // ── WELL NAME TITLE ──
      const titleW = 220;
      drawPanel(cx - titleW / 2, 8, titleW, 38, "#00a8ff");
      ctx.fillStyle = "#00a8ff"; ctx.font = "bold 12px 'Courier New',monospace"; ctx.textAlign = "center";
      ctx.fillText(w.name.toUpperCase(), cx, 24);
      ctx.fillStyle = "rgba(180,210,255,0.5)"; ctx.font = "7.5px 'Courier New',monospace";
      ctx.fillText(`${w.block}  ·  ${w.op}  ·  ${w.basin.toUpperCase()}`, cx, 38);
      ctx.textAlign = "left";

      // ── DEPTH SCALE BAR ──
      const dsX = W - 24, dsYtop = H * 0.15, dsYbot = H * 0.85;
      ctx.strokeStyle = "rgba(0,168,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(dsX, dsYtop); ctx.lineTo(dsX, dsYbot); ctx.stroke();
      const ticks = 5;
      for (let ti = 0; ti <= ticks; ti++) {
        const ty = dsYtop + (dsYbot - dsYtop) * (ti / ticks);
        const dval = Math.round(w.depth * (ti / ticks));
        ctx.strokeStyle = "rgba(0,168,255,0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(dsX - 5, ty); ctx.lineTo(dsX + 1, ty); ctx.stroke();
        ctx.fillStyle = "rgba(120,165,220,0.6)"; ctx.font = "5.5px 'Courier New',monospace"; ctx.textAlign = "right";
        ctx.fillText(`${dval}m`, dsX - 7, ty + 2);
      }
      ctx.textAlign = "left";

      // ── AXIS INDICATOR (XYZ) — bottom left ──
      const axLen = 20;
      const axX = 30, axY2 = H - 45;
      const axes = [
        { label: "X", dx: axLen, dy: 0, col: "#ff4365" },
        { label: "Y", dx: 0, dy: -axLen, col: "#00e5a0" },
        { label: "Z", dx: -axLen * 0.5, dy: axLen * 0.3, col: "#00a8ff" },
      ];
      axes.forEach(({ label: al, dx, dy, col: ac }) => {
        ctx.strokeStyle = ac; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(axX, axY2); ctx.lineTo(axX + dx, axY2 + dy); ctx.stroke();
        ctx.fillStyle = ac; ctx.font = "bold 7px 'Courier New',monospace";
        ctx.fillText(al, axX + dx + (dx > 0 ? 3 : dx < 0 ? -8 : -2), axY2 + dy + (dy < 0 ? -3 : 10));
      });

      // ── BOTTOM STATUS BAR ──
      const sbY = H - 22;
      ctx.fillStyle = "rgba(2,6,20,0.75)"; ctx.fillRect(0, sbY, W, 22);
      ctx.strokeStyle = "rgba(0,168,255,0.15)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, sbY); ctx.lineTo(W, sbY); ctx.stroke();
      ctx.fillStyle = "rgba(0,168,255,0.5)"; ctx.font = "6.5px 'Courier New',monospace";
      const statusText = `SYS:ONLINE  |  CAM:YAW${(cam.current.yaw * 57.3).toFixed(0)}° PITCH${(cam.current.pitch * 57.3).toFixed(0)}°  |  ZOOM:${cam.current.zoom.toFixed(2)}×  |  POÇO:${w.name}  |  ${w.field.toUpperCase()} FIELD  |  LAT:${w.lat}° LNG:${w.lng}°`;
      ctx.fillText(statusText, 10, sbY + 14);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDblClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block select-none touch-none" />;
}

/* ─── CHART TOOLTIP ─────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#040f22]/95 border border-[#00a8ff]/20 rounded-lg p-3 shadow-xl shadow-black/40 backdrop-blur-sm">
      <p className="text-[#6a9ec4] text-[10px] mb-1.5 font-mono tracking-wider">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="text-[10px] font-mono flex justify-between gap-4" style={{ color: e.color }}>
          <span className="opacity-70">{e.name}</span>
          <b>{typeof e.value === "number" ? e.value.toLocaleString("pt-AO") : e.value}</b>
        </p>
      ))}
    </div>
  );
};

/* ─── CIRCULAR GAUGE ─────────────────────────────────────────── */
function Gauge({ value, max = 100, label, color = "#00a8ff", size = 90, unit = "" }: {
  value: number; max?: number; label: string; color?: string; size?: number; unit?: string;
}) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / max, 1) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(0,40,80,0.6)" strokeWidth="5" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color + "25"} strokeWidth="5" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          style={{ filter: `drop-shadow(0 0 5px ${color}90)`, transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x="44" y="42" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold" fontFamily="'Courier New',monospace">{value}</text>
        <text x="44" y="53" textAnchor="middle" fill={color + "70"} fontSize="7" fontFamily="'Courier New',monospace">{unit || `/${max}`}</text>
      </svg>
      <span className="text-[8.5px] text-[#4a7a9a] font-mono tracking-[2px] uppercase">{label}</span>
    </div>
  );
}

/* ─── RISK BAR ───────────────────────────────────────────────── */
function RiskBar({ label, value, threshold }: { label: string; value: number; threshold: number }) {
  const col = value >= threshold ? "#ff4365" : value >= threshold * 0.75 ? "#ffb830" : "#00e5a0";
  const status = value >= threshold ? "CRÍTICO" : value >= threshold * 0.75 ? "ATENÇÃO" : "OK";
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-[9.5px] text-[#5a8aaa] font-mono">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: col, background: col + "18", border: `1px solid ${col}35` }}>{status}</span>
          <span className="text-[10px] font-mono font-bold" style={{ color: col }}>{value}%</span>
        </div>
      </div>
      <div className="relative h-[3px] bg-[#0a1830] rounded-full">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute h-full rounded-full" style={{ background: col, boxShadow: `0 0 8px ${col}60` }} />
        <div className="absolute h-3 w-[1px] top-1/2 -translate-y-1/2" style={{ left: `${threshold}%`, background: "rgba(255,255,255,0.25)" }} />
      </div>
    </div>
  );
}

/* ─── TELEMETRY TICKER — with anomaly dots ─────────────────── */
function TelemetryTicker({ well }: { well: typeof DEFAULT_WELLS[0] }) {
  const items = [
    { k: "PROD", v: `${(well.prod / 1000).toFixed(1)}k bbl/d`, col: "#00a8ff", metricKey: "" },
    { k: "BHP", v: `${well.bhp.toLocaleString()} bar`, col: "#ffb830", metricKey: "bhp" },
    { k: "GOR", v: `${well.gor} scf/bbl`, col: "#a855f7", metricKey: "gor" },
    { k: "W-CUT", v: `${well.wcut}%`, col: well.wcut > 30 ? "#ff4365" : "#00e5a0", metricKey: "wcut" },
    { k: "API", v: `${well.api}°`, col: "#00e5a0", metricKey: "" },
    { k: "TEMP", v: `${well.temp}°C`, col: "#ffb830", metricKey: "temp" },
    { k: "MD", v: `${well.md.toLocaleString()}m`, col: "#00a8ff", metricKey: "" },
    { k: "TVD", v: `${well.tvd.toLocaleString()}m`, col: "#6a9ec4", metricKey: "" },
    { k: "INC", v: `${well.inc}°`, col: "#6a9ec4", metricKey: "" },
    { k: "WD", v: `${well.wd.toLocaleString()}m`, col: "#00a8ff", metricKey: "" },
  ];
  return (
    <div className="border border-[#0a2040] bg-[#020913] rounded-lg flex items-center overflow-hidden">
      <div className="px-3 py-1.5 border-r border-[#0a2040] flex-shrink-0">
        <span className="text-[8px] text-[#00e5a0] font-mono tracking-wider">● LIVE TELEMETRY</span>
      </div>
      <div className="flex gap-0 overflow-x-auto flex-1">
        {items.map(({ k, v, col, metricKey }) => (
          <div key={k} className="flex flex-col px-4 py-2 border-r border-[#0a2040] last:border-0 min-w-fit">
            <div className="flex items-center gap-1.5">
              <span className="text-[8.5px] font-mono" style={{ color: col + "80" }}>{k}</span>
              {metricKey && <AnomalyDot status={getMetricStatus(metricKey, (well as any)[metricKey])} />}
            </div>
            <span className="text-[11px] font-bold font-mono" style={{ color: col }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CAPTURE CANVAS ─────────────────────────────────────────── */
function captureCanvasAsBase64(canvasEl: HTMLCanvasElement | null): string | null {
  if (!canvasEl) return null;
  try {
    return canvasEl.toDataURL("image/png");
  } catch {
    return null;
  }
}

/* ─── PROFESSIONAL PDF EXPORT ─────────────────────────────────── */
async function generateSimulationPDF(well: typeof DEFAULT_WELLS[0], canvasEl: HTMLCanvasElement | null, lang: DocumentLanguageCode = 'pt') {
  const t = getWellSimTranslation(lang);
  const locale = lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'pt-AO';
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  let logoBase64: string | null = null;
  try { logoBase64 = await loadLogoAsBase64(); } catch {}

  // ═══════════════════ PAGE 1: COVER ═══════════════════
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, W, 4, "F");
  if (logoBase64) { try { doc.addImage(logoBase64, "PNG", 20, 16, 32, 32); } catch {} }
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ALPHADATA", 58, 30);
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text("OIL & GAS ANALYTICS", 58, 38);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(2);
  doc.line(20, 55, W - 20, 55);
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text(t.simulationReport, 20, 78);
  doc.text(t.ofWell, 20, 92);
  doc.setFontSize(14);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text(well.name.toUpperCase(), 20, 108);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`${well.block}  |  ${well.op}  |  ${well.field} Field`, 20, 118);
  doc.text(`${t.basin}: ${well.basin}  |  ${t.typeLabel}: ${well.type}`, 20, 126);
  doc.text(`${t.coordinates}: ${well.lat.toFixed(4)}S, ${well.lng.toFixed(4)}E`, 20, 134);
  const boxY = 148;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(20, boxY, W - 40, 48, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, boxY, W - 40, 48, 3, 3, "S");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(t.reportInfo, 28, boxY + 10);
  doc.setDrawColor(203, 213, 225);
  doc.line(28, boxY + 13, W - 28, boxY + 13);
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`${t.type}: ${t.wellSimulation}`, 28, boxY + 22);
  doc.text(`${t.period}: ${t.current}`, 28, boxY + 30);
  doc.text(`${t.generated}: ${new Date().toLocaleDateString(locale)} ${t.at} ${new Date().toLocaleTimeString(locale)}`, 28, boxY + 38);
  doc.text(`${t.status}: ${well.status}`, W / 2 + 10, boxY + 22);
  doc.text(`${t.risk}: ${well.risk}`, W / 2 + 10, boxY + 30);
  doc.text(`${t.probability}: ${well.prob}%`, W / 2 + 10, boxY + 38);
  const dsY = boxY + 60;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(20, dsY, W - 40, 36, 3, 3, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(20, dsY, W - 40, 36, 3, 3, "S");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(t.dataSources, 28, dsY + 10);
  doc.setDrawColor(203, 213, 225);
  doc.line(28, dsY + 13, W - 28, dsY + 13);
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  t.sourcesList.forEach((s, i) => doc.text(`• ${s}`, 28, dsY + 22 + i * 5));
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(t.confidentialNotice, 20, H - 20);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1);
  doc.line(20, H - 12, W - 20, H - 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("AlphaData Analytics  |  www.alphadata.ao", 20, H - 7);
  doc.text(`${t.page} 1`, W - 35, H - 7);

  // ═══════════════════ PAGE 2: 3D VISUALIZATION ═══════════════════
  doc.addPage();
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 18, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`AlphaData  |  ${well.name}  |  ${t.vis3d}`, 20, 12);
  doc.text(`${t.page} 2`, W - 35, 12);
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(t.vis3d, 20, 36);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(t.vis3dDesc, 20, 44);
  const canvasImg = captureCanvasAsBase64(canvasEl);
  if (canvasImg) {
    const imgW = W - 40;
    const imgH = imgW * 0.6;
    doc.setFillColor(4, 15, 34);
    doc.roundedRect(20, 50, imgW, imgH, 3, 3, "F");
    try { doc.addImage(canvasImg, "PNG", 20, 50, imgW, imgH); } catch {}
    doc.setDrawColor(0, 168, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, 50, imgW, imgH, 3, 3, "S");
    const legY = 50 + imgH + 8;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(t.visLegend, 20, legY);
    doc.setDrawColor(203, 213, 225);
    doc.line(20, legY + 2, W - 20, legY + 2);
    const legendColors = [
      [0, 229, 160], [255, 67, 101], [255, 184, 48],
      [0, 168, 255], [74, 130, 184], [37, 58, 86],
    ] as [number, number, number][];
    t.legends.forEach((label, i) => {
      const ly = legY + 8 + i * 10;
      doc.setFillColor(...legendColors[i]);
      doc.circle(24, ly - 1, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(label, 30, ly);
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(t.visNotAvailable, 20, 70);
  }
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, H - 12, W - 20, H - 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`AlphaData Well Simulation  |  ${t.confidentialNotice.split('—')[0].trim()}  |  ${new Date().toLocaleDateString(locale)}`, 20, H - 7);

  // ═══════════════════ PAGE 3: TECHNICAL DATA ═══════════════════
  doc.addPage();
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 18, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`AlphaData  |  ${well.name}  |  ${t.technicalSheet}`, 20, 12);
  doc.text(`${t.page} 3`, W - 35, 12);
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(t.technicalSheet, 20, 36);
  const tr = t.techRows;
  const techData = [
    t.techHeaders,
    [tr.wellName[0], well.name, t.noUnit, tr.wellName[1]],
    [tr.fieldBasin[0], `${well.field} / ${well.basin}`, t.noUnit, tr.fieldBasin[1]],
    [tr.blockOp[0], `${well.block} / ${well.op}`, t.noUnit, tr.blockOp[1]],
    [tr.wellType[0], well.type, t.noUnit, tr.wellType[1]],
    [tr.md[0], well.md.toLocaleString(), tr.md[1], tr.md[2]],
    [tr.tvd[0], well.tvd.toLocaleString(), tr.tvd[1], tr.tvd[2]],
    [tr.wd[0], well.wd.toLocaleString(), tr.wd[1], tr.wd[2]],
    [tr.inc[0], String(well.inc), tr.inc[1], tr.inc[2]],
    [tr.api[0], String(well.api), tr.api[1], tr.api[2]],
    [tr.bhp[0], well.bhp.toLocaleString(), tr.bhp[1], tr.bhp[2]],
    [tr.temp[0], String(well.temp), tr.temp[1], tr.temp[2]],
    [tr.prod[0], well.prod.toLocaleString(), tr.prod[1], tr.prod[2]],
    [tr.gor[0], String(well.gor), tr.gor[1], tr.gor[2]],
    [tr.wcut[0], String(well.wcut), tr.wcut[1], tr.wcut[2]],
    [tr.prob[0], String(well.prob), '%', tr.prob[1]],
    [tr.riskLevel[0], well.risk, t.noUnit, tr.riskLevel[1]],
    [tr.status[0], well.status, t.noUnit, tr.status[1]],
  ];
  autoTable(doc, {
    startY: 44,
    head: [[...t.techHeaders]],
    body: techData.slice(1).map(r => [...r]),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [51, 65, 85], fontSize: 7.5 },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 35 }, 2: { cellWidth: 20 }, 3: { cellWidth: 'auto' } },
    styles: { cellPadding: 3, lineColor: [203, 213, 225], lineWidth: 0.3 },
  });
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, H - 12, W - 20, H - 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`AlphaData Well Simulation  |  ${t.confidentialNotice.split('—')[0].trim()}  |  ${new Date().toLocaleDateString(locale)}`, 20, H - 7);

  // ═══════════════════ PAGE 4: PRODUCTION DATA ═══════════════════
  doc.addPage();
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 18, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`AlphaData  |  ${well.name}  |  ${t.productionData.split('—')[0].trim()}`, 20, 12);
  doc.text(`${t.page} 4`, W - 35, 12);
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(t.productionData, 20, 36);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(t.aiModel, 20, 44);
  autoTable(doc, {
    startY: 52,
    head: [[...t.prodHeaders]],
    body: PROD_DATA.map(d => [d.m, d.real.toLocaleString(locale), d.cap.toLocaleString(locale), d.ai.toLocaleString(locale), d.inj.toLocaleString(locale)]),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [51, 65, 85], fontSize: 8 },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    styles: { cellPadding: 3, lineColor: [203, 213, 225], lineWidth: 0.3 },
  });
  const decY2 = (doc as any).lastAutoTable?.finalY + 16 || 160;
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 10);
  doc.setFont("helvetica", "bold");
  doc.text(t.declineCurve, 20, decY2);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(t.declineDesc, 20, decY2 + 7);
  autoTable(doc, {
    startY: decY2 + 12,
    head: [[...t.declineHeaders]],
    body: DECLINE.map(d => [d.y, d.r ? d.r.toLocaleString(locale) : "—", d.p.toLocaleString(locale)]),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [51, 65, 85], fontSize: 8 },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    styles: { cellPadding: 3, lineColor: [203, 213, 225], lineWidth: 0.3 },
  });
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, H - 12, W - 20, H - 12);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`AlphaData Well Simulation  |  ${t.confidentialNotice.split('—')[0].trim()}  |  ${new Date().toLocaleDateString(locale)}`, 20, H - 7);

  // ═══════════════════ PAGE 5: RISK MATRIX ═══════════════════
  doc.addPage();
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 18, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`AlphaData  |  ${well.name}  |  ${t.riskMatrix}`, 20, 12);
  doc.text(`${t.page} 5`, W - 35, 12);
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(t.riskMatrix, 20, 36);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(t.riskDesc, 20, 44);
  autoTable(doc, {
    startY: 52,
    head: [[...t.riskHeaders]],
    body: RISK_DATA.map(r => {
      const status = r.v >= r.t ? t.critical : r.v >= r.t * 0.75 ? t.warning : t.ok;
      return [r.f, String(r.v), String(r.t), status];
    }),
    theme: "grid",
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fillColor: [255, 255, 255], textColor: [51, 65, 85], fontSize: 8 },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    styles: { cellPadding: 3, lineColor: [203, 213, 225], lineWidth: 0.3 },
    didParseCell: (data: any) => {
      if (data.column.index === 3 && data.section === "body") {
        const val = data.cell.raw as string;
        if (val === t.critical) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = "bold"; }
        else if (val === t.warning) { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = "bold"; }
        else { data.cell.styles.textColor = [22, 163, 74]; }
      }
    },
  });
  const riskY = (doc as any).lastAutoTable?.finalY + 16 || 150;
  doc.setFontSize(12);
  doc.setTextColor(10, 10, 10);
  doc.setFont("helvetica", "bold");
  doc.text(t.conclusions, 20, riskY);
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  const conclusions = t.conclusionLines(well);
  conclusions.forEach((c, i) => {
    doc.text(`${i + 1}. ${c}`, 24, riskY + 10 + i * 8);
  });
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, H - 20, W - 20, H - 20);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const disclaimerLines = doc.splitTextToSize(t.disclaimer, W - 40);
  doc.text(disclaimerLines, 20, H - 14);
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.line(20, H - 5, W - 20, H - 5);

  doc.save(`AlphaData_WellSim_${well.name.replace(/\s+/g, "_")}.pdf`);
  toast.success(t.pdfSuccess);
}

/* ─── MAIN ───────────────────────────────────────────────────── */
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
  const [newWell, setNewWell] = useState({ name: "", block: "", operator: "", field: "", basin: "Congo", type: "Exploração", depth: 3000, wd: 1000 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showPdfLangDialog, setShowPdfLangDialog] = useState(false);

  const riskCol = (r: string) => r === "Baixo" ? "#00e5a0" : r === "Médio" ? "#ffb830" : "#ff4365";

  // Check if any well card has anomaly
  const hasAnomaly = (w: typeof DEFAULT_WELLS[0]) => {
    return ["bhp", "gor", "wcut", "temp"].some(k => getMetricStatus(k, (w as any)[k]) !== "green");
  };

  const fetchSimulations = useCallback(async () => {
    setLoadingDB(true);
    const { data, error } = await supabase.from("well_simulations").select("*").order("created_at", { ascending: false });
    if (!error && data) setSavedSimulations(data);
    setLoadingDB(false);
  }, []);

  useEffect(() => { fetchSimulations(); }, [fetchSimulations]);

  const handleProcess = () => {
    if (uploads.length === 0) { toast.error("Seleccione pelo menos um tipo de dados"); return; }
    setProcessing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setProcessing(false); toast.success("Processamento IA concluído!"); return 100; }
        return p + 1.5;
      });
    }, 40);
  };

  const handleSave = async () => {
    if (!user) { toast.error("É necessário iniciar sessão"); return; }
    setSaving(true);
    const { error } = await supabase.from("well_simulations").insert({
      user_id: user.id, well_name: selected.name, block: selected.block, operator: selected.op,
      field: selected.field, basin: selected.basin, well_type: selected.type, depth: selected.depth,
      water_depth: selected.wd, api_gravity: selected.api, daily_production: selected.prod,
      success_probability: selected.prob, risk_level: selected.risk, status: selected.status,
      latitude: selected.lat, longitude: selected.lng,
      simulation_data: { prodData: PROD_DATA, riskData: RISK_DATA, geoRadar: GEO_RADAR },
    });
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Simulação guardada com sucesso!"); fetchSimulations(); }
  };

  const handleCreateNew = async () => {
    if (!user || !newWell.name) { toast.error("Preencha o nome do poço"); return; }
    setSaving(true);
    const { error } = await supabase.from("well_simulations").insert({
      user_id: user.id, well_name: newWell.name, block: newWell.block || "N/A",
      operator: newWell.operator || "N/A", field: newWell.field, basin: newWell.basin,
      well_type: newWell.type, depth: newWell.depth, water_depth: newWell.wd,
      status: "Pendente", success_probability: 0, risk_level: "Médio",
    });
    setSaving(false);
    if (error) toast.error("Erro ao criar: " + error.message);
    else {
      toast.success("Nova simulação criada!"); setShowNewDialog(false);
      setNewWell({ name: "", block: "", operator: "", field: "", basin: "Congo", type: "Exploração", depth: 3000, wd: 1000 });
      fetchSimulations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("well_simulations").delete().eq("id", id);
    if (error) toast.error("Erro ao eliminar");
    else { toast.success("Simulação eliminada"); fetchSimulations(); }
  };

  const handleExportPDF = async (_format: 'pdf' | 'docx' | 'excel', language: DocumentLanguageCode) => {
    setShowPdfLangDialog(false);
    const canvasEl = canvasContainerRef.current?.querySelector("canvas") || null;
    await generateSimulationPDF(selected, canvasEl, language);
  };

  const handleLoadSavedSim = (sim: any) => {
    const matchedWell = DEFAULT_WELLS.find(w => w.name === sim.well_name);
    if (matchedWell) {
      setSelected(matchedWell);
      toast.success(`Poço ${sim.well_name} carregado`);
    } else {
      toast.info(`Dados do poço ${sim.well_name} visualizados`);
    }
  };

  // Deduplicate wells for table by name
  const deduplicatedSavedSims = useMemo(() => {
    const defaultNames = new Set(DEFAULT_WELLS.map(w => w.name));
    return savedSimulations.filter((s: any) => !defaultNames.has(s.well_name));
  }, [savedSimulations]);

  // Button style helper
  const btnEffect = "transition-all duration-200 active:scale-[0.97] hover:shadow-lg";

  return (
    <div className="flex min-h-screen bg-[#020913]">
      {/* FIXED SIDEBAR */}
      <div className="hidden lg:block sticky top-0 h-screen z-40 flex-shrink-0">
        <Sidebar activeItem="/well-simulation" isMobileOpen={sidebarOpen} setIsMobileOpen={setSidebarOpen} />
      </div>
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar activeItem="/well-simulation" isMobileOpen={sidebarOpen} setIsMobileOpen={setSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header />
        <main className="flex-1 p-3 md:p-5 space-y-4 pb-20 md:pb-5 overflow-auto">

          {/* ── PAGE HEADER ── */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#0a2040] rounded-xl p-4 bg-[#030d20]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#001830] border border-[#00a8ff]/20 flex items-center justify-center flex-shrink-0">
                  <Drill className="w-5 h-5 text-[#00a8ff]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[9px] text-[#3a6a8a] tracking-[3px] uppercase font-mono">AlphaData · Well Engineering Platform</p>
                    <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-[#00e5a0]" />
                    <span className="text-[9px] text-[#00e5a0] font-mono">LIVE</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide font-mono">SIMULAÇÃO DE POÇOS</h1>
                  <p className="text-[10px] text-[#3a6a8a] font-mono mt-0.5">
                    Angola Offshore Basins · Congo · Kwanza · Cabinda · {DEFAULT_WELLS.length} wells registered
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm"
                  className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00a8ff]/40 hover:bg-[#001830] text-[11px] font-mono ${btnEffect}`}
                  onClick={() => setShowNewDialog(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Poço
                </Button>
                <Button variant="outline" size="sm"
                  className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00a8ff]/40 hover:bg-[#001830] text-[11px] font-mono ${btnEffect}`}
                  onClick={() => setShowPdfLangDialog(true)}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Relatório PDF
                </Button>
                <Button size="sm"
                  className={`bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-[#00a8ff] hover:bg-[#00a8ff]/20 text-[11px] font-mono ${btnEffect}`}
                  onClick={handleSave} disabled={saving}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />{saving ? "A salvar..." : "Guardar"}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── TELEMETRY BAR ── */}
          <TelemetryTicker well={selected} />

          {/* ── ANOMALY BANNER ── */}
          <AnomalyBanner well={selected} />

          {/* ── WELL SELECTOR ── */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {DEFAULT_WELLS.map((w) => {
              const active = selected.id === w.id;
              const anomaly = hasAnomaly(w);
              return (
                <motion.button key={w.id} onClick={() => setSelected(w)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  className={`flex-shrink-0 p-3 rounded-lg text-left border transition-all font-mono min-w-[130px] ${btnEffect} ${active
                    ? "bg-[#001830] border-[#00a8ff]/40 shadow-lg shadow-[#00a8ff]/10"
                    : anomaly
                    ? "bg-[#030d20] border-[#ffb830]/30 hover:border-[#ffb830]/50"
                    : "bg-[#030d20] border-[#0a1e38] hover:border-[#00a8ff]/20"}`}
                  style={anomaly && !active ? { animation: "pulse 2s infinite" } : undefined}>
                  <div className="flex items-center gap-1.5">
                    <div className={`text-[11px] font-bold whitespace-nowrap ${active ? "text-[#00a8ff]" : "text-[#b4d4f4]"}`}>{w.name}</div>
                    {anomaly && <span className="text-[8px]">⚠</span>}
                  </div>
                  <div className="text-[8.5px] text-[#3a6a8a] whitespace-nowrap mt-0.5">{w.block}</div>
                  <div className="text-[8px] text-[#2a5272] whitespace-nowrap">{w.basin} · {w.type}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <motion.div animate={{ opacity: active ? [1, 0.4, 1] : 1 }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full" style={{ background: riskCol(w.risk) }} />
                    <span className="text-[8px] font-bold" style={{ color: riskCol(w.risk) }}>{w.risk}</span>
                    <span className="text-[8px] text-[#2a4a6a] ml-1">{w.prob}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ── 3D CANVAS — expanded to 75vh, full width, overlay panel ── */}
          <div className="relative">
            <Card className="overflow-hidden border-[#0a2040] bg-[#020913]">
              <CardHeader className="py-2.5 px-4 flex-row items-center justify-between border-b border-[#0a2040]">
                <CardTitle className="text-[10px] font-mono tracking-widest uppercase flex items-center gap-2 text-[#4a8ab4]">
                  <Boxes className="w-4 h-4 text-[#00e5a0]" />
                  <span className="hidden sm:inline">
                    {viewMode === "2d" ? "Secção Transversal 2D" : viewMode === "blend" ? "Vista Híbrida" : "Visualização 3D Interactiva"} — {selected.name}
                  </span>
                  <span className="sm:hidden text-[9px]">{selected.name}</span>
                </CardTitle>
                <div className="flex gap-1 items-center">
                  {/* Import button */}
                  <Button size="sm"
                    className={`h-6 text-[9px] px-3 font-mono tracking-wider bg-[rgba(26,92,255,0.15)] border border-[rgba(59,123,255,0.30)] text-[#3B7BFF] hover:bg-[rgba(26,92,255,0.25)] ${btnEffect}`}
                    onClick={() => setShowFileUpload(true)}>
                    <Upload className="w-3 h-3 mr-1" /> Importar Dados
                  </Button>
                  <div className="w-px h-5 bg-[#0a2040] mx-1" />
                  {/* View preset buttons */}
                  {[
                    { id: "2d", label: "SECÇÃO" },
                    { id: "blend", label: "HYB" },
                    { id: "3d", label: "3D" },
                  ].map(v => (
                    <Button key={v.id} size="sm" className={`h-6 text-[9px] px-2 font-mono tracking-wider ${btnEffect} ${viewMode === v.id
                      ? "bg-[#00a8ff]/15 border border-[#00a8ff]/40 text-[#00a8ff]"
                      : "bg-transparent border border-[#0a2040] text-[#3a6a8a] hover:text-[#00a8ff] hover:border-[#00a8ff]/30"}`}
                      onClick={() => setViewMode(v.id)}>{v.label}</Button>
                  ))}
                </div>
              </CardHeader>
              <div ref={canvasContainerRef} className="h-[75vh] min-h-[500px] bg-[#020913] relative">
                <WellCanvas well={selected} viewMode={viewMode} />
              </div>
              <div className="flex gap-4 p-3 border-t border-[#0a2040] flex-wrap">
                {[["#00e5a0", "Reservatório"], ["#ff4365", "Falha"], ["#ffb830", "GOC/OWC"], ["#F5A623", "Perfurações"], ["#8A9BB0", "Coluna"], ["#2A3040", "Casing"]].map(([col, lab]) => (
                  <div key={lab as string} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: col as string }} />
                    <span className="text-[9px] text-[#3a6a8a] font-mono">{lab}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── FLOATING RIGHT PANEL (overlay on 3D) ── */}
            <div className="hidden lg:block absolute top-14 right-4 w-[310px] z-10 space-y-3 max-h-[calc(75vh-60px)] overflow-y-auto scrollbar-thin pr-1">
              {/* Well tech specs */}
              <Card className="border-[#0a2040] bg-[#020913]/95 backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4 border-b border-[#0a2040]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-mono tracking-widest uppercase text-[#3a6a8a]">{selected.field} — Ficha Técnica</CardTitle>
                    <Badge className={`text-[9px] font-mono ${selected.status === "Concluído" ? "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/30" : selected.status === "Em análise" ? "bg-[#ffb830]/10 text-[#ffb830] border-[#ffb830]/30" : "bg-[#3a6a8a]/10 text-[#3a6a8a] border-[#3a6a8a]/30"}`}>
                      {selected.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  {[
                    ["Operadora", selected.op], ["Bloco", selected.block], ["Bacia", selected.basin],
                    ["Tipo", selected.type], ["MD / TVD", `${selected.md}m / ${selected.tvd}m`],
                    ["Incl. Máx.", `${selected.inc}°`], ["API Gravity", `${selected.api}° API`],
                    ["BHP", `${selected.bhp.toLocaleString()} bar`], ["Temp. Res.", `${selected.temp}°C`],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between border-b border-[#0a1830] py-1.5 last:border-0">
                      <span className="text-[9.5px] text-[#3a6a8a] font-mono">{k}</span>
                      <span className="text-[9.5px] text-[#b4d4f4] font-bold font-mono">{v}</span>
                    </div>
                  ))}
                  {/* Decline Rate Row */}
                  <DeclineRateRow />
                </CardContent>
              </Card>

              {/* Gauges */}
              <Card className="border-[#0a2040] bg-[#020913]/95 backdrop-blur-sm p-4">
                <p className="text-[9px] text-[#2a5272] tracking-widest mb-3 uppercase font-mono">Indicadores Chave</p>
                <div className="grid grid-cols-3 gap-2">
                  <Gauge value={selected.prob} label="Sucesso" color="#00e5a0" unit="%" />
                  <Gauge value={selected.prod} max={30000} label="Prod." color="#00a8ff" unit="bbl/d" />
                  <Gauge value={selected.wcut} label="Water Cut" color={selected.wcut > 30 ? "#ff4365" : "#ffb830"} unit="%" />
                </div>
              </Card>

              {/* AI Forecast Chart */}
              <Card className="border-[#0a2040] bg-[#020913]/95 backdrop-blur-sm p-4">
                <AIForecastChart currentProd={selected.prod} />
              </Card>

              {/* Risk summary */}
              <Card className="border-[#0a2040] bg-[#020913]/95 backdrop-blur-sm p-4">
                <p className="text-[9px] text-[#2a5272] tracking-widest mb-3 uppercase font-mono">Riscos Operacionais</p>
                {RISK_DATA.slice(0, 4).map(r => <RiskBar key={r.f} label={r.f} value={r.v} threshold={r.t} />)}
              </Card>

              {/* Event Timeline */}
              <Card className="border-[#0a2040] bg-[#020913]/95 backdrop-blur-sm p-4">
                <WellEventTimeline />
              </Card>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm"
                  className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00a8ff]/40 hover:bg-[#001830] text-[10px] font-mono w-full ${btnEffect}`}
                  onClick={handleExportPDF}>
                  <FileText className="w-3 h-3 mr-1" /> PDF
                </Button>
                <Button variant="outline" size="sm"
                  className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00e5a0]/40 hover:bg-[#001830] text-[10px] font-mono w-full ${btnEffect}`}
                  onClick={handleSave} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" /> Guardar
                </Button>
              </div>
            </div>
          </div>

          {/* ── MOBILE RIGHT PANEL (non-overlay for smaller screens) ── */}
          <div className="lg:hidden space-y-3">
            <Card className="border-[#0a2040] bg-[#020913]">
              <CardHeader className="py-2.5 px-4 border-b border-[#0a2040]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-mono tracking-widest uppercase text-[#3a6a8a]">{selected.field} — Ficha Técnica</CardTitle>
                  <Badge className={`text-[9px] font-mono ${selected.status === "Concluído" ? "bg-[#00e5a0]/10 text-[#00e5a0] border-[#00e5a0]/30" : selected.status === "Em análise" ? "bg-[#ffb830]/10 text-[#ffb830] border-[#ffb830]/30" : "bg-[#3a6a8a]/10 text-[#3a6a8a] border-[#3a6a8a]/30"}`}>
                    {selected.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-4">
                {[
                  ["Operadora", selected.op], ["Bloco", selected.block], ["Bacia", selected.basin],
                  ["Tipo", selected.type], ["MD / TVD", `${selected.md}m / ${selected.tvd}m`],
                  ["Incl. Máx.", `${selected.inc}°`], ["API Gravity", `${selected.api}° API`],
                  ["BHP", `${selected.bhp.toLocaleString()} bar`], ["Temp. Res.", `${selected.temp}°C`],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-[#0a1830] py-1.5 last:border-0">
                    <span className="text-[9.5px] text-[#3a6a8a] font-mono">{k}</span>
                    <span className="text-[9.5px] text-[#b4d4f4] font-bold font-mono">{v}</span>
                  </div>
                ))}
                <DeclineRateRow />
              </CardContent>
            </Card>
            <Card className="border-[#0a2040] bg-[#020913] p-4">
              <AIForecastChart currentProd={selected.prod} />
            </Card>
            <Card className="border-[#0a2040] bg-[#020913] p-4">
              <WellEventTimeline />
            </Card>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm"
                className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00a8ff]/40 hover:bg-[#001830] text-[10px] font-mono w-full ${btnEffect}`}
                onClick={handleExportPDF}>
                <FileText className="w-3 h-3 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm"
                className={`border-[#0a2040] text-[#6a9ec4] hover:border-[#00e5a0]/40 hover:bg-[#001830] text-[10px] font-mono w-full ${btnEffect}`}
                onClick={handleSave} disabled={saving}>
                <Save className="w-3 h-3 mr-1" /> Guardar
              </Button>
            </div>
          </div>

          {/* ── UPLOAD SECTION ── */}
          <Card className="border-[#0a2040] bg-[#020913]">
            <CardHeader className="py-2.5 px-4 border-b border-[#0a2040]">
              <CardTitle className="text-[10px] font-mono tracking-widest uppercase text-[#3a6a8a] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00a8ff]" /> Upload de Dados & Processamento IA
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2.5 flex-wrap items-center p-4">
              {[
                ["Sísmico 2D/3D", Crosshair, "SEG-Y, SEGY"],
                ["Perfis LAS/DLIS", BarChart3, "LAS 2.0, DLIS"],
                ["Imagens de Poço", Eye, "FMI, UBI, OBMI"],
                ["Modelo Res. Estático", Layers, "ECLIPSE, CMG"],
                ["Dados de Teste (DST)", Waves, "MDT, FTP, DST"],
                ["Análise PVT", Droplets, "EOS, Correlações"],
              ].map(([label, Icon, fmt], i) => {
                const up = uploads.includes(i);
                const IconComp = Icon as any;
                return (
                  <motion.button key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setUploads(u => up ? u.filter(x => x !== i) : [...u, i])}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all min-w-[100px] ${btnEffect} ${up
                      ? "border-[#00a8ff]/40 bg-[#001830] text-[#00a8ff]"
                      : "border-[#0a1e38] bg-[#030d20] text-[#3a6a8a] hover:border-[#00a8ff]/25 hover:text-[#6a9ec4]"}`}>
                    <IconComp className="w-5 h-5" />
                    <span className="text-[9px] tracking-wider font-mono text-center">{label as string}</span>
                    <span className="text-[7.5px] opacity-50 font-mono">{fmt as string}</span>
                  </motion.button>
                );
              })}
              <div className="ml-auto flex flex-col gap-2 items-end">
                <Button disabled={processing || uploads.length === 0} onClick={handleProcess}
                  className={`bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-[#00a8ff] hover:bg-[#00a8ff]/20 font-mono text-[11px] ${btnEffect}`}>
                  <Zap className="w-4 h-4 mr-1.5" />
                  {processing ? `Processando ${Math.round(progress)}%` : `Processar com IA (${uploads.length} ficheiros)`}
                </Button>
                {processing && (
                  <div className="w-52">
                    <Progress value={progress} className="h-1.5 bg-[#0a1830]" />
                    <p className="text-[8.5px] text-[#3a6a8a] mt-1 tracking-wider font-mono text-right">
                      {progress < 30 ? "Lendo dados sísmicos..." : progress < 60 ? "Calibrando modelo IA..." : progress < 85 ? "Computando previsões..." : "A finalizar relatório..."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── CHARTS ── */}
          <Card className="border-[#0a2040] bg-[#020913]">
            <Tabs value={tab} onValueChange={setTab}>
              <div className="border-b border-[#0a2040] px-4 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  {[
                    { id: "prod", label: "Produção", icon: Activity },
                    { id: "pressure", label: "Pressão", icon: GaugeIcon },
                    { id: "geo", label: "Petrofísica", icon: Layers },
                    { id: "risk", label: "Riscos", icon: Shield },
                    { id: "decline", label: "Declínio", icon: TrendingDown },
                  ].map(t => (
                    <TabsTrigger key={t.id} value={t.id}
                      className={`text-[9.5px] tracking-widest uppercase font-mono rounded-none border-b-2 border-transparent data-[state=active]:border-[#00a8ff] data-[state=active]:bg-transparent data-[state=active]:text-[#00a8ff] text-[#3a6a8a] px-3 md:px-4 py-2.5 ${btnEffect}`}>
                      <t.icon className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">{t.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="p-4">
                <TabsContent value="prod" className="mt-0">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <p className="text-[10px] text-[#3a6a8a] tracking-widest uppercase font-mono">Produção vs Capacidade vs Previsão IA — {selected.block}</p>
                    <div className="flex gap-3 text-[9px] font-mono">
                      {[["#00a8ff", "Real"], ["#3a6a8a", "Cap."], ["#00e5a0", "IA"], ["#6a4ab8", "Inj."]].map(([c, l]) => (
                        <span key={l} className="flex items-center gap-1"><span className="w-2 h-0.5 inline-block rounded" style={{ background: c as string }} />{l}</span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={270}>
                    <AreaChart data={PROD_DATA}>
                      <defs>
                        <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00a8ff" stopOpacity={0.25} /><stop offset="100%" stopColor="#00a8ff" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gInj" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a4ab8" stopOpacity={0.15} /><stop offset="100%" stopColor="#6a4ab8" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,40,80,0.5)" />
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="cap" stroke="#2a4a6a" strokeDasharray="5 5" strokeWidth={1.2} fill="none" name="Capacidade" />
                      <Area type="monotone" dataKey="real" stroke="#00a8ff" strokeWidth={2.5} fill="url(#gReal)" name="Produção Real" />
                      <Area type="monotone" dataKey="ai" stroke="#00e5a0" strokeDasharray="6 3" strokeWidth={2} fill="none" name="Previsão IA" />
                      <Area type="monotone" dataKey="inj" stroke="#6a4ab8" strokeWidth={1.5} fill="url(#gInj)" name="Injecção" />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="pressure" className="mt-0">
                  <p className="text-[10px] text-[#3a6a8a] tracking-widest mb-4 uppercase font-mono">Curva de Pressão vs Profundidade — {selected.name}</p>
                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart data={PRESSURE_DEPTH} layout="vertical">
                      <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,40,80,0.5)" />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} />
                      <YAxis type="number" dataKey="depth" reversed tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}m`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="frac" stroke="#ff4365" strokeWidth={1.8} dot={false} name="Fractura" />
                      <Line type="monotone" dataKey="pore" stroke="#00a8ff" strokeWidth={2} dot={false} name="Poros" />
                      <Line type="monotone" dataKey="mud" stroke="#00e5a0" strokeWidth={1.8} strokeDasharray="6 3" dot={false} name="Lama" />
                      <Line type="monotone" dataKey="hydro" stroke="#2a4a6a" strokeWidth={1.2} strokeDasharray="3 4" dot={false} name="Hidrost." />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="geo" className="mt-0">
                  <p className="text-[10px] text-[#3a6a8a] tracking-widest mb-4 uppercase font-mono">Análise Petrofísica — {selected.field}</p>
                  <ResponsiveContainer width="100%" height={270}>
                    <RadarChart data={GEO_RADAR} cx="50%" cy="50%" outerRadius="68%">
                      <PolarGrid stroke="rgba(0,60,100,0.6)" />
                      <PolarAngleAxis dataKey="s" tick={{ fontSize: 9.5, fill: "#2a5272", fontFamily: "Courier New" }} />
                      <PolarRadiusAxis angle={30} tick={{ fontSize: 7, fill: "#1a3a5a" }} />
                      <Radar name="Poço Actual" dataKey="A" stroke="#00a8ff" fill="#00a8ff" fillOpacity={0.12} strokeWidth={2} dot={{ fill: "#00a8ff", r: 3 }} />
                      <Radar name="Média Bacia" dataKey="B" stroke="#ffb830" fill="#ffb830" fillOpacity={0.06} strokeWidth={1.5} dot={{ fill: "#ffb830", r: 2 }} />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: "Courier New", color: "#3a6a8a" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="risk" className="mt-0">
                  <p className="text-[10px] text-[#3a6a8a] tracking-widest mb-4 uppercase font-mono">Matriz de Riscos — {selected.name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {RISK_DATA.map(r => <RiskBar key={r.f} label={r.f} value={r.v} threshold={r.t} />)}
                  </div>
                </TabsContent>

                <TabsContent value="decline" className="mt-0">
                  <p className="text-[10px] text-[#3a6a8a] tracking-widest mb-4 uppercase font-mono">Curva de Declínio — Modelo Exponencial</p>
                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart data={DECLINE}>
                      <CartesianGrid strokeDasharray="3 4" stroke="rgba(0,40,80,0.5)" />
                      <XAxis dataKey="y" tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#2a5272", fontFamily: "Courier New" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine x="2025" stroke="rgba(0,168,255,0.2)" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="r" stroke="#00a8ff" strokeWidth={2.5} dot={{ fill: "#00a8ff", r: 4, strokeWidth: 0 }} name="Real" connectNulls={false} />
                      <Line type="monotone" dataKey="p" stroke="#ffb830" strokeWidth={2} strokeDasharray="7 3" dot={{ fill: "#ffb830", r: 3, strokeWidth: 0 }} name="Previsão IA" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* ── HISTORY TABLE ── */}
          <Card className="border-[#0a2040] bg-[#020913]">
            <CardHeader className="py-2.5 px-4 border-b border-[#0a2040] flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-mono tracking-widest uppercase text-[#3a6a8a] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00a8ff]" /> Registo de Simulações
              </CardTitle>
              <Badge variant="outline" className="text-[9px] font-mono border-[#0a2040] text-[#3a6a8a]">
                {DEFAULT_WELLS.length + deduplicatedSavedSims.length} poços
              </Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#0a1830] hover:bg-transparent">
                    {["Poço", "Bloco", "Operadora", "Bacia", "MD", "API°", "Sucesso", "Status", "Acção"].map(h => (
                      <TableHead key={h} className="text-[9px] font-mono text-[#2a5272] tracking-wider">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEFAULT_WELLS.map(w => (
                    <TableRow key={w.id}
                      className={`border-[#0a1830] cursor-pointer transition-all ${selected.id === w.id ? "bg-[#001830]" : "hover:bg-[#030d20]"}`}
                      onClick={() => setSelected(w)}>
                      <TableCell className="text-[10px] font-bold font-mono text-[#b4d4f4]">{w.name}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#3a6a8a]">{w.block}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#3a6a8a]">{w.op}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{w.basin}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#4a7a9a]">{w.md.toLocaleString()}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#4a7a9a]">{w.api}°</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1 bg-[#0a1830] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${w.prob}%`, background: w.prob > 85 ? "#00e5a0" : "#ffb830" }} />
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: w.prob > 85 ? "#00e5a0" : "#ffb830" }}>{w.prob}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border ${w.status === "Concluído" ? "bg-[#00e5a0]/8 text-[#00e5a0] border-[#00e5a0]/25" : w.status === "Em análise" ? "bg-[#ffb830]/8 text-[#ffb830] border-[#ffb830]/25" : "bg-[#3a6a8a]/8 text-[#3a6a8a] border-[#3a6a8a]/25"}`}>
                          {w.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className={`h-6 text-[9px] px-2 font-mono text-[#3a6a8a] hover:text-[#00a8ff] ${btnEffect}`}>
                            <Eye className="w-3 h-3 mr-1" /> Ver
                          </Button>
                          <Button variant="ghost" size="sm" className={`h-6 text-[9px] px-2 font-mono text-[#3a6a8a] hover:text-[#F5A623] ${btnEffect}`}
                            onClick={(e) => { e.stopPropagation(); setSelected(w); setShowComparison(true); }}>
                            <GitCompare className="w-3 h-3 mr-1" /> Comparar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deduplicatedSavedSims.map((s: any) => (
                    <TableRow key={s.id} className="border-[#0a1830] hover:bg-[#030d20]">
                      <TableCell className="text-[10px] font-bold font-mono text-[#6a9ec4]">{s.well_name}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{s.block}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{s.operator}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{s.basin}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{s.depth?.toLocaleString() || "—"}</TableCell>
                      <TableCell className="text-[9px] font-mono text-[#2a5272]">{s.api_gravity || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-1 bg-[#0a1830] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.success_probability || 0}%`, background: (s.success_probability || 0) > 85 ? "#00e5a0" : "#ffb830" }} />
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: (s.success_probability || 0) > 85 ? "#00e5a0" : "#ffb830" }}>{s.success_probability || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded border bg-[#3a6a8a]/8 text-[#3a6a8a] border-[#3a6a8a]/25">{s.status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className={`h-6 text-[9px] px-2 font-mono text-[#3a6a8a] hover:text-[#00a8ff] ${btnEffect}`}
                            onClick={() => handleLoadSavedSim(s)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className={`h-6 text-[9px] px-2 font-mono text-[#3a6a8a] hover:text-[#ff4365] ${btnEffect}`}
                            onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
        <DialogContent className="max-w-md bg-[#030d20] border-[#0a2040]">
          <DialogHeader>
            <DialogTitle className="font-mono text-[#b4d4f4]">Registar Novo Poço</DialogTitle>
            <DialogDescription className="text-[#3a6a8a] text-[11px] font-mono">Introduza os parâmetros iniciais para criar uma nova simulação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-mono text-[#3a6a8a]">Nome do Poço *</Label>
              <Input value={newWell.name} onChange={e => setNewWell(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Girassol-5" className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Bloco</Label>
                <Input value={newWell.block} onChange={e => setNewWell(p => ({ ...p, block: e.target.value }))} placeholder="Bloco 17" className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
              </div>
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Operadora</Label>
                <Input value={newWell.operator} onChange={e => setNewWell(p => ({ ...p, operator: e.target.value }))} placeholder="TotalEnergies" className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Campo</Label>
                <Input value={newWell.field} onChange={e => setNewWell(p => ({ ...p, field: e.target.value }))} placeholder="Girassol" className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
              </div>
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Bacia</Label>
                <Select value={newWell.basin} onValueChange={v => setNewWell(p => ({ ...p, basin: v }))}>
                  <SelectTrigger className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#030d20] border-[#0a2040]">
                    {["Congo", "Kwanza", "Cabinda", "Namibe"].map(b => <SelectItem key={b} value={b} className="font-mono text-[#b4d4f4]">{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Prof. Total MD (m)</Label>
                <Input type="number" value={newWell.depth} onChange={e => setNewWell(p => ({ ...p, depth: Number(e.target.value) }))} className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
              </div>
              <div>
                <Label className="text-[10px] font-mono text-[#3a6a8a]">Lâmina d'Água (m)</Label>
                <Input type="number" value={newWell.wd} onChange={e => setNewWell(p => ({ ...p, wd: Number(e.target.value) }))} className="bg-[#020913] border-[#0a2040] text-[#b4d4f4] font-mono text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}
              className={`border-[#0a2040] text-[#3a6a8a] font-mono text-sm ${btnEffect}`}>Cancelar</Button>
            <Button onClick={handleCreateNew} disabled={saving || !newWell.name}
              className={`bg-[#00a8ff]/10 border border-[#00a8ff]/30 text-[#00a8ff] hover:bg-[#00a8ff]/20 font-mono text-sm ${btnEffect}`}>
              {saving ? "A criar..." : "Criar Simulação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── WELL COMPARISON DRAWER ── */}
      <WellComparisonDrawer
        open={showComparison}
        onClose={() => setShowComparison(false)}
        wellLeft={selected}
        allWells={DEFAULT_WELLS}
      />

      {/* ── FILE UPLOAD MODAL ── */}
      <TechnicalFileUploadModal
        open={showFileUpload}
        onOpenChange={setShowFileUpload}
      />
    </div>
  );
}
