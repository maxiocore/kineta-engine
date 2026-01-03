import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Gift, Megaphone, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface InAppNotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'general' | 'offer' | 'announcement' | 'alert' | 'order';
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
  const duration = notification.duration || 5000;

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

  const getTypeIcon = () => {
    switch (notification.type) {
      case 'offer':
        return <Gift className="w-5 h-5 text-green-500" />;
      case 'announcement':
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'order':
        return <ExternalLink className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getTypeColor = () => {
    switch (notification.type) {
      case 'offer':
        return 'from-green-500/20 to-emerald-500/10';
      case 'announcement':
        return 'from-purple-500/20 to-violet-500/10';
      case 'alert':
        return 'from-yellow-500/20 to-amber-500/10';
      case 'order':
        return 'from-blue-500/20 to-cyan-500/10';
      default:
        return 'from-primary/20 to-primary/5';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'الآن';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -100, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 25,
          delay: index * 0.05
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -50, 
        scale: 0.9,
        transition: { duration: 0.2 }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="relative w-full"
    >
      {/* Glassmorphism Card */}
      <div 
        onClick={handleClick}
        className={`
          relative overflow-hidden cursor-pointer
          backdrop-blur-xl bg-card/80
          border border-border/50
          rounded-2xl shadow-2xl
          transition-all duration-200
          hover:scale-[1.02] hover:shadow-3xl
          active:scale-[0.98]
        `}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Gradient overlay based on type */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor()} opacity-60`} />
        
        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            {/* Icon or Image */}
            <div className="flex-shrink-0">
              {notification.imageUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-border/30">
                  <img 
                    src={notification.imageUrl} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center border border-border/30">
                  {getTypeIcon()}
                </div>
              )}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-foreground truncate">
                  {notification.title}
                </h4>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Action indicator */}
              {notification.actionUrl && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                  <span>عرض التفاصيل</span>
                  <ChevronRight className="w-3 h-3 rtl:rotate-180" />
                </div>
              )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(notification.id);
              }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-background/50 hover:bg-background flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <motion.div
            className="h-full bg-primary/50"
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Notification Manager Hook & Component
interface NotificationContextValue {
  showNotification: (notification: Omit<InAppNotificationData, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

// Create a global notification queue
let notificationQueue: ((notification: Omit<InAppNotificationData, 'id'>) => void) | null = null;

export const showInAppNotification = (notification: Omit<InAppNotificationData, 'id'>) => {
  if (notificationQueue) {
    notificationQueue(notification);
  }
};

export const InAppNotificationContainer = () => {
  const [notifications, setNotifications] = useState<InAppNotificationData[]>([]);
  const maxNotifications = 3;

  const addNotification = useCallback((notification: Omit<InAppNotificationData, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: InAppNotificationData = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    // Haptic feedback on new notification
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
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
    return () => {
      notificationQueue = null;
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <div key={notification.id} className="w-full max-w-md pointer-events-auto">
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
