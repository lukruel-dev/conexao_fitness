import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  Pin,
  Check,
  Package,
  Users,
} from 'lucide-react';
import type { Badge } from '@/types/gamification';
import { DEFAULT_BADGES_CATALOG, equipBadgePin } from '@/services/gamification';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { soundEffects } from '@/utils/audioAlerts';

interface BadgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges?: Badge[];
  streak?: number;
  equippedBadgeCode?: string | null;
  onBadgeEquipped?: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  open,
  onOpenChange,
  badges = [],
  streak = 0,
  equippedBadgeCode: initialEquippedCode,
  onBadgeEquipped,
}) => {
  const { user } = useAuth();
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  // Garantir que a lista de badges nunca esteja vazia
  const activeBadgesList: Badge[] =
    badges && badges.length > 0
      ? badges
      : DEFAULT_BADGES_CATALOG.map((b) => ({
          ...b,
          isUnlocked: streak > 0 && (b.code === 'first_workout' || (b.code === 'streak_3' && streak >= 3)),
        }));

  const [currentEquippedCode, setCurrentEquippedCode] = useState<string | null>(
    initialEquippedCode || localStorage.getItem('cf_equipped_badge') || 'first_workout'
  );

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
      case 'Package':
        return <Package className="w-6 h-6 text-blue-400" />;
      case 'Users':
        return <Users className="w-6 h-6 text-pink-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
      default:
        return <Dumbbell className="w-6 h-6 text-primary" />;
    }
  };

  const handleEquip = async (badge: Badge) => {
    try {
      setLoadingCode(badge.code);
      const isAlreadyEquipped = currentEquippedCode === badge.code;
      const targetCode = isAlreadyEquipped ? null : badge.code;

      const res = await equipBadgePin(targetCode);
      soundEffects.playSuccessChime();
      setCurrentEquippedCode(targetCode);
      toast.success(res.message);
      onBadgeEquipped?.();
    } catch (err: any) {
      toast.error('Erro ao equipar Pin', { description: err?.message });
    } finally {
      setLoadingCode(null);
    }
  };

  const unlockedCount = activeBadgesList.filter((b) => b.isUnlocked).length;
  const activeBadgeObj = activeBadgesList.find((b) => b.code === currentEquippedCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-card border border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-2 bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold font-display">
            Suas Conquistas & Pins de Perfil
          </DialogTitle>
          <DialogDescription className="text-xs">
            Desbloqueie conquistas treinando e <strong>equipe seu Pin favorito</strong> ao lado do seu nome para exibir na comunidade Finex!
          </DialogDescription>
        </DialogHeader>

        {/* Pré-visualização do Nome com Pin */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-card border border-primary/30 flex items-center justify-between gap-3 my-1 shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
              Como seu nome aparece no app:
            </span>
            <div className="flex items-center gap-1.5 font-display font-bold text-sm text-foreground">
              <span>{user?.name || 'Seu Nome'}</span>
              <span className="text-base animate-bounce">{activeBadgeObj?.pinEmoji || '🏋️'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold font-sans">
                {activeBadgeObj?.title || 'Primeiro Passo'}
              </span>
            </div>
          </div>

          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xl shrink-0 shadow-inner">
            {activeBadgeObj?.pinEmoji || '🏋️'}
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/80 flex items-center justify-between text-xs my-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">
              {unlockedCount} de {activeBadgesList.length} desbloqueadas
            </span>
          </div>
          <div className="font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" /> {streak}d de Streak
          </div>
        </div>

        {/* Lista de Conquistas */}
        <div className="space-y-3 mt-2">
          {activeBadgesList.map((badge) => {
            const isUnlocked = badge.isUnlocked;
            const isEquipped = currentEquippedCode === badge.code;
            const emoji = badge.pinEmoji || '🏅';

            return (
              <div
                key={badge.id || badge.code}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEquipped
                    ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-card to-card ring-2 ring-amber-500/30 shadow-md'
                    : isUnlocked
                    ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-card to-card ring-1 ring-primary/20'
                    : 'border-border/60 bg-muted/20 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border relative ${
                      isUnlocked
                        ? 'bg-card border-primary/40 shadow-inner'
                        : 'bg-muted border-border/60 text-muted-foreground'
                    }`}
                  >
                    {isUnlocked ? (
                      <div className="text-2xl">{emoji}</div>
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}

                    {isEquipped && (
                      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-black text-[9px] font-black shadow">
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold text-sm text-foreground truncate">
                        {badge.title}
                      </h5>
                      <span className="text-sm shrink-0">{emoji}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                        +{badge.pointsReward} pts
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {badge.description}
                    </p>
                    {isUnlocked && (
                      <span className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Conquista Desbloqueada
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Equipar Pin */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 shrink-0">
                  {isUnlocked ? (
                    <Button
                      size="sm"
                      variant={isEquipped ? 'outline' : 'hero'}
                      disabled={loadingCode === badge.code}
                      onClick={() => handleEquip(badge)}
                      className={`h-8 text-xs font-semibold gap-1 rounded-xl px-3 ${
                        isEquipped
                          ? 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                          : 'shadow-md shadow-primary/20'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      {isEquipped ? 'Pin Ativo' : 'Usar no Nome'}
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Lock className="w-3 h-3" /> Bloqueado
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
