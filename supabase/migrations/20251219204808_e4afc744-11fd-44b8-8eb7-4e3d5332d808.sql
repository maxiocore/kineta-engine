-- Enable realtime for deposits table only (user_balances already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;