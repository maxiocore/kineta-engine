import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeadphonesIcon, 
  MessageCircle, 
  Clock, 
  CheckCircle,
  Inbox,
  Sparkles,
  Filter,
  Users,
  Zap,
  ChevronLeft,
  Hash,
  Ticket,
  AlertCircle,
  Search,
  Loader2,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
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

const AdminSupport = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  
  const {
    tickets,
    selectedTicket,
    messages,
    stats,
    cannedResponses,
    isLoading,
    isMessagesLoading,
    sendMessage,
    updateTicketStatus,
    selectTicket
  } = useSupportSystem(true); // true = isAdmin

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statsData = [
    { label: "إجمالي التذاكر", value: stats.total, icon: Inbox, gradient: "from-primary to-cyan-500", bg: "bg-primary/10" },
    { label: "مفتوحة", value: stats.open, icon: MessageCircle, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10" },
    { label: "قيد المعالجة", value: stats.inProgress, icon: Clock, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10" },
    { label: "تم الحل", value: stats.resolved + stats.closed, icon: CheckCircle, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10" },
  ];

  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!selectedTicket) return;
    await sendMessage(selectedTicket.id, message, attachments || []);
  };

  const handleStatusChange = async (status: SupportTicket['status']) => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
  };

  const TicketsList = () => (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className={cn(
              "relative overflow-hidden border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
              stat.bg
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    `bg-gradient-to-br ${stat.gradient}`
                  )}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-border/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في التذاكر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-secondary/50"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-secondary/50 h-10">
                <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
                <TabsTrigger value="open" className="text-xs">مفتوح</TabsTrigger>
                <TabsTrigger value="in_progress" className="text-xs">قيد المعالجة</TabsTrigger>
                <TabsTrigger value="resolved" className="text-xs">تم الحل</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">لا توجد تذاكر</h3>
            <p className="text-sm text-muted-foreground">لا توجد تذاكر تطابق معايير البحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket, index) => (
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
                onClick={() => selectTicket(ticket)}
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

  return (
    <AdminDashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">الدعم الفني</h1>
              <p className="text-sm text-muted-foreground">إدارة تذاكر الدعم والتواصل مع العملاء</p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <TicketsList />

        {/* Chat Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={(open) => !open && selectTicket(null)}>
          <SheetContent side="left" className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>محادثة التذكرة</SheetTitle>
            </SheetHeader>
            {selectedTicket && (
              <ChatInterface
                ticket={selectedTicket}
                messages={messages}
                isLoading={isMessagesLoading}
                cannedResponses={cannedResponses}
                isAdmin={true}
                currentUserId={user?.id}
                onSendMessage={handleSendMessage}
                onBack={() => selectTicket(null)}
                onStatusChange={handleStatusChange}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSupport;
