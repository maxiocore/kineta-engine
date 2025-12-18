-- Create trigger function for orders audit
CREATE OR REPLACE FUNCTION public.log_orders_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, new_value, user_id)
    VALUES (
      'orders',
      NEW.id::text,
      'UPDATE',
      jsonb_build_object('order_number', OLD.order_number, 'status', OLD.status, 'total_price', OLD.total_price),
      jsonb_build_object('order_number', NEW.order_number, 'status', NEW.status, 'total_price', NEW.total_price),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_value, user_id)
    VALUES (
      'orders',
      NEW.id::text,
      'INSERT',
      jsonb_build_object('order_number', NEW.order_number, 'status', NEW.status, 'total_price', NEW.total_price, 'user_id', NEW.user_id),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, user_id)
    VALUES (
      'orders',
      OLD.id::text,
      'DELETE',
      jsonb_build_object('order_number', OLD.order_number, 'status', OLD.status),
      auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for orders
CREATE TRIGGER orders_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_orders_change();

-- Create trigger function for profiles audit
CREATE OR REPLACE FUNCTION public.log_profiles_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, new_value, user_id)
    VALUES (
      'profiles',
      NEW.id::text,
      'UPDATE',
      jsonb_build_object('full_name', OLD.full_name, 'email', OLD.email, 'is_verified', OLD.is_verified),
      jsonb_build_object('full_name', NEW.full_name, 'email', NEW.email, 'is_verified', NEW.is_verified),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_value, user_id)
    VALUES (
      'profiles',
      NEW.id::text,
      'INSERT',
      jsonb_build_object('full_name', NEW.full_name, 'email', NEW.email),
      auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for profiles
CREATE TRIGGER profiles_audit_trigger
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_profiles_change();

-- Create trigger function for support tickets audit
CREATE OR REPLACE FUNCTION public.log_tickets_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, new_value, user_id)
    VALUES (
      'support_tickets',
      NEW.id::text,
      'UPDATE',
      jsonb_build_object('subject', OLD.subject, 'status', OLD.status, 'priority', OLD.priority),
      jsonb_build_object('subject', NEW.subject, 'status', NEW.status, 'priority', NEW.priority),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_value, user_id)
    VALUES (
      'support_tickets',
      NEW.id::text,
      'INSERT',
      jsonb_build_object('subject', NEW.subject, 'status', NEW.status, 'priority', NEW.priority, 'user_id', NEW.user_id),
      auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for support tickets
CREATE TRIGGER tickets_audit_trigger
AFTER INSERT OR UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.log_tickets_change();

-- Create trigger function for services audit
CREATE OR REPLACE FUNCTION public.log_services_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, new_value, user_id)
    VALUES (
      'services',
      NEW.id::text,
      'UPDATE',
      jsonb_build_object('name', OLD.name, 'status', OLD.status, 'price', OLD.price),
      jsonb_build_object('name', NEW.name, 'status', NEW.status, 'price', NEW.price),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_value, user_id)
    VALUES (
      'services',
      NEW.id::text,
      'INSERT',
      jsonb_build_object('name', NEW.name, 'status', NEW.status, 'price', NEW.price, 'category', NEW.category),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_value, user_id)
    VALUES (
      'services',
      OLD.id::text,
      'DELETE',
      jsonb_build_object('name', OLD.name, 'status', OLD.status),
      auth.uid()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for services
CREATE TRIGGER services_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.log_services_change();