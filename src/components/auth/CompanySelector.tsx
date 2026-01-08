import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePredefinedCompanies, PredefinedCompany } from "@/hooks/useCompanies";
import { getSectorLabel, SectorType } from "@/data/companies";

interface CompanySelectorProps {
  value: string;
  onValueChange: (company: PredefinedCompany | null) => void;
  sectorFilter?: string;
}

export function CompanySelector({ value, onValueChange, sectorFilter }: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const { data: companies, isLoading } = usePredefinedCompanies();

  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    if (!sectorFilter || sectorFilter === 'all') return companies;
    return companies.filter(c => c.sector === sectorFilter);
  }, [companies, sectorFilter]);

  const groupedCompanies = useMemo(() => {
    const groups: Record<string, PredefinedCompany[]> = {};
    filteredCompanies.forEach(company => {
      const sector = company.sector;
      if (!groups[sector]) {
        groups[sector] = [];
      }
      groups[sector].push(company);
    });
    return groups;
  }, [filteredCompanies]);

  const selectedCompany = companies?.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background/50 border-border/50 hover:bg-background/80"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedCompany ? (
              <span className="truncate">{selectedCompany.name}</span>
            ) : (
              <span className="text-muted-foreground">
                {isLoading ? t('common.loading') : t('auth.selectCompany', 'Selecionar empresa...')}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('auth.searchCompany', 'Pesquisar empresa...')} />
          <CommandList>
            <CommandEmpty>{t('auth.noCompanyFound', 'Nenhuma empresa encontrada.')}</CommandEmpty>
            {Object.entries(groupedCompanies).map(([sector, sectorCompanies]) => (
              <CommandGroup 
                key={sector} 
                heading={getSectorLabel(sector as SectorType, i18n.language)}
              >
                {sectorCompanies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => {
                      onValueChange(company.id === value ? null : company);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === company.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{company.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {company.country} • @{company.email_domain}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
