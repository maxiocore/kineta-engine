import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  ArrowRight, 
  Loader2,
  ShoppingBag,
  HelpCircle,
  CreditCard,
  Settings,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketCategory } from '@/hooks/useSupportSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  service?: {
    name: string;
  };
}

interface NewTicketFormProps {
  categories: TicketCategory[];
  onSubmit: (data: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category_id?: string;
    related_order_id?: string;
  }) => Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  ShoppingBag: <ShoppingBag className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

export const NewTicketForm = ({
  categories,
  onSubmit,
  onBack,
  isSubmitting = false,
}: NewTicketFormProps) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [categoryId, setCategoryId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, service:services(name)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setOrders(data as Order[]);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!subject.trim() || subject.length < 5) {
      newErrors.subject = 'الموضوع يجب أن يكون 5 أحرف على الأقل';
    }
    if (!description.trim() || description.length < 10) {
      newErrors.description = 'الوصف يجب أن يكون 10 أحرف على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await onSubmit({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category_id: categoryId || undefined,
        related_order_id: orderId || undefined,
      });
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="shrink-0 rounded-xl hover:bg-secondary rtl-flip"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">تذكرة جديدة</h2>
          <p className="text-muted-foreground">أرسل استفسارك وسنرد عليك في أقرب وقت</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category selection */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label>اختر نوع الاستفسار</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCategoryId(cat.id)}
                  className={cn(
                    "p-4 rounded-xl border text-center transition-all",
                    categoryId === cat.id
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <div 
                    className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <span style={{ color: cat.color }}>
                      {iconMap[cat.icon] || <HelpCircle className="w-5 h-5" />}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{cat.name_ar}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Related order */}
        {orders.length > 0 && (
          <div className="space-y-2">
            <Label>ربط بطلب (اختياري)</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر طلباً لربطه بالتذكرة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون ربط</SelectItem>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      <span>#{order.order_number}</span>
                      <span className="text-muted-foreground">
                        - {order.service?.name || 'خدمة'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">الموضوع *</Label>
          <Input
            id="subject"
            placeholder="اكتب موضوع استفسارك..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={errors.subject ? 'border-destructive' : ''}
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">تفاصيل الاستفسار *</Label>
          <Textarea
            id="description"
            placeholder="اشرح استفسارك بالتفصيل..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label>الأولوية</Label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { value: 'low', label: 'منخفضة', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
              { value: 'medium', label: 'متوسطة', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
              { value: 'high', label: 'عالية', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
              { value: 'urgent', label: 'عاجلة', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
            ] as const).map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={cn(
                  "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                  priority === p.value
                    ? `${p.color} ring-2 ring-offset-2 ring-offset-background`
                    : "border-border/50 text-muted-foreground hover:border-primary/30"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              إرسال التذكرة
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
};
