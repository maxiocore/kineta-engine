import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  attachments: Attachment[];
  created_at: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export const useSupportSystem = (isAdmin = false) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, urgent: 0,
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('user_id', user.id);
      const { data, error } = await query;
      if (error) throw error;
      const typedData = (data || []) as SupportTicket[];
      setTickets(typedData);
      setStats({
        total: typedData.length,
        open: typedData.filter(t => t.status === 'open').length,
        inProgress: typedData.filter(t => t.status === 'in_progress').length,
        resolved: typedData.filter(t => t.status === 'resolved').length,
        closed: typedData.filter(t => t.status === 'closed').length,
        urgent: typedData.filter(t => t.priority === 'urgent').length,
      });
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في تحميل التذاكر', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setIsMessagesLoading(true);
    try {
      const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
      if (error) throw error;
      const typedData = (data || []).map(msg => ({
        ...msg,
        attachments: Array.isArray(msg.attachments) ? (msg.attachments as unknown as Attachment[]) : [],
        is_admin: msg.is_admin || false,
      })) as TicketMessage[];
      setMessages(typedData);
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في تحميل الرسائل', variant: 'destructive' });
    } finally {
      setIsMessagesLoading(false);
    }
  }, [toast]);

  const createTicket = async (data: { subject: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent' }) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase.from('support_tickets').insert({ user_id: user.id, ...data });
    if (error) throw error;
    await fetchTickets();
  };

  const sendMessage = async (ticketId: string, message: string, attachments: Attachment[] = []) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId, sender_id: user.id, message: message.trim(), is_admin: isAdmin,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
    });
    if (error) throw error;
    await fetchMessages(ticketId);
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (error) throw error;
    if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status });
    await fetchTickets();
  };

  const selectTicket = (ticket: SupportTicket | null) => {
    setSelectedTicket(ticket);
    if (ticket) fetchMessages(ticket.id);
    else setMessages([]);
  };

  useEffect(() => {
    if (!user) return;
    fetchTickets();
    const channel: RealtimeChannel = supabase.channel('support-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (payload) => {
        if (selectedTicket && payload.new.ticket_id === selectedTicket.id) fetchMessages(selectedTicket.id);
        fetchTickets();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedTicket?.id]);

  return { tickets, selectedTicket, messages, stats, isLoading, isMessagesLoading, fetchTickets, fetchMessages, createTicket, sendMessage, updateTicketStatus, selectTicket };
};

export const getStatusLabel = (status: string) => ({ open: 'مفتوح', in_progress: 'قيد المعالجة', resolved: 'تم الحل', closed: 'مغلق' }[status] || status);
export const getStatusColor = (status: string) => ({ open: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20', resolved: 'bg-blue-500/10 text-blue-500 border-blue-500/20', closed: 'bg-muted text-muted-foreground border-muted' }[status] || 'bg-muted text-muted-foreground');
export const getPriorityLabel = (priority: string) => ({ low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' }[priority] || priority);
export const getPriorityColor = (priority: string) => ({ low: 'bg-slate-500/10 text-slate-400 border-slate-500/20', medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20', high: 'bg-orange-500/10 text-orange-400 border-orange-500/20', urgent: 'bg-red-500/10 text-red-400 border-red-500/20' }[priority] || 'bg-muted text-muted-foreground');
export const formatRelativeTime = (date: string) => {
  const d = new Date(date); const now = new Date(); const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60)); const hours = Math.floor(diff / (1000 * 60 * 60)); const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (minutes < 1) return 'الآن'; if (minutes < 60) return `منذ ${minutes} دقيقة`; if (hours < 24) return `منذ ${hours} ساعة`; if (days === 1) return 'أمس'; if (days < 7) return `منذ ${days} أيام`; return d.toLocaleDateString('ar-SA');
};
