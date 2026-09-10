import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGamificationSummary } from '@/services/gamification';
import { useAuth } from '@/contexts/AuthContext';

interface UserPinBadgeProps {
  pinEmoji?: string | null;
  badgeTitle?: string | null;
  userId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export const UserPinBadge: React.FC<UserPinBadgeProps> = ({
  pinEmoji,
  badgeTitle,
  userId,
  size = 'sm',
  showTitle = false,
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data } = useQuery({
    queryKey: ['gamification-summary', targetUserId],
    queryFn: fetchGamificationSummary,
    staleTime: 1000 * 60 * 5, // 5 min
    enabled: !pinEmoji && !!targetUserId,
  });

  const activePin =
    pinEmoji ||
    data?.equippedBadge?.pinEmoji ||
    data?.gamification?.equippedPinEmoji ||
    localStorage.getItem('cf_equipped_pin') ||
    '🏋️';

  const activeTitle =
    badgeTitle ||
    data?.badges?.find((b) => b.code === data?.equippedBadge?.code)?.title ||
    'Primeiro Passo';

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <span
      className="inline-flex items-center gap-1 shrink-0 cursor-default select-none transition-transform hover:scale-110"
      title={`Pin de Conquista: ${activeTitle}`}
    >
      <span className={sizeClasses[size]}>{activePin}</span>
      {showTitle && (
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
          {activeTitle}
        </span>
      )}
    </span>
  );
};

export default UserPinBadge;
