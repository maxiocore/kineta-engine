-- Create audit_logs table for tracking all system changes
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id text,
    action text NOT NULL,
    old_value jsonb,
    new_value jsonb,
    user_id uuid REFERENCES auth.users(id),
    user_email text,
    ip_address text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert logs
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enable realtime for audit logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- Create index for faster queries
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Create function to log settings changes
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, new_value, user_id)
    VALUES (
      'system_settings',
      NEW.key,
      'UPDATE',
      jsonb_build_object('key', OLD.key, 'value', OLD.value),
      jsonb_build_object('key', NEW.key, 'value', NEW.value),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_value, user_id)
    VALUES (
      'system_settings',
      NEW.key,
      'INSERT',
      jsonb_build_object('key', NEW.key, 'value', NEW.value),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, user_id)
    VALUES (
      'system_settings',
      OLD.key,
      'DELETE',
      jsonb_build_object('key', OLD.key, 'value', OLD.value),
      auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for settings changes
CREATE TRIGGER settings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.log_settings_change();