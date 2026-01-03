import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Share, Plus, SquareArrowOutUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';

interface InstallPromptProps {
  variant?: 'button' | 'banner' | 'modal';
  className?: string;
}

export const InstallPrompt = ({ variant = 'button', className = '' }: InstallPromptProps) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  const handleInstall = async () => {
    if (isInstallable) {
      // Direct install for Android/Desktop when available
      await installApp();
    } else {
      // Show instructions for iOS or when beforeinstallprompt not fired
      setShowInstructions(true);
    }
  };

  const InstructionsModal = () => (
    <AnimatePresence>
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setShowInstructions(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {isIOS ? 'تثبيت التطبيق على iPhone' : 'تثبيت التطبيق'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInstructions(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {isIOS ? (
                // iOS Instructions
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">اضغط على زر المشاركة</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <SquareArrowOutUpRight className="w-4 h-4" /> في أسفل المتصفح
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">اختر "إضافة إلى الشاشة الرئيسية"</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add to Home Screen
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">اضغط "إضافة"</p>
                      <p className="text-sm text-muted-foreground">سيظهر التطبيق على شاشتك الرئيسية</p>
                    </div>
                  </div>
                </>
              ) : (
                // Chrome/Android Instructions
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium">افتح قائمة المتصفح</p>
                      <p className="text-sm text-muted-foreground">⋮ (ثلاث نقاط) في أعلى المتصفح</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium">اختر "تثبيت التطبيق"</p>
                      <p className="text-sm text-muted-foreground">Install app أو Add to Home Screen</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium">اضغط "تثبيت"</p>
                      <p className="text-sm text-muted-foreground">سيظهر التطبيق على شاشتك الرئيسية</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => setShowInstructions(false)}
            >
              فهمت
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (variant === 'button') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={className}
        >
          <Button
            onClick={handleInstall}
            className="gap-2 bg-gradient-to-l from-primary to-accent hover:opacity-90"
          >
            <Download className="w-4 h-4" />
            تثبيت التطبيق
          </Button>
        </motion.div>
        <InstructionsModal />
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">ثبّت MaxioCore</p>
              <p className="text-sm text-muted-foreground truncate">وصول سريع وإشعارات فورية</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
                <X className="w-4 h-4" />
              </Button>
              <Button onClick={handleInstall} size="sm">
                تثبيت
              </Button>
            </div>
          </div>
        </motion.div>
        <InstructionsModal />
      </>
    );
  }

  return null;
};

export default InstallPrompt;
