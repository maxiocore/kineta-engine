-- حذف جداول الاستضافة والدومين بالكامل

-- حذف الـ triggers أولاً
DROP TRIGGER IF EXISTS set_hosting_order_number ON public.hosting_orders;

-- حذف الـ functions
DROP FUNCTION IF EXISTS public.generate_hosting_order_number();

-- حذف الـ sequences
DROP SEQUENCE IF EXISTS hosting_order_number_seq;

-- حذف الجداول (بالترتيب الصحيح بسبب العلاقات)
DROP TABLE IF EXISTS public.hosting_operations_log CASCADE;
DROP TABLE IF EXISTS public.hosting_orders CASCADE;
DROP TABLE IF EXISTS public.hosting_products CASCADE;