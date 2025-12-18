-- Create reward tiers table
CREATE TABLE public.reward_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  points_multiplier NUMERIC NOT NULL DEFAULT 1,
  benefits JSONB DEFAULT '[]'::jsonb,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Award',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user points table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  redeemed_points INTEGER NOT NULL DEFAULT 0,
  tier_id UUID REFERENCES public.reward_tiers(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points transactions table
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'earned', -- earned, redeemed, expired, bonus
  description TEXT,
  description_ar TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for reward_tiers
CREATE POLICY "Anyone can view active reward tiers" 
ON public.reward_tiers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage reward tiers" 
ON public.reward_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_points
CREATE POLICY "Users can view their own points" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all points" 
ON public.user_points 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for points_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.points_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.points_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to initialize user points
CREATE OR REPLACE FUNCTION public.init_user_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_points (user_id, total_points, available_points)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create user points on new user
CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.init_user_points();

-- Function to award points on completed order
CREATE OR REPLACE FUNCTION public.award_order_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_award INTEGER;
  user_multiplier NUMERIC;
BEGIN
  -- Only award points when order is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get user's tier multiplier
    SELECT COALESCE(rt.points_multiplier, 1) INTO user_multiplier
    FROM public.user_points up
    LEFT JOIN public.reward_tiers rt ON rt.id = up.tier_id
    WHERE up.user_id = NEW.user_id;
    
    IF user_multiplier IS NULL THEN
      user_multiplier := 1;
    END IF;
    
    -- Calculate points (1 point per 1 currency unit, multiplied by tier)
    points_to_award := FLOOR(NEW.total_price * user_multiplier);
    
    -- Insert points transaction
    INSERT INTO public.points_transactions (user_id, points, type, description, description_ar, order_id)
    VALUES (
      NEW.user_id, 
      points_to_award, 
      'earned', 
      'Points earned from order ' || NEW.order_number,
      'نقاط مكتسبة من الطلب ' || NEW.order_number,
      NEW.id
    );
    
    -- Update user points
    INSERT INTO public.user_points (user_id, total_points, available_points)
    VALUES (NEW.user_id, points_to_award, points_to_award)
    ON CONFLICT (user_id) DO UPDATE 
    SET 
      total_points = user_points.total_points + points_to_award,
      available_points = user_points.available_points + points_to_award,
      updated_at = now();
      
    -- Update user tier based on total points
    UPDATE public.user_points
    SET tier_id = (
      SELECT id FROM public.reward_tiers 
      WHERE is_active = true AND min_points <= (
        SELECT total_points FROM public.user_points WHERE user_id = NEW.user_id
      )
      ORDER BY min_points DESC 
      LIMIT 1
    )
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for awarding points
CREATE TRIGGER on_order_completed_award_points
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_order_points();

-- Insert default reward tiers
INSERT INTO public.reward_tiers (name, name_ar, min_points, points_multiplier, color, icon, benefits) VALUES
('برونزي', 'Bronze', 0, 1, '#CD7F32', 'Medal', '["نقطة واحدة لكل 1$"]'),
('فضي', 'Silver', 500, 1.25, '#C0C0C0', 'Award', '["1.25 نقطة لكل 1$", "خصم 5% على الخدمات"]'),
('ذهبي', 'Gold', 2000, 1.5, '#FFD700', 'Crown', '["1.5 نقطة لكل 1$", "خصم 10% على الخدمات", "دعم أولوية"]'),
('بلاتيني', 'Platinum', 5000, 2, '#E5E4E2', 'Gem', '["نقطتان لكل 1$", "خصم 15% على الخدمات", "دعم VIP", "عروض حصرية"]');