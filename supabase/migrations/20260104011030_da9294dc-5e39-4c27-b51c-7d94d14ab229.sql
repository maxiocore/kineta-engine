-- Create dev_services table
CREATE TABLE public.dev_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  desc_ar TEXT,
  category TEXT NOT NULL DEFAULT 'web',
  base_price NUMERIC NOT NULL DEFAULT 0,
  eta_days_min INTEGER NOT NULL DEFAULT 1,
  eta_days_max INTEGER NOT NULL DEFAULT 7,
  icon TEXT DEFAULT 'Code',
  features JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '[]'::jsonb,
  deliverables JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_fast BOOLEAN NOT NULL DEFAULT false,
  has_guarantee BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dev_orders table
CREATE TABLE public.dev_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  service_id UUID REFERENCES public.dev_services(id),
  client_type TEXT NOT NULL DEFAULT 'individual' CHECK (client_type IN ('individual', 'company', 'organization')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_email_verification', 'under_review', 'need_info', 'accepted', 'in_progress', 'completed', 'rejected')),
  project_title TEXT,
  project_goal TEXT,
  project_summary TEXT,
  budget_range TEXT,
  timeline_expectation TEXT,
  requirements_json JSONB DEFAULT '{}'::jsonb,
  contact_email TEXT,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dev_order_events table for timeline and realtime
CREATE TABLE public.dev_order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.dev_orders(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL DEFAULT 'system' CHECK (actor_role IN ('user', 'admin', 'system')),
  actor_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'email_sent', 'email_verified', 'status_changed', 'message', 'file_uploaded', 'info_requested', 'info_provided')),
  payload JSONB DEFAULT '{}'::jsonb,
  message_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dev_order_files table
CREATE TABLE public.dev_order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.dev_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS dev_order_number_seq START 1;

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_dev_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_no := 'DEV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('dev_order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-generating order number
CREATE TRIGGER generate_dev_order_number_trigger
  BEFORE INSERT ON public.dev_orders
  FOR EACH ROW
  WHEN (NEW.order_no IS NULL OR NEW.order_no = '')
  EXECUTE FUNCTION public.generate_dev_order_number();

-- Function to update updated_at
CREATE TRIGGER update_dev_services_updated_at
  BEFORE UPDATE ON public.dev_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dev_orders_updated_at
  BEFORE UPDATE ON public.dev_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.dev_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_order_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dev_services
CREATE POLICY "Anyone can view active dev services"
  ON public.dev_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage dev services"
  ON public.dev_services FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dev_orders
CREATE POLICY "Users can view their own dev orders"
  ON public.dev_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create dev orders"
  ON public.dev_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft orders"
  ON public.dev_orders FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'need_info'));

CREATE POLICY "Admins can manage all dev orders"
  ON public.dev_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dev_order_events
CREATE POLICY "Users can view their order events"
  ON public.dev_order_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dev_orders
    WHERE dev_orders.id = dev_order_events.order_id
    AND dev_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can create events on their orders"
  ON public.dev_order_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.dev_orders
    WHERE dev_orders.id = order_id
    AND dev_orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all dev order events"
  ON public.dev_order_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dev_order_files
CREATE POLICY "Users can view their order files"
  ON public.dev_order_files FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.dev_orders
    WHERE dev_orders.id = dev_order_files.order_id
    AND dev_orders.user_id = auth.uid()
  ));

CREATE POLICY "Users can upload files to their orders"
  ON public.dev_order_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dev order files"
  ON public.dev_order_files FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dev_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dev_order_events;

-- Insert sample dev services
INSERT INTO public.dev_services (slug, title_ar, desc_ar, category, base_price, eta_days_min, eta_days_max, icon, is_featured, is_fast, features, requirements, deliverables, faqs) VALUES
('web-development', 'تطوير المواقع الإلكترونية', 'تصميم وتطوير مواقع ويب احترافية متجاوبة مع جميع الأجهزة', 'web', 2500, 7, 21, 'Globe', true, false, 
  '["تصميم متجاوب", "سرعة تحميل عالية", "SEO محسّن", "لوحة تحكم"]'::jsonb,
  '["وصف المشروع", "الشعار والهوية", "المحتوى النصي"]'::jsonb,
  '["موقع كامل", "كود المصدر", "دليل الاستخدام"]'::jsonb,
  '[{"q": "ما مدة التنفيذ؟", "a": "من 7 إلى 21 يوم حسب حجم المشروع"}, {"q": "هل يشمل الاستضافة؟", "a": "نعم، استضافة مجانية لمدة سنة"}]'::jsonb
),
('mobile-app', 'تطوير تطبيقات الجوال', 'تطبيقات iOS و Android بأحدث التقنيات', 'mobile', 5000, 14, 45, 'Smartphone', true, false,
  '["دعم iOS و Android", "تصميم UX/UI احترافي", "إشعارات Push", "تحديثات مجانية"]'::jsonb,
  '["فكرة التطبيق", "المتطلبات الوظيفية", "الفئة المستهدفة"]'::jsonb,
  '["تطبيق كامل", "رفع على المتاجر", "كود المصدر"]'::jsonb,
  '[{"q": "أي منصة أفضل؟", "a": "نوصي بـ React Native للتوافق مع المنصتين"}]'::jsonb
),
('backend-api', 'تطوير الواجهات الخلفية', 'APIs و Backend Systems بأعلى معايير الأمان', 'backend', 3000, 7, 30, 'Server', false, true,
  '["RESTful APIs", "GraphQL", "Authentication", "Database Design"]'::jsonb,
  '["متطلبات النظام", "مخطط البيانات", "التكاملات المطلوبة"]'::jsonb,
  '["API موثق", "كود المصدر", "وثائق التقنية"]'::jsonb,
  '[{"q": "ما التقنيات المستخدمة؟", "a": "Node.js، Python، أو حسب متطلباتك"}]'::jsonb
),
('database-design', 'تصميم قواعد البيانات', 'تصميم وتحسين قواعد بيانات فعّالة وآمنة', 'database', 1500, 3, 14, 'Database', false, true,
  '["تصميم Schema", "تحسين الأداء", "النسخ الاحتياطي", "الأمان"]'::jsonb,
  '["متطلبات البيانات", "حجم البيانات المتوقع", "استعلامات متكررة"]'::jsonb,
  '["مخطط قاعدة البيانات", "Scripts الإنشاء", "توثيق"]'::jsonb,
  '[{"q": "أي قاعدة بيانات؟", "a": "PostgreSQL، MySQL، MongoDB حسب الحاجة"}]'::jsonb
),
('system-integration', 'تكامل الأنظمة', 'ربط وتكامل الأنظمة المختلفة مع بعضها البعض', 'systems', 4000, 7, 30, 'Link', false, false,
  '["ربط APIs", "تزامن البيانات", "أتمتة العمليات", "تقارير"]'::jsonb,
  '["الأنظمة الحالية", "متطلبات التكامل", "سيناريوهات الاستخدام"]'::jsonb,
  '["نظام متكامل", "وثائق التكامل", "دعم فني"]'::jsonb,
  '[{"q": "هل يمكن ربط أي نظام؟", "a": "نعم، نتعامل مع معظم APIs"}]'::jsonb
),
('devops', 'خدمات DevOps', 'CI/CD، Docker، Kubernetes والبنية التحتية السحابية', 'devops', 3500, 5, 21, 'Cloud', true, true,
  '["CI/CD Pipelines", "Docker & K8s", "Cloud Setup", "Monitoring"]'::jsonb,
  '["البنية الحالية", "متطلبات النشر", "الميزانية"]'::jsonb,
  '["Pipeline جاهز", "بيئة إنتاج", "وثائق التشغيل"]'::jsonb,
  '[{"q": "أي سحابة تدعمون؟", "a": "AWS، GCP، Azure، DigitalOcean"}]'::jsonb
),
('ecommerce', 'متاجر إلكترونية', 'تطوير متاجر إلكترونية متكاملة مع بوابات الدفع', 'web', 4500, 14, 30, 'ShoppingCart', true, false,
  '["سلة تسوق", "بوابات دفع", "إدارة المنتجات", "تقارير المبيعات"]'::jsonb,
  '["نوع المنتجات", "بوابات الدفع", "متطلبات الشحن"]'::jsonb,
  '["متجر كامل", "لوحة تحكم", "تطبيق جوال اختياري"]'::jsonb,
  '[{"q": "هل يشمل بوابة دفع؟", "a": "نعم، مع PayPal، Stripe، مدى، تمارا"}]'::jsonb
),
('maintenance', 'الصيانة والدعم الفني', 'صيانة دورية ودعم فني مستمر لأنظمتك', 'systems', 500, 1, 1, 'Wrench', false, true,
  '["صيانة دورية", "دعم 24/7", "تحديثات أمنية", "نسخ احتياطي"]'::jsonb,
  '["نوع النظام", "حجم المشروع", "SLA المطلوب"]'::jsonb,
  '["تقارير شهرية", "دعم مستمر", "تحديثات"]'::jsonb,
  '[{"q": "ما ساعات الدعم؟", "a": "24/7 للباقات المتقدمة"}]'::jsonb
);

-- Create storage bucket for dev order files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dev-order-files', 'dev-order-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload dev order files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dev-order-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their dev order files"
ON storage.objects FOR SELECT
USING (bucket_id = 'dev-order-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all dev order files"
ON storage.objects FOR ALL
USING (bucket_id = 'dev-order-files' AND has_role(auth.uid(), 'admin'::app_role));