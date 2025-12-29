import { motion } from 'framer-motion';
import { MessageCircle, Clock, CheckCircle, Hash, Sparkles, Shield, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SupportTicket, getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatRelativeTime } from '@/hooks/useSupportSystem';
import { cn } from '@/lib/utils';

interface TicketCardProps { ticket: SupportTicket; isSelected?: boolean; onClick?: () => void; }

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open': return <Sparkles className="w-3.5 h-3.5" />;
    case 'in_progress': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'closed': return <Shield className="w-3.5 h-3.5" />;
    default: return <MessageCircle className="w-3.5 h-3.5" />;
  }
};

export const TicketCard = ({ ticket, isSelected, onClick }: TicketCardProps) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick}
    className={cn("p-4 rounded-xl border cursor-pointer transition-all duration-200", isSelected ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5" : "bg-card hover:bg-accent/50 border-border/50 hover:border-primary/20")}>
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-sm truncate">{ticket.subject}</h4>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
      <div className="flex items-center flex-wrap gap-2">
        {ticket.ticket_number && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono"><Hash className="w-3 h-3" />{ticket.ticket_number}</span>}
        <Badge variant="outline" className={cn("text-xs gap-1", getStatusColor(ticket.status))}>{getStatusIcon(ticket.status)}{getStatusLabel(ticket.status)}</Badge>
        <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>{getPriorityLabel(ticket.priority)}</Badge>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{formatRelativeTime(ticket.created_at)}</span>
    </div>
  </motion.div>
);
