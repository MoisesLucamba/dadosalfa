import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function TwoFactorSetup() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pending, setPending] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");

  const loadFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) toast.error("Erro a carregar factores: " + error.message);
    else setFactors((data?.totp || []) as Factor[]);
    setLoading(false);
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    setEnrolling(false);
    if (error) {
      toast.error("Erro ao iniciar 2FA: " + error.message);
      return;
    }
    setPending({
      id: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const verifyAndActivate = async () => {
    if (!pending || code.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: pending.id,
    });
    if (challengeError) {
      setVerifying(false);
      toast.error("Erro no challenge: " + challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pending.id,
      challengeId: challenge.id,
      code,
    });
    setVerifying(false);
    if (verifyError) {
      toast.error("Código inválido. Tente novamente.");
      return;
    }
    toast.success("2FA activado com sucesso");
    setPending(null);
    setCode("");
    loadFactors();
  };

  const cancelEnroll = async () => {
    if (pending) {
      await supabase.auth.mfa.unenroll({ factorId: pending.id });
    }
    setPending(null);
    setCode("");
  };

  const removeFactor = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) toast.error("Erro ao remover: " + error.message);
    else {
      toast.success("2FA removido");
      loadFactors();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> A CARREGAR...
      </div>
    );
  }

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  if (pending) {
    return (
      <div className="space-y-4 rounded border border-white/10 bg-black/30 p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-red-400">
          <Smartphone className="w-3 h-3" /> CONFIGURAR APLICAÇÃO AUTENTICADORA
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          1. Abra Google Authenticator, Authy ou 1Password.
          <br />
          2. Escaneie o QR code abaixo (ou introduza a chave manualmente).
          <br />
          3. Digite o código de 6 dígitos para confirmar.
        </p>
        <div className="flex flex-col items-center gap-3 rounded bg-white p-3">
          <img src={pending.qr} alt="QR Code 2FA" className="w-40 h-40" />
        </div>
        <div className="rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-muted-foreground">
          CHAVE: <span className="text-foreground">{pending.secret}</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelEnroll}
              className="flex-1 text-[10px] tracking-widest"
            >
              CANCELAR
            </Button>
            <Button
              size="sm"
              onClick={verifyAndActivate}
              disabled={code.length !== 6 || verifying}
              className="flex-1 text-[10px] tracking-widest"
            >
              {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : "ACTIVAR 2FA"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verifiedFactors.length > 0) {
    return (
      <div className="space-y-2">
        {verifiedFactors.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] font-bold tracking-widest text-emerald-400">
                  2FA ACTIVO
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {f.friendly_name || "Authenticator App"}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeFactor(f.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" /> REMOVER
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Button
      onClick={startEnroll}
      disabled={enrolling}
      size="sm"
      className="text-[10px] tracking-widest"
    >
      {enrolling ? (
        <Loader2 className="w-3 h-3 animate-spin mr-2" />
      ) : (
        <Smartphone className="w-3 h-3 mr-2" />
      )}
      ACTIVAR 2FA (TOTP)
    </Button>
  );
}
