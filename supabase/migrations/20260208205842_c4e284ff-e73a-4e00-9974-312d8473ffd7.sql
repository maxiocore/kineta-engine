
-- Create ready-made websites/templates table
CREATE TABLE public.ready_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'business',
  preview_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  technologies JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INT DEFAULT 0,
  delivery_days INT DEFAULT 3,
  sales_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ready_websites ENABLE ROW LEVEL SECURITY;

-- Everyone can view active websites
CREATE POLICY "Anyone can view active ready websites"
ON public.ready_websites
FOR SELECT
USING (is_active = true);

-- Admins can manage (using user_roles table)
CREATE POLICY "Admins can manage ready websites"
ON public.ready_websites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ready_websites;

-- Insert sample data
INSERT INTO public.ready_websites (title, title_ar, description_ar, category, price, original_price, features, technologies, is_featured, delivery_days, display_order) VALUES
('Business Landing Page', 'صفحة هبوط احترافية', 'صفحة هبوط متجاوبة وعصرية مصممة لتحويل الزوار إلى عملاء', 'landing', 499, 799, '["تصميم متجاوب", "سرعة تحميل عالية", "SEO محسّن", "نموذج تواصل", "ربط سوشيال ميديا"]'::jsonb, '["React", "Tailwind CSS", "Next.js"]'::jsonb, true, 3, 1),
('Corporate Website', 'موقع شركة متكامل', 'موقع احترافي متعدد الصفحات لعرض خدمات ومنتجات شركتك', 'corporate', 1499, 2499, '["متعدد الصفحات", "لوحة تحكم", "مدونة متكاملة", "نموذج توظيف", "خرائط جوجل", "متعدد اللغات"]'::jsonb, '["React", "Node.js", "PostgreSQL"]'::jsonb, true, 7, 2),
('E-Commerce Store', 'متجر إلكتروني جاهز', 'متجر إلكتروني متكامل مع نظام دفع وإدارة المنتجات', 'ecommerce', 2499, 3999, '["إدارة منتجات", "بوابة دفع", "سلة مشتريات", "لوحة تحكم", "إحصائيات مبيعات", "إشعارات فورية"]'::jsonb, '["React", "Stripe", "Supabase"]'::jsonb, true, 10, 3),
('Restaurant Website', 'موقع مطعم', 'موقع مطعم أنيق مع قائمة طعام رقمية ونظام حجوزات', 'restaurant', 799, 1299, '["قائمة طعام رقمية", "نظام حجوزات", "تصميم أنيق", "متجاوب للجوال", "ربط واتساب"]'::jsonb, '["React", "Tailwind CSS"]'::jsonb, false, 5, 4),
('Portfolio Website', 'موقع بورتفوليو', 'موقع معرض أعمال شخصي احترافي لعرض مشاريعك وإنجازاتك', 'portfolio', 399, 699, '["معرض أعمال", "نبذة شخصية", "نموذج تواصل", "تصميم عصري", "أنيميشن سلسة"]'::jsonb, '["React", "Framer Motion"]'::jsonb, false, 3, 5),
('Medical Clinic', 'موقع عيادة طبية', 'موقع عيادة أو مركز طبي مع نظام حجز مواعيد', 'medical', 1299, 1999, '["حجز مواعيد", "ملفات مرضى", "عرض الأطباء", "خدمات العيادة", "خريطة الموقع"]'::jsonb, '["React", "Node.js"]'::jsonb, false, 7, 6),
('Real Estate', 'موقع عقارات', 'منصة عقارية لعرض العقارات مع بحث متقدم وخرائط', 'realestate', 1999, 2999, '["بحث متقدم", "خرائط تفاعلية", "فلاتر ذكية", "معرض صور", "نموذج طلب"]'::jsonb, '["React", "Maps API", "PostgreSQL"]'::jsonb, true, 10, 7),
('Educational Platform', 'منصة تعليمية', 'منصة تعليمية مع نظام دورات ومتابعة تقدم الطلاب', 'education', 2999, 4999, '["نظام دورات", "فيديوهات تعليمية", "اختبارات", "شهادات", "لوحة تحكم طالب"]'::jsonb, '["React", "Node.js", "PostgreSQL"]'::jsonb, false, 14, 8);
