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
  ArrowRight,
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
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-card to-background border-border/80 rounded-3xl shadow-2xl">
        {/* Header com gradiente moderno */}
        <div className="relative p-6 pb-4 bg-gradient-to-r from-emerald-500/20 via-primary/20 to-secondary/20 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Finex Day Pass
                  </span>
                </div>
                <DialogTitle className="font-display text-lg font-bold text-foreground">
                  Treino Avulso Instantâneo
                </DialogTitle>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">
          {/* Card de Usuário e Saldo da Carteira */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 bg-muted flex items-center justify-center shadow-inner">
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
              <span className="text-base font-bold text-emerald-500 flex items-center justify-end gap-1">
                <Wallet className="w-3.5 h-3.5" />
                {formatBRL(walletBalance)}
              </span>
            </div>
          </div>

          {/* Área do QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-card border-2 border-dashed border-emerald-500/40 rounded-3xl relative overflow-hidden group shadow-inner">
            {/* Linha animada de scanner */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80 animate-pulse" />

            <div className="relative p-3 bg-white rounded-2xl shadow-xl">
              <QRCodeSvg value={qrPayload} size={185} />
            </div>

            {/* Código Finex curto / ID */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono bg-muted/70 px-3 py-1.5 rounded-xl border border-border truncate max-w-[200px]">
                {user.cpf ? `CPF: ${user.cpf}` : `ID: ${user.id.substring(0, 12)}...`}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1"
                onClick={handleCopyCode}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar ID'}
              </Button>
            </div>

            {/* Relógio dinâmico */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Validação em tempo real: <strong className="text-foreground">{currentTime}</strong></span>
            </div>
          </div>

          {/* Alerta de Saldo Baixo com link para recarga */}
          {walletBalance < 20 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-amber-500 font-semibold block">Saldo baixo na carteira</strong>
                <span className="text-muted-foreground">Adicione saldo antes de ir treinar para liberação imediata.</span>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 shrink-0 rounded-xl gap-1 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10">
                <Link to="/carteira">
                  <PlusCircle className="w-3.5 h-3.5" />
                  Recarregar
                </Link>
              </Button>
            </div>
          )}

          {/* Como funciona o Day Pass Finex */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Como funciona o Treino Avulso?
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11.5px] leading-relaxed">
              <li>Informe na recepção da academia que deseja pagar o <strong>Day Pass com o Finex</strong>.</li>
              <li>Apresente este QR Code para o balconista ler com a câmera.</li>
              <li>O valor do Day Pass é <strong>descontado na hora do seu saldo</strong> e seu acesso é liberado sem burocracia ou cadastro prévio na academia!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            <Link to="/carteira">
              <Wallet className="w-3.5 h-3.5 mr-1" />
              Minha Carteira
            </Link>
          </Button>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
