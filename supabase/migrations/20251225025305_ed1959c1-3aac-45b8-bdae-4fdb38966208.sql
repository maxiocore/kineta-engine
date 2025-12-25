-- إضافة أعمدة عدد البدء والعدد المتبقي في جدول الطلبات
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS start_count integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remains integer DEFAULT NULL;