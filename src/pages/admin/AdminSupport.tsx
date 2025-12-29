import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeadphonesIcon, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Send,
  User,
  AlertCircle,
  Search,
  Loader2,
  Inbox,
  MessageSquare,
  Sparkles,
  Shield,
  Filter,
  TrendingUp,
  Users,
  Zap,
  ChevronLeft,
  Hash,
  Ticket
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { z } from "zod";
import { FileAttachment, AttachmentDisplay } from "@/components/support/FileAttachment";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

const messageSchema = z.object({
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(1000, "الرسالة يجب أن تكون أقل من 1000 حرف"),
});

interface TicketType {
  id: string;
  user_id: string;
  ticket_number: string | null;
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
  attachments?: Attachment[];
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    open: "مفتوح",
    in_progress: "قيد المعالجة",
    resolved: "تم الحل",
    closed: "مغلق",
  };
  return map[status] || status;
};

const getStatusStyles = (status: string) => {
  const map: Record<string, string> = {
    open: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    resolved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    closed: "bg-muted text-muted-foreground border-muted",
  };
  return map[status] || "bg-muted text-muted-foreground border-muted";
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
  const map: Record<string, string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "عاجلة",
  };
  return map[priority] || priority;
};

const getPriorityStyles = (priority: string) => {
  const map: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    urgent: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
  };
  return map[priority] || "bg-muted text-muted-foreground";
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
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const AdminSupport = () => {
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [messageAttachments, setMessageAttachments] = useState<Attachment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();

    const channel: RealtimeChannel = supabase
      .channel('admin-support-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          fetchTickets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
        },
        () => {
          if (selectedTicket) {
            fetchMessages(selectedTicket.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket]);

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

  const handleSendMessage = async () => {
    const result = messageSchema.safeParse({ message: newMessage });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setError(null);

    if (!user || !selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert([{
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_admin: true,
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

  const handleUpdateStatus = async (ticketId: string, newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);
      
      if (error) throw error;
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة التذكرة بنجاح",
      });
      
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const openTicketChat = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const statsData = [
    { label: "إجمالي التذاكر", value: tickets.length, icon: Inbox, gradient: "from-primary to-cyan-500", bg: "bg-primary/10" },
    { label: "مفتوحة", value: openCount, icon: MessageCircle, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
    { label: "قيد المعالجة", value: inProgressCount, icon: Clock, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
    { label: "تم الحل", value: resolvedCount, icon: CheckCircle, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10" },
  ];

  const ChatContent = () => (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <User className="w-6 h-6 text-primary-foreground" />
          </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{selectedTicket?.subject}</h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {selectedTicket?.ticket_number && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground">
                    <Hash className="w-3 h-3" />
                    {selectedTicket.ticket_number}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">ID: {selectedTicket?.user_id.slice(0, 8)}...</span>
              </div>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select 
            value={selectedTicket?.status} 
            onValueChange={(value: "open" | "in_progress" | "resolved" | "closed") => {
              if (selectedTicket) handleUpdateStatus(selectedTicket.id, value);
            }}
          >
            <SelectTrigger className={`w-36 h-9 text-xs border ${getStatusStyles(selectedTicket?.status || "open")}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">مفتوح</SelectItem>
              <SelectItem value="in_progress">قيد المعالجة</SelectItem>
              <SelectItem value="resolved">تم الحل</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className={`text-xs ${getPriorityStyles(selectedTicket?.priority || "medium")}`}>
            {getPriorityLabel(selectedTicket?.priority || "medium")}
          </Badge>
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
              <div className="bg-secondary/80 backdrop-blur-sm rounded-2xl rounded-tr-md p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">العميل</span>
                </div>
                <p className="text-sm leading-relaxed">{selectedTicket?.description}</p>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedTicket && formatDate(selectedTicket.created_at)}
                </p>
              </div>
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
                transition={{ delay: index * 0.05 }}
              >
                <div className="max-w-[85%] relative">
                  <div className={`rounded-2xl p-4 ${
                    msg.is_admin 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tl-md shadow-lg shadow-primary/20" 
                      : "bg-secondary/80 backdrop-blur-sm rounded-tr-md border border-border/50"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.is_admin ? "bg-primary-foreground/20" : "bg-secondary"
                      }`}>
                        {msg.is_admin ? (
                          <HeadphonesIcon className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${msg.is_admin ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {msg.is_admin ? "فريق الدعم" : "العميل"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <AttachmentDisplay attachments={msg.attachments} />
                    )}
                    <p className={`text-xs mt-3 flex items-center gap-1 ${
                      msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}>
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
              <div className="relative flex-1 min-w-0">
                <Input
                  placeholder="اكتب ردك للعميل..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="bg-secondary/50 border-border/50 px-4 h-12 rounded-xl w-full"
                  dir="rtl"
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
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {error}
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
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        dir="rtl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            >
              <HeadphonesIcon className="w-7 h-7 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">إدارة الدعم الفني</h1>
              <p className="text-sm text-muted-foreground">إدارة تذاكر الدعم والرد على العملاء</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {openCount} تحتاج رد
            </Badge>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
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
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <stat.icon className="w-full h-full text-white" />
                    </motion.div>
                    <div className="min-w-0">
                      <motion.p 
                        className="text-2xl font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث في التذاكر..." 
                    className="pr-10 bg-secondary/50 border-border/50 h-11 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                  <TabsList className="w-full sm:w-auto h-11 p-1 bg-secondary/50">
                    <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-lg">الكل</TabsTrigger>
                    <TabsTrigger value="open" className="flex-1 sm:flex-none rounded-lg">مفتوحة</TabsTrigger>
                    <TabsTrigger value="in_progress" className="flex-1 sm:flex-none rounded-lg">قيد المعالجة</TabsTrigger>
                    <TabsTrigger value="resolved" className="flex-1 sm:flex-none rounded-lg">تم الحل</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets List */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/30 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">تذاكر الدعم</h2>
              </div>
              <Badge variant="secondary" className="rounded-full">{filteredTickets.length}</Badge>
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
              ) : filteredTickets.length === 0 ? (
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
                  <h3 className="font-semibold text-lg mb-2">لا توجد تذاكر</h3>
                  <p className="text-sm text-muted-foreground">لم يتم العثور على تذاكر مطابقة للفلتر</p>
                </motion.div>
              ) : (
                <div className="divide-y divide-border/30">
                  <AnimatePresence>
                    {filteredTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: "hsl(var(--secondary)/0.5)" }}
                        className="p-4 cursor-pointer transition-colors group"
                        onClick={() => openTicketChat(ticket)}
                      >
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <User className="w-6 h-6 text-primary" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {ticket.ticket_number && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground">
                                  <Hash className="w-3 h-3" />
                                  {ticket.ticket_number}
                                </span>
                              )}
                              <p className="font-semibold truncate">{ticket.subject}</p>
                              {ticket.status === "open" && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                              {ticket.priority === "urgent" && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">عاجل</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                          </div>
                          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
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
                            whileHover={{ x: 4 }}
                          >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </div>
                        <div className="md:hidden flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
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

        {/* Ticket Chat Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent side={isMobile ? "bottom" : "right"} className={`${isMobile ? "h-[95vh] rounded-t-3xl" : "w-full sm:max-w-xl"} p-0`}>
            {selectedTicket && <ChatContent />}
          </SheetContent>
        </Sheet>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminSupport;
