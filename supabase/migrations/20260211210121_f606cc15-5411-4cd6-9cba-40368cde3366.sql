
-- SMS Templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  message_template text NOT NULL,
  variables text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for sms_templates
CREATE POLICY "Admins can manage sms_templates"
ON public.sms_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can read sms_templates"
ON public.sms_templates FOR SELECT
TO service_role
USING (true);

-- Auto-update timestamp trigger
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin policies to existing sms_logs if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'Admins can view sms_logs') THEN
    CREATE POLICY "Admins can view sms_logs"
    ON public.sms_logs FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Insert default templates
INSERT INTO public.sms_templates (template_key, name_ar, category, message_template, variables, description) VALUES
('wallet_credit', 'إشعار إيداع رصيد', 'financial', E'✅ إيداع رصيد\n━━━━━━━━━━\n💰 المبلغ: {{amount}} ر.س\n💳 الرصيد المتاح: {{balance}} ر.س\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق المالية | ASH HOLDING', '{amount,balance,date}', 'يرسل عند إيداع مبلغ في محفظة المستخدم'),
('wallet_debit', 'إشعار خصم رصيد', 'financial', E'⚠️ خصم رصيد\n━━━━━━━━━━\n💸 المبلغ: {{amount}} ر.س\n📋 السبب: {{reason}}\n💳 الرصيد المتاح: {{balance}} ر.س\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق المالية | ASH HOLDING', '{amount,reason,balance,date}', 'يرسل عند خصم مبلغ من محفظة المستخدم'),
('order_status_update', 'تحديث حالة الطلب', 'orders', E'📦 تحديث طلبك\n━━━━━━━━━━\n🔢 رقم الطلب: #{{order_number}}\n📋 الخدمة: {{service_name}}\n🔄 الحالة: {{status}}\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق الطلبات | ASH HOLDING', '{order_number,service_name,status,date}', 'يرسل عند تغيير حالة الطلب'),
('order_completed', 'اكتمال الطلب', 'orders', E'✅ تم إكمال طلبك\n━━━━━━━━━━\n🔢 رقم الطلب: #{{order_number}}\n📋 الخدمة: {{service_name}}\n✨ الحالة: مكتمل\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق الطلبات | ASH HOLDING', '{order_number,service_name,date}', 'يرسل عند اكتمال الطلب'),
('login_alert', 'تنبيه تسجيل دخول', 'auth', E'🔐 تسجيل دخول جديد\n━━━━━━━━━━\n📱 الجهاز: {{device}}\n📍 الموقع: {{location}}\n🕐 الوقت: {{time}}\n━━━━━━━━━━\nإذا لم تكن أنت، غيّر كلمة المرور فوراً\nفريق الأمان | ASH HOLDING', '{device,location,time}', 'يرسل عند تسجيل دخول من جهاز جديد'),
('badge_awarded', 'منح شارة', 'rewards', E'🏅 مبروك! حصلت على شارة جديدة\n━━━━━━━━━━\n🎖️ الشارة: {{badge_name}}\n⭐ المستوى: {{tier}}\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق المكافآت | ASH HOLDING', '{badge_name,tier,date}', 'يرسل عند حصول المستخدم على شارة'),
('points_redeemed', 'استبدال نقاط', 'rewards', E'🎁 تم استبدال نقاطك\n━━━━━━━━━━\n🔢 النقاط المستبدلة: {{points}}\n💰 القيمة: {{value}} ر.س\n⭐ الرصيد المتبقي: {{remaining}} نقطة\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق المكافآت | ASH HOLDING', '{points,value,remaining,date}', 'يرسل عند استبدال النقاط'),
('deposit_success', 'نجاح عملية الإيداع', 'financial', E'✅ تم الإيداع بنجاح\n━━━━━━━━━━\n💰 المبلغ: {{amount}} ر.س\n🎁 المكافأة: {{bonus}} ر.س\n💳 الإجمالي المضاف: {{total}} ر.س\n💳 الرصيد الحالي: {{balance}} ر.س\n📅 التاريخ: {{date}}\n━━━━━━━━━━\nفريق المالية | ASH HOLDING', '{amount,bonus,total,balance,date}', 'يرسل عند نجاح عملية الإيداع'),
('insufficient_balance', 'رصيد غير كافٍ', 'financial', E'⚠️ رصيد غير كافٍ\n━━━━━━━━━━\n💰 المبلغ المطلوب: {{required}} ر.س\n💳 الرصيد الحالي: {{balance}} ر.س\n📋 العملية: {{operation}}\n━━━━━━━━━━\nيرجى شحن رصيدك لإتمام العملية\nفريق المالية | ASH HOLDING', '{required,balance,operation}', 'يرسل عند محاولة عملية برصيد غير كافٍ'),
('welcome_message', 'رسالة ترحيب', 'auth', E'🎉 مرحباً بك في ASH HOLDING\n━━━━━━━━━━\n👋 أهلاً {{name}}\nتم إنشاء حسابك بنجاح\n🌐 ash-holding.sa\n━━━━━━━━━━\nفريق الدعم | ASH HOLDING', '{name}', 'يرسل عند تسجيل مستخدم جديد')
ON CONFLICT (template_key) DO NOTHING;
