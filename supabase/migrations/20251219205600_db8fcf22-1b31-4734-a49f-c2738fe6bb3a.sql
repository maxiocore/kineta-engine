-- Enable realtime for referrals and coupons tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_usages;