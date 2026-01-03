import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Gift, Megaphone, AlertCircle, ExternalLink, ChevronLeft, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface InAppNotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'general' | 'offer' | 'announcement' | 'alert' | 'order' | 'update';
  icon?: string;
  imageUrl?: string;
  actionUrl?: string;
  timestamp?: Date;
  duration?: number; // in milliseconds, default 5000
}

interface NotificationItemProps {
  notification: InAppNotificationData;
  onDismiss: (id: string) => void;
  index: number;
}

const NotificationItem = ({ notification, onDismiss, index }: NotificationItemProps) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const duration = notification.duration || 6000;

  useEffect(() => {
    const decrementAmount = 100 / (duration / 50);
    
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            onDismiss(notification.id);
            return 0;
          }
          return prev - decrementAmount;
        });
      }, 50);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, duration, notification.id, onDismiss]);

  const handleClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank');
      } else {
        navigate(notification.actionUrl);
      }
    }
    onDismiss(notification.id);
  };

  const getTypeConfig = () => {
    switch (notification.type) {
      case 'offer':
        return { 
          icon: Gift, 
          gradient: 'from-emerald-500/20 via-green-500/15 to-teal-500/10',
          iconBg: 'bg-emerald-500/20',
          iconColor: 'text-emerald-500',
          accentColor: 'bg-emerald-500'
        };
      case 'announcement':
        return { 
          icon: Megaphone, 
          gradient: 'from-violet-500/20 via-purple-500/15 to-fuchsia-500/10',
          iconBg: 'bg-violet-500/20',
          iconColor: 'text-violet-500',
          accentColor: 'bg-violet-500'
        };
      case 'alert':
        return { 
          icon: AlertCircle, 
          gradient: 'from-amber-500/20 via-yellow-500/15 to-orange-500/10',
          iconBg: 'bg-amber-500/20',
          iconColor: 'text-amber-500',
          accentColor: 'bg-amber-500'
        };
      case 'order':
        return { 
          icon: Package, 
          gradient: 'from-blue-500/20 via-cyan-500/15 to-sky-500/10',
          iconBg: 'bg-blue-500/20',
          iconColor: 'text-blue-500',
          accentColor: 'bg-blue-500'
        };
      case 'update':
        return { 
          icon: ExternalLink, 
          gradient: 'from-cyan-500/20 via-teal-500/15 to-emerald-500/10',
          iconBg: 'bg-cyan-500/20',
          iconColor: 'text-cyan-500',
          accentColor: 'bg-cyan-500'
        };
      default:
        return { 
          icon: Bell, 
          gradient: 'from-primary/20 via-primary/15 to-primary/10',
          iconBg: 'bg-primary/20',
          iconColor: 'text-primary',
          accentColor: 'bg-primary'
        };
    }
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  const formatTime = (date?: Date) => {
    if (!date) return 'الآن';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} س`;
    return `منذ ${Math.floor(hours / 24)} ي`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -80, scale: 0.85, rotateX: -15 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: 0,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 28,
          delay: index * 0.08
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -40, 
        scale: 0.9,
        transition: { duration: 0.25, ease: 'easeOut' }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 500)}
      className="relative w-full perspective-1000"
    >
      {/* iOS-style Glassmorphism Card */}
      <div 
        onClick={handleClick}
        className="
          relative overflow-hidden cursor-pointer
          backdrop-blur-2xl bg-card/85
          border border-border/40
          rounded-[1.25rem] 
          transition-all duration-200 ease-out
          hover:scale-[1.015] hover:bg-card/90
          active:scale-[0.985]
          shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25),0_4px_12px_-4px_rgba(0,0,0,0.15)]
        "
      >
        {/* Gradient overlay based on type */}
        <div className={`absolute inset-0 bg-gradient-to-br ${typeConfig.gradient} opacity-70`} />
        
        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3.5">
            {/* Icon or Image */}
            <div className="flex-shrink-0">
              {notification.imageUrl ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-border/20 shadow-sm">
                  <img 
                    src={notification.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-2xl ${typeConfig.iconBg} flex items-center justify-center ring-1 ring-white/10`}>
                  <TypeIcon className={`w-6 h-6 ${typeConfig.iconColor}`} />
                </div>
              )}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    MaxioCore
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
              </div>
              
              <h4 className="font-semibold text-[15px] text-foreground leading-tight">
                {notification.title}
              </h4>
              <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
              
              {/* Action indicator */}
              {notification.actionUrl && (
                <div className="flex items-center gap-1 mt-2.5">
                  <span className={`text-xs font-medium ${typeConfig.iconColor}`}>
                    عرض التفاصيل
                  </span>
                  <ChevronLeft className={`w-3.5 h-3.5 ${typeConfig.iconColor}`} />
                </div>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if ('vibrate' in navigator) navigator.vibrate(5);
                onDismiss(notification.id);
              }}
              className="flex-shrink-0 w-7 h-7 -mt-0.5 -mr-0.5 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Progress bar - iOS style thin */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted/20 overflow-hidden">
          <motion.div
            className={`h-full ${typeConfig.accentColor} opacity-60`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Notification Manager Hook & Component
let notificationQueue: ((notification: Omit<InAppNotificationData, 'id'>) => void) | null = null;

export const showInAppNotification = (notification: Omit<InAppNotificationData, 'id'>) => {
  if (notificationQueue) {
    notificationQueue(notification);
  } else {
    console.log('[InApp] Queue not ready, notification queued:', notification.title);
    // Queue for when ready
    setTimeout(() => {
      if (notificationQueue) {
        notificationQueue(notification);
      }
    }, 500);
  }
};

export const InAppNotificationContainer = () => {
  const [notifications, setNotifications] = useState<InAppNotificationData[]>([]);
  const maxNotifications = 4;

  const addNotification = useCallback((notification: Omit<InAppNotificationData, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: InAppNotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    console.log('[InApp] Adding notification:', newNotification.title);

    // Haptic feedback on new notification
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }

    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      // Keep only max notifications
      return updated.slice(0, maxNotifications);
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Register global handler
  useEffect(() => {
    notificationQueue = addNotification;
    console.log('[InApp] Notification queue ready');
    return () => {
      notificationQueue = null;
    };
  }, [addNotification]);

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2.5 p-4 pt-safe pointer-events-none"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <div key={notification.id} className="w-full max-w-[400px] pointer-events-auto">
            <NotificationItem
              notification={notification}
              onDismiss={dismissNotification}
              index={index}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InAppNotificationContainer;
