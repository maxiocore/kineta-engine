CREATE OR REPLACE FUNCTION public.admin_refund_cloud_order(p_order_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o cloud_orders;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO o FROM cloud_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not found'; END IF;
  IF o.status IN ('refunded','active') THEN RAISE EXCEPTION 'not refundable'; END IF;
  UPDATE user_balances SET balance = balance + o.total, total_spent = GREATEST(COALESCE(total_spent,0) - o.total, 0), updated_at = now() WHERE user_id = o.user_id;
  UPDATE cloud_orders SET status = 'refunded' WHERE id = o.id;
  UPDATE cloud_provisioning_jobs SET status = 'cancelled' WHERE order_id = o.id;
  UPDATE cloud_servers SET status = 'cancelled', cancelled_at = now() WHERE id = o.server_id;
  INSERT INTO cloud_activity_logs (user_id, server_id, event, details) VALUES (o.user_id, o.server_id, 'order_refunded', jsonb_build_object('total', o.total, 'actor', auth.uid()));
  RETURN jsonb_build_object('ok', true, 'total', o.total);
END $$;
REVOKE ALL ON FUNCTION public.admin_refund_cloud_order(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_refund_cloud_order(uuid) TO authenticated;