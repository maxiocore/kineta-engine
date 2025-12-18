import { Badge as BadgeType } from '@/hooks/useUserBadges';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UserPlus, 
  Medal, 
  Award, 
  Trophy, 
  Crown, 
  Gem, 
  Heart, 
  Zap, 
  Star,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface UserBadgeDisplayProps {
  badge: BadgeType;
  awarded?: boolean;
  awardedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  UserPlus,
  Medal,
  Award,
  Trophy,
  Crown,
  Gem,
  Heart,
  Zap,
  Star
};

const sizeMap = {
  sm: { icon: 16, container: 'w-8 h-8', text: 'text-xs' },
  md: { icon: 24, container: 'w-12 h-12', text: 'text-sm' },
  lg: { icon: 32, container: 'w-16 h-16', text: 'text-base' }
};

export const UserBadgeDisplay = ({ 
  badge, 
  awarded = true, 
  awardedAt,
  size = 'md',
  showTooltip = true
}: UserBadgeDisplayProps) => {
  const IconComponent = iconMap[badge.icon] || Star;
  const sizeConfig = sizeMap[size];

  const badgeContent = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`
        relative ${sizeConfig.container} rounded-full flex items-center justify-center
        ${awarded 
          ? 'bg-gradient-to-br from-white/20 to-white/5 shadow-lg' 
          : 'bg-muted/50 opacity-50'
        }
        transition-all duration-300 cursor-pointer
      `}
      style={{
        backgroundColor: awarded ? `${badge.color}20` : undefined,
        boxShadow: awarded ? `0 0 20px ${badge.color}40` : undefined
      }}
    >
      {!awarded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <IconComponent 
        size={sizeConfig.icon} 
        style={{ color: awarded ? badge.color : 'hsl(var(--muted-foreground))' }}
        className={awarded ? 'drop-shadow-md' : ''}
      />
    </motion.div>
  );

  if (!showTooltip) return badgeContent;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-bold" style={{ color: badge.color }}>{badge.name_ar}</p>
            <p className="text-xs text-muted-foreground">{badge.description_ar}</p>
            {awarded && awardedAt && (
              <p className="text-xs text-muted-foreground border-t border-border pt-1 mt-1">
                حصلت عليها: {format(new Date(awardedAt), 'dd MMMM yyyy', { locale: ar })}
              </p>
            )}
            {!awarded && (
              <div className="text-xs text-muted-foreground border-t border-border pt-1 mt-1">
                {badge.min_spending > 0 && <p>• إنفاق ${badge.min_spending} أو أكثر</p>}
                {badge.min_orders > 0 && <p>• {badge.min_orders} طلب أو أكثر</p>}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface UserBadgesGridProps {
  badges: BadgeType[];
  userBadges: Array<{ badge_id: string; awarded_at: string }>;
  showLocked?: boolean;
}

export const UserBadgesGrid = ({ badges, userBadges, showLocked = true }: UserBadgesGridProps) => {
  const userBadgeMap = new Map(userBadges.map(ub => [ub.badge_id, ub.awarded_at]));

  const displayBadges = showLocked 
    ? badges 
    : badges.filter(b => userBadgeMap.has(b.id));

  if (displayBadges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد شارات حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {displayBadges
        .sort((a, b) => {
          // Show earned badges first, then by tier
          const aEarned = userBadgeMap.has(a.id) ? 1 : 0;
          const bEarned = userBadgeMap.has(b.id) ? 1 : 0;
          if (aEarned !== bEarned) return bEarned - aEarned;
          return a.tier - b.tier;
        })
        .map((badge) => (
          <UserBadgeDisplay
            key={badge.id}
            badge={badge}
            awarded={userBadgeMap.has(badge.id)}
            awardedAt={userBadgeMap.get(badge.id)}
          />
        ))}
    </div>
  );
};

interface BadgeProgressCardProps {
  badge: BadgeType;
  currentSpending: number;
  currentOrders: number;
  awarded: boolean;
}

export const BadgeProgressCard = ({ badge, currentSpending, currentOrders, awarded }: BadgeProgressCardProps) => {
  const IconComponent = iconMap[badge.icon] || Star;
  
  const spendingProgress = badge.min_spending > 0 
    ? Math.min((currentSpending / badge.min_spending) * 100, 100) 
    : 100;
  const ordersProgress = badge.min_orders > 0 
    ? Math.min((currentOrders / badge.min_orders) * 100, 100) 
    : 100;

  return (
    <Card className={`border-border/50 ${awarded ? 'bg-gradient-to-br from-primary/5 to-primary/10' : 'bg-card/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center ${awarded ? '' : 'opacity-50'}`}
            style={{ backgroundColor: `${badge.color}20` }}
          >
            <IconComponent size={28} style={{ color: badge.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold truncate">{badge.name_ar}</h4>
              {awarded && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  مكتسبة
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{badge.description_ar}</p>
            
            {!awarded && (
              <div className="mt-2 space-y-1">
                {badge.min_spending > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                      <span>الإنفاق</span>
                      <span>${currentSpending.toFixed(0)} / ${badge.min_spending}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${spendingProgress}%`,
                          backgroundColor: badge.color
                        }}
                      />
                    </div>
                  </div>
                )}
                {badge.min_orders > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                      <span>الطلبات</span>
                      <span>{currentOrders} / {badge.min_orders}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${ordersProgress}%`,
                          backgroundColor: badge.color
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserBadgeDisplay;
