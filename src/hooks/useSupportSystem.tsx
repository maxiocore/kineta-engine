import { useState, useEffect, useCallback, useRef } from 'react';
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
  user_email?: string;
  user_name?: string;
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
  todayNew: number;
  avgResponseTime: string;
}

export const useSupportSystem = (isAdmin = false) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<TicketStats>({
    total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, urgent: 0,
    todayNew: 0, avgResponseTime: '0'
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // حساب الإحصائيات
  const calculateStats = useCallback((ticketsList: SupportTicket[]) => {
    const today = new Date().toDateString();
    const todayTickets = ticketsList.filter(t => 
      new Date(t.created_at).toDateString() === today
    );

    setStats({
      total: ticketsList.length,
      open: ticketsList.filter(t => t.status === 'open').length,
      inProgress: ticketsList.filter(t => t.status === 'in_progress').length,
      resolved: ticketsList.filter(t => t.status === 'resolved').length,
      closed: ticketsList.filter(t => t.status === 'closed').length,
      urgent: ticketsList.filter(t => t.priority === 'urgent').length,
      todayNew: todayTickets.length,
      avgResponseTime: '< 2h'
    });
  }, []);

  // جلب التذاكر
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // جلب بيانات المستخدمين للأدمن
      let enrichedTickets = data || [];
      
      if (isAdmin && enrichedTickets.length > 0) {
        const userIds = [...new Set(enrichedTickets.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.id, p]));
          enrichedTickets = enrichedTickets.map(ticket => ({
            ...ticket,
            user_email: profileMap.get(ticket.user_id)?.email,
            user_name: profileMap.get(ticket.user_id)?.full_name
          }));
        }
      }
      
      setTickets(enrichedTickets as SupportTicket[]);
      calculateStats(enrichedTickets as SupportTicket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل التذاكر', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, toast, calculateStats]);

  // جلب الرسائل
  const fetchMessages = useCallback(async (ticketId: string) => {
    setIsMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const typedData = (data || []).map(msg => ({
        ...msg,
        attachments: Array.isArray(msg.attachments) 
          ? (msg.attachments as unknown as Attachment[]) 
          : [],
        is_admin: msg.is_admin || false,
      })) as TicketMessage[];
      
      setMessages(typedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل الرسائل', variant: 'destructive' });
    } finally {
      setIsMessagesLoading(false);
    }
  }, [toast]);

  // إنشاء تذكرة جديدة
  const createTicket = async (data: { 
    subject: string; 
    description: string; 
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsSubmitting(true);
    try {
      const { data: newTicket, error } = await supabase
        .from('support_tickets')
        .insert({ 
          user_id: user.id, 
          subject: data.subject.trim(),
          description: data.description.trim(),
          priority: data.priority
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // إرسال إشعار بالبريد الإلكتروني للأدمن
      if (user.email) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: user.email,
              type: 'new_ticket',
              data: {
                ticketNumber: newTicket.ticket_number,
                subject: data.subject,
                priority: data.priority,
                userEmail: user.email,
                userName: user.user_metadata?.full_name || 'مستخدم'
              }
            }
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
        }
      }
      
      toast({ title: 'تم', description: 'تم إنشاء التذكرة بنجاح وسيتم الرد عليك قريباً' });
      await fetchTickets();
      
      return newTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء التذكرة', variant: 'destructive' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // إرسال رسالة
  const sendMessage = async (ticketId: string, message: string, attachments: Attachment[] = []) => {
    if (!user || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          message: message.trim(),
          is_admin: isAdmin,
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
        });
      
      if (error) throw error;
      
      // تحديث وقت التذكرة
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      // إرسال إشعار بالبريد
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const recipientEmail = isAdmin ? ticket.user_email : undefined;
        if (recipientEmail) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: recipientEmail,
                type: 'ticket_reply',
                data: {
                  ticketNumber: ticket.ticket_number,
                  subject: ticket.subject,
                  message: message.trim(),
                  isAdmin
                }
              }
            });
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        }
      }
      
      await fetchMessages(ticketId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'خطأ', description: 'فشل في إرسال الرسالة', variant: 'destructive' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // تحديث حالة التذكرة
  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const oldStatus = ticket?.status;
      
      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
      
      // إرسال إيميل للعميل بتحديث حالة التذكرة
      if (ticket && isAdmin && ticket.user_email) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: ticket.user_email,
              type: 'ticket_status_changed',
              data: {
                ticketNumber: ticket.ticket_number,
                subject: ticket.subject,
                oldStatus: oldStatus,
                newStatus: status
              }
            }
          });
        } catch (emailError) {
          console.error('Error sending status change email:', emailError);
        }
      }
      
      toast({ title: 'تم', description: 'تم تحديث حالة التذكرة' });
      await fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'خطأ', description: 'فشل في تحديث الحالة', variant: 'destructive' });
    }
  };

  // اختيار تذكرة
  const selectTicket = useCallback((ticket: SupportTicket | null) => {
    setSelectedTicket(ticket);
    if (ticket) {
      fetchMessages(ticket.id);
    } else {
      setMessages([]);
    }
  }, [fetchMessages]);

  // إعداد الاستماع للتحديثات اللحظية
  useEffect(() => {
    if (!user) return;
    
    fetchTickets();
    
    // إنشاء قناة للتحديثات اللحظية
    const channel = supabase
      .channel(`support-${isAdmin ? 'admin' : user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          ...(isAdmin ? {} : { filter: `user_id=eq.${user.id}` })
        },
        (payload) => {
          console.log('Ticket change:', payload);
          fetchTickets();
          
          // إظهار إشعار للتذاكر الجديدة
          if (payload.eventType === 'INSERT' && isAdmin) {
            toast({
              title: '🎫 تذكرة جديدة',
              description: `تم استلام تذكرة جديدة: ${(payload.new as any).subject}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
        },
        (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new as any;
          
          // تحديث الرسائل إذا كانت للتذكرة المحددة
          if (selectedTicket && newMsg.ticket_id === selectedTicket.id) {
            fetchMessages(selectedTicket.id);
          }
          
          // إشعار برسالة جديدة
          if ((isAdmin && !newMsg.is_admin) || (!isAdmin && newMsg.is_admin)) {
            toast({
              title: '💬 رسالة جديدة',
              description: 'تم استلام رد جديد على التذكرة',
            });
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, isAdmin, selectedTicket?.id, fetchTickets, fetchMessages, toast]);

  return { 
    tickets,
    selectedTicket,
    messages,
    stats,
    isLoading,
    isMessagesLoading,
    isSubmitting,
    fetchTickets,
    fetchMessages,
    createTicket,
    sendMessage,
    updateTicketStatus,
    selectTicket
  };
};

// دوال مساعدة للعرض
export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    open: 'جديد',
    in_progress: 'قيد المعالجة',
    resolved: 'تم الحل',
    closed: 'مغلق'
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    open: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    in_progress: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    resolved: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
    closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  };
  return colors[status] || 'bg-muted text-muted-foreground';
};

export const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  };
  return labels[priority] || priority;
};

export const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    urgent: 'bg-red-500/15 text-red-400 border-red-500/30'
  };
  return colors[priority] || 'bg-muted text-muted-foreground';
};

export const formatRelativeTime = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours < 24) return `منذ ${hours} س`;
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return d.toLocaleDateString('ar-SA');
};
