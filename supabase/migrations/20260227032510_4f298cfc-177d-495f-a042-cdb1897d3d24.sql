
-- دالة حساب عمولة الإحالة عند إتمام الإيداع
CREATE OR REPLACE FUNCTION public.calculate_referral_commission_on_deposit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    ref_record RECORD;
    commission NUMERIC;
    effective_rate NUMERIC;
BEGIN
    -- فقط عند اكتمال الإيداع
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- البحث عن الإحالة
        SELECT r.id, r.referrer_id, r.commission_rate,
               rc.custom_commission_rate,
               COALESCE(vl.commission_rate, 5) as vip_rate
        INTO ref_record
        FROM public.referrals r
        JOIN public.referral_codes rc ON rc.user_id = r.referrer_id
        LEFT JOIN public.vip_levels vl ON vl.id = rc.vip_level_id
        WHERE r.referred_id = NEW.user_id
        AND r.status = 'converted';
        
        IF FOUND THEN
            -- استخدام النسبة المخصصة أولاً، ثم نسبة VIP، ثم الافتراضية
            effective_rate := COALESCE(ref_record.custom_commission_rate, ref_record.vip_rate, ref_record.commission_rate, 5);
            
            -- حساب العمولة من مبلغ الإيداع
            commission := NEW.amount * (effective_rate / 100);
            
            -- إدخال سجل العمولة
            INSERT INTO public.referral_commissions (referral_id, order_id, order_amount, commission_rate, commission_amount)
            VALUES (ref_record.id, NULL, NEW.amount, effective_rate, commission);
            
            -- تحديث إجمالي العمولات في الإحالة
            UPDATE public.referrals
            SET total_commission = total_commission + commission
            WHERE id = ref_record.id;
            
            -- تحديث إجمالي الأرباح في كود الإحالة
            UPDATE public.referral_codes
            SET total_earnings = total_earnings + commission
            WHERE user_id = ref_record.referrer_id;
            
            -- إضافة العمولة لرصيد المُحيل
            UPDATE public.user_balances
            SET balance = balance + commission,
                updated_at = now()
            WHERE user_id = ref_record.referrer_id;
            
            -- إشعار المُحيل
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
              ref_record.referrer_id,
              '💰 عمولة إحالة جديدة!',
              'حصلت على عمولة ' || commission || ' ر.س من إيداع أحد المُحالين بمبلغ ' || NEW.amount || ' ر.س',
              'success'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- ربط الـ trigger بجدول الإيداعات
CREATE TRIGGER calculate_commission_on_deposit_complete
    AFTER UPDATE ON public.deposits
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_referral_commission_on_deposit();
