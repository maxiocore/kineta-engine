import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Landmark, 
  History, 
  Coins,
  CreditCard,
  Fingerprint
} from "lucide-react";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

// Import the content components from existing pages
import ClientDepositsContent from "@/components/financial/ClientDepositsContent";
import ClientBalanceLogsContent from "@/components/financial/ClientBalanceLogsContent";
import ClientCashbackContent from "@/components/financial/ClientCashbackContent";
import DigitalWalletCard from "@/components/dashboard/DigitalWalletCard";

const ClientFinancialHub = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial tab from URL or default to "deposits"
  const urlTab = searchParams.get("tab");
  const validTabs = ["deposits", "balance-logs", "cashback", "digital-id"];
  const initialTab = urlTab && validTabs.includes(urlTab) ? urlTab : "deposits";
  
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const tabs = [
    { id: "digital-id", label: "الهوية الرقمية", icon: Fingerprint },
    { id: "deposits", label: "الإيداعات", icon: CreditCard },
    { id: "balance-logs", label: "السجل", icon: History },
    { id: "cashback", label: "كاش باك", icon: Coins },
  ];

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-l from-primary/10 via-accent/5 to-background border border-border p-4 md:p-6"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <motion.div
            className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          <div className="relative flex items-center gap-3 md:gap-4">
            <motion.div 
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <Landmark className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">المركز المالي</h1>
              <p className="text-xs md:text-sm text-muted-foreground">إدارة الإيداعات وسجل الرصيد والكاش باك</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto gap-1.5 p-1.5 md:p-2 bg-secondary border border-border rounded-lg md:rounded-xl shadow-sm">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex min-w-0 items-center justify-center gap-1.5 md:gap-2 border border-transparent bg-card/70 py-2.5 text-xs font-semibold text-muted-foreground shadow-none transition-all md:py-3 md:text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:border-border data-[state=inactive]:hover:bg-card data-[state=inactive]:hover:text-foreground"
              >
                <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 md:mt-6">
            <TabsContent value="digital-id" className="m-0">
              <DigitalWalletCard />
            </TabsContent>

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
