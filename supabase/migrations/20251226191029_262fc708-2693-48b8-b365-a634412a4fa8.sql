
-- Create job_postings table for available positions
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  department TEXT NOT NULL,
  department_ar TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  location_ar TEXT NOT NULL DEFAULT 'عن بُعد',
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  description TEXT,
  description_ar TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  requirements_ar JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  benefits_ar JSONB DEFAULT '[]'::jsonb,
  salary_range TEXT,
  salary_range_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table for applicants
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  years_of_experience INTEGER,
  current_company TEXT,
  expected_salary TEXT,
  available_start_date DATE,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_postings
CREATE POLICY "Anyone can view active job postings" 
ON public.job_postings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage job postings" 
ON public.job_postings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for job_applications
CREATE POLICY "Anyone can insert job applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage job applications" 
ON public.job_applications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_job_postings_active ON public.job_postings(is_active);
CREATE INDEX idx_job_postings_department ON public.job_postings(department);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);

-- Add triggers for updated_at
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resumes
CREATE POLICY "Anyone can upload resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Admins can view resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete resumes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resumes' AND has_role(auth.uid(), 'admin'::app_role));
