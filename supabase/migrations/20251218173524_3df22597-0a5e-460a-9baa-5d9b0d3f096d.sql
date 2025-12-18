-- جدول نظام الإحالة (Referral System)
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    referral_code TEXT NOT NULL,
    commission_rate NUMERIC NOT NULL DEFAULT 5,
    total_commission NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    converted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (referred_id)
);

-- جدول أكواد الإحالة
CREATE TABLE public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عمولات الإحالة
CREATE TABLE public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_amount NUMERIC NOT NULL,
    commission_rate NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- سياسات referrals
CREATE POLICY "Users can view their referrals as referrer" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view if they are referred" ON public.referrals
    FOR SELECT USING (auth.uid() = referred_id);

CREATE POLICY "System can insert referrals" ON public.referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals" ON public.referrals
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- سياسات referral_codes
CREATE POLICY "Users can view their own referral code" ON public.referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes for validation" ON public.referral_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "System can insert referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all referral codes" ON public.referral_codes
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- سياسات referral_commissions
CREATE POLICY "Users can view their commissions" ON public.referral_commissions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.referrals 
        WHERE referrals.id = referral_commissions.referral_id 
        AND referrals.referrer_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all commissions" ON public.referral_commissions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- دالة لإنشاء كود إحالة تلقائياً للمستخدمين الجدد
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- إنشاء كود عشوائي من 8 أحرف
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    INSERT INTO public.referral_codes (user_id, code)
    VALUES (NEW.id, new_code)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- تريجر لإنشاء كود الإحالة عند إنشاء بروفايل جديد
CREATE TRIGGER create_referral_code_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_referral_code();

-- دالة لحساب العمولة عند اكتمال طلب
CREATE OR REPLACE FUNCTION public.calculate_referral_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ref_record RECORD;
    commission NUMERIC;
BEGIN
    -- فقط عند اكتمال الطلب
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- البحث عن الإحالة
        SELECT r.id, r.referrer_id, r.commission_rate 
        INTO ref_record
        FROM public.referrals r
        WHERE r.referred_id = NEW.user_id
        AND r.status = 'converted';
        
        IF FOUND THEN
            -- حساب العمولة
            commission := NEW.total_price * (ref_record.commission_rate / 100);
            
            -- إدخال سجل العمولة
            INSERT INTO public.referral_commissions (referral_id, order_id, order_amount, commission_rate, commission_amount)
            VALUES (ref_record.id, NEW.id, NEW.total_price, ref_record.commission_rate, commission);
            
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
$$;

-- تريجر لحساب العمولة
CREATE TRIGGER calculate_commission_on_order_complete
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_referral_commission();