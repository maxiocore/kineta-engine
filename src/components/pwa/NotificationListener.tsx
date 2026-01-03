import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type?: string;
  related_order_id?: string;
  created_at: string;
}

export const NotificationListener = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const showBrowserNotification = useCallback(async (title: string, body: string, url?: string) => {
    // Check if notifications are supported and permitted
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        // Try using service worker notification first
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            dir: 'rtl',
            lang: 'ar',
            tag: url || 'general',
            data: { url: url || '/dashboard/notifications' },
            requireInteraction: true,
          });
        } else {
          // Fallback to regular notification
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            dir: 'rtl',
            lang: 'ar',
          });
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('NotificationListener: No user logged in');
      return;
    }

    console.log('NotificationListener: Setting up realtime subscription for user:', user.id);

    // Subscribe to notifications table for this user
    channelRef.current = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('NotificationListener: Received new notification:', payload);
          const notification = payload.new as NotificationPayload;
          
          // Show in-app toast notification
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });

          // Show browser push notification
          const url = notification.related_order_id 
            ? `/dashboard/orders/${notification.related_order_id}`
            : '/dashboard/notifications';
          
          await showBrowserNotification(notification.title, notification.message, url);
        }
      )
      .subscribe((status) => {
        console.log('NotificationListener: Subscription status:', status);
      });

    return () => {
      console.log('NotificationListener: Cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, showBrowserNotification]);

  return null;
};

export default NotificationListener;
