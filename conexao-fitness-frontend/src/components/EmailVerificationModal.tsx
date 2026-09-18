import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, CheckCircle2, RefreshCw, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { verifyEmail, resendVerificationCode } from "@/services/auth";
import type { AuthUser } from "@/types/api";

interface EmailVerificationModalProps {
  isOpen: boolean;
  email: string;
  onSuccess: (user: AuthUser) => void;
  onClose?: () => void;
  onChangeEmail?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  email,
  onSuccess,
  onClose,
  onChangeEmail,
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reiniciar estado e foco ao abrir
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setErrorMessage(null);
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Contador para reenvio
  useEffect(() => {
    if (!isOpen) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, isOpen]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Se digitou ou colou apenas um número
    const char = clean.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-avanço para o próximo input
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Se completou todos os 6 dígitos, dispara a validação
    const completeCode = newDigits.join("");
    if (completeCode.length === 6) {
      submitCode(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setErrorMessage(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      submitCode(pasted);
    }
  };

  const submitCode = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join("");
    if (code.length < 6) {
      setErrorMessage("Por favor, digite os 6 dígitos do código.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyEmail({ email, code });
      toast.success("E-mail verificado com sucesso!", {
        description: "Sua conta está ativa e pronta para uso.",
      });
      onSuccess(res.user);
    } catch (err: any) {
      const msg = err?.message || "Código incorreto ou expirado. Tente novamente.";
      setErrorMessage(msg);
      toast.error("Erro na verificação", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setErrorMessage(null);

    try {
      await resendVerificationCode(email);
      toast.success("Novo código enviado!", {
        description: `Verifique a caixa de entrada de ${email}`,
      });
      setCountdown(60);
      setCanResend(false);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error("Falha ao reenviar", {
        description: err?.message || "Aguarde antes de solicitar outro código.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && onClose) onClose(); }}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm relative">
            <Mail className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-bold">
              ✓
            </span>
          </div>

          <DialogTitle className="text-xl font-bold font-display tracking-tight text-foreground">
            Confirme seu e-mail
          </DialogTitle>
          
          <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-sm">
            Enviamos um código de segurança de 6 dígitos para:
            <span className="block mt-1 font-semibold text-foreground break-all">
              {email}
            </span>
          </DialogDescription>
        </div>

        {/* 6-Digit OTP Inputs */}
        <div className="my-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-background transition-all outline-none ${
                  digit
                    ? "border-primary text-primary ring-2 ring-primary/20 shadow-sm"
                    : "border-border text-foreground hover:border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20"
                } ${errorMessage ? "border-destructive/80 ring-destructive/20" : ""}`}
                disabled={loading}
              />
            ))}
          </div>

          {errorMessage && (
            <div className="mt-3.5 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 justify-center animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="hero"
            className="w-full h-12 text-base font-semibold shadow-md gap-2"
            disabled={loading || digits.some((d) => !d)}
            onClick={() => submitCode()}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Confirmar Conta
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 pt-1">
            <div>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary hover:underline font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  Reenviar código
                </button>
              ) : (
                <span>Reenviar código em <strong className="text-foreground font-mono">{countdown}s</strong></span>
              )}
            </div>

            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Corrigir e-mail
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationModal;
