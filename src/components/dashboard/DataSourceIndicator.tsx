import { Info, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface DataSource {
  name: string;
  url?: string;
  type: 'official' | 'calculated' | 'cached';
  lastUpdate?: string;
}

interface DataSourceIndicatorProps {
  sources: DataSource[];
  compact?: boolean;
}

export const DataSourceIndicator = ({ sources, compact = false }: DataSourceIndicatorProps) => {
  const getTypeIcon = (type: DataSource['type']) => {
    switch (type) {
      case 'official':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'calculated':
        return <Info className="h-3 w-3 text-blue-500" />;
      case 'cached':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    }
  };

  const getTypeBadge = (type: DataSource['type']) => {
    switch (type) {
      case 'official':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">Oficial</Badge>;
      case 'calculated':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs">Calculado</Badge>;
      case 'cached':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs">Cache</Badge>;
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-3.5 w-3.5" />
              <span className="text-xs">Fontes</span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-sm">Fontes de Dados</p>
              {sources.map((source, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {getTypeIcon(source.type)}
                  <span>{source.name}</span>
                  {source.url && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Fontes de Dados Verificáveis</span>
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon(source.type)}
              <span className="text-sm">{source.name}</span>
              {source.url && (
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getTypeBadge(source.type)}
              {source.lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {source.lastUpdate}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
        Os dados são obtidos de fontes oficiais e verificáveis para garantir precisão nas decisões de negócio.
      </p>
    </div>
  );
};

// Predefined data sources
export const DATA_SOURCES = {
  prices: [
    { 
      name: 'Oil Price API (Real-time)', 
      url: 'https://www.oilpriceapi.com/', 
      type: 'official' as const 
    },
    { 
      name: 'EIA (U.S. Energy Information Administration)', 
      url: 'https://www.eia.gov/opendata/', 
      type: 'official' as const 
    },
    { 
      name: 'FRED (Federal Reserve Economic Data)', 
      url: 'https://fred.stlouisfed.org/', 
      type: 'official' as const 
    },
  ],
  production: [
    { 
      name: 'EIA International Energy Statistics', 
      url: 'https://www.eia.gov/international/data/world', 
      type: 'official' as const 
    },
    { 
      name: 'OPEC Monthly Oil Market Report', 
      url: 'https://www.opec.org/opec_web/en/publications/338.htm', 
      type: 'official' as const 
    },
    { 
      name: 'ANPG (Agência Nacional de Petróleo, Gás e Biocombustíveis)', 
      url: 'https://www.anpg.co.ao/', 
      type: 'official' as const 
    },
  ],
  exports: [
    { 
      name: 'UN Comtrade', 
      url: 'https://comtradeplus.un.org/', 
      type: 'official' as const 
    },
    { 
      name: 'EIA Petroleum Trade Data', 
      url: 'https://www.eia.gov/petroleum/imports/data/', 
      type: 'official' as const 
    },
  ],
  risks: [
    { 
      name: 'World Bank Governance Indicators', 
      url: 'https://info.worldbank.org/governance/wgi/', 
      type: 'official' as const 
    },
    { 
      name: 'IMF Country Reports', 
      url: 'https://www.imf.org/en/Countries/AGO', 
      type: 'official' as const 
    },
  ],
};
