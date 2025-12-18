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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="card-elevated border-border/30 h-full bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
            برنامج الإحالة
          </CardTitle>
          <Link to="/dashboard/referrals">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              التفاصيل
              <ChevronLeft className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">كود الإحالة الخاص بك</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-lg sm:text-xl font-bold font-mono tracking-wider">{code}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-2 shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copied ? "تم النسخ" : "نسخ"}</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg sm:text-xl font-bold">{totalReferrals}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">إحالات</p>
            </div>
            <div className="p-3 rounded-lg bg-success/5 border border-success/10 text-center">
              <Gift className="w-5 h-5 mx-auto mb-1 text-success" />
              <p className="text-lg sm:text-xl font-bold">{totalEarnings.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">ر.س أرباح</p>
            </div>
          </div>

          {/* Share Link */}
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={copyLink}
          >
            <Copy className="w-4 h-4 ml-2" />
            مشاركة رابط الإحالة
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReferralCard;
