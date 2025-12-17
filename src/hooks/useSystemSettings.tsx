import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

interface SettingsState {
  [key: string]: any;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SettingsState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      const settingsObj: SettingsState = {};
      data?.forEach((setting: SystemSetting) => {
        settingsObj[setting.key] = setting.value;
      });
      setSettings(settingsObj);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Real-time subscription
    const channel = supabase
      .channel('system-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newSetting = payload.new as SystemSetting;
            setSettings(prev => ({
              ...prev,
              [newSetting.key]: newSetting.value
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: JSON.stringify(value),
          updated_at: new Date().toISOString(),
          updated_by: user?.id 
        })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('تم حفظ الإعداد بنجاح');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('فشل في حفظ الإعداد');
    } finally {
      setSaving(null);
    }
  };

  const updateMultipleSettings = async (updates: { key: string; value: any }[]) => {
    setSaving('multiple');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ 
            value: JSON.stringify(update.value),
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          })
          .eq('key', update.key);

        if (error) throw error;
      }

      const newSettings = { ...settings };
      updates.forEach(u => {
        newSettings[u.key] = u.value;
      });
      setSettings(newSettings);
      toast.success('تم حفظ جميع الإعدادات بنجاح');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(null);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateSetting,
    updateMultipleSettings,
    refetch: fetchSettings
  };
};
