-- Create function to send points notification
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_current_points INTEGER;
  next_tier RECORD;
  points_to_next INTEGER;
  progress_percentage NUMERIC;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify for earned or bonus points (positive transactions)
  IF NEW.points > 0 AND NEW.type IN ('earned', 'bonus', 'manual') THEN
    -- Create notification for points earned
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'تهانينا! لقد كسبت نقاطاً',
      'لقد حصلت على ' || NEW.points || ' نقطة. ' || COALESCE(NEW.description_ar, NEW.description, ''),
      'success'
    );
    
    -- Get user's current available points
    SELECT available_points INTO user_current_points
    FROM user_points
    WHERE user_id = NEW.user_id;
    
    -- Get the next tier based on current points
    SELECT * INTO next_tier
    FROM reward_tiers
    WHERE is_active = true
      AND min_points > user_current_points
    ORDER BY min_points ASC
    LIMIT 1;
    
    -- If there's a next tier, check if user is close
    IF next_tier.id IS NOT NULL THEN
      points_to_next := next_tier.min_points - user_current_points;
      
      -- Get the previous tier's min_points to calculate progress
      progress_percentage := (user_current_points::NUMERIC / next_tier.min_points::NUMERIC) * 100;
      
      -- Notify if within 80% progress or less than 100 points away
      IF progress_percentage >= 80 OR points_to_next <= 100 THEN
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          NEW.user_id,
          'أنت قريب من المستوى التالي! 🎯',
          'تبقى لك ' || points_to_next || ' نقطة فقط للوصول إلى مستوى ' || next_tier.name_ar || '. استمر!',
          'info'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for points transactions
DROP TRIGGER IF EXISTS on_points_earned ON points_transactions;
CREATE TRIGGER on_points_earned
  AFTER INSERT ON points_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_points_earned();

-- Also create function to notify on tier upgrade
CREATE OR REPLACE FUNCTION public.notify_tier_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
BEGIN
  -- Check if tier changed
  IF OLD.tier_id IS DISTINCT FROM NEW.tier_id AND NEW.tier_id IS NOT NULL THEN
    -- Get old tier name
    IF OLD.tier_id IS NOT NULL THEN
      SELECT name_ar INTO old_tier_name FROM reward_tiers WHERE id = OLD.tier_id;
    ELSE
      old_tier_name := 'البداية';
    END IF;
    
    -- Get new tier name
    SELECT name_ar INTO new_tier_name FROM reward_tiers WHERE id = NEW.tier_id;
    
    -- Create celebration notification
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      '🎉 تهانينا! لقد ترقيت!',
      'لقد وصلت إلى مستوى ' || new_tier_name || '! استمتع بالمزايا الجديدة.',
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for tier upgrades
DROP TRIGGER IF EXISTS on_tier_upgrade ON user_points;
CREATE TRIGGER on_tier_upgrade
  AFTER UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_tier_upgrade();