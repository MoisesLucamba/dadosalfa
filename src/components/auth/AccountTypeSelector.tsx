import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountTypeSelectorProps {
  value: 'personal' | 'organization';
  onChange: (value: 'personal' | 'organization') => void;
}

export function AccountTypeSelector({ value, onChange }: AccountTypeSelectorProps) {
  const { t } = useTranslation();

  const options = [
    {
      id: 'personal' as const,
      icon: User,
      title: t('auth.personalAccount', 'Conta Pessoal'),
      description: t('auth.personalAccountDesc', 'Para funcionários de empresas registadas'),
    },
    {
      id: 'organization' as const,
      icon: Building2,
      title: t('auth.organizationAccount', 'Conta de Organização'),
      description: t('auth.organizationAccountDesc', 'Registar a sua empresa na plataforma'),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => (
        <motion.button
          key={option.id}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option.id)}
          className={cn(
            "relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
            value === option.id
              ? "border-primary bg-primary/5 shadow-lg"
              : "border-border/50 bg-background/50 hover:border-primary/50 hover:bg-background/80"
          )}
        >
          <div className={cn(
            "p-3 rounded-full",
            value === option.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <option.icon className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h4 className={cn(
              "font-semibold",
              value === option.id ? "text-foreground" : "text-muted-foreground"
            )}>
              {option.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {option.description}
            </p>
          </div>
          {value === option.id && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
              initial={false}
            >
              <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}
