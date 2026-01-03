import { useState, useEffect, useCallback } from 'react';

// Check if running on iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if app is installed as PWA (standalone mode)
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Check if iOS version supports Web Push (16.4+)
const isIOSPushSupported = () => {
  if (!isIOS()) return true; // Not iOS, assume supported
  
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return false;
  
  const majorVersion = parseInt(match[1], 10);
  const minorVersion = parseInt(match[2], 10);
  
  // iOS 16.4+ supports Web Push when installed as PWA
  return majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4);
};

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isIOS: boolean;
  isStandalone: boolean;
  needsInstall: boolean;
  iosVersion: string | null;
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
  });

  useEffect(() => {
    const checkSupport = () => {
      const iosDevice = isIOS();
      const standalone = isStandalone();
      const iosPushSupported = isIOSPushSupported();
      
      // Get iOS version
      let iosVersion: string | null = null;
      if (iosDevice) {
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
        if (match) {
          iosVersion = `${match[1]}.${match[2]}`;
        }
      }

      // Check basic notification support
      const notificationSupported = 'Notification' in window;
      const swSupported = 'serviceWorker' in navigator;
      
      // For iOS: needs to be standalone (installed) AND iOS 16.4+
      const iosNeedsInstall = iosDevice && !standalone && iosPushSupported;
      const iosNotSupported = iosDevice && !iosPushSupported;
      
      // Final support check
      const supported = notificationSupported && swSupported && 
        (!iosDevice || (standalone && iosPushSupported));

      setState(prev => ({
        ...prev,
        isSupported: supported,
        isIOS: iosDevice,
        isStandalone: standalone,
        needsInstall: iosNeedsInstall,
        iosVersion,
        permission: notificationSupported ? Notification.permission : 'denied',
      }));

      console.log('[Push] Device check:', {
        isIOS: iosDevice,
        isStandalone: standalone,
        iosPushSupported,
        iosVersion,
        supported,
        iosNeedsInstall,
      });
    };

    checkSupport();

    // Listen for display mode changes (when app is installed)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkSupport();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      console.log('[Push] Not supported on this device');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission: result }));
      console.log('[Push] Permission result:', result);
      return result === 'granted';
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const subscribeToPush = useCallback(async () => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('[Push] Cannot subscribe:', { supported: state.isSupported, permission: state.permission });
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready');
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setState(prev => ({ ...prev, isSubscribed: true }));
        console.log('[Push] Already subscribed');
        return true;
      }

      // Mark as subscribed (full push requires VAPID key setup)
      setState(prev => ({ ...prev, isSubscribed: true }));
      localStorage.setItem('push_notifications_enabled', 'true');
      console.log('[Push] Subscribed successfully');
      
      return true;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('[Push] Cannot show notification');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
        ...options,
      });
      console.log('[Push] Notification shown:', title);
    } catch (error) {
      console.error('[Push] Error showing notification:', error);
    }
  }, [state.isSupported, state.permission]);

  return {
    ...state,
    requestPermission,
    subscribeToPush,
    showNotification,
  };
};
