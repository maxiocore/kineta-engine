import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Copy, Check, 
  Shield, Phone, PlusCircle, Wifi 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImage from "@/assets/maxiocore-logo-transparent.png";

const DigitalWalletCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [walletNumber, setWalletNumber] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      const [balanceRes, profileRes] = await Promise.all([
        supabase
          .from("user_balances")
          .select("wallet_account_number, balance")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("full_name, phone, phone_verified")
          .eq("id", user.id)
          .single(),
      ]);

      if (balanceRes.data) {
        setWalletNumber(balanceRes.data.wallet_account_number);
        setBalance(Number(balanceRes.data.balance));
      }
      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        if (profileRes.data.phone_verified && profileRes.data.phone) {
          setPhone(profileRes.data.phone);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleCopy = async () => {
    if (!walletNumber) return;
    await navigator.clipboard.writeText(walletNumber);
    setCopied(true);
    toast.success("تم نسخ رقم الحساب");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopUp = () => {
    navigate("/dashboard/financial?tab=deposits");
  };



  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
      </Card>
    );
  }

  return (
    <div dir="rtl" className="space-y-4 text-right">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Digital ID Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground via-foreground/95 to-primary p-6 md:p-7 min-h-[240px] text-background shadow-2xl"
      >
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-60 w-60 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 14px)" }} />

        {/* Bank-style top row: issuer + contactless */}
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="ASH" className="h-9 w-9 rounded-lg" />
            <div>
              <p className="text-sm font-bold">ASH HOLDING</p>
              <p className="text-[10px] opacity-60">الهوية المالية الرقمية</p>
            </div>
          </div>
          <Wifi className="h-5 w-5 -rotate-90 opacity-70" aria-hidden="true" />
        </div>

        {/* Metallic chip */}
        <div className="relative mt-6 flex items-center gap-3">
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-accent via-accent/80 to-primary shadow-inner ring-1 ring-background/30">
            <div className="mt-[13px] h-px w-full bg-background/25" />
            <div className="mx-auto h-3 w-px bg-background/25" />
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest opacity-60">بطاقة رقمية</p>
        </div>

        {/* Account number in bank grouping */}
        <div className="relative mt-4 flex items-center gap-3">
          <div>
            <p className="text-[11px] opacity-60">رقم الحساب</p>
            <p dir="ltr" className="mt-1 font-mono text-xl md:text-2xl font-bold tracking-[0.18em]">{displayNumber}</p>
          </div>
          <button onClick={handleCopy} aria-label="نسخ" className="mt-4 opacity-60 hover:opacity-100 transition-opacity">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        {/* Bottom row: holder | balance */}
        <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] opacity-60">صاحب الحساب</p>
            <p className="text-sm font-semibold">{fullName || "---"}</p>
            {phone && <p dir="ltr" className="mt-1 flex items-center gap-1 text-xs font-mono opacity-80"><Phone className="h-3 w-3" />{phone}</p>}
          </div>
          <div className="text-left">
            <p className="text-[11px] opacity-60">الرصيد</p>
            <p className="text-2xl font-bold tabular-nums">{balance.toFixed(2)} <span className="text-xs opacity-60">ر.س</span></p>
          </div>
        </div>
      </motion.div>

      {/* Side panel */}
      <Card className="flex flex-col justify-between gap-4 rounded-3xl p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-bold">حالة الهوية</p>
            <p className="text-xs text-muted-foreground">محفظة رقمية موثّقة ومحمية</p>
          </div>
          <Badge className="mr-auto">نشطة</Badge>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">نوع الحساب</span><span className="font-semibold">محفظة عميل</span></div>
          <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">العملة</span><span className="font-semibold">ريال سعودي</span></div>
          <div className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"><span className="text-muted-foreground">الجوال</span><span className="font-semibold">{phone ? "موثّق" : "غير موثّق"}</span></div>
        </div>
      </Card>
      </div>

      {/* Actions */}
      <Button onClick={handleTopUp} className="h-11 gap-1.5 rounded-xl text-xs w-full">
        <PlusCircle className="h-4 w-4" /> شحن الرصيد
      </Button>

    </div>
  );
};

export default DigitalWalletCard;
