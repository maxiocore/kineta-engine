import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion } from "framer-motion";
import { 
  HeadphonesIcon, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Send,
  User,
  AlertCircle,
  Search,
  Filter
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
import { useState, useEffect } from "react";
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
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

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

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate stats
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">إدارة الدعم الفني</h1>
          <p className="text-muted-foreground mt-1">إدارة تذاكر الدعم والرد على العملاء</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "إجمالي التذاكر", value: tickets.length.toString(), icon: HeadphonesIcon, color: "from-primary to-primary/70" },
            { label: "التذاكر المفتوحة", value: openCount.toString(), icon: MessageCircle, color: "from-success to-emerald-500" },
            { label: "قيد المعالجة", value: inProgressCount.toString(), icon: Clock, color: "from-warning to-orange-500" },
            { label: "تم الحل", value: resolvedCount.toString(), icon: CheckCircle, color: "from-blue-500 to-cyan-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث في التذاكر..." 
                  className="pr-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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

        {/* Tickets List */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5" />
              تذاكر الدعم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HeadphonesIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تذاكر</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => openTicketChat(ticket)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
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
                      <span className="text-sm text-muted-foreground hidden lg:block">{formatDate(ticket.created_at)}</span>
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
              <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>{selectedTicket?.subject}</span>
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedTicket?.status} 
                    onValueChange={(value: "open" | "in_progress" | "resolved" | "closed") => {
                      if (selectedTicket) handleUpdateStatus(selectedTicket.id, value);
                    }}
                  >
                    <SelectTrigger className={`w-32 h-8 text-xs ${getStatusStyles(selectedTicket?.status || "open")}`}>
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
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Original Description */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-secondary/50 rounded-2xl rounded-tr-sm p-4">
                  <p className="text-xs font-medium text-primary mb-1">العميل</p>
                  <p>{selectedTicket?.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{selectedTicket && formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>
              
              {/* Messages */}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.is_admin 
                      ? "bg-primary text-primary-foreground rounded-tl-sm" 
                      : "bg-secondary/50 rounded-tr-sm"
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${msg.is_admin ? "text-primary-foreground/80" : "text-primary"}`}>
                      {msg.is_admin ? "فريق الدعم" : "العميل"}
                    </p>
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-2 ${msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
                  placeholder="اكتب ردك..."
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
            {error && (
              <p className="text-sm text-destructive">{error}</p>
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
    </AdminDashboardLayout>
  );
};

export default AdminSupport;
