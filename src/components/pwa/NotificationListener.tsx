import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { showInAppNotification } from './InAppNotification';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
  const { status, isIOS, isStandalone } = usePushNotifications();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const appChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const canShowBrowserNotification = status === 'permission_granted';

  const showBrowserNotification = useCallback(async (
    title: string, 
    body: string, 
    url?: string, 
    icon?: string,
    tag?: string
  ) => {
    // Only show browser notifications if push is granted
    if (!canShowBrowserNotification) {
      console.log('[NotificationListener] Browser notification skipped - using in-app only');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        const notificationOptions: NotificationOptions = {
          body,
          icon: icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          tag: tag || `notification-${Date.now()}`,
          data: { url: url || '/dashboard/notifications' },
          requireInteraction: false,
          silent: false,
        };

        await registration.showNotification(title, notificationOptions);
        console.log('[NotificationListener] Browser notification shown');
      }
    } catch (error) {
      console.error('[NotificationListener] Error showing browser notification:', error);
    }
  }, [canShowBrowserNotification]);

  const handleNewNotification = useCallback(async (notification: NotificationPayload) => {
    console.log('[NotificationListener] Processing notification:', notification);

    const actionUrl = notification.related_order_id 
      ? `/dashboard/orders/${notification.related_order_id}`
      : '/dashboard/notifications';

    // Always show in-app notification (works everywhere)
    showInAppNotification({
      title: notification.title,
      message: notification.message,
      type: (notification.type as any) || 'general',
      actionUrl,
      duration: 6000,
    });

    // Also show browser push notification if supported
    await showBrowserNotification(
      notification.title, 
      notification.message, 
      actionUrl,
      undefined,
      `user-notif-${notification.id}`
    );
  }, [showBrowserNotification]);

  const handleAppNotification = useCallback(async (notification: AppNotification) => {
    console.log('[NotificationListener] Processing app notification:', notification);

    const title = notification.title_ar || notification.title;
    const message = notification.message_ar || notification.message;
    const actionUrl = notification.action_url || '/dashboard/notifications';

    // Always show in-app notification
    showInAppNotification({
      title,
      message,
      type: (notification.type as any) || 'announcement',
      imageUrl: notification.image_url,
      actionUrl,
      duration: 8000,
    });

    // Also show browser notification if supported
    await showBrowserNotification(
      title,
      message,
      actionUrl,
      notification.image_url,
      `app-notif-${notification.id}`
    );
  }, [showBrowserNotification]);

  // Listen to user-specific notifications
  useEffect(() => {
    if (!user) {
      console.log('[NotificationListener] No user logged in');
      return;
    }

    console.log('[NotificationListener] Setting up realtime subscription for user:', user.id);

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
        (payload) => {
          console.log('[NotificationListener] Received new notification:', payload);
          handleNewNotification(payload.new as NotificationPayload);
        }
      )
      .subscribe((status) => {
        console.log('[NotificationListener] User notifications subscription status:', status);
      });

    return () => {
      console.log('[NotificationListener] Cleaning up user subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, handleNewNotification]);

  // Listen to app-wide broadcast notifications
  useEffect(() => {
    if (!user) return;

    console.log('[NotificationListener] Setting up app notifications subscription');

    appChannelRef.current = supabase
      .channel('app-notifications-broadcast')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
        },
        (payload) => {
          console.log('[NotificationListener] Received app notification:', payload);
          const notification = payload.new as AppNotification;
          handleAppNotification(notification);
        }
      )
      .subscribe((status) => {
        console.log('[NotificationListener] App notifications subscription status:', status);
      });

    return () => {
      console.log('[NotificationListener] Cleaning up app subscription');
      if (appChannelRef.current) {
        supabase.removeChannel(appChannelRef.current);
      }
    };
  }, [user, handleAppNotification]);

  return null;
};

export default NotificationListener;
