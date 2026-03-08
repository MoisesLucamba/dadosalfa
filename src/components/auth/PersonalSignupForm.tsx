import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Briefcase, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompanySelector } from "./CompanySelector";
import { PredefinedCompany } from "@/hooks/useCompanies";
import { extractEmailDomain, validateCorporateEmail } from "@/data/companies";

const personalSignupSchema = z.object({
  contactName: z.string().min(2, "Nome é obrigatório").max(100),
  jobTitle: z.string().min(2, "Cargo é obrigatório").max(100),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  acceptTerms: z.boolean().refine(val => val === true, "Deve aceitar os termos"),
  acceptNda: z.boolean().refine(val => val === true, "Deve aceitar o NDA"),
});

type PersonalSignupForm = z.infer<typeof personalSignupSchema>;

interface PersonalSignupFormProps {
  onSubmit: (data: PersonalSignupForm & { companyId: string; companyName: string; emailDomain: string }) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function PersonalSignupForm({ onSubmit, isLoading, error }: PersonalSignupFormProps) {
  const { t } = useTranslation();
  const [selectedCompany, setSelectedCompany] = useState<PredefinedCompany | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<PersonalSignupForm>({
    resolver: zodResolver(personalSignupSchema),
    defaultValues: {
      acceptTerms: false,
      acceptNda: false,
    },
  });

  const watchEmail = watch("email");

  useEffect(() => {
    if (selectedCompany && watchEmail) {
      const isValid = validateCorporateEmail(watchEmail, selectedCompany.email_domain);
      if (!isValid && selectedCompany.email_domain !== 'other') {
        setEmailValidationError(
          t('auth.emailDomainMismatch', `O email deve terminar com @${selectedCompany.email_domain}`)
        );
      } else {
        setEmailValidationError(null);
      }
    } else {
      setEmailValidationError(null);
    }
  }, [watchEmail, selectedCompany, t]);

  const handleFormSubmit = async (data: PersonalSignupForm) => {
    if (!selectedCompany) return;
    if (emailValidationError) return;

    await onSubmit({
      ...data,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      emailDomain: selectedCompany.email_domain,
    });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Company Selection */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          {t('auth.selectYourCompany', 'Selecione a sua Empresa')} *
        </Label>
        <CompanySelector
          value={selectedCompany?.id || ""}
          onValueChange={setSelectedCompany}
        />
        {!selectedCompany && (
          <p className="text-xs text-muted-foreground">
            {t('auth.companyRequired', 'A sua empresa deve estar registada na plataforma')}
          </p>
        )}
      </motion.div>

      {/* Contact Name */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="contactName" className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          {t('auth.contactName')} *
        </Label>
        <Input
          id="contactName"
          {...register("contactName")}
          placeholder={t('auth.contactNamePlaceholder')}
          className="bg-background/50 border-border/50"
        />
        {errors.contactName && (
          <p className="text-xs text-destructive">{errors.contactName.message}</p>
        )}
      </motion.div>

      {/* Job Title */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="jobTitle" className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          {t('auth.contactRole')} *
        </Label>
        <Input
          id="jobTitle"
          {...register("jobTitle")}
          placeholder={t('auth.contactRolePlaceholder')}
          className="bg-background/50 border-border/50"
        />
        {errors.jobTitle && (
          <p className="text-xs text-destructive">{errors.jobTitle.message}</p>
        )}
      </motion.div>

      {/* Phone */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          {t('auth.contactPhone')}
        </Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder={t('auth.contactPhonePlaceholder')}
          className="bg-background/50 border-border/50"
        />
      </motion.div>

      {/* Corporate Email */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          {t('auth.corporateEmail')} *
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder={selectedCompany ? `seu.nome@${selectedCompany.email_domain}` : t('auth.corporateEmailPlaceholder')}
          className="bg-background/50 border-border/50"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
        {emailValidationError && (
          <p className="text-xs text-destructive">{emailValidationError}</p>
        )}
        {selectedCompany && !emailValidationError && (
          <p className="text-xs text-muted-foreground">
            {t('auth.emailMustMatch', `O email deve corresponder ao domínio da empresa: @${selectedCompany.email_domain}`)}
          </p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          {t('auth.createPassword')} *
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder="••••••••"
          className="bg-background/50 border-border/50"
        />
        <p className="text-xs text-muted-foreground">{t('auth.passwordMin')}</p>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </motion.div>

      {/* Terms & NDA — using Controller for Radix Checkbox */}
      <motion.div variants={itemVariants} className="space-y-4 pt-4 border-t border-border/30">
        <div className="flex items-start gap-3">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
            {t('auth.acceptTerms')}
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
        )}

        <div className="flex items-start gap-3">
          <Controller
            name="acceptNda"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptNda"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="acceptNda" className="text-sm leading-relaxed cursor-pointer">
            {t('auth.acceptNda')}
          </Label>
        </div>
        {errors.acceptNda && (
          <p className="text-xs text-destructive">{errors.acceptNda.message}</p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          disabled={isLoading || !selectedCompany || !!emailValidationError}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
        >
          {isLoading ? t('auth.submitting') : t('auth.submitRequest')}
        </Button>
      </motion.div>
    </form>
  );
}
