import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  DollarSign,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface WalletTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserBalance | null;
  action: "add" | "deduct";
  onSubmit: (amount: number, reason: string) => void;
  isLoading?: boolean;
}

const presetAmounts = [10, 25, 50, 100, 250, 500, 1000];

export const WalletTransferDialog = ({
  isOpen,
  onClose,
  user,
  action,
  onSubmit,
  isLoading,
}: WalletTransferDialogProps) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onSubmit(numAmount, reason);
      setAmount("");
      setReason("");
    }
  };

  const isAdd = action === "add";
  const newBalance = user
    ? isAdd
      ? user.balance + (parseFloat(amount) || 0)
      : user.balance - (parseFloat(amount) || 0)
    : 0;

  const initials = user?.profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "؟؟";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAdd ? (
              <>
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                <span>إضافة رصيد</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-5 w-5 text-orange-500" />
                <span>خصم رصيد</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{user.profile?.full_name || "مستخدم"}</h3>
                <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                <p className="font-bold text-primary">
                  {user.balance.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                </p>
              </div>
            </motion.div>
          )}

          {/* Amount Input */}
          <div className="space-y-3">
            <Label>المبلغ</Label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="أدخل المبلغ"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-10 text-lg font-bold h-12"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ر.س
              </span>
            </div>
            
            {/* Preset Amounts */}
            <div className="flex flex-wrap gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={amount === String(preset) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(preset))}
                  className="flex-1 min-w-[60px]"
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>السبب (اختياري)</Label>
            <Textarea
              placeholder="أدخل سبب العملية..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* New Balance Preview */}
          <AnimatePresence>
            {parseFloat(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border ${
                  isAdd 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-orange-500/10 border-orange-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 ${isAdd ? 'text-emerald-500' : 'text-orange-500'}`} />
                    <span className="text-sm">الرصيد الجديد</span>
                  </div>
                  <span className={`text-lg font-bold ${isAdd ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {newBalance.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>التغيير</span>
                  <span className={isAdd ? 'text-emerald-500' : 'text-orange-500'}>
                    {isAdd ? '+' : '-'}{parseFloat(amount).toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || isLoading || (action === 'deduct' && newBalance < 0)}
            className={`w-full h-12 ${
              isAdd 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-5 w-5 ml-2" />
                {isAdd ? 'إضافة الرصيد' : 'خصم الرصيد'}
              </>
            )}
          </Button>

          {action === 'deduct' && newBalance < 0 && (
            <p className="text-xs text-red-500 text-center">
              لا يمكن أن يكون الرصيد سالباً
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletTransferDialog;
