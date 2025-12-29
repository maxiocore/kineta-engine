-- إضافة حقل القسم للتذاكر
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';

-- إضافة حقل رقم الطلب المرتبط
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- تحديث enum للأقسام في التعليق
COMMENT ON COLUMN public.support_tickets.category IS 'أقسام التذاكر: general (عام), orders (الطلبات), issues (المشاكل), financing (التمويل), payments (المدفوعات)';