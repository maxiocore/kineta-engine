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
  ArrowLeft,
  Loader2,
  Inbox,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().trim().min(1, "الرسالة مطلوبة").max(1000, "الرسالة يجب أن تكون أقل من 1000 حرف"),
});

interface Ticket {
  id: string;
  user_id: string;
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
    open: "bg-success/10 text-success border-success/20",
    in_progress: "bg-warning/10 text-warning border-warning/20",
    resolved: "bg-primary/10 text-primary border-primary/20",
    closed: "bg-muted text-muted-foreground border-muted",
  };
  return map[status] || "bg-muted text-muted-foreground border-muted";
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
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-warning/10 text-warning",
    urgent: "bg-destructive/10 text-destructive",
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();

    // Realtime subscription for tickets and messages
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
      setMessages(data || []);
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
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: newMessage.trim(),
        is_admin: true,
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

  const openTicketChat = (ticket: Ticket) => {
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
    { label: "إجمالي التذاكر", value: tickets.length, icon: HeadphonesIcon, gradient: "from-primary to-cyan-400", shadowColor: "shadow-primary/20" },
    { label: "التذاكر المفتوحة", value: openCount, icon: MessageCircle, gradient: "from-success to-emerald-400", shadowColor: "shadow-success/20" },
    { label: "قيد المعالجة", value: inProgressCount, icon: Clock, gradient: "from-warning to-orange-400", shadowColor: "shadow-warning/20" },
    { label: "تم الحل", value: resolvedCount, icon: CheckCircle, gradient: "from-accent to-pink-400", shadowColor: "shadow-accent/20" },
  ];

  return (
    <AdminDashboardLayout>
      <motion.div 
        className="space-y-4 sm:space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        dir="rtl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <HeadphonesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </motion.div>
              إدارة الدعم الفني
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">إدارة تذاكر الدعم والرد على العملاء</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className={`card-elevated border-border/30 ${stat.shadowColor} shadow-md`}>
                <CardContent className="p-2.5 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div 
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} p-2 sm:p-2.5 shadow-lg flex-shrink-0`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <stat.icon className="w-full h-full text-primary-foreground" />
                    </motion.div>
                    <div className="min-w-0">
                      <motion.p 
                        className="text-lg sm:text-2xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث في التذاكر..." 
                    className="pr-10 bg-secondary/50 border-border/50 h-9 sm:h-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-secondary/50 border-border/50 h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets List */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated border-border/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Inbox className="w-5 h-5 text-primary" />
                تذاكر الدعم
                <Badge variant="secondary" className="mr-2">{filteredTickets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <HeadphonesIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-lg">لا توجد تذاكر</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ x: -4 }}
                        className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/30 hover:border-primary/20 transition-all cursor-pointer group"
                        onClick={() => openTicketChat(ticket)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <motion.div 
                              className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20"
                              whileHover={{ scale: 1.1 }}
                            >
                              <User className="w-6 h-6 text-primary" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getPriorityStyles(ticket.priority)}>
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span className="text-xs text-muted-foreground hidden lg:flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(ticket.created_at)}
                            </span>
                            <motion.div
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ticket Chat Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b border-border/50">
              <DialogTitle className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold">{selectedTicket?.subject}</span>
                </div>
                <div className="flex items-center gap-2">
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
                  <Badge variant="outline" className={getPriorityStyles(selectedTicket?.priority || "medium")}>
                    {getPriorityLabel(selectedTicket?.priority || "medium")}
                  </Badge>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {/* Messages */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {/* Original Description */}
                <motion.div 
                  className="flex justify-end"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="max-w-[80%] bg-secondary/50 rounded-2xl rounded-tr-md p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">العميل</span>
                    </div>
                    <p className="text-sm">{selectedTicket?.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedTicket && formatDate(selectedTicket.created_at)}
                    </p>
                  </div>
                </motion.div>
                
                {/* Messages */}
                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <motion.div 
                      key={msg.id} 
                      className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.is_admin 
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tl-md shadow-lg shadow-primary/20" 
                          : "bg-secondary/50 rounded-tr-md border border-border/30"
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
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          <Clock className="w-3 h-3" />
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Send Message */}
            <div className="px-6 py-4 border-t border-border/50 bg-card/50">
              {selectedTicket?.status !== "closed" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="اكتب ردك..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="bg-secondary/50 border-border/50"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={isSubmitting}
                        className="bg-gradient-to-l from-primary to-cyan-500 shadow-lg shadow-primary/20"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>هذه التذكرة مغلقة</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default AdminSupport;
