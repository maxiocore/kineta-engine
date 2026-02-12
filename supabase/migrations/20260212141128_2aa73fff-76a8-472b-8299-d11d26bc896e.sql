-- Fix search_path on the new function
CREATE OR REPLACE FUNCTION public.notify_user_on_kyc_update()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  SELECT u.email, p.full_name INTO user_email, user_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;

  INSERT INTO public.app_notifications (
    title, title_ar, message, message_ar, type, target_audience,
    target_user_ids, is_active, created_at, updated_at
  ) VALUES (
    CASE WHEN NEW.status = 'PASSED' THEN 'KYC Approved' WHEN NEW.status = 'FAILED' THEN 'KYC Rejected' ELSE 'KYC Update' END,
    CASE WHEN NEW.status = 'PASSED' THEN 'تم قبول التحقق' WHEN NEW.status = 'FAILED' THEN 'تم رفض التحقق' ELSE 'تحديث التحقق' END,
    CASE WHEN NEW.status = 'PASSED' THEN 'Your identity verification has been approved.' WHEN NEW.status = 'FAILED' THEN 'Your identity verification was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'N/A') ELSE 'Your verification status has been updated.' END,
    CASE WHEN NEW.status = 'PASSED' THEN 'تم قبول تحقق هويتك. يمكنك الآن الوصول لجميع ميزات المنصة.' WHEN NEW.status = 'FAILED' THEN 'تم رفض تحقق هويتك. السبب: ' || COALESCE(NEW.rejection_reason, '-') || '. يمكنك إعادة التقديم.' ELSE 'تم تحديث حالة التحقق.' END,
    CASE WHEN NEW.status = 'PASSED' THEN 'success' WHEN NEW.status = 'FAILED' THEN 'alert' ELSE 'info' END,
    'specific_users',
    ARRAY[NEW.user_id],
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;