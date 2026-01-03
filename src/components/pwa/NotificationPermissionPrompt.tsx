import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X, Download, Smartphone, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationPermissionPromptProps {
  variant?: 'banner' | 'minimal';
}

export const NotificationPermissionPrompt = ({ variant = 'banner' }: NotificationPermissionPromptProps) => {
  const navigate = useNavigate();
  const { 
    isSupported,
    status,
    permission, 
    requestPermission, 
    subscribeToPush,
    isIOS,
    isStandalone,
    needsInstall,
    iosVersion 
  } = usePushNotifications();
  
  const isVersionUnsupported = status === 'ios_version_unsupported';
  
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showDelay, setShowDelay] = useState(true);

  useEffect(() => {
    // Check if user already dismissed this session
    const hasDismissed = sessionStorage.getItem('notification_prompt_dismissed');
    if (hasDismissed) setDismissed(true);
    
    // Show prompt after a delay for better UX
    const timer = setTimeout(() => setShowDelay(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Don't show during delay
  if (showDelay) return null;

  // Don't show if already granted, denied permanently, or dismissed
  if (permission === 'granted' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    // If iOS and needs install, navigate to onboarding
    if (isIOS && needsInstall) {
      navigate('/dashboard/notification-setup');
      return;
    }

    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
      }
    } finally {
      setIsRequesting(false);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('notification_prompt_dismissed', 'true');
    setDismissed(true);
  };

  const handleLearnMore = () => {
    navigate('/dashboard/notification-setup');
    handleDismiss();
  };

  // iOS needs to install the app first - show install prompt
  if (isIOS && needsInstall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">أضف التطبيق للشاشة الرئيسية</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  لاستقبال الإشعارات على iPhone
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleLearnMore}
                className="flex-1 gap-2"
                size="sm"
              >
                اعرف كيف
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                size="sm"
              >
                لاحقاً
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // iOS version too old
  if (isIOS && isVersionUnsupported && iosVersion) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">تحديث مطلوب</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  الإشعارات تتطلب iOS 16.4 أو أحدث
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  نسختك الحالية: iOS {iosVersion}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Not supported at all
  if (!isSupported && !needsInstall) {
    return null;
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-destructive/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">الإشعارات مرفوضة</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  فعّلها من إعدادات المتصفح
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={handleLearnMore}
            >
              اعرف كيف تفعّلها
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Normal notification permission prompt
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg">
              <BellRing className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">تفعيل الإشعارات</h4>
              <p className="text-sm text-muted-foreground mt-1">
                احصل على تنبيهات فورية لطلباتك والعروض
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleEnable}
              disabled={isRequesting}
              className="flex-1 gap-2"
              size="sm"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  تفعيل
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              size="sm"
            >
              لاحقاً
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPermissionPrompt;
