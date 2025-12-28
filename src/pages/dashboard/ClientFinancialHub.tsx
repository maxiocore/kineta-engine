import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Landmark, 
  Wallet, 
  History, 
  Coins,
  TrendingUp
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

// Import the content components from existing pages
import ClientDepositsContent from "@/components/financial/ClientDepositsContent";
import ClientBalanceLogsContent from "@/components/financial/ClientBalanceLogsContent";
import ClientCashbackContent from "@/components/financial/ClientCashbackContent";

const ClientFinancialHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deposits");

  const tabs = [
    { id: "deposits", label: "الإيداعات", icon: History },
    { id: "balance-logs", label: "سجل الرصيد", icon: Wallet },
    { id: "cashback", label: "كاش باك", icon: Coins },
  ];

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-accent/5 to-background border border-border p-6"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <motion.div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <Landmark className="w-7 h-7 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold">المركز المالي</h1>
              <p className="text-muted-foreground">إدارة الإيداعات وسجل الرصيد والكاش باك</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="deposits" className="m-0">
              <ClientDepositsContent />
            </TabsContent>

            <TabsContent value="balance-logs" className="m-0">
              <ClientBalanceLogsContent />
            </TabsContent>

            <TabsContent value="cashback" className="m-0">
              <ClientCashbackContent />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientFinancialHub;
