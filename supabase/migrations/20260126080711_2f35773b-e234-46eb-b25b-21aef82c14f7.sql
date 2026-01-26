-- إضافة أعمدة لتخصيص العقد
ALTER TABLE public.financing_applications 
ADD COLUMN IF NOT EXISTS contract_override_name TEXT,
ADD COLUMN IF NOT EXISTS contract_override_installments INTEGER;

-- إضافة تعليق للتوضيح
COMMENT ON COLUMN public.financing_applications.contract_override_name IS 'اسم العميل المعدل للعقد (إذا تم تعديله من الأدمن)';
COMMENT ON COLUMN public.financing_applications.contract_override_installments IS 'عدد الأقساط المعدل للعقد (إذا تم تعديله من الأدمن)';