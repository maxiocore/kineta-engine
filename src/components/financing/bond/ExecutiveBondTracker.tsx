/**
 * متتبع سند الأمر للعميل
 * Executive Bond Tracker for Customer
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Loader2, 
  FileCheck, 
  FileSignature, 
  ClipboardCheck, 
  BadgeCheck,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ExecutiveBondStatus, 
  getBondState, 
  getOrderedBondStates,
  getBondProgress,
  canCustomerAct
} from '@/lib/financing/stateMachine/v2/bondStates';

interface ExecutiveBondTrackerProps {
  applicationId: string;
  bondId?: string;
  currentStatus: ExecutiveBondStatus;
  onStatusChange?: (newStatus: ExecutiveBondStatus) => void;
}

const statusIcons: Record<ExecutiveBondStatus, React.ComponentType<any>> = {
  NOT_ISSUED: Clock,
  ISSUING: Loader2,
  ISSUED: FileCheck,
  SENT_TO_CLIENT: FileSignature,
  SIGNED_BY_CLIENT: ClipboardCheck,
  VERIFIED_BY_ADMIN: BadgeCheck
};

export function ExecutiveBondTracker({
  applicationId,
  bondId,
  currentStatus,
  onStatusChange
}: ExecutiveBondTrackerProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const stateInfo = getBondState(currentStatus);
  const orderedStates = getOrderedBondStates();
  const progress = getBondProgress(currentStatus);
  const canAct = canCustomerAct(currentStatus);
  const CurrentIcon = statusIcons[currentStatus] || Clock;

  // Load events
  useEffect(() => {
    async function loadEvents() {
      if (!applicationId) return;
      
      try {
        const { data, error } = await supabase
          .from('executive_bond_events')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error loading bond events:', error);
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`bond-events-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'executive_bond_events',
          filter: `application_id=eq.${applicationId}`
        },
        (payload) => {
          setEvents(prev => [...prev, payload.new]);
          
          // Show toast notification
          const newStatus = payload.new.to_status as ExecutiveBondStatus;
          const newStateInfo = getBondState(newStatus);
          toast.success(newStateInfo.nameAr, {
            description: newStateInfo.customerMessage
          });

          if (onStatusChange) {
            onStatusChange(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, onStatusChange]);

  // Handle confirm signing
  const handleConfirmSigning = async () => {
    if (!bondId || currentStatus !== 'SENT_TO_CLIENT') return;

    setIsConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('executive-bond-workflow', {
        body: {
          action: 'client_confirm_signed',
          application_id: applicationId,
          bond_id: bondId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('تم تأكيد التوقيع!', {
          description: 'شكراً لك، سيتم مراجعة السند من قبل الإدارة'
        });

        if (onStatusChange) {
          onStatusChange('SIGNED_BY_CLIENT');
        }
      } else {
        throw new Error(data.errorAr || data.error);
      }
    } catch (error: any) {
      console.error('Error confirming signature:', error);
      toast.error('حدث خطأ', {
        description: error.message || 'فشل في تأكيد التوقيع'
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/30" dir="rtl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            سند الأمر
          </CardTitle>
          <Badge 
            className={cn(
              'text-white',
              stateInfo.color === 'gray' && 'bg-gray-500',
              stateInfo.color === 'blue' && 'bg-blue-500',
              stateInfo.color === 'yellow' && 'bg-yellow-500',
              stateInfo.color === 'orange' && 'bg-orange-500',
              stateInfo.color === 'green' && 'bg-green-500',
              stateInfo.color === 'red' && 'bg-red-500'
            )}
          >
            {stateInfo.nameAr}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>التقدم</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl border-2',
            stateInfo.color === 'gray' && 'border-gray-300 bg-gray-50',
            stateInfo.color === 'blue' && 'border-blue-300 bg-blue-50',
            stateInfo.color === 'yellow' && 'border-yellow-300 bg-yellow-50',
            stateInfo.color === 'orange' && 'border-orange-300 bg-orange-50',
            stateInfo.color === 'green' && 'border-green-300 bg-green-50',
            stateInfo.color === 'red' && 'border-red-300 bg-red-50'
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-xl text-white',
              stateInfo.color === 'gray' && 'bg-gray-500',
              stateInfo.color === 'blue' && 'bg-blue-500',
              stateInfo.color === 'yellow' && 'bg-yellow-500',
              stateInfo.color === 'orange' && 'bg-orange-500',
              stateInfo.color === 'green' && 'bg-green-500',
              stateInfo.color === 'red' && 'bg-red-500'
            )}>
              <CurrentIcon className={cn(
                'w-6 h-6',
                currentStatus === 'ISSUING' && 'animate-spin'
              )} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-lg">{stateInfo.nameAr}</h3>
              <p className="text-sm text-muted-foreground">
                {stateInfo.customerMessage}
              </p>

              {/* Action Button for Customer */}
              {canAct && currentStatus === 'SENT_TO_CLIENT' && (
                <div className="pt-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>قم بتوقيع السند عبر منصة نافذ أولاً</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open('https://nafith.sa', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 ml-2" />
                      فتح منصة نافذ
                    </Button>
                    
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={handleConfirmSigning}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      )}
                      تأكيد التوقيع
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">مراحل السند</h4>
          
          <div className="relative">
            {orderedStates.map((state, index) => {
              const isCompleted = state.order < stateInfo.order;
              const isCurrent = state.status === currentStatus;
              const isPending = state.order > stateInfo.order;
              const StateIcon = statusIcons[state.status];

              return (
                <div key={state.status} className="flex items-start gap-3 relative">
                  {/* Connector Line */}
                  {index < orderedStates.length - 1 && (
                    <div 
                      className={cn(
                        'absolute right-[18px] top-10 w-0.5 h-8',
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10',
                    isCompleted && 'bg-green-500 text-white',
                    isCurrent && 'bg-primary text-white ring-4 ring-primary/20',
                    isPending && 'bg-muted text-muted-foreground'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StateIcon className={cn(
                        'w-4 h-4',
                        isCurrent && state.status === 'ISSUING' && 'animate-spin'
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 pb-6',
                    isPending && 'opacity-50'
                  )}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-medium text-sm',
                        isCurrent && 'text-primary font-bold'
                      )}>
                        {state.nameAr}
                      </span>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          الحالي
                        </Badge>
                      )}
                    </div>
                    {(isCompleted || isCurrent) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {state.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Events */}
        {events.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground">آخر التحديثات</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {events.slice(-3).reverse().map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <span className="font-medium">
                        {getBondState(event.to_status as ExecutiveBondStatus).nameAr}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutiveBondTracker;
