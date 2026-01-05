import { motion } from "framer-motion";
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Calendar,
  Flame,
  MapPin
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GeopoliticalForecastData {
  region: string;
  situation: string;
  impact_on_oil: string;
  prediction_30d: string;
  prediction_90d: string;
  risk_level: string;
  key_indicators: string[];
}

interface GeopoliticalForecastProps {
  forecasts: GeopoliticalForecastData[];
  loading: boolean;
}

const getRegionIcon = (region: string) => {
  if (region.toLowerCase().includes('venezuela')) return "🇻🇪";
  if (region.toLowerCase().includes('médio') || region.toLowerCase().includes('oriente')) return "🔥";
  if (region.toLowerCase().includes('nigéria') || region.toLowerCase().includes('nigeria')) return "🇳🇬";
  if (region.toLowerCase().includes('angola')) return "🇦🇴";
  if (region.toLowerCase().includes('opep') || region.toLowerCase().includes('opec')) return "🛢️";
  if (region.toLowerCase().includes('irão') || region.toLowerCase().includes('iran')) return "🇮🇷";
  return "🌍";
};

const getRiskLevelStyle = (level: string) => {
  switch (level) {
    case 'critical':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'high':
      return 'bg-accent/20 text-accent border-accent/30';
    case 'medium':
      return 'bg-primary/20 text-primary border-primary/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getRiskLevelLabel = (level: string) => {
  switch (level) {
    case 'critical': return 'Crítico';
    case 'high': return 'Alto';
    case 'medium': return 'Médio';
    default: return 'Baixo';
  }
};

export const GeopoliticalForecast = ({ forecasts, loading }: GeopoliticalForecastProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 p-6 card-gradient">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 p-6 card-gradient">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Previsões Geopolíticas</h3>
            <p className="text-sm text-muted-foreground">Análise de cenários globais</p>
          </div>
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Clique em "Atualizar Riscos" para gerar previsões geopolíticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 p-6 card-gradient">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-destructive" />
            Previsões Geopolíticas
          </h3>
          <p className="text-sm text-muted-foreground">Análise em tempo real de eventos globais que afetam o mercado petrolífero</p>
        </div>
        <Globe className="w-5 h-5 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {forecasts.map((forecast, index) => (
          <motion.div
            key={forecast.region}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-xl border p-5 bg-secondary/20 ${getRiskLevelStyle(forecast.risk_level).split(' ')[2]}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRegionIcon(forecast.region)}</span>
                <div>
                  <h4 className="font-semibold text-foreground">{forecast.region}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getRiskLevelStyle(forecast.risk_level)}`}>
                    {forecast.risk_level === 'critical' && <AlertTriangle className="w-3 h-3" />}
                    {getRiskLevelLabel(forecast.risk_level)}
                  </span>
                </div>
              </div>
            </div>

            {/* Situation */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {forecast.situation}
              </p>
            </div>

            {/* Impact on Oil */}
            <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent">Impacto no Petróleo</span>
              </div>
              <p className="text-sm text-foreground">{forecast.impact_on_oil}</p>
            </div>

            {/* Predictions */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">30 dias</span>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{forecast.prediction_30d}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1.5 min-w-[80px]">
                  <Calendar className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-accent">90 dias</span>
                </div>
                <p className="text-xs text-muted-foreground flex-1">{forecast.prediction_90d}</p>
              </div>
            </div>

            {/* Key Indicators */}
            {forecast.key_indicators && forecast.key_indicators.length > 0 && (
              <div className="pt-3 border-t border-border/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Indicadores-chave</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {forecast.key_indicators.map((indicator, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs rounded-full bg-background border border-border/50 text-muted-foreground"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
