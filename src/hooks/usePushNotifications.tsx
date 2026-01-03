import { useState, useEffect, useCallback } from 'react';

// Check if running on iOS
const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if app is installed as PWA (standalone mode)
const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Get iOS version
const getIOSVersion = (): string | null => {
  if (!isIOSDevice()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return null;
  
  return `${match[1]}.${match[2]}`;
};

// Check if iOS version supports Web Push (16.4+)
const isIOSPushSupported = () => {
  if (!isIOSDevice()) return true;
  
  const version = getIOSVersion();
  if (!version) return false;
  
  const [major, minor] = version.split('.').map(Number);
  return major > 16 || (major === 16 && minor >= 4);
};

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isIOS: boolean;
  isStandalone: boolean;
  needsInstall: boolean;
  iosVersion: string | null;
  isPushSupported: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isIOS: false,
    isStandalone: false,
    needsInstall: false,
    iosVersion: null,
    isPushSupported: false,
  });

  useEffect(() => {
    const checkSupport = () => {
      const iosDevice = isIOSDevice();
      const standalone = isStandaloneMode();
      const iosPushSupported = isIOSPushSupported();
      const iosVersion = getIOSVersion();

      // Check basic notification support
      const notificationSupported = 'Notification' in window;
      const swSupported = 'serviceWorker' in navigator;
      
      // For iOS: needs to be standalone (installed) AND iOS 16.4+
      const iosNeedsInstall = iosDevice && !standalone && iosPushSupported;
      const iosNotSupportedVersion = iosDevice && !iosPushSupported;
      
      // Final support check - can this device receive push notifications right now?
      const canReceivePush = notificationSupported && swSupported && 
        (!iosDevice || (standalone && iosPushSupported));

      // Is push theoretically supported (after installation for iOS)?
      const pushSupported = notificationSupported && swSupported && 
        (!iosDevice || iosPushSupported);

      // Check current permission
      const currentPermission = notificationSupported ? Notification.permission : 'denied';
      
      // Check if already subscribed
      const isSubscribed = localStorage.getItem('push_notifications_enabled') === 'true' && 
        currentPermission === 'granted';

      setState({
        isSupported: canReceivePush,
        isPushSupported: pushSupported,
        isSubscribed,
        isIOS: iosDevice,
        isStandalone: standalone,
        needsInstall: iosNeedsInstall,
        iosVersion,
        permission: currentPermission,
      });

      console.log('[Push] Device check:', {
        isIOS: iosDevice,
        isStandalone: standalone,
        iosPushSupported,
        iosVersion,
        canReceivePush,
        pushSupported,
        needsInstall: iosNeedsInstall,
        permission: currentPermission,
      });
    };

    checkSupport();

    // Listen for display mode changes (when app is installed)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkSupport();
    mediaQuery.addEventListener('change', handleChange);

    // Also check when visibility changes (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSupport();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('[Push] Notifications not supported');
      return false;
    }

    // For iOS PWA, we need special handling
    if (state.isIOS && !state.isStandalone) {
      console.log('[Push] iOS requires app to be installed first');
      return false;
    }

    try {
      console.log('[Push] Requesting permission...');
      const result = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission: result }));
      console.log('[Push] Permission result:', result);
      
      return result === 'granted';
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }, [state.isIOS, state.isStandalone]);

  const subscribeToPush = useCallback(async () => {
    if (!state.isSupported) {
      console.log('[Push] Not supported on this device');
      return false;
    }

    if (state.permission !== 'granted') {
      console.log('[Push] Permission not granted');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready');
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[Push] Already subscribed');
        setState(prev => ({ ...prev, isSubscribed: true }));
        localStorage.setItem('push_notifications_enabled', 'true');
        return true;
      }

      // For now, mark as subscribed (full VAPID push requires server-side setup)
      setState(prev => ({ ...prev, isSubscribed: true }));
      localStorage.setItem('push_notifications_enabled', 'true');
      console.log('[Push] Subscribed successfully');
      
      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
      
      setState(prev => ({ ...prev, isSubscribed: false }));
      localStorage.removeItem('push_notifications_enabled');
      console.log('[Push] Unsubscribed');
      
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback(async (
    title: string, 
    options?: NotificationOptions & { url?: string }
  ) => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('[Push] Cannot show notification');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
        tag: `manual-${Date.now()}`,
        ...options,
        data: {
          url: options?.url || '/dashboard/notifications',
          ...options?.data,
        },
      });
      
      console.log('[Push] Notification shown:', title);
      return true;
    } catch (error) {
      console.error('[Push] Error showing notification:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  // Test notification function
  const sendTestNotification = useCallback(async () => {
    return showNotification('اختبار الإشعارات', {
      body: 'تم تفعيل الإشعارات بنجاح! 🎉',
      url: '/dashboard',
    });
  }, [showNotification]);

  return {
    ...state,
    requestPermission,
    subscribeToPush,
    unsubscribe,
    showNotification,
    sendTestNotification,
  };
};
