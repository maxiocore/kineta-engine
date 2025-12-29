import { motion, AnimatePresence } from "framer-motion";
import { HeadphonesIcon, Plus, Loader2, Inbox, ArrowLeft, Paperclip, X, FileText, Image as ImageIcon, ShoppingCart, MessageSquare, AlertTriangle, Banknote, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useSupportSystem, SupportTicket, TicketCategory, ticketCategories, Attachment } from "@/hooks/useSupportSystem";
import { ModernChatInterface } from "@/components/support/ModernChatInterface";
import { SupportStats } from "@/components/support/SupportStats";
import { TicketCard } from "@/components/support/TicketCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const ticketSchema = z.object({
  subject: z.string().trim().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل"),
  description: z.string().trim().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.enum(["general", "orders", "issues", "financing", "payments"]),
});

type ViewMode = "list" | "new" | "chat";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'orders': return <ShoppingCart className="w-4 h-4" />;
    case 'issues': return <AlertTriangle className="w-4 h-4" />;
    case 'financing': return <Banknote className="w-4 h-4" />;
    case 'payments': return <CreditCard className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

const ClientSupport = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [errors, setErrors] = useState<{ subject?: string; description?: string }>({});
  const [newTicket, setNewTicket] = useState({ 
    subject: "", 
    description: "", 
    priority: "medium" as const,
    category: "general" as TicketCategory,
    related_order_id: "" as string
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userOrders, setUserOrders] = useState<{ id: string; order_number: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { tickets, selectedTicket, messages, stats, isLoading, isMessagesLoading, isSubmitting, createTicket, sendMessage, selectTicket, uploadAttachment } = useSupportSystem(false);

  // جلب طلبات المستخدم
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setUserOrders(data);
    };
    fetchUserOrders();
  }, [user]);

  // تحديث القسم تلقائياً عند اختيار طلب
  useEffect(() => {
    if (newTicket.related_order_id) {
      setNewTicket(prev => ({ ...prev, category: 'orders' }));
    }
  }, [newTicket.related_order_id]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'خطأ', description: 'حجم الملف يجب أن لا يتجاوز 10 ميجابايت', variant: 'destructive' });
          continue;
        }
        
        const attachment = await uploadAttachment(file);
        if (attachment) {
          setAttachments(prev => [...prev, attachment]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
      await createTicket({
        ...newTicket,
        related_order_id: newTicket.related_order_id || null,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      setNewTicket({ subject: "", description: "", priority: "medium", category: "general", related_order_id: "" });
      setAttachments([]);
      setViewMode("list");
    } catch {}
  };

  const handleSendMessage = async (message: string, msgAttachments?: Attachment[]) => {
    if (!selectedTicket) return;
    await sendMessage(selectedTicket.id, message, msgAttachments);
  };

  const openChat = (ticket: SupportTicket) => { selectTicket(ticket); setViewMode("chat"); };
  const goBack = () => { setViewMode("list"); selectTicket(null); setErrors({}); setAttachments([]); };

  const filteredTickets = categoryFilter === "all" 
    ? tickets 
    : tickets.filter(t => t.category === categoryFilter);

  return (
    <ClientDashboardLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {viewMode === "list" && (
          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <HeadphonesIcon className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">الدعم الفني</h1>
                <p className="text-sm text-muted-foreground">نحن هنا لمساعدتك على مدار الساعة</p>
              </div>
            </div>

            <SupportStats stats={stats} />

            {/* زر إنشاء تذكرة */}
            <Button onClick={() => setViewMode("new")} className="w-full h-14 rounded-xl bg-gradient-to-l from-primary to-primary/80 shadow-lg shadow-primary/20 text-lg">
              <Plus className="w-6 h-6 ml-2" />تذكرة جديدة
            </Button>

            {/* فلتر الأقسام */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className="rounded-full"
              >
                الكل ({tickets.length})
              </Button>
              {ticketCategories.map(cat => {
                const count = tickets.filter(t => t.category === cat.value).length;
                return (
                  <Button
                    key={cat.value}
                    variant={categoryFilter === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn("rounded-full gap-1", categoryFilter !== cat.value && cat.color)}
                  >
                    {getCategoryIcon(cat.value)}
                    {cat.label} ({count})
                  </Button>
                );
              })}
            </div>

            {/* قائمة التذاكر */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredTickets.length === 0 ? (
              <Card className="border-border/30"><CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"><Inbox className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="font-medium mb-2">لا توجد تذاكر</h3>
                <p className="text-sm text-muted-foreground">
                  {categoryFilter === "all" ? "لم تقم بإنشاء أي تذاكر دعم بعد" : "لا توجد تذاكر في هذا القسم"}
                </p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">{filteredTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} onClick={() => openChat(ticket)} />)}</div>
            )}
          </motion.div>
        )}

        {viewMode === "new" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-border/30">
              <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Button variant="ghost" size="icon" onClick={goBack} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
                  <div><h2 className="text-xl font-bold">تذكرة جديدة</h2><p className="text-sm text-muted-foreground">أخبرنا كيف يمكننا مساعدتك</p></div>
                </div>

                {/* القسم */}
                <div>
                  <label className="block text-sm font-medium mb-2">القسم</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ticketCategories.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewTicket({ ...newTicket, category: cat.value })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          newTicket.category === cat.value 
                            ? "border-primary bg-primary/10" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {getCategoryIcon(cat.value)}
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* الموضوع */}
                <div>
                  <label className="block text-sm font-medium mb-2">الموضوع</label>
                  <Input 
                    placeholder="أدخل موضوع التذكرة..." 
                    value={newTicket.subject} 
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} 
                  />
                  {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                </div>

                {/* ربط بطلب (اختياري) */}
                <div>
                  <label className="block text-sm font-medium mb-2">ربط بطلب (اختياري)</label>
                  <Select 
                    value={newTicket.related_order_id} 
                    onValueChange={(v) => setNewTicket({ ...newTicket, related_order_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طلب لربطه بالتذكرة..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون ربط</SelectItem>
                      {userOrders.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* الأولوية */}
                <div>
                  <label className="block text-sm font-medium mb-2">الأولوية</label>
                  <Select value={newTicket.priority} onValueChange={(v: any) => setNewTicket({ ...newTicket, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="urgent">عاجلة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* الوصف */}
                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <Textarea 
                    placeholder="اشرح مشكلتك بالتفصيل..." 
                    value={newTicket.description} 
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} 
                    className="min-h-[120px]" 
                  />
                  {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
                </div>

                {/* المرفقات */}
                <div>
                  <label className="block text-sm font-medium mb-2">المرفقات (اختياري)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-12 border-dashed"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <Paperclip className="w-5 h-5 ml-2" />
                    )}
                    {isUploading ? 'جاري الرفع...' : 'إرفاق ملفات'}
                  </Button>

                  {/* عرض المرفقات */}
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          {att.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-orange-500" />
                          )}
                          <span className="text-sm flex-1 truncate">{att.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(att.size / 1024).toFixed(1)} KB
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* زر الإنشاء */}
                <Button onClick={handleCreateTicket} disabled={isSubmitting} className="w-full h-12 rounded-xl">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 ml-2" />إنشاء التذكرة</>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewMode === "chat" && selectedTicket && (
          <motion.div className="h-[calc(100vh-120px)]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-border/30 h-full overflow-hidden">
              <ModernChatInterface 
                ticket={selectedTicket} 
                messages={messages} 
                isLoading={isMessagesLoading} 
                isSubmitting={isSubmitting} 
                currentUserId={user?.id} 
                onSendMessage={handleSendMessage} 
                onBack={goBack}
                onUploadAttachment={uploadAttachment}
              />
            </Card>
          </motion.div>
        )}
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;
