import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDataSync } from '@/hooks/useDataSync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataSyncButtonProps {
  variant?: 'default' | 'compact';
  showDropdown?: boolean;
}

export const DataSyncButton = ({ variant = 'default', showDropdown = true }: DataSyncButtonProps) => {
  const { 
    isSyncing, 
    lastSync, 
    syncResults,
    syncAllData, 
    syncPrices, 
    syncProduction, 
    syncExports, 
    syncRisks 
  } = useDataSync();

  const formatLastSync = () => {
    if (!lastSync) return null;
    try {
      return format(new Date(lastSync), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const getSyncStatus = (key: string) => {
    if (!syncResults) return null;
    const result = syncResults[key as keyof typeof syncResults];
    if (result?.success) {
      return <Check className="h-3 w-3 text-green-500" />;
    } else if (result?.error) {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  if (!showDropdown) {
    return (
      <Button
        onClick={syncAllData}
        disabled={isSyncing}
        variant="outline"
        size={variant === 'compact' ? 'sm' : 'default'}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {variant === 'default' && (isSyncing ? 'Atualizando...' : 'Atualizar Dados')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isSyncing}
          variant="outline"
          size={variant === 'compact' ? 'sm' : 'default'}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {variant === 'default' && (isSyncing ? 'Atualizando...' : 'Atualizar Dados')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {lastSync ? (
            <>Última atualização: {formatLastSync()}</>
          ) : (
            'Dados em tempo real via IA'
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={syncAllData} disabled={isSyncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Atualizar Todos os Dados
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={syncPrices} disabled={isSyncing}>
          <span className="flex items-center gap-2">
            Preços do Petróleo
            {getSyncStatus('prices')}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={syncProduction} disabled={isSyncing}>
          <span className="flex items-center gap-2">
            Dados de Produção
            {getSyncStatus('production')}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={syncExports} disabled={isSyncing}>
          <span className="flex items-center gap-2">
            Exportações
            {getSyncStatus('exports')}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={syncRisks} disabled={isSyncing}>
          <span className="flex items-center gap-2">
            Análise de Riscos
            {getSyncStatus('risks')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
