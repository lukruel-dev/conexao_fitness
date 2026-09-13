import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSvg } from './QRCodeSvg';
import {
  Wallet,
  Zap,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { formatBRL } from '@/lib/format';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface FinexDayPassQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance?: number;
}

export const FinexDayPassQrModal: React.FC<FinexDayPassQrModalProps> = ({
  open,
  onOpenChange,
  walletBalance = 0,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  if (!user) return null;

  const qrPayload = `CONEXAO_FITNESS_USER:${user.id}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success('ID Finex copiado!', { description: user.id });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md max-h-[85dvh] sm:max-h-[88vh] p-0 flex flex-col overflow-hidden bg-gradient-to-b from-card to-background border-border/80 rounded-3xl shadow-2xl my-auto">
        {/* Header fixo no topo com gradiente moderno */}
        <div className="relative shrink-0 p-4 sm:p-5 pr-10 bg-gradient-to-r from-emerald-500/20 via-primary/20 to-secondary/20 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Finex Day Pass
                </span>
              </div>
              <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                Treino Avulso Instantâneo
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Corpo rolável com scroll suave */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* Card de Usuário e Saldo da Carteira */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 bg-muted flex items-center justify-center shadow-inner">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-base text-foreground">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-foreground text-sm truncate">
                  {user.name}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Saldo na Carteira */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-semibold text-muted-foreground block">
                Saldo na Carteira
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-500 flex items-center justify-end gap-1">
                <Wallet className="w-3.5 h-3.5" />
                {formatBRL(walletBalance)}
              </span>
            </div>
          </div>

          {/* Área do QR Code */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 bg-card border-2 border-dashed border-emerald-500/40 rounded-3xl relative overflow-hidden group shadow-inner">
            {/* Linha animada de scanner */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80 animate-pulse" />

            <div className="relative p-2.5 bg-white rounded-2xl shadow-lg">
              <QRCodeSvg value={qrPayload} size={165} />
            </div>

            {/* Código Finex curto / ID */}
            <div className="mt-3.5 flex items-center gap-2 max-w-full">
              <span className="text-xs text-muted-foreground font-mono bg-muted/70 px-2.5 py-1.5 rounded-xl border border-border truncate max-w-[180px] sm:max-w-[210px]">
                {user.cpf ? `CPF: ${user.cpf}` : `ID: ${user.id.substring(0, 12)}...`}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1 shrink-0 rounded-xl"
                onClick={handleCopyCode}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar ID'}
              </Button>
            </div>

            {/* Relógio dinâmico */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Validação em tempo real: <strong className="text-foreground">{currentTime}</strong></span>
            </div>
          </div>

          {/* Alerta de Saldo Baixo com link para recarga */}
          {walletBalance < 20 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 text-xs">
              <div className="min-w-0">
                <strong className="text-amber-500 font-semibold block">Saldo baixo na carteira</strong>
                <span className="text-muted-foreground text-[11px] leading-tight block truncate">
                  Adicione saldo para liberação imediata na catraca.
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 shrink-0 rounded-xl gap-1 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
                <Link to="/carteira" onClick={() => onOpenChange(false)}>
                  <PlusCircle className="w-3.5 h-3.5" />
                  Recarregar
                </Link>
              </Button>
            </div>
          )}

          {/* Como funciona o Day Pass Finex */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Como funciona o Treino Avulso?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <li>Informe na recepção que deseja pagar o <strong>Day Pass com o Finex</strong>.</li>
              <li>Apresente este QR Code para leitura na câmera ou totem.</li>
              <li>O valor é <strong>descontado na hora do seu saldo</strong> e a catraca é liberada!</li>
            </ol>
          </div>
        </div>

        {/* Footer fixo na base com espaçamento seguro */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Acesso Seguro Finex</span>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 h-9 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
