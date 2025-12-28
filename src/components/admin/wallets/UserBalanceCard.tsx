import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Clock,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
}

interface UserBalanceCardProps {
  user: UserBalance;
  onAddBalance: (user: UserBalance) => void;
  onDeductBalance: (user: UserBalance) => void;
  onViewDetails: (user: UserBalance) => void;
  index: number;
}

export const UserBalanceCard = ({
  user,
  onAddBalance,
  onDeductBalance,
  onViewDetails,
  index,
}: UserBalanceCardProps) => {
  const initials = user.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "؟؟";

  const profitPercentage = user.total_deposited > 0 
    ? ((user.total_spent / user.total_deposited) * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-3 sm:p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Mobile Layout */}
        <div className="relative sm:hidden space-y-3">
          {/* Top Row: Avatar + Info + Balance */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
              <AvatarImage src={user.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {user.profile?.full_name || "مستخدم غير معروف"}
                </h3>
                {user.balance > 1000 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">VIP</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {user.profile?.email || "لا يوجد بريد"}
              </p>
            </div>
            
            <div className="text-left shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Wallet className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {user.balance.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground">ر.س</span>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="w-3 h-3" />
                {user.total_deposited.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
              </span>
              <span className="flex items-center gap-1 text-orange-500">
                <TrendingDown className="w-3 h-3" />
                {user.total_spent.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-[9px] h-4 px-1.5 ${Number(profitPercentage) > 70 ? 'text-emerald-500 border-emerald-500/30' : 'text-muted-foreground'}`}
            >
              {profitPercentage}%
            </Badge>
          </div>
          
          {/* Actions Row */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(user.updated_at), "dd MMM", { locale: ar })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 text-[10px] gap-1"
                onClick={() => onAddBalance(user)}
              >
                <Plus className="h-3 w-3" />
                إضافة
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 text-[10px] gap-1"
                onClick={() => onDeductBalance(user)}
              >
                <Minus className="h-3 w-3" />
                خصم
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={() => onViewDetails(user)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="relative hidden sm:flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
            <AvatarImage src={user.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {user.profile?.full_name || "مستخدم غير معروف"}
              </h3>
              {user.balance > 1000 && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  VIP
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user.profile?.email || "لا يوجد بريد"}
            </p>
          </div>

          {/* Balance Display */}
          <div className="text-left">
            <div className="flex items-center gap-1 justify-end">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                {user.balance.toLocaleString('ar-SA', { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground">ر.س</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
              <span className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="w-3 h-3" />
                {user.total_deposited.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
              </span>
              <span className="flex items-center gap-1 text-orange-500">
                <TrendingDown className="w-3 h-3" />
                {user.total_spent.toLocaleString('ar-SA', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => onAddBalance(user)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
              onClick={() => onDeductBalance(user)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(user)}>
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer Stats - Desktop Only */}
        <div className="relative hidden sm:flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>آخر تحديث: {format(new Date(user.updated_at), "dd MMM yyyy", { locale: ar })}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>نسبة الاستخدام:</span>
            <Badge 
              variant="outline" 
              className={`text-[10px] ${Number(profitPercentage) > 70 ? 'text-emerald-500 border-emerald-500/30' : 'text-muted-foreground'}`}
            >
              {profitPercentage}%
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserBalanceCard;
