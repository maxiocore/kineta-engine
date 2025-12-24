-- Create challenges table for daily/weekly challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  type TEXT NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly')),
  challenge_type TEXT NOT NULL DEFAULT 'orders' CHECK (challenge_type IN ('orders', 'spending', 'services', 'referrals', 'deposits')),
  target_value INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 10,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenges table to track user progress
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  points_awarded INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Anyone can view active challenges" 
ON public.challenges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage challenges" 
ON public.challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.user_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user challenges" 
ON public.user_challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update user challenge progress
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_record RECORD;
  user_challenge_record RECORD;
  today DATE := CURRENT_DATE;
  week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  week_end DATE := (date_trunc('week', CURRENT_DATE) + interval '6 days')::DATE;
BEGIN
  -- Only process completed orders
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Loop through active challenges
    FOR challenge_record IN 
      SELECT * FROM public.challenges WHERE is_active = true
    LOOP
      -- Determine period based on challenge type
      IF challenge_record.type = 'daily' THEN
        -- Check if user has this daily challenge
        SELECT * INTO user_challenge_record
        FROM public.user_challenges
        WHERE user_id = NEW.user_id
          AND challenge_id = challenge_record.id
          AND period_start = today;
          
        IF NOT FOUND THEN
          -- Create daily challenge for user
          INSERT INTO public.user_challenges (user_id, challenge_id, target_value, period_start, period_end)
          VALUES (NEW.user_id, challenge_record.id, challenge_record.target_value, today, today);
          
          SELECT * INTO user_challenge_record
          FROM public.user_challenges
          WHERE user_id = NEW.user_id AND challenge_id = challenge_record.id AND period_start = today;
        END IF;
      ELSE
        -- Weekly challenge
        SELECT * INTO user_challenge_record
        FROM public.user_challenges
        WHERE user_id = NEW.user_id
          AND challenge_id = challenge_record.id
          AND period_start = week_start;
          
        IF NOT FOUND THEN
          INSERT INTO public.user_challenges (user_id, challenge_id, target_value, period_start, period_end)
          VALUES (NEW.user_id, challenge_record.id, challenge_record.target_value, week_start, week_end);
          
          SELECT * INTO user_challenge_record
          FROM public.user_challenges
          WHERE user_id = NEW.user_id AND challenge_id = challenge_record.id AND period_start = week_start;
        END IF;
      END IF;
      
      -- Update progress based on challenge type
      IF challenge_record.challenge_type = 'orders' AND NOT user_challenge_record.is_completed THEN
        UPDATE public.user_challenges
        SET 
          current_value = current_value + 1,
          updated_at = now()
        WHERE id = user_challenge_record.id;
      ELSIF challenge_record.challenge_type = 'spending' AND NOT user_challenge_record.is_completed THEN
        UPDATE public.user_challenges
        SET 
          current_value = current_value + NEW.total_price::INTEGER,
          updated_at = now()
        WHERE id = user_challenge_record.id;
      END IF;
      
      -- Check if challenge is completed
      SELECT * INTO user_challenge_record
      FROM public.user_challenges
      WHERE id = user_challenge_record.id;
      
      IF user_challenge_record.current_value >= user_challenge_record.target_value AND NOT user_challenge_record.is_completed THEN
        -- Mark as completed and award points
        UPDATE public.user_challenges
        SET 
          is_completed = true,
          completed_at = now(),
          points_awarded = challenge_record.reward_points,
          updated_at = now()
        WHERE id = user_challenge_record.id;
        
        -- Award points to user
        INSERT INTO public.points_transactions (user_id, points, type, description, description_ar)
        VALUES (
          NEW.user_id,
          challenge_record.reward_points,
          'bonus',
          'Challenge completed: ' || challenge_record.title,
          'تحدي مكتمل: ' || challenge_record.title_ar
        );
        
        -- Update user points
        UPDATE public.user_points
        SET 
          total_points = total_points + challenge_record.reward_points,
          available_points = available_points + challenge_record.reward_points,
          updated_at = now()
        WHERE user_id = NEW.user_id;
        
        -- Create notification
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (
          NEW.user_id,
          '🎯 تحدي مكتمل!',
          'أكملت تحدي "' || challenge_record.title_ar || '" وحصلت على ' || challenge_record.reward_points || ' نقطة!',
          'success'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for challenge progress
CREATE TRIGGER on_order_complete_update_challenges
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_challenge_progress();

-- Insert default challenges
INSERT INTO public.challenges (title, title_ar, description, description_ar, type, challenge_type, target_value, reward_points, icon, color, display_order) VALUES
('First Order Today', 'الطلب الأول اليوم', 'Complete your first order today', 'أكمل أول طلب لك اليوم', 'daily', 'orders', 1, 10, '🎯', '#10b981', 1),
('Triple Orders', 'ثلاثة طلبات', 'Complete 3 orders today', 'أكمل 3 طلبات اليوم', 'daily', 'orders', 3, 30, '🔥', '#f59e0b', 2),
('Big Spender', 'المنفق الكبير', 'Spend $50 or more today', 'أنفق 50$ أو أكثر اليوم', 'daily', 'spending', 50, 25, '💰', '#8b5cf6', 3),
('Weekly Champion', 'بطل الأسبوع', 'Complete 10 orders this week', 'أكمل 10 طلبات هذا الأسبوع', 'weekly', 'orders', 10, 100, '🏆', '#ec4899', 1),
('Weekly Investor', 'المستثمر الأسبوعي', 'Spend $200 or more this week', 'أنفق 200$ أو أكثر هذا الأسبوع', 'weekly', 'spending', 200, 150, '💎', '#06b6d4', 2),
('Mega Week', 'الأسبوع الضخم', 'Complete 25 orders this week', 'أكمل 25 طلب هذا الأسبوع', 'weekly', 'orders', 25, 250, '⭐', '#eab308', 3);

-- Update updated_at trigger
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_challenges_updated_at
  BEFORE UPDATE ON public.user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();