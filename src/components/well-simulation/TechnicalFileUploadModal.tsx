import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, CheckCircle2, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const FORMATS = [
  { label: "SEG-Y", desc: "Sísmico" },
  { label: "LAS / DLIS", desc: "Perfis" },
  { label: "ECLIPSE", desc: "Modelos" },
  { label: "CSV", desc: "Produção" },
];

export function TechnicalFileUploadModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setDone(false);
    setUploading(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(iv);
          setUploading(false);
          setDone(true);
          return 100;
        }
        return p + 2;
      });
    }, 40);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const reset = () => { setFile(null); setUploading(false); setProgress(0); setDone(false); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md bg-[#030d20] border-[#0a2040]">
        <DialogHeader>
          <DialogTitle className="font-mono text-[#b4d4f4] text-sm">Importar Ficheiros Técnicos</DialogTitle>
        </DialogHeader>

        {/* Format chips */}
        <div className="flex gap-2 flex-wrap mb-3">
          {FORMATS.map(f => (
            <span key={f.label} className="text-[8px] font-mono px-2 py-1 rounded-full border border-[#0a2040] text-[#4a8ab4] bg-[#0a1830]">
              {f.label} <span className="text-[#2a5272]">({f.desc})</span>
            </span>
          ))}
        </div>

        {/* Drop zone */}
        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-[#0a2040] rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#00a8ff]/30 transition-colors bg-[#020913]"
          >
            <Upload className="w-8 h-8 text-[#3a6a8a]" />
            <p className="text-[10px] text-[#6a9ec4] font-mono text-center">Arraste ficheiros ou clique para selecionar</p>
            <p className="text-[8px] text-[#2a5272] font-mono">Máx. 500MB por ficheiro</p>
          </div>
        ) : (
          <div className="border border-[#0a2040] rounded-xl p-4 bg-[#020913]">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-[#00a8ff]" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#b4d4f4] font-mono truncate">{file.name}</p>
                <p className="text-[8px] text-[#2a5272] font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            {uploading && (
              <div>
                <Progress value={progress} className="h-1.5 bg-[#0a1830]" />
                <p className="text-[8px] text-[#3a6a8a] font-mono mt-1.5">
                  {progress < 50 ? "A processar com IA..." : "A integrar dados..."}
                </p>
              </div>
            )}

            <AnimatePresence>
              {done && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00e5a0]" />
                  <span className="text-[10px] text-[#00e5a0] font-mono">Dados integrados com sucesso ✓</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".sgy,.segy,.las,.dlis,.csv,.dat,.ecl"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </DialogContent>
    </Dialog>
  );
}
