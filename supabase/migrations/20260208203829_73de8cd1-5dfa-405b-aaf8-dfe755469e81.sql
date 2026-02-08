-- Allow users to insert their own redemption transactions
CREATE POLICY "Users can insert their own redemption transactions"
ON public.points_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND type = 'redeemed');

-- Allow users to update their own points (for redemption)
CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to upsert their own balance (for redemption)
CREATE POLICY "Users can update their own balance"
ON public.user_balances
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to insert their own balance if not exists
CREATE POLICY "Users can insert their own balance"
ON public.user_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id);