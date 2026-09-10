import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Trophy,
  Flame,
  Zap,
  Award,
  Crown,
  Dumbbell,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import type { Badge } from '@/types/gamification';

interface BadgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges: Badge[];
  streak?: number;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  open,
  onOpenChange,
  badges = [],
  streak = 0,
}) => {
  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-6 h-6 text-orange-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'Trophy':
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 'Crown':
        return <Crown className="w-6 h-6 text-purple-400" />;
      case 'Award':
        return <Award className="w-6 h-6 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
      default:
        return <Dumbbell className="w-6 h-6 text-primary" />;
    }
  };

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-card border border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            Suas Conquistas & Medalhas
          </DialogTitle>
          <DialogDescription>
            Desbloqueie conquistas treinando com frequência e ganhe Finex Points para trocar por benefícios!
          </DialogDescription>
        </DialogHeader>

        {/* Barra de Progresso Geral */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex items-center justify-between text-xs my-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">
              {unlockedCount} de {badges.length} desbloqueadas
            </span>
          </div>
          <div className="font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" /> {streak}d de Streak
          </div>
        </div>

        {/* Lista de Conquistas */}
        <div className="space-y-3 mt-2">
          {badges.map((badge) => {
            const isUnlocked = badge.isUnlocked;

            return (
              <div
                key={badge.id || badge.code}
                className={`p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                  isUnlocked
                    ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card ring-1 ring-primary/20 shadow-sm'
                    : 'border-border/60 bg-muted/20 opacity-70 grayscale'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isUnlocked
                      ? 'bg-card border-primary/40 shadow-inner'
                      : 'bg-muted border-border/60 text-muted-foreground'
                  }`}
                >
                  {isUnlocked ? getBadgeIcon(badge.icon) : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-sm text-foreground truncate">
                      {badge.title}
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> +{badge.pointsReward} pts
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {badge.description}
                  </p>
                  {isUnlocked && badge.unlockedAt && (
                    <span className="text-[10px] text-primary font-medium mt-1 block">
                      Desbloqueada em {new Date(badge.unlockedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
