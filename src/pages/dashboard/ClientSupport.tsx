import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Plus, Loader2, Inbox, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useSupportSystem, SupportTicket } from "@/hooks/useSupportSystem";
import { ModernChatInterface } from "@/components/support/ModernChatInterface";
import { SupportStats } from "@/components/support/SupportStats";
import { TicketCard } from "@/components/support/TicketCard";

const ticketSchema = z.object({
  subject: z.string().trim().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل"),
  description: z.string().trim().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type ViewMode = "list" | "new" | "chat";

const ClientSupport = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "medium" as const });
  const { user } = useAuth();
  const { toast } = useToast();
  const { tickets, selectedTicket, messages, stats, isLoading, isMessagesLoading, isSubmitting, createTicket, sendMessage, selectTicket } = useSupportSystem(false);

  const handleCreateTicket = async () => {
    const result = ticketSchema.safeParse(newTicket);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "subject") fieldErrors.subject = err.message;
        if (err.path[0] === "description") fieldErrors.description = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      await createTicket(newTicket);
      setNewTicket({ subject: "", description: "", priority: "medium" });
      setViewMode("list");
    } catch {}
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedTicket) return;
    await sendMessage(selectedTicket.id, message);
  };

  const openChat = (ticket: SupportTicket) => { selectTicket(ticket); setViewMode("chat"); };
  const goBack = () => { setViewMode("list"); selectTicket(null); setErrors({}); };

  return (
    <ClientDashboardLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {viewMode === "list" && (
          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3">
              <motion.div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div><h1 className="text-2xl font-bold">الدعم الفني</h1><p className="text-sm text-muted-foreground">نحن هنا لمساعدتك</p></div>
            </div>

            <SupportStats stats={stats} />

            <Button onClick={() => setViewMode("new")} className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-primary/80 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 ml-2" />تذكرة جديدة
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : tickets.length === 0 ? (
              <Card className="border-border/30"><CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><Inbox className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="font-medium mb-2">لا توجد تذاكر</h3><p className="text-sm text-muted-foreground">لم تقم بإنشاء أي تذاكر دعم بعد</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">{tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onClick={() => openChat(ticket)} />)}</div>
            )}
          </motion.div>
        )}

        {viewMode === "new" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-border/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Button variant="ghost" size="icon" onClick={goBack} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
                  <div><h2 className="text-xl font-bold">تذكرة جديدة</h2><p className="text-sm text-muted-foreground">أخبرنا كيف يمكننا مساعدتك</p></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">الموضوع</label><Input placeholder="أدخل موضوع التذكرة..." value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />{errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}</div>
                <div><label className="block text-sm font-medium mb-2">الأولوية</label><Select value={newTicket.priority} onValueChange={(v: any) => setNewTicket({ ...newTicket, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem><SelectItem value="high">عالية</SelectItem><SelectItem value="urgent">عاجلة</SelectItem></SelectContent></Select></div>
                <div><label className="block text-sm font-medium mb-2">الوصف</label><Textarea placeholder="اشرح مشكلتك بالتفصيل..." value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="min-h-[120px]" />{errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}</div>
                <Button onClick={handleCreateTicket} disabled={isSubmitting} className="w-full h-12 rounded-xl">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 ml-2" />إنشاء التذكرة</>}</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewMode === "chat" && selectedTicket && (
          <motion.div className="h-[calc(100vh-120px)]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-border/30 h-full overflow-hidden">
              <ModernChatInterface ticket={selectedTicket} messages={messages} isLoading={isMessagesLoading} isSubmitting={isSubmitting} currentUserId={user?.id} onSendMessage={handleSendMessage} onBack={goBack} />
            </Card>
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;
