import { useState, useRef, Suspense, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Cylinder, Sphere, Box } from "@react-three/drei";
import {
  Upload, Brain, Activity, AlertTriangle, TrendingUp, Gauge, Layers,
  Save, Plus, Download, Eye, Cpu, Zap, Target, BarChart3, CheckCircle2,
  Clock, Loader2, Droplets, MapPin, Factory, Anchor,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";
import * as THREE from "three";
import { useTheme } from "@/hooks/useTheme";

/* ═══════════════════════════════════════════════════════════════════
   REAL ANGOLAN OIL BASIN DATA
   Based on actual blocks, operators and fields in Angola
   ═══════════════════════════════════════════════════════════════════ */

interface BasinWell {
  id: number;
  name: string;
  block: string;
  operator: string;
  field: string;
  basin: string;
  type: string;
  depth: number;
  waterDepth: number;
  status: string;
  successProb: number;
  riskLevel: string;
  dailyProduction: number;
  apiGravity: number;
  date: string;
  coordinates: { lat: number; lng: number };
}

const ANGOLAN_WELLS: BasinWell[] = [
  {
    id: 1, name: "Girassol-4", block: "Bloco 17", operator: "TotalEnergies",
    field: "Girassol", basin: "Bacia do Congo", type: "Produção",
    depth: 4250, waterDepth: 1360, status: "Concluído", successProb: 92,
    riskLevel: "Baixo", dailyProduction: 18500, apiGravity: 30.2,
    date: "2026-02-28", coordinates: { lat: -7.35, lng: 11.82 },
  },
  {
    id: 2, name: "Dalia-7", block: "Bloco 17", operator: "TotalEnergies",
    field: "Dalia", basin: "Bacia do Congo", type: "Desenvolvimento",
    depth: 3890, waterDepth: 1400, status: "Em análise", successProb: 85,
    riskLevel: "Médio", dailyProduction: 15200, apiGravity: 23.6,
    date: "2026-02-25", coordinates: { lat: -7.42, lng: 11.75 },
  },
  {
    id: 3, name: "Kaombo Norte-2", block: "Bloco 32", operator: "TotalEnergies",
    field: "Kaombo", basin: "Bacia do Congo", type: "Exploração",
    depth: 4680, waterDepth: 1950, status: "Concluído", successProb: 78,
    riskLevel: "Médio", dailyProduction: 22400, apiGravity: 27.8,
    date: "2026-02-20", coordinates: { lat: -7.58, lng: 11.64 },
  },
  {
    id: 4, name: "Plutónio-A3", block: "Bloco 18", operator: "BP",
    field: "Plutónio", basin: "Bacia do Congo", type: "Produção",
    depth: 3540, waterDepth: 1300, status: "Concluído", successProb: 88,
    riskLevel: "Baixo", dailyProduction: 16800, apiGravity: 33.1,
    date: "2026-02-18", coordinates: { lat: -7.68, lng: 11.55 },
  },
  {
    id: 5, name: "Kissanje-5", block: "Bloco 15/06", operator: "Eni Angola",
    field: "Kissanje", basin: "Bacia do Kwanza", type: "Avaliação",
    depth: 3980, waterDepth: 850, status: "Em análise", successProb: 71,
    riskLevel: "Alto", dailyProduction: 8900, apiGravity: 29.4,
    date: "2026-02-15", coordinates: { lat: -8.12, lng: 12.34 },
  },
  {
    id: 6, name: "Mafumeira Sul-1", block: "Bloco 0", operator: "Chevron (Cabinda Gulf)",
    field: "Mafumeira Sul", basin: "Bacia de Cabinda", type: "Exploração",
    depth: 2450, waterDepth: 65, status: "Concluído", successProb: 94,
    riskLevel: "Baixo", dailyProduction: 11200, apiGravity: 36.5,
    date: "2026-02-10", coordinates: { lat: -5.42, lng: 12.08 },
  },
  {
    id: 7, name: "Pazflor-B2", block: "Bloco 17", operator: "TotalEnergies",
    field: "Pazflor", basin: "Bacia do Congo", type: "Desenvolvimento",
    depth: 4120, waterDepth: 1200, status: "Pendente", successProb: 82,
    riskLevel: "Médio", dailyProduction: 19600, apiGravity: 25.9,
    date: "2026-02-05", coordinates: { lat: -7.31, lng: 11.88 },
  },
  {
    id: 8, name: "CLOV-E1", block: "Bloco 17", operator: "TotalEnergies",
    field: "CLOV", basin: "Bacia do Congo", type: "Produção",
    depth: 3750, waterDepth: 1350, status: "Concluído", successProb: 90,
    riskLevel: "Baixo", dailyProduction: 21000, apiGravity: 31.7,
    date: "2026-01-28", coordinates: { lat: -7.39, lng: 11.79 },
  },
];

const selectedWellDefault = ANGOLAN_WELLS[0];

// Production forecast data based on real decline curves
const productionForecast = [
  { month: "Jan", producao: 145200, capacidade: 168000, previsao: 142000 },
  { month: "Fev", producao: 142800, capacidade: 168000, previsao: 139500 },
  { month: "Mar", producao: 139500, capacidade: 165000, previsao: 137000 },
  { month: "Abr", producao: 137200, capacidade: 165000, previsao: 134500 },
  { month: "Mai", producao: 135100, capacidade: 162000, previsao: 132000 },
  { month: "Jun", producao: 133800, capacidade: 162000, previsao: 130000 },
  { month: "Jul", producao: 131500, capacidade: 160000, previsao: 128000 },
  { month: "Ago", producao: 129800, capacidade: 160000, previsao: 126500 },
];

// Risk matrix based on real geological factors
const riskMatrix = [
  { factor: "Pressão do Reservatório", score: 72, threshold: 80 },
  { factor: "Integridade do Poço", score: 88, threshold: 90 },
  { factor: "Risco Geológico", score: 45, threshold: 60 },
  { factor: "Subsidência", score: 32, threshold: 50 },
  { factor: "Corrosão", score: 58, threshold: 70 },
  { factor: "H₂S / CO₂", score: 25, threshold: 40 },
];

// Radar data for geological analysis
const geologicalRadar = [
  { subject: "Porosidade", A: 78, B: 65, fullMark: 100 },
  { subject: "Permeabilidade", A: 85, B: 72, fullMark: 100 },
  { subject: "Saturação", A: 62, B: 58, fullMark: 100 },
  { subject: "Espessura Net Pay", A: 91, B: 80, fullMark: 100 },
  { subject: "Conectividade", A: 70, B: 55, fullMark: 100 },
  { subject: "Pressão", A: 82, B: 75, fullMark: 100 },
];

// Decline curve analysis
const declineCurve = [
  { year: "2024", atual: 26500, projetado: 26500 },
  { year: "2025", atual: 24200, projetado: 24800 },
  { year: "2026", atual: 22100, projetado: 23200 },
  { year: "2027", atual: null, projetado: 21700 },
  { year: "2028", atual: null, projetado: 20300 },
  { year: "2029", atual: null, projetado: 19100 },
  { year: "2030", atual: null, projetado: 18000 },
];

/* ═══════════════════════════════════════════════════════════════════
   3D WELL VISUALIZATION
   ═══════════════════════════════════════════════════════════════════ */

function WellStructure({ well }: { well: BasinWell }) {
  const groupRef = useRef<THREE.Group>(null);
  const depthScale = well.depth / 4500;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ocean surface */}
      <Box args={[12, 0.08, 12]} position={[0, 5, 0]}>
        <meshStandardMaterial color="#1e40af" transparent opacity={0.3} />
      </Box>

      {/* FPSO platform */}
      <Box args={[3.5, 0.4, 1.8]} position={[0, 5.3, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[0.3, 1.2, 0.3]} position={[1, 6.1, 0]}>
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Riser */}
      <Cylinder args={[0.06, 0.06, well.waterDepth / 300]} position={[0, 5 - well.waterDepth / 600, 0]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </Cylinder>

      {/* Mudline / Seabed */}
      <Box args={[12, 0.15, 12]} position={[0, 5 - well.waterDepth / 300, 0]}>
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </Box>

      {/* Conductor casing */}
      <Cylinder args={[0.4, 0.4, 2 * depthScale]} position={[0, 5 - well.waterDepth / 300 - depthScale, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </Cylinder>

      {/* Surface casing */}
      <Cylinder args={[0.32, 0.32, 3 * depthScale]} position={[0, 5 - well.waterDepth / 300 - 1.5 * depthScale, 0]}>
        <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
      </Cylinder>

      {/* Production casing - deviated */}
      <Cylinder args={[0.22, 0.18, 4 * depthScale]} position={[0.6 * depthScale, 5 - well.waterDepth / 300 - 3.5 * depthScale, 0]} rotation={[0, 0, 0.18]}>
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
      </Cylinder>

      {/* Reservoir zone */}
      <Sphere args={[1.5 * depthScale, 32, 32]} position={[1.2 * depthScale, 5 - well.waterDepth / 300 - 6 * depthScale, 0]}>
        <meshStandardMaterial color="#22c55e" transparent opacity={0.2} emissive="#22c55e" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.9 * depthScale, 32, 32]} position={[1.2 * depthScale, 5 - well.waterDepth / 300 - 6 * depthScale, 0]}>
        <meshStandardMaterial color="#16a34a" transparent opacity={0.35} emissive="#16a34a" emissiveIntensity={0.5} />
      </Sphere>

      {/* Fault plane */}
      {well.riskLevel !== "Baixo" && (
        <Box args={[0.04, 5 * depthScale, 4]} position={[-1.5, 5 - well.waterDepth / 300 - 3 * depthScale, 0]} rotation={[0, 0.3, 0.45]}>
          <meshStandardMaterial color="#ef4444" transparent opacity={0.4} emissive="#ef4444" emissiveIntensity={0.5} />
        </Box>
      )}

      {/* Risk zone */}
      {well.riskLevel === "Alto" && (
        <Sphere args={[0.8, 16, 16]} position={[-0.8, 5 - well.waterDepth / 300 - 2 * depthScale, 0.5]}>
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.25} emissive="#f59e0b" emissiveIntensity={0.4} />
        </Sphere>
      )}

      {/* Geological strata */}
      {[0, -1.5, -3, -4.5, -6, -7.5].map((y, i) => (
        <Box key={i} args={[10, 0.04, 10]} position={[0, 5 - well.waterDepth / 300 + y * depthScale, 0]}>
          <meshStandardMaterial
            color={["#451a03", "#78350f", "#92400e", "#78350f", "#451a03", "#365314"][i]}
            transparent opacity={0.25}
          />
        </Box>
      ))}

      {/* Perforation zones */}
      {[-5, -5.5, -6, -6.5].map((y, i) => (
        <Sphere key={`perf-${i}`} args={[0.07, 8, 8]} position={[1 * depthScale + Math.sin(i * 1.5) * 0.3, 5 - well.waterDepth / 300 + y * depthScale, Math.cos(i * 1.5) * 0.3]}>
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
        </Sphere>
      ))}
    </group>
  );
}

function Scene3D({ well }: { well: BasinWell }) {
  return (
    <Canvas camera={{ position: [10, 4, 10], fov: 45 }} className="rounded-xl">
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 15, 5]} intensity={1.2} />
      <directionalLight position={[-5, -5, -5]} intensity={0.2} color="#3b82f6" />
      <pointLight position={[1.2, -4, 0]} intensity={2} color="#22c55e" distance={8} />
      {well.riskLevel === "Alto" && (
        <pointLight position={[-0.8, -2, 0.5]} intensity={1.5} color="#f59e0b" distance={5} />
      )}
      <fog attach="fog" args={["#030712", 18, 40]} />
      <Suspense fallback={null}>
        <WellStructure well={well} />
      </Suspense>
      <OrbitControls enablePan enableZoom enableRotate autoRotate={false} maxDistance={30} minDistance={6} />
      <gridHelper args={[24, 24, "#1e293b", "#0f172a"]} position={[0, -9, 0]} />
    </Canvas>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════════════════════════════════════ */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-AO') : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function WellSimulation() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [selectedWell, setSelectedWell] = useState<BasinWell>(selectedWellDefault);
  const [activeTab, setActiveTab] = useState("overview");
  const { theme } = useTheme();

  const handleProcess = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); setProcessing(false); return 100; }
        return prev + 1.5;
      });
    }, 60);
  };

  const handleUpload = (type: string) => setUploadedFiles((prev) => [...prev, type]);

  const riskColor = (level: string) =>
    level === "Baixo" ? "text-emerald-400" : level === "Médio" ? "text-amber-400" : "text-red-400";
  const riskBg = (level: string) =>
    level === "Baixo" ? "bg-emerald-500/10 border-emerald-500/20" : level === "Médio" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

  return (
    <>
      <Helmet>
        <title>Visão Computacional – Simulação de Poços | AlphaData</title>
        <meta name="description" content="Simulação inteligente e visualização 3D de poços petrolíferos angolanos" />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        <Sidebar activeItem="/well-simulation" isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header activeItem="/well-simulation" />

          <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-auto">
            {/* PAGE HEADER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Cpu className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      <Zap className="w-3 h-3 mr-1" /> Deep Tech
                    </Badge>
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                      <Activity className="w-3 h-3 mr-1" /> {ANGOLAN_WELLS.length} Poços Activos
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                    Simulação Inteligente de Poços
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Análise das bacias petrolíferas de Angola — Congo, Kwanza e Cabinda
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Nova Simulação
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Exportar Relatório
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Save className="w-4 h-4" /> Salvar Modelo
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* WELL SELECTOR */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {ANGOLAN_WELLS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWell(w)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl border text-left transition-all ${
                      selectedWell.id === w.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-card hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground whitespace-nowrap">{w.name}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{w.block} · {w.operator}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* UPLOAD SECTION */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <Card className="border-border/50 card-gradient">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    Upload de Dados — {selectedWell.field}
                    <Badge variant="outline" className="text-[10px] ml-2">{selectedWell.basin}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "Dados Sísmicos 2D/3D", icon: Activity, type: "seismic" },
                      { label: "Perfis de Poço (LAS)", icon: Layers, type: "well_logs" },
                      { label: "Imagens Geológicas", icon: MapPin, type: "geological" },
                      { label: "Modelos de Reservatório", icon: Target, type: "reservoir" },
                    ].map((item) => {
                      const isUploaded = uploadedFiles.includes(item.type);
                      return (
                        <button
                          key={item.type}
                          onClick={() => handleUpload(item.type)}
                          className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed transition-all ${
                            isUploaded ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                          }`}
                        >
                          {isUploaded ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <item.icon className="w-6 h-6 text-muted-foreground" />}
                          <span className="text-xs font-medium text-foreground">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground">{isUploaded ? "Carregado ✓" : "Arrastar ou clicar"}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    <Button onClick={handleProcess} disabled={processing || uploadedFiles.length === 0} className="gap-2">
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {processing ? "A processar dados sísmicos..." : "Processar com IA"}
                    </Button>
                    {processing && (
                      <div className="flex-1 flex items-center gap-3">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs font-mono text-muted-foreground w-10">{Math.round(progress)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3D + ANALYSIS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
              {/* 3D Canvas */}
              <Card className="xl:col-span-3 border-border/50 card-gradient overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      {selectedWell.name} — {selectedWell.field}
                      <Badge variant="outline" className="ml-2 text-[10px]">3D Interativo</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {selectedWell.coordinates.lat.toFixed(2)}°S, {selectedWell.coordinates.lng.toFixed(2)}°E
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[420px] md:h-[500px] w-full bg-[#030712] rounded-b-xl">
                    <Scene3D well={selectedWell} />
                  </div>
                  <div className="flex items-center justify-between p-4 border-t border-border/30 flex-wrap gap-3">
                    <div className="flex items-center gap-5 flex-wrap">
                      {[
                        { color: "#22c55e", label: "Reservatório" },
                        { color: "#ef4444", label: "Falha Geológica" },
                        { color: "#f59e0b", label: "Zona de Risco" },
                        { color: "#3b82f6", label: "Perfurações" },
                        { color: "#1e40af", label: "Nível do Mar" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}50` }} />
                          <span className="text-[10px] text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Prof. água: {selectedWell.waterDepth.toLocaleString()}m · Prof. total: {selectedWell.depth.toLocaleString()}m
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Panel */}
              <div className="space-y-3">
                {/* Well Info Card */}
                <Card className="border-border/50 card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Factory className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">{selectedWell.operator}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Bloco</span><span className="font-semibold text-foreground">{selectedWell.block}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bacia</span><span className="font-semibold text-foreground">{selectedWell.basin.replace('Bacia ', '')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">API Gravity</span><span className="font-semibold text-foreground">{selectedWell.apiGravity}°</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><Badge variant="outline" className="text-[10px] h-5">{selectedWell.type}</Badge></div>
                    </div>
                  </CardContent>
                </Card>

                {/* KPIs */}
                {[
                  { label: "Prob. de Sucesso", value: `${selectedWell.successProb}%`, icon: Target, color: selectedWell.successProb > 80 ? "text-emerald-400" : "text-amber-400", bg: selectedWell.successProb > 80 ? "bg-emerald-500/10" : "bg-amber-500/10" },
                  { label: "Nível de Risco", value: selectedWell.riskLevel, icon: AlertTriangle, color: riskColor(selectedWell.riskLevel), bg: riskBg(selectedWell.riskLevel).split(" ")[0] },
                  { label: "Profundidade Total", value: `${selectedWell.depth.toLocaleString()}m`, icon: Gauge, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Produção Diária", value: `${(selectedWell.dailyProduction / 1000).toFixed(1)}k bbl/d`, icon: Droplets, color: "text-primary", bg: "bg-primary/10" },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}>
                    <Card className="border-border/50 card-gradient">
                      <CardContent className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${kpi.bg}`}>
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                            <p className="text-base font-bold text-foreground">{kpi.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* AI Model */}
                <Card className="border-border/50 card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Modelo IA</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Status</span><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Activo</Badge></div>
                      <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Precisão</span><span className="text-[10px] font-bold text-foreground">94.7%</span></div>
                      <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Amostras</span><span className="text-[10px] font-bold text-foreground">12,847</span></div>
                      <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Modelo</span><span className="text-[10px] text-muted-foreground">LSTM + Random Forest</span></div>
                      <Progress value={94.7} className="h-1 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* ANALYSIS TABS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="bg-muted/50 border border-border/30 mb-4">
                  <TabsTrigger value="overview" className="text-xs gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Produção</TabsTrigger>
                  <TabsTrigger value="geological" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" />Geologia</TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Riscos</TabsTrigger>
                  <TabsTrigger value="decline" className="text-xs gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Declínio</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <Card className="border-border/50 card-gradient">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Projeção de Produção — {selectedWell.block} ({selectedWell.operator})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={productionForecast}>
                            <defs>
                              <linearGradient id="prodGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="capacidade" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} fill="none" name="Capacidade Instalada" />
                            <Area type="monotone" dataKey="producao" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#prodGrad2)" name="Produção Real (bbl/d)" />
                            <Area type="monotone" dataKey="previsao" stroke="#22c55e" strokeDasharray="6 3" strokeWidth={1.5} fill="none" name="Previsão IA (bbl/d)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="geological">
                  <Card className="border-border/50 card-gradient">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Análise Petrofísica — {selectedWell.field}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={geologicalRadar} cx="50%" cy="50%" outerRadius="75%">
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <PolarRadiusAxis angle={30} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                            <Radar name="Poço Actual" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="Média da Bacia" dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk">
                  <Card className="border-border/50 card-gradient">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Matriz de Riscos Operacionais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={riskMatrix} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="factor" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={130} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="score" name="Score (%)" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
                            <Bar dataKey="threshold" name="Limiar Crítico (%)" radius={[0, 4, 4, 0]} fill="#ef4444" fillOpacity={0.3} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="decline">
                  <Card className="border-border/50 card-gradient">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Curva de Declínio — Análise de Longo Prazo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={declineCurve}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="atual" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} name="Produção Real (bbl/d)" connectNulls={false} />
                            <Line type="monotone" dataKey="projetado" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#f59e0b", r: 3 }} name="Projeção IA (bbl/d)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* SIMULATION HISTORY */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="border-border/50 card-gradient">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Histórico de Simulações — Bacias Angolanas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-[10px]">Poço / Campo</TableHead>
                          <TableHead className="text-[10px]">Bloco</TableHead>
                          <TableHead className="text-[10px]">Operador</TableHead>
                          <TableHead className="text-[10px]">Bacia</TableHead>
                          <TableHead className="text-[10px]">Tipo</TableHead>
                          <TableHead className="text-[10px]">Sucesso</TableHead>
                          <TableHead className="text-[10px]">Status</TableHead>
                          <TableHead className="text-[10px] text-right">Acção</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ANGOLAN_WELLS.map((well) => (
                          <TableRow
                            key={well.id}
                            className={`border-border/20 hover:bg-muted/30 transition-colors cursor-pointer ${selectedWell.id === well.id ? "bg-primary/5" : ""}`}
                            onClick={() => setSelectedWell(well)}
                          >
                            <TableCell className="font-medium text-xs text-foreground">{well.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{well.block}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{well.operator}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{well.basin.replace("Bacia ", "")}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px]">{well.type}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={well.successProb} className="h-1.5 w-14" />
                                <span className="text-[10px] font-mono text-muted-foreground">{well.successProb}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${
                                well.status === "Concluído" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : well.status === "Em análise" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border/50"
                              }`}>
                                {well.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="gap-1.5 text-[10px]">
                                <Eye className="w-3 h-3" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>

          <MobileBottomNav />
        </div>
      </div>
    </>
  );
}
