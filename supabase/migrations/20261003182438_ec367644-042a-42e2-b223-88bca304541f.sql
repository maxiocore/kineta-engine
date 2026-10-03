ALTER TABLE public.cloud_servers ADD COLUMN IF NOT EXISTS access_method text NOT NULL DEFAULT 'auto';
ALTER TABLE public.cloud_servers DROP CONSTRAINT IF EXISTS cloud_servers_access_method_chk;
ALTER TABLE public.cloud_servers ADD CONSTRAINT cloud_servers_access_method_chk CHECK (access_method IN ('auto','ssh_key'));

CREATE OR REPLACE FUNCTION public.cloud_servers_auto_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.hostname := 'srv-' || substr(replace(NEW.id::text, '-', ''), 1, 10);
  NEW.access_method := CASE WHEN NEW.ssh_key_id IS NULL THEN 'auto' ELSE 'ssh_key' END;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.cloud_servers_auto_identity() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS cloud_servers_auto_identity ON public.cloud_servers;
CREATE TRIGGER cloud_servers_auto_identity BEFORE INSERT ON public.cloud_servers FOR EACH ROW EXECUTE FUNCTION public.cloud_servers_auto_identity();

CREATE OR REPLACE FUNCTION public.cloud_orders_require_ssh_key()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- SSH key is only required when the customer chose their own key; automatic access needs none.
  IF NOT coalesce(NEW.is_simulation, false) AND EXISTS (
       SELECT 1 FROM cloud_servers s WHERE s.id = NEW.server_id AND s.access_method = 'ssh_key'
         AND NOT EXISTS (SELECT 1 FROM cloud_ssh_keys k WHERE k.id = s.ssh_key_id AND k.user_id = s.user_id)) THEN
    RAISE EXCEPTION 'ssh key required';
  END IF;
  RETURN NEW;
END $$;

CREATE TABLE IF NOT EXISTS public.cloud_server_credentials (
  server_id uuid PRIMARY KEY REFERENCES public.cloud_servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL DEFAULT 'root',
  secret_enc text NOT NULL DEFAULT '',
  iv text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  revealed_at timestamptz,
  wiped_at timestamptz
);
GRANT ALL ON public.cloud_server_credentials TO service_role;
ALTER TABLE public.cloud_server_credentials ENABLE ROW LEVEL SECURITY;