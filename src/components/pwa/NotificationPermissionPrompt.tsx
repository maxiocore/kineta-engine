import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useState, useEffect } from 'react';

interface NotificationPermissionPromptProps {
  variant?: 'banner' | 'modal';
}

export const NotificationPermissionPrompt = ({ variant = 'banner' }: NotificationPermissionPromptProps) => {
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    subscribeToPush,
    isIOS,
    isStandalone,
    needsInstall,
    iosVersion 
  } = usePushNotifications();
  
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showDelay, setShowDelay] = useState(true);

  useEffect(() => {
    // Check if user already dismissed this prompt
    const hasDismissed = localStorage.getItem('notification_prompt_dismissed');
    if (hasDismissed) setDismissed(true);
    
    // Show prompt after a short delay
    const timer = setTimeout(() => setShowDelay(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Don't show during delay
  if (showDelay) return null;

  // Don't show if already granted, denied, or dismissed
  if (permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush();
      }
    } finally {
      setIsRequesting(false);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setDismissed(true);
  };

  // iOS needs to install the app first
  if (isIOS && needsInstall) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-4 right-4 z-40 max-w-lg mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">أضف التطبيق للشاشة الرئيسية</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  لاستقبال الإشعارات على iPhone، أضف التطبيق للشاشة الرئيسية
                </p>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="flex items-center gap-2 mb-1">
                    <span className="text-lg">1️⃣</span> اضغط على زر المشاركة
                    <span className="inline-block w-5 h-5 bg-primary/20 rounded text-center text-xs leading-5">⬆️</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-lg">2️⃣</span> اختر "إضافة إلى الشاشة الرئيسية"
                  </p>
                </div>
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

  // iOS version too old
  if (isIOS && !isSupported && iosVersion) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-4 right-4 z-40 max-w-lg mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">تحديث مطلوب</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  الإشعارات تتطلب iOS 16.4 أو أحدث. نسختك الحالية: iOS {iosVersion}
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
  if (!isSupported) {
    return null;
  }

  // Normal notification permission prompt
  if (variant === 'banner') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-4 right-4 z-40 max-w-lg mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BellRing className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">تفعيل الإشعارات</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  احصل على تنبيهات فورية لحالة طلباتك والعروض الجديدة
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
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleEnable}
                disabled={isRequesting}
                className="flex-1 gap-2"
              >
                <Bell className="w-4 h-4" />
                {isRequesting ? 'جاري التفعيل...' : 'تفعيل'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                لاحقاً
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

export default NotificationPermissionPrompt;
