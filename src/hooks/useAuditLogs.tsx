import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_value: any;
  new_value: any;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  metadata: any;
}

export const useAuditLogs = (tableName?: string, limit: number = 50) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [tableName, limit]);

  useEffect(() => {
    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const newLog = payload.new as AuditLog;
          if (!tableName || newLog.table_name === tableName) {
            setLogs(prev => [newLog, ...prev].slice(0, limit));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, tableName, limit]);

  return { logs, loading, refetch: fetchLogs };
};
