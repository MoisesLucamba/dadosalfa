import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, FileSpreadsheet, FileType, Download, Globe } from "lucide-react";
import { DOCUMENT_LANGUAGES, DocumentLanguageCode } from "@/i18n";

interface LanguageDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (format: 'pdf' | 'docx' | 'excel', language: DocumentLanguageCode) => void;
  reportTitle: string;
  isDownloading?: boolean;
}

export function LanguageDownloadDialog({
  open,
  onOpenChange,
  onDownload,
  reportTitle,
  isDownloading = false,
}: LanguageDownloadDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'excel'>('pdf');
  const [selectedLanguage, setSelectedLanguage] = useState<DocumentLanguageCode>('pt');

  const formats = [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Formato universal para visualização' },
    { value: 'docx', label: 'Word (DOCX)', icon: FileType, description: 'Editável no Microsoft Word' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Dados em formato tabular' },
  ];

  const handleDownload = () => {
    onDownload(selectedFormat, selectedLanguage);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Descarregar Relatório
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha o formato e idioma do documento para "{reportTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">Formato do Documento</Label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value as 'pdf' | 'docx' | 'excel')}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
                    selectedFormat === format.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <format.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{format.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formats.find(f => f.value === selectedFormat)?.description}
            </p>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Idioma do Documento
            </Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as DocumentLanguageCode)}
            >
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_LANGUAGES).map(([code, lang]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {code === 'pt' ? '🇦🇴' : code === 'en' ? '🇬🇧' : '🇫🇷'}
                      </span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-primary hover:bg-primary/90"
          >
            {isDownloading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                A gerar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descarregar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
