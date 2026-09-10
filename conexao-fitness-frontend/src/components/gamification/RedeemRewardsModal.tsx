import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Wallet, Gift, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { redeemFinexPoints } from '@/services/gamification';
import { soundEffects } from '@/utils/audioAlerts';

interface RedeemRewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointsBalance: number;
  onSuccess?: () => void;
}

export const RedeemRewardsModal: React.FC<RedeemRewardsModalProps> = ({
  open,
  onOpenChange,
  pointsBalance = 0,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handleRedeemCash = async (pointsAmount: number) => {
    if (pointsBalance < pointsAmount) {
      toast.error(`Saldo insuficiente. Você possui ${pointsBalance} pontos.`);
      return;
    }

    try {
      setLoading(true);
      const res = await redeemFinexPoints('WALLET_CASH', pointsAmount);
      soundEffects.playSuccessChime();
      toast.success(res.message);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro no resgate', { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemDayPass = async () => {
    const DAYPASS_POINTS = 300;
    if (pointsBalance < DAYPASS_POINTS) {
      toast.error(`Saldo insuficiente. Um Day Pass requer ${DAYPASS_POINTS} pontos.`);
      return;
    }

    try {
      setLoading(true);
      const res = await redeemFinexPoints('DAY_PASS', DAYPASS_POINTS);
      soundEffects.playSuccessChime();
      toast.success(res.message);
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro no resgate', { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            Clube Finex Points
          </DialogTitle>
          <DialogDescription>
            Converta seus pontos acumulados em saldo real na carteira ou em passes de academia!
          </DialogDescription>
        </DialogHeader>

        {/* Saldo de Pontos */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between my-2">
          <div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">Seu Saldo Atual</div>
            <div className="text-2xl font-display font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 fill-current" />
              {pointsBalance} <span className="text-xs font-normal text-muted-foreground">pts</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground text-right">
            100 pts = <strong className="text-foreground">R$ 1,00</strong>
          </span>
        </div>

        {/* Opções de Resgate */}
        <div className="space-y-3 mt-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recompensas Disponíveis
          </h4>

          {/* Opção 1: R$ 5,00 na Carteira (500 pts) */}
          <div className="p-3.5 rounded-xl border border-border bg-card/70 hover:border-primary/50 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">R$ 5,00 na Carteira Finex</div>
                <div className="text-xs text-muted-foreground">Saldo imediato para pagar treinos ou serviços</div>
              </div>
            </div>

            <Button
              size="sm"
              disabled={loading || pointsBalance < 500}
              onClick={() => handleRedeemCash(500)}
              className="gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 text-xs font-semibold"
            >
              500 pts
            </Button>
          </div>

          {/* Opção 2: R$ 10,00 na Carteira (1000 pts) */}
          <div className="p-3.5 rounded-xl border border-border bg-card/70 hover:border-primary/50 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">R$ 10,00 na Carteira Finex</div>
                <div className="text-xs text-muted-foreground">Saldo para uso livre no app</div>
              </div>
            </div>

            <Button
              size="sm"
              disabled={loading || pointsBalance < 1000}
              onClick={() => handleRedeemCash(1000)}
              className="gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 text-xs font-semibold"
            >
              1.000 pts
            </Button>
          </div>

          {/* Opção 3: Day Pass Cortesia (300 pts) */}
          <div className="p-3.5 rounded-xl border border-border bg-card/70 hover:border-primary/50 transition-all flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">1 Day Pass Cortesia</div>
                <div className="text-xs text-muted-foreground">Acesso avulso a qualquer academia parceira</div>
              </div>
            </div>

            <Button
              size="sm"
              variant="hero"
              disabled={loading || pointsBalance < 300}
              onClick={handleRedeemDayPass}
              className="gap-1 shrink-0 text-xs font-semibold"
            >
              300 pts
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
