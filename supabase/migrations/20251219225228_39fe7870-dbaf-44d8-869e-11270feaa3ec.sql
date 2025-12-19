-- Create table for monthly goals and achievements
CREATE TABLE public.monthly_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  monthly_goal INTEGER NOT NULL DEFAULT 10,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  goal_achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  bonus_points_awarded INTEGER DEFAULT 0,
  exceeded_by INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.monthly_achievements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements"
ON public.monthly_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own achievements
CREATE POLICY "Users can update their own achievements"
ON public.monthly_achievements
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all achievements
CREATE POLICY "Admins can manage all achievements"
ON public.monthly_achievements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_achievements_updated_at
BEFORE UPDATE ON public.monthly_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_monthly_achievements_user_month ON public.monthly_achievements(user_id, month DESC);