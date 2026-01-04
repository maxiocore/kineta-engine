-- حذف السياسة العامة لجدول profiles واستبدالها بسياسة آمنة
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- سياسة جديدة: المستخدمون يمكنهم رؤية ملفاتهم الشخصية فقط
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- سياسة للمسؤولين لرؤية جميع الملفات الشخصية
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- حذف السياسة العامة لجدول admin_notifications
DROP POLICY IF EXISTS "Admin notifications are viewable by admins" ON public.admin_notifications;
DROP POLICY IF EXISTS "Anyone can view admin notifications" ON public.admin_notifications;

-- سياسة جديدة: فقط المسؤولون يمكنهم رؤية الإشعارات
CREATE POLICY "Only admins can view admin notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- سياسة للمسؤولين لإدارة الإشعارات
CREATE POLICY "Only admins can manage admin notifications" 
ON public.admin_notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);