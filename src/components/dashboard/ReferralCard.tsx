import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Check, Gift, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface ReferralCardProps {
  code: string;
  totalReferrals: number;
  totalEarnings: number;
}

const ReferralCard = ({ code, totalReferrals, totalEarnings }: ReferralCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("تم نسخ كود الإحالة!");
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = `${window.location.origin}?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("تم نسخ رابط الإحالة!");
  };

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="card-elevated border-border/30 h-full bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10">
        <CardHeader className="flex flex-row-reverse items-center justify-between pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
              <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            برنامج الإحالة
          </CardTitle>
          <Link to="/dashboard/referrals">
            <Button variant="ghost" size="sm" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
              التفاصيل
              <ChevronLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4">
          {/* Referral Code */}
          <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">كود الإحالة الخاص بك</p>
            <div className="flex flex-row-reverse items-center justify-between gap-1.5 sm:gap-2">
              <code className="text-sm sm:text-lg md:text-xl font-bold font-mono tracking-wider truncate">{code}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-1 sm:gap-2 shrink-0 h-7 sm:h-8 md:h-9 px-2 sm:px-3"
              >
                {copied ? (
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-success" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline text-xs">{copied ? "تم النسخ" : "نسخ"}</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3">
            <div className="p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg bg-primary/5 border border-primary/10 text-center">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 mx-auto mb-0.5 sm:mb-1 text-primary" />
              <p className="text-sm sm:text-lg md:text-xl font-bold">{totalReferrals}</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">إحالات</p>
            </div>
            <div className="p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg bg-success/5 border border-success/10 text-center">
              <Gift className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 mx-auto mb-0.5 sm:mb-1 text-success" />
              <p className="text-sm sm:text-lg md:text-xl font-bold">{totalEarnings.toFixed(0)}</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">ر.س أرباح</p>
            </div>
          </div>

          {/* Share Link */}
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm h-8 sm:h-9 md:h-10"
            onClick={copyLink}
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            مشاركة رابط الإحالة
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralCard;
