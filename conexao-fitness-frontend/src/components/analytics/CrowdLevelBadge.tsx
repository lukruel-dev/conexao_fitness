import React from 'react';
import { Users, Clock, Flame } from 'lucide-react';
import type { GymCrowdStats } from '@/types/gymAnalytics';

interface CrowdLevelBadgeProps {
  stats?: GymCrowdStats | null;
  compact?: boolean;
}

export const CrowdLevelBadge: React.FC<CrowdLevelBadgeProps> = ({ stats, compact = false }) => {
  if (!stats) return null;

  const isLow = stats.currentLevel === 'BAIXA';
  const isHigh = stats.currentLevel === 'ALTA';

  const badgeColorClass = isLow
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : isHigh
    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

  const dotColorClass = isLow ? 'bg-emerald-500' : isHigh ? 'bg-rose-500' : 'bg-amber-500';

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColorClass}`}>
        <span className={`w-2 h-2 rounded-full animate-pulse ${dotColorClass}`} />
        <span>{stats.currentLevelLabel}</span>
      </span>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border ${badgeColorClass} bg-card/60 space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="font-semibold text-xs uppercase tracking-wider text-foreground">
            Lotação em Tempo Real
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColorClass}`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${dotColorClass}`} />
          {stats.currentLevelLabel}
        </span>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div>
          <div className="text-2xl font-bold font-display text-foreground">
            {stats.currentOccupancyPercent}%
          </div>
          <p className="text-[11px] text-muted-foreground">
            {stats.activeNowCount} pessoa(s) acessaram recentemente
          </p>
        </div>

        {stats.bestHours && stats.bestHours.length > 0 && (
          <div className="text-right text-xs">
            <span className="text-[11px] text-muted-foreground block">Horários mais calmos:</span>
            <span className="font-semibold text-emerald-400">
              {stats.bestHours.slice(0, 2).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Barra de Ocupação */}
      <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full transition-all duration-500 ${
            isLow ? 'bg-emerald-500' : isHigh ? 'bg-rose-500' : 'bg-amber-500'
          }`}
          style={{ width: `${stats.currentOccupancyPercent}%` }}
        />
      </div>
    </div>
  );
};
