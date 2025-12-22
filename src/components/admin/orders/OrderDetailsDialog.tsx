import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Clock, 
  User, 
  Package, 
  LinkIcon, 
  Copy, 
  ExternalLink,
  Save,
  History,
  FileText,
  RefreshCw,
  Send,
  Bot,
  UserCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { getStatusConfig, statusConfig } from "./OrderRow";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  quantity: number | null;
  link: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  external_order_id: string | null;
  external_status: string | null;
  service: { id: string; name: string; category: string } | null;
  profile: { full_name: string | null; email: string | null } | null;
}

interface OrderHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
  changed_by: string;
}

interface OrderDetailsDialogProps {
  order: Order | null;
  orderHistory: OrderHistory[];
  open: boolean;
  onClose: () => void;
  onSave: (orderId: string, status: string, adminNotes: string) => void;
  saving: boolean;
}

const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
}));

const OrderDetailsDialog = ({
  order,
  orderHistory,
  open,
  onClose,
  onSave,
  saving,
}: OrderDetailsDialogProps) => {
  const [newStatus, setNewStatus] = useState(order?.status || "");
  const [adminNotes, setAdminNotes] = useState(order?.admin_notes || "");
  const [showHistory, setShowHistory] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendToProvider = async () => {
    if (!order) return;
    
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-order', {
        body: {
          orderId: order.id,
          serviceId: order.service?.id,
          link: order.link,
          quantity: order.quantity
        }
      });

      if (error) {
        toast.error("فشل إرسال الطلب للمزود");
        console.error('Resend error:', error);
      } else {
        toast.success("تم إرسال الطلب للمزود بنجاح");
        console.log('Resend response:', data);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الإرسال");
      console.error('Resend exception:', err);
    } finally {
      setResending(false);
    }
  };

  // Update state when order changes
  if (order && newStatus !== order.status && !saving) {
    setNewStatus(order.status);
    setAdminNotes(order.admin_notes || "");
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  if (!order) return null;

  const config = getStatusConfig(order.status);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary" />
              تفاصيل الطلب
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5 h-8 text-xs"
            >
              <History className="w-3.5 h-3.5" />
              السجل
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 space-y-4">
            {/* Order Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => copyToClipboard(order.order_number)}
                  className="font-mono text-lg font-bold hover:text-primary transition-colors flex items-center gap-2"
                >
                  {order.order_number}
                  <Copy className="w-4 h-4 opacity-50" />
                </button>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs gap-1.5",
                    config.bgColor, 
                    config.textColor, 
                    config.borderColor
                  )}
                >
                  <config.icon className="w-3.5 h-3.5" />
                  {config.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs">العميل</span>
                  </div>
                  <p className="font-medium truncate">
                    {order.profile?.full_name || order.profile?.email || "غير معروف"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">التاريخ</span>
                  </div>
                  <p className="font-medium">
                    {format(new Date(order.created_at), "d MMM yyyy", { locale: ar })}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/40">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-3.5 h-3.5" />
                  <span className="text-xs">الخدمة</span>
                </div>
                <p className="font-medium text-sm">{order.service?.name || "غير محدد"}</p>
              </div>

              {order.link && (
                <div className="p-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="text-xs">الرابط</span>
                    </div>
                    <a 
                      href={order.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      فتح <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{order.link}</p>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm text-muted-foreground">السعر الإجمالي</span>
                <span className="text-lg font-bold">{order.total_price.toFixed(2)} ر.س</span>
              </div>

              {order.quantity && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الكمية</span>
                  <span className="font-medium">{order.quantity.toLocaleString()}</span>
                </div>
              )}

              {/* Provider Status Section */}
              <div className="p-3 rounded-lg bg-secondary/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Send className="w-3.5 h-3.5" />
                    <span className="text-xs">حالة المزود</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendToProvider}
                    disabled={resending}
                    className="h-7 text-xs gap-1.5"
                  >
                    <RefreshCw className={cn("w-3 h-3", resending && "animate-spin")} />
                    {resending ? "جاري الإرسال..." : "إعادة إرسال للمزود"}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">رقم الطلب الخارجي:</span>
                  <span className="font-mono font-medium">{order.external_order_id || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الحالة الخارجية:</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      order.external_status === 'Completed' && "bg-green-500/10 text-green-600 border-green-500/30",
                      order.external_status === 'In progress' && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                      order.external_status === 'Pending' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                      order.external_status === 'Partial' && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                      order.external_status === 'Canceled' && "bg-red-500/10 text-red-600 border-red-500/30",
                      !order.external_status && "bg-muted text-muted-foreground"
                    )}
                  >
                    {order.external_status || "غير مرسل"}
                  </Badge>
                </div>
              </div>

              {order.notes && (
                <div className="p-3 rounded-lg bg-secondary/40">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="text-xs">ملاحظات العميل</span>
                  </div>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Edit Section */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">تغيير الحالة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">ملاحظات الإدارة</Label>
                <Textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات..."
                  className="min-h-[80px] text-sm"
                />
              </div>
            </div>

            {/* History Section */}
            <AnimatePresence>
              {showHistory && orderHistory.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">سجل التغييرات</Label>
                    <div className="space-y-2">
                      {orderHistory.slice(0, 10).map((item) => {
                        const newConfig = getStatusConfig(item.new_status);
                        const isAutoUpdate = item.changed_by === '00000000-0000-0000-0000-000000000000';
                        const oldConfig = item.old_status ? getStatusConfig(item.old_status) : null;
                        
                        return (
                          <div key={item.id} className="p-2.5 rounded-lg bg-secondary/30 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {oldConfig && (
                                  <>
                                    <Badge variant="outline" className={cn("text-[10px]", oldConfig.bgColor, oldConfig.textColor)}>
                                      {oldConfig.label}
                                    </Badge>
                                    <span className="text-muted-foreground text-[10px]">←</span>
                                  </>
                                )}
                                <Badge variant="outline" className={cn("text-[10px]", newConfig.bgColor, newConfig.textColor)}>
                                  {newConfig.label}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground text-[10px]">
                                {format(new Date(item.created_at), "d MMM HH:mm", { locale: ar })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {isAutoUpdate ? (
                                <Badge variant="secondary" className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                  <Bot className="w-3 h-3" />
                                  تحديث تلقائي
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                  <UserCircle className="w-3 h-3" />
                                  تحديث يدوي
                                </Badge>
                              )}
                              {item.notes && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button 
            onClick={() => onSave(order.id, newStatus, adminNotes)} 
            disabled={saving}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
