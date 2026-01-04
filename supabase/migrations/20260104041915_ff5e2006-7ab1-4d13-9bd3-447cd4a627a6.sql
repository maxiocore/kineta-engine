-- جدول منتجات الاستضافة (السيرفرات، قواعد البيانات، التخزين، إلخ)
CREATE TABLE public.hosting_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT NOT NULL CHECK (product_type IN ('droplet', 'database', 'spaces', 'app_platform', 'load_balancer', 'kubernetes', 'firewall')),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  do_price NUMERIC NOT NULL DEFAULT 0,
  our_price NUMERIC NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('hourly', 'monthly', 'yearly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول طلبات الاستضافة
CREATE TABLE public.hosting_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.hosting_products(id),
  product_type TEXT NOT NULL,
  
  -- معلومات DigitalOcean
  do_resource_id TEXT,
  do_resource_name TEXT,
  do_region TEXT,
  do_size TEXT,
  do_image TEXT,
  
  -- التكوين
  configuration JSONB DEFAULT '{}'::jsonb,
  
  -- الأسعار
  do_price NUMERIC NOT NULL DEFAULT 0,
  our_price NUMERIC NOT NULL DEFAULT 0,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'terminated', 'failed')),
  
  -- التواريخ
  provisioned_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تسلسل رقم الطلب
CREATE SEQUENCE IF NOT EXISTS hosting_order_number_seq START 1;

-- دالة توليد رقم الطلب
CREATE OR REPLACE FUNCTION public.generate_hosting_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'HOST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('hosting_order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- ربط التريجر
CREATE TRIGGER set_hosting_order_number
  BEFORE INSERT ON public.hosting_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_hosting_order_number();

-- جدول سجلات عمليات DigitalOcean
CREATE TABLE public.hosting_operations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.hosting_orders(id),
  operation_type TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.hosting_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosting_operations_log ENABLE ROW LEVEL SECURITY;

-- سياسات hosting_products
CREATE POLICY "Anyone can view active hosting products"
  ON public.hosting_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage hosting products"
  ON public.hosting_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- سياسات hosting_orders
CREATE POLICY "Users can view their own hosting orders"
  ON public.hosting_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create hosting orders"
  ON public.hosting_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all hosting orders"
  ON public.hosting_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- سياسات hosting_operations_log
CREATE POLICY "Users can view their order operations"
  ON public.hosting_operations_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.hosting_orders
    WHERE hosting_orders.id = hosting_operations_log.order_id
    AND hosting_orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all operations logs"
  ON public.hosting_operations_log FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- إدراج منتجات افتراضية
INSERT INTO public.hosting_products (product_type, name, name_ar, description, description_ar, specs, do_price, our_price, display_order) VALUES
-- Droplets (VPS)
('droplet', 'Basic Droplet 1GB', 'سيرفر أساسي 1GB', '1 vCPU, 1GB RAM, 25GB SSD, 1TB Transfer', '1 معالج، 1 جيجا رام، 25 جيجا SSD، 1 تيرا نقل', '{"vcpus": 1, "memory": 1024, "disk": 25, "transfer": 1000, "slug": "s-1vcpu-1gb"}', 6, 8, 1),
('droplet', 'Basic Droplet 2GB', 'سيرفر أساسي 2GB', '1 vCPU, 2GB RAM, 50GB SSD, 2TB Transfer', '1 معالج، 2 جيجا رام، 50 جيجا SSD، 2 تيرا نقل', '{"vcpus": 1, "memory": 2048, "disk": 50, "transfer": 2000, "slug": "s-1vcpu-2gb"}', 12, 15, 2),
('droplet', 'Basic Droplet 4GB', 'سيرفر أساسي 4GB', '2 vCPU, 4GB RAM, 80GB SSD, 4TB Transfer', '2 معالج، 4 جيجا رام، 80 جيجا SSD، 4 تيرا نقل', '{"vcpus": 2, "memory": 4096, "disk": 80, "transfer": 4000, "slug": "s-2vcpu-4gb"}', 24, 30, 3),
('droplet', 'Premium Droplet 8GB', 'سيرفر متميز 8GB', '4 vCPU, 8GB RAM, 160GB SSD, 5TB Transfer', '4 معالج، 8 جيجا رام، 160 جيجا SSD، 5 تيرا نقل', '{"vcpus": 4, "memory": 8192, "disk": 160, "transfer": 5000, "slug": "s-4vcpu-8gb"}', 48, 60, 4),

-- Managed Databases
('database', 'MySQL 1GB', 'قاعدة بيانات MySQL 1GB', 'MySQL 8, 1GB RAM, 10GB Storage', 'MySQL 8، 1 جيجا رام، 10 جيجا تخزين', '{"engine": "mysql", "version": "8", "size": "db-s-1vcpu-1gb", "storage": 10}', 15, 20, 1),
('database', 'PostgreSQL 2GB', 'قاعدة بيانات PostgreSQL 2GB', 'PostgreSQL 16, 2GB RAM, 25GB Storage', 'PostgreSQL 16، 2 جيجا رام، 25 جيجا تخزين', '{"engine": "pg", "version": "16", "size": "db-s-1vcpu-2gb", "storage": 25}', 30, 40, 2),
('database', 'Redis 1GB', 'قاعدة بيانات Redis 1GB', 'Redis 7, 1GB RAM, High Availability', 'Redis 7، 1 جيجا رام، توفر عالي', '{"engine": "redis", "version": "7", "size": "db-s-1vcpu-1gb"}', 15, 20, 3),

-- Spaces (Object Storage)
('spaces', 'Spaces 250GB', 'تخزين سحابي 250GB', '250GB Storage, 1TB Outbound Transfer', '250 جيجا تخزين، 1 تيرا نقل', '{"storage": 250, "transfer": 1000}', 5, 7, 1),
('spaces', 'Spaces 500GB', 'تخزين سحابي 500GB', '500GB Storage, 2TB Outbound Transfer', '500 جيجا تخزين، 2 تيرا نقل', '{"storage": 500, "transfer": 2000}', 10, 14, 2),

-- App Platform
('app_platform', 'App Basic', 'تطبيق أساسي', 'Basic App, 512MB RAM, 1 vCPU', 'تطبيق أساسي، 512 ميجا رام، 1 معالج', '{"ram": 512, "vcpu": 1}', 5, 7, 1),
('app_platform', 'App Professional', 'تطبيق احترافي', 'Pro App, 2GB RAM, 2 vCPU', 'تطبيق احترافي، 2 جيجا رام، 2 معالج', '{"ram": 2048, "vcpu": 2}', 24, 30, 2),

-- Load Balancers
('load_balancer', 'Load Balancer Small', 'موازن أحمال صغير', 'Small Load Balancer, 10k req/s', 'موازن أحمال صغير، 10 ألف طلب/ثانية', '{"size": "lb-small", "requests_per_second": 10000}', 12, 15, 1),
('load_balancer', 'Load Balancer Medium', 'موازن أحمال متوسط', 'Medium Load Balancer, 50k req/s', 'موازن أحمال متوسط، 50 ألف طلب/ثانية', '{"size": "lb-medium", "requests_per_second": 50000}', 24, 30, 2),

-- Kubernetes
('kubernetes', 'K8s Basic', 'Kubernetes أساسي', '1 Node, 2 vCPU, 4GB RAM', '1 عقدة، 2 معالج، 4 جيجا رام', '{"nodes": 1, "vcpus": 2, "memory": 4096}', 48, 60, 1),
('kubernetes', 'K8s Standard', 'Kubernetes قياسي', '3 Nodes, 2 vCPU, 4GB RAM each', '3 عقد، 2 معالج، 4 جيجا رام لكل عقدة', '{"nodes": 3, "vcpus": 2, "memory": 4096}', 144, 180, 2);

-- تريجر تحديث updated_at
CREATE TRIGGER update_hosting_products_updated_at
  BEFORE UPDATE ON public.hosting_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hosting_orders_updated_at
  BEFORE UPDATE ON public.hosting_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();