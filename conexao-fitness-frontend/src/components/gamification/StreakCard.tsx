import React, { useState } from 'react';
import { Flame, Trophy, Award, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserGamification, Badge } from '@/types/gamification';
import { BadgesModal } from './BadgesModal';

interface StreakCardProps {
  gamification?: UserGamification;
  badges?: Badge[];
  onRefresh?: () => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({ gamification, badges = [] }) => {
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);

  const streak = gamification?.currentStreak || 0;
  const totalWorkouts = gamification?.totalWorkouts || 0;
  const points = gamification?.pointsBalance || 0;
  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl p-5 border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 shadow-lg shadow-primary/5 transition-all hover:border-primary/50">
        {/* Glow de fundo */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Contador de Streak */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 shrink-0">
              <Flame className="w-8 h-8 animate-pulse text-white fill-white" />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-black/80 text-[10px] font-bold border border-orange-400/50">
                {streak}d
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-foreground tracking-tight">
                  {streak > 0 ? `${streak} Dias Seguidos!` : 'Comece seu Streak Hoje!'}
                </h3>
                {streak >= 3 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> Foco Total
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streak > 0
                  ? 'Continue treinando para manter o fogo aceso e multiplicar seus pontos.'
                  : 'Faça check-in ou conclua um treino para iniciar sua sequência.'}
              </p>
            </div>
          </div>

          {/* Estatísticas Rápidas & Botão de Conquistas */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
            <div className="flex items-center gap-4 text-left">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">Treinos</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary" /> {totalWorkouts}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-semibold">Finex Points</div>
                <div className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> {points}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBadgesOpen(true)}
              className="gap-1.5 h-9 text-xs border-primary/40 hover:bg-primary/10 font-semibold shadow-sm ml-2"
            >
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span>Conquistas ({unlockedBadgesCount}/{badges.length || 7})</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <BadgesModal
        open={isBadgesOpen}
        onOpenChange={setIsBadgesOpen}
        badges={badges}
        streak={streak}
      />
    </>
  );
};
