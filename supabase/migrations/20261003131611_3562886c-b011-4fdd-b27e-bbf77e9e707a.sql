CREATE OR REPLACE FUNCTION public.ticket_messages_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(),'') = 'authenticated' AND NOT public.has_role(auth.uid(),'admin') THEN
    NEW.is_admin := false;
    NEW.sender_id := auth.uid();
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.ticket_messages_guard() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS ticket_messages_guard ON public.ticket_messages;
CREATE TRIGGER ticket_messages_guard BEFORE INSERT OR UPDATE ON public.ticket_messages FOR EACH ROW EXECUTE FUNCTION public.ticket_messages_guard();