import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserSettings {
  id: string;
  user_id: string;
  notification_email: boolean;
  notification_orders: boolean;
  notification_promotions: boolean;
  notification_push: boolean;
  language: string;
  theme: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as UserSettings);
      } else {
        // Create default settings if not exists
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings as UserSettings);
      }
    } catch (error: any) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();

    if (!user) return;

    // Real-time subscription
    const channel = supabase
      .channel('user-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setSettings(payload.new as UserSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings, user]);

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user || !settings) return;

    setSaving(key);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      toast.success('تم حفظ الإعداد بنجاح');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('فشل في حفظ الإعداد');
    } finally {
      setSaving(null);
    }
  };

  const updateMultipleSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;

    setSaving('multiple');
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('تم حفظ الإعدادات بنجاح');
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
