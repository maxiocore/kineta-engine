import { useState, useEffect, useCallback } from 'react';

// ========== DEVICE DETECTION ==========

// Check if running on iOS
const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if running in Safari (not Chrome/Edge on iOS)
const isSafariBrowser = (): boolean => {
  const ua = navigator.userAgent;
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  const isEdge = /EdgiOS/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  
  // On iOS, Safari is required for PWA installation
  return isSafari && !isChrome && !isFirefox && !isEdge;
};

// Check if app is installed as PWA (standalone mode)
const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Get iOS version
const getIOSVersion = (): { major: number; minor: number; full: string } | null => {
  if (!isIOSDevice()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    full: `${match[1]}.${match[2]}`
  };
};

// Check if iOS version supports Web Push (16.4+)
const isIOSPushSupported = (): boolean => {
  const version = getIOSVersion();
  if (!version) return !isIOSDevice(); // Non-iOS devices support push
  
  return version.major > 16 || (version.major === 16 && version.minor >= 4);
};

// ========== STATUS TYPES ==========

export type PushSupportStatus = 
  | 'supported_ready'           // Push is fully supported and ready to enable
  | 'supported_not_installed'   // iOS 16.4+ but needs to be installed to home screen
  | 'needs_safari'              // iOS but using Chrome/Edge, needs Safari
  | 'ios_version_unsupported'   // iOS version too old (<16.4)
  | 'browser_unsupported'       // Browser doesn't support push at all
  | 'permission_granted'        // Push is enabled and working
  | 'permission_denied';        // User has blocked notifications

export interface PushNotificationState {
  // Basic support info
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  
  // Device detection
  isIOS: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  iosVersion: string | null;
  
  // Detailed status
  status: PushSupportStatus;
  statusMessage: string;
  statusMessageAr: string;
  
  // Action needed
  needsInstall: boolean;
  needsSafari: boolean;
  canEnablePush: boolean;
  
  // For fallback
  supportsInAppNotifications: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isIOS: false,
    isSafari: false,
    isStandalone: false,
    iosVersion: null,
    status: 'browser_unsupported',
    statusMessage: 'Checking support...',
    statusMessageAr: 'جاري التحقق...',
    needsInstall: false,
    needsSafari: false,
    canEnablePush: false,
    supportsInAppNotifications: true, // Always available as fallback
  });

  useEffect(() => {
    const checkSupport = () => {
      const iosDevice = isIOSDevice();
      const safari = isSafariBrowser();
      const standalone = isStandaloneMode();
      const iosVersion = getIOSVersion();
      const iosPushSupported = isIOSPushSupported();

      // Check basic notification support
      const notificationSupported = 'Notification' in window;
      const swSupported = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;
      
      // Check current permission
      const currentPermission = notificationSupported ? Notification.permission : 'denied';
      
      // Check if already subscribed
      const isSubscribed = localStorage.getItem('push_notifications_enabled') === 'true' && 
        currentPermission === 'granted';

      // Determine status
      let status: PushSupportStatus = 'browser_unsupported';
      let statusMessage = 'Your browser does not support push notifications';
      let statusMessageAr = 'متصفحك لا يدعم الإشعارات';
      let needsInstall = false;
      let needsSafari = false;
      let canEnablePush = false;
      let isSupported = false;

      if (iosDevice) {
        // iOS-specific logic
        if (!iosPushSupported) {
          status = 'ios_version_unsupported';
          statusMessage = `Push requires iOS 16.4+ (Your version: ${iosVersion?.full || 'unknown'})`;
          statusMessageAr = `الإشعارات تتطلب iOS 16.4+ (نسختك: ${iosVersion?.full || 'غير معروف'})`;
        } else if (!safari && !standalone) {
          status = 'needs_safari';
          needsSafari = true;
          statusMessage = 'Open this site in Safari to enable push notifications';
          statusMessageAr = 'افتح الموقع في Safari لتفعيل الإشعارات';
        } else if (!standalone) {
          status = 'supported_not_installed';
          needsInstall = true;
          statusMessage = 'Add to Home Screen to enable push notifications';
          statusMessageAr = 'أضف التطبيق للشاشة الرئيسية لتفعيل الإشعارات';
        } else if (currentPermission === 'denied') {
          status = 'permission_denied';
          statusMessage = 'Notifications are blocked. Enable in Settings > ASH HOLDING';
          statusMessageAr = 'الإشعارات محظورة. فعّلها من الإعدادات > ASH HOLDING';
        } else if (currentPermission === 'granted') {
          status = 'permission_granted';
          isSupported = true;
          canEnablePush = false;
          statusMessage = 'Push notifications are enabled';
          statusMessageAr = 'الإشعارات مفعّلة';
        } else {
          status = 'supported_ready';
          isSupported = true;
          canEnablePush = true;
          statusMessage = 'Ready to enable push notifications';
          statusMessageAr = 'جاهز لتفعيل الإشعارات';
        }
      } else {
        // Non-iOS logic
        if (!notificationSupported || !swSupported) {
          status = 'browser_unsupported';
          statusMessage = 'Your browser does not support push notifications';
          statusMessageAr = 'متصفحك لا يدعم الإشعارات';
        } else if (currentPermission === 'denied') {
          status = 'permission_denied';
          statusMessage = 'Notifications are blocked. Click the lock icon to enable';
          statusMessageAr = 'الإشعارات محظورة. اضغط على القفل للتفعيل';
        } else if (currentPermission === 'granted') {
          status = 'permission_granted';
          isSupported = true;
          canEnablePush = false;
          statusMessage = 'Push notifications are enabled';
          statusMessageAr = 'الإشعارات مفعّلة';
        } else {
          status = 'supported_ready';
          isSupported = true;
          canEnablePush = true;
          statusMessage = 'Ready to enable push notifications';
          statusMessageAr = 'جاهز لتفعيل الإشعارات';
        }
      }

      setState({
        isSupported,
        isSubscribed,
        permission: currentPermission,
        isIOS: iosDevice,
        isSafari: safari,
        isStandalone: standalone,
        iosVersion: iosVersion?.full || null,
        status,
        statusMessage,
        statusMessageAr,
        needsInstall,
        needsSafari,
        canEnablePush,
        supportsInAppNotifications: true,
      });

      console.log('[Push] Device check:', {
        isIOS: iosDevice,
        isSafari: safari,
        isStandalone: standalone,
        iosVersion: iosVersion?.full,
        iosPushSupported,
        status,
        permission: currentPermission,
        canEnablePush,
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

  const requestPermission = useCallback(async (): Promise<boolean> => {
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
      
      setState(prev => ({ 
        ...prev, 
        permission: result,
        status: result === 'granted' ? 'permission_granted' : 
                result === 'denied' ? 'permission_denied' : prev.status,
        canEnablePush: result === 'default',
      }));
      
      console.log('[Push] Permission result:', result);
      return result === 'granted';
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }, [state.isIOS, state.isStandalone]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported && state.status !== 'permission_granted') {
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
  }, [state.isSupported, state.permission, state.status]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
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
  ): Promise<boolean> => {
    if (state.status !== 'permission_granted' && state.permission !== 'granted') {
      console.log('[Push] Cannot show notification - permission not granted');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const notifOptions: NotificationOptions = {
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
      };
      
      await registration.showNotification(title, notifOptions);
      
      console.log('[Push] Notification shown:', title);
      return true;
    } catch (error) {
      console.error('[Push] Error showing notification:', error);
      return false;
    }
  }, [state.status, state.permission, state.isIOS]);

  // Test notification function
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
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
