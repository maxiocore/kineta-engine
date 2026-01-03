import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Share2, 
  Plus, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Vibrate,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';

type NotificationStatus = 'not_installed' | 'installed_no_permission' | 'permission_denied' | 'enabled' | 'unsupported';

const NotificationOnboarding = () => {
  const navigate = useNavigate();
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
  
  const { isInstallable, installApp } = usePWAInstall();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>('not_installed');

  // Determine notification status
  useEffect(() => {
    if (isIOS && iosVersion) {
      const [major, minor] = iosVersion.split('.').map(Number);
      if (major < 16 || (major === 16 && minor < 4)) {
        setStatus('unsupported');
        return;
      }
    }
    
    if (!isSupported && !needsInstall) {
      setStatus('unsupported');
    } else if (needsInstall && !isStandalone) {
      setStatus('not_installed');
    } else if (permission === 'denied') {
      setStatus('permission_denied');
    } else if (permission === 'granted') {
      setStatus('enabled');
    } else {
      setStatus('installed_no_permission');
    }
  }, [isSupported, permission, needsInstall, isStandalone, isIOS, iosVersion]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush();
        setStatus('enabled');
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleInstallApp = async () => {
    if (isInstallable) {
      await installApp();
    }
  };

  // iOS Installation Steps
  const iosSteps = [
    {
      icon: Share2,
      title: 'اضغط على زر المشاركة',
      description: 'في أسفل متصفح Safari، اضغط على زر المشاركة (السهم للأعلى)',
      image: '/pwa-192x192.png',
    },
    {
      icon: Plus,
      title: 'أضف إلى الشاشة الرئيسية',
      description: 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"',
      image: '/pwa-192x192.png',
    },
    {
      icon: Smartphone,
      title: 'افتح التطبيق',
      description: 'اضغط على أيقونة MaxioCore من شاشتك الرئيسية',
      image: '/pwa-192x192.png',
    },
  ];

  const getStatusConfig = () => {
    switch (status) {
      case 'enabled':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          title: 'الإشعارات مفعّلة',
          subtitle: 'ستصلك تنبيهات فورية لطلباتك وعروضنا',
        };
      case 'permission_denied':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          title: 'الإشعارات مرفوضة',
          subtitle: 'يرجى تفعيلها من إعدادات المتصفح',
        };
      case 'unsupported':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          title: 'غير مدعوم',
          subtitle: isIOS && iosVersion 
            ? `الإشعارات تتطلب iOS 16.4+ (نسختك: ${iosVersion})`
            : 'متصفحك لا يدعم الإشعارات',
        };
      case 'not_installed':
        return {
          icon: Download,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          title: 'أضف التطبيق أولاً',
          subtitle: 'لاستقبال الإشعارات، أضف التطبيق للشاشة الرئيسية',
        };
      default:
        return {
          icon: Bell,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          title: 'تفعيل الإشعارات',
          subtitle: 'احصل على تنبيهات فورية لطلباتك',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">الإشعارات</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className={`border-2 ${statusConfig.borderColor} overflow-hidden`}>
            <div className={`absolute inset-0 ${statusConfig.bgColor} opacity-50`} />
            <CardContent className="relative p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-20 h-20 rounded-2xl ${statusConfig.bgColor} flex items-center justify-center`}>
                  <statusConfig.icon className={`w-10 h-10 ${statusConfig.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{statusConfig.title}</h2>
                  <p className="text-muted-foreground mt-1">{statusConfig.subtitle}</p>
                </div>
                
                {/* Status Badge */}
                <Badge 
                  variant="outline" 
                  className={`${statusConfig.borderColor} ${statusConfig.color} gap-2`}
                >
                  <span className={`w-2 h-2 rounded-full ${status === 'enabled' ? 'bg-green-500 animate-pulse' : statusConfig.color.replace('text-', 'bg-')}`} />
                  {status === 'enabled' ? 'نشط' : 
                   status === 'permission_denied' ? 'مرفوض' :
                   status === 'unsupported' ? 'غير مدعوم' :
                   status === 'not_installed' ? 'غير مثبت' : 'غير مفعّل'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* iOS Installation Steps */}
        {status === 'not_installed' && isIOS && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-center">خطوات التثبيت على iPhone</h3>
            
            {/* Step Navigation */}
            <div className="flex justify-center gap-2">
              {iosSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentStep === index 
                      ? 'bg-primary w-8' 
                      : 'bg-muted hover:bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            {/* Current Step */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      {/* Step Number */}
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                        {currentStep + 1}
                      </div>
                      
                      {/* Step Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {(() => {
                          const StepIcon = iosSteps[currentStep].icon;
                          return <StepIcon className="w-8 h-8 text-primary" />;
                        })()}
                      </div>
                      
                      {/* Step Content */}
                      <div>
                        <h4 className="text-lg font-semibold">{iosSteps[currentStep].title}</h4>
                        <p className="text-muted-foreground mt-2">{iosSteps[currentStep].description}</p>
                      </div>

                      {/* Share Button Visual (Step 1) */}
                      {currentStep === 0 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <Share2 className="w-6 h-6" />
                            <span className="text-sm font-medium">زر المشاركة في Safari</span>
                          </div>
                        </div>
                      )}

                      {/* Add to Home Visual (Step 2) */}
                      {currentStep === 1 && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-xl w-full">
                          <div className="flex items-center gap-3 text-foreground">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">إضافة إلى الشاشة الرئيسية</span>
                          </div>
                        </div>
                      )}

                      {/* App Icon Visual (Step 3) */}
                      {currentStep === 2 && (
                        <div className="mt-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">M</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">MaxioCore</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                السابق
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (currentStep < iosSteps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={currentStep === iosSteps.length - 1}
              >
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Android/Desktop Install */}
        {status === 'not_installed' && !isIOS && isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleInstallApp}
            >
              <Download className="w-5 h-5" />
              تثبيت التطبيق
            </Button>
          </motion.div>
        )}

        {/* Enable Notifications Button */}
        {status === 'installed_no_permission' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleEnableNotifications}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  تفعيل الإشعارات
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              سيظهر طلب إذن من المتصفح، اضغط "السماح" للمتابعة
            </p>
          </motion.div>
        )}

        {/* Permission Denied - Settings Guide */}
        {status === 'permission_denied' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">كيفية تفعيل الإشعارات</h3>
                
                {isIOS ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>1. اذهب إلى <strong>الإعدادات</strong> على جهازك</p>
                    <p>2. ابحث عن <strong>MaxioCore</strong></p>
                    <p>3. اضغط على <strong>الإشعارات</strong></p>
                    <p>4. فعّل <strong>السماح بالإشعارات</strong></p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>1. اضغط على أيقونة القفل 🔒 بجانب العنوان</p>
                    <p>2. ابحث عن <strong>الإشعارات</strong></p>
                    <p>3. غيّر من "حظر" إلى <strong>"سماح"</strong></p>
                    <p>4. أعد تحميل الصفحة</p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => window.location.reload()}
                >
                  <ExternalLink className="w-4 h-4" />
                  إعادة التحقق
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success - Back to Dashboard */}
        {status === 'enabled' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Vibrate className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-700 dark:text-green-400">تم التفعيل بنجاح!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      ستصلك إشعارات فورية عند:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• تحديث حالة طلباتك</li>
                      <li>• وصول عروض وخصومات جديدة</li>
                      <li>• رسائل الدعم الفني</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              العودة للوحة التحكم
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </motion.div>
        )}

        {/* Info Cards */}
        <div className="grid gap-3 pt-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">إشعارات فورية</p>
                  <p className="text-muted-foreground">تصلك تنبيهات مباشرة على جهازك</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">تجربة تطبيق كاملة</p>
                  <p className="text-muted-foreground">يعمل بدون اتصال ويحفظ بياناتك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationOnboarding;
