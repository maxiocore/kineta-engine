-- تحديث أوصاف منتجات الاستضافة بالعربي
UPDATE public.hosting_products SET 
  description_ar = 'سيرفر افتراضي مثالي للمواقع الصغيرة والتطبيقات البسيطة. يتضمن معالج واحد و1 جيجا رام مع تخزين SSD سريع.',
  description = 'Perfect virtual server for small websites and simple applications. Includes 1 vCPU and 1GB RAM with fast SSD storage.'
WHERE name = 'Basic Droplet 1GB';

UPDATE public.hosting_products SET 
  description_ar = 'سيرفر متوسط الأداء للمدونات والمتاجر الإلكترونية الصغيرة. موارد أكبر لتجربة أفضل.',
  description = 'Medium performance server for blogs and small e-commerce stores. More resources for better experience.'
WHERE name = 'Basic Droplet 2GB';

UPDATE public.hosting_products SET 
  description_ar = 'سيرفر قوي للتطبيقات المتوسطة والمواقع ذات الزيارات العالية. أداء ممتاز ومستقر.',
  description = 'Powerful server for medium applications and high-traffic websites. Excellent and stable performance.'
WHERE name = 'Basic Droplet 4GB';

UPDATE public.hosting_products SET 
  description_ar = 'سيرفر متميز للمشاريع الكبيرة والتطبيقات المعقدة. موارد مخصصة وأداء استثنائي.',
  description = 'Premium server for large projects and complex applications. Dedicated resources and exceptional performance.'
WHERE name = 'Premium Droplet 8GB';

UPDATE public.hosting_products SET 
  description_ar = 'قاعدة بيانات MySQL مُدارة بالكامل. نسخ احتياطي تلقائي وتحديثات أمنية مستمرة.',
  description = 'Fully managed MySQL database. Automatic backups and continuous security updates.'
WHERE name = 'MySQL 1GB';

UPDATE public.hosting_products SET 
  description_ar = 'قاعدة بيانات PostgreSQL متقدمة للتطبيقات الاحترافية. أداء عالي وموثوقية ممتازة.',
  description = 'Advanced PostgreSQL database for professional applications. High performance and excellent reliability.'
WHERE name = 'PostgreSQL 2GB';

UPDATE public.hosting_products SET 
  description_ar = 'قاعدة بيانات Redis سريعة للتخزين المؤقت والجلسات. سرعة فائقة في القراءة والكتابة.',
  description = 'Fast Redis database for caching and sessions. Ultra-fast read and write speeds.'
WHERE name = 'Redis 1GB';

UPDATE public.hosting_products SET 
  description_ar = 'تخزين سحابي آمن لملفاتك وصورك. متوافق مع S3 وسهل الاستخدام.',
  description = 'Secure cloud storage for your files and images. S3-compatible and easy to use.'
WHERE name = 'Spaces 250GB';

UPDATE public.hosting_products SET 
  description_ar = 'تخزين سحابي موسع للمشاريع الكبيرة. سعة أكبر ونقل بيانات أعلى.',
  description = 'Extended cloud storage for large projects. More capacity and higher data transfer.'
WHERE name = 'Spaces 500GB';

UPDATE public.hosting_products SET 
  description_ar = 'استضافة تطبيقات سهلة بدون إدارة سيرفرات. مثالية للمطورين والمشاريع الناشئة.',
  description = 'Easy app hosting without server management. Perfect for developers and startups.'
WHERE name = 'App Basic';

UPDATE public.hosting_products SET 
  description_ar = 'استضافة تطبيقات احترافية مع موارد أكبر. للتطبيقات المتوسطة والكبيرة.',
  description = 'Professional app hosting with more resources. For medium and large applications.'
WHERE name = 'App Professional';

UPDATE public.hosting_products SET 
  description_ar = 'موازن أحمال صغير لتوزيع الزيارات على عدة سيرفرات. يضمن استمرارية الخدمة.',
  description = 'Small load balancer to distribute traffic across multiple servers. Ensures service continuity.'
WHERE name = 'Load Balancer Small';

UPDATE public.hosting_products SET 
  description_ar = 'موازن أحمال متوسط للمواقع ذات الزيارات العالية. سعة أكبر وأداء أفضل.',
  description = 'Medium load balancer for high-traffic websites. More capacity and better performance.'
WHERE name = 'Load Balancer Medium';

UPDATE public.hosting_products SET 
  description_ar = 'كلاستر Kubernetes أساسي لتشغيل الحاويات. مثالي للتعلم والمشاريع الصغيرة.',
  description = 'Basic Kubernetes cluster for running containers. Perfect for learning and small projects.'
WHERE name = 'K8s Basic';

UPDATE public.hosting_products SET 
  description_ar = 'كلاستر Kubernetes قياسي مع 3 عقد للتوفر العالي. للتطبيقات الإنتاجية.',
  description = 'Standard Kubernetes cluster with 3 nodes for high availability. For production applications.'
WHERE name = 'K8s Standard';