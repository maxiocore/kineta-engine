import { motion } from 'framer-motion';
import { MessageCircle, Clock, CheckCircle, Hash, Sparkles, Shield, Loader2, User, Mail, ShoppingCart, AlertTriangle, Banknote, CreditCard, MessageSquare, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SupportTicket, getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatRelativeTime, getCategoryLabel, getCategoryColor } from '@/hooks/useSupportSystem';
import { cn } from '@/lib/utils';

interface TicketCardProps { 
  ticket: SupportTicket; 
  isSelected?: boolean; 
  onClick?: () => void;
  isAdmin?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <Sparkles className="w-3.5 h-3.5" />;
    case 'in_progress': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'closed': return <Shield className="w-3.5 h-3.5" />;
    default: return <MessageCircle className="w-3.5 h-3.5" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'orders': return <ShoppingCart className="w-3.5 h-3.5" />;
    case 'issues': return <AlertTriangle className="w-3.5 h-3.5" />;
    case 'financing': return <Banknote className="w-3.5 h-3.5" />;
    case 'payments': return <CreditCard className="w-3.5 h-3.5" />;
    default: return <MessageSquare className="w-3.5 h-3.5" />;
  }
};

export const TicketCard = ({ ticket, isSelected, onClick, isAdmin }: TicketCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    whileHover={{ scale: 1.01 }} 
    whileTap={{ scale: 0.99 }} 
    onClick={onClick}
    className={cn(
      "p-4 rounded-xl border cursor-pointer transition-all duration-200", 
      isSelected 
        ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5" 
        : "bg-card hover:bg-accent/50 border-border/50 hover:border-primary/20"
    )}
  >
    <div className="space-y-3">
      {/* العنوان والأولوية */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-sm truncate flex-1">{ticket.subject}</h4>
        {ticket.priority === 'urgent' && (
          <Badge variant="destructive" className="text-xs animate-pulse">عاجل</Badge>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
      
      {/* معلومات المستخدم للأدمن */}
      {isAdmin && (ticket.user_name || ticket.user_email) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
          <User className="w-3 h-3" />
          <span className="truncate">{ticket.user_name || 'مستخدم'}</span>
          {ticket.user_email && (
            <>
              <Mail className="w-3 h-3 mr-1" />
              <span className="truncate text-primary/70">{ticket.user_email}</span>
            </>
          )}
        </div>
      )}
      
      {/* رقم الطلب المرتبط */}
      {ticket.order_number && (
        <div className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-500 rounded-lg px-2 py-1.5">
          <ShoppingCart className="w-3 h-3" />
          <span>طلب مرتبط: {ticket.order_number}</span>
        </div>
      )}
      
      {/* الشارات */}
      <div className="flex items-center flex-wrap gap-2">
        {/* رقم التذكرة */}
        {ticket.ticket_number && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
            <Hash className="w-3 h-3" />{ticket.ticket_number}
          </span>
        )}
        
        {/* القسم */}
        <Badge variant="outline" className={cn("text-xs gap-1", getCategoryColor(ticket.category))}>
          {getCategoryIcon(ticket.category)}
          {getCategoryLabel(ticket.category)}
        </Badge>
        
        {/* الحالة */}
        <Badge variant="outline" className={cn("text-xs gap-1", getStatusColor(ticket.status))}>
          {getStatusIcon(ticket.status)}{getStatusLabel(ticket.status)}
        </Badge>
        
        {/* الأولوية */}
        <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
          {getPriorityLabel(ticket.priority)}
        </Badge>
      </div>
      
      {/* الوقت */}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />{formatRelativeTime(ticket.created_at)}
      </span>
    </div>
  </motion.div>
);
