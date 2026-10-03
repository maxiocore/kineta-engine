REVOKE ALL ON FUNCTION public.cloud_ssh_keys_validate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_provisioning_email_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_order_receipt_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cloud_orders_require_ssh_key() FROM PUBLIC, anon, authenticated;