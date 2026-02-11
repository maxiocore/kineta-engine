import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Copy, Check, QrCode, Download, Share2, 
  Wallet, Shield, ExternalLink, Phone, ArrowUpLeft, Loader2 
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
  const [walletNumber, setWalletNumber] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ssoLoading, setSsoLoading] = useState(false);
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

  const handleShare = async () => {
    if (!walletNumber) return;
    if (navigator.share) {
      await navigator.share({
        title: "رقم محفظة ASH",
        text: `رقم حسابي في ASH: ${walletNumber}`,
      });
    } else {
      handleCopy();
    }
  };

  const handleGoToFinance = async () => {
    if (ssoLoading) return;
    setSsoLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("يرجى تسجيل الدخول أولاً");
        return;
      }

      const { data, error } = await supabase.functions.invoke("sso-token", {
        body: { service_id: null },
      });

      if (error || !data?.redirect_url) {
        throw new Error(error?.message || "فشل الحصول على رابط الدخول");
      }

      window.open(data.redirect_url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      console.error("SSO error:", err);
      toast.error("تعذر الانتقال لمنصة التمويل، حاول مرة أخرى");
    } finally {
      setSsoLoading(false);
    }
  };

  // Simple QR Code using a canvas-like SVG pattern
  const generateQRPattern = (text: string) => {
    // Create a simple visual pattern from the text
    const hash = text.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
    }, 0);
    
    const size = 21;
    const cells: boolean[][] = [];
    let seed = Math.abs(hash);
    
    for (let i = 0; i < size; i++) {
      cells[i] = [];
      for (let j = 0; j < size; j++) {
        // Fixed pattern corners (QR code finder patterns)
        if (
          (i < 7 && j < 7) || 
          (i < 7 && j >= size - 7) || 
          (i >= size - 7 && j < 7)
        ) {
          const inOuter = i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= size - 7 && (i === size - 7 || i === size - 1)) ||
            (j >= size - 7 && (j === size - 7 || j === size - 1));
          const inInner = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
            (i >= 2 && i <= 4 && j >= size - 5 && j <= size - 3) ||
            (i >= size - 5 && i <= size - 3 && j >= 2 && j <= 4);
          cells[i][j] = inOuter || inInner;
        } else {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          cells[i][j] = (seed % 3) === 0;
        }
      }
    }
    return cells;
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-xl" />
      </Card>
    );
  }

  const qrCells = walletNumber ? generateQRPattern(walletNumber) : [];

  return (
    <div className="space-y-4">
      {/* Digital Card */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 min-h-[220px]"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Card chip pattern */}
        <div className="absolute top-6 left-6 w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300/80 to-yellow-500/80 flex items-center justify-center">
          <div className="w-8 h-5 rounded-sm border border-yellow-600/30 grid grid-cols-3 grid-rows-2 gap-px p-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-yellow-600/40 rounded-[1px]" />
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <img src={logoImage} alt="ASH" className="w-8 h-8 rounded-lg" />
          <span className="text-white/90 font-bold text-sm">ASH</span>
        </div>

        {/* Account Number */}
        <div className="mt-16 mb-4">
          <p className="text-white/50 text-xs mb-1">رقم الحساب</p>
          <div className="flex items-center gap-3">
            <motion.p 
              className="text-white text-xl font-mono tracking-[0.25em] font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {walletNumber || "---"}
            </motion.p>
            <button
              onClick={handleCopy}
              className="text-white/60 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Phone number */}
        {phone && (
          <div className="mb-3">
            <p className="text-white/50 text-xs mb-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              رقم الجوال
            </p>
            <p className="text-white text-sm font-mono tracking-wider" dir="ltr">{phone}</p>
          </div>
        )}

        {/* Card holder & balance */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-white/50 text-xs">صاحب الحساب</p>
            <p className="text-white font-medium text-sm">{fullName || "---"}</p>
          </div>
          <div className="text-left">
            <p className="text-white/50 text-xs">الرصيد</p>
            <p className="text-white font-bold text-lg">{balance.toFixed(2)} <span className="text-xs text-white/60">ر.س</span></p>
          </div>
        </div>

        {/* Security badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Badge variant="outline" className="border-white/20 text-white/40 text-[10px]">
            <Shield className="w-3 h-3 ml-1" />
            محفظة رقمية آمنة
          </Badge>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs h-10"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          نسخ الرقم
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-1.5 text-xs h-10"
        >
          <QrCode className="w-3.5 h-3.5" />
          رمز QR
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs h-10"
        >
          <Share2 className="w-3.5 h-3.5" />
          مشاركة
        </Button>
        <Button
          size="sm"
          onClick={handleGoToFinance}
          disabled={ssoLoading}
          className="flex items-center gap-1.5 text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {ssoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpLeft className="w-3.5 h-3.5" />}
          منصة التمويل
        </Button>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && walletNumber && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 flex flex-col items-center gap-4">
              <h3 className="font-bold text-sm">رمز QR للمحفظة</h3>
              <div className="bg-white p-4 rounded-xl shadow-inner">
                <svg viewBox="0 0 210 210" className="w-48 h-48">
                  {qrCells.map((row, i) =>
                    row.map((cell, j) =>
                      cell ? (
                        <rect
                          key={`${i}-${j}`}
                          x={j * 10}
                          y={i * 10}
                          width={10}
                          height={10}
                          fill="#1a1a2e"
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>
              <p className="text-muted-foreground text-xs text-center">
                امسح هذا الرمز من موقع ASH Holdings لإيداع الرصيد فوراً
              </p>
              <p className="font-mono text-sm font-bold">{walletNumber}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-medium">كيفية الإيداع من ASH Holdings</p>
            <ol className="text-muted-foreground space-y-0.5 list-decimal list-inside">
              <li>انسخ رقم حسابك أو رقم جوالك أعلاه</li>
              <li>اذهب إلى موقع ASH Holdings</li>
              <li>أدخل رقم الحساب أو الجوال أو البريد واطلب السحب</li>
              <li>سيتم إضافة الرصيد فوراً لمحفظتك</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DigitalWalletCard;
