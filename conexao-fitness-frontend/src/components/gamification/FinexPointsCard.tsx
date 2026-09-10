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
                  Finex Points & Recompensas
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Clube de Vantagens
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Treine, acumule pontos e desbloqueie <strong>1 Day Pass/mês para amigo</strong> e a <strong>Caixa Misteriosa com brindes oficiais</strong>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Seus Pontos</div>
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
              <span>Ver Recompensas</span>
            </Button>
          </div>
        </div>

        {/* Badges de Recompensas */}
        <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
            <div className="font-bold text-foreground">🎟️ Day Pass Amigo</div>
            <div className="text-muted-foreground text-[10px]">1x por mês (300 pts)</div>
          </div>
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
            <div className="font-bold text-foreground">🎁 Caixa Misteriosa</div>
            <div className="text-muted-foreground text-[10px]">Brindes do Mês (1.000 pts)</div>
          </div>
          <div className="p-2 rounded-xl bg-muted/40 border border-border/50">
            <div className="font-bold text-foreground">🔥 Ganhe Pontos</div>
            <div className="text-muted-foreground text-[10px]">+50 pts por treino</div>
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
