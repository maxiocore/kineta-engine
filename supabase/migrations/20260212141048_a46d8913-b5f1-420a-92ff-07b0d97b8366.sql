-- Create admin notification edge function trigger
CREATE OR REPLACE FUNCTION public.notify_user_on_kyc_update()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user email and name
  SELECT u.email, p.full_name INTO user_email, user_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  -- Create notification in app_notifications
  INSERT INTO public.app_notifications (
    title, title_ar, message, message_ar, type, target_audience,
    target_user_ids, is_active, created_at, updated_at
  ) VALUES (
    CASE 
      WHEN NEW.status = 'PASSED' THEN 'KYC Approved'
      WHEN NEW.status = 'FAILED' THEN 'KYC Rejected'
      ELSE 'KYC Update'
    END,
    CASE 
      WHEN NEW.status = 'PASSED' THEN 'تم قبول التحقق'
      WHEN NEW.status = 'FAILED' THEN 'تم رفض التحقق'
      ELSE 'تحديث التحقق'
    END,
    CASE 
      WHEN NEW.status = 'PASSED' THEN 'Your identity verification has been approved. You can now access all platform features.'
      WHEN NEW.status = 'FAILED' THEN 'Your identity verification was rejected. You can submit again with the correct documents.'
      ELSE 'Your verification status has been updated.'
    END,
    CASE 
      WHEN NEW.status = 'PASSED' THEN 'تم قبول تحقق هويتك. يمكنك الآن الوصول لجميع ميزات المنصة.'
      WHEN NEW.status = 'FAILED' THEN 'تم رفض تحقق هويتك. يمكنك إعادة محاولة برفع الوثائق الصحيحة.'
      ELSE 'تم تحديث حالة التحقق الخاص بك.'
    END,
    CASE WHEN NEW.status = 'PASSED' THEN 'success' WHEN NEW.status = 'FAILED' THEN 'alert' ELSE 'info' END,
    'specific_users',
    ARRAY[NEW.user_id],
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS kyc_update_notification_trigger ON public.kyc_verifications;

-- Create trigger for KYC updates
CREATE TRIGGER kyc_update_notification_trigger
AFTER UPDATE ON public.kyc_verifications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_user_on_kyc_update();