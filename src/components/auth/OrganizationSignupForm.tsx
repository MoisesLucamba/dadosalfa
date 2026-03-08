import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, Building2, Phone, MapPin, FileText, Briefcase, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTORS, getSectorLabel, SectorType } from "@/data/companies";

const organizationSignupSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa é obrigatório").max(200),
  nif: z.string().min(5, "NIF é obrigatório").max(50),
  sector: z.string().min(1, "Setor é obrigatório"),
  country: z.string().min(2, "País é obrigatório").max(100),
  emailDomain: z.string().min(3, "Domínio de email é obrigatório").max(100),
  contactEmail: z.string().email("Email inválido").max(255),
  contactPhone: z.string().optional(),
  contactName: z.string().min(2, "Nome do responsável é obrigatório").max(100),
  contactRole: z.string().min(2, "Cargo é obrigatório").max(100),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  acceptTerms: z.boolean().refine(val => val === true, "Deve aceitar os termos"),
  acceptNda: z.boolean().refine(val => val === true, "Deve aceitar o NDA"),
});

type OrganizationSignupForm = z.infer<typeof organizationSignupSchema>;

interface OrganizationSignupFormProps {
  onSubmit: (data: OrganizationSignupForm) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export function OrganizationSignupForm({ onSubmit, isLoading, error }: OrganizationSignupFormProps) {
  const { t, i18n } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrganizationSignupForm>({
    resolver: zodResolver(organizationSignupSchema),
    defaultValues: {
      country: 'Angola',
    },
  });

  const handleFormSubmit = async (data: OrganizationSignupForm) => {
    await onSubmit(data);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const countries = [
    'Angola', 'South Africa', 'Mozambique', 'Namibia', 'Botswana', 'Zimbabwe',
    'Zambia', 'Malawi', 'Tanzania', 'Democratic Republic of Congo', 'Madagascar',
    'Mauritius', 'Seychelles', 'Eswatini', 'Lesotho', 'Comoros'
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Company Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          {t('auth.companyData')}
        </h3>

        {/* Company Name */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium">
            {t('auth.companyName')} *
          </Label>
          <Input
            id="companyName"
            {...register("companyName")}
            placeholder={t('auth.companyNamePlaceholder')}
            className="bg-background/50 border-border/50"
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName.message}</p>
          )}
        </motion.div>

        {/* NIF */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="nif" className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t('auth.taxId')} *
          </Label>
          <Input
            id="nif"
            {...register("nif")}
            placeholder={t('auth.taxIdPlaceholder')}
            className="bg-background/50 border-border/50"
          />
          {errors.nif && (
            <p className="text-xs text-destructive">{errors.nif.message}</p>
          )}
        </motion.div>

        {/* Sector */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label className="text-sm font-medium">
            {t('auth.companyType')} *
          </Label>
          <Select onValueChange={(value) => setValue("sector", value)}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder={t('auth.selectCompanyType')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SECTORS).map(([key]) => (
                <SelectItem key={key} value={key}>
                  {getSectorLabel(key as SectorType, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sector && (
            <p className="text-xs text-destructive">{errors.sector.message}</p>
          )}
        </motion.div>

        {/* Country */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {t('auth.country', 'País')} *
          </Label>
          <Select defaultValue="Angola" onValueChange={(value) => setValue("country", value)}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder={t('auth.selectCountry', 'Selecionar país')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
          )}
        </motion.div>

        {/* Email Domain */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="emailDomain" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t('auth.emailDomain', 'Domínio de Email Corporativo')} *
          </Label>
          <div className="flex items-center">
            <span className="px-3 py-2 bg-muted rounded-l-md border border-r-0 border-border/50 text-muted-foreground">
              @
            </span>
            <Input
              id="emailDomain"
              {...register("emailDomain")}
              placeholder="suaempresa.co.ao"
              className="bg-background/50 border-border/50 rounded-l-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('auth.emailDomainHelp', 'Ex: empresa.co.ao (funcionários usarão @empresa.co.ao)')}
          </p>
          {errors.emailDomain && (
            <p className="text-xs text-destructive">{errors.emailDomain.message}</p>
          )}
        </motion.div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Briefcase className="h-5 w-5 text-primary" />
          {t('auth.contactData')}
        </h3>

        {/* Contact Name */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="contactName" className="text-sm font-medium">
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

        {/* Contact Role */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="contactRole" className="text-sm font-medium">
            {t('auth.contactRole')} *
          </Label>
          <Input
            id="contactRole"
            {...register("contactRole")}
            placeholder={t('auth.contactRolePlaceholder')}
            className="bg-background/50 border-border/50"
          />
          {errors.contactRole && (
            <p className="text-xs text-destructive">{errors.contactRole.message}</p>
          )}
        </motion.div>

        {/* Contact Email */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="contactEmail" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t('auth.corporateEmail')} *
          </Label>
          <Input
            id="contactEmail"
            type="email"
            {...register("contactEmail")}
            placeholder={t('auth.corporateEmailPlaceholder')}
            className="bg-background/50 border-border/50"
          />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
          )}
        </motion.div>

        {/* Contact Phone */}
        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="contactPhone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            {t('auth.contactPhone')}
          </Label>
          <Input
            id="contactPhone"
            {...register("contactPhone")}
            placeholder={t('auth.contactPhonePlaceholder')}
            className="bg-background/50 border-border/50"
          />
        </motion.div>
      </div>

      {/* Password Section */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Lock className="h-5 w-5 text-primary" />
          {t('auth.accessData')}
        </h3>

        <motion.div variants={itemVariants} className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
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
      </div>

      {/* Terms & NDA */}
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
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold"
        >
          {isLoading ? t('auth.submitting') : t('auth.registerOrganization', 'Registar Organização')}
        </Button>
      </motion.div>

      <p className="text-xs text-muted-foreground text-center">
        {t('auth.organizationApprovalNote', 'O registo da organização requer aprovação. Será notificado por email.')}
      </p>
    </form>
  );
}
