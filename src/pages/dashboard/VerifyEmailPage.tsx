import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, ChevronLeft, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check email verification status periodically
    const interval = setInterval(checkEmailStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkEmailStatus = async () => {
    if (checking) return;
    setChecking(true);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.email_confirmed_at) {
        // Email is verified, update order status
        await supabase
          .from("dev_orders")
          .update({ status: "under_review" } as any)
          .eq("id", orderId);

        // Add events
        await supabase.from("dev_order_events").insert([
          {
            order_id: orderId,
            actor_role: "system",
            event_type: "email_verified",
            payload: { email: authUser.email },
          },
          {
            order_id: orderId,
            actor_role: "system",
            event_type: "status_changed",
            payload: { old_status: "pending_email_verification", new_status: "under_review" },
          },
        ] as any);

        toast({
          title: "تم تأكيد البريد بنجاح!",
          description: "طلبك الآن قيد المراجعة",
        });

        navigate(`/dashboard/dev-orders/${orderId}`);
      }
    } catch (error) {
      console.error("Error checking email status:", error);
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user?.email || "",
      });

      if (error) throw error;

      await supabase.from("dev_order_events").insert([{
        order_id: orderId,
        actor_role: "system",
        event_type: "email_sent",
        payload: { email: user?.email, resent: true },
      }] as any);

      toast({
        title: "تم إعادة إرسال البريد",
        description: "يرجى التحقق من بريدك الإلكتروني",
      });
    } catch (error) {
      toast({
        title: "خطأ في إرسال البريد",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/dashboard/dev-orders" className="hover:text-primary transition-colors">
              طلباتي
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground font-medium">تحقق من البريد</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 p-8 md:p-12 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            تحقق من بريدك الإلكتروني
          </h1>
          
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            تم إرسال رابط التحقق إلى <strong className="text-foreground">{user?.email}</strong>. 
            يرجى فتح البريد والضغط على الرابط لتأكيد طلبك.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={resendEmail}
              disabled={resending}
              className="gap-2 min-w-[160px]"
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              إعادة الإرسال
            </Button>
            
            <Button
              onClick={checkEmailStatus}
              disabled={checking}
              className="gap-2 min-w-[160px]"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              تم التأكيد
            </Button>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
            <p>لم يصلك البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
