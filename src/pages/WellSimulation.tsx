import { useState, useRef, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Cylinder, Sphere, Box, Text } from "@react-three/drei";
import {
  Upload,
  Brain,
  Activity,
  AlertTriangle,
  TrendingUp,
  Gauge,
  Layers,
  FileText,
  Save,
  Plus,
  Download,
  Eye,
  Cpu,
  Zap,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════
   3D WELL VISUALIZATION COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function WellStructure() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Surface platform */}
      <Box args={[3, 0.3, 3]} position={[0, 4, 0]}>
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Drill derrick */}
      <Cylinder args={[0.08, 0.08, 2.5]} position={[0, 5.5, 0]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Main wellbore - upper section */}
      <Cylinder args={[0.35, 0.35, 4]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </Cylinder>

      {/* Casing */}
      <Cylinder args={[0.25, 0.25, 4]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} transparent opacity={0.7} />
      </Cylinder>

      {/* Wellbore - mid section (deviated) */}
      <Cylinder args={[0.3, 0.28, 3.5]} position={[0.5, -1.5, 0]} rotation={[0, 0, 0.15]}>
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </Cylinder>

      {/* Deep section */}
      <Cylinder args={[0.25, 0.2, 3]} position={[1.2, -4.5, 0]} rotation={[0, 0, 0.2]}>
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.5} />
      </Cylinder>

      {/* Reservoir zone - high productivity */}
      <Sphere args={[1.2, 32, 32]} position={[1.8, -6.5, 0]}>
        <meshStandardMaterial color="#22c55e" transparent opacity={0.25} emissive="#22c55e" emissiveIntensity={0.3} />
      </Sphere>
      <Sphere args={[0.8, 32, 32]} position={[1.8, -6.5, 0]}>
        <meshStandardMaterial color="#16a34a" transparent opacity={0.4} emissive="#16a34a" emissiveIntensity={0.5} />
      </Sphere>

      {/* Fault zone - risk area */}
      <Box args={[0.05, 5, 3]} position={[-1, -3, 0]} rotation={[0, 0, 0.5]}>
        <meshStandardMaterial color="#ef4444" transparent opacity={0.5} emissive="#ef4444" emissiveIntensity={0.6} />
      </Box>

      {/* Risk zone indicator */}
      <Sphere args={[0.6, 16, 16]} position={[-0.5, -2, 0.5]}>
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.2} emissive="#f59e0b" emissiveIntensity={0.4} />
      </Sphere>

      {/* Geological layers */}
      {[0, -2, -4, -6, -8].map((y, i) => (
        <Box key={i} args={[8, 0.05, 8]} position={[0, y, 0]}>
          <meshStandardMaterial
            color={["#1e293b", "#334155", "#1e293b", "#334155", "#1e293b"][i]}
            transparent
            opacity={0.3}
          />
        </Box>
      ))}

      {/* Perforation zones */}
      {[-5.5, -6, -6.5, -7].map((y, i) => (
        <Sphere key={`perf-${i}`} args={[0.08, 8, 8]} position={[1.5 + Math.sin(i) * 0.3, y, Math.cos(i) * 0.3]}>
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
        </Sphere>
      ))}
    </group>
  );
}

function Scene3D() {
  return (
    <Canvas camera={{ position: [8, 3, 8], fov: 50 }} className="rounded-xl">
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[1.8, -6.5, 0]} intensity={2} color="#22c55e" distance={6} />
      <pointLight position={[-0.5, -2, 0.5]} intensity={1.5} color="#f59e0b" distance={4} />
      <fog attach="fog" args={["#030712", 15, 35]} />
      <Suspense fallback={null}>
        <WellStructure />
      </Suspense>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={false}
        maxDistance={25}
        minDistance={5}
      />
      <gridHelper args={[20, 20, "#1e293b", "#0f172a"]} position={[0, -9, 0]} />
    </Canvas>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════ */

const productionData = [
  { month: "Jan", producao: 2400, capacidade: 3200 },
  { month: "Fev", producao: 2800, capacidade: 3200 },
  { month: "Mar", producao: 3100, capacidade: 3500 },
  { month: "Abr", producao: 2950, capacidade: 3500 },
  { month: "Mai", producao: 3400, capacidade: 3800 },
  { month: "Jun", producao: 3600, capacidade: 3800 },
];

const riskData = [
  { category: "Geológico", valor: 35 },
  { category: "Estrutural", valor: 62 },
  { category: "Operacional", valor: 28 },
  { category: "Ambiental", valor: 45 },
  { category: "Financeiro", valor: 20 },
];

const simulationHistory = [
  { id: 1, nome: "Bloco 15 - Poço A3", data: "2026-02-28", tipo: "Exploração", status: "Concluído", sucesso: 78 },
  { id: 2, nome: "Bloco 17 - Reservatório B", data: "2026-02-25", tipo: "Desenvolvimento", status: "Em análise", sucesso: 65 },
  { id: 3, nome: "Bloco 31 - Poço D1", data: "2026-02-20", tipo: "Avaliação", status: "Concluído", sucesso: 82 },
  { id: 4, nome: "Bloco 14 - Poço E7", data: "2026-02-15", tipo: "Exploração", status: "Concluído", sucesso: 91 },
  { id: 5, nome: "Bloco 18 - Reservatório C", data: "2026-02-10", tipo: "Desenvolvimento", status: "Pendente", sucesso: 54 },
];

/* ═══════════════════════════════════════════════════════════════════
   CHART TOOLTIP
   ═══════════════════════════════════════════════════════════════════ */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value?.toLocaleString()}</span>
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

  const handleProcess = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  const handleUpload = (type: string) => {
    setUploadedFiles((prev) => [...prev, type]);
  };

  return (
    <>
      <Helmet>
        <title>Visão Computacional – Simulação de Poços | AlphaData</title>
        <meta name="description" content="Simulação inteligente e visualização 3D de poços com apoio de IA" />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        <Sidebar activeItem="/well-simulation" isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <Header activeItem="/well-simulation" />

          <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 overflow-auto">
            {/* ─── PAGE HEADER ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Cpu className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      <Zap className="w-3 h-3 mr-1" /> Deep Tech
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                    Simulação Inteligente de Poços
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    Análise visual avançada com apoio de Inteligência Artificial
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

            {/* ─── UPLOAD SECTION ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-border/50 card-gradient">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Dados Sísmicos", icon: Activity, type: "seismic" },
                      { label: "Imagens Geológicas", icon: Layers, type: "geological" },
                      { label: "Modelos 3D", icon: Target, type: "model3d" },
                    ].map((item) => {
                      const isUploaded = uploadedFiles.includes(item.type);
                      return (
                        <button
                          key={item.type}
                          onClick={() => handleUpload(item.type)}
                          className={`
                            flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all duration-200
                            ${isUploaded
                              ? "border-primary/50 bg-primary/5"
                              : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                            }
                          `}
                        >
                          {isUploaded ? (
                            <CheckCircle2 className="w-8 h-8 text-primary" />
                          ) : (
                            <item.icon className="w-8 h-8 text-muted-foreground" />
                          )}
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {isUploaded ? "Carregado" : "Clique para carregar"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleProcess}
                      disabled={processing || uploadedFiles.length === 0}
                      className="gap-2"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      {processing ? "A processar..." : "Processar com IA"}
                    </Button>
                    {processing && (
                      <div className="flex-1 flex items-center gap-3">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs font-mono text-muted-foreground w-10">{progress}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── 3D VISUALIZATION + ANALYSIS PANEL ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6"
            >
              {/* 3D Canvas */}
              <Card className="xl:col-span-3 border-border/50 card-gradient overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Visualização 3D do Poço
                    <Badge variant="outline" className="ml-2 text-xs">Interativo</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[450px] md:h-[520px] w-full bg-[#030712] rounded-b-xl">
                    <Scene3D />
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-6 p-4 border-t border-border/30 flex-wrap">
                    {[
                      { color: "#22c55e", label: "Alta Produtividade" },
                      { color: "#ef4444", label: "Falha Estrutural" },
                      { color: "#f59e0b", label: "Zona de Risco" },
                      { color: "#3b82f6", label: "Perfurações" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Panel */}
              <div className="space-y-4">
                {/* KPI Cards */}
                {[
                  { label: "Prob. de Sucesso", value: "78%", icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Nível de Risco", value: "Médio", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Profundidade Est.", value: "3.450m", icon: Gauge, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Potencial Produtivo", value: "12.5k bbl/d", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <Card className="border-border/50 card-gradient">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${kpi.bg}`}>
                            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                            <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* AI Model Status */}
                <Card className="border-border/50 card-gradient">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Modelo IA</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          Ativo
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Precisão</span>
                        <span className="text-xs font-semibold text-foreground">94.2%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Última treino</span>
                        <span className="text-xs text-muted-foreground">há 2h</span>
                      </div>
                      <Progress value={94} className="h-1.5 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* ─── CHARTS SECTION ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              {/* Production Potential Chart */}
              <Card className="border-border/50 card-gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Potencial Produtivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={productionData}>
                        <defs>
                          <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="capacidade" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.5} fill="none" name="Capacidade" />
                        <Area type="monotone" dataKey="producao" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#prodGrad)" name="Produção" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis Chart */}
              <Card className="border-border/50 card-gradient">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Análise de Riscos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={85} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="valor" name="Risco (%)" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── SIMULATION HISTORY ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="border-border/50 card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Histórico de Simulações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30">
                          <TableHead className="text-xs">Projeto</TableHead>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Tipo</TableHead>
                          <TableHead className="text-xs">Sucesso</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Acção</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulationHistory.map((sim) => (
                          <TableRow key={sim.id} className="border-border/20 hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-sm text-foreground">{sim.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{sim.data}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{sim.tipo}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={sim.sucesso} className="h-1.5 w-16" />
                                <span className="text-xs font-mono text-muted-foreground">{sim.sucesso}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-xs ${
                                  sim.status === "Concluído"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : sim.status === "Em análise"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-muted text-muted-foreground border-border/50"
                                }`}
                              >
                                {sim.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                                <Eye className="w-3.5 h-3.5" /> Visualizar
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
