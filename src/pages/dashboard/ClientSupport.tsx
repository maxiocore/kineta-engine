import { motion, AnimatePresence } from "framer-motion";
import { 
  HeadphonesIcon, 
  Plus, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Send, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  User,
  Loader2,
  MessageSquare,
  Zap,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { z } from "zod";
import { FileAttachment, AttachmentDisplay } from "@/components/support/FileAttachment";

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

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  attachments?: Attachment[];
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
    case "open": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "in_progress": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "resolved": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "closed": return "bg-muted text-muted-foreground border-muted";
    default: return "bg-muted text-muted-foreground border-muted";
  }
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
    case "low": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    case "medium": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "high": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "urgent": return "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
    default: return "bg-muted text-muted-foreground";
  }
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return d.toLocaleDateString("ar-SA");
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ClientSupport = () => {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; description?: string; message?: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  const [newMessage, setNewMessage] = useState("");
  const [messageAttachments, setMessageAttachments] = useState<Attachment[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const typedData = (data || []).map(msg => ({
        ...msg,
        attachments: Array.isArray(msg.attachments) ? (msg.attachments as unknown as Attachment[]) : [],
        is_admin: msg.is_admin || false
      }));
      setMessages(typedData);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الرسائل",
        variant: "destructive",
      });
    }
  };

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
    const result = messageSchema.safeParse({ message: newMessage });
    if (!result.success) {
      setErrors({ message: result.error.errors[0].message });
      return;
    }
    setErrors({});

    if (!user || !selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert([{
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_admin: false,
        attachments: messageAttachments.length > 0 ? JSON.stringify(messageAttachments) : null,
      }]);
      
      if (error) throw error;
      
      setNewMessage("");
      setMessageAttachments([]);
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

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const statsData = [
    { label: "مفتوحة", value: openCount, icon: MessageCircle, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
    { label: "قيد المعالجة", value: inProgressCount, icon: Clock, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
    { label: "تم الحل", value: resolvedCount, icon: CheckCircle, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10" },
  ];

  const ChatContent = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{selectedTicket?.subject}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(selectedTicket?.status || "open")}`}>
                {getStatusIcon(selectedTicket?.status || "open")}
                {getStatusLabel(selectedTicket?.status || "open")}
              </span>
              <Badge variant="outline" className={`text-xs ${getPriorityStyles(selectedTicket?.priority || "medium")}`}>
                {getPriorityLabel(selectedTicket?.priority || "medium")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {/* Original Description */}
          <motion.div 
            className="flex justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="max-w-[85%] relative">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-tr-md p-4 shadow-lg shadow-primary/20">
                <p className="text-sm leading-relaxed">{selectedTicket?.description}</p>
                <p className="text-xs text-primary-foreground/60 mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedTicket && formatDate(selectedTicket.created_at)}
                </p>
              </div>
              <div className="absolute -bottom-1 left-2 w-4 h-4 bg-gradient-to-br from-primary to-primary/80 rotate-45 -z-10" />
            </div>
          </motion.div>
          
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div 
                key={msg.id} 
                className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
              >
                <div className="max-w-[85%] relative">
                  <div className={`rounded-2xl p-4 ${
                    msg.is_admin 
                      ? "bg-secondary/80 backdrop-blur-sm rounded-tl-md border border-border/50" 
                      : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-md shadow-lg shadow-primary/20"
                  }`}>
                    {msg.is_admin && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <HeadphonesIcon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary">فريق الدعم</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <AttachmentDisplay attachments={msg.attachments} />
                    )}
                    <p className={`text-xs mt-3 flex items-center gap-1 ${msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                      <Clock className="w-3 h-3" />
                      {formatDate(msg.created_at)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        {selectedTicket?.status !== "closed" ? (
          <div className="space-y-3">
            {/* File Attachments */}
            {user && selectedTicket && (
              <FileAttachment
                userId={user.id}
                ticketId={selectedTicket.id}
                attachments={messageAttachments}
                onAttachmentsChange={setMessageAttachments}
                disabled={isSubmitting}
              />
            )}
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="اكتب رسالتك..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="bg-secondary/50 border-border/50 pr-4 pl-12 h-12 rounded-xl"
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSubmitting || (!newMessage.trim() && messageAttachments.length === 0)}
                  size="icon"
                  className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </motion.div>
            </div>
            {errors.message && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.message}
              </motion.p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-4 bg-muted/50 rounded-xl">
            <Shield className="w-4 h-4" />
            <span>هذه التذكرة مغلقة</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ClientDashboardLayout>
      <motion.div 
        className="space-y-6 px-1" 
        dir="rtl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col gap-4 md:flex-row md:items-center justify-between"
          variants={itemVariants}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            >
              <HeadphonesIcon className="w-7 h-7 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">الدعم الفني</h1>
              <p className="text-sm text-muted-foreground">نحن هنا لمساعدتك على مدار الساعة</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              className="bg-gradient-to-l from-primary to-primary/80 hover:opacity-90 h-12 text-base w-full md:w-auto px-6 rounded-xl shadow-lg shadow-primary/20"
              onClick={() => setShowNewTicket(true)}
            >
              <Plus className="w-5 h-5 ms-2" />
              تذكرة جديدة
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-3"
          variants={itemVariants}
        >
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="border-border/30 overflow-hidden relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardContent className="p-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <motion.div 
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <stat.icon className="w-full h-full text-white" />
                    </motion.div>
                    <div>
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tickets List */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/30 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">التذاكر السابقة</h2>
              </div>
              <Badge variant="secondary" className="rounded-full">{tickets.length}</Badge>
            </div>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : tickets.length === 0 ? (
                <motion.div 
                  className="text-center py-16 px-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <HeadphonesIcon className="w-20 h-20 mx-auto mb-6 text-muted-foreground/20" />
                  </motion.div>
                  <h3 className="font-semibold text-lg mb-2">لا توجد تذاكر حالياً</h3>
                  <p className="text-sm text-muted-foreground mb-6">ابدأ محادثة جديدة مع فريق الدعم</p>
                  <Button onClick={() => setShowNewTicket(true)} className="rounded-xl">
                    <Plus className="w-4 h-4 ms-2" />
                    إنشاء تذكرة
                  </Button>
                </motion.div>
              ) : (
                <div className="divide-y divide-border/30">
                  <AnimatePresence>
                    {tickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: "hsl(var(--secondary)/0.5)" }}
                        className="p-4 cursor-pointer transition-colors group"
                        onClick={() => openTicketChat(ticket)}
                      >
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <MessageCircle className="w-6 h-6 text-primary" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{ticket.subject}</p>
                              {ticket.status === "open" && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                          </div>
                          <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${getPriorityStyles(ticket.priority)}`}>
                                {getPriorityLabel(ticket.priority)}
                              </Badge>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(ticket.status)}`}>
                                {getStatusIcon(ticket.status)}
                                {getStatusLabel(ticket.status)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(ticket.created_at)}
                            </span>
                          </div>
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ x: -4 }}
                          >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </div>
                        <div className="sm:hidden flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                          <Badge variant="outline" className={`text-xs ${getPriorityStyles(ticket.priority)}`}>
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                          <span className="text-xs text-muted-foreground mr-auto">{formatDate(ticket.created_at)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* New Ticket Sheet */}
        <Sheet open={showNewTicket} onOpenChange={setShowNewTicket}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
            <SheetHeader className="p-6 border-b border-border/50">
              <SheetTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                تذكرة جديدة
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">الموضوع</label>
                  <Input 
                    placeholder="أدخل موضوع التذكرة" 
                    className="bg-secondary/50 h-12 rounded-xl"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                  {errors.subject && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-2"
                    >
                      {errors.subject}
                    </motion.p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-3 block">الأولوية</label>
                  <Select 
                    value={newTicket.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") => setNewTicket({ ...newTicket, priority: value })}
                  >
                    <SelectTrigger className="bg-secondary/50 h-12 rounded-xl">
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
                  <label className="text-sm font-medium mb-3 block">الرسالة</label>
                  <Textarea 
                    placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..." 
                    className="bg-secondary/50 min-h-40 rounded-xl resize-none"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                  {errors.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-2"
                    >
                      {errors.description}
                    </motion.p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 h-12 rounded-xl"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    className="flex-1 h-12 rounded-xl bg-gradient-to-l from-primary to-primary/80 shadow-lg shadow-primary/20"
                    onClick={handleCreateTicket}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ms-2" />
                        إرسال التذكرة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Ticket Chat Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent side={isMobile ? "bottom" : "right"} className={`${isMobile ? "h-[95vh] rounded-t-3xl" : "w-full sm:max-w-lg"} p-0`}>
            {selectedTicket && <ChatContent />}
          </SheetContent>
        </Sheet>
      </motion.div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;
