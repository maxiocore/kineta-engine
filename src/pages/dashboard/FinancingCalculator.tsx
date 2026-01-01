import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import {
  Calculator,
  Landmark,
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle2,
  Sparkles,
  PieChart,
  TrendingUp,
} from "lucide-react";

interface FinancingPlan {
  id: string;
  name: string;
  name_ar: string;
  installments_count: number;
  duration_months: number;
  min_amount: number;
  max_amount: number | null;
}

export default function FinancingCalculator() {
  const [amount, setAmount] = useState<number>(5000);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Fetch plans
  const { data: plans = [] } = useQuery({
    queryKey: ["financing-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financing_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FinancingPlan[];
    },
  });

  const selectedPlan = useMemo(() => {
    return plans.find(p => p.id === selectedPlanId) || plans[0];
  }, [selectedPlanId, plans]);

  const calculation = useMemo(() => {
    if (!selectedPlan) return null;

    const monthlyInstallment = amount / selectedPlan.installments_count;
    const totalAmount = amount;
    const savings = 0; // No interest

    return {
      monthlyInstallment,
      totalAmount,
      savings,
      installmentsCount: selectedPlan.installments_count,
      durationMonths: selectedPlan.duration_months,
    };
  }, [amount, selectedPlan]);

  // Generate installments schedule - due on 27th of each month
  const installmentsSchedule = useMemo(() => {
    if (!calculation) return [];
    
    const schedule = [];
    const today = new Date();
    
    for (let i = 1; i <= calculation.installmentsCount; i++) {
      // Set due date to 27th of month
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i, 27);
      
      schedule.push({
        number: i,
        amount: calculation.monthlyInstallment,
        dueDate: dueDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }),
        dueDateRaw: dueDate,
      });
    }
    
    return schedule;
  }, [calculation]);

  return (
    <ClientDashboardLayout>
      <motion.div
        className="space-y-6"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              حاسبة التمويل
            </h1>
            <p className="text-muted-foreground mt-1">
              احسب أقساطك الشهرية بدون أي فوائد أو رسوم إضافية
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard/financing">
              <ArrowLeft className="h-4 w-4 ml-2" />
              العودة للتمويل
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  مبلغ التمويل
                </CardTitle>
                <CardDescription>
                  اختر المبلغ الذي تحتاجه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>المبلغ المطلوب</Label>
                    <span className="text-2xl font-bold text-primary">
                      {amount.toLocaleString()} ر.س
                    </span>
                  </div>
                  <Slider
                    value={[amount]}
                    onValueChange={([value]) => setAmount(value)}
                    min={500}
                    max={50000}
                    step={500}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>500 ر.س</span>
                    <span>50,000 ر.س</span>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(500, Math.min(50000, Number(e.target.value))))}
                    className="text-center text-lg font-semibold"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ر.س
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  خطة التقسيط
                </CardTitle>
                <CardDescription>
                  اختر عدد الأقساط المناسب لك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {plans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        selectedPlan?.id === plan.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-3xl font-bold text-primary mb-1">
                        {plan.installments_count}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.installments_count === 1 ? "دفعة واحدة" : "أقساط"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {plan.duration_months} {plan.duration_months === 1 ? "شهر" : "أشهر"}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Installments Schedule */}
            {installmentsSchedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    جدول الأقساط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {installmentsSchedule.map((installment, index) => (
                      <motion.div
                        key={installment.number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {installment.number}
                          </div>
                          <div>
                            <p className="font-medium">القسط {installment.number}</p>
                            <p className="text-sm text-muted-foreground">
                              يوم 30 - {installment.dueDate}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">
                            {installment.amount.toFixed(2)} ر.س
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Calculation Summary */}
            <Card className="sticky top-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  ملخص التمويل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {calculation && (
                  <>
                    <div className="p-4 rounded-lg bg-background/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        القسط الشهري
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {calculation.monthlyInstallment.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">ر.س / شهر</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">إجمالي المبلغ</span>
                        <span className="font-semibold">{calculation.totalAmount.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">عدد الأقساط</span>
                        <span className="font-semibold">{calculation.installmentsCount}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">مدة السداد</span>
                        <span className="font-semibold">{calculation.durationMonths} {calculation.durationMonths === 1 ? "شهر" : "أشهر"}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">الفوائد</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <Sparkles className="h-3 w-3 ml-1" />
                          بدون فوائد
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">توفير 100%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        أنت تدفع نفس المبلغ بدون أي رسوم أو فوائد إضافية
                      </p>
                    </div>

                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      size="lg"
                    >
                      <Link to="/dashboard/financing/apply">
                        تقديم طلب تمويل
                        <ArrowLeft className="h-4 w-4 mr-2" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">نصيحة</p>
                    <p className="text-sm text-muted-foreground">
                      اختر خطة التقسيط المناسبة لميزانيتك الشهرية. كلما زادت
                      الأقساط، قلّ المبلغ الشهري.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </ClientDashboardLayout>
  );
}
