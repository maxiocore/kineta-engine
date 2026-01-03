import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { showInAppNotification } from './InAppNotification';

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

  const showBrowserNotification = useCallback(async (
    title: string, 
    body: string, 
    url?: string, 
    icon?: string,
    tag?: string
  ) => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('[NotificationListener] Browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('[NotificationListener] Notification permission not granted:', Notification.permission);
      return;
    }

    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    console.log('[NotificationListener] Showing notification:', { title, isStandalone, isIOS });

    try {
      // Always use service worker for notifications (required for iOS PWA)
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

        // Add vibration for non-iOS
        if (!isIOS) {
          (notificationOptions as any).vibrate = [100, 50, 100];
          notificationOptions.requireInteraction = true;
        }

        await registration.showNotification(title, notificationOptions);
        console.log('[NotificationListener] Service worker notification shown successfully');
      }
    } catch (error) {
      console.error('[NotificationListener] Error showing notification:', error);
    }
  }, []);

  const handleNewNotification = useCallback(async (notification: NotificationPayload) => {
    console.log('[NotificationListener] Processing notification:', notification);

    // Show in-app notification (iOS-style toast)
    showInAppNotification({
      title: notification.title,
      message: notification.message,
      type: (notification.type as any) || 'general',
      actionUrl: notification.related_order_id 
        ? `/dashboard/orders/${notification.related_order_id}`
        : '/dashboard/notifications',
      duration: 6000,
    });

    // Show browser push notification
    const url = notification.related_order_id 
      ? `/dashboard/orders/${notification.related_order_id}`
      : '/dashboard/notifications';
    
    await showBrowserNotification(
      notification.title, 
      notification.message, 
      url,
      undefined,
      `user-notif-${notification.id}`
    );
  }, [showBrowserNotification]);

  const handleAppNotification = useCallback(async (notification: AppNotification) => {
    console.log('[NotificationListener] Processing app notification:', notification);

    // Show in-app notification (iOS-style toast)
    showInAppNotification({
      title: notification.title_ar || notification.title,
      message: notification.message_ar || notification.message,
      type: (notification.type as any) || 'announcement',
      imageUrl: notification.image_url,
      actionUrl: notification.action_url || '/dashboard/notifications',
      duration: 8000,
    });

    // Show browser notification
    await showBrowserNotification(
      notification.title_ar || notification.title,
      notification.message_ar || notification.message,
      notification.action_url || '/dashboard/notifications',
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
          
          // Check if notification is for all users
          if (notification.type === 'all' || !notification.type) {
            handleAppNotification(notification);
          }
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
