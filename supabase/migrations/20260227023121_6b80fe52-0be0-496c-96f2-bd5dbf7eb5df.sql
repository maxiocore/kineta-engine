
-- إضافة عمود طريقة الدفع لجدول الطلبات
ALTER TABLE public.orders 
ADD COLUMN payment_method TEXT DEFAULT 'balance';

-- تحديث الطلبات الملغاة لتكون بدون طريقة دفع واضحة
COMMENT ON COLUMN public.orders.payment_method IS 'طريقة الدفع: balance, paylink, tamara';
