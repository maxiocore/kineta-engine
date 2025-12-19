-- Enable realtime for cashback tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_cashback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashback_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cashback_settings;