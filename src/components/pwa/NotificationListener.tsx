import { useEffect, useRef, useCallback, useState } from 'react';
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

interface AppNotification {
  id: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  image_url?: string;
  action_url?: string;
}

export const NotificationListener = () => {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const showBrowserNotification = useCallback(async (title: string, body: string, url?: string, icon?: string) => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('[NotificationListener] Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('[NotificationListener] Notification permission not granted:', Notification.permission);
      return;
    }

    // Check if running as standalone PWA (required for iOS)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    console.log('[NotificationListener] Showing notification:', { title, isStandalone, isIOS });

    try {
      // Use service worker notification (works on iOS PWA and other platforms)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          body,
          icon: icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          tag: `notification-${Date.now()}`,
          data: { url: url || '/dashboard/notifications' },
          requireInteraction: !isIOS, // iOS doesn't support requireInteraction
          silent: false,
        });
        
        console.log('[NotificationListener] Service worker notification shown successfully');
      } else {
        // Fallback to regular notification (won't work on iOS)
        const notification = new Notification(title, {
          body,
          icon: icon || '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          tag: `notification-${Date.now()}`,
        });
        
        notification.onclick = () => {
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notification.close();
        };
        
        console.log('[NotificationListener] Regular notification shown');
      }
    } catch (error) {
      console.error('[NotificationListener] Error showing notification:', error);
    }
  }, []);

  // Listen to user-specific notifications
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
            action: notification.related_order_id ? {
              label: 'عرض',
              onClick: () => {
                window.location.href = `/dashboard/orders/${notification.related_order_id}`;
              },
            } : undefined,
          });

          // Show browser push notification
          const url = notification.related_order_id 
            ? `/dashboard/orders/${notification.related_order_id}`
            : '/dashboard/notifications';
          
          await showBrowserNotification(notification.title, notification.message, url);
        }
      )
      .subscribe((status) => {
        console.log('NotificationListener: User notifications subscription status:', status);
      });

    return () => {
      console.log('NotificationListener: Cleaning up user subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, showBrowserNotification]);

  // Listen to app-wide broadcast notifications
  useEffect(() => {
    if (!user) return;

    console.log('NotificationListener: Setting up app notifications subscription');

    appChannelRef.current = supabase
      .channel('app-notifications-broadcast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
        },
        async (payload) => {
          console.log('NotificationListener: Received app notification:', payload);
          const notification = payload.new as AppNotification;
          
          // Check if notification is for this user
          if (notification.type === 'all' || !notification.type) {
            // Show in-app toast
            toast(notification.title_ar || notification.title, {
              description: notification.message_ar || notification.message,
              duration: 8000,
            });

            // Show browser notification
            await showBrowserNotification(
              notification.title_ar || notification.title,
              notification.message_ar || notification.message,
              notification.action_url || '/dashboard/notifications',
              notification.image_url
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('NotificationListener: App notifications subscription status:', status);
      });

    return () => {
      console.log('NotificationListener: Cleaning up app subscription');
      if (appChannelRef.current) {
        supabase.removeChannel(appChannelRef.current);
      }
    };
  }, [user, showBrowserNotification]);

  return null;
};

export default NotificationListener;
