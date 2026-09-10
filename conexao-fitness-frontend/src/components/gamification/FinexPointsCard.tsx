import React, { useState } from 'react';
import { Sparkles, Gift, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RedeemRewardsModal } from './RedeemRewardsModal';

interface FinexPointsCardProps {
  pointsBalance?: number;
  onRefresh?: () => void;
}

export const FinexPointsCard: React.FC<FinexPointsCardProps> = ({
  pointsBalance = 0,
  onRefresh,
}) => {
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/10 shadow-lg shadow-amber-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-bold flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-6 h-6 fill-current" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-base text-foreground">
                  Finex Points
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Clube de Recompensas
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acumule pontos em cada treino e troque por saldo ou cortesias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Seu Saldo</div>
              <div className="text-xl font-bold font-display text-amber-400">
                {pointsBalance} <span className="text-xs font-normal text-muted-foreground">pts</span>
              </div>
            </div>

            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsRedeemOpen(true)}
              className="gap-1.5 h-9 text-xs font-semibold shadow-md shadow-primary/20"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Resgatar</span>
            </Button>
          </div>
        </div>

        {/* Como Ganhar */}
        <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-bold text-foreground">+50 pts</div>
            <div className="text-muted-foreground text-[10px]">Por Check-in</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-bold text-foreground">+50 pts</div>
            <div className="text-muted-foreground text-[10px]">Por Treino Feito</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-bold text-foreground">+250 pts</div>
            <div className="text-muted-foreground text-[10px]">Por Matrícula</div>
          </div>
        </div>
      </div>

      <RedeemRewardsModal
        open={isRedeemOpen}
        onOpenChange={setIsRedeemOpen}
        pointsBalance={pointsBalance}
        onSuccess={onRefresh}
      />
    </>
  );
};
