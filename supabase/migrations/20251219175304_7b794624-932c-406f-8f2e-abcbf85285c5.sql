-- Enable realtime for balance_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.balance_logs;

-- Enable realtime for user_balances table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_balances;