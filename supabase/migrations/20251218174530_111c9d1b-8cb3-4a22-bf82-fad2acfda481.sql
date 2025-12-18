
-- إنشاء جدول مستويات VIP
CREATE TABLE public.vip_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  min_referrals INTEGER NOT NULL DEFAULT 0,
  min_earnings NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 5,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'Star',
  benefits JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة عمود نسبة العمولة المخصصة وعمود مستوى VIP لجدول referral_codes
ALTER TABLE public.referral_codes 
ADD COLUMN custom_commission_rate NUMERIC DEFAULT NULL,
ADD COLUMN vip_level_id UUID REFERENCES public.vip_levels(id) ON DELETE SET NULL;

-- تفعيل RLS
ALTER TABLE public.vip_levels ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لمستويات VIP
CREATE POLICY "Anyone can view active VIP levels" 
ON public.vip_levels 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage VIP levels" 
ON public.vip_levels 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- إدخال مستويات VIP الافتراضية
INSERT INTO public.vip_levels (name, name_ar, min_referrals, min_earnings, commission_rate, color, icon, display_order, benefits) VALUES
('Bronze', 'برونزي', 0, 0, 5, '#CD7F32', 'Medal', 1, '["عمولة 5% على كل طلب", "رابط إحالة مخصص"]'::jsonb),
('Silver', 'فضي', 5, 100, 7, '#C0C0C0', 'Award', 2, '["عمولة 7% على كل طلب", "رابط إحالة مخصص", "دعم أولوية"]'::jsonb),
('Gold', 'ذهبي', 15, 500, 10, '#FFD700', 'Crown', 3, '["عمولة 10% على كل طلب", "رابط إحالة مخصص", "دعم VIP", "مكافآت شهرية"]'::jsonb),
('Platinum', 'بلاتيني', 50, 2000, 15, '#E5E4E2', 'Gem', 4, '["عمولة 15% على كل طلب", "رابط إحالة مخصص", "دعم VIP 24/7", "مكافآت أسبوعية", "عروض حصرية"]'::jsonb);

-- تحديث دالة حساب العمولة لاستخدام النسبة المخصصة أو نسبة VIP
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
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
    -- فقط عند اكتمال الطلب
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- البحث عن الإحالة مع معلومات كود الإحالة ومستوى VIP
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
            -- استخدام النسبة المخصصة أولاً، ثم نسبة VIP، ثم النسبة الافتراضية
            effective_rate := COALESCE(ref_record.custom_commission_rate, ref_record.vip_rate, ref_record.commission_rate, 5);
            
            -- حساب العمولة
            commission := NEW.total_price * (effective_rate / 100);
            
            -- إدخال سجل العمولة
            INSERT INTO public.referral_commissions (referral_id, order_id, order_amount, commission_rate, commission_amount)
            VALUES (ref_record.id, NEW.id, NEW.total_price, effective_rate, commission);
            
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
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- دالة لتحديث مستوى VIP تلقائياً
CREATE OR REPLACE FUNCTION public.update_user_vip_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_vip_level_id UUID;
BEGIN
    -- البحث عن أعلى مستوى VIP مؤهل له المستخدم
    SELECT id INTO new_vip_level_id
    FROM public.vip_levels
    WHERE is_active = true
    AND min_referrals <= NEW.total_referrals
    AND min_earnings <= NEW.total_earnings
    ORDER BY commission_rate DESC
    LIMIT 1;
    
    -- تحديث مستوى VIP إذا تغير
    IF new_vip_level_id IS DISTINCT FROM NEW.vip_level_id THEN
        NEW.vip_level_id := new_vip_level_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إنشاء trigger لتحديث مستوى VIP تلقائياً
CREATE TRIGGER update_vip_level_on_referral_update
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_user_vip_level();
