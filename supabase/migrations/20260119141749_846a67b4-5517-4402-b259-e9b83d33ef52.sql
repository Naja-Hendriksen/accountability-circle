-- Create resources table for storing PDF metadata
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view resources
CREATE POLICY "Authenticated users can view resources"
ON public.resources
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can insert resources
CREATE POLICY "Admins can insert resources"
ON public.resources
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can delete resources
CREATE POLICY "Admins can delete resources"
ON public.resources
FOR DELETE
USING (is_admin(auth.uid()));

-- Only admins can update resources
CREATE POLICY "Admins can update resources"
ON public.resources
FOR UPDATE
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true);

-- Storage policies for resources bucket
CREATE POLICY "Authenticated users can view resources files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload resources"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resources' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete resources files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resources' AND is_admin(auth.uid()));