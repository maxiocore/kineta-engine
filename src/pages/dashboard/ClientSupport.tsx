import { motion, AnimatePresence } from "framer-motion";
import { 
  HeadphonesIcon, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Sparkles,
  ChevronLeft,
  Loader2,
  Inbox,
  Shield,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { notifyNewTicket } from "@/lib/adminNotifyService";
import { z } from "zod";
import { 
  useSupportSystem, 
  getStatusLabel, 
  getStatusColor, 
  getPriorityLabel, 
  getPriorityColor,
  formatRelativeTime,
  SupportTicket
} from "@/hooks/useSupportSystem";
import { ChatInterface } from "@/components/support/ChatInterface";
import { cn } from "@/lib/utils";

const ticketSchema = z.object({
  subject: z.string().trim().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل").max(200, "الموضوع يجب أن يكون أقل من 200 حرف"),
  description: z.string().trim().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل").max(2000, "الوصف يجب أن يكون أقل من 2000 حرف"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type ViewMode = "list" | "new" | "chat";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open": return <Sparkles className="w-3.5 h-3.5" />;
    case "in_progress": return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case "resolved": return <CheckCircle className="w-3.5 h-3.5" />;
    case "closed": return <Shield className="w-3.5 h-3.5" />;
    default: return <MessageCircle className="w-3.5 h-3.5" />;
  }
};

const ClientSupport = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const isMobile = useIsMobile();
  
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    tickets,
    selectedTicket,
    messages,
    stats,
    isLoading,
    isMessagesLoading,
    createTicket,
    sendMessage,
    selectTicket,
    rateTicket
  } = useSupportSystem(false); // false = not admin

  const handleCreateTicket = async () => {
    const result = ticketSchema.safeParse(newTicket);
    if (!result.success) {
      const fieldErrors: { subject?: string; description?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "subject") fieldErrors.subject = err.message;
        if (err.path[0] === "description") fieldErrors.description = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await createTicket({
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        priority: newTicket.priority,
      });
      
      // Notify admins about new ticket
      notifyNewTicket({
        userName: user.user_metadata?.full_name,
        userEmail: user.email || '',
        subject: newTicket.subject.trim(),
        priority: newTicket.priority,
        description: newTicket.description.trim(),
      });
      
      setNewTicket({ subject: "", description: "", priority: "medium" });
      setViewMode("list");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء التذكرة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!selectedTicket) return;
    await sendMessage(selectedTicket.id, message, attachments || []);
  };

  const openTicketChat = (ticket: SupportTicket) => {
    selectTicket(ticket);
    setViewMode("chat");
  };

  const goBack = () => {
    setViewMode("list");
    selectTicket(null);
    setNewTicket({ subject: "", description: "", priority: "medium" });
    setErrors({});
  };

  const statsData = [
    { label: "مفتوحة", value: stats.open, icon: MessageCircle, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
    { label: "قيد المعالجة", value: stats.inProgress, icon: Clock, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
    { label: "تم الحل", value: stats.resolved + stats.closed, icon: CheckCircle, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10" },
  ];

  // New Ticket Form
  const NewTicketForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <Card className="border-border/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goBack}
              className="shrink-0 rounded-xl hover:bg-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">تذكرة جديدة</h2>
              <p className="text-sm text-muted-foreground">أخبرنا كيف يمكننا مساعدتك</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">الموضوع</label>
              <Input
                placeholder="أدخل موضوع التذكرة..."
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                className="bg-secondary/50"
              />
              {errors.subject && (
                <p className="text-xs text-destructive mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الأولوية</label>
              <Select
                value={newTicket.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") => 
                  setNewTicket({ ...newTicket, priority: value })
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                placeholder="اشرح مشكلتك بالتفصيل..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                className="min-h-[150px] bg-secondary/50"
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <Button 
              onClick={handleCreateTicket}
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5 ml-2" />
                  إنشاء التذكرة
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Tickets List
  const TicketsList = () => (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statsData.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className={cn(
              "relative overflow-hidden border-border/30 transition-all duration-300",
              stat.bg
            )}>
              <CardContent className="p-3 text-center">
                <div className={cn(
                  "w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* New Ticket Button */}
      <motion.div variants={itemVariants}>
        <Button 
          onClick={() => setViewMode("new")}
          className="w-full h-12 rounded-xl bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 ml-2" />
          تذكرة جديدة
        </Button>
      </motion.div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">لا توجد تذاكر</h3>
            <p className="text-sm text-muted-foreground mb-4">لم تقم بإنشاء أي تذاكر دعم بعد</p>
            <Button onClick={() => setViewMode("new")} variant="outline">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء تذكرة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card 
                className={cn(
                  "border-border/30 cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/30",
                  ticket.priority === "urgent" && "border-red-500/30 bg-red-500/5"
                )}
                onClick={() => openTicketChat(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      ticket.status === "open" ? "bg-emerald-500/10" :
                      ticket.status === "in_progress" ? "bg-amber-500/10" :
                      "bg-blue-500/10"
                    )}>
                      {getStatusIcon(ticket.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{ticket.subject}</h4>
                        {ticket.ticket_number && (
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            #{ticket.ticket_number}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(ticket.status))}>
                          {getStatusIcon(ticket.status)}
                          <span className="mr-1">{getStatusLabel(ticket.status)}</span>
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
                          {getPriorityLabel(ticket.priority)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Chat View
  const ChatView = () => (
    <motion.div 
      className="h-[calc(100vh-120px)]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {selectedTicket && (
        <Card className="border-border/30 h-full overflow-hidden">
          <ChatInterface
            ticket={selectedTicket}
            messages={messages}
            isLoading={isMessagesLoading}
            isAdmin={false}
            currentUserId={user?.id}
            onSendMessage={handleSendMessage}
            onBack={goBack}
            onRate={(rating, comment) => selectedTicket && rateTicket(selectedTicket.id, rating, comment)}
          />
        </Card>
      )}
    </motion.div>
  );

  return (
    <ClientDashboardLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {/* Header - only show in list view */}
        {viewMode === "list" && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">الدعم الفني</h1>
                <p className="text-sm text-muted-foreground">نحن هنا لمساعدتك</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {viewMode === "list" && <TicketsList key="list" />}
          {viewMode === "new" && <NewTicketForm key="new" />}
          {viewMode === "chat" && <ChatView key="chat" />}
        </AnimatePresence>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;
