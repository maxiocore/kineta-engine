import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Search, Loader2, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupportSystem, SupportTicket } from "@/hooks/useSupportSystem";
import { ModernChatInterface } from "@/components/support/ModernChatInterface";
import { SupportStats } from "@/components/support/SupportStats";
import { TicketCard } from "@/components/support/TicketCard";

const AdminSupport = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { tickets, selectedTicket, messages, stats, isLoading, isMessagesLoading, isSubmitting, sendMessage, updateTicketStatus, selectTicket } = useSupportSystem(true);

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSendMessage = async (message: string) => {
    if (!selectedTicket) return;
    await sendMessage(selectedTicket.id, message);
  };

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الدعم الفني</h1>
            <p className="text-sm text-muted-foreground">إدارة تذاكر الدعم والتواصل مع العملاء</p>
          </div>
        </motion.div>

        <SupportStats stats={stats} isAdmin />

        <Card className="border-border/30">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="البحث في التذاكر..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-secondary/50" />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList className="bg-secondary/50 h-10">
                  <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
                  <TabsTrigger value="open" className="text-xs">جديد</TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs">قيد المعالجة</TabsTrigger>
                  <TabsTrigger value="resolved" className="text-xs">تم الحل</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredTickets.length === 0 ? (
          <Card className="border-border/30"><CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><Inbox className="w-8 h-8 text-muted-foreground" /></div>
            <h3 className="font-medium mb-2">لا توجد تذاكر</h3>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onClick={() => selectTicket(ticket)} isSelected={selectedTicket?.id === ticket.id} isAdmin />
              ))}
            </AnimatePresence>
          </div>
        )}

        <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && selectTicket(null)}>
          <SheetContent side="left" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="sr-only"><SheetTitle>محادثة التذكرة</SheetTitle></SheetHeader>
            {selectedTicket && (
              <ModernChatInterface ticket={selectedTicket} messages={messages} isLoading={isMessagesLoading} isSubmitting={isSubmitting} isAdmin currentUserId={user?.id} onSendMessage={handleSendMessage} onBack={() => selectTicket(null)} onStatusChange={(status) => updateTicketStatus(selectedTicket.id, status)} />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSupport;
