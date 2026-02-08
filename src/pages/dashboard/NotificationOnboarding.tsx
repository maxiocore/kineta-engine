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
  Download,
  Chrome,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications, type PushSupportStatus } from '@/hooks/usePushNotifications';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { showInAppNotification } from '@/components/pwa/InAppNotification';
import { toast } from 'sonner';

const NotificationOnboarding = () => {
  const navigate = useNavigate();
  const { 
    status,
    statusMessageAr,
    permission, 
    requestPermission, 
    subscribeToPush,
    sendTestNotification,
    isIOS,
    isSafari,
    isStandalone,
    needsInstall,
    needsSafari,
    canEnablePush,
    iosVersion,
    supportsInAppNotifications,
  } = usePushNotifications();
  
  const { isInstallable, installApp } = usePWAInstall();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testingSent, setTestingSent] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribeToPush();
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 30, 50]);
        }
        toast.success('تم تفعيل الإشعارات بنجاح!');
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

  const handleTestNotification = async () => {
    setTestingSent(true);
    
    // Always show in-app notification
    showInAppNotification({
      title: 'اختبار إشعار ASH HOLDING',
      message: 'هذا إشعار تجريبي! إذا رأيت هذا، فالإشعارات تعمل بشكل صحيح 🎉',
      type: 'announcement',
      actionUrl: '/dashboard',
      duration: 8000,
    });
    
    // Also try push if supported
    if (status === 'permission_granted') {
      await sendTestNotification();
    }
    
    setTimeout(() => setTestingSent(false), 3000);
  };

  // iOS Installation Steps
  const iosSteps = [
    {
      icon: Share2,
      title: 'اضغط على زر المشاركة',
      description: 'في أسفل متصفح Safari، اضغط على زر المشاركة (المربع مع السهم للأعلى)',
      visual: (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Share2 className="w-8 h-8" />
            <span className="text-sm font-medium">زر المشاركة في Safari</span>
          </div>
        </div>
      ),
    },
    {
      icon: Plus,
      title: 'أضف إلى الشاشة الرئيسية',
      description: 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية" أو "Add to Home Screen"',
      visual: (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl w-full">
          <div className="flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium block">إضافة إلى الشاشة الرئيسية</span>
              <span className="text-xs text-muted-foreground">Add to Home Screen</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Smartphone,
      title: 'افتح التطبيق من الأيقونة',
      description: 'بعد الإضافة، اضغط على أيقونة ASH HOLDING من شاشتك الرئيسية لفتح التطبيق',
      visual: (
        <div className="mt-4 flex justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mx-auto">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">ASH HOLDING</p>
          </div>
        </div>
      ),
    },
  ];

  const getStatusConfig = () => {
    switch (status) {
      case 'permission_granted':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          gradientFrom: 'from-green-500/20',
          title: 'الإشعارات مفعّلة',
          subtitle: 'ستصلك تنبيهات فورية لطلباتك وعروضنا',
          badgeText: 'نشط',
          badgeVariant: 'default' as const,
        };
      case 'permission_denied':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          gradientFrom: 'from-destructive/20',
          title: 'الإشعارات مرفوضة',
          subtitle: 'يرجى تفعيلها من إعدادات المتصفح',
          badgeText: 'مرفوض',
          badgeVariant: 'destructive' as const,
        };
      case 'ios_version_unsupported':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          gradientFrom: 'from-amber-500/20',
          title: 'نسخة iOS غير مدعومة',
          subtitle: `الإشعارات تتطلب iOS 16.4+ (نسختك: ${iosVersion})`,
          badgeText: 'غير مدعوم',
          badgeVariant: 'secondary' as const,
        };
      case 'needs_safari':
        return {
          icon: Chrome,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          gradientFrom: 'from-blue-500/20',
          title: 'افتح في Safari',
          subtitle: 'لتفعيل الإشعارات على iPhone، افتح الموقع في Safari ثم أضفه للشاشة الرئيسية',
          badgeText: 'Safari مطلوب',
          badgeVariant: 'secondary' as const,
        };
      case 'supported_not_installed':
        return {
          icon: Download,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          gradientFrom: 'from-primary/20',
          title: 'أضف التطبيق أولاً',
          subtitle: 'لاستقبال الإشعارات، أضف التطبيق للشاشة الرئيسية',
          badgeText: 'غير مثبت',
          badgeVariant: 'outline' as const,
        };
      case 'supported_ready':
        return {
          icon: Bell,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          gradientFrom: 'from-primary/20',
          title: 'جاهز للتفعيل',
          subtitle: 'اضغط الزر أدناه لتفعيل الإشعارات',
          badgeText: 'جاهز',
          badgeVariant: 'outline' as const,
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-muted',
          gradientFrom: 'from-muted/50',
          title: 'غير مدعوم',
          subtitle: statusMessageAr,
          badgeText: 'غير متاح',
          badgeVariant: 'secondary' as const,
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
          <h1 className="text-lg font-semibold">إعداد الإشعارات</h1>
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
            <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.gradientFrom} to-transparent opacity-50`} />
            <CardContent className="relative p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-20 h-20 rounded-2xl ${statusConfig.bgColor} flex items-center justify-center`}>
                  <statusConfig.icon className={`w-10 h-10 ${statusConfig.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{statusConfig.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{statusConfig.subtitle}</p>
                </div>
                
                {/* Status Badge */}
                <Badge 
                  variant={statusConfig.badgeVariant}
                  className="gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${status === 'permission_granted' ? 'bg-green-500 animate-pulse' : statusConfig.color.replace('text-', 'bg-')}`} />
                  {statusConfig.badgeText}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Safari Required Message */}
        {needsSafari && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Chrome className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Safari مطلوب</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      إشعارات iPhone تعمل فقط من خلال Safari. انسخ الرابط وافتحه في Safari.
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    toast.success('تم نسخ الرابط');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  نسخ رابط الموقع
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* iOS Installation Steps */}
        {needsInstall && isIOS && !needsSafari && (
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
                  className={`h-2 rounded-full transition-all ${
                    currentStep === index 
                      ? 'bg-primary w-8' 
                      : 'bg-muted hover:bg-muted-foreground/30 w-2'
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
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                        {currentStep + 1}
                      </div>
                      
                      {/* Step Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {(() => {
                          const StepIcon = iosSteps[currentStep].icon;
                          return <StepIcon className="w-7 h-7 text-primary" />;
                        })()}
                      </div>
                      
                      {/* Step Content */}
                      <div>
                        <h4 className="text-lg font-semibold">{iosSteps[currentStep].title}</h4>
                        <p className="text-muted-foreground mt-2 text-sm">{iosSteps[currentStep].description}</p>
                      </div>

                      {/* Visual */}
                      {iosSteps[currentStep].visual}
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
        {needsInstall && !isIOS && isInstallable && (
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
        {canEnablePush && (
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
                    <p>2. ابحث عن <strong>ASH HOLDING</strong></p>
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
                  <RefreshCw className="w-4 h-4" />
                  إعادة التحقق
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success State */}
        {status === 'permission_granted' && (
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
            </Button>
          </motion.div>
        )}

        {/* In-App Notification Fallback Section */}
        {supportsInAppNotifications && status !== 'permission_granted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">إشعارات داخل التطبيق</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      حتى بدون Push، ستصلك إشعارات جميلة داخل الموقع!
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  className="w-full mt-4 gap-2"
                  onClick={handleTestNotification}
                  disabled={testingSent}
                >
                  {testingSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      تم الإرسال!
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      اختبر إشعار الآن
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Test Push (when enabled) */}
        {status === 'permission_granted' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button 
              variant="outline"
              className="w-full gap-2"
              onClick={handleTestNotification}
              disabled={testingSent}
            >
              {testingSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  تم إرسال الإشعار!
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  اختبر إشعار الآن
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NotificationOnboarding;
