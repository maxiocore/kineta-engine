-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  min_spending NUMERIC NOT NULL DEFAULT 0,
  min_orders INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table for awarded badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Badges policies (anyone can view badges)
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- User badges policies
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user badges"
ON public.user_badges FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user badges"
ON public.user_badges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default badges
INSERT INTO public.badges (name, name_ar, description, description_ar, icon, color, tier, min_spending, min_orders) VALUES
('Newcomer', 'مبتدئ', 'Welcome to the platform', 'مرحباً بك في المنصة', 'UserPlus', '#6b7280', 1, 0, 1),
('Bronze Member', 'عضو برونزي', 'Spent $50 or more', 'أنفقت 50$ أو أكثر', 'Medal', '#cd7f32', 2, 50, 3),
('Silver Member', 'عضو فضي', 'Spent $200 or more', 'أنفقت 200$ أو أكثر', 'Award', '#c0c0c0', 3, 200, 10),
('Gold Member', 'عضو ذهبي', 'Spent $500 or more', 'أنفقت 500$ أو أكثر', 'Trophy', '#ffd700', 4, 500, 25),
('Platinum Member', 'عضو بلاتيني', 'Spent $1000 or more', 'أنفقت 1000$ أو أكثر', 'Crown', '#e5e4e2', 5, 1000, 50),
('Diamond Member', 'عضو ماسي', 'Spent $5000 or more', 'أنفقت 5000$ أو أكثر', 'Gem', '#b9f2ff', 6, 5000, 100),
('Loyal Customer', 'عميل وفي', 'Made 20+ orders', 'قمت بـ 20 طلب أو أكثر', 'Heart', '#ef4444', 3, 0, 20),
('Big Spender', 'منفق كبير', 'Single order over $100', 'طلب واحد بقيمة أكثر من 100$', 'Zap', '#8b5cf6', 3, 100, 0),
('VIP', 'كبار العملاء', 'Elite status member', 'عضو من النخبة', 'Star', '#f59e0b', 6, 10000, 200);

-- Enable realtime for user_badges
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;