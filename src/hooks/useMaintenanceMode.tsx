import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  loading: boolean;
  maintenanceMessage: string;
  scheduledEnd: Date | null;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenanceMode: false,
  loading: true,
  maintenanceMessage: '',
  scheduledEnd: null,
});

export const useMaintenanceMode = () => useContext(MaintenanceContext);

export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState<Date | null>(null);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value')
          .in('key', ['maintenance_mode', 'maintenance_scheduled', 'maintenance_start_time', 'maintenance_end_time', 'maintenance_message']);

        if (error) throw error;

        const settingsMap: Record<string, any> = {};
        data?.forEach(s => {
          settingsMap[s.key] = s.value;
        });

        const manualMaintenance = settingsMap.maintenance_mode === true;
        const isScheduled = settingsMap.maintenance_scheduled === true;
        const startTime = settingsMap.maintenance_start_time;
        const endTime = settingsMap.maintenance_end_time;
        const message = settingsMap.maintenance_message || 'نعمل حالياً على تحسين الموقع';

        setMaintenanceMessage(message);

        // Check if we're in a scheduled maintenance window
        let scheduledMaintenance = false;
        if (isScheduled && startTime && endTime && startTime !== 'null' && endTime !== 'null') {
          const now = new Date();
          const start = new Date(startTime);
          const end = new Date(endTime);

          if (now >= start && now <= end) {
            scheduledMaintenance = true;
            setScheduledEnd(end);
          }
        }

        setIsMaintenanceMode(manualMaintenance || scheduledMaintenance);
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Check every minute for scheduled maintenance
    const interval = setInterval(checkMaintenanceMode, 60000);

    // Real-time subscription for maintenance mode changes
    const channel = supabase
      .channel('maintenance-mode-check')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          const key = (payload.new as any)?.key;
          const value = (payload.new as any)?.value;
          
          if (key === 'maintenance_mode') {
            setIsMaintenanceMode(value === true);
          } else if (key === 'maintenance_message') {
            setMaintenanceMessage(value || 'نعمل حالياً على تحسين الموقع');
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, loading, maintenanceMessage, scheduledEnd }}>
      {children}
    </MaintenanceContext.Provider>
  );
};
