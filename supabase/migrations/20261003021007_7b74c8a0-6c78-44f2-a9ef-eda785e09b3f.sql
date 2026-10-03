CREATE TABLE public.cloud_e2e_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key text NOT NULL UNIQUE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ready',
  stage text NOT NULL DEFAULT 'not_started',
  failed_stage text,
  error text,
  provider_code text NOT NULL DEFAULT 'hetzner_cloud',
  server_name text NOT NULL,
  server_type text NOT NULL,
  location text NOT NULL,
  image text NOT NULL,
  provider_resource_id text,
  provider_ssh_key_id text,
  pending_action_id text,
  provider_status text,
  ipv4 text, ipv6 text,
  preflight jsonb, connectivity jsonb, customer_data jsonb,
  estimated_cost jsonb,
  created_by uuid,
  started_at timestamptz, running_at timestamptz, passed_at timestamptz, cleaned_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_e2e_tests TO authenticated;
GRANT ALL ON public.cloud_e2e_tests TO service_role;
ALTER TABLE public.cloud_e2e_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view e2e tests" ON public.cloud_e2e_tests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_cloud_e2e_tests_updated BEFORE UPDATE ON public.cloud_e2e_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cloud_e2e_test_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.cloud_e2e_tests(id) ON DELETE CASCADE,
  actor_id uuid,
  stage text NOT NULL,
  result text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cloud_e2e_test_events TO authenticated;
GRANT ALL ON public.cloud_e2e_test_events TO service_role;
ALTER TABLE public.cloud_e2e_test_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view e2e events" ON public.cloud_e2e_test_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX ON public.cloud_e2e_test_events(test_id, created_at);

CREATE TABLE public.cloud_e2e_test_keys (
  test_id uuid PRIMARY KEY REFERENCES public.cloud_e2e_tests(id) ON DELETE CASCADE,
  public_key text NOT NULL,
  private_key_enc text NOT NULL,
  iv text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cloud_e2e_test_keys TO service_role;
ALTER TABLE public.cloud_e2e_test_keys ENABLE ROW LEVEL SECURITY;