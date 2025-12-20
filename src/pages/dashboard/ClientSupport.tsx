import { motion } from "framer-motion";
import { HeadphonesIcon, Plus, MessageCircle, Clock, CheckCircle, Send, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema
const ticketSchema = z.object({
  subject: z.string().trim().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل").max(200, "الموضوع يجب أن يكون أقل من 200 حرف"),
  description: z.string().trim().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل").max(2000, "الوصف يجب أن يكون أقل من 2000 حرف"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

const messageSchema = z.object({
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(1000, "الرسالة يجب أن تكون أقل من 1000 حرف"),
});

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "open": return "مفتوح";
    case "in_progress": return "قيد المعالجة";
    case "resolved": return "تم الحل";
    case "closed": return "مغلق";
    default: return status;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "open": return "bg-success/10 text-success";
    case "in_progress": return "bg-warning/10 text-warning";
    case "resolved": return "bg-blue-500/10 text-blue-500";
    case "closed": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "low": return "منخفضة";
    case "medium": return "متوسطة";
    case "high": return "عالية";
    case "urgent": return "عاجلة";
    default: return priority;
  }
};

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case "low": return "bg-muted text-muted-foreground";
    case "medium": return "bg-blue-500/10 text-blue-500";
    case "high": return "bg-warning/10 text-warning";
    case "urgent": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return d.toLocaleDateString("ar-SA");
};

const ClientSupport = () => {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string; message?: string }>({});
  
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [newMessage, setNewMessage] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch tickets
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل التذاكر",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    }
  };

  const handleCreateTicket = async () => {
    // Validate
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
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        priority: newTicket.priority,
      });
      
      if (error) throw error;
      
      toast({
        title: "تم إنشاء التذكرة",
        description: "سيتم الرد عليك في أقرب وقت",
      });
      
      setNewTicket({ subject: "", description: "", priority: "medium" });
      setShowNewTicket(false);
      fetchTickets();
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

  const handleSendMessage = async () => {
    // Validate
    const result = messageSchema.safeParse({ message: newMessage });
    if (!result.success) {
      setErrors({ message: result.error.errors[0].message });
      return;
    }
    setErrors({});

    if (!user || !selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_admin: false,
      });
      
      if (error) throw error;
      
      setNewMessage("");
      fetchMessages(selectedTicket.id);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTicketChat = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  // Calculate stats
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <ClientDashboardLayout>
      <div className="space-y-4 md:space-y-8 px-1" dir="rtl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl md:text-3xl font-bold mb-1 md:mb-2"
            >
              الدعم الفني
            </motion.h1>
            <p className="text-xs md:text-base text-muted-foreground">تواصل معنا وسنكون سعداء بمساعدتك</p>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90 h-9 md:h-10 text-sm md:text-base w-full md:w-auto"
            onClick={() => setShowNewTicket(!showNewTicket)}
          >
            <Plus className="w-4 h-4 ms-2" />
            تذكرة جديدة
          </Button>
        </div>

        {/* New Ticket Form */}
        {showNewTicket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card className="glass border-border/50 border-primary/30">
              <CardHeader>
                <CardTitle className="font-display">إنشاء تذكرة جديدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">الموضوع</label>
                  <Input 
                    placeholder="أدخل موضوع التذكرة" 
                    className="bg-secondary/50"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">الأولوية</label>
                  <Select 
                    value={newTicket.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") => setNewTicket({ ...newTicket, priority: value })}
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
                  <label className="text-sm font-medium mb-2 block">الرسالة</label>
                  <Textarea 
                    placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..." 
                    className="bg-secondary/50 min-h-32"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewTicket(false)}>إلغاء</Button>
                  <Button 
                    className="bg-gradient-primary"
                    onClick={handleCreateTicket}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "جاري الإرسال..." : "إرسال التذكرة"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {[
            { label: "المفتوحة", fullLabel: "التذاكر المفتوحة", value: openCount.toString(), icon: MessageCircle, color: "from-primary to-cyan-400" },
            { label: "قيد المعالجة", fullLabel: "قيد المعالجة", value: inProgressCount.toString(), icon: Clock, color: "from-warning to-orange-400" },
            { label: "تم الحل", fullLabel: "تم الحل", value: resolvedCount.toString(), icon: CheckCircle, color: "from-success to-emerald-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-3 md:p-6 flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} p-2 md:p-3`}>
                    <stat.icon className="w-full h-full text-primary-foreground" />
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-lg md:text-2xl font-bold font-display">{stat.value}</p>
                    <p className="text-[10px] md:text-sm text-muted-foreground hidden md:block">{stat.fullLabel}</p>
                    <p className="text-[10px] text-muted-foreground md:hidden">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tickets List */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">التذاكر السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HeadphonesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تذاكر حالياً</p>
                <Button className="mt-4" onClick={() => setShowNewTicket(true)}>
                  <Plus className="w-4 h-4 ms-2" />
                  إنشاء تذكرة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => openTicketChat(ticket)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HeadphonesIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getPriorityStyles(ticket.priority)}>
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className="text-sm text-muted-foreground hidden sm:block">{formatDate(ticket.created_at)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Chat Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedTicket?.subject}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityStyles(selectedTicket?.priority || "medium")}>
                    {getPriorityLabel(selectedTicket?.priority || "medium")}
                  </Badge>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(selectedTicket?.status || "open")}`}>
                    {getStatusLabel(selectedTicket?.status || "open")}
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Original Description */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-4">
                  <p>{selectedTicket?.description}</p>
                  <p className="text-xs opacity-70 mt-2">{selectedTicket && formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>
              
              {/* Messages */}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.is_admin 
                      ? "bg-secondary/50 rounded-tl-sm" 
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  }`}>
                    {msg.is_admin && (
                      <p className="text-xs font-medium text-primary mb-1">فريق الدعم</p>
                    )}
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-2 ${msg.is_admin ? "text-muted-foreground" : "opacity-70"}`}>
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Send Message */}
            {selectedTicket?.status !== "closed" && (
              <div className="flex gap-2 pt-4 border-t">
                <Input
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="bg-secondary/50"
                />
                <Button onClick={handleSendMessage} disabled={isSubmitting}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
            {selectedTicket?.status === "closed" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm pt-4 border-t">
                <AlertCircle className="w-4 h-4" />
                <span>هذه التذكرة مغلقة</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;
