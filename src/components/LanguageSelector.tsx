import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSelector({ className, variant = 'default' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('alphadata-language', langCode);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {languages.map((lang) => {
        const isActive = i18n.language === lang.code || 
          (i18n.language.startsWith(lang.code) && !languages.some(l => l.code === i18n.language));
        
        return (
          <motion.button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
              'hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50',
              isActive 
                ? 'bg-primary/15 text-primary border border-primary/30' 
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-xl">{lang.flag}</span>
            {variant === 'default' && (
              <span className={cn(
                'text-sm font-medium hidden sm:inline',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {lang.code.toUpperCase()}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeLanguage"
                className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
