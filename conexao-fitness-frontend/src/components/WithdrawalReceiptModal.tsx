import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, ArrowDownRight, ShieldCheck, Building2, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { WalletWithdrawal } from "@/services/wallet";

interface WithdrawalReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawal: WalletWithdrawal | null;
}

export function WithdrawalReceiptModal({
  open,
  onOpenChange,
  withdrawal,
}: WithdrawalReceiptModalProps) {
  if (!withdrawal) return null;

  const copyProtocol = () => {
    navigator.clipboard.writeText(withdrawal.transferProtocol);
    toast.success("Protocolo PIX copiado!");
  };

  const formattedDate = new Date(withdrawal.createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl p-6 rounded-3xl">
        <DialogHeader className="text-center sm:text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-500 shadow-inner">
            <CheckCircle2 className="w-9 h-9 animate-in zoom-in-50 duration-300" />
          </div>
          <DialogTitle className="text-2xl font-bold font-display text-foreground">
            Saque Solicitado com Sucesso!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            A transferência via PIX foi autorizada e enviada para o processamento bancário instantâneo.
          </DialogDescription>
        </DialogHeader>

        {/* Card do Comprovante */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-4 my-2 space-y-3.5">
          <div className="flex justify-between items-center pb-3 border-b border-border/40">
            <span className="text-xs text-muted-foreground font-medium">Valor do Saque</span>
            <span className="text-2xl font-bold font-display text-emerald-500">
              R$ {Number(withdrawal.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Tipo de Chave
              </span>
              <span className="font-semibold text-foreground">{withdrawal.pixKeyType}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chave PIX</span>
              <span className="font-mono font-medium text-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/50 text-[11px]">
                {withdrawal.pixKey}
              </span>
            </div>

            {withdrawal.holderName && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Titular da Conta</span>
                <span className="font-medium text-foreground">{withdrawal.holderName}</span>
              </div>
            )}

            {withdrawal.bankName && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" /> Instituição
                </span>
                <span className="font-medium text-foreground">{withdrawal.bankName}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Data & Hora
              </span>
              <span className="text-muted-foreground">{formattedDate}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tarifa Conexão Fitness</span>
              <span className="font-bold text-emerald-500">R$ 0,00 (Grátis)</span>
            </div>
          </div>

          {/* Protocolo */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between bg-card/60 p-2.5 rounded-xl border border-border/40">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Protocolo PIX</p>
                <p className="font-mono text-xs font-bold text-foreground truncate">{withdrawal.transferProtocol}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyProtocol}
              className="h-8 px-2 text-xs gap-1 hover:bg-primary/10 text-primary shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </Button>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="hero"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl font-bold py-2.5"
          >
            Entendido, Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
