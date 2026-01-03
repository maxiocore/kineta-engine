import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationPayload {
  title: string;
  message: string;
  type?: string;
  related_order_id?: string;
}

export const NotificationListener = () => {
  const { user } = useAuth();
  const { showNotification, permission, isSupported } = usePushNotifications();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user || permission !== 'granted' || !isSupported) return;

    // Subscribe to notifications table for this user
    channelRef.current = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as NotificationPayload;
          
          // Show push notification
          await showNotification(notification.title, {
            body: notification.message,
            tag: notification.related_order_id || 'general',
            data: {
              url: notification.related_order_id 
                ? `/dashboard/orders/${notification.related_order_id}`
                : '/dashboard/notifications',
            },
            requireInteraction: notification.type === 'order_status',
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, permission, isSupported, showNotification]);

  return null; // This is a background component
};

export default NotificationListener;
